# PLAN — Migrate ReadForge from Supabase to Firebase (Auth + Firestore)

_Round 2 revision — incorporates three rounds of Codex critique (see `PLAN-REVIEW-LOG.md`).
Approved at round 3._

## Status (2026-08-14)

| Step | State |
| --- | --- |
| 0. `npm install` | done |
| 1. Provision Firebase | project `readforge-app`, Firestore `(default)` nam5, web app — done. **Auth providers not yet enabled (console, user)**; **service-account key not yet generated (console, user)** |
| 1b. Middleware runtime question | **resolved** — Next 16 Proxy defaults to Node.js runtime |
| 2. Wire SDKs, rules | done; `firestore.rules` deployed |
| 3. Auth rewrite | done |
| 4. Data layer | done |
| 5. Consumers | done |
| 6. API routes | done |
| 7. Seed script | written, not yet run (needs the key + a first sign-in) |
| 8. Strip Supabase | done |
| 9. Verify | `tsc --noEmit` clean, `npm run build` green, lint unchanged from baseline. **Manual happy/negative path pending the two console steps** |
| 10. Docs | README rewritten as the living doc |

**Deviation from the plan, recorded:** the camelCase conversion was scoped to
user-owned Firestore documents only. `Article` in `src/types/index.ts` keeps its
snake_case shape — it is a feed/wire type shared by the RSS layer and the whole
reader UI, not a Supabase row, so renaming it would have churned the reader for
no benefit.

## Context

ReadForge is a Next.js 16 (App Router, React 19) app currently on Supabase for
auth (email/password + Google + Apple OAuth) and Postgres for data.

### Current Supabase surface (verified against the tree, 2026-08-14)

| File | Uses |
| --- | --- |
| `src/lib/supabase/client.ts` | browser client + SSR stub |
| `src/lib/supabase/server.ts` | cookie-backed server client |
| `src/proxy.ts` | middleware auth gate + redirects |
| `src/app/auth/callback/route.ts` | OAuth PKCE code exchange |
| `src/app/login/page.tsx` | signInWithPassword, signInWithOAuth |
| `src/app/signup/page.tsx` | signUp, signInWithOAuth |
| `src/app/onboarding/page.tsx` | getUser, update profiles, insert wpm_tests |
| `src/app/dashboard/page.tsx` | server reads: profiles, wpm_tests, cars_sessions, grammar_progress |
| `src/app/library/page.tsx` | server reads: profiles, bookmarks |
| `src/app/speed/page.tsx` | server read: profiles |
| `src/app/profile/page.tsx` | server read: profiles |
| `src/components/reader/LibraryClient.tsx` | user_documents read, profiles update, bookmarks upsert/delete, reading_sessions insert |
| `src/components/profile/ProfileClient.tsx` | profiles updates (name, readwise_token, goodreads_user_id) |
| `src/components/speed/RSVPTrainer.tsx` | wpm_tests insert, profiles update |
| `src/components/layout/Sidebar.tsx` | signOut |
| `src/app/api/upload/route.ts` | auth check + user_documents insert |

### Live database state (queried 2026-08-14, project `viakcdmwnauefslozqrh`)

Tables: profiles, articles, wpm_tests, reading_sessions, quiz_responses,
grammar_progress, cars_sessions, skill_scores, bookmarks, user_documents.

`supabase/migrations/001_initial.sql` is **stale** — it is missing `bookmarks`,
`user_documents`, and `profiles.interests / readwise_token / goodreads_user_id`,
all of which the live DB and the code have.

Row counts: auth.users 1, profiles 1, wpm_tests 3, bookmarks 1, everything else 0.
The single user is a **Google OAuth** account (`louisvmaxwell@gmail.com`) — no
password hash to import.

The checkout currently has **no `node_modules`** — `npm install` is a prerequisite
for both the build verification and the Next-docs check in step 1.

## Decisions (locked by the user)

