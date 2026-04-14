import crypto from "crypto";
import config from "../config/index.js";
import logger from "./logger.js";

/**
 * PII Encryption Utility
 *
 * Encrypts sensitive fields (driver licenses, CAC certificates, bank accounts)
 * before storing in Firestore. Uses AES-256-GCM for authenticated encryption.
 *
 * Usage:
 *   const encrypted = PiiEncryption.encrypt("sensitive-data");
 *   const decrypted = PiiEncryption.decrypt(encrypted);
 *
 * The encryption key should be set via ENCRYPTION_KEY environment variable.
 * In production, use a 32-byte hex string (64 hex characters).
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128-bit IV for GCM
const AUTH_TAG_LENGTH = 16; // 128-bit auth tag

let _startupKeyValidated = false;

function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;

  if (!keyHex || keyHex.length < 64) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "CRITICAL: ENCRYPTION_KEY must be a 64-character hex string in production. " +
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\" " +
        "Then set it via: firebase functions:secrets:set ENCRYPTION_KEY"
      );
    }
    if (!_startupKeyValidated) {
      logger.warn(
        "⚠️  ENCRYPTION_KEY not set — using dev fallback derived from JWT_SECRET. " +
        "This is NOT safe for production. Set ENCRYPTION_KEY env var before deploying."
      );
      _startupKeyValidated = true;
    }
    // Dev fallback — deterministic key derived from JWT_SECRET
    return crypto
      .createHash("sha256")
      .update(config.JWT_SECRET)
      .digest();
  }

  // Validate key is valid hex and exactly 32 bytes
  if (!/^[0-9a-fA-F]{64}$/.test(keyHex)) {
    throw new Error(
      "ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes). " +
      "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }

  return Buffer.from(keyHex, "hex");
}

/**
 * Validate encryption configuration at startup.
 * Call once during app initialization to surface config issues early.
 */
export function validateEncryptionConfig(): void {
  try {
    getEncryptionKey();
    _startupKeyValidated = true;
    if (process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length === 64) {
      logger.info("Encryption key validated successfully");
    }
  } catch (error) {
    // Re-throw in production — app must not start without encryption key
    if (process.env.NODE_ENV === "production") {
      throw error;
    }
    logger.warn("Encryption config validation warning:", (error as Error).message);
  }
}

export class PiiEncryption {
  /**
   * Encrypt a plaintext string. Returns a base64 string: iv:authTag:ciphertext
   */
  static encrypt(plaintext: string): string {
    try {
      const key = getEncryptionKey();
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
        authTagLength: AUTH_TAG_LENGTH,
      });

      let encrypted = cipher.update(plaintext, "utf8", "base64");
      encrypted += cipher.final("base64");
      const authTag = cipher.getAuthTag();

      // Format: iv:authTag:ciphertext (all base64)
      return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
    } catch (error) {
      logger.error("Encryption failed:", error);
      throw new Error("Failed to encrypt data");
    }
  }

  /**
   * Decrypt a previously encrypted string
   */
  static decrypt(encryptedData: string): string {
    try {
      const parts = encryptedData.split(":");
      if (parts.length !== 3) {
        throw new Error("Invalid encrypted data format");
      }

      const [ivB64, authTagB64, ciphertext] = parts;
      const key = getEncryptionKey();
      const iv = Buffer.from(ivB64, "base64");
      const authTag = Buffer.from(authTagB64, "base64");

      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
        authTagLength: AUTH_TAG_LENGTH,
      });
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(ciphertext, "base64", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error) {
      logger.error("Decryption failed:", error);
      throw new Error("Failed to decrypt data");
    }
  }

  /**
   * Check if a string looks like it's already encrypted (has our iv:tag:cipher format)
   */
  static isEncrypted(value: string): boolean {
    const parts = value.split(":");
    return parts.length === 3 && parts.every((p) => p.length > 0);
  }

  /**
   * Encrypt multiple fields in an object. Returns a new object with specified fields encrypted.
   */
  static encryptFields<T extends Record<string, any>>(
    data: T,
    fieldNames: (keyof T)[]
  ): T {
    const result = { ...data };
    for (const field of fieldNames) {
      const value = result[field];
      if (typeof value === "string" && value.length > 0 && !this.isEncrypted(value)) {
        (result as any)[field] = this.encrypt(value);
      }
    }
    return result;
  }

  /**
   * Decrypt multiple fields in an object. Returns a new object with specified fields decrypted.
   */
  static decryptFields<T extends Record<string, any>>(
    data: T,
    fieldNames: (keyof T)[]
  ): T {
    const result = { ...data };
    for (const field of fieldNames) {
      const value = result[field];
      if (typeof value === "string" && this.isEncrypted(value)) {
        try {
          (result as any)[field] = this.decrypt(value);
        } catch {
          // If decryption fails, leave value as-is (might be plaintext from before encryption was enabled)
          logger.warn(`Could not decrypt field "${String(field)}" — may be plaintext legacy data`);
        }
      }
    }
    return result;
  }
}
