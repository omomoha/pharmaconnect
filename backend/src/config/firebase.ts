import * as admin from "firebase-admin";
import config from "./index.js";
import logger from "../utils/logger.js";

let db: admin.firestore.Firestore;
let auth: admin.auth.Auth;
let storage: any;

/**
 * Initialize Firebase Admin SDK
 * Uses Application Default Credentials in Cloud Functions,
 * or explicit service account credentials from env vars locally
 */
export const initializeFirebase = (): void => {
  try {
    const hasExplicitCreds = config.FIREBASE_PROJECT_ID && config.FIREBASE_CLIENT_EMAIL && config.FIREBASE_PRIVATE_KEY;

    if (hasExplicitCreds) {
      // Local development: use explicit service account credentials
      const privateKey = config.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n");

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: config.FIREBASE_PROJECT_ID!,
          clientEmail: config.FIREBASE_CLIENT_EMAIL!,
          privateKey,
        }),
        storageBucket: config.FIREBASE_STORAGE_BUCKET,
        projectId: config.FIREBASE_PROJECT_ID,
      });
    } else {
      // Cloud Functions: use Application Default Credentials
      admin.initializeApp();
    }

    // Get references to services
    db = admin.firestore();
    auth = admin.auth();

    // Storage bucket — optional, may not be configured in all environments
    try {
      storage = admin.storage().bucket();
    } catch (_storageError) {
      logger.warn("Firebase Storage bucket not configured — file uploads disabled");
    }

    logger.info("Firebase Admin SDK initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize Firebase Admin SDK:", error);
    throw error;
  }
};

/**
 * Get Firestore database instance
 */
export const getFirestore = (): admin.firestore.Firestore => {
  if (!db) {
    throw new Error("Firebase not initialized. Call initializeFirebase() first.");
  }
  return db;
};

/**
 * Get Firebase Auth instance
 */
export const getAuth = (): admin.auth.Auth => {
  if (!auth) {
    throw new Error("Firebase not initialized. Call initializeFirebase() first.");
  }
  return auth;
};

/**
 * Get Firebase Storage bucket
 */
export const getStorageBucket = (): any => {
  if (!storage) {
    throw new Error("Firebase not initialized. Call initializeFirebase() first.");
  }
  return storage;
};

// Export instances
export { db, auth, storage };
