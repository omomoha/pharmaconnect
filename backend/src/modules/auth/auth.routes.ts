import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { asyncHandler } from "../../middleware/errorHandler.js";

const router = Router();

/**
 * Auth Routes
 */

// POST /api/v1/auth/setup-profile - Setup user profile after Firebase signup
router.post(
  "/setup-profile",
  authenticate,
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
  asyncHandler((req, res) => AuthController.updateProfile(req, res))
);

export default router;
