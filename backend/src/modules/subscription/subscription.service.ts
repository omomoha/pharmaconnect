import { getFirestore } from "../../config/firebase.js";
import logger from "../../utils/logger.js";
import {
  SubscriptionTier,
  SubscriptionStatus,
  PharmacySubscription,
  SubscriptionInvoice,
} from "@pharmaconnect/shared/dist/types/index.js";
import {
  FIRESTORE_COLLECTIONS,
  SUBSCRIPTION_TIERS,
} from "@pharmaconnect/shared/dist/constants/index.js";
import { v4 as uuid } from "uuid";

/**
 * Subscription Service — manages pharmacy subscription lifecycle
 */
export class SubscriptionService {
  /**
   * Get the plan details for a given tier
   */
  static getPlanDetails(tier: SubscriptionTier) {
    switch (tier) {
      case SubscriptionTier.PHARMA_LITE:
        return SUBSCRIPTION_TIERS.PHARMA_LITE;
      case SubscriptionTier.PHARMA_PRO:
        return SUBSCRIPTION_TIERS.PHARMA_PRO;
      case SubscriptionTier.PHARMA_ELITE:
        return SUBSCRIPTION_TIERS.PHARMA_ELITE;
      default:
        return SUBSCRIPTION_TIERS.PHARMA_LITE;
    }
  }

  /**
   * Get all available plans
   */
  static getAllPlans() {
    return [
      SUBSCRIPTION_TIERS.PHARMA_LITE,
      SUBSCRIPTION_TIERS.PHARMA_PRO,
      SUBSCRIPTION_TIERS.PHARMA_ELITE,
    ];
  }

