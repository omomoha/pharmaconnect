import logger from "../../utils/logger.js";
import config from "../../config/index.js";
import { PaymentStatus, SubscriptionTier } from "@pharmaconnect/shared/dist/types/index.js";
import { SUBSCRIPTION_TIERS } from "@pharmaconnect/shared/dist/constants/index.js";
import { OrderService } from "../order/order.service.js";
import { SubscriptionService } from "../subscription/subscription.service.js";
import { getFirestore } from "../../config/firebase.js";
import crypto from "crypto";

/**
 * Payment Service
 * Integration with Paystack payment gateway
 */
export class PaymentService {
  private static readonly PAYSTACK_API_BASE = "https://api.paystack.co";
  private static readonly PAYSTACK_SECRET = config.PAYSTACK_SECRET_KEY || "";

  /**
   * Initialize payment with Paystack
   */
  static async initializePayment(data: {
    email: string;
    amount: number; // in naira
    orderId: string;
    metadata?: Record<string, unknown>;
  }): Promise<{
    authorizationUrl: string;
    accessCode: string;
    reference: string;
  }> {
    try {
      const reference = `ORDER-${data.orderId}-${Date.now()}`;

      const response = await fetch(`${this.PAYSTACK_API_BASE}/transaction/initialize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.PAYSTACK_SECRET}`,
        },
        body: JSON.stringify({
          email: data.email,
          amount: data.amount * 100, // Paystack expects amount in kobo
          reference,
          metadata: {
            orderId: data.orderId,
            ...data.metadata,
          },
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as any;
        throw new Error(
          `Paystack API error: ${errorData.message || "Unknown error"}`
        );
      }

      const result = (await response.json()) as any;

      logger.info(`Payment initialized for order ${data.orderId}`, {
        reference,
        amount: data.amount,
      });

      return {
        authorizationUrl: result.data.authorization_url,
        accessCode: result.data.access_code,
        reference: result.data.reference,
      };
    } catch (error) {
      logger.error("Failed to initialize payment:", error);
      throw error;
    }
  }

  /**
   * Verify payment with Paystack
   */
  static async verifyPayment(reference: string): Promise<{
    success: boolean;
    amount: number;
    status: string;
    orderId?: string;
  }> {
    try {
      const response = await fetch(
        `${this.PAYSTACK_API_BASE}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.PAYSTACK_SECRET}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to verify payment with Paystack");
      }

      const result = (await response.json()) as any;
      const data = result.data;

      logger.info(`Payment verified`, {
        reference,
        status: data.status,
        amount: data.amount,
      });

      return {
        success: data.status === "success",
        amount: data.amount / 100, // Convert from kobo to naira
        status: data.status,
        orderId: data.metadata?.orderId,
      };
    } catch (error) {
      logger.error("Failed to verify payment:", error);
      throw error;
    }
  }

  /**
   * Handle Paystack webhook
   */
  static async handleWebhook(
    signature: string,
    body: string
  ): Promise<{ success: boolean; orderId?: string; message: string }> {
    try {
      // Verify webhook signature
      const hash = crypto
        .createHmac("sha512", this.PAYSTACK_SECRET)
        .update(body)
        .digest("hex");

      if (hash !== signature) {
        logger.warn("Invalid webhook signature");
        return {
          success: false,
          message: "Invalid signature",
        };
      }

      const event = JSON.parse(body);

      if (event.event !== "charge.success") {
        logger.info("Webhook event ignored", { event: event.event });
        return {
          success: false,
          message: "Event not processed",
        };
      }

      const { reference, status, metadata } = event.data;

      if (status !== "success") {
        logger.warn("Payment not successful", { reference, status });
        return {
          success: false,
          message: "Payment not successful",
        };
      }

      const orderId = metadata?.orderId;

      if (!orderId) {
        logger.warn("No order ID in webhook metadata");
        return {
          success: false,
          message: "No order ID found",
        };
      }

      // Update order payment status
      await OrderService.updatePaymentStatus(
        orderId,
        PaymentStatus.PAID,
        reference
      );

      logger.info(`Webhook processed successfully for order ${orderId}`);

      return {
        success: true,
        orderId,
        message: "Payment processed successfully",
      };
    } catch (error) {
      logger.error("Webhook processing error:", error);
      return {
        success: false,
        message: "Webhook processing failed",
      };
    }
  }

  /**
   * Get payment status
   */
  static async getPaymentStatus(reference: string): Promise<{
    status: PaymentStatus;
    paidAt?: Date;
  }> {
    try {
      const verification = await this.verifyPayment(reference);

      if (verification.success) {
        return {
          status: PaymentStatus.PAID,
          paidAt: new Date(),
        };
      }

      return {
        status: PaymentStatus.FAILED,
      };
    } catch (error) {
      logger.error("Failed to get payment status:", error);
      return {
        status: PaymentStatus.PENDING,
      };
    }
  }

  /**
   * Refund payment (create refund request)
   */
  static async refundPayment(reference: string, reason?: string): Promise<{
    refundReference: string;
    status: string;
  }> {
    try {
      const response = await fetch(`${this.PAYSTACK_API_BASE}/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.PAYSTACK_SECRET}`,
        },
        body: JSON.stringify({
          transaction: reference,
          reason,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as any;
        throw new Error(`Refund failed: ${errorData.message}`);
      }

      const result = (await response.json()) as any;

      logger.info(`Refund created for transaction ${reference}`, {
        refundReference: result.data.reference,
      });

      return {
        refundReference: result.data.reference,
        status: result.data.status,
      };
    } catch (error) {
      logger.error("Failed to create refund:", error);
      throw error;
    }
  }

  // =========================================================================
  // SUBSCRIPTION PAYMENTS
  // =========================================================================

  /**
   * Create or retrieve a Paystack plan for a subscription tier
   */
  static async getOrCreatePaystackPlan(tier: SubscriptionTier): Promise<{
    planCode: string;
    name: string;
    amount: number;
  }> {
    const tierConfig =
      tier === SubscriptionTier.PHARMA_PRO
        ? SUBSCRIPTION_TIERS.PHARMA_PRO
        : SUBSCRIPTION_TIERS.PHARMA_ELITE;

    // List existing plans and try to find a match
    try {
      const listRes = await fetch(`${this.PAYSTACK_API_BASE}/plan`, {
        headers: { Authorization: `Bearer ${this.PAYSTACK_SECRET}` },
      });
      const listData = (await listRes.json()) as any;

      if (listData.status && listData.data) {
        const existing = listData.data.find(
          (p: any) =>
            p.name === tierConfig.name &&
            p.amount === tierConfig.priceNGN * 100 &&
            p.interval === "monthly"
        );
        if (existing) {
          return {
            planCode: existing.plan_code,
            name: existing.name,
            amount: existing.amount / 100,
          };
        }
      }
    } catch {
      // If listing fails, proceed to create
    }

    // Create new plan
    const response = await fetch(`${this.PAYSTACK_API_BASE}/plan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.PAYSTACK_SECRET}`,
      },
      body: JSON.stringify({
        name: tierConfig.name,
        amount: tierConfig.priceNGN * 100, // kobo
        interval: "monthly",
        description: `PharmaConnect ${tierConfig.name} subscription`,
        currency: "NGN",
      }),
    });

    if (!response.ok) {
      const err = (await response.json()) as any;
      throw new Error(`Failed to create Paystack plan: ${err.message}`);
    }

    const result = (await response.json()) as any;
    logger.info(`Paystack plan created: ${result.data.plan_code} for ${tierConfig.name}`);

    return {
      planCode: result.data.plan_code,
      name: tierConfig.name,
      amount: tierConfig.priceNGN,
    };
  }

  /**
   * Initialize subscription payment — redirects user to Paystack to pay & subscribe
   */
  static async initializeSubscription(data: {
    email: string;
    tier: SubscriptionTier;
    pharmacyId: string;
  }): Promise<{
    authorizationUrl: string;
    accessCode: string;
    reference: string;
  }> {
    try {
      const plan = await this.getOrCreatePaystackPlan(data.tier);
      const reference = `SUB-${data.pharmacyId}-${Date.now()}`;

      const response = await fetch(
        `${this.PAYSTACK_API_BASE}/transaction/initialize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.PAYSTACK_SECRET}`,
          },
          body: JSON.stringify({
            email: data.email,
            amount: plan.amount * 100, // kobo
            reference,
            plan: plan.planCode,
            metadata: {
              pharmacyId: data.pharmacyId,
              tier: data.tier,
              type: "subscription",
            },
          }),
        }
      );

      if (!response.ok) {
        const err = (await response.json()) as any;
        throw new Error(`Subscription init failed: ${err.message}`);
      }

      const result = (await response.json()) as any;

      logger.info(
        `Subscription payment initialized for pharmacy ${data.pharmacyId}`,
        { reference, tier: data.tier }
      );

      return {
        authorizationUrl: result.data.authorization_url,
        accessCode: result.data.access_code,
        reference: result.data.reference,
      };
    } catch (error) {
      logger.error("Failed to initialize subscription payment:", error);
      throw error;
    }
  }

  // =========================================================================
  // GUEST PAYMENT (no auth required — email-based)
  // =========================================================================

  /**
   * Initialize payment for a guest user (no Firebase auth required)
   */
  static async initializeGuestPayment(data: {
    email: string;
    phone: string;
    amount: number;
    orderId: string;
    metadata?: Record<string, unknown>;
  }): Promise<{
    authorizationUrl: string;
    accessCode: string;
    reference: string;
  }> {
    try {
      const reference = `GUEST-${data.orderId}-${Date.now()}`;

      const response = await fetch(
        `${this.PAYSTACK_API_BASE}/transaction/initialize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.PAYSTACK_SECRET}`,
          },
          body: JSON.stringify({
            email: data.email,
            amount: data.amount * 100,
            reference,
            metadata: {
              orderId: data.orderId,
              guestPhone: data.phone,
              type: "guest_order",
              ...data.metadata,
            },
          }),
        }
      );

      if (!response.ok) {
        const err = (await response.json()) as any;
        throw new Error(`Guest payment init failed: ${err.message}`);
      }

      const result = (await response.json()) as any;

      logger.info(`Guest payment initialized for order ${data.orderId}`, {
        reference,
        email: data.email,
      });

      return {
        authorizationUrl: result.data.authorization_url,
        accessCode: result.data.access_code,
        reference: result.data.reference,
      };
    } catch (error) {
      logger.error("Failed to initialize guest payment:", error);
      throw error;
    }
  }

  // =========================================================================
  // PAYOUTS / TRANSFERS
  // =========================================================================

  /**
   * Create a transfer recipient (pharmacy bank account) on Paystack
   */
  static async createTransferRecipient(data: {
    name: string;
    accountNumber: string;
    bankCode: string;
  }): Promise<string> {
    try {
      const response = await fetch(
        `${this.PAYSTACK_API_BASE}/transferrecipient`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.PAYSTACK_SECRET}`,
          },
          body: JSON.stringify({
            type: "nuban",
            name: data.name,
            account_number: data.accountNumber,
            bank_code: data.bankCode,
            currency: "NGN",
          }),
        }
      );

      if (!response.ok) {
        const err = (await response.json()) as any;
        throw new Error(`Failed to create recipient: ${err.message}`);
      }

      const result = (await response.json()) as any;
      logger.info(`Transfer recipient created: ${result.data.recipient_code}`);
      return result.data.recipient_code;
    } catch (error) {
      logger.error("Failed to create transfer recipient:", error);
      throw error;
    }
  }

  /**
   * Initiate a transfer (payout) to a pharmacy
   */
  static async initiateTransfer(data: {
    amount: number; // Naira
    recipientCode: string;
    reason: string;
    reference?: string;
  }): Promise<{
    transferCode: string;
    reference: string;
    status: string;
  }> {
    try {
      const reference = data.reference || `PAY-${Date.now()}`;

      const response = await fetch(`${this.PAYSTACK_API_BASE}/transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.PAYSTACK_SECRET}`,
        },
        body: JSON.stringify({
          source: "balance",
          amount: data.amount * 100, // kobo
          recipient: data.recipientCode,
          reason: data.reason,
          reference,
        }),
      });

      if (!response.ok) {
        const err = (await response.json()) as any;
        throw new Error(`Transfer failed: ${err.message}`);
      }

      const result = (await response.json()) as any;

      logger.info(`Transfer initiated: ${result.data.transfer_code}`, {
        amount: data.amount,
        recipient: data.recipientCode,
      });

      return {
        transferCode: result.data.transfer_code,
        reference: result.data.reference,
        status: result.data.status,
      };
    } catch (error) {
      logger.error("Failed to initiate transfer:", error);
      throw error;
    }
  }

  /**
   * List Nigerian banks (for payout bank selection)
   */
  static async listBanks(): Promise<
    Array<{ name: string; code: string; slug: string }>
  > {
    try {
      const response = await fetch(
        `${this.PAYSTACK_API_BASE}/bank?country=nigeria&perPage=100`,
        {
          headers: { Authorization: `Bearer ${this.PAYSTACK_SECRET}` },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch banks");
      }

      const result = (await response.json()) as any;
      return result.data.map((b: any) => ({
        name: b.name,
        code: b.code,
        slug: b.slug,
      }));
    } catch (error) {
      logger.error("Failed to list banks:", error);
      throw error;
    }
  }

  /**
   * Resolve bank account details (verify account number + bank)
   */
  static async resolveAccount(
    accountNumber: string,
    bankCode: string
  ): Promise<{ accountName: string; accountNumber: string }> {
    try {
      const response = await fetch(
        `${this.PAYSTACK_API_BASE}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
        {
          headers: { Authorization: `Bearer ${this.PAYSTACK_SECRET}` },
        }
      );

      if (!response.ok) {
        const err = (await response.json()) as any;
        throw new Error(`Account resolution failed: ${err.message}`);
      }

      const result = (await response.json()) as any;
      return {
        accountName: result.data.account_name,
        accountNumber: result.data.account_number,
      };
    } catch (error) {
      logger.error("Failed to resolve account:", error);
      throw error;
    }
  }

  // =========================================================================
  // ENHANCED WEBHOOK
  // =========================================================================

  /**
   * Handle Paystack webhook — supports charge.success, subscription.create,
   * transfer.success, transfer.failed events
   */
  static async handleWebhookV2(
    signature: string,
    body: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Verify signature
      const hash = crypto
        .createHmac("sha512", this.PAYSTACK_SECRET)
        .update(body)
        .digest("hex");

      if (hash !== signature) {
        logger.warn("Invalid webhook signature");
        return { success: false, message: "Invalid signature" };
      }

      const event = JSON.parse(body);
      const eventType = event.event as string;
      const data = event.data;

      logger.info(`Webhook received: ${eventType}`, {
        reference: data.reference,
      });

      // IDEMPOTENCY: Check if webhook has already been processed
      if (data.reference) {
        try {
          const db = getFirestore();
          const webhookDocRef = db
            .collection("processed_webhooks")
            .doc(data.reference);

          // Use transaction for atomic check-and-set
          const result = await db.runTransaction(async (transaction) => {
            const docSnapshot = await transaction.get(webhookDocRef);

            if (docSnapshot.exists) {
              // Webhook already processed, return success to prevent Paystack retries
              logger.warn(
                `Webhook idempotency: reference ${data.reference} already processed`
              );
              return { alreadyProcessed: true };
            }

            // Mark webhook as processed
            transaction.set(webhookDocRef, {
              reference: data.reference,
              eventType,
              processedAt: new Date(),
            });

            return { alreadyProcessed: false };
          });

          if (result.alreadyProcessed) {
            return { success: true, message: "Webhook already processed" };
          }
        } catch (error) {
          logger.error("Idempotency check failed:", error);
          // Continue with processing if idempotency check fails
        }
      }

      switch (eventType) {
        case "charge.success": {
          const metadata = data.metadata || {};

          if (metadata.type === "subscription") {
            // Subscription payment succeeded — activate subscription
            await SubscriptionService.changeTier(
              metadata.pharmacyId,
              metadata.tier as SubscriptionTier,
              data.subscription_code
            );
            logger.info(
              `Subscription activated for pharmacy ${metadata.pharmacyId}`
            );
          } else {
            // Regular order payment
            const orderId = metadata.orderId;
            if (orderId) {
              await OrderService.updatePaymentStatus(
                orderId,
                PaymentStatus.PAID,
                data.reference
              );
              logger.info(
                `Order payment processed for order ${orderId}`
              );
            }
          }
          return { success: true, message: "Charge processed" };
        }

        case "subscription.create": {
          logger.info("Subscription created on Paystack", {
            code: data.subscription_code,
            plan: data.plan?.plan_code,
          });
          return { success: true, message: "Subscription noted" };
        }

        case "subscription.disable": {
          // Subscription cancelled on Paystack side
          const email = data.customer?.email;
          logger.info(`Subscription disabled for ${email}`, {
            code: data.subscription_code,
          });
          return { success: true, message: "Subscription disable noted" };
        }

        case "transfer.success": {
          logger.info("Transfer succeeded", {
            reference: data.reference,
            amount: data.amount,
          });
          return { success: true, message: "Transfer success noted" };
        }

        case "transfer.failed": {
          logger.warn("Transfer failed", {
            reference: data.reference,
            reason: data.reason,
          });
          return { success: true, message: "Transfer failure noted" };
        }

        default: {
          logger.info(`Unhandled webhook event: ${eventType}`);
          return { success: false, message: "Event not processed" };
        }
      }
    } catch (error) {
      logger.error("Webhook V2 processing error:", error);
      return { success: false, message: "Webhook processing failed" };
    }
  }
}
