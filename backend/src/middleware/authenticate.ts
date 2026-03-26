import { Request, Response, NextFunction } from "express";
import { getAuth } from "../config/firebase.js";
import { extractTokenFromHeader } from "../utils/helpers.js";
import logger from "../utils/logger.js";
import { UserRole } from "@pharmaconnect/shared/dist/types/index.js";

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role?: UserRole;
  };
  token?: string;
}

/**
 * Firebase Authentication Middleware
 * Verifies ID token and attaches user info to request
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: "MISSING_AUTH_TOKEN",
          message: "Authorization token is required",
        },
      });
      return;
    }

    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);

    // Get custom claims (role)
    const userRecord = await auth.getUser(decodedToken.uid);
    const customClaims = userRecord.customClaims || {};

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || "",
      role: customClaims.role as UserRole,
    };
    req.token = token;

    next();
  } catch (error) {
    logger.warn("Authentication error:", error);

    if (error instanceof Error && error.message.includes("Token has expired")) {
      res.status(401).json({
        success: false,
        error: {
          code: "TOKEN_EXPIRED",
          message: "Authorization token has expired",
        },
      });
      return;
    }

    res.status(401).json({
      success: false,
      error: {
        code: "INVALID_AUTH_TOKEN",
        message: "Invalid or malformed authorization token",
      },
    });
  }
};

/**
 * Optional authentication middleware
 * Authenticates user if token is provided, otherwise allows anonymous access
 */
export const optionalAuthenticate = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      next();
      return;
    }

    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);
    const userRecord = await auth.getUser(decodedToken.uid);
    const customClaims = userRecord.customClaims || {};

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || "",
      role: customClaims.role as UserRole,
    };
    req.token = token;

    next();
  } catch (error) {
    logger.warn("Optional authentication error:", error);
    // Continue without auth
    next();
  }
};
