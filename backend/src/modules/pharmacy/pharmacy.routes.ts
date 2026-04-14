import { Router } from "express";
import { PharmacyController } from "./pharmacy.controller.js";
import { authenticate, optionalAuthenticate } from "../../middleware/authenticate.js";
import { asyncHandler } from "../../middleware/errorHandler.js";
import { authRateLimiter } from "../../middleware/rateLimiter.js";
import { requireProductLimit } from "../../middleware/subscriptionGate.js";

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

// GET /api/v1/pharmacies/mine - Get current user's pharmacy
router.get(
  "/mine",
  authenticate,
  asyncHandler((req, res) => PharmacyController.getMyPharmacy(req, res))
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

// POST /api/v1/pharmacies/:pharmacyId/products - Add product (respects tier product limit)
router.post(
  "/:pharmacyId/products",
  authenticate,
  authRateLimiter,
  requireProductLimit(),
  asyncHandler((req, res) => PharmacyController.addProduct(req, res))
);

// PATCH /api/v1/pharmacies/:pharmacyId - Update pharmacy profile
router.patch(
  "/:pharmacyId",
  authenticate,
  asyncHandler((req, res) => PharmacyController.updatePharmacy(req, res))
);

// PATCH /api/v1/pharmacies/:pharmacyId/products/:productId - Update product
router.patch(
  "/:pharmacyId/products/:productId",
  authenticate,
  asyncHandler((req, res) => PharmacyController.updateProduct(req, res))
);

// DELETE /api/v1/pharmacies/:pharmacyId/products/:productId - Deactivate product
router.delete(
  "/:pharmacyId/products/:productId",
  authenticate,
  asyncHandler((req, res) => PharmacyController.deleteProduct(req, res))
);

export default router;
