import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger.js";
import { AuthenticatedRequest } from "./authenticate.js";

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string;
}

// ─── In-Memory Fallback Store ─────────────────────────────────────────────────
// Used when Redis is unavailable. LRU-style cleanup prevents unbounded growth.

interface MemoryEntry {
  count: number;
  expiresAt: number;
}

const MEM_MAX_KEYS = 10_000;
const memoryStore = new Map<string, MemoryEntry>();

function memoryIncr(key: string, windowMs: number): number {
  const now = Date.now();

  // Periodic cleanup: evict expired entries when store is large
  if (memoryStore.size > MEM_MAX_KEYS) {
    for (const [k, v] of memoryStore) {
      if (v.expiresAt <= now) memoryStore.delete(k);
    }
  }

  const entry = memoryStore.get(key);

  if (!entry || entry.expiresAt <= now) {
    memoryStore.set(key, { count: 1, expiresAt: now + windowMs });
    return 1;
  }

  entry.count += 1;
  return entry.count;
}

// ─── Redis helpers ────────────────────────────────────────────────────────────

let _redis: any = null;
let _redisAvailable = true;
let _redisCheckAt = 0;

function getRedisClient(): any {
  if (!_redisAvailable && Date.now() < _redisCheckAt) return null;
  try {
    // Lazy import to avoid crash if Redis not initialized
    if (!_redis) {
      const { redis } = require("../config/redis.js");
      _redis = redis;
    }
    if (!_redis || _redis.status !== "ready") {
      _redisAvailable = false;
      _redisCheckAt = Date.now() + 30_000; // retry every 30s
      return null;
    }
    _redisAvailable = true;
    return _redis;
  } catch {
    _redisAvailable = false;
    _redisCheckAt = Date.now() + 30_000;
    return null;
  }
}

// ─── Rate Limiter Factory ─────────────────────────────────────────────────────

/**
 * Create rate limiter middleware with Redis primary + in-memory fallback.
 * When Redis is down, enforcement continues via a local Map store so that
 * rate limiting is never fully bypassed.
 */
const createRateLimiter = (options: RateLimitOptions) => {
  return async (
    req: Request | AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const identifier = getIdentifier(req);
    const key = `ratelimit:${identifier}`;

    let current: number;

    try {
      const redis = getRedisClient();

      if (redis) {
        // Primary: Redis
        current = await redis.incr(key);
        if (current === 1) {
          await redis.expire(key, Math.ceil(options.windowMs / 1000));
        }
      } else {
        // Fallback: in-memory
        current = memoryIncr(key, options.windowMs);
      }
    } catch (error) {
      // Redis threw at runtime — fall back to memory for this request
      logger.warn("Rate limiter Redis error, using in-memory fallback:", error);
      _redisAvailable = false;
      _redisCheckAt = Date.now() + 30_000;
      current = memoryIncr(key, options.windowMs);
    }

    const remaining = Math.max(0, options.maxRequests - current);

    res.setHeader("X-RateLimit-Limit", options.maxRequests);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", Date.now() + options.windowMs);

    if (current > options.maxRequests) {
      logger.warn(`Rate limit exceeded for ${identifier}`);
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