1. **Auth**: Firebase Auth + Admin-SDK-minted httpOnly **session cookies**, so
   server components and route handlers keep doing authoritative server-side auth.
2. **Data**: migrate the existing rows (trivial volume — a one-shot seed script).
3. **Project**: create a new Firebase project for ReadForge.

## Target design

### Firestore data model

Per-user subcollections mirror the old RLS boundary (`auth.uid() = user_id`),
so rules stay one block per collection.

```
users/{uid}                          -- profile doc (client-readable/writable, validated)
                                     -- includes goodreadsUserId: a public profile identifier, not a credential
users/{uid}/private/integrations     -- readwiseToken ONLY: server-only, rules deny all client access
users/{uid}/wpmTests/{autoId}
users/{uid}/readingSessions/{autoId}
users/{uid}/quizResponses/{autoId}
users/{uid}/grammarProgress/{encodedId}   -- encodeDocId(moduleId, lessonId); replaces UNIQUE(user,module,lesson)
users/{uid}/carsSessions/{autoId}
users/{uid}/skillScores/{encodedId}       -- encodeDocId(questionType); replaces UNIQUE(user,question_type)
users/{uid}/bookmarks/{articleId}         -- deterministic id: upsert -> set(), unbookmark -> delete()
users/{uid}/documents/{autoId}
articles/{articleId}                      -- public read cache, server-only write
```

**Doc-ID encoder** (`src/lib/db/ids.ts`): Firestore IDs may not be `.` or `..`,
may not contain `/`, and may not exceed 1500 bytes. `encodeDocId(...parts)`
lowercases each part, replaces every character outside `[a-z0-9_-]` with `-`,
joins with `__`, and **always** appends `sha256(JSON.stringify(parts)).slice(0,12)`.
The hash is unconditional precisely so that `encodeDocId("a__b")` and
`encodeDocId("a","b")` cannot collide — the readable prefix is a convenience,
the hash is the identity.

**Deterministic article IDs**: `src/lib/rss.ts` currently assigns `id: nanoid()`
on every fetch, so the same article gets a new ID each refresh and bookmark /
cache keys never line up. Replace with

```
articleId = sha256(
  sourceUrl-is-a-valid-absolute-URL
    ? "url:" + canonicalize(sourceUrl)      // strip fragment, utm_* params, trailing slash
    : "feed:" + source + "|" + title + "|" + publishedAt
).slice(0, 20)
```

The fallback branch matters: feed items with a missing or unparseable
`source_url` would otherwise all hash to the same document and overwrite each
other. This makes `articles/{id}` a real cache and `bookmarks/{articleId}`
genuinely idempotent.

Field names move from `snake_case` to `camelCase`. Conversion is confined to a
typed data layer (`src/lib/db/*.ts`); consuming components get their prop types
updated in the same change.

`timestamptz` becomes Firestore `Timestamp`. **Server components must serialize
Timestamps to ISO strings before passing props to client components** — raw
Timestamp objects are not serializable across the RSC boundary. The data layer
returns plain JSON-safe objects for exactly this reason.

### Security rules

Field/type validation is spelled out for the two documents that carry the
headline stats — the profile doc and `wpmTests`. Every other subcollection gets
owner-only access with **no** field validation; that is stated plainly here
rather than implied, and is logged as accepted parity risk below.

