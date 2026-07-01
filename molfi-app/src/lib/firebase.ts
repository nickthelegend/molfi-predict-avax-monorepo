import { initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { appConfig } from "@/lib/config";

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

function ensureFirebase(): { app: FirebaseApp; db: Firestore } | null {
  const { firebase } = appConfig;
  if (!firebase) return null;

  if (!app) {
    app = initializeApp(firebase);
    db = getFirestore(app);
  }

  return { app, db: db! };
}

export function getFirebaseDb(): Firestore | null {
  return ensureFirebase()?.db ?? null;
}

export function isFirebaseConfigured(): boolean {
  return Boolean(appConfig.firebase);
}
