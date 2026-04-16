import winston from "winston";
import path from "path";
import fs from "fs";
import config from "../config/index.js";

// Detect Cloud Functions environment (read-only filesystem)
const isCloudFunctions = !!process.env.K_SERVICE || !!process.env.FUNCTION_TARGET;

const logDir = config.LOG_FILE_PATH;

// Create log directory only if NOT in Cloud Functions
if (!isCloudFunctions) {
  try {
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  } catch (_error) {
    // Silently ignore — log files won't be written
  }
}

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...rest }) => {
    const restString = Object.keys(rest).length ? JSON.stringify(rest) : "";
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${restString}`;
  })
);

// Build transports — file transports only for local/non-serverless environments
const transports: winston.transport[] = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }),
];

if (!isCloudFunctions && config.NODE_ENV !== "test") {
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logDir, "combined.log"),
      maxsize: 5242880,
      maxFiles: 5,
    })
  );
}

const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: logFormat,
  defaultMeta: { service: "pharmaconnect-backend" },
  transports,
});

/**
 * Sanitize sensitive data from objects before logging
 * Masks:
 *   - Email addresses: ab***@domain.com
 *   - Phone numbers: +234***1234
 *   - Payment references: first 4 chars + ***
 *
 * @param obj - Object or value to sanitize
 * @returns Sanitized copy of the object
 */
export function sanitizeLogs(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "string") {
    // Email pattern
    if (obj.includes("@")) {
      return obj.replace(/([a-zA-Z0-9])[a-zA-Z0-9]*([a-zA-Z0-9])@/g, "$1***$2@");
    }
    // Phone pattern (starts with + or has 10+ digits)
    if (obj.match(/^\+[\d\s\-()]+$/) || obj.match(/\d{10,}/)) {
      const visible = obj.substring(0, Math.max(4, obj.length - 4));
      return visible + "***" + obj.substring(obj.length - 4);
    }
    // Payment reference pattern (common prefixes: ref_, txn_, pid_)
    if (obj.match(/^(ref_|txn_|pid_|pref_)[a-zA-Z0-9]+$/i)) {
      return obj.substring(0, 4) + "***";
    }
    return obj;
  }

  if (typeof obj === "object") {
    if (Array.isArray(obj)) {
      return obj.map((item) => sanitizeLogs(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Common sensitive field names
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes("email") ||
        lowerKey.includes("phone") ||
        lowerKey.includes("password") ||
        lowerKey.includes("token") ||
        lowerKey.includes("secret") ||
        lowerKey.includes("key") ||
        lowerKey.includes("credential") ||
        lowerKey.includes("authorization") ||
        lowerKey.includes("payment") ||
        lowerKey.includes("reference")
      ) {
        sanitized[key] = sanitizeLogs(value);
      } else {
        sanitized[key] = typeof value === "object" ? sanitizeLogs(value) : value;
      }
    }
    return sanitized;
  }

  return obj;
}

export default logger;
