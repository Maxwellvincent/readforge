import { importX509, jwtVerify, decodeProtectedHeader } from "jose";

/**
 * Session-cookie verification without firebase-admin.
 *
 * The proxy cannot import firebase-admin: it gets externalized and loaded via
 * native require(), where jwks-rsa (CJS) pulls in ESM-only jose and the whole
 * request dies. `jose` on its own bundles fine, so the proxy verifies the
 * cookie's signature itself.
 *
 * This matters beyond tidiness. A presence-only check causes an infinite
 * redirect loop the moment a cookie is stale: /dashboard admits the request,
 * the page fails to verify and redirects to /login, and the proxy bounces it
 * straight back to /dashboard. Verifying here means a bad cookie is known to be
 * bad at the only point that can act on it.
 *
 * Firebase signs session cookies with rotating x509 certs, keyed by `kid`.
 */
const CERT_URL =
  "https://www.googleapis.com/identitytoolkit/v3/relyingparty/publicKeys";

type CertCache = { certs: Record<string, string>; expiresAt: number };
let cache: CertCache | null = null;

async function getCerts(): Promise<Record<string, string>> {
  if (cache && cache.expiresAt > Date.now()) return cache.certs;

  const res = await fetch(CERT_URL);
  if (!res.ok) throw new Error(`cert fetch failed: ${res.status}`);

  const certs = (await res.json()) as Record<string, string>;

  // Honour Google's cache header; fall back to an hour.
  const cc = res.headers.get("cache-control") ?? "";
  const maxAge = Number(/max-age=(\d+)/.exec(cc)?.[1] ?? 3600);

  cache = { certs, expiresAt: Date.now() + maxAge * 1000 };
  return certs;
}

/** Returns the uid, or null when the cookie is missing, malformed, or invalid. */
export async function verifySessionCookieEdge(
  cookie: string | undefined,
  projectId: string
): Promise<string | null> {
  if (!cookie) return null;

  try {
    const { kid } = decodeProtectedHeader(cookie);
    if (!kid) return null;

    const certs = await getCerts();
    const pem = certs[kid];
    if (!pem) return null;

    const key = await importX509(pem, "RS256");
    const { payload } = await jwtVerify(cookie, key, {
      audience: projectId,
      issuer: `https://session.firebase.google.com/${projectId}`,
    });

    // `sub` is the uid; jwtVerify already enforced exp/nbf/aud/iss.
    return typeof payload.sub === "string" && payload.sub ? payload.sub : null;
  } catch {
    return null;
  }
}
