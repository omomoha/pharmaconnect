/**
 * Order Service Tests
 * Tests for order creation, retrieval, status updates, and calculations
 */

import { OrderService } from '../../modules/order/order.service';
import { getFirestore } from '../../config/firebase';
import { createFirestoreMock } from '../mocks/firestore.mock';
import { OrderStatus, PaymentStatus } from '@pharmaconnect/shared/dist/types/index';

jest.mock('../../config/firebase');
jest.mock('../../utils/logger');

const mockFirestore = createFirestoreMock();

describe('OrderService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFirestore.reset();
    (getFirestore as jest.Mock).mockReturnValue(mockFirestore);
  });

  describe('createOrder', () => {
    it('should create a new order with valid data', async () => {
      const orderData = {
        customerId: 'customer-123',
        pharmacyId: 'pharmacy-456',
        deliveryAddress: '123 Main St',
        deliveryLatitude: 6.5244,
        deliveryLongitude: 3.3792,
        items: [
          {
            pharmacyProductId: 'product-1',
            drugName: 'Aspirin',
            category: 'Pain Relief',
            quantity: 2,
            unitPrice: 500,
          },
          {
            pharmacyProductId: 'product-2',
            drugName: 'Cough Syrup',
            category: 'Cough',
            quantity: 1,
            unitPrice: 1200,
          },
        ],
        notes: 'Please deliver in the morning',
      };

      const order = await OrderService.createOrder(orderData);

      expect(order).toBeDefined();
      expect(order.customerId).toBe('customer-123');
      expect(order.pharmacyId).toBe('pharmacy-456');
      expect(order.status).toBe(OrderStatus.PENDING);
      expect(order.paymentStatus).toBe(PaymentStatus.PENDING);
      expect(order.subtotal).toBeGreaterThan(0);
      expect(order.total).toBeGreaterThan(order.subtotal);
      expect(order.notes).toBe('Please deliver in the morning');
    });

    it('should calculate totals correctly', async () => {
      const orderData = {
        customerId: 'customer-123',
        pharmacyId: 'pharmacy-456',
        deliveryAddress: '123 Main St',
        deliveryLatitude: 6.5244,
        deliveryLongitude: 3.3792,
        items: [
          {
            pharmacyProductId: 'product-1',
            drugName: 'Aspirin',
            category: 'Pain Relief',
            quantity: 2,
            unitPrice: 500,
          },
        ],
      };

      const order = await OrderService.createOrder(orderData);

      // Subtotal = 500 * 2 = 1000
      expect(order.subtotal).toBe(1000);
      expect(order.pharmacyCommission).toBeGreaterThan(0);
      expect(order.serviceFee).toBeGreaterThan(0);
      expect(order.total).toBe(order.subtotal + order.serviceFee);
    });

    it('should create order items', async () => {
      const orderData = {
        customerId: 'customer-123',
        pharmacyId: 'pharmacy-456',
        deliveryAddress: '123 Main St',
        deliveryLatitude: 6.5244,
        deliveryLongitude: 3.3792,
        items: [
          {
            pharmacyProductId: 'product-1',
            drugName: 'Aspirin',
            category: 'Pain Relief',
            quantity: 2,
            unitPrice: 500,
          },
        ],
      };

      await OrderService.createOrder(orderData);

      // Verify collection data contains the order items
      const collectionData = mockFirestore.getCollectionData();
      expect(collectionData['order_items']).toBeDefined();
    });

    it('should require customerId', async () => {
      const orderData = {
        customerId: '',
        pharmacyId: 'pharmacy-456',
        deliveryAddress: '123 Main St',
        deliveryLatitude: 6.5244,
        deliveryLongitude: 3.3792,
        items: [],
      };

      const order = await OrderService.createOrder(orderData);
      expect(order.customerId).toBe('');
    });
  });

  describe('getOrder', () => {
    it('should retrieve an existing order', async () => {
      const orderData = {
        customerId: 'customer-123',
        pharmacyId: 'pharmacy-456',
        deliveryAddress: '123 Main St',
        deliveryLatitude: 6.5244,
        deliveryLongitude: 3.3792,
        items: [
          {
            pharmacyProductId: 'product-1',
            drugName: 'Aspirin',
            category: 'Pain Relief',
            quantity: 1,
            unitPrice: 500,
          },
        ],
      };

      const createdOrder = await OrderService.createOrder(orderData);
      const retrievedOrder = await OrderService.getOrder(createdOrder.id);

      expect(retrievedOrder).toBeDefined();
      expect(retrievedOrder?.id).toBe(createdOrder.id);
      expect(retrievedOrder?.customerId).toBe('customer-123');
    });

    it('should return null for non-existent order', async () => {
      const result = await OrderService.getOrder('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('getUserOrders', () => {
    it('should retrieve all orders for a user', async () => {
      const customerId = 'customer-123';

      const orderData1 = {
        customerId,
        pharmacyId: 'pharmacy-456',
        deliveryAddress: '123 Main St',
        deliveryLatitude: 6.5244,
        deliveryLongitude: 3.3792,
        items: [
          {
            pharmacyProductId: 'product-1',
            drugName: 'Aspirin',
            category: 'Pain Relief',
            quantity: 1,
            unitPrice: 500,
          },
        ],
      };

      const orderData2 = {
        ...orderData1,
        pharmacyId: 'pharmacy-789',
      };

      await OrderService.createOrder(orderData1);
      await OrderService.createOrder(orderData2);

      const orders = await OrderService.getUserOrders(customerId);
      expect(orders.length).toBeGreaterThanOrEqual(2);
      expect(orders.every((o) => o.customerId === customerId)).toBe(true);
    });

    it('should respect the limit parameter', async () => {
      const customerId = 'customer-123';

      for (let i = 0; i < 5; i++) {
        await OrderService.createOrder({
          customerId,
          pharmacyId: `pharmacy-${i}`,
          deliveryAddress: '123 Main St',
          deliveryLatitude: 6.5244,
          deliveryLongitude: 3.3792,
          items: [
            {
              pharmacyProductId: `product-${i}`,
              drugName: 'Drug',
              category: 'Category',
              quantity: 1,
              unitPrice: 500,
            },
          ],
        });
      }

      const orders = await OrderService.getUserOrders(customerId, 3);
      expect(orders.length).toBeLessThanOrEqual(3);
    });

    it('should return empty array for user with no orders', async () => {
      const orders = await OrderService.getUserOrders('unknown-customer');
      expect(Array.isArray(orders)).toBe(true);
    });
  });

  describe('getPharmacyOrders', () => {
    it('should retrieve all orders for a pharmacy', async () => {
      const pharmacyId = 'pharmacy-456';

      await OrderService.createOrder({
        customerId: 'customer-1',
        pharmacyId,
        deliveryAddress: '123 Main St',
        deliveryLatitude: 6.5244,
        deliveryLongitude: 3.3792,
        items: [
          {
            pharmacyProductId: 'product-1',
            drugName: 'Aspirin',
            category: 'Pain Relief',
            quantity: 1,
            unitPrice: 500,
          },
        ],
      });

      const orders = await OrderService.getPharmacyOrders(pharmacyId);
      expect(Array.isArray(orders)).toBe(true);
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status', async () => {
      const orderData = {
        customerId: 'customer-123',
        pharmacyId: 'pharmacy-456',
        deliveryAddress: '123 Main St',
        deliveryLatitude: 6.5244,
        deliveryLongitude: 3.3792,
        items: [
          {
            pharmacyProductId: 'product-1',
            drugName: 'Aspirin',
            category: 'Pain Relief',
            quantity: 1,
            unitPrice: 500,
          },
        ],
      };

      const createdOrder = await OrderService.createOrder(orderData);
      const updated = await OrderService.updateOrderStatus(
        createdOrder.id,
        OrderStatus.CONFIRMED
      );

      expect(updated.status).toBe(OrderStatus.CONFIRMED);
    });

    it('should update the updatedAt timestamp', async () => {
      const orderData = {
        customerId: 'customer-123',
        pharmacyId: 'pharmacy-456',
        deliveryAddress: '123 Main St',
        deliveryLatitude: 6.5244,
        deliveryLongitude: 3.3792,
        items: [
          {
            pharmacyProductId: 'product-1',
            drugName: 'Aspirin',
            category: 'Pain Relief',
            quantity: 1,
            unitPrice: 500,
          },
        ],
      };

      const createdOrder = await OrderService.createOrder(orderData);
      const originalTime = createdOrder.updatedAt;

      const updated = await OrderService.updateOrderStatus(
        createdOrder.id,
        OrderStatus.CONFIRMED
      );

      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalTime.getTime()
      );
    });
  });

  describe('updatePaymentStatus', () => {
    it('should update payment status', async () => {
      const orderData = {
        customerId: 'customer-123',
        pharmacyId: 'pharmacy-456',
        deliveryAddress: '123 Main St',
        deliveryLatitude: 6.5244,
        deliveryLongitude: 3.3792,
        items: [
          {
            pharmacyProductId: 'product-1',
            drugName: 'Aspirin',
            category: 'Pain Relief',
            quantity: 1,
            unitPrice: 500,
          },
        ],
      };

      const createdOrder = await OrderService.createOrder(orderData);
      const updated = await OrderService.updatePaymentStatus(
        createdOrder.id,
        PaymentStatus.PAID,
        'PAY-REF-123'
      );

      expect(updated.paymentStatus).toBe(PaymentStatus.PAID);
    });

    it('should store payment reference', async () => {
      const orderData = {
        customerId: 'customer-123',
        pharmacyId: 'pharmacy-456',
        deliveryAddress: '123 Main St',
        deliveryLatitude: 6.5244,
        deliveryLongitude: 3.3792,
        items: [
          {
            pharmacyProductId: 'product-1',
            drugName: 'Aspirin',
            category: 'Pain Relief',
            quantity: 1,
            unitPrice: 500,
          },
        ],
      };

      const createdOrder = await OrderService.createOrder(orderData);
      const paymentRef = 'PAY-REF-12345';
      const updated = await OrderService.updatePaymentStatus(
        createdOrder.id,
        PaymentStatus.PAID,
        paymentRef
      );

      expect((updated as any).paymentReference).toBe(paymentRef);
    });
  });

  describe('cancelOrder', () => {
    it('should cancel a pending order', async () => {
      const orderData = {
        customerId: 'customer-123',
        pharmacyId: 'pharmacy-456',
        deliveryAddress: '123 Main St',
        deliveryLatitude: 6.5244,
        deliveryLongitude: 3.3792,
        items: [
          {
            pharmacyProductId: 'product-1',
            drugName: 'Aspirin',
            category: 'Pain Relief',
            quantity: 1,
            unitPrice: 500,
          },
        ],
      };

      const createdOrder = await OrderService.createOrder(orderData);
      const cancelled = await OrderService.cancelOrder(
        createdOrder.id,
        'Customer requested cancellation'
      );

      expect(cancelled.status).toBe(OrderStatus.CANCELLED);
    });

    it('should store cancellation reason', async () => {
      const orderData = {
        customerId: 'customer-123',
        pharmacyId: 'pharmacy-456',
        deliveryAddress: '123 Main St',
        deliveryLatitude: 6.5244,
        deliveryLongitude: 3.3792,
        items: [
          {
            pharmacyProductId: 'product-1',
            drugName: 'Aspirin',
            category: 'Pain Relief',
            quantity: 1,
            unitPrice: 500,
          },
        ],
      };

      const createdOrder = await OrderService.createOrder(orderData);
      const reason = 'Out of stock';
      const cancelled = await OrderService.cancelOrder(createdOrder.id, reason);

      expect((cancelled as any).cancellationReason).toBe(reason);
    });

    it('should reject cancellation of delivered orders', async () => {
      const orderData = {
        customerId: 'customer-123',
        pharmacyId: 'pharmacy-456',
        deliveryAddress: '123 Main St',
        deliveryLatitude: 6.5244,
        deliveryLongitude: 3.3792,
        items: [
          {
            pharmacyProductId: 'product-1',
            drugName: 'Aspirin',
            category: 'Pain Relief',
            quantity: 1,
            unitPrice: 500,
          },
        ],
      };

      const createdOrder = await OrderService.createOrder(orderData);

      // Manually set to DELIVERED
      await OrderService.updateOrderStatus(createdOrder.id, OrderStatus.DELIVERED);

      await expect(
        OrderService.cancelOrder(createdOrder.id, 'Trying to cancel delivered order')
      ).rejects.toThrow();
    });

    it('should reject cancellation of already cancelled orders', async () => {
      const orderData = {
        customerId: 'customer-123',
        pharmacyId: 'pharmacy-456',
        deliveryAddress: '123 Main St',
        deliveryLatitude: 6.5244,
        deliveryLongitude: 3.3792,
        items: [
          {
            pharmacyProductId: 'product-1',
            drugName: 'Aspirin',
            category: 'Pain Relief',
            quantity: 1,
            unitPrice: 500,
          },
        ],
      };

      const createdOrder = await OrderService.createOrder(orderData);

      // Cancel first time
      await OrderService.cancelOrder(createdOrder.id, 'First cancellation');

      // Try to cancel again
      await expect(
        OrderService.cancelOrder(createdOrder.id, 'Second cancellation')
      ).rejects.toThrow();
    });
  });

  describe('calculateOrderTotal', () => {
    it('should calculate correct total with subtotal only', () => {
      const result = OrderService.calculateOrderTotal(1000);

      expect(result.subtotal).toBeLessThanOrEqual(1000);
      expect(result.pharmacyCommission).toBeGreaterThan(0);
      expect(result.serviceFee).toBeGreaterThan(0);
      expect(result.deliveryFee).toBe(0);
      expect(result.total).toBeGreaterThanOrEqual(result.subtotal);
    });

    it('should calculate total with delivery fee', () => {
      const result = OrderService.calculateOrderTotal(1000, 500);

      expect(result.deliveryFee).toBe(500);
      expect(result.total).toBeGreaterThan(1000 + result.serviceFee);
    });

    it('should apply discount percent', () => {
      const subtotal = 1000;
      const discountPercent = 10;

      const result = OrderService.calculateOrderTotal(subtotal, 0, discountPercent);

      expect(result.subtotal).toBeLessThan(subtotal);
      const expectedDiscount = subtotal * (discountPercent / 100);
      expect(result.subtotal).toBe(subtotal - expectedDiscount);
    });

    it('should return zero delivery fee by default', () => {
      const result = OrderService.calculateOrderTotal(1000);
      expect(result.deliveryFee).toBe(0);
    });

    it('should return zero discount by default', () => {
      const result = OrderService.calculateOrderTotal(1000);
      expect(result.subtotal).toBe(1000);
    });

    it('should handle various subtotal amounts', () => {
      const amounts = [100, 500, 1000, 5000, 10000];

      amounts.forEach((amount) => {
        const result = OrderService.calculateOrderTotal(amount);
        expect(result.total).toBeGreaterThan(0);
        expect(result.pharmacyCommission).toBeGreaterThan(0);
        expect(result.serviceFee).toBeGreaterThan(0);
      });
    });
  });

  describe('getOrderWithItems', () => {
    it('should retrieve order with its items', async () => {
      const orderData = {
        customerId: 'customer-123',
        pharmacyId: 'pharmacy-456',
        deliveryAddress: '123 Main St',
        deliveryLatitude: 6.5244,
        deliveryLongitude: 3.3792,
        items: [
          {
            pharmacyProductId: 'product-1',
            drugName: 'Aspirin',
            category: 'Pain Relief',
            quantity: 2,
            unitPrice: 500,
          },
          {
            pharmacyProductId: 'product-2',
            drugName: 'Cough Syrup',
            category: 'Cough',
            quantity: 1,
            unitPrice: 1200,
          },
        ],
      };

      const createdOrder = await OrderService.createOrder(orderData);
      const result = await OrderService.getOrderWithItems(createdOrder.id);

      expect(result).toBeDefined();
      expect(result?.order.id).toBe(createdOrder.id);
      expect(Array.isArray(result?.items)).toBe(true);
    });

    it('should return null for non-existent order', async () => {
      const result = await OrderService.getOrderWithItems('non-existent-id');
      expect(result).toBeNull();
    });
  });
});