```
function isOwner(uid) { return request.auth != null && request.auth.uid == uid; }

function profileValid() {
  return request.resource.data.keys().hasOnly([
           'email','fullName','avatarUrl','baselineWpm','currentWpm','readingLevel',
           'streakDays','lastActive','totalWordsRead','articlesRead',
           'onboardingComplete','interests','goodreadsUserId','createdAt','updatedAt'])
      && request.resource.data.baselineWpm is int
      && request.resource.data.currentWpm is int
      && request.resource.data.interests is list
      // audit fields are server-owned: the client data layer never sends them,
      // and a create must stamp createdAt with request.time if present at all
      && (!('createdAt' in request.resource.data.keys())
          || request.resource.data.createdAt == request.time)
      && (!('updatedAt' in request.resource.data.keys())
          || request.resource.data.updatedAt == request.time);
}

function wpmValid() {
  return request.resource.data.keys().hasOnly(
           ['wpm','comprehensionScore','articleId','mode','testedAt'])
      && request.resource.data.wpm is int
      && request.resource.data.wpm > 0 && request.resource.data.wpm < 5000
      && request.resource.data.mode in ['normal','rsvp','focus'];
}

match /users/{uid} {
  allow read: if isOwner(uid);
  allow create, update: if isOwner(uid) && profileValid();

  match /private/{doc}   { allow read, write: if false; }   // Admin SDK only
  match /wpmTests/{id}        { allow read: if isOwner(uid);
                                allow write: if isOwner(uid) && wpmValid(); }
  match /readingSessions/{id} { allow read, write: if isOwner(uid); }
  match /quizResponses/{id}   { allow read, write: if isOwner(uid); }
  match /grammarProgress/{id} { allow read, write: if isOwner(uid); }
  match /carsSessions/{id}    { allow read, write: if isOwner(uid); }
  match /skillScores/{id}     { allow read, write: if isOwner(uid); }
  match /bookmarks/{id}       { allow read, write: if isOwner(uid); }
  match /documents/{id}       { allow read: if isOwner(uid); allow write: if false; } // uploads go through /api/upload
}
match /articles/{id} { allow read: if true; allow write: if false; }
```

Admin SDK bypasses rules, so server writes (article cache, uploads, integrations)
still work.

**Accepted risk (parity, not regression):** a user can still write plausible-but-
false stats to their own documents — bounded values in the two validated
collections, arbitrary shapes in `readingSessions`, `quizResponses`,
`grammarProgress`, `carsSessions`, `skillScores`, and `bookmarks`. Today's
Supabase RLS (`using (auth.uid() = user_id)`, no column checks) permits
precisely the same thing, and the only party being fooled is the user themself.
Server-mediated stat writes are a separate hardening ticket, not part of this
migration.

### Auth flow

- `src/lib/firebase/client.ts` — `initializeApp` + `getAuth` + `getFirestore`, singleton.
- `src/lib/firebase/admin.ts` — Admin app from `FIREBASE_SERVICE_ACCOUNT_KEY`
  (base64-encoded service-account JSON), exporting `adminAuth()` / `adminDb()`.
- **Login** (`/login`): `signInWithEmailAndPassword`, plus a "forgot password"
  link calling `sendPasswordResetEmail`.
- **Signup** (`/signup`): `createUserWithEmailAndPassword` →
  `updateProfile({ displayName: name })` → session POST → route to `/onboarding`.
- **OAuth** (both pages): `signInWithPopup(GoogleAuthProvider)` /
  `signInWithPopup(new OAuthProvider("apple.com"))`, with automatic fallback to
  `signInWithRedirect` when the popup is blocked or unsupported
  (`auth/popup-blocked`, `auth/operation-not-supported-in-this-environment`,
  mobile Safari + Apple). A shared `useRedirectResult()` hook calls
  `getRedirectResult` on mount and completes the same session POST. No server
  callback route is required for either path.
- `POST /api/auth/session`: `adminAuth().verifyIdToken` then `createSessionCookie`
  (14 days) → set cookie `__session`, httpOnly, secure in prod, sameSite lax, path `/`.
  Also creates the `users/{uid}` profile doc if absent (replaces the Postgres
  `handle_new_user` trigger), using `set(..., { merge: true })`.
- `DELETE /api/auth/session`: clear cookie. Sidebar calls it, then client `signOut()`.
- `src/lib/firebase/session.ts`: `getSessionUser()` reads `__session` and calls
  `verifySessionCookie(cookie, true)`; returns `null` on failure.
