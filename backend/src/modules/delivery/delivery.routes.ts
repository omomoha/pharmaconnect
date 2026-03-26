import { Router } from "express";
import { DeliveryController } from "./delivery.controller.js";
import { authenticate, optionalAuthenticate } from "../../middleware/authenticate.js";
import { asyncHandler } from "../../middleware/errorHandler.js";
import { authRateLimiter } from "../../middleware/rateLimiter.js";

const router = Router();

/**
 * Delivery Routes
 */

// POST /api/v1/delivery/providers/register - Register delivery provider
router.post(
  "/providers/register",
  authenticate,
  authRateLimiter,
  asyncHandler((req, res) => DeliveryController.registerProvider(req, res))
);

// GET /api/v1/delivery/available - Get available delivery providers
router.get(
  "/available",
  optionalAuthenticate,
  asyncHandler((req, res) => DeliveryController.getAvailableProviders(req, res))
);

// POST /api/v1/delivery/assignments - Create delivery assignment
router.post(
  "/assignments",
  authenticate,
  authRateLimiter,
  asyncHandler((req, res) => DeliveryController.createAssignment(req, res))
);

// GET /api/v1/delivery/assignments/:assignmentId - Get assignment
router.get(
  "/assignments/:assignmentId",
  authenticate,
  asyncHandler((req, res) => DeliveryController.getAssignment(req, res))
);

// PATCH /api/v1/delivery/assignments/:assignmentId/status - Update assignment status
router.patch(
  "/assignments/:assignmentId/status",
  authenticate,
  authRateLimiter,
  asyncHandler((req, res) => DeliveryController.updateAssignmentStatus(req, res))
);

// POST /api/v1/delivery/assignments/:assignmentId/verify-code - Verify security code
router.post(
  "/assignments/:assignmentId/verify-code",
  authenticate,
  authRateLimiter,
  asyncHandler((req, res) => DeliveryController.verifySecurityCode(req, res))
);

export default router;
