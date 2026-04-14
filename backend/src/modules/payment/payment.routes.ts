import { Router } from "express";
import { PaymentController } from "./payment.controller.js";
import { authenticate, optionalAuthenticate } from "../../middleware/authenticate.js";
import { asyncHandler } from "../../middleware/errorHandler.js";
import { authRateLimiter, strictRateLimiter } from "../../middleware/rateLimiter.js";

const router = Router();

/**
 * Payment Routes
 */

// ─── Order Payments ───────────────────────────────────────────────────────────

// POST /api/v1/payments/initialize - Initialize payment (authenticated)
router.post(
  "/initialize",
  authenticate,
  authRateLimiter,
  asyncHandler((req, res) => PaymentController.initializePayment(req, res))
);

// GET /api/v1/payments/verify/:reference - Verify payment
router.get(
  "/verify/:reference",
  optionalAuthenticate,
  asyncHandler((req, res) => PaymentController.verifyPayment(req, res))
);

// POST /api/v1/payments/refund - Request refund
router.post(
  "/refund",
  authenticate,
  strictRateLimiter,
  asyncHandler((req, res) => PaymentController.refundPayment(req, res))
);

// ─── Guest Payments ───────────────────────────────────────────────────────────

// POST /api/v1/payments/guest/initialize - Guest checkout payment (no auth)
router.post(
  "/guest/initialize",
  authRateLimiter,
  asyncHandler((req, res) => PaymentController.initializeGuestPayment(req, res))
);

// ─── Subscription Payments ────────────────────────────────────────────────────

// POST /api/v1/payments/subscription/initialize - Init subscription checkout
router.post(
  "/subscription/initialize",
  authenticate,
  authRateLimiter,
  asyncHandler((req, res) => PaymentController.initializeSubscription(req, res))
);

// ─── Bank & Payout ────────────────────────────────────────────────────────────

// GET /api/v1/payments/banks - List Nigerian banks
router.get(
  "/banks",
  authenticate,
  asyncHandler((req, res) => PaymentController.listBanks(req, res))
);

// POST /api/v1/payments/banks/resolve - Resolve bank account details
router.post(
  "/banks/resolve",
  authenticate,
  authRateLimiter,
  asyncHandler((req, res) => PaymentController.resolveAccount(req, res))
);

// POST /api/v1/payments/transfers/recipient - Create transfer recipient
router.post(
  "/transfers/recipient",
  authenticate,
  authRateLimiter,
  asyncHandler((req, res) => PaymentController.createTransferRecipient(req, res))
);

// POST /api/v1/payments/transfers/initiate - Initiate payout transfer
router.post(
  "/transfers/initiate",
  authenticate,
  strictRateLimiter,
  asyncHandler((req, res) => PaymentController.initiateTransfer(req, res))
);

// ─── Webhook ──────────────────────────────────────────────────────────────────

// POST /api/v1/payments/webhook - Paystack webhook (no auth, signature verified)
router.post(
  "/webhook",
  asyncHandler((req, res) => PaymentController.handleWebhook(req, res))
);

export default router;
