import { getAuth, getFirestore } from "../../config/firebase.js";
import { getRedis } from "../../config/redis.js";
import logger from "../../utils/logger.js";
import { User, UserRole, ApprovalStatus } from "@pharmaconnect/shared/dist/types/index.js";
import { FIRESTORE_COLLECTIONS } from "@pharmaconnect/shared/dist/constants/index.js";

/**
 * Auth Service
 * Works with Firebase Auth and Firestore for user management
 */
export class AuthService {
  /**
   * Set custom claims on Firebase user (e.g., role)
   */
  static async setCustomClaims(uid: string, role: UserRole): Promise<void> {
    try {
      const auth = getAuth();
      await auth.setCustomUserClaims(uid, { role });
      logger.info(`Custom claims set for user ${uid}`, { role });
    } catch (error) {
      logger.error(`Failed to set custom claims for user ${uid}:`, error);
      throw error;
    }
  }

  /**
   * Create user profile in Firestore after Firebase signup
   * Called after user signs up via Firebase Client SDK
   */
  static async createUserProfile(
    uid: string,
    data: {
      email: string;
      phoneNumber: string;
      firstName: string;
      lastName: string;
      role: UserRole;
    }
  ): Promise<User> {
    try {
      const db = getFirestore();
      const now = new Date();

      const userProfile: User = {
        id: uid,
        email: data.email,
        phoneNumber: data.phoneNumber,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        approvalStatus: ApprovalStatus.PENDING,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      await db.collection(FIRESTORE_COLLECTIONS.USERS).doc(uid).set(userProfile);

      // Set custom claims
      await this.setCustomClaims(uid, data.role);

      logger.info(`User profile created for ${uid}`);
      return userProfile;
    } catch (error) {
      logger.error(`Failed to create user profile for ${uid}:`, error);
      throw error;
    }
  }

  /**
   * Get user profile from Firestore
   */
  static async getUserProfile(uid: string): Promise<User | null> {
    try {
      const db = getFirestore();
      const doc = await db
        .collection(FIRESTORE_COLLECTIONS.USERS)
        .doc(uid)
        .get();

      if (!doc.exists) {
        return null;
      }

      return doc.data() as User;
    } catch (error) {
      logger.error(`Failed to get user profile for ${uid}:`, error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(
    uid: string,
    data: Partial<User>
  ): Promise<User> {
    try {
      const db = getFirestore();
      const updateData = {
        ...data,
        updatedAt: new Date(),
      };

      await db
        .collection(FIRESTORE_COLLECTIONS.USERS)
        .doc(uid)
        .update(updateData);

      const updated = await this.getUserProfile(uid);
      if (!updated) {
        throw new Error("User profile not found after update");
      }

      logger.info(`User profile updated for ${uid}`);
      return updated;
    } catch (error) {
      logger.error(`Failed to update user profile for ${uid}:`, error);
      throw error;
    }
  }

  /**
   * Check if email exists
   */
  static async emailExists(email: string): Promise<boolean> {
    try {
      const db = getFirestore();
      const snapshot = await db
        .collection(FIRESTORE_COLLECTIONS.USERS)
        .where("email", "==", email)
        .limit(1)
        .get();

      return !snapshot.empty;
    } catch (error) {
      logger.error(`Failed to check if email exists:`, error);
      throw error;
    }
  }

  /**
   * Check if phone number exists
   */
  static async phoneExists(phoneNumber: string): Promise<boolean> {
    try {
      const db = getFirestore();
      const snapshot = await db
        .collection(FIRESTORE_COLLECTIONS.USERS)
        .where("phoneNumber", "==", phoneNumber)
        .limit(1)
        .get();

      return !snapshot.empty;
    } catch (error) {
      logger.error(`Failed to check if phone exists:`, error);
      throw error;
    }
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const db = getFirestore();
      const snapshot = await db
        .collection(FIRESTORE_COLLECTIONS.USERS)
        .where("email", "==", email)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      return snapshot.docs[0].data() as User;
    } catch (error) {
      logger.error(`Failed to get user by email:`, error);
      throw error;
    }
  }

  /**
   * Disable user account
   */
  static async disableUser(uid: string): Promise<void> {
    try {
      const auth = getAuth();
      await auth.updateUser(uid, { disabled: true });

      const db = getFirestore();
      await db
        .collection(FIRESTORE_COLLECTIONS.USERS)
        .doc(uid)
        .update({
          isActive: false,
          updatedAt: new Date(),
        });

      logger.info(`User ${uid} disabled`);
    } catch (error) {
      logger.error(`Failed to disable user ${uid}:`, error);
      throw error;
    }
  }

  /**
   * Enable user account
   */
  static async enableUser(uid: string): Promise<void> {
    try {
      const auth = getAuth();
      await auth.updateUser(uid, { disabled: false });

      const db = getFirestore();
      await db
        .collection(FIRESTORE_COLLECTIONS.USERS)
        .doc(uid)
        .update({
          isActive: true,
          updatedAt: new Date(),
        });

      logger.info(`User ${uid} enabled`);
    } catch (error) {
      logger.error(`Failed to enable user ${uid}:`, error);
      throw error;
    }
  }

  /**
   * Clear cached user profile
   */
  static async clearUserCache(uid: string): Promise<void> {
    try {
      const redis = getRedis();
      await redis.del(`user:${uid}`);
      logger.info(`Cache cleared for user ${uid}`);
    } catch (error) {
      logger.warn(`Failed to clear user cache for ${uid}:`, error);
    }
  }
}
