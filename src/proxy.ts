import { NextResponse, type NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { SESSION_COOKIE } from "@/lib/firebase/session";

/**
 * Next 16 runs Proxy on the Node.js runtime by default (and rejects the
 * `runtime` config option outright), so firebase-admin is available here and
 * the cookie check is authoritative rather than presence-only.
 *
 * `verifySessionCookie(cookie, false)` checks signature and expiry without a
 * network round-trip; revocation is re-checked by server components and route
 * handlers that actually read user data.
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

const isConfigured = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

export async function proxy(request: NextRequest) {
  // Pass through when Firebase is not yet configured (local dev without .env).
  if (!isConfigured) return NextResponse.next({ request });

  const { pathname } = request.nextUrl;
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isApp = APP_PREFIXES.some((p) => pathname.startsWith(p));

  if (!isAuthPage && !isApp) return NextResponse.next({ request });

  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  let signedIn = false;

  if (cookie) {
    try {
      await adminAuth().verifySessionCookie(cookie, false);
      signedIn = true;
    } catch {
      signedIn = false;
    }
  }

  if (!signedIn && isApp) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    // Clear a stale/forged cookie so the browser stops resending it.
    if (cookie) response.cookies.set({ name: SESSION_COOKIE, value: "", path: "/", maxAge: 0 });
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
