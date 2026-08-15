#!/usr/bin/env node
/**
 * One-shot seed of the pre-migration Supabase rows into Firestore.
 *
 * The old Supabase account was a Google OAuth user, so there is no password to
 * import: sign in to the new Firebase app with the same Google account once,
 * then run this with that account's uid.
 *
 *   node scripts/seed-from-supabase.mjs --dump /path/to/supabase-dump.json --uid <firebaseUid>
 *
 * Precedence rules:
 *   - Identity fields (email, fullName, avatarUrl) that Firebase Auth already
 *     populated WIN — the seed never overwrites them.
 *   - Training fields (baselineWpm, currentWpm, readingLevel, interests,
 *     onboardingComplete, counters) come from the seed and overwrite the
 *     freshly-created defaults.
 *   - Subcollection documents reuse the old Postgres UUID as the document ID,
 *     so re-running the script is idempotent rather than duplicating rows.
 *
 * The dump contains a live Readwise API token. Keep it outside the repo.
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

/**
 * Mirrors src/lib/db/ids.ts.
 *
 * Old bookmarks carry a per-fetch `nanoid` from the Supabase era. Article IDs
 * are now hashes of the canonical URL, so a bookmark keyed by the old ID would
 * never line up with a refetched article — the heart would read "unsaved" and a
 * re-save would create a second document. Re-derive the ID here.
 */
function canonicalizeUrl(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    u.hash = "";
    for (const key of [...u.searchParams.keys()]) {
      if (/^(utm_|ref$|ref_src|fbclid|gclid|mc_cid|mc_eid)/i.test(key)) u.searchParams.delete(key);
    }
    u.pathname = u.pathname.replace(/\/+$/, "") || "/";
    return u.toString();
  } catch {
    return null;
  }
}

function articleId({ sourceUrl, source, title, publishedAt }) {
  const canonical = sourceUrl ? canonicalizeUrl(sourceUrl) : null;
  const key = canonical
    ? `url:${canonical}`
    : `feed:${source ?? ""}|${title ?? ""}|${publishedAt ?? ""}`;
  return createHash("sha256").update(key).digest("hex").slice(0, 20);
}

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

const dumpPath = arg("dump");
const uid = arg("uid");

if (!dumpPath || !uid) {
  console.error("Usage: node scripts/seed-from-supabase.mjs --dump <file.json> --uid <firebaseUid>");
  process.exit(1);
}

const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!rawKey) {
  console.error("FIREBASE_SERVICE_ACCOUNT_KEY is not set.");
  process.exit(1);
}

const sa = JSON.parse(
  rawKey.trim().startsWith("{") ? rawKey : Buffer.from(rawKey, "base64").toString("utf8")
);

initializeApp({
  credential: cert({
    projectId: sa.project_id,
    clientEmail: sa.client_email,
    privateKey: sa.private_key.replace(/\\n/g, "\n"),
  }),
});

const db = getFirestore();
const dump = JSON.parse(readFileSync(dumpPath, "utf8"));

const ts = (value) => (value ? Timestamp.fromDate(new Date(value)) : null);

async function seed() {
  const userRef = db.collection("users").doc(uid);
  const existing = await userRef.get();
  const current = existing.exists ? existing.data() : {};

  const profile = dump.profiles?.[0];
  if (profile) {
    const patch = {
      baselineWpm: profile.baseline_wpm ?? 200,
      currentWpm: profile.current_wpm ?? 200,
      readingLevel: profile.reading_level ?? "college",
      streakDays: profile.streak_days ?? 0,
      totalWordsRead: profile.total_words_read ?? 0,
      articlesRead: profile.articles_read ?? 0,
      onboardingComplete: Boolean(profile.onboarding_complete),
      interests: profile.interests ?? [],
      goodreadsUserId: profile.goodreads_user_id ?? null,
      updatedAt: Timestamp.now(),
    };

    // Identity fields: only fill gaps Firebase Auth left behind.
    if (!current.email && profile.email) patch.email = profile.email;
    if (!current.fullName && profile.full_name) patch.fullName = profile.full_name;
    if (!current.avatarUrl && profile.avatar_url) patch.avatarUrl = profile.avatar_url;
    if (!current.createdAt && profile.created_at) patch.createdAt = ts(profile.created_at);

    await userRef.set(patch, { merge: true });
    console.log(`profile: merged (${Object.keys(patch).length} fields)`);

    if (profile.readwise_token) {
      await userRef
        .collection("private")
        .doc("integrations")
        .set({ readwiseToken: profile.readwise_token, updatedAt: Timestamp.now() }, { merge: true });
      console.log("readwise token: stored in private/integrations");
    }
  }

  let wpmCount = 0;
  for (const test of dump.wpm_tests ?? []) {
    await userRef.collection("wpmTests").doc(test.id).set(
      {
        wpm: test.wpm,
        comprehensionScore: test.comprehension_score ?? null,
        articleId: test.article_id ?? null,
        mode: test.mode ?? "normal",
        testedAt: ts(test.tested_at) ?? Timestamp.now(),
      },
      { merge: true }
    );
    wpmCount += 1;
  }
  console.log(`wpmTests: ${wpmCount} written`);

  let bookmarkCount = 0;
  for (const bookmark of dump.bookmarks ?? []) {
    const data = bookmark.article_data ?? {};
    const newId = articleId({
      sourceUrl: data.source_url,
      source: data.source,
      title: data.title,
      publishedAt: data.published_at,
    });

    await userRef.collection("bookmarks").doc(newId).set(
      {
        // Keep the stored snapshot's id consistent with its document id.
        articleData: { ...data, id: newId },
        savedAt: ts(bookmark.saved_at) ?? Timestamp.now(),
      },
      { merge: true }
    );
    console.log(`bookmark: ${bookmark.article_id} -> ${newId}`);
    bookmarkCount += 1;
  }
  console.log(`bookmarks: ${bookmarkCount} written`);

  console.log(`\nSeed complete for uid ${uid}.`);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
