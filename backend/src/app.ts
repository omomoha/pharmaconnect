import express, { Express } from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import config, { getAllowedOrigins } from "./config/index.js";
import { initializeFirebase } from "./config/firebase.js";
import { initializeRedis } from "./config/redis.js";
import logger from "./utils/logger.js";
import {
  errorHandler,
  notFoundHandler,
  asyncHandler,
} from "./middleware/errorHandler.js";
import { publicRateLimiter } from "./middleware/rateLimiter.js";
import { secFetchValidator } from "./middleware/secFetchValidator.js";
import { initializeChatSocket } from "./modules/chat/chat.socket.js";
import { validateEncryptionConfig } from "./utils/encryption.js";
import { initializeMonitoring, setupSentryErrorHandler } from "./config/monitoring.js";
import { readFileSync } from "fs";
import { join } from "path";

// Import routes
import authRoutes from "./modules/auth/auth.routes.js";
import pharmacyRoutes from "./modules/pharmacy/pharmacy.routes.js";
import orderRoutes from "./modules/order/order.routes.js";
import deliveryRoutes from "./modules/delivery/delivery.routes.js";
import paymentRoutes from "./modules/payment/payment.routes.js";
import chatRoutes from "./modules/chat/chat.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import aiRoutes from "./modules/ai/ai.routes.js";
import subscriptionRoutes from "./modules/subscription/subscription.routes.js";

/**
 * Create and configure Express app
 */
export const createApp = (): {
  app: Express;
  io: SocketIOServer;
  httpServer: ReturnType<typeof createServer>;
} => {
  const app = express();
  const httpServer = createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: getAllowedOrigins(),
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // ===== Middleware =====

  // Security
  app.use(helmet());

  // CORS
  app.use(
    cors({
      origin: getAllowedOrigins(),
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // Compression
  app.use(compression());

  // Body parsing with raw body capture for Paystack webhook verification
  app.use(
    express.json({
      limit: "10mb",
      verify: (req: any, _res, buf) => {
        req.rawBody = buf.toString();
      },
    })
  );
  app.use(express.urlencoded({ limit: "10mb", extended: true }));

  // Cookie parser
  app.use(cookieParser());

  // Logging
  app.use(
    morgan(":method :url :status :res[content-length] - :response-time ms", {
      stream: {
        write: (message: string) => {
          logger.info(message.trim());
        },
      },
    })
  );

  // Rate limiting
  app.use(publicRateLimiter);

  // Sec-Fetch-Site validation for CSRF protection (applied to all routes)
  app.use(secFetchValidator);

  // ===== Routes =====

  // Health check
  app.get(
    "/health",
    asyncHandler(async (_req, res) => {
      let version = "1.0.0";
      try {
        const packageJsonPath = join(process.cwd(), "package.json");
        const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
        version = packageJson.version || version;
      } catch (_err) {
        // Fallback to default version if file read fails
      }

      res.json({
        success: true,
        status: "healthy",
        message: "PharmaConnect Backend is healthy",
        timestamp: new Date().toISOString(),
        version,
        environment: config.NODE_ENV,
        uptime: process.uptime(),
      });
    })
  );

  // API routes
  const apiV1 = express.Router();

  apiV1.use("/auth", authRoutes);
  apiV1.use("/pharmacies", pharmacyRoutes);
  apiV1.use("/orders", orderRoutes);
  apiV1.use("/delivery", deliveryRoutes);
  apiV1.use("/payments", paymentRoutes);
  apiV1.use("/chat", chatRoutes);
  apiV1.use("/admin", adminRoutes);
  apiV1.use("/ai", aiRoutes);
  apiV1.use("/subscriptions", subscriptionRoutes);

  app.use("/api/v1", apiV1);

  // ===== Socket.IO Setup =====
  initializeChatSocket(io);

  // ===== Error Handling =====

  // 404 handler
  app.use(notFoundHandler);

  // Sentry error handler (must be before global error handler)
  setupSentryErrorHandler(app);

  // Global error handler
  app.use(errorHandler);

  return { app, io, httpServer };
};

/**
 * Initialize and start the server
 */
export const startServer = async (): Promise<{
  httpServer: ReturnType<typeof createServer>;
  io: SocketIOServer;
}> => {
  try {
    // Global unhandledRejection handler for async errors
    process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      // In production, you might want to alert monitoring services
      // For now, we just log it
    });

    // Initialize monitoring (Sentry — noop if SENTRY_DSN not set)
    initializeMonitoring();

    // Initialize Firebase Admin SDK with retry logic
    await initializeFirebase();
    logger.info("Firebase initialized");

    // Validate encryption configuration (fails fast in production if key missing)
    validateEncryptionConfig();

    // Initialize Redis
    initializeRedis();
    logger.info("Redis initialized");

    // Create app
    const { io, httpServer } = createApp();

    // Start server
    const port = config.PORT;
    httpServer.listen(port, () => {
      logger.info(`PharmaConnect Backend listening on port ${port}`);
      logger.info(`Environment: ${config.NODE_ENV}`);
      logger.info(`API Base: http://localhost:${port}/api/v1`);
    });

    return { httpServer, io };
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};
