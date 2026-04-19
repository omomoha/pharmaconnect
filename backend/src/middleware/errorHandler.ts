import { Request, Response, NextFunction } from "express";
import logger, { sanitizeLogs } from "../utils/logger.js";

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

const isProduction = process.env.NODE_ENV === "production";

/**
 * Generate a unique error ID for tracking and support reference
 */
function generateErrorId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `ERR-${timestamp}-${random}`.toUpperCase();
}

/**
 * Global error handler middleware
 * Should be registered after all other middleware and routes
 *
 * In production:
 *   - 5xx errors return a generic message (no internal details leak)
 *   - 4xx errors return the specific message (client needs actionable info)
 *   - Stack traces and internal details are NEVER sent to the client
 *   - Full context is always logged server-side with error ID for correlation
 *   - Error ID is returned to client for support reference
 */
export const errorHandler = (
  error: AppError | Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = (error as AppError).statusCode || 500;
  const code = (error as AppError).code || "INTERNAL_SERVER_ERROR";
  const message = error.message || "An unexpected error occurred";
  const details = (error as AppError).details;
  const errorId = generateErrorId();

  // Always log the full error server-side with error ID for correlation
  // Sanitize request body before logging to prevent leaking sensitive data
  const sanitizedBody = sanitizeLogs(req.body);

  if (statusCode >= 500) {
    logger.error("Server error:", {
      errorId,
      statusCode,
      code,
      message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      body: sanitizedBody,
    });
  } else {
    logger.warn("Client error:", {
      errorId,
      statusCode,
      code,
      message,
      url: req.url,
      method: req.method,
      body: sanitizedBody,
    });
  }

  // Build client response — suppress internals in production for 5xx
  const errorResponse: any = {
    success: false,
    error: {
      errorId,
      code: isProduction && statusCode >= 500 ? "INTERNAL_SERVER_ERROR" : code,
      message:
        isProduction && statusCode >= 500
          ? "An unexpected error occurred. Please try again later."
          : message,
    },
  };

  // Only forward details for 4xx errors (validation, etc.) — never for 5xx
  if (details && statusCode < 500) {
    errorResponse.error.details = details;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * 404 handler - should be registered after all routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log the actual path server-side for debugging, but don't reflect
  // the full path to the client (prevents endpoint enumeration)
  logger.debug(`404: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "The requested resource was not found",
    },
  });
};

/**
 * Utility to create an AppError
 */
export const createAppError = (
  message: string,
  statusCode: number = 500,
  code: string = "INTERNAL_SERVER_ERROR",
  details?: unknown
): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  return error;
};

/**
 * Async route handler wrapper to catch errors
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): Promise<void> => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
