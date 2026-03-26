import { getFirestore } from "../../config/firebase.js";
import logger from "../../utils/logger.js";
import config from "../../config/index.js";
import { PaymentStatus } from "@pharmaconnect/shared/dist/types/index.js";
import { OrderService } from "../order/order.service.js";
import crypto from "crypto";

/**
 * Payment Service
 * Integration with Paystack payment gateway
 */
export class PaymentService {
  private static readonly PAYSTACK_API_BASE = "https://api.paystack.co";
  private static readonly PAYSTACK_SECRET = config.PAYSTACK_SECRET_KEY;

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
        const errorData = await response.json();
        throw new Error(
          `Paystack API error: ${errorData.message || "Unknown error"}`
        );
      }

      const result = await response.json();

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

      const result = await response.json();
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

      const { reference, status, amount, metadata } = event.data;

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
        const errorData = await response.json();
        throw new Error(`Refund failed: ${errorData.message}`);
      }

      const result = await response.json();

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
}
