import { Router } from "express";
import { SupportController } from "./support.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize as authorizeRole } from "../../middleware/authorize.js";
import { asyncHandler } from "../../middleware/errorHandler.js";
import { adminRateLimiter, authRateLimiter } from "../../middleware/rateLimiter.js";
import { UserRole } from "@pharmaconnect/shared/dist/types/index.js";

const router = Router();

const authMiddleware = [authenticate, authRateLimiter];
const adminAuth = [
  authenticate,
  authorizeRole(UserRole.PLATFORM_ADMIN, UserRole.SUPPORT_ADMIN),
  adminRateLimiter,
];

// Admin-only routes (must be before :ticketId)
router.get("/tickets/all", ...adminAuth, asyncHandler((req, res) => SupportController.getAllTickets(req, res)));

// User-facing routes (any authenticated user)
router.post("/tickets", ...authMiddleware, asyncHandler((req, res) => SupportController.createTicket(req, res)));
router.get("/tickets", ...authMiddleware, asyncHandler((req, res) => SupportController.getUserTickets(req, res)));
router.get("/tickets/:ticketId", ...authMiddleware, asyncHandler((req, res) => SupportController.getTicket(req, res)));

// Admin-only routes for ticket management
router.post("/tickets/:ticketId/respond", ...adminAuth, asyncHandler((req, res) => SupportController.respondToTicket(req, res)));
router.post("/tickets/:ticketId/close", ...adminAuth, asyncHandler((req, res) => SupportController.closeTicket(req, res)));

export default router;
