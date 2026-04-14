import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middleware/authenticate.js";
import { OrderService } from "./order.service.js";
import { PharmacyService } from "../pharmacy/pharmacy.service.js";
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
   * POST /guest
   * Create guest order (no auth required)
   */
  static async createGuestOrder(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const schema = z.object({
        guestEmail: z.string().email(),
        guestPhone: z.string().min(10),
        guestName: z.string().min(1),
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

      const order = await OrderService.createGuestOrder(validated);

      logger.info(`Guest order created: ${order.id}`);

      res.status(201).json(
        apiResponse(true, {
          order,
        })
      );
    } catch (error) {
      logger.error("Create guest order error:", error);
      res.status(500).json(
        apiResponse(false, undefined, {
          code: "GUEST_ORDER_CREATION_FAILED",
          message: "Failed to create guest order",
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

      // Check authorization — allow customer, pharmacy owner, or admin
      if (req.user) {
        const isCustomer = orderData.order.customerId === req.user.uid;
        let isPharmacyOwner = false;

        if (!isCustomer) {
          const pharmacy = await PharmacyService.getPharmacy(orderData.order.pharmacyId);
          isPharmacyOwner = !!pharmacy && pharmacy.userId === req.user.uid;
        }

        if (!isCustomer && !isPharmacyOwner) {
          res.status(403).json(
            apiResponse(false, undefined, {
              code: "FORBIDDEN",
              message: "You do not have permission to view this order",
            })
          );
          return;
        }
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
   * GET /pharmacy/:pharmacyId
   * Get orders for a specific pharmacy
   */
  static async getPharmacyOrders(
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

      const { pharmacyId } = req.params;

      // Verify the requesting user owns this pharmacy
      const pharmacy = await PharmacyService.getPharmacy(pharmacyId);
      if (!pharmacy) {
        res.status(404).json(
          apiResponse(false, undefined, {
            code: "PHARMACY_NOT_FOUND",
            message: "Pharmacy not found",
          })
        );
        return;
      }

      if (pharmacy.userId !== req.user!.uid) {
        res.status(403).json(
          apiResponse(false, undefined, {
            code: "FORBIDDEN",
            message: "You do not have permission to view this pharmacy's orders",
          })
        );
        return;
      }

      const schema = z.object({
        limit: z.coerce.number().optional().default(100),
      });

      const validated = schema.parse(req.query);

      const orders = await OrderService.getPharmacyOrders(pharmacyId, validated.limit);

      res.json(
        apiResponse(true, {
          orders,
          count: orders.length,
        })
      );
    } catch (error) {
      logger.error("Get pharmacy orders error:", error);
      res.status(500).json(
        apiResponse(false, undefined, {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve pharmacy orders",
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

      // Verify authorization: only the pharmacy owner can update order status
      const existingOrder = await OrderService.getOrder(orderId);
      if (!existingOrder) {
        res.status(404).json(
          apiResponse(false, undefined, {
            code: "ORDER_NOT_FOUND",
            message: "Order not found",
          })
        );
        return;
      }

      const pharmacy = await PharmacyService.getPharmacy(existingOrder.pharmacyId);
      if (!pharmacy || pharmacy.userId !== req.user!.uid) {
        res.status(403).json(
          apiResponse(false, undefined, {
            code: "FORBIDDEN",
            message: "Only the pharmacy owner can update order status",
          })
        );
        return;
      }

      const order = await OrderService.updateOrderStatus(orderId, validated.status as any);

      logger.info(`Order status updated by pharmacy owner ${req.user!.uid}`);

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

      // Verify authorization: customer or pharmacy owner can cancel
      const existingOrder = await OrderService.getOrder(orderId);
      if (!existingOrder) {
        res.status(404).json(
          apiResponse(false, undefined, {
            code: "ORDER_NOT_FOUND",
            message: "Order not found",
          })
        );
        return;
      }

      const isCustomer = existingOrder.customerId === req.user!.uid;
      let isPharmacyOwner = false;
      if (!isCustomer) {
        const pharmacy = await PharmacyService.getPharmacy(existingOrder.pharmacyId);
        isPharmacyOwner = !!pharmacy && pharmacy.userId === req.user!.uid;
      }

      if (!isCustomer && !isPharmacyOwner) {
        res.status(403).json(
          apiResponse(false, undefined, {
            code: "FORBIDDEN",
            message: "You do not have permission to cancel this order",
          })
        );
        return;
      }

      const order = await OrderService.cancelOrder(orderId, validated.reason);

      logger.info(`Order cancelled by user ${req.user!.uid} (${isCustomer ? 'customer' : 'pharmacy'})`);

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
