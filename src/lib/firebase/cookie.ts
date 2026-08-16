/**
 * Dependency-free session-cookie constants.
 *
 * These live apart from `session.ts` on purpose: `session.ts` imports
 * `admin.ts`, and anything the proxy imports gets pulled into the middleware
 * bundle — where firebase-admin fails to load on Vercel (jwks-rsa is CJS and
 * require()s the ESM-only jose). The proxy imports from here instead, so that
 * chain is never created.
 */
export const SESSION_COOKIE = "__session";

/** Firebase caps session cookies at 14 days. */
export const SESSION_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;