- `src/proxy.ts` — **RESOLVED 2026-08-14** against
  `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`:
  Next 16 renamed Middleware to **Proxy**, and *"Proxy defaults to using the
  Node.js runtime. The `runtime` config option is not available in Proxy files.
  Setting the `runtime` config option in Proxy will throw an error."*
  So `firebase-admin` is available in `src/proxy.ts` and the proxy does
  **authoritative** `verifySessionCookie` — the presence-only fallback is not
  needed and is dropped from the plan.
  Nuance: the proxy calls `verifySessionCookie(cookie, false)` (signature and
  expiry only, no network round-trip per request); server components and route
  handlers that read user data call it with `checkRevoked = true`. Note also
  that `export const config = { matcher: [...] }` and the `runtime` export are
  different things — the matcher stays.
- `src/app/auth/callback/route.ts` is **deleted** — neither popup nor redirect
  OAuth needs a server callback with the Firebase Web SDK.

### API route auth

`getSessionUser()` gates all seven data/LLM routes: `/api/upload`,
`/api/analyze`, `/api/questions`, `/api/cars`, `/api/readwise`,
`/api/goodreads`, `/api/articles`, and `/api/integrations/readwise`.
`/api/articles` is included because the
migration gives it Admin writes to the `articles/{id}` cache plus outbound RSS
fetches — anonymous access would be a Firestore-write and bandwidth cost vector.

`/api/readwise` stops accepting `?token=` entirely: it loads the token from
`users/{uid}/private/integrations` via the Admin SDK, so the Readwise API key
never reaches the browser, a URL, or an access log.

**Integration routes** (new): `POST /api/integrations/readwise` validates a
submitted token against the Readwise API and stores it in the private doc;
`DELETE` removes it. `ProfileClient` and `LibraryClient` receive only
`readwiseConnected: boolean` — never the token. Goodreads needs no such route:
a Goodreads user ID is a public profile identifier rather than a credential, so
it stays on the profile doc and `/api/goodreads` keeps its existing `?userId=`
contract.

### Env vars

