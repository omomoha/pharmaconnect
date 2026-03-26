import { Router } from "express";
import { AdminController } from "./admin.controller.js";
import { authenticate, authorize } from "../../middleware/authenticate.js";
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

// GET /api/v1/admin/dashboard - Get dashboard stats
router.get(
  "/dashboard",
  ...adminAuth,
  asyncHandler((req, res) => AdminController.getDashboardStats(req, res))
);

// GET /api/v1/admin/transactions - Get transactions
router.get(
  "/transactions",
  ...adminAuth,
  asyncHandler((req, res) => AdminController.getTransactions(req, res))
);

export default router;
