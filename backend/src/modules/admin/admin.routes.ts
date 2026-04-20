import { Router } from "express";
import { AdminController } from "./admin.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize as authorizeRole } from "../../middleware/authorize.js";
import { asyncHandler } from "../../middleware/errorHandler.js";
import { adminRateLimiter } from "../../middleware/rateLimiter.js";
import { UserRole } from "@pharmaconnect/shared/dist/types/index.js";

const router = Router();

/**
 * Admin Routes
 * All routes require PLATFORM_ADMIN or SUPPORT_ADMIN role
 */

const adminAuth = [
  authenticate,
  authorizeRole(UserRole.PLATFORM_ADMIN, UserRole.SUPPORT_ADMIN),
  adminRateLimiter,
];

// GET /api/v1/admin/pending-pharmacies - Get pending pharmacies
router.get(
  "/pending-pharmacies",
  ...adminAuth,
  asyncHandler((req, res) => AdminController.getPendingPharmacies(req, res))
);

// POST /api/v1/admin/pharmacies/:pharmacyId/approve - Approve pharmacy
router.post(
  "/pharmacies/:pharmacyId/approve",
  ...adminAuth,
  asyncHandler((req, res) => AdminController.approvePharmacy(req, res))
);

// POST /api/v1/admin/pharmacies/:pharmacyId/reject - Reject pharmacy
router.post(
  "/pharmacies/:pharmacyId/reject",
  ...adminAuth,
  asyncHandler((req, res) => AdminController.rejectPharmacy(req, res))
);

// GET /api/v1/admin/pending-providers - Get pending providers
router.get(
  "/pending-providers",
  ...adminAuth,
  asyncHandler((req, res) => AdminController.getPendingProviders(req, res))
);

// POST /api/v1/admin/providers/:providerId/approve - Approve provider
router.post(
  "/providers/:providerId/approve",
  ...adminAuth,
  asyncHandler((req, res) => AdminController.approveProvider(req, res))
);

// POST /api/v1/admin/providers/:providerId/reject - Reject provider
router.post(
  "/providers/:providerId/reject",
  ...adminAuth,
  asyncHandler((req, res) => AdminController.rejectProvider(req, res))
);

// GET /api/v1/admin/flagged-alerts - Get flagged alerts
router.get(
  "/flagged-alerts",
  ...adminAuth,
  asyncHandler((req, res) => AdminController.getFlaggedAlerts(req, res))
);

// POST /api/v1/admin/flagged-alerts/:alertId/review - Review alert
router.post(
  "/flagged-alerts/:alertId/review",
  ...adminAuth,
  asyncHandler((req, res) => AdminController.reviewAlert(req, res))
);

// PATCH /api/v1/admin/flagged-alerts/:alertId/resolve - Resolve alert
router.patch(
  "/flagged-alerts/:alertId/resolve",
  ...adminAuth,
  asyncHandler((req, res) => AdminController.resolveAlert(req, res))
);

// GET /api/v1/admin/users - Get all users
router.get(
  "/users",
  ...adminAuth,
  asyncHandler((req, res) => AdminController.getUsers(req, res))
);

// GET /api/v1/admin/dashboard - Get dashboard stats
router.get(
  "/dashboard",
  ...adminAuth,
  asyncHandler((req, res) => AdminController.getDashboardStats(req, res))
);

// GET /api/v1/admin/orders - Get all orders
router.get(
  "/orders",
  ...adminAuth,
  asyncHandler((req, res) => AdminController.getOrders(req, res))
);

// GET /api/v1/admin/transactions - Get transactions
router.get(
  "/transactions",
  ...adminAuth,
  asyncHandler((req, res) => AdminController.getTransactions(req, res))
);

// GET /api/v1/admin/analytics - Get analytics with date-range support
router.get(
  "/analytics",
  ...adminAuth,
  asyncHandler((req, res) => AdminController.getAnalytics(req, res))
);

// POST /api/v1/admin/users/:userId/suspend - Suspend user
router.post(
  "/users/:userId/suspend",
  ...adminAuth,
  asyncHandler((req, res) => AdminController.suspendUser(req, res))
);

// POST /api/v1/admin/users/:userId/activate - Activate user
router.post(
  "/users/:userId/activate",
  ...adminAuth,
  asyncHandler((req, res) => AdminController.activateUser(req, res))
);

// POST /api/v1/admin/users/:userId/soft-delete - Soft delete user
router.post(
  "/users/:userId/soft-delete",
  ...adminAuth,
  asyncHandler((req, res) => AdminController.softDeleteUser(req, res))
);

// DELETE /api/v1/admin/users/:userId - Hard delete user
router.delete(
  "/users/:userId",
  ...adminAuth,
  asyncHandler((req, res) => AdminController.hardDeleteUser(req, res))
);

export default router;
