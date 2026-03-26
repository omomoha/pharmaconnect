import { Router } from "express";
import { PaymentController } from "./payment.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { asyncHandler } from "../../middleware/errorHandler.js";
import { authRateLimiter, strictRateLimiter } from "../../middleware/rateLimiter.js";

const router = Router();

/**
 * Payment Routes
 */

// POST /api/v1/payments/initialize - Initialize payment
router.post(
  "/initialize",
  authenticate,
  authRateLimiter,
  asyncHandler((req, res) => PaymentController.initializePayment(req, res))
);

// GET /api/v1/payments/verify/:reference - Verify payment
router.get(
  "/verify/:reference",
  authenticate,
  asyncHandler((req, res) => PaymentController.verifyPayment(req, res))
);

// POST /api/v1/payments/webhook - Paystack webhook (no auth required)
router.post(
  "/webhook",
  asyncHandler((req, res) => PaymentController.handleWebhook(req, res))
);

// POST /api/v1/payments/refund - Request refund
router.post(
  "/refund",
  authenticate,
  strictRateLimiter,
  asyncHandler((req, res) => PaymentController.refundPayment(req, res))
);

export default router;
