import { Response } from "express";
import { AuthenticatedRequest } from "../../middleware/authenticate.js";
import { PharmacyService } from "./pharmacy.service.js";
import { apiResponse } from "../../utils/helpers.js";
import logger from "../../utils/logger.js";
import { z } from "zod";

/**
 * Pharmacy Controller
 */
export class PharmacyController {
  /**
   * POST /register
   * Register new pharmacy
   */
  static async registerPharmacy(
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
        name: z.string().min(1),
        email: z.string().email(),
        phoneNumber: z.string(),
        address: z.string().min(1),
        latitude: z.number(),
        longitude: z.number(),
        licenseNumber: z.string(),
        licenseDocUrl: z.string().url(),
        cacNumber: z.string(),
        cacDocUrl: z.string().url(),
        ownerName: z.string(),
        ownerIdDocUrl: z.string().url(),
        operatingHours: z.object({
          monday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
          tuesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
          wednesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
          thursday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
          friday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
          saturday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
          sunday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
        }),
      });

      const validated = schema.parse(req.body);

      const pharmacy = await PharmacyService.registerPharmacy(req.user.uid, validated);

      logger.info(`Pharmacy registered by user ${req.user.uid}`);

      res.status(201).json(
        apiResponse(true, {
          pharmacy,
        })
      );
    } catch (error) {
      logger.error("Pharmacy registration error:", error);
      res.status(500).json(
        apiResponse(false, undefined, {
          code: "REGISTRATION_FAILED",
          message: "Failed to register pharmacy",
        })
      );
    }
  }

  /**
   * GET /:pharmacyId
   * Get pharmacy by ID
   */
  static async getPharmacy(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { pharmacyId } = req.params;

      const pharmacy = await PharmacyService.getPharmacy(pharmacyId);

      if (!pharmacy) {
        res.status(404).json(
          apiResponse(false, undefined, {
            code: "PHARMACY_NOT_FOUND",
            message: "Pharmacy not found",
          })
        );
        return;
      }

      res.json(apiResponse(true, { pharmacy }));
    } catch (error) {
      logger.error("Get pharmacy error:", error);
      res.status(500).json(
        apiResponse(false, undefined, {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve pharmacy",
        })
      );
    }
  }

  /**
   * GET /nearby
   * Get nearby pharmacies
   */
  static async getNearbyPharmacies(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const schema = z.object({
        latitude: z.coerce.number(),
        longitude: z.coerce.number(),
        radiusKm: z.coerce.number().optional().default(10),
        limit: z.coerce.number().optional().default(20),
      });

      const validated = schema.parse(req.query);

      const pharmacies = await PharmacyService.getNearbyPharmacies(
        validated.latitude,
        validated.longitude,
        validated.radiusKm,
        validated.limit
      );

      res.json(
        apiResponse(true, {
          pharmacies,
          count: pharmacies.length,
        })
      );
    } catch (error) {
      logger.error("Get nearby pharmacies error:", error);
      res.status(400).json(
        apiResponse(false, undefined, {
          code: "INVALID_REQUEST",
          message: "Invalid request parameters",
        })
      );
    }
  }

  /**
   * GET /search
   * Search pharmacies
   */
  static async searchPharmacies(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const schema = z.object({
        q: z.string().min(1),
      });

      const validated = schema.parse(req.query);

      const pharmacies = await PharmacyService.searchPharmacies(validated.q);

      res.json(
        apiResponse(true, {
          pharmacies,
          count: pharmacies.length,
        })
      );
    } catch (error) {
      logger.error("Search pharmacies error:", error);
      res.status(400).json(
        apiResponse(false, undefined, {
          code: "INVALID_REQUEST",
          message: "Invalid search query",
        })
      );
    }
  }

  /**
   * GET /:pharmacyId/products
   * Get pharmacy products
   */
  static async getPharmacyProducts(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { pharmacyId } = req.params;

      const products = await PharmacyService.getPharmacyProducts(pharmacyId);

      res.json(
        apiResponse(true, {
          products,
          count: products.length,
        })
      );
    } catch (error) {
      logger.error("Get pharmacy products error:", error);
      res.status(500).json(
        apiResponse(false, undefined, {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve products",
        })
      );
    }
  }

  /**
   * POST /:pharmacyId/products
   * Add product to pharmacy
   */
  static async addProduct(
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

      const { pharmacyId } = req.params;

      // Verify ownership
      const pharmacy = await PharmacyService.getPharmacy(pharmacyId);
      if (!pharmacy || pharmacy.userId !== req.user.uid) {
        res.status(403).json(
          apiResponse(false, undefined, {
            code: "FORBIDDEN",
            message: "You do not have permission to add products to this pharmacy",
          })
        );
        return;
      }

      const schema = z.object({
        drugCatalogItemId: z.string(),
        sku: z.string(),
        quantity: z.number().positive(),
        price: z.number().positive(),
        discount: z.number().optional(),
        expiryDate: z.string().datetime(),
        batchNumber: z.string(),
      });

      const validated = schema.parse(req.body);

      const product = await PharmacyService.addProduct(pharmacyId, {
        ...validated,
        expiryDate: new Date(validated.expiryDate),
      });

      logger.info(`Product added to pharmacy ${pharmacyId}`);

      res.status(201).json(
        apiResponse(true, {
          product,
        })
      );
    } catch (error) {
      logger.error("Add product error:", error);
      res.status(500).json(
        apiResponse(false, undefined, {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add product",
        })
      );
    }
  }
}
