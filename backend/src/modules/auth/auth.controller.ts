import { Response } from "express";
import { AuthenticatedRequest } from "../../middleware/authenticate.js";
import { AuthService } from "./auth.service.js";
import { MalPayService } from "../../services/malpay.service.js";
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
   * POST /register-malpay
   * Register the current PharmaConnect user on MalPay.
   * Called by the client after successful PharmaConnect registration
   * when the user opts in to MalPay registration.
   */
  static async registerOnMalPay(
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

      // Get user profile to extract name and phone
      const profile = await AuthService.getUserProfile(req.user.uid);
      if (!profile) {
        res.status(404).json(
          apiResponse(false, undefined, {
            code: "PROFILE_NOT_FOUND",
            message: "Please complete your profile setup first",
          })
        );
        return;
      }

      const malpayService = new MalPayService();
      const result = await malpayService.registerUser({
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        phoneNumber: profile.phoneNumber,
        partnerUserId: req.user.uid,
      });

      if (result.success) {
        logger.info(`MalPay registration initiated for user ${req.user.uid}`);
        res.status(200).json(
          apiResponse(true, {
            malpayUserId: result.userId,
            isExisting: result.isExisting,
            message: result.isExisting
              ? "You already have a MalPay account"
              : "MalPay account created. Check your email to set your password.",
          })
        );
      } else {
        res.status(200).json(
          apiResponse(true, {
            message: "MalPay registration could not be completed at this time. You can try again later.",
            malpayRegistered: false,
          })
        );
      }
    } catch (error) {
      logger.error("MalPay registration error:", error);
      // Don't fail the response — MalPay registration is best-effort
      res.status(200).json(
        apiResponse(true, {
          message: "MalPay registration could not be completed at this time.",
          malpayRegistered: false,
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
