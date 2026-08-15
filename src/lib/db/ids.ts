import { createHash } from "crypto";

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function slug(part: string): string {
  return part
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/**
 * Builds a Firestore-safe document ID from arbitrary app strings.
 *
 * The hash suffix is unconditional: the readable prefix is a convenience for
 * humans reading the console, the hash is the identity. Without it,
 * encodeDocId("a__b") and encodeDocId("a", "b") would collide.
 */
export function encodeDocId(...parts: string[]): string {
  const prefix = parts.map(slug).filter(Boolean).join("__") || "id";
  return `${prefix}__${sha256(JSON.stringify(parts)).slice(0, 12)}`;
}

/** Strips fragments, tracking params, and trailing slashes so the same article hashes alike. */
export function canonicalizeUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    u.hash = "";
    for (const key of [...u.searchParams.keys()]) {
      if (/^(utm_|ref$|ref_src|fbclid|gclid|mc_cid|mc_eid)/i.test(key)) {
        u.searchParams.delete(key);
      }
    }
    u.pathname = u.pathname.replace(/\/+$/, "") || "/";
    return u.toString();
  } catch {
    return null;
  }
}

/**
 * Stable article ID.
 *
 * Feed items without a usable URL fall back to source+title+date — otherwise
 * every URL-less item in a feed would hash to the same document and overwrite
 * its siblings.
 */
export function articleId(input: {
  sourceUrl?: string | null;
  source?: string | null;
  title?: string | null;
  publishedAt?: string | null;
}): string {
  const canonical = input.sourceUrl ? canonicalizeUrl(input.sourceUrl) : null;
  const key = canonical
    ? `url:${canonical}`
    : `feed:${input.source ?? ""}|${input.title ?? ""}|${input.publishedAt ?? ""}`;
  return sha256(key).slice(0, 20);
}
