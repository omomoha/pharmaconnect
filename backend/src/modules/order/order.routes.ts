import { Router } from "express";
import { OrderController } from "./order.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { asyncHandler } from "../../middleware/errorHandler.js";
import { authRateLimiter } from "../../middleware/rateLimiter.js";

const router = Router();

/**
 * Order Routes
 */

// POST /api/v1/orders - Create new order (authenticated)
router.post(
  "/",
  authenticate,
  authRateLimiter,
  asyncHandler((req, res) => OrderController.createOrder(req, res))
);

// POST /api/v1/orders/guest - Create guest order (no auth required)
router.post(
  "/guest",
  authRateLimiter,
  asyncHandler((req, res) => OrderController.createGuestOrder(req, res))
);

// GET /api/v1/orders/user/my-orders - Get user's orders
router.get(
  "/user/my-orders",
  authenticate,
  asyncHandler((req, res) => OrderController.getUserOrders(req, res))
);

// GET /api/v1/orders/pharmacy/:pharmacyId - Get pharmacy's orders
router.get(
  "/pharmacy/:pharmacyId",
  authenticate,
  asyncHandler((req, res) => OrderController.getPharmacyOrders(req, res))
);

// GET /api/v1/orders/:orderId - Get order details
router.get(
  "/:orderId",
  authenticate,
  asyncHandler((req, res) => OrderController.getOrder(req, res))
);

// PATCH /api/v1/orders/:orderId/status - Update order status
router.patch(
  "/:orderId/status",
  authenticate,
  authRateLimiter,
  asyncHandler((req, res) => OrderController.updateOrderStatus(req, res))
);

// POST /api/v1/orders/:orderId/cancel - Cancel order
router.post(
  "/:orderId/cancel",
  authenticate,
  authRateLimiter,
  asyncHandler((req, res) => OrderController.cancelOrder(req, res))
);

export default router;
