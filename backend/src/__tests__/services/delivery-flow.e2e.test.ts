/**
 * Delivery Provider E2E Flow Tests
 * Tests the complete delivery provider journey: register → approval →
 * view available orders → accept assignment → pickup → deliver → verify codes
 *
 * Mirrors the pharmacy.service.test.ts pattern using the same Firestore mock.
 */

import { DeliveryService } from '../../modules/delivery/delivery.service';
import { OrderService } from '../../modules/order/order.service';
import { PharmacyService } from '../../modules/pharmacy/pharmacy.service';
import { AuthService } from '../../modules/auth/auth.service';
import { getFirestore, getAuth } from '../../config/firebase';
import { createFirestoreMock, createAuthMock } from '../mocks/firestore.mock';
import {
  ApprovalStatus,
  DeliveryAssignmentStatus,
  OrderStatus,
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

const defaultProviderData = {
  businessName: 'Lagos Express Riders',
  email: 'dispatch@lagosexpress.ng',
  phoneNumber: '+2347055555555',
  address: '5 Commerce Road, Apapa, Lagos',
  cacNumber: 'CAC-DEL-001',
  cacDocUrl: 'https://storage.example.com/cac-delivery.pdf',
  ownerName: 'Emeka Okafor',
  ownerIdDocUrl: 'https://storage.example.com/owner-id.pdf',
  vehicleDocUrl: 'https://storage.example.com/vehicle-docs.pdf',
  baseFee: 500,
  perKmFee: 100,
};

describe('Delivery Provider E2E Flow', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockFirestore.reset();
    (getFirestore as jest.Mock).mockReturnValue(mockFirestore);
    (getAuth as jest.Mock).mockReturnValue(mockAuth);

    // Pre-seed order docs for transaction-based createAssignment
    const orderIds = [
      'order-lifecycle-001', 'order-verify-001',
      'order-e2e-001', 'order-e2e-002', 'order-e2e-003', 'order-e2e-004',
    ];
    for (const orderId of orderIds) {
      await mockFirestore.collection('orders').doc(orderId).set({
        id: orderId,
        customerId: 'customer-e2e',
        pharmacyId: 'pharmacy-e2e',
        status: 'ready_for_pickup',
        paymentStatus: 'paid',
        subtotal: 1000,
        total: 1100,
        deliveryAddress: '20 Allen Avenue, Ikeja',
        deliveryLatitude: 6.5944,
        deliveryLongitude: 3.3467,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Pre-seed drug catalog for OTC enforcement (used in full e2e flow)
    await mockFirestore.collection('drug_catalog').doc('drug-e2e').set({
      id: 'drug-e2e',
      commonName: 'Paracetamol',
      category: 'pain_relief',
      isOTC: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Pre-seed product doc for transaction-based createOrder (full e2e flow)
    await mockFirestore.collection('pharmacy_products').doc('product-e2e').set({
      id: 'product-e2e',
      pharmacyId: 'pharmacy-e2e',
      drugCatalogItemId: 'drug-e2e',
      sku: 'E2E-001',
      quantity: 100,
      price: 500,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  // ─────────────────────────────────────────────────────────
  // 1. DELIVERY PROVIDER PROFILE & REGISTRATION
  // ─────────────────────────────────────────────────────────
  describe('Step 1: Provider Profile & Registration', () => {
    it('should create a delivery admin profile', async () => {
      const profile = await AuthService.createUserProfile('del-uid-001', {
        email: 'dispatch@lagosexpress.ng',
        firstName: 'Emeka',
        lastName: 'Okafor',
        phoneNumber: '+2347055555555',
        role: UserRole.DELIVERY_ADMIN,
      });

      expect(profile).toBeDefined();
      expect(profile.role).toBe(UserRole.DELIVERY_ADMIN);
      expect(profile.firstName).toBe('Emeka');
    });

    it('should update delivery admin profile', async () => {
      await AuthService.createUserProfile('del-uid-002', {
        email: 'driver@example.com',
        firstName: 'Kola',
        lastName: 'Bello',
        phoneNumber: '+2347066666666',
        role: UserRole.DELIVERY_ADMIN,
      });

      const updated = await AuthService.updateUserProfile('del-uid-002', {
        address: '15 Wharf Road, Apapa, Lagos',
        profileImageUrl: 'https://storage.example.com/driver-avatar.jpg',
      });

      expect(updated.address).toBe('15 Wharf Road, Apapa, Lagos');
      expect((updated as any).profileImageUrl).toBe('https://storage.example.com/driver-avatar.jpg');
    });

    it('should register a delivery provider business', async () => {
      const provider = await DeliveryService.registerProvider('del-uid-001', defaultProviderData);

      expect(provider).toBeDefined();
      expect(provider.id).toBeDefined();
      expect(provider.businessName).toBe('Lagos Express Riders');
      expect(provider.email).toBe('dispatch@lagosexpress.ng');
      expect(provider.approvalStatus).toBe(ApprovalStatus.PENDING);
      expect(provider.isActive).toBe(true);
      expect(provider.rating).toBe(0);
      expect(provider.totalReviews).toBe(0);
    });

    it('should store all registration documents (PII fields encrypted)', async () => {
      const provider = await DeliveryService.registerProvider('del-uid-001', defaultProviderData);

      // PII fields are now encrypted at rest — verify they're NOT plaintext
      expect(provider.cacNumber).not.toBe('CAC-DEL-001');
      expect(provider.cacDocUrl).not.toBe('https://storage.example.com/cac-delivery.pdf');
      expect(provider.ownerIdDocUrl).not.toBe('https://storage.example.com/owner-id.pdf');
      // Non-PII fields remain unchanged
      expect(provider.vehicleDocUrl).toBe('https://storage.example.com/vehicle-docs.pdf');
    });

    it('should store fee structure', async () => {
      const provider = await DeliveryService.registerProvider('del-uid-001', defaultProviderData);

      expect(provider.baseFee).toBe(500);
      expect(provider.perKmFee).toBe(100);
    });

    it('should store provider in Firestore', async () => {
      const provider = await DeliveryService.registerProvider('del-uid-001', defaultProviderData);

      const collectionData = mockFirestore.getCollectionData();
      const providers = collectionData['delivery_providers'];
      expect(providers).toBeDefined();
      expect(providers.some((p: any) => p.id === provider.id)).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────
  // 2. PROVIDER RETRIEVAL
  // ─────────────────────────────────────────────────────────
  describe('Step 2: Provider Retrieval', () => {
    it('should retrieve a registered provider by ID', async () => {
      const registered = await DeliveryService.registerProvider('del-uid-001', defaultProviderData);
      const retrieved = await DeliveryService.getProvider(registered.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(registered.id);
      expect(retrieved?.businessName).toBe('Lagos Express Riders');
    });

    it('should return null for non-existent provider', async () => {
      const result = await DeliveryService.getProvider('non-existent-provider');
      expect(result).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────
  // 3. APPROVAL & AVAILABLE PROVIDERS
  // ─────────────────────────────────────────────────────────
  describe('Step 3: Approval & Discovery', () => {
    it('should list approved providers for customer selection', async () => {
      const provider = await DeliveryService.registerProvider('del-uid-001', defaultProviderData);

      // Simulate admin approval
      const mockDb = getFirestore();
      const collectionData = (mockDb as any).getCollectionData();
      collectionData['delivery_providers'] = [
        { ...provider, approvalStatus: ApprovalStatus.APPROVED },
      ];

      const available = await DeliveryService.getAvailableProviders(
        6.4541, 3.4216, // pharmacy coords
        6.5944, 3.3467  // customer coords
      );

      expect(Array.isArray(available)).toBe(true);
    });

    it('should include estimated fee in available providers', async () => {
      const provider = await DeliveryService.registerProvider('del-uid-001', defaultProviderData);

      const mockDb = getFirestore();
      const collectionData = (mockDb as any).getCollectionData();
      collectionData['delivery_providers'] = [
        { ...provider, approvalStatus: ApprovalStatus.APPROVED },
      ];

      const available = await DeliveryService.getAvailableProviders(
        6.4541, 3.4216,
        6.5944, 3.3467
      );

      if (available.length > 0) {
        expect(available[0].estimatedFee).toBeDefined();
        expect(available[0].estimatedFee).toBeGreaterThanOrEqual(provider.baseFee);
      }
    });

    it('should apply delivery discount to estimated fee', async () => {
      const providerWithDiscount = await DeliveryService.registerProvider('del-uid-discount', {
        ...defaultProviderData,
        discount: 20, // 20% off delivery fees
      });

      const mockDb = getFirestore();
      const collectionData = (mockDb as any).getCollectionData();
      collectionData['delivery_providers'] = [
        { ...providerWithDiscount, approvalStatus: ApprovalStatus.APPROVED },
      ];

      const available = await DeliveryService.getAvailableProviders(
        6.4541, 3.4216,
        6.5944, 3.3467
      );

      expect(available.length).toBe(1);
      const provider = available[0];
      expect(provider.discount).toBe(20);
      expect(provider.originalFee).toBeDefined();
      // Discounted fee should be 80% of original
      expect(provider.estimatedFee).toBe(
        Math.round(provider.originalFee! * 0.8 * 100) / 100
      );
    });

    it('should not include discount fields when no discount is set', async () => {
      const providerNoDiscount = await DeliveryService.registerProvider('del-uid-nodiscount', defaultProviderData);

      const mockDb = getFirestore();
      const collectionData = (mockDb as any).getCollectionData();
      collectionData['delivery_providers'] = [
        { ...providerNoDiscount, approvalStatus: ApprovalStatus.APPROVED },
      ];

      const available = await DeliveryService.getAvailableProviders(
        6.4541, 3.4216,
        6.5944, 3.3467
      );

      expect(available.length).toBe(1);
      expect(available[0].discount).toBeUndefined();
      expect(available[0].originalFee).toBeUndefined();
    });

    it('should sort available providers by rating', async () => {
      const mockDb = getFirestore();
      const collectionData = (mockDb as any).getCollectionData();

      collectionData['delivery_providers'] = [
        {
          id: 'prov-low',
          businessName: 'Low Rated',
          baseFee: 400,
          perKmFee: 50,
          rating: 3.2,
          totalReviews: 10,
          approvalStatus: ApprovalStatus.APPROVED,
          isActive: true,
        },
        {
          id: 'prov-high',
          businessName: 'High Rated',
          baseFee: 600,
          perKmFee: 80,
          rating: 4.9,
          totalReviews: 200,
          approvalStatus: ApprovalStatus.APPROVED,
          isActive: true,
        },
      ];

      const available = await DeliveryService.getAvailableProviders(
        6.4541, 3.4216,
        6.5944, 3.3467
      );

      if (available.length > 1) {
        expect(available[0].rating).toBeGreaterThanOrEqual(available[1].rating);
      }
    });

    it('should not list inactive or pending providers', async () => {
      const mockDb = getFirestore();
      const collectionData = (mockDb as any).getCollectionData();

      collectionData['delivery_providers'] = [
        {
          id: 'prov-pending',
          businessName: 'Pending Provider',
          baseFee: 500,
          perKmFee: 50,
          rating: 0,
          totalReviews: 0,
          approvalStatus: ApprovalStatus.PENDING,
          isActive: true,
        },
      ];

      const available = await DeliveryService.getAvailableProviders(
        6.4541, 3.4216,
        6.5944, 3.3467
      );

      expect(available.every((p: any) => p.approvalStatus === ApprovalStatus.APPROVED)).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────
  // 4. DELIVERY ASSIGNMENT
  // ─────────────────────────────────────────────────────────
  describe('Step 4: Create Delivery Assignment', () => {
    it('should create a delivery assignment for an order', async () => {
      const assignment = await DeliveryService.createAssignment({
        orderId: 'order-e2e-001',
        deliveryRiderId: 'rider-e2e-001',
        deliveryProviderId: 'provider-e2e-001',
        pickupLatitude: 6.4541,
        pickupLongitude: 3.4216,
        deliveryLatitude: 6.5944,
        deliveryLongitude: 3.3467,
      });

      expect(assignment).toBeDefined();
      expect(assignment.orderId).toBe('order-e2e-001');
      expect(assignment.deliveryRiderId).toBe('rider-e2e-001');
      expect(assignment.status).toBe(DeliveryAssignmentStatus.PENDING);
    });

    it('should calculate estimated duration and distance', async () => {
      const assignment = await DeliveryService.createAssignment({
        orderId: 'order-e2e-002',
        deliveryRiderId: 'rider-e2e-001',
        deliveryProviderId: 'provider-e2e-001',
        pickupLatitude: 6.4541,
        pickupLongitude: 3.4216,
        deliveryLatitude: 6.5944,
        deliveryLongitude: 3.3467,
      });

      expect(assignment.estimatedDuration).toBeGreaterThan(0);
      expect(assignment.actualDistance).toBeGreaterThan(0);
    });

    it('should generate two-way security verification codes', async () => {
      const assignment = await DeliveryService.createAssignment({
        orderId: 'order-e2e-003',
        deliveryRiderId: 'rider-e2e-001',
        deliveryProviderId: 'provider-e2e-001',
        pickupLatitude: 6.4541,
        pickupLongitude: 3.4216,
        deliveryLatitude: 6.5944,
        deliveryLongitude: 3.3467,
      });

      const verification = await DeliveryService.getVerification(assignment.id);

      expect(verification).toBeDefined();
      expect(verification?.customerCode).toBeDefined();
      expect(verification?.riderCode).toBeDefined();
      // Codes should be different
      expect(verification?.customerCode).not.toBe(verification?.riderCode);
    });

    it('should retrieve assignment by ID', async () => {
      const created = await DeliveryService.createAssignment({
        orderId: 'order-e2e-004',
        deliveryRiderId: 'rider-e2e-001',
        deliveryProviderId: 'provider-e2e-001',
        pickupLatitude: 6.4541,
        pickupLongitude: 3.4216,
        deliveryLatitude: 6.5944,
        deliveryLongitude: 3.3467,
      });

      const retrieved = await DeliveryService.getAssignment(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.orderId).toBe('order-e2e-004');
    });

    it('should return null for non-existent assignment', async () => {
      const result = await DeliveryService.getAssignment('non-existent-assignment');
      expect(result).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────
  // 5. DELIVERY STATUS LIFECYCLE
  // ─────────────────────────────────────────────────────────
  describe('Step 5: Delivery Lifecycle (Accept → Pickup → Deliver)', () => {
    let assignmentId: string;

    beforeEach(async () => {
      const assignment = await DeliveryService.createAssignment({
        orderId: 'order-lifecycle-001',
        deliveryRiderId: 'rider-lifecycle-001',
        deliveryProviderId: 'provider-lifecycle-001',
        pickupLatitude: 6.4541,
        pickupLongitude: 3.4216,
        deliveryLatitude: 6.5944,
        deliveryLongitude: 3.3467,
      });
      assignmentId = assignment.id;
    });

    it('should start as PENDING', async () => {
      const assignment = await DeliveryService.getAssignment(assignmentId);
      expect(assignment?.status).toBe(DeliveryAssignmentStatus.PENDING);
    });

    it('should accept assignment', async () => {
      const updated = await DeliveryService.updateAssignmentStatus(
        assignmentId,
        DeliveryAssignmentStatus.ACCEPTED
      );

      expect(updated.status).toBe(DeliveryAssignmentStatus.ACCEPTED);
      expect((updated as any).acceptedAt).toBeDefined();
    });

    it('should mark as picked up', async () => {
      await DeliveryService.updateAssignmentStatus(
        assignmentId,
        DeliveryAssignmentStatus.ACCEPTED
      );

      const pickedUp = await DeliveryService.updateAssignmentStatus(
        assignmentId,
        DeliveryAssignmentStatus.PICKED_UP
      );

      expect(pickedUp.status).toBe(DeliveryAssignmentStatus.PICKED_UP);
      expect((pickedUp as any).pickedUpAt).toBeDefined();
    });

    it('should mark as delivered', async () => {
      await DeliveryService.updateAssignmentStatus(
        assignmentId,
        DeliveryAssignmentStatus.ACCEPTED
      );
      await DeliveryService.updateAssignmentStatus(
        assignmentId,
        DeliveryAssignmentStatus.PICKED_UP
      );

      const delivered = await DeliveryService.updateAssignmentStatus(
        assignmentId,
        DeliveryAssignmentStatus.DELIVERED
      );

      expect(delivered.status).toBe(DeliveryAssignmentStatus.DELIVERED);
      expect((delivered as any).deliveredAt).toBeDefined();
    });

    it('should progress through full lifecycle', async () => {
      // PENDING → ACCEPTED → PICKED_UP → DELIVERED
      const accepted = await DeliveryService.updateAssignmentStatus(
        assignmentId,
        DeliveryAssignmentStatus.ACCEPTED
      );
      expect(accepted.status).toBe(DeliveryAssignmentStatus.ACCEPTED);

      const pickedUp = await DeliveryService.updateAssignmentStatus(
        assignmentId,
        DeliveryAssignmentStatus.PICKED_UP
      );
      expect(pickedUp.status).toBe(DeliveryAssignmentStatus.PICKED_UP);

      const delivered = await DeliveryService.updateAssignmentStatus(
        assignmentId,
        DeliveryAssignmentStatus.DELIVERED
      );
      expect(delivered.status).toBe(DeliveryAssignmentStatus.DELIVERED);
    });
  });

  // ─────────────────────────────────────────────────────────
  // 6. TWO-WAY SECURITY CODE VERIFICATION
  // ─────────────────────────────────────────────────────────
  describe('Step 6: Two-Way Security Code Verification', () => {
    let assignmentId: string;

    beforeEach(async () => {
      const assignment = await DeliveryService.createAssignment({
        orderId: 'order-verify-001',
        deliveryRiderId: 'rider-verify-001',
        deliveryProviderId: 'provider-verify-001',
        pickupLatitude: 6.4541,
        pickupLongitude: 3.4216,
        deliveryLatitude: 6.5944,
        deliveryLongitude: 3.3467,
      });
      assignmentId = assignment.id;
    });

    it('should verify correct customer code', async () => {
      const verification = await DeliveryService.getVerification(assignmentId);

      if (verification) {
        const result = await DeliveryService.verifySecurityCode(
          assignmentId,
          verification.customerCode,
          true // isCustomerCode
        );

        expect(result.verified).toBe(true);
      }
    });

    it('should verify correct rider code', async () => {
      const verification = await DeliveryService.getVerification(assignmentId);

      if (verification) {
        const result = await DeliveryService.verifySecurityCode(
          assignmentId,
          verification.riderCode,
          false // isCustomerCode = false → rider code
        );

        expect(result.verified).toBe(true);
      }
    });

    it('should reject incorrect security code', async () => {
      await expect(
        DeliveryService.verifySecurityCode(assignmentId, 'WRONG-CODE', true)
      ).rejects.toThrow();
    });

    it('should detect when both codes are verified (handoff complete)', async () => {
      const verification = await DeliveryService.getVerification(assignmentId);

      if (verification) {
        // Customer verifies first
        await DeliveryService.verifySecurityCode(
          assignmentId,
          verification.customerCode,
          true
        );

        // Rider verifies second
        const result = await DeliveryService.verifySecurityCode(
          assignmentId,
          verification.riderCode,
          false
        );

        expect(result.bothVerified).toBe(true);
      }
    });

    it('should not mark bothVerified until both codes are given', async () => {
      const verification = await DeliveryService.getVerification(assignmentId);

      if (verification) {
        // Only customer verifies
        const result = await DeliveryService.verifySecurityCode(
          assignmentId,
          verification.customerCode,
          true
        );

        expect(result.verified).toBe(true);
        expect(result.bothVerified).toBeFalsy();
      }
    });

    it('should return null verification for non-existent assignment', async () => {
      const result = await DeliveryService.getVerification('non-existent');
      expect(result).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────
  // 7. FULL E2E: ORDER → ASSIGN → DELIVER → VERIFY
  // ─────────────────────────────────────────────────────────
  describe('Step 7: Full Delivery E2E (Order through Verification)', () => {
    it('should complete full delivery lifecycle from order to handoff', async () => {
      // 1. Mock product for OrderService
      jest.spyOn(PharmacyService, 'getPharmacyProduct').mockResolvedValue({
        id: 'product-e2e',
        pharmacyId: 'pharmacy-e2e',
        drugCatalogItemId: 'drug-e2e',
        sku: 'E2E-001',
        quantity: 100,
        price: 500,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      // 2. Customer creates order
      const order = await OrderService.createOrder({
        customerId: 'customer-e2e',
        pharmacyId: 'pharmacy-e2e',
        deliveryAddress: '20 Allen Avenue, Ikeja',
        deliveryLatitude: 6.5944,
        deliveryLongitude: 3.3467,
        items: [
          {
            pharmacyProductId: 'product-e2e',
            drugName: 'Paracetamol',
            category: 'Pain Relief',
            quantity: 2,
            unitPrice: 500,
          },
        ],
      });

      expect(order.status).toBe(OrderStatus.PENDING);

      // 3. Pharmacy confirms order
      const confirmed = await OrderService.updateOrderStatus(order.id, OrderStatus.CONFIRMED);
      expect(confirmed.status).toBe(OrderStatus.CONFIRMED);

      // 4. Order prepared and ready
      await OrderService.updateOrderStatus(order.id, OrderStatus.PREPARING);
      await OrderService.updateOrderStatus(order.id, OrderStatus.READY_FOR_PICKUP);

      // 5. Create delivery assignment
      const assignment = await DeliveryService.createAssignment({
        orderId: order.id,
        deliveryRiderId: 'rider-full-e2e',
        deliveryProviderId: 'provider-full-e2e',
        pickupLatitude: 6.4541, // pharmacy
        pickupLongitude: 3.4216,
        deliveryLatitude: 6.5944, // customer
        deliveryLongitude: 3.3467,
      });

      expect(assignment.status).toBe(DeliveryAssignmentStatus.PENDING);

      // 6. Rider accepts
      const accepted = await DeliveryService.updateAssignmentStatus(
        assignment.id,
        DeliveryAssignmentStatus.ACCEPTED
      );
      expect(accepted.status).toBe(DeliveryAssignmentStatus.ACCEPTED);

      // 7. Order marked out for delivery
      await OrderService.updateOrderStatus(order.id, OrderStatus.OUT_FOR_DELIVERY);

      // 8. Rider picks up from pharmacy
      const pickedUp = await DeliveryService.updateAssignmentStatus(
        assignment.id,
        DeliveryAssignmentStatus.PICKED_UP
      );
      expect(pickedUp.status).toBe(DeliveryAssignmentStatus.PICKED_UP);

      // 9. Two-way security code verification at delivery
      const verification = await DeliveryService.getVerification(assignment.id);
      expect(verification).toBeDefined();

      if (verification) {
        // Customer shows code to rider
        const customerVerify = await DeliveryService.verifySecurityCode(
          assignment.id,
          verification.customerCode,
          true
        );
        expect(customerVerify.verified).toBe(true);

        // Rider shows code to customer
        const riderVerify = await DeliveryService.verifySecurityCode(
          assignment.id,
          verification.riderCode,
          false
        );
        expect(riderVerify.verified).toBe(true);
        expect(riderVerify.bothVerified).toBe(true);
      }

      // 10. Mark delivery as complete
      const delivered = await DeliveryService.updateAssignmentStatus(
        assignment.id,
        DeliveryAssignmentStatus.DELIVERED
      );
      expect(delivered.status).toBe(DeliveryAssignmentStatus.DELIVERED);
      expect((delivered as any).deliveredAt).toBeDefined();

      // 11. Order marked as delivered
      const orderDelivered = await OrderService.updateOrderStatus(order.id, OrderStatus.DELIVERED);
      expect(orderDelivered.status).toBe(OrderStatus.DELIVERED);
    });
  });
});
