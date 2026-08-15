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

let _db: Firestore | null = null;

export function adminDb(): Firestore {
  if (!_db) {
    _db = getFirestore(adminApp());
    _db.settings({ ignoreUndefinedProperties: true });
  }
  return _db;
}

export { getApp as getAdminAppByName };
