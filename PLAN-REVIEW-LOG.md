# Plan Review Log: Supabase → Firebase (Auth + Firestore) migration

Started at session start on 2026-08-14. MAX_ROUNDS=5. Codex CLI 0.128.0, model = CLI default.

## Round 1 — Codex

**Findings**

- `PLAN.md` depends on `node_modules/next/dist/docs/`, but this checkout has no `node_modules` at all, so the middleware/runtime decision cannot be verified as written. Fix: add an explicit `npm ci`/docs verification step before any `src/proxy.ts` rewrite.
- The plan omits `src/app/onboarding/page.tsx` from the consumer rewrite, despite it still doing client Supabase auth/profile/wpm writes. Fix: include onboarding in the Firebase auth/data rewrite and verification matrix.
- Signup flow only lists sign-in methods; email/password signup currently uses `signUp`, and Firebase needs `createUserWithEmailAndPassword` plus profile/session creation. Fix: specify separate signup, login, password-reset, and optional email-verification flows.
- Deleting `src/app/auth/callback/route.ts` assumes popup OAuth is sufficient; Apple and mobile browsers commonly need redirect flows or block popups. Fix: keep a redirect-compatible OAuth callback/session-establishment path.
- Firestore rules allow users to write every field under `users/{uid}` and all subcollections, which lets clients forge stats like WPM, streaks, articles read, skill scores, and arbitrary timestamps. Fix: add field allowlists/type validation in rules and move aggregate/stat writes to server routes or Cloud Functions.
- `readwiseToken` remains client-readable and is sent in `/api/readwise?token=...`, which leaks a long-lived API token into browser state, URLs, logs, and analytics. Fix: store it in a server-only document/path and proxy Readwise calls through authenticated server routes without query-string secrets.
- The plan only auth-rewrites `/api/upload`; expensive or sensitive routes like `/api/questions`, `/api/analyze`, `/api/cars` POST, and `/api/fetch-article` remain unauthenticated and unrate-limited. Fix: require session-cookie auth and add basic rate limits to all LLM/external-fetch routes.
- `/api/fetch-article` currently accepts arbitrary URLs, so after Firebase migration it would still be an SSRF primitive against private/internal hosts. Fix: validate protocol, resolve and block private/link-local IPs, and optionally allowlist known article domains.
- `articles/{articleId}` is described as a public cache, but current RSS article IDs are random `nanoid()` per request in `src/lib/rss.ts`; bookmark IDs and reading sessions will not be stable. Fix: define deterministic article IDs from canonical source URL/hash and rewrite `/api/articles` to upsert/read that cache consistently.
- The one-shot seed plan says `--uid` after first Google sign-in, but does not say how profile creation conflicts are merged with seeded profile fields. Fix: make seeding use merge semantics with a deterministic precedence rule for existing Firebase profile fields.
- Firestore document IDs like `grammarProgress/{moduleId__lessonId}` and `skillScores/{questionType}` are derived from app data without an escaping rule. Fix: define an ID encoder or use nested fields/doc IDs that cannot collide with separators or invalid path characters.
- Verification lacks security/regression checks for forged cookies, cross-user Firestore writes, unauthenticated API calls, and rules deployment. Fix: add emulator/rules tests plus manual negative tests before Supabase removal.

`VERDICT: REVISE`

### Claude's response

**Accepted and folded into the plan:**

1. `npm install` as an explicit step 0 before the middleware-runtime decision — verified: this checkout genuinely has no `node_modules`.
2. `src/app/onboarding/page.tsx` named explicitly in the consumer rewrite list and in the verification matrix.
3. Signup spelled out: `createUserWithEmailAndPassword` + `updateProfile({ displayName })` + session POST, plus a password-reset path (`sendPasswordResetEmail`).
4. OAuth keeps a redirect-capable path: `signInWithPopup` with automatic fallback to `signInWithRedirect` + `getRedirectResult` on popup-blocked / Apple-on-mobile. No server callback route is needed for either — `getRedirectResult` runs client-side and then POSTs the ID token — so `auth/callback` still goes, but the redirect flow is covered.
5. Rules get per-collection field/type validation (allowlisted keys, correct types, no `..`-style path abuse).
6. `readwiseToken` moves to a server-only doc (`users/{uid}/private/integrations`), rules deny all client access, and `/api/readwise` reads it from Firestore by session uid instead of accepting `?token=`. This kills the query-string leak.
7. Session-cookie auth added to the LLM/data routes (`/api/analyze`, `/api/questions`, `/api/cars`, `/api/readwise`, `/api/goodreads`, `/api/upload`).
8. Deterministic article IDs — `sha256(canonicalSourceUrl)` truncated, replacing `nanoid()` in `src/lib/rss.ts`, so bookmark doc IDs and article-cache keys are stable across refetches.
9. Seed script uses `set(..., { merge: true })` with an explicit precedence rule.
10. Doc-ID encoder for `grammarProgress` / `skillScores` ids.
11. Verification matrix gains negative security tests (forged cookie, cross-user write, unauthenticated route call, rules deployed).

**Rejected, with reasons:**