Add: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`,
`NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`,
`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`,
`FIREBASE_SERVICE_ACCOUNT_KEY`.
Remove: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
Both `.env.local` and the Vercel project environment need updating.

## Build order

0. **`npm install`** — the checkout has no `node_modules`; nothing below can be
   verified without it.
1. **Provision** — create the Firebase project, enable Auth providers
   (email/password, Google, Apple), create Firestore in native mode, generate a
   service-account key. Requires an interactive `firebase login` by the user.
   Also read `node_modules/next/dist/docs/` to settle the middleware runtime
   question before step 3. If that docs path does not exist after `npm install`,
   the middleware-runtime branch is **blocked, not guessed**: settle it from the
   installed Next source or version-matched official docs, and default to the
   presence-only middleware if it cannot be settled.
2. **Wire** — add `firebase` + `firebase-admin` deps; write
   `src/lib/firebase/{client,admin,session}.ts` and `src/lib/db/ids.ts`; add
   `firestore.rules`, `firestore.indexes.json`, `firebase.json`; deploy rules.
3. **Auth** — `/api/auth/session` route; rewrite login (incl. password reset),
   signup, OAuth popup+redirect fallback, Sidebar sign-out; rewrite
   `src/proxy.ts`; delete `src/app/auth/callback/route.ts`.
4. **Data layer** — `src/lib/db/` typed repositories (profiles, integrations,
   wpmTests, bookmarks, documents, readingSessions, carsSessions,
   grammarProgress, skillScores), server (Admin) and client (Web SDK) variants
   where each is needed.
5. **Consumers** — rewrite against the data layer, updating prop types for
   camelCase + ISO strings:
   - server: `dashboard/page.tsx`, `library/page.tsx`, `speed/page.tsx`, `profile/page.tsx`
   - client: `onboarding/page.tsx`, `LibraryClient.tsx`, `ProfileClient.tsx`, `RSVPTrainer.tsx`, `DashboardClient.tsx` (props only)
6. **API routes** — session-cookie auth on all seven routes above; new
   `POST/DELETE /api/integrations/readwise`; `/api/upload` writes to
   `users/{uid}/documents` via Admin; `/api/readwise` reads its token from the
   private integrations doc; `src/lib/rss.ts` switches to deterministic article
   IDs and `/api/articles` upserts the `articles/{id}` cache with them.
7. **Seed** — `scripts/seed-from-supabase.mjs` takes the captured JSON dump plus
   a `--uid` (the new Firebase uid, obtained after the user signs in with Google
   once) and writes profile + 3 wpmTests + 1 bookmark + the integrations doc.
   Writes use `set(..., { merge: true })` with an explicit precedence rule:
   **identity fields** (`email`, `fullName`, `avatarUrl`) that Firebase Auth
   already populated win; **training fields** (`baselineWpm`, `currentWpm`,
   `readingLevel`, `interests`, `onboardingComplete`, counters) come from the
   seed and overwrite the freshly-created defaults. Subcollection writes use the
   old Postgres UUID as the doc ID so a re-run is idempotent. The dump contains a
   live Readwise API token, so it stays **outside the repo** (scratchpad) and is
   never committed.
8. **Strip Supabase** — remove `@supabase/*` deps, `src/lib/supabase/`, and move
   `supabase/migrations/001_initial.sql` to `docs/legacy/` labelled historical.
9. **Verify** — `npm run build` + `npm run lint` clean, plus:
   - *Happy path*: email signup, email login, password reset email, Google login,
     onboarding write, dashboard read, bookmark toggle (twice — confirm the
     second click deletes), RSVP save, profile update, PDF upload, sign-out.
   - *Negative path*: (a) logged-out request to `/dashboard` redirects to `/login`;
     (b) a forged/garbage `__session` cookie yields a redirect, never data;
     (c) a client write to another uid's document is rejected by rules;
     (d) a client write to `users/{uid}/private/integrations` is rejected;
     (e) unauthenticated calls to **all seven** gated routes — `/api/upload`,
     `/api/analyze`, `/api/questions`, `/api/cars`, `/api/readwise`,
     `/api/goodreads`, `/api/articles`, `/api/integrations/readwise` — return 401;
     (f) the Readwise token appears in no client prop, no network URL, and no
     RSC payload (grep the rendered HTML and the devtools network log);
     (g) `firestore.rules` is confirmed deployed, not just written locally.
   - Emulator-based rules unit tests are optional; add them only if the rules
     grow beyond the block above.
10. **Docs** — update `README.md` (living-doc rule) in the same commit: stack,
    env vars, data model, auth flow, and the follow-up ticket list below.

## Risks / open questions

- **Middleware runtime**: if Node runtime is unavailable for middleware, redirect
  gating is presence-only. Accepted; server-side verification is authoritative.
- **Apple sign-in** needs an Apple Developer configuration in Firebase console;
  if that is not set up, the Apple button ships disabled rather than broken.
- **Old Supabase project** stays untouched until the Firebase app is verified
  working; teardown is a separate, explicit step.
- **Session cookie name** `__session` is required for any future Firebase Hosting
  CDN compatibility and is harmless on Vercel.

## Out of scope (logged as follow-up tickets)

- **SSRF hardening of `/api/fetch-article`** — it accepts arbitrary URLs today.
  A real pre-existing bug, but orthogonal to the storage backend; folding it in
  would blur the migration diff.
- **Rate limiting** on the LLM routes — pre-existing gap, unchanged by this work.
- **Server-mediated stat writes** — see the accepted-risk note under rules.
- **Supabase project teardown** — only after the Firebase build is verified live.
