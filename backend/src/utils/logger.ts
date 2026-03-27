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

export default logger;
