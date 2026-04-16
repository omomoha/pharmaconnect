import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { GDPRController } from "./gdpr.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { asyncHandler } from "../../middleware/errorHandler.js";
import { strictRateLimiter, authRateLimiter } from "../../middleware/rateLimiter.js";

const router = Router();

/**
 * Auth Routes
 */

// POST /api/v1/auth/setup-profile - Setup user profile after Firebase signup
router.post(
  "/setup-profile",
  authenticate,
  strictRateLimiter,
  asyncHandler((req, res) => AuthController.setupProfile(req, res))
);

// GET /api/v1/auth/me - Get current user profile
router.get(
  "/me",
  authenticate,
  asyncHandler((req, res) => AuthController.getProfile(req, res))
);

// PUT /api/v1/auth/me - Update user profile
router.put(
  "/me",
  authenticate,
  authRateLimiter,
  asyncHandler((req, res) => AuthController.updateProfile(req, res))
);

/**
 * GDPR Routes
 */

// DELETE /api/v1/auth/me - Delete account (soft delete + anonymize PII)
router.delete(
  "/me",
  authenticate,
  strictRateLimiter,
  asyncHandler((req, res) => GDPRController.deleteAccount(req, res))
);

// GET /api/v1/auth/me/export - Export user data as JSON (rate limited: 1 per hour)
router.get(
  "/me/export",
  authenticate,
  asyncHandler((req, res) => GDPRController.exportData(req, res))
);

export default router;
