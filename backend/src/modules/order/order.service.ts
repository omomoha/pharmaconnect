import { getFirestore } from "../../config/firebase.js";
import logger from "../../utils/logger.js";
import { formatCurrency } from "../../utils/helpers.js";
import {
  Order,
  OrderItem,
  OrderStatus,
  PaymentStatus,
  DrugCategory,
} from "@pharmaconnect/shared/dist/types/index.js";
import { FIRESTORE_COLLECTIONS, COMMISSION } from "@pharmaconnect/shared/dist/constants/index.js";
import { v4 as uuid } from "uuid";

/**
 * Order Service
 */
export class OrderService {
  /**
   * Create new order
   */
  static async createOrder(data: {
    customerId: string;
    pharmacyId: string;
    deliveryAddress: string;
    deliveryLatitude: number;
    deliveryLongitude: number;
    items: Array<{
      pharmacyProductId: string;
      drugName: string;
      category: string;
      quantity: number;
      unitPrice: number;
    }>;
    notes?: string;
  }): Promise<Order> {
    try {
      const db = getFirestore();
      const orderId = uuid();
      const now = new Date();

      // Calculate totals
      const subtotal = data.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      const pharmacyCommission = formatCurrency(
        subtotal * (COMMISSION.PHARMACY_COMMISSION_PERCENT / 100)
      );
      const serviceFee = formatCurrency(subtotal * (COMMISSION.SERVICE_FEE_PERCENT / 100));
      const deliveryFee = 0; // Will be set when delivery provider is assigned
      const deliveryCommission = 0; // Will be calculated after delivery fee is set
      const total = formatCurrency(subtotal + serviceFee + deliveryFee);

      const order: Order = {
        id: orderId,
        customerId: data.customerId,
        pharmacyId: data.pharmacyId,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        subtotal,
        pharmacyCommission,
        deliveryFee,
        deliveryCommission,
        serviceFee,
        total,
        paymentMethod: "paystack",
        deliveryAddress: data.deliveryAddress,
        deliveryLatitude: data.deliveryLatitude,
        deliveryLongitude: data.deliveryLongitude,
        notes: data.notes,
        createdAt: now,
        updatedAt: now,
      };

      // Save order
      await db.collection(FIRESTORE_COLLECTIONS.ORDERS).doc(orderId).set(order);

      // Save order items
      for (const item of data.items) {
        const itemId = uuid();
        const orderItem: OrderItem = {
          id: itemId,
          orderId,
          pharmacyProductId: item.pharmacyProductId,
          drugName: item.drugName,
          category: item.category as DrugCategory,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.unitPrice * item.quantity,
          createdAt: now,
          updatedAt: now,
        };

        await db
          .collection(FIRESTORE_COLLECTIONS.ORDER_ITEMS)
          .doc(itemId)
          .set(orderItem);
      }

      logger.info(`Order created: ${orderId}`);
      return order;
    } catch (error) {
      logger.error("Failed to create order:", error);
      throw error;
    }
  }

