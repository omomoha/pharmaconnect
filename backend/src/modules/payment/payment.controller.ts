import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middleware/authenticate.js";
import { PaymentService } from "./payment.service.js";
import { apiResponse } from "../../utils/helpers.js";
import logger from "../../utils/logger.js";
import { z } from "zod";

/**
 * Payment Controller
 */
export class PaymentController {
  /**
   * POST /initialize
   * Initialize payment
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
   * Handle Paystack webhook
   */
  static async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers["x-paystack-signature"] as string;
      const body = req.rawBody || JSON.stringify(req.body);

      const result = await PaymentService.handleWebhook(signature, body);

      // Always return 200 to acknowledge receipt
      res.status(200).json({
        success: result.success,
        message: result.message,
        orderId: result.orderId,
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
        reference: z.string(),
        reason: z.string().optional(),
      });

      const validated = schema.parse(req.body);

      const refund = await PaymentService.refundPayment(
        validated.reference,
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
}
