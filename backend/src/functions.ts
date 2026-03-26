import { onRequest } from 'firebase-functions/v2/https';
import { createApp } from './app.js';
import { initializeFirebase } from './config/firebase.js';
import { initializeRedis } from './config/redis.js';
import logger from './utils/logger.js';

// Initialize Firebase Admin SDK
initializeFirebase();
logger.info('Firebase initialized for Cloud Functions');

// Initialize Redis (non-blocking — app works without it, rate limiting degrades gracefully)
try {
  initializeRedis();
  logger.info('Redis initialized for Cloud Functions');
} catch (error) {
  logger.warn('Redis initialization failed — rate limiting will be unavailable:', error);
}

// Create Express app
const { app } = createApp();

/**
 * Firebase Cloud Function v2 — API Handler
 * Exports the Express app as a Cloud Function
 */
export const api = onRequest(
  {
    region: 'us-central1',
    timeoutSeconds: 60,
    memory: '256MiB',
    cors: true,
  },
  app
);
