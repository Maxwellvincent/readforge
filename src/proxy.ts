import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/firebase/cookie";

/**
 * Redirect gating only — deliberately NOT authoritative.
 *
 * Next 16 does run Proxy on the Node.js runtime, so `firebase-admin` imports
 * here just fine in dev. It does not survive the Vercel build: `jwks-rsa` is
 * CommonJS and `require()`s `jose`, which is ESM, so every request through the
 * proxy died with ERR_REQUIRE_ESM and the whole site 500'd. Verified in
 * production on 2026-08-15.
 *
 * So the proxy only asks "is there a session cookie at all", which is enough to
 * decide a redirect. Authority lives where the data does: every server
 * component and route handler calls `getSessionUser()`, which runs the real
 * `verifySessionCookie` in a normal serverless function where firebase-admin
 * loads correctly. A forged cookie therefore reaches a page shell and is then
 * bounced by that page's own check — it never yields data.
 */
const APP_PREFIXES = [
  "/dashboard",
  "/library",
  "/grammar",
  "/speed",
  "/cars",
  "/profile",
  "/onboarding",
];

// Local dev without .env should not redirect-loop.
const isConfigured = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

export function proxy(request: NextRequest) {
  // Pass through when Firebase is not yet configured (local dev without .env).
  if (!isConfigured) return NextResponse.next({ request });

  const { pathname } = request.nextUrl;
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isApp = APP_PREFIXES.some((p) => pathname.startsWith(p));

  if (!isAuthPage && !isApp) return NextResponse.next({ request });

  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  const signedIn = Boolean(cookie);

  if (!signedIn && isApp) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (signedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
