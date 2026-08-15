"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import type { UserDocument, WpmTest } from "./types";

function iso(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "string") return value;
  return null;
}

function userDoc(uid: string) {
  return doc(getDb(), "users", uid);
}

/**
 * Profile patches from the client.
 *
 * Rules allowlist the writable keys, so this must never send `createdAt` — the
 * only audit field it may set is `updatedAt`, pinned to `request.time`.
 */
export async function updateProfile(
  uid: string,
  patch: Partial<{
    fullName: string;
    baselineWpm: number;
    currentWpm: number;
    readingLevel: string;
    interests: string[];
    onboardingComplete: boolean;
    goodreadsUserId: string | null;
    streakDays: number;
    totalWordsRead: number;
    articlesRead: number;
  }>
): Promise<void> {
  await updateDoc(userDoc(uid), { ...patch, updatedAt: serverTimestamp() });
}

export async function addWpmTest(
  uid: string,
  test: {
    wpm: number;
    comprehensionScore?: number | null;
    articleId?: string | null;
    mode: WpmTest["mode"];
  }
): Promise<void> {
  await addDoc(collection(userDoc(uid), "wpmTests"), {
    wpm: test.wpm,
    comprehensionScore: test.comprehensionScore ?? null,
    articleId: test.articleId ?? null,
    mode: test.mode,
    testedAt: serverTimestamp(),
  });
}

export async function saveBookmark(
  uid: string,
  articleId: string,
  articleData: Record<string, unknown>
): Promise<void> {
  await setDoc(doc(collection(userDoc(uid), "bookmarks"), articleId), {
    articleData,
    savedAt: serverTimestamp(),
  });
}

export async function removeBookmark(uid: string, articleId: string): Promise<void> {
  await deleteDoc(doc(collection(userDoc(uid), "bookmarks"), articleId));
}

export async function addReadingSession(
  uid: string,
  session: {
    articleId: string | null;
    wordsRead: number;
    mode: string;
    cambridgeModeOn: boolean;
    timeSpentSeconds?: number | null;
  }
): Promise<void> {
  await addDoc(collection(userDoc(uid), "readingSessions"), {
    articleId: session.articleId,
    wordsRead: session.wordsRead,
    mode: session.mode,
    cambridgeModeOn: session.cambridgeModeOn,
    timeSpentSeconds: session.timeSpentSeconds ?? null,
    startedAt: serverTimestamp(),
    completedAt: null,
  });
}

export async function fetchDocuments(uid: string): Promise<UserDocument[]> {
  const snap = await getDocs(
    query(collection(userDoc(uid), "documents"), orderBy("uploadedAt", "desc"))
  );

  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      title: (data.title as string) ?? "Untitled",
      author: (data.author as string) ?? null,
      content: (data.content as string) ?? "",
      wordCount: (data.wordCount as number) ?? 0,
      fileType: (data.fileType as string) ?? "text",
      readingLevel: (data.readingLevel as string) ?? null,
      fleschScore: (data.fleschScore as number) ?? null,
      uploadedAt: iso(data.uploadedAt) ?? new Date(0).toISOString(),
    };
  });
}
