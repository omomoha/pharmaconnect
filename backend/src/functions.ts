import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import config, { getAllowedOrigins } from './config/index.js';
import logger from './utils/logger.js';
import {
  errorHandler,
  notFoundHandler,
  asyncHandler,
} from './middleware/errorHandler.js';

// Import routes
import authRoutes from './modules/auth/auth.routes.js';
import pharmacyRoutes from './modules/pharmacy/pharmacy.routes.js';
import orderRoutes from './modules/order/order.routes.js';
import deliveryRoutes from './modules/delivery/delivery.routes.js';
import paymentRoutes from './modules/payment/payment.routes.js';
import chatRoutes from './modules/chat/chat.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import aiRoutes from './modules/ai/ai.routes.js';
import subscriptionRoutes from './modules/subscription/subscription.routes.js';

/**
 * Initialize Firebase Admin SDK synchronously for Cloud Functions.
 * Uses Application Default Credentials (ADC) — no retries needed.
 * The async initializeFirebase() from config/firebase.ts has retry logic
 * and process.exit(1) that can crash the Cloud Run container, so we
 * use a simple synchronous init here instead.
 */
try {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  logger.info('Firebase initialized for Cloud Functions');
} catch (error) {
  // Log but do NOT process.exit — let Cloud Run report the error
  logger.error('Firebase initialization failed in Cloud Functions:', error);
}

// Warn about insecure JWT_SECRET in production (but don't crash)
if (config.JWT_SECRET === 'dev-only-jwt-secret-not-for-production') {
  logger.warn('WARNING: JWT_SECRET is using the insecure default. Set it via: firebase functions:secrets:set JWT_SECRET');
}

// Create Express app
const app = express();

// Security headers — don't rely solely on Cloud Run
app.use(helmet({
  contentSecurityPolicy: false, // CSP handled by frontend
  crossOriginEmbedderPolicy: false, // Allow cross-origin API calls
}));

// CORS
app.use(
  cors({
    origin: getAllowedOrigins(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// Skip rate limiter in Cloud Functions (no Redis available)
// Rate limiting can be handled by Cloud Run's built-in throttling or API Gateway

// Health check
app.get(
  '/health',
  asyncHandler(async (_req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'PharmaConnect Backend is healthy',
      timestamp: new Date(),
    });
  })
);

/**
 * ONE-TIME admin setup endpoint.
 * Creates the initial admin account if no admin exists in Firestore.
 * REMOVE THIS AFTER FIRST USE.
 */
app.post('/setup-admin', asyncHandler(async (_req: Request, res: Response) => {
  const db = admin.firestore();
  const auth = admin.auth();

  // Check if any admin already exists
  const existingAdmins = await db.collection('users')
    .where('role', '==', 'admin')
    .limit(1)
    .get();

  if (!existingAdmins.empty) {
    res.status(409).json({ error: 'Admin account already exists. This endpoint is disabled.' });
    return;
  }

  const ADMIN_EMAIL = 'admin@pharmaconnect.ng';
  const ADMIN_PASSWORD = 'REDACTED_SECRET';

  let uid: string;
  try {
    const existing = await auth.getUserByEmail(ADMIN_EMAIL);
    uid = existing.uid;
  } catch {
    const newUser = await auth.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      displayName: 'Platform Admin',
      phoneNumber: '+2348000000000',
    });
    uid = newUser.uid;
  }

  await auth.setCustomUserClaims(uid, { role: 'admin' });

  const now = new Date();
  await db.collection('users').doc(uid).set({
    id: uid,
    email: ADMIN_EMAIL,
    phoneNumber: '+2348000000000',
    firstName: 'Platform',
    lastName: 'Admin',
    role: 'admin',
    isActive: true,
    isVerified: true,
    createdAt: now,
    updatedAt: now,
  }, { merge: true });

  res.json({
    success: true,
    message: 'Admin account created',
    uid,
    email: ADMIN_EMAIL,
    note: 'REMOVE the /setup-admin endpoint from functions.ts now',
  });
}));

// API routes
const apiV1 = express.Router();
apiV1.use('/auth', authRoutes);
apiV1.use('/pharmacies', pharmacyRoutes);
apiV1.use('/orders', orderRoutes);
apiV1.use('/delivery', deliveryRoutes);
apiV1.use('/payments', paymentRoutes);
apiV1.use('/chat', chatRoutes);
apiV1.use('/admin', adminRoutes);
apiV1.use('/ai', aiRoutes);
apiV1.use('/subscriptions', subscriptionRoutes);
app.use('/api/v1', apiV1);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

/**
 * Firebase Cloud Function v2 — API Handler
 *
 * Memory: 1GiB needed for cold start with heavy deps
 * (firebase-admin, @anthropic-ai/sdk, @sentry/node, ioredis, socket.io)
 */
export const api = onRequest(
  {
    region: 'us-central1',
    timeoutSeconds: 120,
    memory: '1GiB',
    invoker: 'public',
  },
  app
);
