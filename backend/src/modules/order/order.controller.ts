import { Response } from "express";
import { AuthenticatedRequest } from "../../middleware/authenticate.js";
import { OrderService } from "./order.service.js";
import { apiResponse } from "../../utils/helpers.js";
import logger from "../../utils/logger.js";
import { z } from "zod";
import { DrugCategory } from "@pharmaconnect/shared/dist/types/index.js";

/**
 * Order Controller
 */
export class OrderController {
  /**
   * POST /
   * Create new order
   */
  static async createOrder(
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
        pharmacyId: z.string().min(1),
        deliveryAddress: z.string().min(1),
        deliveryLatitude: z.number(),
        deliveryLongitude: z.number(),
        items: z.array(
          z.object({
            pharmacyProductId: z.string(),
            drugName: z.string(),
            category: z.nativeEnum(DrugCategory),
            quantity: z.number().positive(),
            unitPrice: z.number().positive(),
          })
        ),
        notes: z.string().optional(),
      });

      const validated = schema.parse(req.body);

      const order = await OrderService.createOrder({
        customerId: req.user.uid,
        ...validated,
      });

      logger.info(`Order created by user ${req.user.uid}`);

      res.status(201).json(
        apiResponse(true, {
          order,
        })
      );
    } catch (error) {
      logger.error("Create order error:", error);
      res.status(500).json(
        apiResponse(false, undefined, {
          code: "ORDER_CREATION_FAILED",
          message: "Failed to create order",
        })
      );
    }
  }

  /**
   * GET /:orderId
   * Get order details
   */
  static async getOrder(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { orderId } = req.params;

      const orderData = await OrderService.getOrderWithItems(orderId);

      if (!orderData) {
        res.status(404).json(
          apiResponse(false, undefined, {
            code: "ORDER_NOT_FOUND",
            message: "Order not found",
          })
        );
        return;
      }

      // Check authorization
      if (
        req.user &&
        orderData.order.customerId !== req.user.uid
      ) {
        res.status(403).json(
          apiResponse(false, undefined, {
            code: "FORBIDDEN",
            message: "You do not have permission to view this order",
          })
        );
        return;
      }

      res.json(apiResponse(true, orderData));
    } catch (error) {
      logger.error("Get order error:", error);
      res.status(500).json(
        apiResponse(false, undefined, {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve order",
        })
      );
    }
  }

  /**
   * GET /user/my-orders
   * Get current user's orders
   */
  static async getUserOrders(
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
        limit: z.coerce.number().optional().default(50),
      });

      const validated = schema.parse(req.query);

      const orders = await OrderService.getUserOrders(req.user.uid, validated.limit);

      res.json(
        apiResponse(true, {
          orders,
          count: orders.length,
        })
      );
    } catch (error) {
      logger.error("Get user orders error:", error);
      res.status(500).json(
        apiResponse(false, undefined, {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve orders",
        })
      );
    }
  }

  /**
   * PATCH /:orderId/status
   * Update order status
   */
  static async updateOrderStatus(
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

      const { orderId } = req.params;
      const schema = z.object({
        status: z.enum([
          "pending",
          "confirmed",
          "preparing",
          "ready_for_pickup",
          "out_for_delivery",
          "delivered",
          "cancelled",
          "refunded",
        ]),
      });

      const validated = schema.parse(req.body);

      const order = await OrderService.updateOrderStatus(orderId, validated.status as any);

      logger.info(`Order status updated by user ${req.user.uid}`);

      res.json(
        apiResponse(true, {
          order,
        })
      );
    } catch (error) {
      logger.error("Update order status error:", error);
      res.status(500).json(
        apiResponse(false, undefined, {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update order status",
        })
      );
    }
  }

  /**
   * POST /:orderId/cancel
   * Cancel order
   */
  static async cancelOrder(
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

      const { orderId } = req.params;
      const schema = z.object({
        reason: z.string().optional(),
      });

      const validated = schema.parse(req.body);

      const order = await OrderService.cancelOrder(orderId, validated.reason);

      logger.info(`Order cancelled by user ${req.user.uid}`);

      res.json(
        apiResponse(true, {
          order,
        })
      );
    } catch (error) {
      logger.error("Cancel order error:", error);
      res.status(500).json(
        apiResponse(false, undefined, {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to cancel order",
        })
      );
    }
  }
}
