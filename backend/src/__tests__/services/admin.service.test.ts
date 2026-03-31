/**
 * Admin Service Tests
 * Tests for admin operations, approvals, and dashboard functions
 */

import { AdminService } from '../../modules/admin/admin.service';
import { getFirestore } from '../../config/firebase';
import { createFirestoreMock } from '../mocks/firestore.mock';
import {
  ApprovalStatus,
  FlagAction,
  OrderStatus,
  PaymentStatus,
  UserRole,
} from '@pharmaconnect/shared/dist/types/index';

jest.mock('../../config/firebase');
jest.mock('../../utils/logger');
jest.mock('../../utils/helpers', () => ({
  calculateDistanceKm: jest.fn((_lat1, _lng1, _lat2, _lng2) => 10),
}));

const mockFirestore = createFirestoreMock();

describe('AdminService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFirestore.reset();
    (getFirestore as jest.Mock).mockReturnValue(mockFirestore);
  });

  describe('getPendingPharmacies', () => {
    it('should retrieve all pending pharmacies', async () => {
      // Create pending pharmacy in Firestore
      const collectionRef = mockFirestore.collection('pharmacies');
      await collectionRef.add({
        id: 'pharmacy-pending-1',
        userId: 'owner-1',
        name: 'Pending Pharmacy 1',
        email: 'pending1@example.com',
        phoneNumber: '+2348012345678',
        address: 'Address 1',
        latitude: 6.5244,
        longitude: 3.3792,
        licenseNumber: 'PL-001',
        licenseDocUrl: 'url1',
        cacNumber: 'CAC-001',
        cacDocUrl: 'url1',
        ownerName: 'Owner 1',
        ownerIdDocUrl: 'url1',
        operatingHours: {},
        approvalStatus: ApprovalStatus.PENDING,
        isActive: true,
        rating: 0,
        totalReviews: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await collectionRef.add({
        id: 'pharmacy-pending-2',
        userId: 'owner-2',
        name: 'Pending Pharmacy 2',
        email: 'pending2@example.com',
        phoneNumber: '+2348012345679',
        address: 'Address 2',
        latitude: 6.5244,
        longitude: 3.3792,
        licenseNumber: 'PL-002',
        licenseDocUrl: 'url2',
        cacNumber: 'CAC-002',
        cacDocUrl: 'url2',
        ownerName: 'Owner 2',
        ownerIdDocUrl: 'url2',
        operatingHours: {},
        approvalStatus: ApprovalStatus.PENDING,
        isActive: true,
        rating: 0,
        totalReviews: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const pending = await AdminService.getPendingPharmacies();

      expect(Array.isArray(pending)).toBe(true);
      expect(pending.length).toBeGreaterThanOrEqual(2);
      expect(pending.every((p) => p.approvalStatus === ApprovalStatus.PENDING)).toBe(true);
    });

    it('should return empty array when no pending pharmacies', async () => {
      const pending = await AdminService.getPendingPharmacies();
      expect(Array.isArray(pending)).toBe(true);
    });

    it('should order pharmacies by creation date descending', async () => {
      const collectionRef = mockFirestore.collection('pharmacies');
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 3600000);

      await collectionRef.add({
        id: 'pharmacy-old',
        userId: 'owner-old',
        name: 'Old Pharmacy',
        email: 'old@example.com',
        phoneNumber: '+2348012345680',
        address: 'Old Address',
        latitude: 6.5244,
        longitude: 3.3792,
        licenseNumber: 'PL-003',
        licenseDocUrl: 'url3',
        cacNumber: 'CAC-003',
        cacDocUrl: 'url3',
        ownerName: 'Old Owner',
        ownerIdDocUrl: 'url3',
        operatingHours: {},
        approvalStatus: ApprovalStatus.PENDING,
        isActive: true,
        rating: 0,
        totalReviews: 0,
        createdAt: oneHourAgo,
        updatedAt: oneHourAgo,
      });

      await collectionRef.add({
        id: 'pharmacy-new',
        userId: 'owner-new',
        name: 'New Pharmacy',
        email: 'new@example.com',
        phoneNumber: '+2348012345681',
        address: 'New Address',
        latitude: 6.5244,
        longitude: 3.3792,
        licenseNumber: 'PL-004',
        licenseDocUrl: 'url4',
        cacNumber: 'CAC-004',
        cacDocUrl: 'url4',
        ownerName: 'New Owner',
        ownerIdDocUrl: 'url4',
        operatingHours: {},
        approvalStatus: ApprovalStatus.PENDING,
        isActive: true,
        rating: 0,
        totalReviews: 0,
        createdAt: now,
        updatedAt: now,
      });

      const pending = await AdminService.getPendingPharmacies();

      expect(pending.length).toBeGreaterThanOrEqual(2);
      // Newest should come first
      expect(pending[0].createdAt.getTime()).toBeGreaterThanOrEqual(
        pending[pending.length - 1].createdAt.getTime()
      );
    });
  });

  describe('approvePharmacy', () => {
    it('should approve a pending pharmacy', async () => {
      const collectionRef = mockFirestore.collection('pharmacies');
      const docRef = collectionRef.doc('pharmacy-approve-test');

      await docRef.set({
        id: 'pharmacy-approve-test',
        userId: 'owner-approve',
        name: 'Approve Test Pharmacy',
        email: 'approvetest@example.com',
        phoneNumber: '+2348012345682',
        address: 'Approve Address',
        latitude: 6.5244,
        longitude: 3.3792,
        licenseNumber: 'PL-005',
        licenseDocUrl: 'url5',
        cacNumber: 'CAC-005',
        cacDocUrl: 'url5',
        ownerName: 'Approve Owner',
        ownerIdDocUrl: 'url5',
        operatingHours: {},
        approvalStatus: ApprovalStatus.PENDING,
        isActive: true,
        rating: 0,
        totalReviews: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const approved = await AdminService.approvePharmacy('pharmacy-approve-test');

      expect(approved.approvalStatus).toBe(ApprovalStatus.APPROVED);
    });

    it('should update the updatedAt timestamp on approval', async () => {
      const collectionRef = mockFirestore.collection('pharmacies');
      const docRef = collectionRef.doc('pharmacy-timestamp-test');
      const before = new Date();

      await docRef.set({
        id: 'pharmacy-timestamp-test',
        userId: 'owner-timestamp',
        name: 'Timestamp Pharmacy',
        email: 'timestamp@example.com',
        phoneNumber: '+2348012345683',
        address: 'Timestamp Address',
        latitude: 6.5244,
        longitude: 3.3792,
        licenseNumber: 'PL-006',
        licenseDocUrl: 'url6',
        cacNumber: 'CAC-006',
        cacDocUrl: 'url6',
        ownerName: 'Timestamp Owner',
        ownerIdDocUrl: 'url6',
        operatingHours: {},
        approvalStatus: ApprovalStatus.PENDING,
        isActive: true,
        rating: 0,
        totalReviews: 0,
        createdAt: before,
        updatedAt: before,
      });

      const approved = await AdminService.approvePharmacy('pharmacy-timestamp-test');
      const after = new Date();

      expect(approved.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(approved.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('rejectPharmacy', () => {
    it('should reject a pending pharmacy', async () => {
      const collectionRef = mockFirestore.collection('pharmacies');
      const docRef = collectionRef.doc('pharmacy-reject-test');

      await docRef.set({
        id: 'pharmacy-reject-test',
        userId: 'owner-reject',
        name: 'Reject Test Pharmacy',
        email: 'rejecttest@example.com',
        phoneNumber: '+2348012345684',
        address: 'Reject Address',
        latitude: 6.5244,
        longitude: 3.3792,
        licenseNumber: 'PL-007',
        licenseDocUrl: 'url7',
        cacNumber: 'CAC-007',
        cacDocUrl: 'url7',
        ownerName: 'Reject Owner',
        ownerIdDocUrl: 'url7',
        operatingHours: {},
        approvalStatus: ApprovalStatus.PENDING,
        isActive: true,
        rating: 0,
        totalReviews: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const rejected = await AdminService.rejectPharmacy('pharmacy-reject-test');

      expect(rejected.approvalStatus).toBe(ApprovalStatus.REJECTED);
    });

    it('should store rejection reason', async () => {
      const collectionRef = mockFirestore.collection('pharmacies');
      const docRef = collectionRef.doc('pharmacy-reason-test');

      await docRef.set({
        id: 'pharmacy-reason-test',
        userId: 'owner-reason',
        name: 'Reason Test Pharmacy',
        email: 'reasontest@example.com',
        phoneNumber: '+2348012345685',
        address: 'Reason Address',
        latitude: 6.5244,
        longitude: 3.3792,
        licenseNumber: 'PL-008',
        licenseDocUrl: 'url8',
        cacNumber: 'CAC-008',
        cacDocUrl: 'url8',
        ownerName: 'Reason Owner',
        ownerIdDocUrl: 'url8',
        operatingHours: {},
        approvalStatus: ApprovalStatus.PENDING,
        isActive: true,
        rating: 0,
        totalReviews: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const reason = 'Invalid license documents';
      const rejected = await AdminService.rejectPharmacy('pharmacy-reason-test', reason);

      expect((rejected as any).rejectionReason).toBe(reason);
    });
  });

  describe('getPendingDeliveryProviders', () => {
    it('should retrieve all pending delivery providers', async () => {
      const collectionRef = mockFirestore.collection('delivery_providers');

      await collectionRef.add({
        id: 'provider-pending-1',
        userId: 'user-provider-1',
        businessName: 'Delivery Co 1',
        email: 'delivery1@example.com',
        phoneNumber: '+2348012345686',
        address: 'Delivery Address 1',
        cacNumber: 'CAC-D-001',
        cacDocUrl: 'url1',
        ownerName: 'Owner 1',
        ownerIdDocUrl: 'url1',
        vehicleDocUrl: 'url1',
        baseFee: 500,
        perKmFee: 50,
        approvalStatus: ApprovalStatus.PENDING,
        isActive: true,
        rating: 0,
        totalReviews: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const pending = await AdminService.getPendingDeliveryProviders();

      expect(Array.isArray(pending)).toBe(true);
      expect(pending.every((p) => p.approvalStatus === ApprovalStatus.PENDING)).toBe(true);
    });

    it('should return empty array when no pending providers', async () => {
      const pending = await AdminService.getPendingDeliveryProviders();
      expect(Array.isArray(pending)).toBe(true);
    });
  });

  describe('approveProvider', () => {
    it('should approve a pending delivery provider', async () => {
      const collectionRef = mockFirestore.collection('delivery_providers');
      const docRef = collectionRef.doc('provider-approve-test');

      await docRef.set({
        id: 'provider-approve-test',
        userId: 'user-provider-approve',
        businessName: 'Approve Delivery Co',
        email: 'approvedelivery@example.com',
        phoneNumber: '+2348012345687',
        address: 'Approve Delivery Address',
        cacNumber: 'CAC-D-002',
        cacDocUrl: 'url2',
        ownerName: 'Delivery Owner',
        ownerIdDocUrl: 'url2',
        vehicleDocUrl: 'url2',
        baseFee: 500,
        perKmFee: 50,
        approvalStatus: ApprovalStatus.PENDING,
        isActive: true,
        rating: 0,
        totalReviews: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const approved = await AdminService.approveProvider('provider-approve-test');

      expect(approved.approvalStatus).toBe(ApprovalStatus.APPROVED);
    });
  });

  describe('rejectProvider', () => {
    it('should reject a pending delivery provider', async () => {
      const collectionRef = mockFirestore.collection('delivery_providers');
      const docRef = collectionRef.doc('provider-reject-test');

      await docRef.set({
        id: 'provider-reject-test',
        userId: 'user-provider-reject',
        businessName: 'Reject Delivery Co',
        email: 'rejectdelivery@example.com',
        phoneNumber: '+2348012345688',
        address: 'Reject Delivery Address',
        cacNumber: 'CAC-D-003',
        cacDocUrl: 'url3',
        ownerName: 'Reject Owner',
        ownerIdDocUrl: 'url3',
        vehicleDocUrl: 'url3',
        baseFee: 500,
        perKmFee: 50,
        approvalStatus: ApprovalStatus.PENDING,
        isActive: true,
        rating: 0,
        totalReviews: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const rejected = await AdminService.rejectProvider('provider-reject-test');

      expect(rejected.approvalStatus).toBe(ApprovalStatus.REJECTED);
    });

    it('should store rejection reason for provider', async () => {
      const collectionRef = mockFirestore.collection('delivery_providers');
      const docRef = collectionRef.doc('provider-reason-test');

      await docRef.set({
        id: 'provider-reason-test',
        userId: 'user-provider-reason',
        businessName: 'Reason Delivery Co',
        email: 'reasondelivery@example.com',
        phoneNumber: '+2348012345689',
        address: 'Reason Delivery Address',
        cacNumber: 'CAC-D-004',
        cacDocUrl: 'url4',
        ownerName: 'Reason Owner',
        ownerIdDocUrl: 'url4',
        vehicleDocUrl: 'url4',
        baseFee: 500,
        perKmFee: 50,
        approvalStatus: ApprovalStatus.PENDING,
        isActive: true,
        rating: 0,
        totalReviews: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const reason = 'Vehicle documents incomplete';
      const rejected = await AdminService.rejectProvider('provider-reason-test', reason);

      expect((rejected as any).rejectionReason).toBe(reason);
    });
  });

  describe('getFlaggedAlerts', () => {
    it('should retrieve flagged alerts', async () => {
      const collectionRef = mockFirestore.collection('flagged_alerts');

      await collectionRef.add({
        id: 'alert-1',
        messageId: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'customer-1',
        senderRole: UserRole.CUSTOMER,
        suspiciousKeywords: ['prescription', 'drug'],
        nlpClassification: 'prescription_request',
        confidenceScore: 0.95,
        action: FlagAction.DISMISSED,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const alerts = await AdminService.getFlaggedAlerts();

      expect(alerts.alerts).toBeDefined();
      expect(alerts.total).toBeDefined();
      expect(Array.isArray(alerts.alerts)).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const collectionRef = mockFirestore.collection('flagged_alerts');

      for (let i = 0; i < 10; i++) {
        await collectionRef.add({
          id: `alert-limit-${i}`,
          messageId: `msg-${i}`,
          conversationId: `conv-${i}`,
          senderId: `customer-${i}`,
          senderRole: UserRole.CUSTOMER,
          suspiciousKeywords: ['keyword'],
          nlpClassification: 'prescription_request',
          confidenceScore: 0.9,
          action: FlagAction.DISMISSED,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      const result = await AdminService.getFlaggedAlerts(5);

      expect(result.alerts.length).toBeLessThanOrEqual(5);
    });

    it('should support pagination with offset', async () => {
      const collectionRef = mockFirestore.collection('flagged_alerts');

      for (let i = 0; i < 15; i++) {
        await collectionRef.add({
          id: `alert-page-${i}`,
          messageId: `msg-${i}`,
          conversationId: `conv-${i}`,
          senderId: `customer-${i}`,
          senderRole: UserRole.CUSTOMER,
          suspiciousKeywords: ['keyword'],
          nlpClassification: 'prescription_request',
          confidenceScore: 0.9,
          action: FlagAction.DISMISSED,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      const page1 = await AdminService.getFlaggedAlerts(5, 0);
      const page2 = await AdminService.getFlaggedAlerts(5, 5);

      expect(page1.alerts.length).toBeLessThanOrEqual(5);
      expect(page2.alerts.length).toBeLessThanOrEqual(5);
    });
  });

  describe('reviewAlert', () => {
    it('should review and update alert action', async () => {
      const collectionRef = mockFirestore.collection('flagged_alerts');
      const docRef = collectionRef.doc('alert-review-test');

      await docRef.set({
        id: 'alert-review-test',
        messageId: 'msg-review',
        conversationId: 'conv-review',
        senderId: 'customer-review',
        senderRole: UserRole.CUSTOMER,
        suspiciousKeywords: ['keyword'],
        nlpClassification: 'prescription_request',
        confidenceScore: 0.9,
        action: FlagAction.DISMISSED,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const reviewed = await AdminService.reviewAlert(
        'alert-review-test',
        FlagAction.DISMISSED,
        'admin-1'
      );

      expect(reviewed.action).toBe(FlagAction.DISMISSED);
      expect((reviewed as any).actionTakenBy).toBe('admin-1');
    });

    it('should store review notes', async () => {
      const collectionRef = mockFirestore.collection('flagged_alerts');
      const docRef = collectionRef.doc('alert-notes-test');

      await docRef.set({
        id: 'alert-notes-test',
        messageId: 'msg-notes',
        conversationId: 'conv-notes',
        senderId: 'customer-notes',
        senderRole: UserRole.CUSTOMER,
        suspiciousKeywords: ['keyword'],
        nlpClassification: 'prescription_request',
        confidenceScore: 0.9,
        action: FlagAction.DISMISSED,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const notes = 'False positive - legitimate inquiry';
      const reviewed = await AdminService.reviewAlert(
        'alert-notes-test',
        FlagAction.DISMISSED,
        'admin-1',
        notes
      );

      expect((reviewed as any).actionNotes).toBe(notes);
    });
  });

  describe('getDashboardStats', () => {
    it('should return dashboard statistics', async () => {
      // Add some test data
      const pharmaciesRef = mockFirestore.collection('pharmacies');
      const providersRef = mockFirestore.collection('delivery_providers');
      const ordersRef = mockFirestore.collection('orders');

      await pharmaciesRef.add({
        id: 'pharmacy-stats-1',
        userId: 'owner-stats-1',
        name: 'Stats Pharmacy 1',
        email: 'stats1@example.com',
        phoneNumber: '+2348012345690',
        address: 'Stats Address 1',
        latitude: 6.5244,
        longitude: 3.3792,
        licenseNumber: 'PL-STATS-001',
        licenseDocUrl: 'url',
        cacNumber: 'CAC-STATS-001',
        cacDocUrl: 'url',
        ownerName: 'Stats Owner 1',
        ownerIdDocUrl: 'url',
        operatingHours: {},
        approvalStatus: ApprovalStatus.APPROVED,
        isActive: true,
        rating: 4.5,
        totalReviews: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await providersRef.add({
        id: 'provider-stats-1',
        userId: 'user-provider-stats-1',
        businessName: 'Stats Delivery',
        email: 'statsdelivery@example.com',
        phoneNumber: '+2348012345691',
        address: 'Stats Delivery Address',
        cacNumber: 'CAC-STATS-D-001',
        cacDocUrl: 'url',
        ownerName: 'Stats Delivery Owner',
        ownerIdDocUrl: 'url',
        vehicleDocUrl: 'url',
        baseFee: 500,
        perKmFee: 50,
        approvalStatus: ApprovalStatus.APPROVED,
        isActive: true,
        rating: 4.0,
        totalReviews: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await ordersRef.add({
        id: 'order-stats-1',
        customerId: 'customer-stats',
        pharmacyId: 'pharmacy-stats-1',
        status: OrderStatus.DELIVERED,
        paymentStatus: PaymentStatus.PAID,
        subtotal: 1000,
        pharmacyCommission: 50,
        deliveryFee: 200,
        deliveryCommission: 20,
        serviceFee: 100,
        total: 1320,
        paymentMethod: 'card',
        deliveryAddress: 'Customer Address',
        deliveryLatitude: 6.5244,
        deliveryLongitude: 3.3792,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const stats = await AdminService.getDashboardStats();

      expect(stats.totalPharmacies).toBeGreaterThanOrEqual(1);
      expect(stats.approvedPharmacies).toBeGreaterThanOrEqual(1);
      expect(stats.totalDeliveryProviders).toBeGreaterThanOrEqual(1);
      expect(stats.approvedProviders).toBeGreaterThanOrEqual(1);
      expect(stats.totalOrders).toBeGreaterThanOrEqual(1);
      expect(stats.totalRevenue).toBeGreaterThan(0);
      expect(stats.flaggedAlerts).toBeDefined();
    });

    it('should count pending vs approved entities', async () => {
      const pharmaciesRef = mockFirestore.collection('pharmacies');

      // Add approved pharmacy
      await pharmaciesRef.add({
        id: 'approved-pharm',
        userId: 'owner-approved',
        name: 'Approved Pharmacy',
        email: 'approved@example.com',
        phoneNumber: '+2348012345692',
        address: 'Approved Address',
        latitude: 6.5244,
        longitude: 3.3792,
        licenseNumber: 'PL-APP-001',
        licenseDocUrl: 'url',
        cacNumber: 'CAC-APP-001',
        cacDocUrl: 'url',
        ownerName: 'Approved Owner',
        ownerIdDocUrl: 'url',
        operatingHours: {},
        approvalStatus: ApprovalStatus.APPROVED,
        isActive: true,
        rating: 0,
        totalReviews: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Add pending pharmacy
      await pharmaciesRef.add({
        id: 'pending-pharm',
        userId: 'owner-pending',
        name: 'Pending Pharmacy',
        email: 'pending@example.com',
        phoneNumber: '+2348012345693',
        address: 'Pending Address',
        latitude: 6.5244,
        longitude: 3.3792,
        licenseNumber: 'PL-PEN-001',
        licenseDocUrl: 'url',
        cacNumber: 'CAC-PEN-001',
        cacDocUrl: 'url',
        ownerName: 'Pending Owner',
        ownerIdDocUrl: 'url',
        operatingHours: {},
        approvalStatus: ApprovalStatus.PENDING,
        isActive: true,
        rating: 0,
        totalReviews: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const stats = await AdminService.getDashboardStats();

      expect(stats.approvedPharmacies).toBeGreaterThanOrEqual(1);
      expect(stats.pendingPharmacies).toBeGreaterThanOrEqual(1);
      expect(stats.totalPharmacies).toBeGreaterThanOrEqual(
        stats.approvedPharmacies + stats.pendingPharmacies
      );
    });
  });

  describe('getAllTransactions', () => {
    it('should retrieve all transactions ordered by date', async () => {
      const ordersRef = mockFirestore.collection('orders');

      await ordersRef.add({
        id: 'order-trans-1',
        customerId: 'customer-trans-1',
        pharmacyId: 'pharmacy-trans-1',
        status: OrderStatus.DELIVERED,
        paymentStatus: PaymentStatus.PAID,
        subtotal: 1000,
        pharmacyCommission: 50,
        deliveryFee: 200,
        deliveryCommission: 20,
        serviceFee: 100,
        total: 1320,
        paymentMethod: 'card',
        deliveryAddress: 'Address 1',
        deliveryLatitude: 6.5244,
        deliveryLongitude: 3.3792,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await ordersRef.add({
        id: 'order-trans-2',
        customerId: 'customer-trans-2',
        pharmacyId: 'pharmacy-trans-2',
        status: OrderStatus.CANCELLED,
        paymentStatus: PaymentStatus.REFUNDED,
        subtotal: 500,
        pharmacyCommission: 25,
        deliveryFee: 0,
        deliveryCommission: 0,
        serviceFee: 50,
        total: 550,
        paymentMethod: 'card',
        deliveryAddress: 'Address 2',
        deliveryLatitude: 6.5244,
        deliveryLongitude: 3.3792,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const transactions = await AdminService.getAllTransactions();

      expect(Array.isArray(transactions)).toBe(true);
      expect(transactions.length).toBeGreaterThanOrEqual(2);
    });

    it('should respect limit parameter', async () => {
      const ordersRef = mockFirestore.collection('orders');

      for (let i = 0; i < 10; i++) {
        await ordersRef.add({
          id: `order-limit-${i}`,
          customerId: `customer-${i}`,
          pharmacyId: `pharmacy-${i}`,
          status: OrderStatus.DELIVERED,
          paymentStatus: PaymentStatus.PAID,
          subtotal: 1000,
          pharmacyCommission: 50,
          deliveryFee: 200,
          deliveryCommission: 20,
          serviceFee: 100,
          total: 1320,
          paymentMethod: 'card',
          deliveryAddress: `Address ${i}`,
          deliveryLatitude: 6.5244,
          deliveryLongitude: 3.3792,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      const transactions = await AdminService.getAllTransactions(5);

      expect(transactions.length).toBeLessThanOrEqual(5);
    });

    it('should return empty array when no transactions', async () => {
      const transactions = await AdminService.getAllTransactions();

      expect(Array.isArray(transactions)).toBe(true);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete approval workflow for pharmacy', async () => {
      const pharmaciesRef = mockFirestore.collection('pharmacies');
      const docRef = pharmaciesRef.doc('pharmacy-workflow');

      // Create pending pharmacy
      await docRef.set({
        id: 'pharmacy-workflow',
        userId: 'owner-workflow',
        name: 'Workflow Pharmacy',
        email: 'workflow@example.com',
        phoneNumber: '+2348012345694',
        address: 'Workflow Address',
        latitude: 6.5244,
        longitude: 3.3792,
        licenseNumber: 'PL-WORK-001',
        licenseDocUrl: 'url',
        cacNumber: 'CAC-WORK-001',
        cacDocUrl: 'url',
        ownerName: 'Workflow Owner',
        ownerIdDocUrl: 'url',
        operatingHours: {},
        approvalStatus: ApprovalStatus.PENDING,
        isActive: true,
        rating: 0,
        totalReviews: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Get pending pharmacies
      const pending = await AdminService.getPendingPharmacies();
      expect(pending.some((p) => p.id === 'pharmacy-workflow')).toBe(true);

      // Approve the pharmacy
      const approved = await AdminService.approvePharmacy('pharmacy-workflow');
      expect(approved.approvalStatus).toBe(ApprovalStatus.APPROVED);

      // Verify in dashboard stats
      const stats = await AdminService.getDashboardStats();
      expect(stats.approvedPharmacies).toBeGreaterThan(0);
    });

    it('should track statistics for mixed approval states', async () => {
      const pharmaciesRef = mockFirestore.collection('pharmacies');

      // Add approved pharmacy
      await pharmaciesRef.add({
        id: 'pharm-approved-mixed',
        userId: 'owner-app-mixed',
        name: 'Approved Pharmacy',
        email: 'approved.mixed@example.com',
        phoneNumber: '+2348012345695',
        address: 'Approved Mixed Address',
        latitude: 6.5244,
        longitude: 3.3792,
        licenseNumber: 'PL-MIX-APP-001',
        licenseDocUrl: 'url',
        cacNumber: 'CAC-MIX-APP-001',
        cacDocUrl: 'url',
        ownerName: 'Approved Mixed Owner',
        ownerIdDocUrl: 'url',
        operatingHours: {},
        approvalStatus: ApprovalStatus.APPROVED,
        isActive: true,
        rating: 5.0,
        totalReviews: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Add rejected pharmacy
      await pharmaciesRef.add({
        id: 'pharm-rejected-mixed',
        userId: 'owner-rej-mixed',
        name: 'Rejected Pharmacy',
        email: 'rejected.mixed@example.com',
        phoneNumber: '+2348012345696',
        address: 'Rejected Mixed Address',
        latitude: 6.5244,
        longitude: 3.3792,
        licenseNumber: 'PL-MIX-REJ-001',
        licenseDocUrl: 'url',
        cacNumber: 'CAC-MIX-REJ-001',
        cacDocUrl: 'url',
        ownerName: 'Rejected Mixed Owner',
        ownerIdDocUrl: 'url',
        operatingHours: {},
        approvalStatus: ApprovalStatus.REJECTED,
        isActive: false,
        rating: 0,
        totalReviews: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Add pending pharmacy
      await pharmaciesRef.add({
        id: 'pharm-pending-mixed',
        userId: 'owner-pen-mixed',
        name: 'Pending Pharmacy',
        email: 'pending.mixed@example.com',
        phoneNumber: '+2348012345697',
        address: 'Pending Mixed Address',
        latitude: 6.5244,
        longitude: 3.3792,
        licenseNumber: 'PL-MIX-PEN-001',
        licenseDocUrl: 'url',
        cacNumber: 'CAC-MIX-PEN-001',
        cacDocUrl: 'url',
        ownerName: 'Pending Mixed Owner',
        ownerIdDocUrl: 'url',
        operatingHours: {},
        approvalStatus: ApprovalStatus.PENDING,
        isActive: true,
        rating: 0,
        totalReviews: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const stats = await AdminService.getDashboardStats();

      expect(stats.totalPharmacies).toBeGreaterThanOrEqual(3);
      expect(stats.approvedPharmacies).toBeGreaterThan(0);
      expect(stats.pendingPharmacies).toBeGreaterThan(0);
    });
  });
});
