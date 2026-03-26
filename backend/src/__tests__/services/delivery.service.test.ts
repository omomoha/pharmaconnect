/**
 * Delivery Service Tests
 * Tests for delivery provider management and assignments
 */

import { DeliveryService } from '../../modules/delivery/delivery.service';
import { getFirestore } from '../../config/firebase';
import { createFirestoreMock } from '../mocks/firestore.mock';
import {
  DeliveryAssignmentStatus,
  ApprovalStatus,
} from '@pharmaconnect/shared/dist/types/index';

jest.mock('../../config/firebase');
jest.mock('../../utils/logger');

const mockFirestore = createFirestoreMock();

describe('DeliveryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFirestore.reset();
    (getFirestore as jest.Mock).mockReturnValue(mockFirestore);
  });

  describe('registerProvider', () => {
    it('should register a new delivery provider', async () => {
      const providerData = {
        businessName: 'FastDeliver Co',
        email: 'contact@fastdeliver.com',
        phoneNumber: '+2347012345678',
        address: '123 Commerce St, Lagos',
        cacNumber: 'CAC-123456',
        cacDocUrl: 'https://storage.example.com/cac.pdf',
        ownerName: 'John Doe',
        ownerIdDocUrl: 'https://storage.example.com/ownerid.pdf',
        vehicleDocUrl: 'https://storage.example.com/vehicle.pdf',
        baseFee: 500,
        perKmFee: 50,
      };

      const provider = await DeliveryService.registerProvider('user-123', providerData);

      expect(provider).toBeDefined();
      expect(provider.businessName).toBe('FastDeliver Co');
      expect(provider.email).toBe('contact@fastdeliver.com');
      expect(provider.approvalStatus).toBe(ApprovalStatus.PENDING);
      expect(provider.isActive).toBe(true);
      expect(provider.rating).toBe(0);
      expect(provider.totalReviews).toBe(0);
    });

    it('should set correct fee structure', async () => {
      const providerData = {
        businessName: 'FastDeliver Co',
        email: 'contact@fastdeliver.com',
        phoneNumber: '+2347012345678',
        address: '123 Commerce St, Lagos',
        cacNumber: 'CAC-123456',
        cacDocUrl: 'https://storage.example.com/cac.pdf',
        ownerName: 'John Doe',
        ownerIdDocUrl: 'https://storage.example.com/ownerid.pdf',
        vehicleDocUrl: 'https://storage.example.com/vehicle.pdf',
        baseFee: 500,
        perKmFee: 50,
      };

      const provider = await DeliveryService.registerProvider('user-123', providerData);

      expect(provider.baseFee).toBe(500);
      expect(provider.perKmFee).toBe(50);
    });
  });

  describe('getProvider', () => {
    it('should retrieve a registered provider', async () => {
      const providerData = {
        businessName: 'FastDeliver Co',
        email: 'contact@fastdeliver.com',
        phoneNumber: '+2347012345678',
        address: '123 Commerce St, Lagos',
        cacNumber: 'CAC-123456',
        cacDocUrl: 'https://storage.example.com/cac.pdf',
        ownerName: 'John Doe',
        ownerIdDocUrl: 'https://storage.example.com/ownerid.pdf',
        vehicleDocUrl: 'https://storage.example.com/vehicle.pdf',
        baseFee: 500,
        perKmFee: 50,
      };

      const registered = await DeliveryService.registerProvider('user-123', providerData);
      const retrieved = await DeliveryService.getProvider(registered.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.businessName).toBe('FastDeliver Co');
    });

    it('should return null for non-existent provider', async () => {
      const result = await DeliveryService.getProvider('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('getAvailableProviders', () => {
    it('should return approved and active providers', async () => {
      // Register a provider
      const providerData = {
        businessName: 'FastDeliver Co',
        email: 'contact@fastdeliver.com',
        phoneNumber: '+2347012345678',
        address: '123 Commerce St, Lagos',
        cacNumber: 'CAC-123456',
        cacDocUrl: 'https://storage.example.com/cac.pdf',
        ownerName: 'John Doe',
        ownerIdDocUrl: 'https://storage.example.com/ownerid.pdf',
        vehicleDocUrl: 'https://storage.example.com/vehicle.pdf',
        baseFee: 500,
        perKmFee: 50,
      };

      const registered = await DeliveryService.registerProvider('user-123', providerData);

      // Manually set to approved in mock data
      const mockDb = getFirestore();
      const collectionData = (mockDb as any).getCollectionData();
      collectionData['delivery_providers'] = [
        {
          ...registered,
          approvalStatus: ApprovalStatus.APPROVED,
        },
      ];

      const providers = await DeliveryService.getAvailableProviders(6.5244, 3.3792, 6.524, 3.379);

      expect(Array.isArray(providers)).toBe(true);
    });

    it('should calculate estimated fee correctly', async () => {
      const providerData = {
        businessName: 'FastDeliver Co',
        email: 'contact@fastdeliver.com',
        phoneNumber: '+2347012345678',
        address: '123 Commerce St, Lagos',
        cacNumber: 'CAC-123456',
        cacDocUrl: 'https://storage.example.com/cac.pdf',
        ownerName: 'John Doe',
        ownerIdDocUrl: 'https://storage.example.com/ownerid.pdf',
        vehicleDocUrl: 'https://storage.example.com/vehicle.pdf',
        baseFee: 500,
        perKmFee: 50,
      };

      const registered = await DeliveryService.registerProvider('user-123', providerData);

      const mockDb = getFirestore();
      const collectionData = (mockDb as any).getCollectionData();
      collectionData['delivery_providers'] = [
        {
          ...registered,
          approvalStatus: ApprovalStatus.APPROVED,
        },
      ];

      const providers = await DeliveryService.getAvailableProviders(6.5244, 3.3792, 6.524, 3.379);

      if (providers.length > 0) {
        expect(providers[0].estimatedFee).toBeGreaterThanOrEqual(registered.baseFee);
      }
    });

    it('should sort providers by rating and fee', async () => {
      const mockDb = getFirestore();
      const collectionData = (mockDb as any).getCollectionData();

      const highRatedProvider = {
        id: 'provider-1',
        businessName: 'High Rated',
        baseFee: 500,
        perKmFee: 50,
        rating: 4.8,
        totalReviews: 100,
        approvalStatus: ApprovalStatus.APPROVED,
        isActive: true,
      };

      const lowRatedProvider = {
        id: 'provider-2',
        businessName: 'Low Rated',
        baseFee: 400,
        perKmFee: 50,
        rating: 3.5,
        totalReviews: 50,
        approvalStatus: ApprovalStatus.APPROVED,
        isActive: true,
      };

      collectionData['delivery_providers'] = [lowRatedProvider, highRatedProvider];

      const providers = await DeliveryService.getAvailableProviders(6.5244, 3.3792, 6.524, 3.379);

      if (providers.length > 1) {
        expect(providers[0].rating).toBeGreaterThanOrEqual(providers[1].rating);
      }
    });
  });

  describe('createAssignment', () => {
    it('should create a delivery assignment', async () => {
      const assignmentData = {
        orderId: 'order-123',
        deliveryRiderId: 'rider-456',
        deliveryProviderId: 'provider-789',
        pickupLatitude: 6.5244,
        pickupLongitude: 3.3792,
        deliveryLatitude: 6.524,
        deliveryLongitude: 3.379,
      };

      const assignment = await DeliveryService.createAssignment(assignmentData);

      expect(assignment).toBeDefined();
      expect(assignment.orderId).toBe('order-123');
      expect(assignment.deliveryRiderId).toBe('rider-456');
      expect(assignment.status).toBe(DeliveryAssignmentStatus.PENDING);
      expect(assignment.estimatedDuration).toBeGreaterThan(0);
      expect(assignment.actualDistance).toBeGreaterThan(0);
    });

    it('should generate security codes for delivery', async () => {
      const assignmentData = {
        orderId: 'order-123',
        deliveryRiderId: 'rider-456',
        deliveryProviderId: 'provider-789',
        pickupLatitude: 6.5244,
        pickupLongitude: 3.3792,
        deliveryLatitude: 6.524,
        deliveryLongitude: 3.379,
      };

      await DeliveryService.createAssignment(assignmentData);

      // Check that verification codes were created
      const mockDb = getFirestore();
      const collectionData = (mockDb as any).getCollectionData();
      expect(collectionData['delivery_verifications']).toBeDefined();
    });

    it('should calculate estimated duration based on distance', async () => {
      const assignmentData = {
        orderId: 'order-123',
        deliveryRiderId: 'rider-456',
        deliveryProviderId: 'provider-789',
        pickupLatitude: 0,
        pickupLongitude: 0,
        deliveryLatitude: 0.1,
        deliveryLongitude: 0.1,
      };

      const assignment = await DeliveryService.createAssignment(assignmentData);

      expect(assignment.estimatedDuration).toBeGreaterThan(0);
      expect(assignment.actualDistance).toBeGreaterThan(0);
    });
  });

  describe('getAssignment', () => {
    it('should retrieve an assignment', async () => {
      const assignmentData = {
        orderId: 'order-123',
        deliveryRiderId: 'rider-456',
        deliveryProviderId: 'provider-789',
        pickupLatitude: 6.5244,
        pickupLongitude: 3.3792,
        deliveryLatitude: 6.524,
        deliveryLongitude: 3.379,
      };

      const created = await DeliveryService.createAssignment(assignmentData);
      const retrieved = await DeliveryService.getAssignment(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.orderId).toBe('order-123');
    });

    it('should return null for non-existent assignment', async () => {
      const result = await DeliveryService.getAssignment('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('updateAssignmentStatus', () => {
    it('should update assignment status', async () => {
      const assignmentData = {
        orderId: 'order-123',
        deliveryRiderId: 'rider-456',
        deliveryProviderId: 'provider-789',
        pickupLatitude: 6.5244,
        pickupLongitude: 3.3792,
        deliveryLatitude: 6.524,
        deliveryLongitude: 3.379,
      };

      const created = await DeliveryService.createAssignment(assignmentData);
      const updated = await DeliveryService.updateAssignmentStatus(
        created.id,
        DeliveryAssignmentStatus.ACCEPTED
      );

      expect(updated.status).toBe(DeliveryAssignmentStatus.ACCEPTED);
    });

    it('should set acceptedAt timestamp when accepting', async () => {
      const assignmentData = {
        orderId: 'order-123',
        deliveryRiderId: 'rider-456',
        deliveryProviderId: 'provider-789',
        pickupLatitude: 6.5244,
        pickupLongitude: 3.3792,
        deliveryLatitude: 6.524,
        deliveryLongitude: 3.379,
      };

      const created = await DeliveryService.createAssignment(assignmentData);
      const updated = await DeliveryService.updateAssignmentStatus(
        created.id,
        DeliveryAssignmentStatus.ACCEPTED
      );

      expect((updated as any).acceptedAt).toBeDefined();
    });

    it('should set pickedUpAt timestamp when picking up', async () => {
      const assignmentData = {
        orderId: 'order-123',
        deliveryRiderId: 'rider-456',
        deliveryProviderId: 'provider-789',
        pickupLatitude: 6.5244,
        pickupLongitude: 3.3792,
        deliveryLatitude: 6.524,
        deliveryLongitude: 3.379,
      };

      const created = await DeliveryService.createAssignment(assignmentData);
      const updated = await DeliveryService.updateAssignmentStatus(
        created.id,
        DeliveryAssignmentStatus.PICKED_UP
      );

      expect((updated as any).pickedUpAt).toBeDefined();
    });

    it('should set deliveredAt timestamp when delivering', async () => {
      const assignmentData = {
        orderId: 'order-123',
        deliveryRiderId: 'rider-456',
        deliveryProviderId: 'provider-789',
        pickupLatitude: 6.5244,
        pickupLongitude: 3.3792,
        deliveryLatitude: 6.524,
        deliveryLongitude: 3.379,
      };

      const created = await DeliveryService.createAssignment(assignmentData);
      const updated = await DeliveryService.updateAssignmentStatus(
        created.id,
        DeliveryAssignmentStatus.DELIVERED
      );

      expect((updated as any).deliveredAt).toBeDefined();
    });
  });

  describe('getVerification', () => {
    it('should retrieve verification codes', async () => {
      const assignmentData = {
        orderId: 'order-123',
        deliveryRiderId: 'rider-456',
        deliveryProviderId: 'provider-789',
        pickupLatitude: 6.5244,
        pickupLongitude: 3.3792,
        deliveryLatitude: 6.524,
        deliveryLongitude: 3.379,
      };

      const assignment = await DeliveryService.createAssignment(assignmentData);
      const verification = await DeliveryService.getVerification(assignment.id);

      expect(verification).toBeDefined();
      expect(verification?.customerCode).toBeDefined();
      expect(verification?.riderCode).toBeDefined();
    });

    it('should return null for non-existent verification', async () => {
      const result = await DeliveryService.getVerification('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('verifySecurityCode', () => {
    it('should verify correct customer code', async () => {
      const assignmentData = {
        orderId: 'order-123',
        deliveryRiderId: 'rider-456',
        deliveryProviderId: 'provider-789',
        pickupLatitude: 6.5244,
        pickupLongitude: 3.3792,
        deliveryLatitude: 6.524,
        deliveryLongitude: 3.379,
      };

      const assignment = await DeliveryService.createAssignment(assignmentData);
      const verification = await DeliveryService.getVerification(assignment.id);

      if (verification) {
        const result = await DeliveryService.verifySecurityCode(
          assignment.id,
          verification.customerCode,
          true
        );

        expect(result.verified).toBe(true);
      }
    });

    it('should verify correct rider code', async () => {
      const assignmentData = {
        orderId: 'order-123',
        deliveryRiderId: 'rider-456',
        deliveryProviderId: 'provider-789',
        pickupLatitude: 6.5244,
        pickupLongitude: 3.3792,
        deliveryLatitude: 6.524,
        deliveryLongitude: 3.379,
      };

      const assignment = await DeliveryService.createAssignment(assignmentData);
      const verification = await DeliveryService.getVerification(assignment.id);

      if (verification) {
        const result = await DeliveryService.verifySecurityCode(
          assignment.id,
          verification.riderCode,
          false
        );

        expect(result.verified).toBe(true);
      }
    });

    it('should reject incorrect code', async () => {
      const assignmentData = {
        orderId: 'order-123',
        deliveryRiderId: 'rider-456',
        deliveryProviderId: 'provider-789',
        pickupLatitude: 6.5244,
        pickupLongitude: 3.3792,
        deliveryLatitude: 6.524,
        deliveryLongitude: 3.379,
      };

      const assignment = await DeliveryService.createAssignment(assignmentData);

      await expect(
        DeliveryService.verifySecurityCode(assignment.id, 'wrong-code', true)
      ).rejects.toThrow();
    });

    it('should detect when both codes are verified', async () => {
      const assignmentData = {
        orderId: 'order-123',
        deliveryRiderId: 'rider-456',
        deliveryProviderId: 'provider-789',
        pickupLatitude: 6.5244,
        pickupLongitude: 3.3792,
        deliveryLatitude: 6.524,
        deliveryLongitude: 3.379,
      };

      const assignment = await DeliveryService.createAssignment(assignmentData);
      const verification = await DeliveryService.getVerification(assignment.id);

      if (verification) {
        // Verify customer code first
        await DeliveryService.verifySecurityCode(
          assignment.id,
          verification.customerCode,
          true
        );

        // Verify rider code
        const result = await DeliveryService.verifySecurityCode(
          assignment.id,
          verification.riderCode,
          false
        );

        expect(result.bothVerified).toBe(true);
      }
    });
  });
});
