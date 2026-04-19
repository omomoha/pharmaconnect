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

/**
 * DEBUG STEP 2: Core infrastructure + middleware, NO routes.
 * Minimal deploy (step 1) succeeded — now testing if firebase-admin,
 * config, logger, and middleware work in Cloud Run.
 * If this deploys, the issue is in route modules or their dependencies.
 */

// Initialize Firebase Admin SDK
try {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  logger.info('Firebase initialized for Cloud Functions');
} catch (error) {
  logger.error('Firebase initialization failed in Cloud Functions:', error);
}

// Warn about insecure JWT_SECRET
if (config.JWT_SECRET === 'dev-only-jwt-secret-not-for-production') {
  logger.warn('WARNING: JWT_SECRET is using the insecure default.');
}

const app = express();

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
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

// Health check
app.get(
  '/health',
  asyncHandler(async (_req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'PharmaConnect Backend is healthy (debug step 2 — no routes)',
      timestamp: new Date(),
    });
  })
);

// Stub API routes — routes disabled for deploy debugging
app.use('/api/v1', (_req: Request, res: Response) => {
  res.json({ message: 'Debug step 2 — routes disabled, testing core infrastructure' });
});

app.use(notFoundHandler);
app.use(errorHandler);

export const api = onRequest(
  {
    region: 'us-central1',
    timeoutSeconds: 120,
    memory: '1GiB',
    invoker: 'public',
  },
  app
);
