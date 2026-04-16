import * as admin from "firebase-admin";
import config from "./index.js";
import logger from "../utils/logger.js";

let db: admin.firestore.Firestore | null = null;
let auth: admin.auth.Auth | null = null;
let storage: any = null;

/**
 * Initialize Firebase Admin SDK with retry logic
 * Uses Application Default Credentials in Cloud Functions,
 * or explicit service account credentials from env vars locally
 *
 * Retry logic: 3 attempts with 2s delay between attempts
 * If all retries fail, process exits
 */
export const initializeFirebase = async (): Promise<void> => {
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 2000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
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
      return; // Success — exit function
    } catch (error) {
      logger.error(`Firebase initialization attempt ${attempt}/${MAX_RETRIES} failed:`, error);

      if (attempt < MAX_RETRIES) {
        logger.info(`Retrying Firebase initialization in ${RETRY_DELAY_MS}ms...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      } else {
        // All retries exhausted
        logger.error("Firebase initialization failed after all retries. Exiting process.");
        process.exit(1);
      }
    }
  }
};

/**
 * Get Firestore database instance
 * Lazily initializes from the default Firebase app if not set by initializeFirebase()
 */
export const getFirestore = (): admin.firestore.Firestore => {
  if (!db) {
    if (admin.apps.length) {
      db = admin.firestore();
    } else {
      throw new Error("Firebase not initialized. Call initializeFirebase() or admin.initializeApp() first.");
    }
  }
  return db;
};

/**
 * Get Firebase Auth instance
 * Lazily initializes from the default Firebase app if not set by initializeFirebase()
 */
export const getAuth = (): admin.auth.Auth => {
  if (!auth) {
    if (admin.apps.length) {
      auth = admin.auth();
    } else {
      throw new Error("Firebase not initialized. Call initializeFirebase() or admin.initializeApp() first.");
    }
  }
  return auth;
};

/**
 * Get Firebase Storage bucket
 * Lazily initializes from the default Firebase app if not set by initializeFirebase()
 */
export const getStorageBucket = (): any => {
  if (!storage) {
    if (admin.apps.length) {
      try {
        storage = admin.storage().bucket();
      } catch (_err) {
        throw new Error("Firebase Storage bucket not configured.");
      }
    } else {
      throw new Error("Firebase not initialized. Call initializeFirebase() or admin.initializeApp() first.");
    }
  }
  return storage;
};

// Export instances
export { db, auth, storage };
