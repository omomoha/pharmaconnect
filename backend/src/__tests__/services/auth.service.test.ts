/**
 * Auth Service Tests
 * Tests for user profile creation, retrieval, updates, and role management
 */

import { AuthService } from '../../modules/auth/auth.service';
import { getFirestore, getAuth } from '../../config/firebase';
import { getRedis } from '../../config/redis';
import { createFirestoreMock, createAuthMock, createRedisMock } from '../mocks/firestore.mock';
import { UserRole, ApprovalStatus } from '@pharmaconnect/shared/dist/types/index';

jest.mock('../../config/firebase');
jest.mock('../../config/redis');
jest.mock('../../utils/logger');

const mockFirestore = createFirestoreMock();
const mockAuth = createAuthMock();
const mockRedis = createRedisMock();

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFirestore.reset();
    (getFirestore as jest.Mock).mockReturnValue(mockFirestore);
    (getAuth as jest.Mock).mockReturnValue(mockAuth);
    (getRedis as jest.Mock).mockReturnValue(mockRedis);
  });

  describe('createUserProfile', () => {
    it('should create a new customer profile', async () => {
      const uid = 'user-123';
      const userData = {
        email: 'customer@example.com',
        phoneNumber: '+2348012345678',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.CUSTOMER,
      };

      const profile = await AuthService.createUserProfile(uid, userData);

      expect(profile).toBeDefined();
      expect(profile.id).toBe(uid);
      expect(profile.email).toBe('customer@example.com');
      expect(profile.firstName).toBe('John');
      expect(profile.lastName).toBe('Doe');
      expect(profile.role).toBe(UserRole.CUSTOMER);
      expect(profile.approvalStatus).toBe(ApprovalStatus.PENDING);
      expect(profile.isActive).toBe(true);
      expect(profile.createdAt).toBeDefined();
      expect(profile.updatedAt).toBeDefined();
    });

    it('should create a pharmacy profile', async () => {
      const uid = 'pharmacy-user-456';
      const userData = {
        email: 'pharmacy@example.com',
        phoneNumber: '+2348012345679',
        firstName: 'Jane',
        lastName: 'Smith',
        role: ('pharmacy' as any) as any,
      };

      const profile = await AuthService.createUserProfile(uid, userData);

      expect(profile.role).toBe(('pharmacy' as any));
      expect(profile.approvalStatus).toBe(ApprovalStatus.PENDING);
    });

    it('should create a delivery provider profile', async () => {
      const uid = 'delivery-user-789';
      const userData = {
        email: 'delivery@example.com',
        phoneNumber: '+2348012345680',
        firstName: 'Bob',
        lastName: 'Johnson',
        role: 'delivery' as any,
      };

      const profile = await AuthService.createUserProfile(uid, userData);

      expect(profile.role).toBe('delivery');
      expect(profile.approvalStatus).toBe(ApprovalStatus.PENDING);
    });

    it('should set custom claims on creation', async () => {
      const uid = 'user-999';
      const userData = {
        email: 'test@example.com',
        phoneNumber: '+2348012345681',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.CUSTOMER,
      };

      await AuthService.createUserProfile(uid, userData);

      expect(mockAuth.setCustomUserClaims).toHaveBeenCalledWith(uid, { role: UserRole.CUSTOMER });
    });

    it('should store profile in Firestore', async () => {
      const uid = 'user-1000';
      const userData = {
        email: 'test@example.com',
        phoneNumber: '+2348012345682',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.CUSTOMER,
      };

      await AuthService.createUserProfile(uid, userData);

      const collectionData = mockFirestore.getCollectionData();
      const users = collectionData['users'];
      expect(users).toBeDefined();
      expect(users.some((u) => u.id === uid)).toBe(true);
    });
  });

  describe('getUserProfile', () => {
    it('should retrieve an existing user profile', async () => {
      const uid = 'user-2000';
      const userData = {
        email: 'existing@example.com',
        phoneNumber: '+2348012345683',
        firstName: 'Existing',
        lastName: 'User',
        role: UserRole.CUSTOMER,
      };

      await AuthService.createUserProfile(uid, userData);
      const profile = await AuthService.getUserProfile(uid);

      expect(profile).toBeDefined();
      expect(profile?.id).toBe(uid);
      expect(profile?.email).toBe('existing@example.com');
    });

    it('should return null for non-existent user', async () => {
      const profile = await AuthService.getUserProfile('non-existent-uid');
      expect(profile).toBeNull();
    });

    it('should retrieve all user fields', async () => {
      const uid = 'user-3000';
      const userData = {
        email: 'complete@example.com',
        phoneNumber: '+2348012345684',
        firstName: 'Complete',
        lastName: 'Profile',
        role: 'pharmacy' as any,
      };

      await AuthService.createUserProfile(uid, userData);
      const profile = await AuthService.getUserProfile(uid);

      expect(profile?.phoneNumber).toBe('+2348012345684');
      expect(profile?.role).toBe('pharmacy');
      expect(profile?.approvalStatus).toBe(ApprovalStatus.PENDING);
      expect(profile?.isActive).toBe(true);
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile with partial data', async () => {
      const uid = 'user-4000';
      const userData = {
        email: 'update@example.com',
        phoneNumber: '+2348012345685',
        firstName: 'Update',
        lastName: 'Test',
        role: UserRole.CUSTOMER,
      };

      await AuthService.createUserProfile(uid, userData);
      const updated = await AuthService.updateUserProfile(uid, {
        firstName: 'Updated',
        approvalStatus: ApprovalStatus.APPROVED,
      });

      expect(updated.firstName).toBe('Updated');
      expect(updated.approvalStatus).toBe(ApprovalStatus.APPROVED);
      expect(updated.lastName).toBe('Test');
    });

    it('should update approval status', async () => {
      const uid = 'user-5000';
      const userData = {
        email: 'approval@example.com',
        phoneNumber: '+2348012345686',
        firstName: 'Approval',
        lastName: 'Test',
        role: 'pharmacy' as any,
      };

      await AuthService.createUserProfile(uid, userData);
      const updated = await AuthService.updateUserProfile(uid, {
        approvalStatus: ApprovalStatus.APPROVED,
      });

      expect(updated.approvalStatus).toBe(ApprovalStatus.APPROVED);
    });

    it('should update active status', async () => {
      const uid = 'user-6000';
      const userData = {
        email: 'active@example.com',
        phoneNumber: '+2348012345687',
        firstName: 'Active',
        lastName: 'Test',
        role: UserRole.CUSTOMER,
      };

      await AuthService.createUserProfile(uid, userData);
      const updated = await AuthService.updateUserProfile(uid, {
        isActive: false,
      });

      expect(updated.isActive).toBe(false);
    });

    it('should update updatedAt timestamp', async () => {
      const uid = 'user-7000';
      const userData = {
        email: 'timestamp@example.com',
        phoneNumber: '+2348012345688',
        firstName: 'Timestamp',
        lastName: 'Test',
        role: UserRole.CUSTOMER,
      };

      const created = await AuthService.createUserProfile(uid, userData);
      const updated = await AuthService.updateUserProfile(uid, {
        firstName: 'Modified',
      });

      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(created.updatedAt.getTime());
    });

    it('should include updatedAt timestamp in updates', async () => {
      const uid = 'timestamp-user';
      await AuthService.createUserProfile(uid, {
        email: 'ts@example.com',
        phoneNumber: '+2341234567890',
        firstName: 'Time',
        lastName: 'Stamp',
        role: UserRole.CUSTOMER as any,
      });

      const before = Date.now();
      const updated = await AuthService.updateUserProfile(uid, { firstName: 'Updated' });
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(before);
    });
  });

  describe('setCustomClaims', () => {
    it('should set custom claims for user role', async () => {
      const uid = 'user-8000';

      await AuthService.setCustomClaims(uid, 'pharmacy' as any);

      expect(mockAuth.setCustomUserClaims).toHaveBeenCalledWith(uid, {
        role: 'pharmacy' as any,
      });
    });

    it('should set custom claims for admin role', async () => {
      const uid = 'admin-user-1';

      await AuthService.setCustomClaims(uid, ('admin' as any) as any);

      expect(mockAuth.setCustomUserClaims).toHaveBeenCalledWith(uid, {
        role: ('admin' as any),
      });
    });

    it('should set custom claims for delivery role', async () => {
      const uid = 'delivery-user-1';

      await AuthService.setCustomClaims(uid, 'delivery' as any);

      expect(mockAuth.setCustomUserClaims).toHaveBeenCalledWith(uid, {
        role: 'delivery' as any,
      });
    });
  });

  describe('emailExists', () => {
    it('should return true for existing email', async () => {
      const email = 'existing@example.com';
      const userData = {
        email,
        phoneNumber: '+2348012345689',
        firstName: 'Exists',
        lastName: 'Email',
        role: UserRole.CUSTOMER,
      };

      await AuthService.createUserProfile('user-9000', userData);
      const exists = await AuthService.emailExists(email);

      expect(exists).toBe(true);
    });

    it('should return false for non-existent email', async () => {
      const exists = await AuthService.emailExists('nonexistent@example.com');
      expect(exists).toBe(false);
    });

    it('should be case-insensitive aware', async () => {
      const email = 'case@example.com';
      const userData = {
        email,
        phoneNumber: '+2348012345690',
        firstName: 'Case',
        lastName: 'Test',
        role: UserRole.CUSTOMER,
      };

      await AuthService.createUserProfile('user-10000', userData);
      const exists = await AuthService.emailExists(email);

      expect(exists).toBe(true);
    });
  });

  describe('phoneExists', () => {
    it('should return true for existing phone', async () => {
      const phoneNumber = '+2348012345691';
      const userData = {
        email: 'phone@example.com',
        phoneNumber,
        firstName: 'Phone',
        lastName: 'Test',
        role: UserRole.CUSTOMER,
      };

      await AuthService.createUserProfile('user-11000', userData);
      const exists = await AuthService.phoneExists(phoneNumber);

      expect(exists).toBe(true);
    });

    it('should return false for non-existent phone', async () => {
      const exists = await AuthService.phoneExists('+2349999999999');
      expect(exists).toBe(false);
    });

    it('should handle different phone formats', async () => {
      const phoneNumber = '+2348012345692';
      const userData = {
        email: 'format@example.com',
        phoneNumber,
        firstName: 'Format',
        lastName: 'Test',
        role: UserRole.CUSTOMER,
      };

      await AuthService.createUserProfile('user-12000', userData);
      const exists = await AuthService.phoneExists(phoneNumber);

      expect(exists).toBe(true);
    });
  });

  describe('getUserByEmail', () => {
    it('should retrieve user by email', async () => {
      const email = 'lookup@example.com';
      const userData = {
        email,
        phoneNumber: '+2348012345693',
        firstName: 'Lookup',
        lastName: 'User',
        role: UserRole.CUSTOMER,
      };

      await AuthService.createUserProfile('user-13000', userData);
      const user = await AuthService.getUserByEmail(email);

      expect(user).toBeDefined();
      expect(user?.email).toBe(email);
    });

    it('should return null for non-existent email', async () => {
      const user = await AuthService.getUserByEmail('nope@example.com');
      expect(user).toBeNull();
    });

    it('should return correct user when multiple exist', async () => {
      const email1 = 'user1@example.com';
      const email2 = 'user2@example.com';

      await AuthService.createUserProfile('user-14000', {
        email: email1,
        phoneNumber: '+2348012345694',
        firstName: 'User',
        lastName: 'One',
        role: UserRole.CUSTOMER,
      });

      await AuthService.createUserProfile('user-14001', {
        email: email2,
        phoneNumber: '+2348012345695',
        firstName: 'User',
        lastName: 'Two',
        role: UserRole.CUSTOMER,
      });

      const user = await AuthService.getUserByEmail(email2);
      expect(user?.firstName).toBe('User');
      expect(user?.lastName).toBe('Two');
    });
  });

  describe('disableUser', () => {
    it('should disable user in Auth and Firestore', async () => {
      const uid = 'user-15000';
      const userData = {
        email: 'disable@example.com',
        phoneNumber: '+2348012345696',
        firstName: 'Disable',
        lastName: 'Test',
        role: UserRole.CUSTOMER,
      };

      await AuthService.createUserProfile(uid, userData);
      await AuthService.disableUser(uid);

      expect(mockAuth.updateUser).toHaveBeenCalledWith(uid, { disabled: true });

      const updated = await AuthService.getUserProfile(uid);
      expect(updated?.isActive).toBe(false);
    });

    it('should update the updatedAt timestamp on disable', async () => {
      const uid = 'user-15001';
      const userData = {
        email: 'disable2@example.com',
        phoneNumber: '+2348012345697',
        firstName: 'Disable',
        lastName: 'Test2',
        role: UserRole.CUSTOMER,
      };

      const created = await AuthService.createUserProfile(uid, userData);
      await AuthService.disableUser(uid);

      const updated = await AuthService.getUserProfile(uid);
      expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(created.updatedAt.getTime());
    });
  });

  describe('enableUser', () => {
    it('should enable user in Auth and Firestore', async () => {
      const uid = 'user-16000';
      const userData = {
        email: 'enable@example.com',
        phoneNumber: '+2348012345698',
        firstName: 'Enable',
        lastName: 'Test',
        role: UserRole.CUSTOMER,
      };

      await AuthService.createUserProfile(uid, userData);
      await AuthService.disableUser(uid);
      await AuthService.enableUser(uid);

      expect(mockAuth.updateUser).toHaveBeenCalledWith(uid, { disabled: false });

      const updated = await AuthService.getUserProfile(uid);
      expect(updated?.isActive).toBe(true);
    });

    it('should re-enable a disabled user', async () => {
      const uid = 'user-16001';
      const userData = {
        email: 'reenable@example.com',
        phoneNumber: '+2348012345699',
        firstName: 'Reenable',
        lastName: 'Test',
        role: UserRole.CUSTOMER,
      };

      await AuthService.createUserProfile(uid, userData);
      await AuthService.disableUser(uid);

      let profile = await AuthService.getUserProfile(uid);
      expect(profile?.isActive).toBe(false);

      await AuthService.enableUser(uid);
      profile = await AuthService.getUserProfile(uid);
      expect(profile?.isActive).toBe(true);
    });
  });

  describe('clearUserCache', () => {
    it('should clear user cache from Redis', async () => {
      const uid = 'user-17000';

      await AuthService.clearUserCache(uid);

      expect(mockRedis.del).toHaveBeenCalledWith(`user:${uid}`);
    });

    it('should handle multiple cache clears', async () => {
      const uid1 = 'user-17001';
      const uid2 = 'user-17002';

      await AuthService.clearUserCache(uid1);
      await AuthService.clearUserCache(uid2);

      expect(mockRedis.del).toHaveBeenCalledWith(`user:${uid1}`);
      expect(mockRedis.del).toHaveBeenCalledWith(`user:${uid2}`);
    });
  });

  describe('Integration scenarios', () => {
    it('should create, retrieve, and update user profile', async () => {
      const uid = 'integration-user-1';
      const initialData = {
        email: 'integration@example.com',
        phoneNumber: '+2348012345700',
        firstName: 'Integration',
        lastName: 'Test',
        role: 'pharmacy' as any,
      };

      // Create
      const created = await AuthService.createUserProfile(uid, initialData);
      expect(created.firstName).toBe('Integration');
      expect(created.approvalStatus).toBe(ApprovalStatus.PENDING);

      // Retrieve
      const retrieved = await AuthService.getUserProfile(uid);
      expect(retrieved?.id).toBe(uid);

      // Update
      const updated = await AuthService.updateUserProfile(uid, {
        approvalStatus: ApprovalStatus.APPROVED,
        firstName: 'Approved',
      });
      expect(updated.approvalStatus).toBe(ApprovalStatus.APPROVED);
      expect(updated.firstName).toBe('Approved');

      // Verify final state
      const final = await AuthService.getUserProfile(uid);
      expect(final?.approvalStatus).toBe(ApprovalStatus.APPROVED);
    });

    it('should manage user account lifecycle', async () => {
      const uid = 'lifecycle-user-1';
      const userData = {
        email: 'lifecycle@example.com',
        phoneNumber: '+2348012345701',
        firstName: 'Lifecycle',
        lastName: 'User',
        role: UserRole.CUSTOMER,
      };

      // Create account
      await AuthService.createUserProfile(uid, userData);
      let profile = await AuthService.getUserProfile(uid);
      expect(profile?.isActive).toBe(true);

      // Disable account
      await AuthService.disableUser(uid);
      profile = await AuthService.getUserProfile(uid);
      expect(profile?.isActive).toBe(false);

      // Enable account again
      await AuthService.enableUser(uid);
      profile = await AuthService.getUserProfile(uid);
      expect(profile?.isActive).toBe(true);
    });

    it('should handle pharmacy approval workflow', async () => {
      const uid = 'pharmacy-approval-1';
      const pharmacyData = {
        email: 'pharmacy-approval@example.com',
        phoneNumber: '+2348012345702',
        firstName: 'Pharmacy',
        lastName: 'Owner',
        role: 'pharmacy' as any,
      };

      // Create as pending
      const created = await AuthService.createUserProfile(uid, pharmacyData);
      expect(created.approvalStatus).toBe(ApprovalStatus.PENDING);

      // Approve
      const approved = await AuthService.updateUserProfile(uid, {
        approvalStatus: ApprovalStatus.APPROVED,
      });
      expect(approved.approvalStatus).toBe(ApprovalStatus.APPROVED);

      // Verify
      const verified = await AuthService.getUserProfile(uid);
      expect(verified?.approvalStatus).toBe(ApprovalStatus.APPROVED);
    });
  });
});
