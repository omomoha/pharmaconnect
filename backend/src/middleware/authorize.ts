import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./authenticate.js";
import { UserRole } from "@pharmaconnect/shared/dist/types/index.js";

/**
 * Role-based authorization middleware
 * Checks if user has one of the specified roles
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        },
      });
      return;
    }

    if (!req.user.role || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Insufficient permissions to access this resource",
        },
      });
      return;
    }

    next();
  };
};

/**
 * Ownership authorization middleware
 * Checks if user owns the resource (by UID)
 */
export const authorizeOwner = (uidParamName: string = "userId") => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        },
      });
      return;
    }

    const resourceUid = req.params[uidParamName] || req.body.userId;

    if (req.user.uid !== resourceUid) {
      res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to access this resource",
        },
      });
      return;
    }

    next();
  };
};

/**
 * Check multiple conditions for authorization
 */
export const authorizeCustom = (
  checkFn: (req: AuthenticatedRequest) => boolean
) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        },
      });
      return;
    }

    if (!checkFn(req)) {
      res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Access denied",
        },
      });
      return;
    }

    next();
  };
};
