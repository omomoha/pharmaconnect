import Redis from "ioredis";
import config from "./index.js";
import logger from "../utils/logger.js";

let redis: Redis;

/**
 * Initialize Redis connection
 */
export const initializeRedis = (): Redis => {
  try {
    redis = new Redis(config.REDIS_URL, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    redis.on("connect", () => {
      logger.info("Redis connected successfully");
    });

    redis.on("error", (error) => {
      logger.error("Redis connection error:", error);
    });

    redis.on("close", () => {
      logger.warn("Redis connection closed");
    });

    return redis;
  } catch (error) {
    logger.error("Failed to initialize Redis:", error);
    throw error;
  }
};

/**
 * Get Redis instance
 */
export const getRedis = (): Redis => {
  if (!redis) {
    throw new Error("Redis not initialized. Call initializeRedis() first.");
  }
  return redis;
};

export { redis };
