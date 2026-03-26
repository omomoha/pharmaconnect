import { Response } from "express";
import { AuthenticatedRequest } from "../../middleware/authenticate.js";
import { AuthService } from "./auth.service.js";
import { apiResponse } from "../../utils/helpers.js";
import logger from "../../utils/logger.js";
import { z } from "zod";
import { UserRole } from "@pharmaconnect/shared/dist/types/index.js";

/**
 * Auth Controller
 */
export class AuthController {
  /**
   * POST /setup-profile
   * Create Firestore profile and set custom claims after Firebase signup
   * Called by client after successful Firebase registration
   */
  static async setupProfile(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(
          apiResponse(false, undefined, {
            code: "UNAUTHORIZED",
            message: "User not authenticated",
          })
        );
        return;
      }

      const setupSchema = z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        phoneNumber: z.string().min(10),
        role: z.nativeEnum(UserRole),
      });

      const validated = setupSchema.parse(req.body);

      // Check if profile already exists
      const existing = await AuthService.getUserProfile(req.user.uid);
      if (existing) {
        res.status(409).json(
          apiResponse(false, undefined, {
            code: "PROFILE_ALREADY_EXISTS",
            message: "User profile already exists",
          })
        );
        return;
      }

      // Create profile
      const profile = await AuthService.createUserProfile(req.user.uid, {
        email: req.user.email,
        phoneNumber: validated.phoneNumber,
        firstName: validated.firstName,
        lastName: validated.lastName,
        role: validated.role as UserRole,
      });

      logger.info(`Profile setup completed for user ${req.user.uid}`);

      res.status(201).json(
        apiResponse(true, {
          user: profile,
        })
      );
    } catch (error) {
      logger.error("Profile setup error:", error);
      res.status(500).json(
        apiResponse(false, undefined, {
          code: "PROFILE_SETUP_FAILED",
          message: "Failed to setup user profile",
        })
      );
    }
  }

  /**
   * GET /me
   * Get current user profile
   */
  static async getProfile(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(
          apiResponse(false, undefined, {
            code: "UNAUTHORIZED",
            message: "User not authenticated",
          })
        );
        return;
      }

      const profile = await AuthService.getUserProfile(req.user.uid);

      if (!profile) {
        res.status(404).json(
          apiResponse(false, undefined, {
            code: "USER_NOT_FOUND",
            message: "User profile not found",
          })
        );
        return;
      }

      res.json(apiResponse(true, { user: profile }));
    } catch (error) {
      logger.error("Get profile error:", error);
      res.status(500).json(
        apiResponse(false, undefined, {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve profile",
        })
      );
    }
  }

  /**
   * PUT /me
   * Update user profile
   */
  static async updateProfile(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(
          apiResponse(false, undefined, {
            code: "UNAUTHORIZED",
            message: "User not authenticated",
          })
        );
        return;
      }

      const updateSchema = z.object({
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        address: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        profileImageUrl: z.string().url().optional(),
      });

      const validated = updateSchema.parse(req.body);

      const updated = await AuthService.updateUserProfile(req.user.uid, validated);

      // Clear cache
      await AuthService.clearUserCache(req.user.uid);

      logger.info(`Profile updated for user ${req.user.uid}`);

      res.json(apiResponse(true, { user: updated }));
    } catch (error) {
      logger.error("Update profile error:", error);
      res.status(500).json(
        apiResponse(false, undefined, {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update profile",
        })
      );
    }
  }
}
