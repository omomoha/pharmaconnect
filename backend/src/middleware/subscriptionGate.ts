import { Request, Response, NextFunction } from "express";
import { SubscriptionService } from "../modules/subscription/subscription.service.js";
import { HTTP_STATUS } from "@pharmaconnect/shared/dist/constants/index.js";
import logger from "../utils/logger.js";

/**
 * Middleware to gate features behind subscription tiers.
 *
 * Usage:
 *   router.post("/ai-chat", authenticate, requireFeature("ai_chat_assistant"), handler);
 *   router.post("/products", authenticate, requireProductLimit(), handler);
 */

/**
 * Require a specific feature to be included in the pharmacy's subscription plan.
 */
export function requireFeature(feature: string) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user?.pharmacyId) {
        // Not a pharmacy user — let other middleware handle authorization
        return next();
      }

      const hasAccess = await SubscriptionService.hasFeature(
        user.pharmacyId,
        feature
      );

      if (!hasAccess) {
        const subscription = await SubscriptionService.getActiveSubscription(
          user.pharmacyId
        );
        const currentTier = subscription?.tier ?? "none";

        logger.info(
          `Feature gate blocked: pharmacy ${user.pharmacyId} (${currentTier}) tried to access "${feature}"`
        );

        return (_res as Response).status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: "FEATURE_NOT_AVAILABLE",
            message: `This feature requires a higher subscription tier. Please upgrade your plan to access "${feature}".`,
            currentTier,
            requiredFeature: feature,
          },
        });
      }

      next();
    } catch (error) {
      logger.error("Subscription gate error:", error);
      // Fail open — don't block the request if subscription check fails
      next();
    }
  };
}

/**
 * Check if the pharmacy can add more products (within their tier's limit).
 * Attach `req.canAddProduct = true/false` so the controller can decide.
 */
export function requireProductLimit() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user?.pharmacyId) {
        return next();
      }

      // Get current product count from Firestore
      const { getFirestore } = await import("../config/firebase.js");
      const { FIRESTORE_COLLECTIONS } = await import(
        "@pharmaconnect/shared/dist/constants/index.js"
      );

      const db = getFirestore();
      const snapshot = await db
        .collection(FIRESTORE_COLLECTIONS.PHARMACY_PRODUCTS)
        .where("pharmacyId", "==", user.pharmacyId)
        .count()
        .get();

      const currentCount = snapshot.data().count;
      const canAdd = await SubscriptionService.canAddProduct(
        user.pharmacyId,
        currentCount
      );

      if (!canAdd) {
        const subscription = await SubscriptionService.getActiveSubscription(
          user.pharmacyId
        );
        const plan = subscription
          ? SubscriptionService.getPlanDetails(subscription.tier)
          : null;

        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: "PRODUCT_LIMIT_REACHED",
            message: `You have reached the maximum number of products (${plan?.maxProducts}) for your ${plan?.name ?? "current"} plan. Upgrade to add more.`,
            currentCount,
            maxProducts: plan?.maxProducts ?? 0,
          },
        });
      }

      next();
    } catch (error) {
      logger.error("Product limit check error:", error);
      // Fail open
      next();
    }
  };
}
