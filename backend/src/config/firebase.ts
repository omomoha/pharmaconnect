import * as admin from "firebase-admin";
import config from "./index.js";
import logger from "../utils/logger.js";

let db: admin.firestore.Firestore;
let auth: admin.auth.Auth;
let storage: admin.storage.Bucket;

/**
 * Initialize Firebase Admin SDK
 * Uses explicit service account credentials from environment variables
 */
export const initializeFirebase = (): void => {
  try {
    // Parse the private key from environment
    const privateKey = config.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");

    const serviceAccount = {
      projectId: config.FIREBASE_PROJECT_ID,
      clientEmail: config.FIREBASE_CLIENT_EMAIL,
      privateKey,
    };

    // Initialize Firebase Admin SDK
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: config.FIREBASE_STORAGE_BUCKET,
      projectId: config.FIREBASE_PROJECT_ID,
    });

    // Get references to services
    db = admin.firestore();
    auth = admin.auth();
    storage = admin.storage().bucket();

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
export const getStorage = (): admin.storage.Bucket => {
  if (!storage) {
    throw new Error("Firebase not initialized. Call initializeFirebase() first.");
  }
  return storage;
};

// Export instances
export { db, auth, storage };
