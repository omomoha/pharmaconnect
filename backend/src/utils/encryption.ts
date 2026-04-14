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

function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;

  if (!keyHex || keyHex.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "ENCRYPTION_KEY must be set in production. Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
      );
    }
    // Dev fallback — deterministic key derived from JWT_SECRET
    return crypto
      .createHash("sha256")
      .update(config.JWT_SECRET)
      .digest();
  }

  return Buffer.from(keyHex, "hex");
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
