import { onRequest } from 'firebase-functions/v2/https';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { initializeFirebase } from './config/firebase.js';
import { getAllowedOrigins } from './config/index.js';
import logger from './utils/logger.js';
import {
  errorHandler,
  notFoundHandler,
  asyncHandler,
} from './middleware/errorHandler.js';
import { publicRateLimiter } from './middleware/rateLimiter.js';

// Import routes
import authRoutes from './modules/auth/auth.routes.js';
import pharmacyRoutes from './modules/pharmacy/pharmacy.routes.js';
import orderRoutes from './modules/order/order.routes.js';
import deliveryRoutes from './modules/delivery/delivery.routes.js';
import paymentRoutes from './modules/payment/payment.routes.js';
import chatRoutes from './modules/chat/chat.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';

// Initialize Firebase Admin SDK
initializeFirebase();
logger.info('Firebase initialized for Cloud Functions');

// Create a lightweight Express app for Cloud Functions (no HTTP server, no Socket.IO)
const app = express();

// Middleware
app.use(helmet());
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
app.use(
  morgan(':method :url :status :res[content-length] - :response-time ms', {
    stream: {
      write: (message: string) => {
        logger.info(message.trim());
      },
    },
  })
);
app.use(publicRateLimiter);

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
