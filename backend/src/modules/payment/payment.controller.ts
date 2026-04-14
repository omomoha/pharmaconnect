import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middleware/authenticate.js";
import { PaymentService } from "./payment.service.js";
import { apiResponse } from "../../utils/helpers.js";
import logger from "../../utils/logger.js";
import { z } from "zod";
import { SubscriptionTier } from "@pharmaconnect/shared/dist/types/index.js";

declare global {
  namespace Express {
    interface Request {
      rawBody?: string;
    }
  }
}

/**
 * Payment Controller
 */
export class PaymentController {
  /**
   * POST /initialize
   * Initialize payment for an order
   */
  static async initializePayment(
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
        orderId: z.string(),
        amount: z.number().positive(),
      });

      const validated = schema.parse(req.body);

      const paymentData = await PaymentService.initializePayment({
        email: req.user.email,
        amount: validated.amount,
        orderId: validated.orderId,
        metadata: {
          userId: req.user.uid,
        },
      });

      logger.info(`Payment initialized for user ${req.user.uid}`);

      res.json(
        apiResponse(true, {
          payment: paymentData,
        })
      );
    } catch (error) {
      logger.error("Initialize payment error:", error);
      res.status(500).json(
        apiResponse(false, undefined, {
          code: "PAYMENT_INITIALIZATION_FAILED",
          message: "Failed to initialize payment",
        })
      );
    }
  }

  /**
   * GET /verify/:reference
   * Verify payment
   */
  static async verifyPayment(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { reference } = req.params;

      const verification = await PaymentService.verifyPayment(reference);

      if (!verification.success) {
        res.status(400).json(
          apiResponse(false, undefined, {
            code: "PAYMENT_VERIFICATION_FAILED",
            message: "Payment verification failed",
          })
        );
        return;
      }

      logger.info(`Payment verified: ${reference}`);

      res.json(
        apiResponse(true, {
          verification,
        })
      );
    } catch (error) {
      logger.error("Verify payment error:", error);
      res.status(500).json(
        apiResponse(false, undefined, {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to verify payment",
        })
      );
    }
  }

  /**
   * POST /webhook
   * Handle Paystack webhook (enhanced V2 — supports subscriptions, transfers, etc.)
   */
  static async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers["x-paystack-signature"] as string;
      const body = req.rawBody || JSON.stringify(req.body);

      const result = await PaymentService.handleWebhookV2(signature, body);

      // Always return 200 to acknowledge receipt
      res.status(200).json({
        success: result.success,
        message: result.message,
      });
    } catch (error) {
      logger.error("Webhook handling error:", error);
      // Return 200 to prevent Paystack retries
      res.status(200).json({
        success: false,
        message: "Webhook processing error",
      });
    }
  }

  /**
   * POST /refund
   * Request refund
   */
  static async refundPayment(
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
        orderId: z.string(),
        reason: z.string().optional(),
      });

      const validated = schema.parse(req.body);

      const refund = await PaymentService.refundPayment(
        validated.orderId,
        validated.reason
      );

      logger.info(`Refund created for user ${req.user.uid}`);

      res.json(
        apiResponse(true, {
          refund,
        })
      );
    } catch (error) {
      logger.error("Refund error:", error);
      res.status(500).json(
        apiResponse(false, undefined, {
          code: "REFUND_FAILED",
          message: "Failed to process refund",
        })
      );
    }
  }

  // =========================================================================
  // SUBSCRIPTION PAYMENT
  // =========================================================================

  /**
   * POST /subscription/initialize
   * Initialize Paystack subscription checkout for a pharmacy
   */
  static async initializeSubscription(
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

      const user = req.user as any;
      if (!user.pharmacyId) {
        res.status(400).json(
          apiResponse(false, undefined, {
            code: "NOT_PHARMACY",
            message: "No pharmacy associated with this account",
          })
        );
        return;
      }

      const schema = z.object({
        tier: z.nativeEnum(SubscriptionTier),
      });

      const validated = schema.parse(req.body);

      if (validated.tier === SubscriptionTier.PHARMA_LITE) {
        res.status(400).json(
          apiResponse(false, undefined, {
            code: "INVALID_TIER",
            message: "PharmaLite is free — use the subscription change-tier endpoint instead.",
          })
        );
        return;
      }

      const paymentData = await PaymentService.initializeSubscription({
        email: req.user.email,
        tier: validated.tier,
        pharmacyId: user.pharmacyId,
      });

      logger.info(`Subscription payment initialized for pharmacy ${user.pharmacyId}`);

      res.json(
        apiResponse(true, {
          payment: paymentData,
        })
      );
    } catch (error) {
      logger.error("Initialize subscription error:", error);
      res.status(500).json(
        apiResponse(false, undefined, {
          code: "SUBSCRIPTION_INIT_FAILED",
          message: "Failed to initialize subscription payment",
        })
      );
    }
  }

  // =========================================================================
  // GUEST PAYMENT
  // =========================================================================

  /**
   * POST /guest/initialize
   * Initialize payment for guest checkout (no auth required)
   */
  static async initializeGuestPayment(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const schema = z.object({
        email: z.string().email(),
        phone: z.string().min(10),
        amount: z.number().positive(),
        orderId: z.string(),
      });

      const validated = schema.parse(req.body);

      const paymentData = await PaymentService.initializeGuestPayment({
        email: validated.email,
        phone: validated.phone,
        amount: validated.amount,
        orderId: validated.orderId,
      });

      logger.info(`Guest payment initialized for order ${validated.orderId}`);

      res.json(
        apiResponse(true, {
          payment: paymentData,
        })
      );
    } catch (error) {
      logger.error("Guest payment error:", error);
      res.status(500).json(
        apiResponse(false, undefined, {
          code: "GUEST_PAYMENT_FAILED",
          message: "Failed to initialize guest payment",
        })
      );
    }
  }

  // =========================================================================
  // BANK / PAYOUT ENDPOINTS
  // =========================================================================

  /**
   * GET /banks
   * List Nigerian banks (for payout account setup)
   */
  static async listBanks(
    _req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const banks = await PaymentService.listBanks();

      res.json(
        apiResponse(true, {
          banks,
        })
      );
    } catch (error) {
      logger.error("List banks error:", error);
      res.status(500).json(
        apiResponse(false, undefined, {
          code: "BANKS_FETCH_FAILED",
          message: "Failed to fetch bank list",
        })
      );
    }
  }

  /**
   * POST /banks/resolve
   * Resolve / verify a bank account number
   */
  static async resolveAccount(
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
        accountNumber: z.string().length(10, "Account number must be 10 digits"),
        bankCode: z.string().min(2),
      });

      const validated = schema.parse(req.body);

      const account = await PaymentService.resolveAccount(
        validated.accountNumber,
        validated.bankCode
      );

      res.json(
        apiResponse(true, {
          account,
        })
      );
    } catch (error) {
      logger.error("Resolve account error:", error);
      res.status(500).json(
        apiResponse(false, undefined, {
          code: "ACCOUNT_RESOLVE_FAILED",
          message: "Failed to resolve bank account",
        })
      );
    }
  }

  /**
   * POST /transfers/recipient
   * Create a transfer recipient (pharmacy payout bank account)
   */
  static async createTransferRecipient(
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

      const user = req.user as any;
      if (!user.pharmacyId) {
        res.status(400).json(
          apiResponse(false, undefined, {
            code: "NOT_PHARMACY",
            message: "No pharmacy associated with this account",
          })
        );
        return;
      }

      const schema = z.object({
        name: z.string().min(2),
        accountNumber: z.string().length(10, "Account number must be 10 digits"),
        bankCode: z.string().min(2),
      });

      const validated = schema.parse(req.body);

      const recipientCode = await PaymentService.createTransferRecipient({
        name: validated.name,
        accountNumber: validated.accountNumber,
        bankCode: validated.bankCode,
      });

      // Store recipient code on the pharmacy document
      const { getFirestore } = await import("../../config/firebase.js");
      const { FIRESTORE_COLLECTIONS } = await import(
        "@pharmaconnect/shared/dist/constants/index.js"
      );
      const db = getFirestore();
      await db
        .collection(FIRESTORE_COLLECTIONS.PHARMACIES)
        .doc(user.pharmacyId)
        .update({
          paystackRecipientCode: recipientCode,
          updatedAt: new Date().toISOString(),
        });

      logger.info(
        `Transfer recipient created for pharmacy ${user.pharmacyId}: ${recipientCode}`
      );

      res.json(
        apiResponse(true, {
          recipientCode,
        })
      );
    } catch (error) {
      logger.error("Create transfer recipient error:", error);
      res.status(500).json(
        apiResponse(false, undefined, {
          code: "RECIPIENT_CREATE_FAILED",
          message: "Failed to create transfer recipient",
        })
      );
    }
  }

  /**
   * POST /transfers/initiate
   * Initiate payout transfer to pharmacy (admin only in future)
   */
  static async initiateTransfer(
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
        amount: z.number().positive(),
        recipientCode: z.string(),
        reason: z.string().optional(),
      });

      const validated = schema.parse(req.body);

      const transfer = await PaymentService.initiateTransfer({
        amount: validated.amount,
        recipientCode: validated.recipientCode,
        reason: validated.reason || "PharmaConnect pharmacy payout",
      });

      logger.info(`Transfer initiated by user ${req.user.uid}`, {
        transferCode: transfer.transferCode,
        amount: validated.amount,
      });

      res.json(
        apiResponse(true, {
          transfer,
        })
      );
    } catch (error) {
      logger.error("Initiate transfer error:", error);
      res.status(500).json(
        apiResponse(false, undefined, {
          code: "TRANSFER_FAILED",
          message: "Failed to initiate transfer",
        })
      );
    }
  }
}
