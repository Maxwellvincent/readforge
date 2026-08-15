// Server-only: importing this from a client component pulls in firebase-admin
// and will fail the build. Client writes live in ./client.ts.
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import {
  DEFAULT_PROFILE,
  type Bookmark,
  type CarsSession,
  type GrammarProgress,
  type Profile,
  type UserDocument,
  type WpmTest,
} from "./types";

/** Firestore Timestamp → ISO string, tolerant of already-serialized values. */
function iso(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return null;
}

function userRef(uid: string) {
  return adminDb().collection("users").doc(uid);
}

export async function getProfile(uid: string): Promise<Profile | null> {
  const snap = await userRef(uid).get();
  if (!snap.exists) return null;
  const d = snap.data() ?? {};
  return {
    uid,
    email: (d.email as string) ?? null,
    fullName: (d.fullName as string) ?? null,
    avatarUrl: (d.avatarUrl as string) ?? null,
    baselineWpm: (d.baselineWpm as number) ?? DEFAULT_PROFILE.baselineWpm,
    currentWpm: (d.currentWpm as number) ?? DEFAULT_PROFILE.currentWpm,
    readingLevel: (d.readingLevel as string) ?? DEFAULT_PROFILE.readingLevel,
    streakDays: (d.streakDays as number) ?? 0,
    lastActive: iso(d.lastActive),
    totalWordsRead: (d.totalWordsRead as number) ?? 0,
    articlesRead: (d.articlesRead as number) ?? 0,
    onboardingComplete: Boolean(d.onboardingComplete),
    interests: (d.interests as string[]) ?? [],
    goodreadsUserId: (d.goodreadsUserId as string) ?? null,
    createdAt: iso(d.createdAt),
    updatedAt: iso(d.updatedAt),
  };
}

/** Replaces the Postgres `handle_new_user` trigger. Never clobbers existing fields. */
export async function ensureProfile(user: {
  uid: string;
  email: string | null;
  name: string | null;
  picture: string | null;
}): Promise<void> {
  const ref = userRef(user.uid);
  const snap = await ref.get();

  if (!snap.exists) {
    await ref.set({
      ...DEFAULT_PROFILE,
      email: user.email,
      fullName: user.name,
      avatarUrl: user.picture,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return;
  }

  // Keep identity fields fresh without touching training data.
  const d = snap.data() ?? {};
  const patch: Record<string, unknown> = {};
  if (user.email && d.email !== user.email) patch.email = user.email;
  if (user.name && !d.fullName) patch.fullName = user.name;
  if (user.picture && !d.avatarUrl) patch.avatarUrl = user.picture;
  if (Object.keys(patch).length) {
    patch.updatedAt = FieldValue.serverTimestamp();
    await ref.set(patch, { merge: true });
  }
}

export async function listWpmTests(uid: string, limit = 30): Promise<WpmTest[]> {
  const snap = await userRef(uid)
    .collection("wpmTests")
    .orderBy("testedAt", "asc")
    .limitToLast(limit)
    .get();

  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      wpm: (d.wpm as number) ?? 0,
      comprehensionScore: (d.comprehensionScore as number) ?? null,
      articleId: (d.articleId as string) ?? null,
      mode: (d.mode as WpmTest["mode"]) ?? "normal",
      testedAt: iso(d.testedAt) ?? new Date(0).toISOString(),
    };
  });
}

export async function listCarsSessions(uid: string, limit = 10): Promise<CarsSession[]> {
  const snap = await userRef(uid)
    .collection("carsSessions")
    .orderBy("completedAt", "desc")
    .limit(limit)
    .get();

  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      mode: (d.mode as string) ?? "practice",
      timeLimitSeconds: (d.timeLimitSeconds as number) ?? 5400,
      startedAt: iso(d.startedAt) ?? new Date(0).toISOString(),
      completedAt: iso(d.completedAt),
      totalQuestions: (d.totalQuestions as number) ?? null,
      correctAnswers: (d.correctAnswers as number) ?? null,
      scorePercent: (d.scorePercent as number) ?? null,
    };
  });
}

export async function listGrammarProgress(uid: string): Promise<GrammarProgress[]> {
  const snap = await userRef(uid).collection("grammarProgress").get();
  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      moduleId: (d.moduleId as string) ?? "",
      lessonId: (d.lessonId as string) ?? "",
      completed: Boolean(d.completed),
      score: (d.score as number) ?? null,
      attempts: (d.attempts as number) ?? 0,
      completedAt: iso(d.completedAt),
    };
  });
}

export async function listBookmarks(uid: string): Promise<Bookmark[]> {
  const snap = await userRef(uid)
    .collection("bookmarks")
    .orderBy("savedAt", "desc")
    .get();

  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      articleId: doc.id,
      articleData: (d.articleData as Record<string, unknown>) ?? {},
      savedAt: iso(d.savedAt) ?? new Date(0).toISOString(),
    };
  });
}

export async function listDocuments(uid: string): Promise<UserDocument[]> {
  const snap = await userRef(uid)
    .collection("documents")
    .orderBy("uploadedAt", "desc")
    .get();

  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      title: (d.title as string) ?? "Untitled",
      author: (d.author as string) ?? null,
      content: (d.content as string) ?? "",
      wordCount: (d.wordCount as number) ?? 0,
      fileType: (d.fileType as string) ?? "text",
      readingLevel: (d.readingLevel as string) ?? null,
      fleschScore: (d.fleschScore as number) ?? null,
      uploadedAt: iso(d.uploadedAt) ?? new Date(0).toISOString(),
    };
  });
}

export async function addDocument(
  uid: string,
  doc: Omit<UserDocument, "id" | "uploadedAt">
): Promise<UserDocument> {
  const ref = await userRef(uid)
    .collection("documents")
    .add({ ...doc, uploadedAt: FieldValue.serverTimestamp() });

  return { ...doc, id: ref.id, uploadedAt: new Date().toISOString() };
}

/* ---------- private integrations (server-only, rules deny all client access) ---------- */

function integrationsRef(uid: string) {
  return userRef(uid).collection("private").doc("integrations");
}

export async function getReadwiseToken(uid: string): Promise<string | null> {
  const snap = await integrationsRef(uid).get();
  return (snap.data()?.readwiseToken as string) ?? null;
}

export async function setReadwiseToken(uid: string, token: string): Promise<void> {
  await integrationsRef(uid).set(
    { readwiseToken: token, updatedAt: FieldValue.serverTimestamp() },
    { merge: true }
  );
}

export async function clearReadwiseToken(uid: string): Promise<void> {
  await integrationsRef(uid).set(
    { readwiseToken: FieldValue.delete(), updatedAt: FieldValue.serverTimestamp() },
    { merge: true }
  );
}

export async function hasReadwiseToken(uid: string): Promise<boolean> {
  return (await getReadwiseToken(uid)) !== null;
}
