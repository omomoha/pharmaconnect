import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),

  // Firebase (optional in Cloud Functions — ADC handles auth automatically)
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_STORAGE_BUCKET: z.string().optional(),

  // Redis
  REDIS_URL: z.string().url().default("redis://localhost:6379"),

  // Paystack (optional for initial deployment — set via Cloud Functions secrets)
  PAYSTACK_SECRET_KEY: z.string().optional(),
  PAYSTACK_PUBLIC_KEY: z.string().optional(),

  // OpenAI
  OPENAI_API_KEY: z.string().optional(),

  // URLs
  CLIENT_URL: z.string().url().default("http://localhost:3000"),
  ADMIN_URL: z.string().url().default("http://localhost:3001"),

  // JWT
  JWT_SECRET: z.string().default("your-jwt-secret-key-change-in-production"),

  // Logging
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  LOG_FILE_PATH: z.string().default("./logs"),

  // CORS
  ALLOWED_ORIGINS: z.string().default("http://localhost:3000,http://localhost:3001,https://pharmaconnect-frontend-pi.vercel.app,https://pharmaconnect-frontend-git-main-omomohas-projects.vercel.app"),
});

type EnvConfig = z.infer<typeof envSchema>;

let config: EnvConfig;

try {
  config = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error("Environment validation error:", error.errors);
    // In Cloud Functions, throwing is safer than process.exit (allows error reporting)
    if (process.env.K_SERVICE || process.env.FUNCTION_TARGET) {
      throw new Error(`Environment validation failed: ${JSON.stringify(error.errors)}`);
    }
    process.exit(1);
  }
  throw error;
}

export default config;

export const getAllowedOrigins = (): string[] => {
  return config.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim());
};
