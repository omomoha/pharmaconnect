import { Request, Response, NextFunction } from "express";
import { getRedis } from "../config/redis.js";
import logger from "../utils/logger.js";
import { AuthenticatedRequest } from "./authenticate.js";

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string;
}

/**
 * Create rate limiter middleware using Redis
 */
const createRateLimiter = (options: RateLimitOptions) => {
  return async (
    req: Request | AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const redis = getRedis();
      const key = `ratelimit:${getIdentifier(req)}`;

      const current = await redis.incr(key);

      if (current === 1) {
        // Set expiry on first request
        await redis.expire(key, Math.ceil(options.windowMs / 1000));
      }

      const remaining = Math.max(0, options.maxRequests - current);

      res.setHeader("X-RateLimit-Limit", options.maxRequests);
      res.setHeader("X-RateLimit-Remaining", remaining);
      res.setHeader("X-RateLimit-Reset", Date.now() + options.windowMs);

      if (current > options.maxRequests) {
        logger.warn(`Rate limit exceeded for ${getIdentifier(req)}`);
        res.status(429).json({
          success: false,
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: options.message || "Too many requests, please try again later",
          },
        });
        return;
      }

      next();
    } catch (error) {
      logger.error("Rate limiter error:", error);
      // Continue on error to prevent service disruption
      next();
    }
  };
};

/**
 * Get identifier for rate limiting (IP or user ID)
 */
const getIdentifier = (req: Request | AuthenticatedRequest): string => {
  const authReq = req as AuthenticatedRequest;
  if (authReq.user?.uid) {
    return `user:${authReq.user.uid}`;
  }
  return `ip:${req.ip || req.socket.remoteAddress || "unknown"}`;
};

/**
 * Public rate limiter: 60 requests per minute
 */
export const publicRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60,
  message: "Too many requests from this IP, please try again later",
});

/**
 * Authenticated rate limiter: 120 requests per minute
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 120,
  message: "Too many requests, please try again later",
});

/**
 * Admin rate limiter: 300 requests per minute
 */
export const adminRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 300,
  message: "Rate limit exceeded for admin operations",
});

/**
 * Strict rate limiter: 10 requests per minute
 * Used for sensitive operations like password reset, OTP requests
 */
export const strictRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
  message: "Too many attempts, please try again later",
});

/**
 * Custom rate limiter factory
 */
export const createCustomRateLimiter = (requestsPerMinute: number) => {
  return createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: requestsPerMinute,
  });
};
