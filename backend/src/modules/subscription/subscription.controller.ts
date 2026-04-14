import { Request, Response } from "express";
import { SubscriptionService } from "./subscription.service.js";
import { SubscriptionTier } from "@pharmaconnect/shared/dist/types/index.js";
import { HTTP_STATUS } from "@pharmaconnect/shared/dist/constants/index.js";
import logger from "../../utils/logger.js";

/**
 * Subscription Controller — handles HTTP requests for subscription management
 */
export class SubscriptionController {
  /**
   * GET /api/v1/subscriptions/plans
   * Get all available subscription plans (public)
   */
  static async getPlans(_req: Request, res: Response): Promise<void> {
    const plans = SubscriptionService.getAllPlans();
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: plans,
    });
  }

  /**
   * GET /api/v1/subscriptions/current
   * Get current pharmacy's active subscription
   */
  static async getCurrentSubscription(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user?.pharmacyId) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: { message: "No pharmacy associated with this account" },
        });
        return;
      }

      const subscription = await SubscriptionService.getActiveSubscription(
        user.pharmacyId
      );

      if (!subscription) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: { message: "No active subscription found" },
        });
        return;
      }

      const plan = SubscriptionService.getPlanDetails(subscription.tier);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { subscription, plan },
      });
    } catch (error) {
      logger.error("Get subscription error:", error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: { message: "Failed to retrieve subscription" },
      });
    }
  }

  /**
   * POST /api/v1/subscriptions/change-tier
   * Change subscription tier (upgrade/downgrade)
   */
  static async changeTier(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user?.pharmacyId) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: { message: "No pharmacy associated with this account" },
        });
        return;
      }

      const { tier, paystackSubscriptionCode } = req.body;

      if (
        !tier ||
        !Object.values(SubscriptionTier).includes(tier as SubscriptionTier)
      ) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: `Invalid tier. Must be one of: ${Object.values(SubscriptionTier).join(", ")}`,
          },
        });
        return;
      }

      const subscription = await SubscriptionService.changeTier(
        user.pharmacyId,
        tier as SubscriptionTier,
        paystackSubscriptionCode
      );

      const plan = SubscriptionService.getPlanDetails(subscription.tier);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { subscription, plan },
        message: `Successfully switched to ${plan.name}`,
      });
    } catch (error) {
      logger.error("Change tier error:", error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: { message: "Failed to change subscription tier" },
      });
    }
  }

  /**
   * POST /api/v1/subscriptions/cancel
   * Cancel current subscription (effective at period end)
   */
  static async cancelSubscription(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user?.pharmacyId) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: { message: "No pharmacy associated with this account" },
        });
        return;
      }

      const subscription = await SubscriptionService.cancelSubscription(
        user.pharmacyId
      );

      if (!subscription) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: { message: "No active subscription to cancel" },
        });
        return;
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: subscription,
        message:
          "Subscription will be cancelled at the end of the current billing period. You will be downgraded to PharmaLite (free).",
      });
    } catch (error) {
      logger.error("Cancel subscription error:", error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: { message: "Failed to cancel subscription" },
      });
    }
  }

  /**
   * GET /api/v1/subscriptions/check-feature/:feature
   * Check if current pharmacy has a specific feature
   */
  static async checkFeature(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user?.pharmacyId) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: { message: "No pharmacy associated with this account" },
        });
        return;
      }

      const { feature } = req.params;
      const hasFeature = await SubscriptionService.hasFeature(
        user.pharmacyId,
        feature
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { feature, hasAccess: hasFeature },
      });
    } catch (error) {
      logger.error("Check feature error:", error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: { message: "Failed to check feature access" },
      });
    }
  }
}
