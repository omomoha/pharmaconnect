import { Router } from "express";
import { PharmacyController } from "./pharmacy.controller.js";
import { authenticate, optionalAuthenticate } from "../../middleware/authenticate.js";
import { asyncHandler } from "../../middleware/errorHandler.js";
import { authRateLimiter } from "../../middleware/rateLimiter.js";

const router = Router();

/**
 * Pharmacy Routes
 */

// POST /api/v1/pharmacies/register - Register new pharmacy
router.post(
  "/register",
  authenticate,
  authRateLimiter,
  asyncHandler((req, res) => PharmacyController.registerPharmacy(req, res))
);

// GET /api/v1/pharmacies/nearby - Get nearby pharmacies
router.get(
  "/nearby",
  optionalAuthenticate,
  asyncHandler((req, res) => PharmacyController.getNearbyPharmacies(req, res))
);

// GET /api/v1/pharmacies/search - Search pharmacies
router.get(
  "/search",
  optionalAuthenticate,
  asyncHandler((req, res) => PharmacyController.searchPharmacies(req, res))
);

// GET /api/v1/pharmacies/:pharmacyId - Get pharmacy details
router.get(
  "/:pharmacyId",
  optionalAuthenticate,
  asyncHandler((req, res) => PharmacyController.getPharmacy(req, res))
);

// GET /api/v1/pharmacies/:pharmacyId/products - Get pharmacy products
router.get(
  "/:pharmacyId/products",
  optionalAuthenticate,
  asyncHandler((req, res) => PharmacyController.getPharmacyProducts(req, res))
);

// POST /api/v1/pharmacies/:pharmacyId/products - Add product
router.post(
  "/:pharmacyId/products",
  authenticate,
  authRateLimiter,
  asyncHandler((req, res) => PharmacyController.addProduct(req, res))
);

export default router;
