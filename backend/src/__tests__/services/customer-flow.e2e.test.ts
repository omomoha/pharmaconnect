/**
 * Customer E2E Flow Tests
 * Tests the complete customer journey: browse pharmacies → search products →
 * place order → pay → track status → cancel order
 *
 * Mirrors the pharmacy.service.test.ts pattern using the same Firestore mock.
 */

import { PharmacyService } from '../../modules/pharmacy/pharmacy.service';
import { OrderService } from '../../modules/order/order.service';
import { AuthService } from '../../modules/auth/auth.service';
import { getFirestore, getAuth } from '../../config/firebase';
import { createFirestoreMock, createAuthMock } from '../mocks/firestore.mock';
import {
  ApprovalStatus,
  OrderStatus,
  PaymentStatus,
  UserRole,
} from '@pharmaconnect/shared/dist/types/index';

jest.mock('../../config/firebase');
jest.mock('../../utils/logger');
jest.mock('../../utils/helpers', () => ({
  calculateDistanceKm: jest.fn((_lat1, _lng1, _lat2, _lng2) => {
    const R = 6371;
    const dLat = ((_lat2 - _lat1) * Math.PI) / 180;
    const dLng = ((_lng2 - _lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((_lat1 * Math.PI) / 180) *
        Math.cos((_lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }),
  formatCurrency: jest.fn((value: number) => Math.round(value * 100) / 100),
  generateSecurityCode: jest.fn(() => Math.random().toString(36).substring(2, 8).toUpperCase()),
}));

const mockFirestore = createFirestoreMock();
const mockAuth = createAuthMock();

const createOperatingHours = () => ({
  monday: { open: '08:00', close: '18:00', closed: false },
  tuesday: { open: '08:00', close: '18:00', closed: false },
  wednesday: { open: '08:00', close: '18:00', closed: false },
  thursday: { open: '08:00', close: '18:00', closed: false },
  friday: { open: '08:00', close: '18:00', closed: false },
  saturday: { open: '08:00', close: '14:00', closed: false },
  sunday: { open: '', close: '', closed: true },
});

describe('Customer E2E Flow', () => {
  let pharmacyId: string;
  let productId1: string;
  let productId2: string;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockFirestore.reset();
    (getFirestore as jest.Mock).mockReturnValue(mockFirestore);
    (getAuth as jest.Mock).mockReturnValue(mockAuth);

    // Pre-seed drug catalog docs for OTC enforcement in addProduct
    const catalogItems = ['paracetamol-500mg', 'ibuprofen-400mg'];
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

    // --- SEED: Create and approve a pharmacy with products ---
    const pharmacy = await PharmacyService.registerPharmacy('pharmacy-owner-1', {
      name: 'Lagos MedStore',
      email: 'lagos@medstore.com',
      phoneNumber: '+2348011111111',
      address: '10 Broad Street, Lagos Island',
      latitude: 6.4541,
      longitude: 3.4216,
      licenseNumber: 'PL-SEED-001',
      licenseDocUrl: 'https://example.com/license.pdf',
      cacNumber: 'CAC-SEED-001',
      cacDocUrl: 'https://example.com/cac.pdf',
      ownerName: 'Dr Pharmacy Owner',
      ownerIdDocUrl: 'https://example.com/id.pdf',
      operatingHours: createOperatingHours(),
    });

    await PharmacyService.updatePharmacy(pharmacy.id, {
      approvalStatus: ApprovalStatus.APPROVED,
    });

    pharmacyId = pharmacy.id;

    const p1 = await PharmacyService.addProduct(pharmacy.id, {
      drugCatalogItemId: 'paracetamol-500mg',
      sku: 'PAR-500',
      quantity: 200,
      price: 300,
      expiryDate: new Date('2027-12-31'),
      batchNumber: 'BATCH-PAR-001',
    });

    const p2 = await PharmacyService.addProduct(pharmacy.id, {
      drugCatalogItemId: 'ibuprofen-400mg',
      sku: 'IBU-400',
      quantity: 150,
      price: 500,
      discount: 10,
      expiryDate: new Date('2027-06-30'),
      batchNumber: 'BATCH-IBU-001',
    });

    productId1 = p1.id;
    productId2 = p2.id;

    // Mock getPharmacyProduct for OrderService
    jest.spyOn(PharmacyService, 'getPharmacyProduct').mockImplementation(
      async (productId: string) => {
        if (productId === productId1) {
          return { id: productId1, pharmacyId, drugCatalogItemId: 'paracetamol-500mg', sku: 'PAR-500', quantity: 200, price: 300, isActive: true, createdAt: new Date(), updatedAt: new Date() } as any;
        }
        if (productId === productId2) {
          return { id: productId2, pharmacyId, drugCatalogItemId: 'ibuprofen-400mg', sku: 'IBU-400', quantity: 150, price: 500, discount: 10, isActive: true, createdAt: new Date(), updatedAt: new Date() } as any;
        }
        return null;
      }
    );
  });

  // ─────────────────────────────────────────────────────────
  // 1. CUSTOMER PROFILE CREATION
  // ─────────────────────────────────────────────────────────
  describe('Step 1: Customer Profile', () => {
    it('should create a customer profile', async () => {
      const profile = await AuthService.createUserProfile('cust-uid-001', {
        email: 'customer@example.com',
        firstName: 'Ada',
        lastName: 'Obi',
        phoneNumber: '+2348022222222',
        role: UserRole.CUSTOMER,
      });

      expect(profile).toBeDefined();
      expect(profile.email).toBe('customer@example.com');
      expect(profile.firstName).toBe('Ada');
      expect(profile.role).toBe(UserRole.CUSTOMER);
    });

    it('should retrieve customer profile', async () => {
      await AuthService.createUserProfile('cust-uid-002', {
        email: 'retrieve@example.com',
        firstName: 'Bola',
        lastName: 'Ade',
        phoneNumber: '+2348033333333',
        role: UserRole.CUSTOMER,
      });

      const profile = await AuthService.getUserProfile('cust-uid-002');

      expect(profile).toBeDefined();
      expect(profile?.firstName).toBe('Bola');
    });

    it('should update customer profile (address, profile image)', async () => {
      await AuthService.createUserProfile('cust-uid-003', {
        email: 'update@example.com',
        firstName: 'Chidi',
        lastName: 'Eze',
        phoneNumber: '+2348044444444',
        role: UserRole.CUSTOMER,
      });

      const updated = await AuthService.updateUserProfile('cust-uid-003', {
        address: '15 Victoria Island, Lagos',
        profileImageUrl: 'https://storage.example.com/avatar.jpg',
      });

      expect(updated.address).toBe('15 Victoria Island, Lagos');
      expect((updated as any).profileImageUrl).toBe('https://storage.example.com/avatar.jpg');
    });
  });

  // ─────────────────────────────────────────────────────────
  // 2. BROWSE & SEARCH PHARMACIES
  // ─────────────────────────────────────────────────────────
  describe('Step 2: Browse & Search Pharmacies', () => {
    it('should find nearby approved pharmacies', async () => {
      const nearby = await PharmacyService.getNearbyPharmacies(6.4541, 3.4216, 20);

      expect(Array.isArray(nearby)).toBe(true);
      const found = nearby.find((p) => p.id === pharmacyId);
      expect(found).toBeDefined();
      expect(found?.approvalStatus).toBe(ApprovalStatus.APPROVED);
    });

    it('should search pharmacies by name', async () => {
      const results = await PharmacyService.searchPharmacies('Lagos Med');

      expect(Array.isArray(results)).toBe(true);
      expect(results.some((p) => p.id === pharmacyId)).toBe(true);
    });

    it('should search pharmacies by address', async () => {
      const results = await PharmacyService.searchPharmacies('Broad Street');

      expect(Array.isArray(results)).toBe(true);
      expect(results.some((p) => p.id === pharmacyId)).toBe(true);
    });

    it('should return empty results for nonexistent pharmacy', async () => {
      const results = await PharmacyService.searchPharmacies('NonExistentPharmacyXYZ');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────
  // 3. VIEW PHARMACY & PRODUCTS
  // ─────────────────────────────────────────────────────────
  describe('Step 3: View Pharmacy Products', () => {
    it('should retrieve pharmacy details', async () => {
      const pharmacy = await PharmacyService.getPharmacy(pharmacyId);

      expect(pharmacy).toBeDefined();
      expect(pharmacy?.name).toBe('Lagos MedStore');
      expect(pharmacy?.approvalStatus).toBe(ApprovalStatus.APPROVED);
    });

    it('should list all active products', async () => {
      const products = await PharmacyService.getPharmacyProducts(pharmacyId);

      expect(products.length).toBe(2);
      expect(products.every((p) => p.isActive === true)).toBe(true);
      expect(products.some((p) => p.sku === 'PAR-500')).toBe(true);
      expect(products.some((p) => p.sku === 'IBU-400')).toBe(true);
    });

    it('should show product with discount info', async () => {
      const products = await PharmacyService.getPharmacyProducts(pharmacyId);
      const ibuprofen = products.find((p) => p.sku === 'IBU-400');

      expect(ibuprofen).toBeDefined();
      expect(ibuprofen?.price).toBe(500);
      expect(ibuprofen?.discount).toBe(10);
    });

    it('should not list deactivated products', async () => {
      await PharmacyService.deleteProduct(productId1);

      const products = await PharmacyService.getPharmacyProducts(pharmacyId);

      expect(products.every((p) => p.id !== productId1)).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────
  // 4. PLACE ORDER
  // ─────────────────────────────────────────────────────────
  describe('Step 4: Place Order', () => {
    it('should create order with single item', async () => {
      const order = await OrderService.createOrder({
        customerId: 'cust-uid-001',
        pharmacyId,
        deliveryAddress: '20 Allen Avenue, Ikeja, Lagos',
        deliveryLatitude: 6.5944,
        deliveryLongitude: 3.3467,
        items: [
          {
            pharmacyProductId: productId1,
            drugName: 'Paracetamol 500mg',
            category: 'Pain Relief',
            quantity: 3,
            unitPrice: 300,
          },
        ],
        notes: 'Leave at gate',
      });

      expect(order).toBeDefined();
      expect(order.customerId).toBe('cust-uid-001');
      expect(order.pharmacyId).toBe(pharmacyId);
      expect(order.status).toBe(OrderStatus.PENDING);
      expect(order.paymentStatus).toBe(PaymentStatus.PENDING);
      expect(order.subtotal).toBe(900); // 300 × 3
      expect(order.total).toBeGreaterThan(order.subtotal); // includes service fee
      expect(order.notes).toBe('Leave at gate');
    });

    it('should apply pharmacy discount to product price during order', async () => {
      // Product 2 has a 10% discount set by the pharmacy
      // Server should use discounted price: 500 × (1 - 10/100) = 450
      const order = await OrderService.createOrder({
        customerId: 'cust-uid-001',
        pharmacyId,
        deliveryAddress: '20 Allen Avenue, Ikeja',
        deliveryLatitude: 6.5944,
        deliveryLongitude: 3.3467,
        items: [
          {
            pharmacyProductId: productId2,
            drugName: 'Ibuprofen 400mg',
            category: 'Pain Relief',
            quantity: 2,
            unitPrice: 500, // Client sends original price; server overrides with discounted
          },
        ],
      });

      // Server-side discount: 500 × 0.9 = 450 per unit × 2 = 900
      expect(order.subtotal).toBe(900);
    });

    it('should not apply discount to products without one', async () => {
      // Product 1 has no discount set
      const order = await OrderService.createOrder({
        customerId: 'cust-uid-001',
        pharmacyId,
        deliveryAddress: '20 Allen Avenue, Ikeja',
        deliveryLatitude: 6.5944,
        deliveryLongitude: 3.3467,
        items: [
          {
            pharmacyProductId: productId1,
            drugName: 'Paracetamol 500mg',
            category: 'Pain Relief',
            quantity: 2,
            unitPrice: 300,
          },
        ],
      });

      // No discount: 300 × 2 = 600
      expect(order.subtotal).toBe(600);
    });

    it('should create order with multiple items', async () => {
      const order = await OrderService.createOrder({
        customerId: 'cust-uid-001',
        pharmacyId,
        deliveryAddress: '20 Allen Avenue, Ikeja',
        deliveryLatitude: 6.5944,
        deliveryLongitude: 3.3467,
        items: [
          {
            pharmacyProductId: productId1,
            drugName: 'Paracetamol 500mg',
            category: 'Pain Relief',
            quantity: 2,
            unitPrice: 300,
          },
          {
            pharmacyProductId: productId2,
            drugName: 'Ibuprofen 400mg',
            category: 'Pain Relief',
            quantity: 1,
            unitPrice: 500,
          },
        ],
      });

      // 300×2 + 500×0.9 (10% discount) = 1050
      expect(order.subtotal).toBe(1050);
      expect(order.total).toBeGreaterThan(order.subtotal);
    });

    it('should create order items in Firestore', async () => {
      await OrderService.createOrder({
        customerId: 'cust-uid-001',
        pharmacyId,
        deliveryAddress: '20 Allen Avenue, Ikeja',
        deliveryLatitude: 6.5944,
        deliveryLongitude: 3.3467,
        items: [
          {
            pharmacyProductId: productId1,
            drugName: 'Paracetamol 500mg',
            category: 'Pain Relief',
            quantity: 1,
            unitPrice: 300,
          },
        ],
      });

      const collectionData = mockFirestore.getCollectionData();
      expect(collectionData['order_items']).toBeDefined();
      expect(collectionData['order_items'].length).toBeGreaterThan(0);
    });

    it('should calculate service fee and commission', async () => {
      const totals = OrderService.calculateOrderTotal(5000);

      expect(totals.subtotal).toBe(5000);
      expect(totals.pharmacyCommission).toBeGreaterThan(0);
      expect(totals.serviceFee).toBeGreaterThan(0);
      expect(totals.deliveryFee).toBe(0);
      expect(totals.total).toBe(totals.subtotal + totals.serviceFee);
    });

    it('should calculate total with delivery fee', async () => {
      const totals = OrderService.calculateOrderTotal(5000, 800);

      expect(totals.deliveryFee).toBe(800);
      expect(totals.total).toBe(totals.subtotal + totals.serviceFee + totals.deliveryFee);
    });
  });

  // ─────────────────────────────────────────────────────────
  // 5. PAYMENT
  // ─────────────────────────────────────────────────────────
  describe('Step 5: Payment', () => {
    it('should update payment status to PAID', async () => {
      const order = await OrderService.createOrder({
        customerId: 'cust-uid-001',
        pharmacyId,
        deliveryAddress: '20 Allen Avenue, Ikeja',
        deliveryLatitude: 6.5944,
        deliveryLongitude: 3.3467,
        items: [
          {
            pharmacyProductId: productId1,
            drugName: 'Paracetamol 500mg',
            category: 'Pain Relief',
            quantity: 1,
            unitPrice: 300,
          },
        ],
      });

      expect(order.paymentStatus).toBe(PaymentStatus.PENDING);

      const paid = await OrderService.updatePaymentStatus(
        order.id,
        PaymentStatus.PAID,
        'PAYSTACK-REF-12345'
      );

      expect(paid.paymentStatus).toBe(PaymentStatus.PAID);
      expect((paid as any).paymentReference).toBe('PAYSTACK-REF-12345');
    });
  });

  // ─────────────────────────────────────────────────────────
  // 6. TRACK ORDER STATUS
  // ─────────────────────────────────────────────────────────
  describe('Step 6: Track Order', () => {
    it('should progress through full order lifecycle', async () => {
      const order = await OrderService.createOrder({
        customerId: 'cust-uid-001',
        pharmacyId,
        deliveryAddress: '20 Allen Avenue, Ikeja',
        deliveryLatitude: 6.5944,
        deliveryLongitude: 3.3467,
        items: [
          {
            pharmacyProductId: productId1,
            drugName: 'Paracetamol 500mg',
            category: 'Pain Relief',
            quantity: 1,
            unitPrice: 300,
          },
        ],
      });

      expect(order.status).toBe(OrderStatus.PENDING);

      // Pharmacy confirms
      const confirmed = await OrderService.updateOrderStatus(order.id, OrderStatus.CONFIRMED);
      expect(confirmed.status).toBe(OrderStatus.CONFIRMED);

      // Pharmacy starts preparing
      const preparing = await OrderService.updateOrderStatus(order.id, OrderStatus.PREPARING);
      expect(preparing.status).toBe(OrderStatus.PREPARING);

      // Ready for pickup
      const ready = await OrderService.updateOrderStatus(order.id, OrderStatus.READY_FOR_PICKUP);
      expect(ready.status).toBe(OrderStatus.READY_FOR_PICKUP);

      // Out for delivery
      const outForDelivery = await OrderService.updateOrderStatus(order.id, OrderStatus.OUT_FOR_DELIVERY);
      expect(outForDelivery.status).toBe(OrderStatus.OUT_FOR_DELIVERY);

      // Delivered
      const delivered = await OrderService.updateOrderStatus(order.id, OrderStatus.DELIVERED);
      expect(delivered.status).toBe(OrderStatus.DELIVERED);
    });

    it('should retrieve order with items for tracking', async () => {
      const order = await OrderService.createOrder({
        customerId: 'cust-uid-001',
        pharmacyId,
        deliveryAddress: '20 Allen Avenue, Ikeja',
        deliveryLatitude: 6.5944,
        deliveryLongitude: 3.3467,
        items: [
          {
            pharmacyProductId: productId1,
            drugName: 'Paracetamol 500mg',
            category: 'Pain Relief',
            quantity: 2,
            unitPrice: 300,
          },
        ],
      });

      const result = await OrderService.getOrderWithItems(order.id);

      expect(result).toBeDefined();
      expect(result?.order.id).toBe(order.id);
      expect(Array.isArray(result?.items)).toBe(true);
    });

    it('should list all customer orders', async () => {
      const customerId = 'cust-uid-orders';

      await OrderService.createOrder({
        customerId,
        pharmacyId,
        deliveryAddress: 'Address 1',
        deliveryLatitude: 6.5944,
        deliveryLongitude: 3.3467,
        items: [{ pharmacyProductId: productId1, drugName: 'Drug 1', category: 'Cat', quantity: 1, unitPrice: 300 }],
      });

      await OrderService.createOrder({
        customerId,
        pharmacyId,
        deliveryAddress: 'Address 2',
        deliveryLatitude: 6.5944,
        deliveryLongitude: 3.3467,
        items: [{ pharmacyProductId: productId2, drugName: 'Drug 2', category: 'Cat', quantity: 1, unitPrice: 500 }],
      });

      const orders = await OrderService.getUserOrders(customerId);

      expect(orders.length).toBeGreaterThanOrEqual(2);
      expect(orders.every((o) => o.customerId === customerId)).toBe(true);
    });

    it('should respect order list limit', async () => {
      const customerId = 'cust-uid-limit';

      for (let i = 0; i < 5; i++) {
        await OrderService.createOrder({
          customerId,
          pharmacyId,
          deliveryAddress: `Address ${i}`,
          deliveryLatitude: 6.5944,
          deliveryLongitude: 3.3467,
          items: [{ pharmacyProductId: productId1, drugName: 'Drug', category: 'Cat', quantity: 1, unitPrice: 300 }],
        });
      }

      const orders = await OrderService.getUserOrders(customerId, 3);
      expect(orders.length).toBeLessThanOrEqual(3);
    });
  });

  // ─────────────────────────────────────────────────────────
  // 7. CANCEL ORDER
  // ─────────────────────────────────────────────────────────
  describe('Step 7: Cancel Order', () => {
    it('should cancel a pending order', async () => {
      const order = await OrderService.createOrder({
        customerId: 'cust-uid-001',
        pharmacyId,
        deliveryAddress: '20 Allen Avenue, Ikeja',
        deliveryLatitude: 6.5944,
        deliveryLongitude: 3.3467,
        items: [
          {
            pharmacyProductId: productId1,
            drugName: 'Paracetamol 500mg',
            category: 'Pain Relief',
            quantity: 1,
            unitPrice: 300,
          },
        ],
      });

      const cancelled = await OrderService.cancelOrder(order.id, 'Changed my mind');

      expect(cancelled.status).toBe(OrderStatus.CANCELLED);
      expect((cancelled as any).cancellationReason).toBe('Changed my mind');
    });

    it('should not cancel a delivered order', async () => {
      const order = await OrderService.createOrder({
        customerId: 'cust-uid-001',
        pharmacyId,
        deliveryAddress: '20 Allen Avenue, Ikeja',
        deliveryLatitude: 6.5944,
        deliveryLongitude: 3.3467,
        items: [
          {
            pharmacyProductId: productId1,
            drugName: 'Paracetamol 500mg',
            category: 'Pain Relief',
            quantity: 1,
            unitPrice: 300,
          },
        ],
      });

      await OrderService.updateOrderStatus(order.id, OrderStatus.DELIVERED);

      await expect(
        OrderService.cancelOrder(order.id, 'Too late')
      ).rejects.toThrow();
    });

    it('should not cancel an already cancelled order', async () => {
      const order = await OrderService.createOrder({
        customerId: 'cust-uid-001',
        pharmacyId,
        deliveryAddress: '20 Allen Avenue, Ikeja',
        deliveryLatitude: 6.5944,
        deliveryLongitude: 3.3467,
        items: [
          {
            pharmacyProductId: productId1,
            drugName: 'Paracetamol 500mg',
            category: 'Pain Relief',
            quantity: 1,
            unitPrice: 300,
          },
        ],
      });

      await OrderService.cancelOrder(order.id, 'First cancel');

      await expect(
        OrderService.cancelOrder(order.id, 'Second cancel')
      ).rejects.toThrow();
    });
  });
});
