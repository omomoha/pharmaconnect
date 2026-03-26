import { randomBytes } from "crypto";
import { ApiResponse } from "@pharmaconnect/shared/dist/types/index.js";

/**
 * Generate order number: "ORD-20260326-A1B2"
 */
export const generateOrderNumber = (): string => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const randomStr = randomBytes(2).toString("hex").toUpperCase();
  return `ORD-${dateStr}-${randomStr}`;
};

/**
 * Generate cryptographically secure 6-digit security code
 */
export const generateSecurityCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export const calculateDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Standard API response formatter
 */
export const apiResponse = <T>(
  success: boolean,
  data?: T,
  error?: { code: string; message: string; details?: unknown }
): ApiResponse<T> => {
  return {
    success,
    ...(data !== undefined && { data }),
    ...(error && { error }),
  };
};

/**
 * Basic XSS prevention - sanitize string input
 */
export const sanitizeString = (str: string): string => {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
};

/**
 * Extract JWT token from Authorization header
 */
export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return null;
  }

  return parts[1];
};

/**
 * Generate pagination metadata
 */
export const getPaginationMeta = (
  page: number,
  limit: number,
  total: number
) => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

/**
 * Convert Firestore timestamp to Date
 */
export const firestoreTimestampToDate = (timestamp: any): Date => {
  if (timestamp && typeof timestamp.toDate === "function") {
    return timestamp.toDate();
  }
  return new Date(timestamp);
};

/**
 * Format currency value to 2 decimal places
 */
export const formatCurrency = (value: number): number => {
  return Math.round(value * 100) / 100;
};

/**
 * Check if email is valid format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Check if phone number is valid format
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[0-9]{10,15}$/;
  return phoneRegex.test(phone.replace(/\D/g, ""));
};

/**
 * Get time remaining in seconds until expiry
 */
export const getTimeUntilExpiry = (expiryTime: Date): number => {
  const now = new Date();
  const secondsRemaining = Math.floor((expiryTime.getTime() - now.getTime()) / 1000);
  return Math.max(0, secondsRemaining);
};

/**
 * Retry async function with exponential backoff
 */
export const retryAsync = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
    }
  }
  throw new Error("Max retries exceeded");
};
