import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger.js";

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

/**
 * Global error handler middleware
 * Should be registered after all other middleware and routes
 */
export const errorHandler = (
  error: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = (error as AppError).statusCode || 500;
  const code = (error as AppError).code || "INTERNAL_SERVER_ERROR";
  const message = error.message || "An unexpected error occurred";
  const details = (error as AppError).details;

  // Log error
  if (statusCode >= 500) {
    logger.error("Server error:", {
      statusCode,
      code,
      message,
      stack: error.stack,
      url: req.url,
      method: req.method,
    });
  } else {
    logger.warn("Client error:", {
      statusCode,
      code,
      message,
    });
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  });
};

/**
 * 404 handler - should be registered after all routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.path} not found`,
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
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
