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
import { FieldValue } from "firebase-admin/firestore";
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

      // Use a Firestore transaction to atomically verify stock, decrement it,
      // and create the order + items — prevents overselling under concurrent orders.
      const order = await db.runTransaction(async (transaction) => {
        // Step 1: Read all product documents inside the transaction
        const productRefs = data.items.map((item) =>
          db.collection(FIRESTORE_COLLECTIONS.PHARMACY_PRODUCTS).doc(item.pharmacyProductId)
        );
        const productDocs = await Promise.all(
          productRefs.map((ref) => transaction.get(ref))
        );

        // Step 2: Verify prices, stock, and active status
        const verifiedItems = [];
        for (let i = 0; i < data.items.length; i++) {
          const item = data.items[i];
          const doc = productDocs[i];

          if (!doc.exists) {
            throw new Error(`Product not found: ${item.pharmacyProductId}`);
          }

          const product = doc.data()!;
          if (!product.isActive) {
            throw new Error(`Product is no longer available: ${item.drugName}`);
          }
          if (product.pharmacyId !== data.pharmacyId) {
            throw new Error(`Product does not belong to this pharmacy: ${item.drugName}`);
          }
          if (product.quantity < item.quantity) {
            throw new Error(
              `Insufficient stock for ${item.drugName}: requested ${item.quantity}, available ${product.quantity}`
            );
          }

          // Use server-side price, applying discount if applicable
          const serverPrice = product.discount
            ? formatCurrency(product.price * (1 - product.discount / 100))
            : product.price;

          verifiedItems.push({
            ...item,
            unitPrice: serverPrice,
          });
        }

        // Step 3: Calculate totals from verified server-side prices
        const subtotal = verifiedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
        const pharmacyCommission = formatCurrency(
          subtotal * (COMMISSION.PHARMACY_COMMISSION_PERCENT / 100)
        );
        const serviceFee = formatCurrency(subtotal * (COMMISSION.SERVICE_FEE_PERCENT / 100));
        const deliveryFee = 0;
        const deliveryCommission = 0;
        const total = formatCurrency(subtotal + serviceFee + deliveryFee);

        const newOrder: Order = {
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

        // Step 4: Atomically decrement stock and create order + items
        for (let i = 0; i < data.items.length; i++) {
          transaction.update(productRefs[i], {
            quantity: FieldValue.increment(-data.items[i].quantity),
            updatedAt: now,
          });
        }

        transaction.set(
          db.collection(FIRESTORE_COLLECTIONS.ORDERS).doc(orderId),
          newOrder
        );

        for (const item of verifiedItems) {
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

          transaction.set(
            db.collection(FIRESTORE_COLLECTIONS.ORDER_ITEMS).doc(itemId),
            orderItem
          );
        }

        return newOrder;
      });

      logger.info(`Order created: ${orderId}`);
      return order;
    } catch (error) {
      logger.error("Failed to create order:", error);
      throw error;
    }
  }

  /**
   * Create a guest order (no Firebase auth required)
   */
  static async createGuestOrder(data: {
    guestEmail: string;
    guestPhone: string;
    guestName: string;
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
      const guestCustomerId = `guest_${orderId}`;

      // Use a Firestore transaction for atomic stock verification + decrement
      const order = await db.runTransaction(async (transaction) => {
        // Read all product documents inside the transaction
        const productRefs = data.items.map((item) =>
          db.collection(FIRESTORE_COLLECTIONS.PHARMACY_PRODUCTS).doc(item.pharmacyProductId)
        );
        const productDocs = await Promise.all(
          productRefs.map((ref) => transaction.get(ref))
        );

        const verifiedItems = [];
        for (let i = 0; i < data.items.length; i++) {
          const item = data.items[i];
          const doc = productDocs[i];

          if (!doc.exists) {
            throw new Error(`Product not found: ${item.pharmacyProductId}`);
          }

          const product = doc.data()!;
          if (!product.isActive) {
            throw new Error(`Product is no longer available: ${item.drugName}`);
          }
          if (product.pharmacyId !== data.pharmacyId) {
            throw new Error(`Product does not belong to this pharmacy: ${item.drugName}`);
          }
          if (product.quantity < item.quantity) {
            throw new Error(
              `Insufficient stock for ${item.drugName}: requested ${item.quantity}, available ${product.quantity}`
            );
          }

          const serverPrice = product.discount
            ? formatCurrency(product.price * (1 - product.discount / 100))
            : product.price;

          verifiedItems.push({ ...item, unitPrice: serverPrice });
        }

        const subtotal = verifiedItems.reduce(
          (sum, item) => sum + item.unitPrice * item.quantity, 0
        );
        const pharmacyCommission = formatCurrency(
          subtotal * (COMMISSION.PHARMACY_COMMISSION_PERCENT / 100)
        );
        const serviceFee = formatCurrency(subtotal * (COMMISSION.SERVICE_FEE_PERCENT / 100));
        const deliveryFee = 0;
        const deliveryCommission = 0;
        const total = formatCurrency(subtotal + serviceFee + deliveryFee);

        const newOrder: Order = {
          id: orderId,
          customerId: guestCustomerId,
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

        // Atomically decrement stock
        for (let i = 0; i < data.items.length; i++) {
          transaction.update(productRefs[i], {
            quantity: FieldValue.increment(-data.items[i].quantity),
            updatedAt: now,
          });
        }

        transaction.set(
          db.collection(FIRESTORE_COLLECTIONS.ORDERS).doc(orderId),
          newOrder
        );

        // Store guest contact info in a subcollection
        transaction.set(
          db.collection(FIRESTORE_COLLECTIONS.ORDERS)
            .doc(orderId)
            .collection("guest_info")
            .doc("contact"),
          {
            email: data.guestEmail,
            phone: data.guestPhone,
            name: data.guestName,
            createdAt: now,
          }
        );

        for (const item of verifiedItems) {
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

          transaction.set(
            db.collection(FIRESTORE_COLLECTIONS.ORDER_ITEMS).doc(itemId),
            orderItem
          );
        }

        return newOrder;
      });

      logger.info(`Guest order created: ${orderId} for ${data.guestEmail}`);
      return order;
    } catch (error) {
      logger.error("Failed to create guest order:", error);
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
   * Cancel order and restore inventory stock.
   *
   * Uses a Firestore transaction to atomically:
   *   1. Mark the order as cancelled
   *   2. Restore product quantities for all order items
   *
   * This prevents inventory desync when orders are cancelled after stock
   * was decremented during order creation.
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

      // Fetch order items for stock restoration
      const itemsSnapshot = await db
        .collection(FIRESTORE_COLLECTIONS.ORDER_ITEMS)
        .where("orderId", "==", id)
        .get();

      await db.runTransaction(async (transaction) => {
        // Restore stock for each order item
        for (const itemDoc of itemsSnapshot.docs) {
          const item = itemDoc.data() as OrderItem;
          const productRef = db
            .collection(FIRESTORE_COLLECTIONS.PHARMACY_PRODUCTS)
            .doc(item.pharmacyProductId);

          transaction.update(productRef, {
            quantity: FieldValue.increment(item.quantity),
            updatedAt: new Date(),
          });
        }

        // Update order status
        const updateData: any = {
          status: OrderStatus.CANCELLED,
          updatedAt: new Date(),
        };

        if (reason) {
          updateData.cancellationReason = reason;
        }

        // If payment was completed, mark for refund
        if (order.paymentStatus === PaymentStatus.PAID) {
          updateData.paymentStatus = PaymentStatus.REFUNDED;
        }

        transaction.update(
          db.collection(FIRESTORE_COLLECTIONS.ORDERS).doc(id),
          updateData
        );
      });

      logger.info(`Order cancelled with stock restoration: ${id} (${itemsSnapshot.size} items restored)`);
      return await this.getOrder(id) as Order;
    } catch (error) {
      logger.error(`Failed to cancel order ${id}:`, error);
      throw error;
    }
  }
}
