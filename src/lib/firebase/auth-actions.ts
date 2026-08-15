"use client";

import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  GoogleAuthProvider,
  OAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "./client";

/** Trades the freshly-minted ID token for the httpOnly session cookie. */
async function establishSession(user: User): Promise<void> {
  const idToken = await user.getIdToken(true);
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: "Session creation failed" }));
    throw new Error(error ?? "Session creation failed");
  }
}

export async function signUpWithEmail(
  name: string,
  email: string,
  password: string
): Promise<void> {
  const auth = getFirebaseAuth();
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  if (name) await updateProfile(user, { displayName: name });
  await establishSession(user);
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  const auth = getFirebaseAuth();
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  await establishSession(user);
}

export async function sendReset(email: string): Promise<void> {
  await sendPasswordResetEmail(getFirebaseAuth(), email);
}

function providerFor(kind: "google" | "apple") {
  if (kind === "google") return new GoogleAuthProvider();
  const apple = new OAuthProvider("apple.com");
  apple.addScope("email");
  apple.addScope("name");
  return apple;
}

/**
 * Popup OAuth, falling back to a full redirect where popups are blocked or
 * unsupported (mobile Safari, in-app browsers, Apple on iOS).
 *
 * Returns true when the session is established in-place; false means a redirect
 * is under way and `completeRedirectSignIn` finishes the job on the way back.
 */
export async function signInWithProvider(kind: "google" | "apple"): Promise<boolean> {
  const auth = getFirebaseAuth();
  const provider = providerFor(kind);

  try {
    const { user } = await signInWithPopup(auth, provider);
    await establishSession(user);
    return true;
  } catch (err) {
    const code = (err as { code?: string }).code ?? "";
    const popupUnavailable =
      code === "auth/popup-blocked" ||
      code === "auth/popup-closed-by-user" ||
      code === "auth/cancelled-popup-request" ||
      code === "auth/operation-not-supported-in-this-environment";

    if (!popupUnavailable) throw err;
    if (code === "auth/popup-closed-by-user") return false;

    await signInWithRedirect(auth, provider);
    return false;
  }
}

/** Call on mount of the auth pages to finish a redirect-based sign-in. */
export async function completeRedirectSignIn(): Promise<boolean> {
  const result = await getRedirectResult(getFirebaseAuth());
  if (!result?.user) return false;
  await establishSession(result.user);
  return true;
}

export async function signOut(): Promise<void> {
  await fetch("/api/auth/session", { method: "DELETE" });
  await fbSignOut(getFirebaseAuth());
}
