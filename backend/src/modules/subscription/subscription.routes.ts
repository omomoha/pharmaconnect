import { Router } from "express";
import { SubscriptionController } from "./subscription.controller.js";
import { authenticate, optionalAuthenticate } from "../../middleware/authenticate.js";
import { asyncHandler } from "../../middleware/errorHandler.js";

const router = Router();

/**
 * Subscription Routes
 */

// GET /api/v1/subscriptions/plans - Get all available plans (public)
router.get(
  "/plans",
  optionalAuthenticate,
  asyncHandler((req, res) => SubscriptionController.getPlans(req, res))
);

// GET /api/v1/subscriptions/current - Get current subscription (authenticated)
router.get(
  "/current",
  authenticate,
  asyncHandler((req, res) => SubscriptionController.getCurrentSubscription(req, res))
);

// POST /api/v1/subscriptions/change-tier - Change tier (authenticated)
router.post(
  "/change-tier",
  authenticate,
  asyncHandler((req, res) => SubscriptionController.changeTier(req, res))
);

// POST /api/v1/subscriptions/cancel - Cancel subscription (authenticated)
router.post(
  "/cancel",
  authenticate,
  asyncHandler((req, res) => SubscriptionController.cancelSubscription(req, res))
);

// GET /api/v1/subscriptions/check-feature/:feature - Check feature access (authenticated)
router.get(
  "/check-feature/:feature",
  authenticate,
  asyncHandler((req, res) => SubscriptionController.checkFeature(req, res))
);

export default router;
