import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import express, { Request, Response } from 'express';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { getAllowedOrigins } from './config/index.js';
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

// Create Express app
const app = express();

// Middleware (skip helmet — Cloud Run handles security headers)
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

// API routes
const apiV1 = express.Router();
apiV1.use('/auth', authRoutes);
apiV1.use('/pharmacies', pharmacyRoutes);
apiV1.use('/orders', orderRoutes);
apiV1.use('/delivery', deliveryRoutes);
apiV1.use('/payments', paymentRoutes);
apiV1.use('/chat', chatRoutes);
apiV1.use('/admin', adminRoutes);
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
