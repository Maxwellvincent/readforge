# ReadForge

> **Living document.** This describes what IS built, not what was planned. Any
> change to the stack, data model, API routes, screen inventory, or env vars
> updates this file in the same commit as the code.
>
> Last verified against the tree: 2026-08-15 (production deploy verified)

Reading-training app: RSVP speed drills, Cambridge-method article reading, MCAT
CARS practice, and grammar modules, with a library that pulls from RSS,
Project Gutenberg, Open Library, Goodreads shelves, Readwise, and your own
uploads.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, React 19) |
| Styling | Tailwind CSS 4, shadcn-style primitives, Radix |
| Auth | Firebase Auth (email/password, Google, Apple) + Admin-minted session cookies |
| Admin SDK | `firebase-admin` pinned to **v13** — see the note below |
| Database | Cloud Firestore (project `readforge-app`, `(default)` database, nam5) |
| LLM | llm-bridge first, Anthropic SDK fallback (`src/lib/claude.ts`) |
| Charts | Recharts |
| Hosting | Vercel |

Migrated off Supabase/Postgres on 2026-08-14. The final Supabase migration is
archived at `docs/legacy/supabase-001_initial.sql` as historical reference; it
is not the live schema and was already stale when it was retired.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in the values below
npm run dev
```

### Environment variables

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Web app config — public by design, guarded by Firestore rules |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `readforge-app.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `readforge-app` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `readforge-app.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | numeric sender id |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | web app id |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | **Secret.** Service-account JSON, raw or base64. Server-only |
| `ANTHROPIC_API_KEY` | **Secret.** Claude fallback when llm-bridge is unreachable — required in production |
| `LLM_BRIDGE_URL` | Optional, defaults to `http://127.0.0.1:4319` |
| `LLM_BRIDGE` | Set to `off` to skip the bridge entirely |

Regenerate the web config any time with:

```bash
firebase apps:sdkconfig WEB --project readforge-app
```

## Auth flow

1. The browser signs in with the Firebase Web SDK — `signInWithEmailAndPassword`,
   `createUserWithEmailAndPassword`, or `signInWithPopup` for Google/Apple with an
   automatic `signInWithRedirect` fallback where popups are blocked.
2. It POSTs the resulting ID token to `/api/auth/session`.
3. The Admin SDK verifies the token and mints a 14-day **session cookie**
   (`__session`, httpOnly, sameSite lax, secure in production), and creates the
   `users/{uid}` profile document if it does not exist — this replaces the old
   Postgres `handle_new_user` trigger.
4. `src/proxy.ts` checks only whether a session cookie is **present**, and uses
   that for redirects. It deliberately does not import `firebase-admin`: doing so
   pulls the package into the middleware bundle, where `jwks-rsa` (CommonJS)
   `require()`s the ESM-only `jose` and every request 500s on Vercel. The cookie
   constants therefore live in `src/lib/firebase/cookie.ts`, which has no
   dependencies, and `session.ts` re-exports them.
5. Authority lives with the data: every server component and route handler calls
   `getSessionUser()`, which runs the real `verifySessionCookie` in a normal
   serverless function. A forged cookie gets past the proxy and is then bounced
   by the page's own check — verified in production, it redirects to `/login`
   and yields no data.
6. Sign-out DELETEs `/api/auth/session` and calls the client `signOut()`.

There is no `/auth/callback` route — neither popup nor redirect OAuth needs one
with the Firebase Web SDK.

### firebase-admin is pinned to v13 on purpose

`firebase-admin@14` depends on `jwks-rsa@4`, which depends on `jose@6` — and
`jose@6` is ESM-only while `jwks-rsa` is CommonJS. Next externalizes
`firebase-admin` by default, so it loads through native `require()`, and the
whole app 500s in production with `ERR_REQUIRE_ESM` (it works fine in `next dev`,
which is what makes it a nasty one). `firebase-admin@13` pulls `jwks-rsa@3` →
`jose@4`, which ships CommonJS. Do not bump to 14 until that chain is ESM-clean.

## Data model

```
users/{uid}                            profile: wpm, level, streak, interests, goodreadsUserId
users/{uid}/private/integrations       readwiseToken — server-only, rules deny all client access
users/{uid}/wpmTests/{autoId}          wpm, comprehensionScore, mode, testedAt
users/{uid}/readingSessions/{autoId}
users/{uid}/quizResponses/{autoId}
users/{uid}/grammarProgress/{encodedId}
users/{uid}/carsSessions/{autoId}
users/{uid}/skillScores/{encodedId}
users/{uid}/bookmarks/{articleId}      articleData snapshot; deterministic id = idempotent toggle
users/{uid}/documents/{autoId}         uploads, written server-side by /api/upload
articles/{articleId}                   public read cache, server-only write
```

