import { Response } from "express";
import { AuthenticatedRequest } from "../../middleware/authenticate.js";
import { DeliveryService } from "./delivery.service.js";
import { PharmacyService } from "../pharmacy/pharmacy.service.js";
import { apiResponse } from "../../utils/helpers.js";
import logger from "../../utils/logger.js";
import { z } from "zod";

/**
 * Delivery Controller
 */
export class DeliveryController {
  /**
   * POST /providers/register
   * Register delivery provider
   */
  static async registerProvider(
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

      const schema = z.object({
        businessName: z.string().min(1),
        email: z.string().email(),
        phoneNumber: z.string(),
        address: z.string().min(1),
        cacNumber: z.string(),
        cacDocUrl: z.string().url(),
        ownerName: z.string(),
        ownerIdDocUrl: z.string().url(),
        vehicleDocUrl: z.string().url(),
        baseFee: z.number().positive(),
        perKmFee: z.number().positive(),
      });

      const validated = schema.parse(req.body);

      const provider = await DeliveryService.registerProvider(req.user.uid, validated);

      logger.info(`Delivery provider registered by user ${req.user.uid}`);

      res.status(201).json(
        apiResponse(true, {
          provider,
        })
      );
    } catch (error) {
      logger.error("Provider registration error:", error);
      res.status(500).json(
        apiResponse(false, undefined, {
          code: "REGISTRATION_FAILED",
          message: "Failed to register delivery provider",
        })
      );
    }
  }

  /**
   * GET /available
   * Get available delivery providers for a route
   */
  static async getAvailableProviders(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const schema = z.object({
        pharmacyId: z.string(),
        customerLatitude: z.coerce.number(),
        customerLongitude: z.coerce.number(),
      });

      const validated = schema.parse(req.query);

      // Get pharmacy location
      const pharmacy = await PharmacyService.getPharmacy(validated.pharmacyId);
      if (!pharmacy) {
        res.status(404).json(
          apiResponse(false, undefined, {
            code: "PHARMACY_NOT_FOUND",
            message: "Pharmacy not found",
          })
        );
        return;
      }

      const providers = await DeliveryService.getAvailableProviders(
        pharmacy.latitude,
        pharmacy.longitude,
        validated.customerLatitude,
        validated.customerLongitude
      );

      res.json(
        apiResponse(true, {
          providers,
          count: providers.length,
        })
      );
    } catch (error) {
      logger.error("Get available providers error:", error);
      res.status(400).json(
        apiResponse(false, undefined, {
          code: "INVALID_REQUEST",
          message: "Invalid request parameters",
        })
      );
    }
  }

  /**
   * POST /assignments
   * Create delivery assignment
   */
  static async createAssignment(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const schema = z.object({
        orderId: z.string(),
        deliveryRiderId: z.string(),
        deliveryProviderId: z.string(),
        pickupLatitude: z.number(),
        pickupLongitude: z.number(),
        deliveryLatitude: z.number(),
        deliveryLongitude: z.number(),
      });

      const validated = schema.parse(req.body);

      const assignment = await DeliveryService.createAssignment(validated);

      logger.info(`Delivery assignment created`);

      res.status(201).json(
        apiResponse(true, {
          assignment,
        })
      );
    } catch (error) {
      logger.error("Create assignment error:", error);
      res.status(500).json(
        apiResponse(false, undefined, {
          code: "ASSIGNMENT_CREATION_FAILED",
          message: "Failed to create delivery assignment",
        })
      );
    }
  }

  /**
   * GET /assignments/:assignmentId
   * Get assignment details
   */
  static async getAssignment(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { assignmentId } = req.params;

      const assignment = await DeliveryService.getAssignment(assignmentId);

      if (!assignment) {
        res.status(404).json(
          apiResponse(false, undefined, {
            code: "ASSIGNMENT_NOT_FOUND",
            message: "Delivery assignment not found",
          })
        );
        return;
      }

      const verification = await DeliveryService.getVerification(assignmentId);

      res.json(
        apiResponse(true, {
          assignment,
          verification,
        })
      );
    } catch (error) {
      logger.error("Get assignment error:", error);
      res.status(500).json(
        apiResponse(false, undefined, {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve assignment",
        })
      );
    }
  }

  /**
   * PATCH /assignments/:assignmentId/status
   * Update assignment status
   */
  static async updateAssignmentStatus(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { assignmentId } = req.params;
      const schema = z.object({
        status: z.enum([
          "pending",
          "accepted",
          "picked_up",
          "in_transit",
          "arrived",
          "delivered",
          "cancelled",
        ]),
      });

      const validated = schema.parse(req.body);

      const assignment = await DeliveryService.updateAssignmentStatus(
        assignmentId,
        validated.status as any
      );

      res.json(
        apiResponse(true, {
          assignment,
        })
      );
    } catch (error) {
      logger.error("Update assignment status error:", error);
      res.status(500).json(
        apiResponse(false, undefined, {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update assignment status",
        })
      );
    }
  }

  /**
   * POST /assignments/:assignmentId/verify-code
   * Verify delivery security code
   */
  static async verifySecurityCode(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { assignmentId } = req.params;
      const schema = z.object({
        code: z.string().length(6),
        isCustomer: z.boolean(),
      });

      const validated = schema.parse(req.body);

      const result = await DeliveryService.verifySecurityCode(
        assignmentId,
        validated.code,
        validated.isCustomer
      );

      logger.info(`Security code verified for assignment ${assignmentId}`);

      res.json(apiResponse(true, result));
    } catch (error) {
      logger.error("Verify code error:", error);
      const message = error instanceof Error ? error.message : "Failed to verify code";
      res.status(400).json(
        apiResponse(false, undefined, {
          code: "VERIFICATION_FAILED",
          message,
        })
      );
    }
  }
}
