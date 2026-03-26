import { Response } from "express";
import { AuthenticatedRequest } from "../../middleware/authenticate.js";
import { AdminService } from "./admin.service.js";
import { apiResponse } from "../../utils/helpers.js";
import logger from "../../utils/logger.js";
import { z } from "zod";
import { FlagAction } from "@pharmaconnect/shared/dist/types/index.js";

/**
 * Admin Controller
 */
export class AdminController {
  /**
   * GET /pending-pharmacies
   * Get pending pharmacies
   */
  static async getPendingPharmacies(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const pharmacies = await AdminService.getPendingPharmacies();

      res.json(
        apiResponse(true, {
          pharmacies,
          count: pharmacies.length,
        })
      );
    } catch (error) {
      logger.error("Get pending pharmacies error:", error);
      res.status(500).json(
        apiResponse(false, undefined, {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve pending pharmacies",
        })
      );
    }
  }

  /**
   * POST /pharmacies/:pharmacyId/approve
   * Approve pharmacy
   */
  static async approvePharmacy(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { pharmacyId } = req.params;

      const pharmacy = await AdminService.approvePharmacy(pharmacyId);

      logger.info(`Pharmacy approved by admin ${req.user?.uid}: ${pharmacyId}`);

      res.json(
        apiResponse(true, {
          pharmacy,
        })
      );
    } catch (error) {
      logger.error("Approve pharmacy error:", error);
      res.status(500).json(
        apiResponse(false, undefined, {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to approve pharmacy",
        })
      );
    }
  }

  /**
   * POST /pharmacies/:pharmacyId/reject
   * Reject pharmacy
   */
  static async rejectPharmacy(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { pharmacyId } = req.params;
      const schema = z.object({
        reason: z.string().optional(),
      });

      const validated = schema.parse(req.body);

      const pharmacy = await AdminService.rejectPharmacy(pharmacyId, validated.reason);

      logger.info(`Pharmacy rejected by admin ${req.user?.uid}: ${pharmacyId}`);

      res.json(
        apiResponse(true, {
          pharmacy,
        })
      );
    } catch (error) {
      logger.error("Reject pharmacy error:", error);
      res.status(500).json(
        apiResponse(false, undefined, {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to reject pharmacy",
        })
      );
    }
  }

  /**
   * GET /pending-providers
   * Get pending delivery providers
   */
  static async getPendingProviders(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const providers = await AdminService.getPendingDeliveryProviders();

      res.json(
        apiResponse(true, {
          providers,
          count: providers.length,
        })
      );
    } catch (error) {
      logger.error("Get pending providers error:", error);
      res.status(500).json(
        apiResponse(false, undefined, {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve pending providers",
        })
      );
    }
  }

  /**
   * POST /providers/:providerId/approve
   * Approve provider
   */
  static async approveProvider(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { providerId } = req.params;

      const provider = await AdminService.approveProvider(providerId);

      logger.info(`Provider approved by admin ${req.user?.uid}: ${providerId}`);

      res.json(
        apiResponse(true, {
          provider,
        })
      );
    } catch (error) {
      logger.error("Approve provider error:", error);
      res.status(500).json(
        apiResponse(false, undefined, {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to approve provider",
        })
      );
    }
  }

  /**
   * POST /providers/:providerId/reject
   * Reject provider
   */
  static async rejectProvider(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { providerId } = req.params;
      const schema = z.object({
        reason: z.string().optional(),
      });

      const validated = schema.parse(req.body);

      const provider = await AdminService.rejectProvider(providerId, validated.reason);

      logger.info(`Provider rejected by admin ${req.user?.uid}: ${providerId}`);

      res.json(
        apiResponse(true, {
          provider,
        })
      );
    } catch (error) {
      logger.error("Reject provider error:", error);
      res.status(500).json(
        apiResponse(false, undefined, {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to reject provider",
        })
      );
    }
  }

  /**
   * GET /flagged-alerts
   * Get flagged alerts
   */
  static async getFlaggedAlerts(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const schema = z.object({
        limit: z.coerce.number().optional().default(50),
      });

      const validated = schema.parse(req.query);

      const alerts = await AdminService.getFlaggedAlerts(validated.limit);

      res.json(
        apiResponse(true, {
          alerts,
          count: alerts.length,
        })
      );
    } catch (error) {
      logger.error("Get flagged alerts error:", error);
      res.status(500).json(
        apiResponse(false, undefined, {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve alerts",
        })
      );
    }
  }

  /**
   * POST /flagged-alerts/:alertId/review
   * Review flagged alert
   */
  static async reviewAlert(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(
          apiResponse(false, undefined, {
            code: "UNAUTHORIZED",
            message: "User not authenticated",
          })
        );
        return;
      }

      const { alertId } = req.params;
      const schema = z.object({
        action: z.nativeEnum(FlagAction),
        notes: z.string().optional(),
      });

      const validated = schema.parse(req.body);

      const alert = await AdminService.reviewAlert(
        alertId,
        validated.action,
        req.user.uid,
        validated.notes
      );

      logger.info(`Alert reviewed by admin ${req.user.uid}: ${alertId}`);

      res.json(
        apiResponse(true, {
          alert,
        })
      );
    } catch (error) {
      logger.error("Review alert error:", error);
      res.status(500).json(
        apiResponse(false, undefined, {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to review alert",
        })
      );
    }
  }

  /**
   * GET /dashboard
   * Get dashboard statistics
   */
  static async getDashboardStats(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const stats = await AdminService.getDashboardStats();

      res.json(
        apiResponse(true, {
          stats,
        })
      );
    } catch (error) {
      logger.error("Get dashboard stats error:", error);
      res.status(500).json(
        apiResponse(false, undefined, {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve dashboard statistics",
        })
      );
    }
  }

  /**
   * GET /transactions
   * Get all transactions
   */
  static async getTransactions(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const schema = z.object({
        limit: z.coerce.number().optional().default(100),
      });

      const validated = schema.parse(req.query);

      const transactions = await AdminService.getAllTransactions(validated.limit);

      res.json(
        apiResponse(true, {
          transactions,
          count: transactions.length,
        })
      );
    } catch (error) {
      logger.error("Get transactions error:", error);
      res.status(500).json(
        apiResponse(false, undefined, {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve transactions",
        })
      );
    }
  }
}