  /**
   * Create initial subscription for a pharmacy (defaults to PharmaLite / free)
   */
  static async createSubscription(
    pharmacyId: string,
    tier: SubscriptionTier = SubscriptionTier.PHARMA_LITE
  ): Promise<PharmacySubscription> {
    try {
      const db = getFirestore();
      const id = uuid();
      const now = new Date();

      // Free tier has no expiry; paid tiers run monthly
      const periodEnd = new Date(now);
      if (tier === SubscriptionTier.PHARMA_LITE) {
        periodEnd.setFullYear(periodEnd.getFullYear() + 100); // effectively no expiry
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      const subscription: PharmacySubscription = {
        id,
        pharmacyId,
        tier,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        createdAt: now,
        updatedAt: now,
      };

      await db
        .collection(FIRESTORE_COLLECTIONS.PHARMACY_SUBSCRIPTIONS)
        .doc(id)
        .set(subscription);

      logger.info(`Subscription created: ${id} for pharmacy ${pharmacyId} (${tier})`);
      return subscription;
    } catch (error) {
      logger.error("Failed to create subscription:", error);
      throw error;
    }
  }

  /**
   * Get active subscription for a pharmacy
   */
  static async getActiveSubscription(
    pharmacyId: string
  ): Promise<PharmacySubscription | null> {
    try {
      const db = getFirestore();
      const snapshot = await db
        .collection(FIRESTORE_COLLECTIONS.PHARMACY_SUBSCRIPTIONS)
        .where("pharmacyId", "==", pharmacyId)
        .where("status", "in", [
          SubscriptionStatus.ACTIVE,
          SubscriptionStatus.TRIAL,
        ])
        .orderBy("createdAt", "desc")
        .limit(1)
        .get();

      if (snapshot.empty) return null;
      return snapshot.docs[0].data() as PharmacySubscription;
    } catch (error) {
      logger.error(
        `Failed to get subscription for pharmacy ${pharmacyId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Upgrade or downgrade subscription tier
   */
  static async changeTier(
    pharmacyId: string,
    newTier: SubscriptionTier,
    paystackSubscriptionCode?: string
  ): Promise<PharmacySubscription> {
    try {
      const db = getFirestore();
      const current = await this.getActiveSubscription(pharmacyId);

      if (current) {
        // Cancel existing subscription
        await db
          .collection(FIRESTORE_COLLECTIONS.PHARMACY_SUBSCRIPTIONS)
          .doc(current.id)
          .update({
            status: SubscriptionStatus.CANCELLED,
            updatedAt: new Date(),
          });
      }

      // Create new subscription at new tier
      const id = uuid();
      const now = new Date();
      const periodEnd = new Date(now);

      if (newTier === SubscriptionTier.PHARMA_LITE) {
        periodEnd.setFullYear(periodEnd.getFullYear() + 100);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      const subscription: PharmacySubscription = {
        id,
        pharmacyId,
        tier: newTier,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        paystackSubscriptionCode,
        cancelAtPeriodEnd: false,
        createdAt: now,
        updatedAt: now,
      };

      await db
        .collection(FIRESTORE_COLLECTIONS.PHARMACY_SUBSCRIPTIONS)
        .doc(id)
        .set(subscription);

      logger.info(
        `Subscription changed for pharmacy ${pharmacyId}: ${current?.tier ?? "none"} -> ${newTier}`
      );
      return subscription;
    } catch (error) {
      logger.error("Failed to change subscription tier:", error);
      throw error;
    }
  }

  /**
   * Cancel subscription (set to cancel at period end)
   */
  static async cancelSubscription(
    pharmacyId: string
  ): Promise<PharmacySubscription | null> {
    try {
      const current = await this.getActiveSubscription(pharmacyId);
      if (!current) return null;

      // Free tier can't be cancelled
      if (current.tier === SubscriptionTier.PHARMA_LITE) {
        return current;
      }

      const db = getFirestore();
      await db
        .collection(FIRESTORE_COLLECTIONS.PHARMACY_SUBSCRIPTIONS)
        .doc(current.id)
        .update({
          cancelAtPeriodEnd: true,
          updatedAt: new Date(),
        });

      logger.info(`Subscription cancellation scheduled for pharmacy ${pharmacyId}`);
      return { ...current, cancelAtPeriodEnd: true };
    } catch (error) {
      logger.error("Failed to cancel subscription:", error);
      throw error;
    }
  }

  /**
   * Record a subscription invoice
   */
  static async createInvoice(data: {
    pharmacyId: string;
    subscriptionId: string;
    amountNGN: number;
    paystackReference?: string;
    periodStart: Date;
    periodEnd: Date;
  }): Promise<SubscriptionInvoice> {
    try {
      const db = getFirestore();
      const id = uuid();
      const now = new Date();

      const invoice: SubscriptionInvoice = {
        id,
        pharmacyId: data.pharmacyId,
        subscriptionId: data.subscriptionId,
        amountNGN: data.amountNGN,
        status: "pending",
        paystackReference: data.paystackReference,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        createdAt: now,
      };

      await db
        .collection(FIRESTORE_COLLECTIONS.SUBSCRIPTION_INVOICES)
        .doc(id)
        .set(invoice);

      return invoice;
    } catch (error) {
      logger.error("Failed to create subscription invoice:", error);
      throw error;
    }
  }

  /**
   * Check if a pharmacy has access to a specific feature
   */
  static async hasFeature(
    pharmacyId: string,
    feature: string
  ): Promise<boolean> {
    const subscription = await this.getActiveSubscription(pharmacyId);
    if (!subscription) return false;

    const plan = this.getPlanDetails(subscription.tier);
    return (plan.features as readonly string[]).includes(feature);
  }

  /**
   * Check if pharmacy is within product limit
   */
  static async canAddProduct(
    pharmacyId: string,
    currentProductCount: number
  ): Promise<boolean> {
    const subscription = await this.getActiveSubscription(pharmacyId);
    if (!subscription) return false;

    const plan = this.getPlanDetails(subscription.tier);
    if (plan.maxProducts === -1) return true; // unlimited
    return currentProductCount < plan.maxProducts;
  }
}
