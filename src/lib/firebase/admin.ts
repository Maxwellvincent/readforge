import { cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

const ADMIN_APP = "readforge-admin";

function serviceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY is not set — server-side Firebase is unavailable."
    );
  }
  // Accept either raw JSON or base64-encoded JSON, so the value survives being
  // pasted into environments that mangle newlines (Vercel, shell exports).
  const json = raw.trim().startsWith("{")
    ? raw
    : Buffer.from(raw, "base64").toString("utf8");
  return JSON.parse(json) as {
    project_id: string;
    client_email: string;
    private_key: string;
  };
}

function adminApp(): App {
  const existing = getApps().find((a) => a.name === ADMIN_APP);
  if (existing) return existing;

  const sa = serviceAccount();
  return initializeApp(
    {
      credential: cert({
        projectId: sa.project_id,
        clientEmail: sa.client_email,
        privateKey: sa.private_key.replace(/\\n/g, "\n"),
      }),
      projectId: sa.project_id,
    },
    ADMIN_APP
  );
}

export function adminAuth(): Auth {
  return getAuth(adminApp());
}

/**
 * `settings()` may only be called once per Firestore instance, and
 * `getFirestore()` hands back the same instance across module instances — which
 * a module-level cache alone does not cover. Dev HMR and separate route bundles
 * both re-run this module against an already-configured instance, so the flag
 * lives on globalThis and the call is defensive on top of that.
 */
const CONFIGURED = Symbol.for("readforge.firestore.configured");
type GlobalWithFlag = typeof globalThis & { [CONFIGURED]?: boolean };

export function adminDb(): Firestore {
  const db = getFirestore(adminApp());
  const g = globalThis as GlobalWithFlag;

  if (!g[CONFIGURED]) {
    try {
      db.settings({ ignoreUndefinedProperties: true });
    } catch {
      // Already configured by another module instance — nothing to do.
    }
    g[CONFIGURED] = true;
  }

  return db;
}

export { getApp as getAdminAppByName };