- User documents use **camelCase**; timestamps are stored as Firestore
  `Timestamp` and converted to **ISO strings** by the data layer before crossing
  the RSC boundary (raw Timestamps are not serializable as props).
- The `Article` type in `src/types/index.ts` deliberately keeps snake_case: it is
  a feed/wire shape shared with the reader and RSS layers, not a database row.
- **Article IDs are deterministic**: `sha256` of the canonical source URL, with a
  `source|title|publishedAt` fallback for feed items that have no usable URL.
  They used to be a fresh `nanoid()` per fetch, which meant bookmark keys never
  matched a refetched article.
- Document IDs derived from app strings go through `encodeDocId()`
  (`src/lib/db/ids.ts`), which always appends a hash so `("a__b")` and
  `("a","b")` cannot collide.

Rules live in `firestore.rules`; deploy with
`firebase deploy --only firestore:rules`. The profile and `wpmTests` documents
have field allowlists and type checks; the remaining subcollections are
owner-only without field validation — a deliberate parity choice, since the old
Supabase RLS allowed the same and the only person a forged WPM fools is you.

### Data layer

- `src/lib/db/server.ts` — Admin SDK reads/writes for server components and
  route handlers. Importing it from a client component will fail the build.
- `src/lib/db/client.ts` — Web SDK writes from client components, subject to rules.
- `src/lib/db/types.ts` — the shared shapes.

## API routes

All of these require a valid session cookie and return 401 without one:
`/api/upload`, `/api/analyze`, `/api/questions`, `/api/cars`, `/api/readwise`,
`/api/goodreads`, `/api/articles`, `/api/integrations/readwise`.

`/api/auth/session` (POST/DELETE) is the session endpoint itself.
`/api/fetch-article`, `/api/gutenberg`, and `/api/openlibrary` remain
unauthenticated.

**Readwise**: the token is never sent to or held by the browser. `POST
/api/integrations/readwise` validates it against Readwise and stores it in
`users/{uid}/private/integrations`; `/api/readwise` reads it back by session uid.
The UI only ever receives a `readwiseConnected` boolean. Goodreads is different
on purpose — a Goodreads user ID is a public profile identifier, not a
credential, so it stays on the profile document.

## LLM calls

`src/lib/claude.ts` routes every completion through one `complete()` helper that
tries the local **llm-bridge** first and falls back to the Anthropic API.

The bridge (`~/projects/llm-bridge`, loopback port 4319) proxies to the Claude
Code / Codex / Gemini CLIs already covered by subscription, plus ollama offline —
so local calls cost nothing. It is reachable only on a machine running it: on
Vercel the probe fails in ~1.2s and the API path takes over, which is why
`ANTHROPIC_API_KEY` still has to be set in production.

The probe result is cached — 30s on success, 3s on failure — so a working bridge
costs no extra round-trip per call, and a bridge that blips mid-generation is not
blackballed for long. `src/lib/llmBridge.ts` returning `null` means "use the
cloud path"; it is never an error.

If neither is available, `complete()` throws a named error rather than failing
somewhere deeper with an opaque SDK message.

## Screens

`/` landing · `/login` · `/signup` · `/onboarding` baseline assessment ·
`/dashboard` · `/library` + `/library/[id]` reader · `/speed` RSVP trainer ·
`/grammar` · `/cars` + `/cars/session` · `/profile`

## Scripts

- `npm run dev` / `npm run build` / `npm run start` / `npm run lint`
- `scripts/seed-from-supabase.mjs` — one-shot import of the pre-migration rows.
  Sign in once with the same Google account, then:
  ```bash
  FIREBASE_SERVICE_ACCOUNT_KEY=... node scripts/seed-from-supabase.mjs \
    --dump /path/to/supabase-dump.json --uid <firebaseUid>
  ```
  Identity fields already set by Firebase Auth win; training fields come from the
  dump; subcollection docs reuse the old UUIDs so re-runs are idempotent. The
  dump holds a live Readwise token — keep it out of the repo.

## Known follow-ups

- `/api/fetch-article` accepts arbitrary URLs — an SSRF surface, pre-dating the
  migration.
- No rate limiting on the Claude-backed routes.
- Stat writes are client-side; moving aggregates server-side would close the
  self-forgery gap described above.
- Apple sign-in needs an Apple Developer configuration in the Firebase console
  before that button does anything.
