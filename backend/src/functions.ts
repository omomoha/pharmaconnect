import { onRequest } from 'firebase-functions/v2/https';
import { createApp } from './app.js';
import { initializeFirebase } from './config/firebase.js';
import { initializeRedis } from './config/redis.js';
import logger from './utils/logger.js';

// Initialize Firebase Admin SDK
initializeFirebase();
logger.info('Firebase initialized for Cloud Functions');

// Initialize Redis
initializeRedis();
logger.info('Redis initialized for Cloud Functions');

// Create Express app (without HTTP server, Socket.IO is not used in Cloud Functions)
const { app } = createApp();

/**
 * Firebase Cloud Function v2 - API Handler
 * Exports the Express app as a Cloud Function
 *
 * This function handles all HTTP requests to the PharmaConnect API.
 * Note: Socket.IO is initialized but not actively used in Cloud Functions context.
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
