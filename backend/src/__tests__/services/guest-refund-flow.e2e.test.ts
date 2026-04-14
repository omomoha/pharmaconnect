/**
 * Guest Checkout & Refund/Stock Restoration E2E Tests
 *
 * Tests two critical gaps identified in the pre-launch audit:
 *   1. Guest checkout flow (no authentication required)
 *   2. Order cancellation with stock restoration and refund marking
 */

import { PharmacyService } from '../../modules/pharmacy/pharmacy.service';
import { OrderService } from '../../modules/order/order.service';
import { getFirestore, getAuth } from '../../config/firebase';
import { createFirestoreMock, createAuthMock } from '../mocks/firestore.mock';
import {
  ApprovalStatus,
  OrderStatus,
  PaymentStatus,
  DrugCategory,
} from '@pharmaconnect/shared/dist/types/index';

jest.mock('../../config/firebase');
jest.mock('../../utils/logger');
jest.mock('../../utils/helpers', () => ({
  calculateDistanceKm: jest.fn(() => 2.5),
  formatCurrency: jest.fn((value: number) => Math.round(value * 100) / 100),
  generateSecurityCode: jest.fn(() => '123456'),
}));

const mockFirestore = createFirestoreMock();
const mockAuth = createAuthMock();

describe('Guest Checkout & Refund Flow E2E', () => {
  let pharmacyId: string;
  let productId1: string;
  let productId2: string;

  const createOperatingHours = () => ({
    monday: { open: '08:00', close: '18:00', closed: false },
    tuesday: { open: '08:00', close: '18:00', closed: false },
    wednesday: { open: '08:00', close: '18:00', closed: false },
    thursday: { open: '08:00', close: '18:00', closed: false },
    friday: { open: '08:00', close: '18:00', closed: false },
    saturday: { open: '08:00', close: '14:00', closed: false },
    sunday: { open: '', close: '', closed: true },
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    mockFirestore.reset();
    (getFirestore as jest.Mock).mockReturnValue(mockFirestore);
    (getAuth as jest.Mock).mockReturnValue(mockAuth);

    // Pre-seed drug catalog docs for OTC enforcement
    const catalogItems = ['paracetamol-500mg', 'vitamin-c-1000mg'];
    for (const itemId of catalogItems) {
      await mockFirestore.collection('drug_catalog').doc(itemId).set({
        id: itemId,
        commonName: itemId,
        category: 'pain_relief',
        isOTC: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Seed a pharmacy with products (using actual PharmacyService API)
    const pharmacy = await PharmacyService.registerPharmacy('pharmacy-owner-guest', {
      name: 'Guest Test Pharmacy',
      email: 'guest-pharmacy@test.com',
      phoneNumber: '08012345678',
      address: '123 Lagos St',
      latitude: 6.5244,
      longitude: 3.3792,
      licenseNumber: 'PHR-GUEST-001',
      licenseDocUrl: 'https://example.com/license.pdf',
      cacNumber: 'CAC-GUEST-001',
      cacDocUrl: 'https://example.com/cac.pdf',
      ownerName: 'Dr Guest',
      ownerIdDocUrl: 'https://example.com/id.pdf',
      operatingHours: createOperatingHours(),
    });
    pharmacyId = pharmacy.id;

    // Approve it
    await PharmacyService.updatePharmacy(pharmacyId, {
      approvalStatus: ApprovalStatus.APPROVED,
    });

    // Add products
    const product1 = await PharmacyService.addProduct(pharmacyId, {
      drugCatalogItemId: 'paracetamol-500mg',
      sku: 'PARA-500',
      quantity: 50,
      price: 500,
      expiryDate: new Date('2027-12-31'),
      batchNumber: 'BATCH-PARA-001',
    });
    productId1 = product1.id;

    const product2 = await PharmacyService.addProduct(pharmacyId, {
      drugCatalogItemId: 'vitamin-c-1000mg',
      sku: 'VITC-1000',
      quantity: 100,
      price: 300,
      expiryDate: new Date('2027-12-31'),
      batchNumber: 'BATCH-VITC-001',
    });
    productId2 = product2.id;
  });

  // ═══ GUEST CHECKOUT FLOW ═══════════════════════════════════════════════════

  describe('Guest Checkout', () => {
    it('should create a guest order without authentication', async () => {
      const order = await OrderService.createGuestOrder({
        guestEmail: 'guest@example.com',
        guestPhone: '08099887766',
        guestName: 'Guest User',
        pharmacyId,
        deliveryAddress: '456 Victoria Island',
        deliveryLatitude: 6.4281,
        deliveryLongitude: 3.4219,
        items: [
          {
            pharmacyProductId: productId1,
            drugName: 'Paracetamol 500mg',
            category: 'pain_relief',
            quantity: 2,
            unitPrice: 500,
          },
        ],
      });

      expect(order).toBeDefined();
      expect(order.id).toBeDefined();
      expect(order.customerId).toMatch(/^guest_/);
      expect(order.status).toBe(OrderStatus.PENDING);
      expect(order.paymentStatus).toBe(PaymentStatus.PENDING);
      expect(order.pharmacyId).toBe(pharmacyId);
      expect(order.subtotal).toBe(1000);
      expect(order.total).toBeGreaterThan(0);
    });

    it('should store guest contact info in subcollection', async () => {
      const order = await OrderService.createGuestOrder({
        guestEmail: 'contact@example.com',
        guestPhone: '08011223344',
        guestName: 'Contact Test',
        pharmacyId,
        deliveryAddress: '789 Lekki',
        deliveryLatitude: 6.4474,
        deliveryLongitude: 3.4724,
        items: [
          {
            pharmacyProductId: productId2,
            drugName: 'Vitamin C 1000mg',
            category: 'vitamins',
            quantity: 1,
            unitPrice: 300,
          },
        ],
      });

      // Verify guest info was stored via the mock's subcollection
      const guestInfoRef = (mockFirestore
        .collection('orders')
        .doc(order.id) as any)
        .collection('guest_info')
        .doc('contact');
      const guestInfoDoc = await guestInfoRef.get();

      expect(guestInfoDoc.exists).toBe(true);
      const guestInfo = guestInfoDoc.data();
      expect(guestInfo?.email).toBe('contact@example.com');
      expect(guestInfo?.phone).toBe('08011223344');
      expect(guestInfo?.name).toBe('Contact Test');
    });

    it('should decrement product stock on guest order', async () => {
      const productBefore = await PharmacyService.getPharmacyProduct(productId1);
      const initialStock = productBefore!.quantity;

      await OrderService.createGuestOrder({
        guestEmail: 'stock@test.com',
        guestPhone: '08055667788',
        guestName: 'Stock Test',
        pharmacyId,
        deliveryAddress: '10 Ikoyi',
        deliveryLatitude: 6.4541,
        deliveryLongitude: 3.4358,
        items: [
          {
            pharmacyProductId: productId1,
            drugName: 'Paracetamol 500mg',
            category: 'pain_relief',
            quantity: 3,
            unitPrice: 500,
          },
        ],
      });

      const productAfter = await PharmacyService.getPharmacyProduct(productId1);
      expect(productAfter!.quantity).toBe(initialStock - 3);
    });

    it('should reject guest order with insufficient stock', async () => {
      await expect(
        OrderService.createGuestOrder({
          guestEmail: 'nostock@test.com',
          guestPhone: '08099001122',
          guestName: 'No Stock',
          pharmacyId,
          deliveryAddress: '20 Surulere',
          deliveryLatitude: 6.5,
          deliveryLongitude: 3.35,
          items: [
            {
              pharmacyProductId: productId1,
              drugName: 'Paracetamol 500mg',
              category: 'pain_relief',
              quantity: 9999,
              unitPrice: 500,
            },
          ],
        })
      ).rejects.toThrow(/insufficient stock/i);
    });

    it('should support multi-item guest orders', async () => {
      const order = await OrderService.createGuestOrder({
        guestEmail: 'multi@test.com',
        guestPhone: '08033445566',
        guestName: 'Multi Order',
        pharmacyId,
        deliveryAddress: '30 Ajah',
        deliveryLatitude: 6.4698,
        deliveryLongitude: 3.5852,
        items: [
          {
            pharmacyProductId: productId1,
            drugName: 'Paracetamol 500mg',
            category: 'pain_relief',
            quantity: 2,
            unitPrice: 500,
          },
          {
            pharmacyProductId: productId2,
            drugName: 'Vitamin C 1000mg',
            category: 'vitamins',
            quantity: 3,
            unitPrice: 300,
          },
        ],
      });

      expect(order).toBeDefined();
      // 2*500 + 3*300 = 1900
      expect(order.subtotal).toBe(1900);
    });

    it('should reject guest order for nonexistent product', async () => {
      await expect(
        OrderService.createGuestOrder({
          guestEmail: 'bad@test.com',
          guestPhone: '08077889900',
          guestName: 'Bad Product',
          pharmacyId,
          deliveryAddress: '40 Yaba',
          deliveryLatitude: 6.5095,
          deliveryLongitude: 3.3774,
          items: [
            {
              pharmacyProductId: 'nonexistent-product',
              drugName: 'Fake Drug',
              category: 'pain_relief',
              quantity: 1,
              unitPrice: 100,
            },
          ],
        })
      ).rejects.toThrow(/product not found/i);
    });
  });

  // ═══ REFUND + STOCK RESTORATION ════════════════════════════════════════════

  describe('Cancel Order with Stock Restoration', () => {
    it('should restore product stock when order is cancelled', async () => {
      // Get initial stock levels
      const product1Before = await PharmacyService.getPharmacyProduct(productId1);
      const product2Before = await PharmacyService.getPharmacyProduct(productId2);
      const initialStock1 = product1Before!.quantity;
      const initialStock2 = product2Before!.quantity;

      // Create an order that decrements stock
      const order = await OrderService.createOrder({
        customerId: 'customer-refund-1',
        pharmacyId,
        deliveryAddress: '50 Ikeja',
        deliveryLatitude: 6.6018,
        deliveryLongitude: 3.3515,
        items: [
          {
            pharmacyProductId: productId1,
            drugName: 'Paracetamol 500mg',
            category: 'pain_relief' as DrugCategory,
            quantity: 5,
            unitPrice: 500,
          },
          {
            pharmacyProductId: productId2,
            drugName: 'Vitamin C 1000mg',
            category: 'vitamins' as DrugCategory,
            quantity: 10,
            unitPrice: 300,
          },
        ],
      });

      // Verify stock was decremented
      const product1Mid = await PharmacyService.getPharmacyProduct(productId1);
      const product2Mid = await PharmacyService.getPharmacyProduct(productId2);
      expect(product1Mid!.quantity).toBe(initialStock1 - 5);
      expect(product2Mid!.quantity).toBe(initialStock2 - 10);

      // Cancel the order
      const cancelled = await OrderService.cancelOrder(order.id, 'Customer changed mind');

      expect(cancelled.status).toBe(OrderStatus.CANCELLED);

      // Verify stock was restored
      const product1After = await PharmacyService.getPharmacyProduct(productId1);
      const product2After = await PharmacyService.getPharmacyProduct(productId2);
      expect(product1After!.quantity).toBe(initialStock1);
      expect(product2After!.quantity).toBe(initialStock2);
    });

    it('should mark payment as refunded when paid order is cancelled', async () => {
      // Create an order
      const order = await OrderService.createOrder({
        customerId: 'customer-refund-2',
        pharmacyId,
        deliveryAddress: '60 Ogba',
        deliveryLatitude: 6.6286,
        deliveryLongitude: 3.3415,
        items: [
          {
            pharmacyProductId: productId1,
            drugName: 'Paracetamol 500mg',
            category: 'pain_relief' as DrugCategory,
            quantity: 1,
            unitPrice: 500,
          },
        ],
      });

      // Simulate payment completion
      await mockFirestore.collection('orders').doc(order.id).update({
        paymentStatus: PaymentStatus.PAID,
      });

      // Cancel after payment
      const cancelled = await OrderService.cancelOrder(order.id, 'Refund requested');

      expect(cancelled.status).toBe(OrderStatus.CANCELLED);
      expect(cancelled.paymentStatus).toBe(PaymentStatus.REFUNDED);
    });

    it('should not allow cancelling an already cancelled order', async () => {
      const order = await OrderService.createOrder({
        customerId: 'customer-refund-3',
        pharmacyId,
        deliveryAddress: '70 Maryland',
        deliveryLatitude: 6.5728,
        deliveryLongitude: 3.3664,
        items: [
          {
            pharmacyProductId: productId1,
            drugName: 'Paracetamol 500mg',
            category: 'pain_relief' as DrugCategory,
            quantity: 1,
            unitPrice: 500,
          },
        ],
      });

      // Cancel once
      await OrderService.cancelOrder(order.id);

      // Try to cancel again
      await expect(
        OrderService.cancelOrder(order.id)
      ).rejects.toThrow(/cannot cancel/i);
    });

    it('should not allow cancelling a delivered order', async () => {
      const order = await OrderService.createOrder({
        customerId: 'customer-refund-4',
        pharmacyId,
        deliveryAddress: '80 Festac',
        deliveryLatitude: 6.4626,
        deliveryLongitude: 3.2807,
        items: [
          {
            pharmacyProductId: productId1,
            drugName: 'Paracetamol 500mg',
            category: 'pain_relief' as DrugCategory,
            quantity: 1,
            unitPrice: 500,
          },
        ],
      });

      // Simulate delivery
      await mockFirestore.collection('orders').doc(order.id).update({
        status: OrderStatus.DELIVERED,
      });

      await expect(
        OrderService.cancelOrder(order.id)
      ).rejects.toThrow(/cannot cancel/i);
    });

    it('should store cancellation reason', async () => {
      const order = await OrderService.createOrder({
        customerId: 'customer-refund-6',
        pharmacyId,
        deliveryAddress: '100 Oshodi',
        deliveryLatitude: 6.5568,
        deliveryLongitude: 3.3424,
        items: [
          {
            pharmacyProductId: productId1,
            drugName: 'Paracetamol 500mg',
            category: 'pain_relief' as DrugCategory,
            quantity: 2,
            unitPrice: 500,
          },
        ],
      });

      await OrderService.cancelOrder(order.id, 'Found cheaper pharmacy');

      // Read the raw order doc to verify cancellation reason was stored
      const orderDoc = await mockFirestore.collection('orders').doc(order.id).get();
      const orderData = orderDoc.data();
      expect(orderData?.cancellationReason).toBe('Found cheaper pharmacy');
      expect(orderData?.status).toBe(OrderStatus.CANCELLED);
    });

    it('should restore stock for guest orders on cancel', async () => {
      const productBefore = await PharmacyService.getPharmacyProduct(productId1);
      const initialStock = productBefore!.quantity;

      // Create guest order
      const order = await OrderService.createGuestOrder({
        guestEmail: 'cancel@test.com',
        guestPhone: '08044556677',
        guestName: 'Cancel Guest',
        pharmacyId,
        deliveryAddress: '110 Mushin',
        deliveryLatitude: 6.5381,
        deliveryLongitude: 3.3566,
        items: [
          {
            pharmacyProductId: productId1,
            drugName: 'Paracetamol 500mg',
            category: 'pain_relief',
            quantity: 4,
            unitPrice: 500,
          },
        ],
      });

      // Verify decrement
      const productMid = await PharmacyService.getPharmacyProduct(productId1);
      expect(productMid!.quantity).toBe(initialStock - 4);

      // Cancel
      const cancelled = await OrderService.cancelOrder(order.id);
      expect(cancelled.status).toBe(OrderStatus.CANCELLED);

      // Verify stock restored
      const productAfter = await PharmacyService.getPharmacyProduct(productId1);
      expect(productAfter!.quantity).toBe(initialStock);
    });
  });
});