- *"Move aggregate/stat writes to server routes or Cloud Functions."* Rejected as scope creep. Today's Supabase RLS (`using (auth.uid() = user_id)` with no column checks) permits exactly the same forging, so client-side stat writes are parity, not a regression. This is a single-user personal training app where the only party who could forge their own WPM is the user themself. Rules-level type validation (accepted above) is the proportionate mitigation; server-mediated stats is a separate hardening ticket.
- *Rate limiting on LLM routes.* Pre-existing gap, unrelated to the storage backend, and Vercel already fronts these. Logged as a follow-up ticket, not part of this migration.
- *SSRF hardening of `/api/fetch-article`.* A real pre-existing bug, but it has nothing to do with Supabase or Firestore — folding it in would blur the migration diff. Logged as a follow-up ticket.
- *Rules unit tests via the emulator.* Downgraded, not rejected: manual negative tests are in the matrix; an emulator harness is optional if the rules turn out non-trivial.

## Round 2 — Codex

**Findings**

- `users/{uid}/private/integrations` is server-only, but the plan never adds server routes for `ProfileClient` to save/delete/validate `readwiseToken` or `goodreadsUserId`; client data-layer writes will be denied by rules. Fix: add authenticated integration routes such as `POST/DELETE /api/integrations/readwise` and `POST/DELETE /api/integrations/goodreads`, and have profile/library use status-only props.
- `/api/goodreads` is gated but not redesigned to read `goodreadsUserId` from the private integrations doc, while the client currently calls it with `?userId=` and the plan moves that ID server-only. Fix: make `/api/goodreads` load the stored ID via Admin SDK, or explicitly keep Goodreads ID non-private.
- `encodeDocId(...parts)` can still collide: `encodeDocId("a__b")` and `encodeDocId("a", "b")` both produce `a__b` if the raw strings are already lowercase-safe. Fix: hash the raw parts unconditionally or use length-prefixed/base64url encoding per part.
- Deterministic article IDs hash only `canonicalize(sourceUrl)`, but `src/lib/rss.ts` can produce empty or missing `source_url`; those all collapse to the same article ID. Fix: define a fallback canonical key using feed name + title + published date when URL is missing or invalid.
- `/api/articles` is not in the auth-gated API list, yet the revised plan makes it perform Admin writes to Firestore on cache upsert; anonymous requests could drive Firestore writes and RSS fetch cost. Fix: gate `/api/articles` with `getSessionUser()` or split public reads from a server-scheduled/authenticated cache refresh.
- Security rules reference `wpmValid()` but do not define it, and other subcollections still have no field/type limits despite the text saying "per-collection, with allowlisted fields and type checks." Fix: either spell out validation functions for every writable collection or downgrade the claim and log it as accepted parity risk.
- Verification still only negative-tests unauthenticated `/api/upload` and `/api/analyze`; it misses the newly sensitive `/api/articles`, `/api/readwise`, `/api/goodreads`, `/api/questions`, and `/api/cars`. Fix: add 401/403 checks for every session-gated route plus a "Readwise token never appears in client props/network URL" check.

`VERDICT: REVISE`

### Claude's response

All seven accepted — six of them are direct consequences of the round-1 changes, which is exactly what a second pass is for.

1. Added `POST/DELETE /api/integrations/readwise`. `ProfileClient` and `LibraryClient` now receive a status-only prop (`readwiseConnected: boolean`), never the token itself.
2. Took Codex's own alternative on Goodreads: a Goodreads user ID is a public profile identifier, not a credential, so it **stays on the public profile doc** and `/api/goodreads` keeps its `?userId=` contract. Only `readwiseToken` moves to the private doc. This removes a route and a whole class of plumbing for zero security loss.
3. `encodeDocId` now hashes unconditionally — `sanitized + "__" + sha256(JSON.stringify(parts)).slice(0,12)` — so the `"a__b"` vs `("a","b")` collision cannot occur.
4. Article ID falls back to `sha256("feed:" + source + "|" + title + "|" + publishedAt)` when `sourceUrl` is missing or unparseable, so URL-less feed items no longer collapse into one document.
5. `/api/articles` joins the session-gated list — it drives Admin writes and outbound RSS fetches, so anonymous access is a cost vector.
6. Rules claim corrected to match reality: field/type validation is spelled out for `users/{uid}` and `wpmTests` (the two documents that carry the headline stats); the remaining subcollections get owner-only access with **no** field validation, logged explicitly as accepted parity risk rather than described as validated.
7. Negative-test matrix extended to all seven session-gated routes, plus an explicit check that the Readwise token appears in no client prop, no network URL, and no RSC payload.

## Round 3 — Codex

No material blockers remain. The revised plan now closes the main migration-breaking gaps: private Readwise storage has a server route, article IDs are deterministic with a missing-URL fallback, `/api/articles` is gated before gaining Admin writes, doc IDs are collision-resistant, and verification covers the major auth/rules regressions.

Remaining non-blocking fixes:

- Explicitly state that `POST/DELETE /api/integrations/readwise` calls `getSessionUser()` and add it to the unauthenticated negative-route checks. Fix: add `/api/integrations/readwise` to the API auth and verification lists.
- `profileValid()` allows client-supplied `createdAt`/`updatedAt`, which can make audit fields meaningless. Fix: have the client omit those fields or validate them as `request.time`/server-owned where practical.
- The plan still depends on `node_modules/next/dist/docs/` existing after install. Fix: if that path is absent after `npm install`, treat the middleware runtime branch as blocked until verified from installed Next source or official version-matched docs.

`VERDICT: APPROVED`

### Claude's response

All three non-blocking nits folded in: `/api/integrations/readwise` added to both the auth list and the 401 negative-test list; `profileValid()` now pins `createdAt`/`updatedAt` to `request.time` when present at all; the middleware-runtime step is explicitly marked blocked-not-guessed if the Next docs path is missing after install.

**Converged at round 3 of 5.**