  /**
   * Get order by ID
   */
  static async getOrder(id: string): Promise<Order | null> {
    try {
      const db = getFirestore();
      const doc = await db.collection(FIRESTORE_COLLECTIONS.ORDERS).doc(id).get();

      if (!doc.exists) {
        return null;
      }

      return doc.data() as Order;
    } catch (error) {
      logger.error(`Failed to get order ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get order with items
   */
  static async getOrderWithItems(id: string): Promise<{
    order: Order;
    items: OrderItem[];
  } | null> {
    try {
      const order = await this.getOrder(id);
      if (!order) {
        return null;
      }

      const db = getFirestore();
      const snapshot = await db
        .collection(FIRESTORE_COLLECTIONS.ORDER_ITEMS)
        .where("orderId", "==", id)
        .get();

      const items = snapshot.docs.map((doc) => doc.data() as OrderItem);

      return { order, items };
    } catch (error) {
      logger.error(`Failed to get order with items ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get user's orders
   */
  static async getUserOrders(userId: string, limit: number = 50): Promise<Order[]> {
    try {
      const db = getFirestore();
      const snapshot = await db
        .collection(FIRESTORE_COLLECTIONS.ORDERS)
        .where("customerId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => doc.data() as Order);
    } catch (error) {
      logger.error(`Failed to get orders for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get pharmacy's orders
   */
  static async getPharmacyOrders(pharmacyId: string, limit: number = 50): Promise<Order[]> {
    try {
      const db = getFirestore();
      const snapshot = await db
        .collection(FIRESTORE_COLLECTIONS.ORDERS)
        .where("pharmacyId", "==", pharmacyId)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => doc.data() as Order);
    } catch (error) {
      logger.error(`Failed to get orders for pharmacy ${pharmacyId}:`, error);
      throw error;
    }
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    try {
      const db = getFirestore();
      await db
        .collection(FIRESTORE_COLLECTIONS.ORDERS)
        .doc(id)
        .update({
          status,
          updatedAt: new Date(),
        });

      const updated = await this.getOrder(id);
      if (!updated) {
        throw new Error("Order not found after update");
      }

      logger.info(`Order status updated: ${id} -> ${status}`);
      return updated;
    } catch (error) {
      logger.error(`Failed to update order status for ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update payment status
   */
  static async updatePaymentStatus(
    id: string,
    paymentStatus: PaymentStatus,
    paymentReference?: string
  ): Promise<Order> {
    try {
      const db = getFirestore();
      const updateData: any = {
        paymentStatus,
        updatedAt: new Date(),
      };

      if (paymentReference) {
        updateData.paymentReference = paymentReference;
      }

      await db.collection(FIRESTORE_COLLECTIONS.ORDERS).doc(id).update(updateData);

      const updated = await this.getOrder(id);
      if (!updated) {
        throw new Error("Order not found after update");
      }

      logger.info(`Payment status updated: ${id} -> ${paymentStatus}`);
      return updated;
    } catch (error) {
      logger.error(`Failed to update payment status for ${id}:`, error);
      throw error;
    }
  }

  /**
   * Calculate total order amount
   */
  static calculateOrderTotal(
    subtotal: number,
    deliveryFee: number = 0,
    discountPercent: number = 0
  ): {
    subtotal: number;
    pharmacyCommission: number;
    deliveryFee: number;
    serviceFee: number;
    total: number;
  } {
    const pharmacyCommission = formatCurrency(
      subtotal * (COMMISSION.PHARMACY_COMMISSION_PERCENT / 100)
    );
    const serviceFee = formatCurrency(subtotal * (COMMISSION.SERVICE_FEE_PERCENT / 100));
    const discountAmount = formatCurrency((subtotal * discountPercent) / 100);
    const total = formatCurrency(
      subtotal + serviceFee + deliveryFee - discountAmount
    );

    return {
      subtotal: formatCurrency(subtotal - discountAmount),
      pharmacyCommission,
      deliveryFee,
      serviceFee,
      total,
    };
  }

  /**
   * Cancel order
   */
  static async cancelOrder(id: string, reason?: string): Promise<Order> {
    try {
      const db = getFirestore();
      const order = await this.getOrder(id);

      if (!order) {
        throw new Error("Order not found");
      }

      if (
        order.status === OrderStatus.CANCELLED ||
        order.status === OrderStatus.DELIVERED
      ) {
        throw new Error("Cannot cancel order in this status");
      }

      const updateData: any = {
        status: OrderStatus.CANCELLED,
        updatedAt: new Date(),
      };

      if (reason) {
        updateData.cancellationReason = reason;
      }

      await db.collection(FIRESTORE_COLLECTIONS.ORDERS).doc(id).update(updateData);

      logger.info(`Order cancelled: ${id}`);
      return await this.getOrder(id) as Order;
    } catch (error) {
      logger.error(`Failed to cancel order ${id}:`, error);
      throw error;
    }
  }
}
