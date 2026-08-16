import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/firebase/cookie";
import { verifySessionCookieEdge } from "@/lib/firebase/verify-edge";

/**
 * Authoritative session gating, without firebase-admin.
 *
 * firebase-admin cannot be imported here: Next externalizes it, native
 * require() hits jwks-rsa (CJS) importing ESM-only jose, and every request
 * 500s. Verified in production on 2026-08-15.
 *
 * Checking merely whether a cookie EXISTS is not an acceptable substitute: it
 * produces an infinite redirect loop as soon as a cookie goes stale. /dashboard
 * admits the request, the page fails verification and redirects to /login, and
 * this proxy sees the same cookie and bounces it back to /dashboard. Observed
 * in the browser on 2026-08-16.
 *
 * So the signature is verified here with `jose`, which bundles cleanly. Server
 * components and route handlers still re-verify via firebase-admin with
 * `checkRevoked`, which this cannot do — that check needs a network round-trip
 * and belongs where the data is read.
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

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "";

export async function proxy(request: NextRequest) {
  // Pass through when Firebase is not yet configured (local dev without .env).
  if (!isConfigured) return NextResponse.next({ request });

  const { pathname } = request.nextUrl;
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isApp = APP_PREFIXES.some((p) => pathname.startsWith(p));

  if (!isAuthPage && !isApp) return NextResponse.next({ request });

  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  const uid = await verifySessionCookieEdge(cookie, PROJECT_ID);
  const signedIn = uid !== null;

  if (!signedIn && isApp) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    // Drop a stale or forged cookie so the next request starts clean; leaving
    // it in place is what created the redirect loop.
    if (cookie) {
      response.cookies.set({ name: SESSION_COOKIE, value: "", path: "/", maxAge: 0 });
    }
    return response;
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
