import { cookies } from "next/headers";
import { adminAuth } from "./admin";
import { SESSION_COOKIE } from "./cookie";

export { SESSION_COOKIE, SESSION_MAX_AGE_MS } from "./cookie";

export type SessionUser = {
  uid: string;
  email: string | null;
  name: string | null;
  picture: string | null;
};

/**
 * Verifies the session cookie and returns the user, or null.
 *
 * `checkRevoked` costs a network round-trip to the Firebase Auth backend, so
 * the proxy verifies signature/expiry only and callers that read user data
 * pass `true`.
 */
export async function getSessionUser(checkRevoked = true): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE)?.value;
  if (!cookie) return null;

  try {
    const decoded = await adminAuth().verifySessionCookie(cookie, checkRevoked);
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      name: (decoded.name as string | undefined) ?? null,
      picture: (decoded.picture as string | undefined) ?? null,
    };
  } catch {
    return null;
  }
}

/** Route-handler guard: returns the user or throws a 401-shaped error. */
export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    const err = new Error("Unauthorized") as Error & { status?: number };
    err.status = 401;
    throw err;
  }
  return user;
}
