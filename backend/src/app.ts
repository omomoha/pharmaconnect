import express, { Express, Request, Response, NextFunction } from "express";
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
import { initializeChatSocket } from "./modules/chat/chat.socket.js";

// Import routes
import authRoutes from "./modules/auth/auth.routes.js";
import pharmacyRoutes from "./modules/pharmacy/pharmacy.routes.js";
import orderRoutes from "./modules/order/order.routes.js";
import deliveryRoutes from "./modules/delivery/delivery.routes.js";
import paymentRoutes from "./modules/payment/payment.routes.js";
import chatRoutes from "./modules/chat/chat.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";

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

  // Body parsing
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));

  // Store raw body for Paystack webhook verification
  app.use((req: Request, _res: Response, next: NextFunction) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      (req as any).rawBody = data;
      next();
    });
  });

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

  // ===== Routes =====

  // Health check
  app.get(
    "/health",
    asyncHandler(async (_req, res) => {
      res.json({
        success: true,
        message: "PharmaConnect Backend is healthy",
        timestamp: new Date(),
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

  app.use("/api/v1", apiV1);

  // ===== Socket.IO Setup =====
  initializeChatSocket(io);

  // ===== Error Handling =====

  // 404 handler
  app.use(notFoundHandler);

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
    // Initialize Firebase Admin SDK
    initializeFirebase();
    logger.info("Firebase initialized");

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
