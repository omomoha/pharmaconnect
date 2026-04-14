import { getFirestore } from "../../config/firebase.js";
import logger from "../../utils/logger.js";
import { calculateDistanceKm, generateSecurityCode, formatCurrency } from "../../utils/helpers.js";
import {
  DeliveryProvider,
  DeliveryAssignment,
  DeliveryVerification,
  DeliveryAssignmentStatus,
  AvailableDeliveryProvider,
  ApprovalStatus,
} from "@pharmaconnect/shared/dist/types/index.js";
import { FIRESTORE_COLLECTIONS, DELIVERY } from "@pharmaconnect/shared/dist/constants/index.js";
import { v4 as uuid } from "uuid";

/**
 * Delivery Service
 */
export class DeliveryService {
  /**
   * Register delivery provider
   */
  static async registerProvider(
    userId: string,
    data: {
      businessName: string;
      email: string;
      phoneNumber: string;
      address: string;
      cacNumber: string;
      cacDocUrl: string;
      ownerName: string;
      ownerIdDocUrl: string;
      vehicleDocUrl: string;
      baseFee: number;
      perKmFee: number;
      discount?: number; // percentage discount on delivery fee (0-100)
    }
  ): Promise<DeliveryProvider> {
    try {
      const db = getFirestore();
      const id = uuid();
      const now = new Date();

      const provider: DeliveryProvider = {
        id,
        userId,
        businessName: data.businessName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        address: data.address,
        cacNumber: data.cacNumber,
        cacDocUrl: data.cacDocUrl,
        ownerName: data.ownerName,
        ownerIdDocUrl: data.ownerIdDocUrl,
        vehicleDocUrl: data.vehicleDocUrl,
        baseFee: data.baseFee,
        perKmFee: data.perKmFee,
        ...(data.discount !== undefined && data.discount > 0 ? { discount: data.discount } : {}),
        approvalStatus: ApprovalStatus.PENDING,
        isActive: true,
        rating: 0,
        totalReviews: 0,
        createdAt: now,
        updatedAt: now,
      };

      await db
        .collection(FIRESTORE_COLLECTIONS.DELIVERY_PROVIDERS)
        .doc(id)
        .set(provider);

      logger.info(`Delivery provider registered: ${id}`);
      return provider;
    } catch (error) {
      logger.error("Failed to register delivery provider:", error);
      throw error;
    }
  }

  /**
   * Update delivery provider details (fees, discount, etc.)
   */
  static async updateProvider(
    providerId: string,
    data: Partial<Pick<DeliveryProvider, 'baseFee' | 'perKmFee' | 'discount' | 'businessName' | 'phoneNumber' | 'address' | 'email'>>
  ): Promise<DeliveryProvider> {
    try {
      const db = getFirestore();
      const updateData: any = {
        ...data,
        updatedAt: new Date(),
      };

      // If discount is explicitly set to 0 or undefined, remove it
      if (data.discount === 0 || data.discount === undefined) {
        delete updateData.discount;
      }

      await db
        .collection(FIRESTORE_COLLECTIONS.DELIVERY_PROVIDERS)
        .doc(providerId)
        .update(updateData);

      const updated = await this.getProvider(providerId);
      if (!updated) {
        throw new Error("Provider not found after update");
      }

      logger.info(`Delivery provider updated: ${providerId}`);
      return updated;
    } catch (error) {
      logger.error(`Failed to update delivery provider ${providerId}:`, error);
      throw error;
    }
  }

  /**
   * Get available delivery providers for a delivery route
   */
  static async getAvailableProviders(
    pharmacyLat: number,
    pharmacyLng: number,
    customerLat: number,
    customerLng: number
  ): Promise<AvailableDeliveryProvider[]> {
    try {
      const db = getFirestore();
      const distance = calculateDistanceKm(
        pharmacyLat,
        pharmacyLng,
        customerLat,
        customerLng
      );

      // Get all approved and active providers
      const snapshot = await db
        .collection(FIRESTORE_COLLECTIONS.DELIVERY_PROVIDERS)
        .where("approvalStatus", "==", ApprovalStatus.APPROVED)
        .where("isActive", "==", true)
        .get();

      const providers: AvailableDeliveryProvider[] = snapshot.docs.map((doc) => {
        const provider = doc.data() as DeliveryProvider;
        const rawFee = formatCurrency(
          provider.baseFee + distance * provider.perKmFee
        );
        const estimatedDuration = Math.ceil(distance * 5); // ~5 min per km estimate

        // Apply discount if the provider has set one
        const hasDiscount = provider.discount && provider.discount > 0;
        const estimatedFee = hasDiscount
          ? formatCurrency(rawFee * (1 - provider.discount! / 100))
          : rawFee;

        return {
          id: provider.id,
          businessName: provider.businessName,
          baseFee: provider.baseFee,
          perKmFee: provider.perKmFee,
          ...(hasDiscount ? { discount: provider.discount, originalFee: rawFee } : {}),
          estimatedFee,
          estimatedDuration,
          rating: provider.rating,
          totalReviews: provider.totalReviews,
          distance,
        };
      });

      // Sort by rating (highest first), then by fee (lowest first)
      providers.sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return a.estimatedFee - b.estimatedFee;
      });

      return providers;
    } catch (error) {
      logger.error("Failed to get available providers:", error);
      throw error;
    }
  }

  /**
   * Create delivery assignment
   */
  static async createAssignment(data: {
    orderId: string;
    deliveryRiderId: string;
    deliveryProviderId: string;
    pickupLatitude: number;
    pickupLongitude: number;
    deliveryLatitude: number;
    deliveryLongitude: number;
  }): Promise<DeliveryAssignment> {
    try {
      const db = getFirestore();
      const id = uuid();
      const now = new Date();

      const distance = calculateDistanceKm(
        data.pickupLatitude,
        data.pickupLongitude,
        data.deliveryLatitude,
        data.deliveryLongitude
      );

      const assignment: DeliveryAssignment = {
        id,
        orderId: data.orderId,
        deliveryRiderId: data.deliveryRiderId,
        deliveryProviderId: data.deliveryProviderId,
        status: DeliveryAssignmentStatus.PENDING,
        pickupLatitude: data.pickupLatitude,
        pickupLongitude: data.pickupLongitude,
        deliveryLatitude: data.deliveryLatitude,
        deliveryLongitude: data.deliveryLongitude,
        estimatedDuration: Math.ceil(distance * 5),
        actualDistance: distance,
        createdAt: now,
        updatedAt: now,
      };

      await db
        .collection(FIRESTORE_COLLECTIONS.DELIVERY_ASSIGNMENTS)
        .doc(id)
        .set(assignment);

      // Create verification codes
      const verificationId = uuid();
      const verification: DeliveryVerification = {
        id: verificationId,
        deliveryAssignmentId: id,
        customerCode: generateSecurityCode(),
        riderCode: generateSecurityCode(),
        codeExpiryAt: new Date(Date.now() + DELIVERY.SECURITY_CODE_EXPIRY_HOURS * 60 * 60 * 1000),
        createdAt: now,
        updatedAt: now,
      };

      await db
        .collection(FIRESTORE_COLLECTIONS.DELIVERY_VERIFICATIONS)
        .doc(verificationId)
        .set(verification);

      logger.info(`Delivery assignment created: ${id}`);
      return assignment;
    } catch (error) {
      logger.error("Failed to create delivery assignment:", error);
      throw error;
    }
  }

  /**
   * Get delivery assignment
   */
  static async getAssignment(id: string): Promise<DeliveryAssignment | null> {
    try {
      const db = getFirestore();
      const doc = await db
        .collection(FIRESTORE_COLLECTIONS.DELIVERY_ASSIGNMENTS)
        .doc(id)
        .get();

      if (!doc.exists) {
        return null;
      }

      return doc.data() as DeliveryAssignment;
    } catch (error) {
      logger.error(`Failed to get delivery assignment ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get verification codes for assignment
   */
  static async getVerification(
    assignmentId: string
  ): Promise<DeliveryVerification | null> {
    try {
      const db = getFirestore();
      const snapshot = await db
        .collection(FIRESTORE_COLLECTIONS.DELIVERY_VERIFICATIONS)
        .where("deliveryAssignmentId", "==", assignmentId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      return snapshot.docs[0].data() as DeliveryVerification;
    } catch (error) {
      logger.error(`Failed to get verification for assignment ${assignmentId}:`, error);
      throw error;
    }
  }

  /**
   * Update assignment status
   */
  static async updateAssignmentStatus(
    id: string,
    status: DeliveryAssignmentStatus
  ): Promise<DeliveryAssignment> {
    try {
      const db = getFirestore();
      const updateData: any = {
        status,
        updatedAt: new Date(),
      };

      // Set status-specific timestamps
      if (status === DeliveryAssignmentStatus.ACCEPTED) {
        updateData.acceptedAt = new Date();
      } else if (status === DeliveryAssignmentStatus.PICKED_UP) {
        updateData.pickedUpAt = new Date();
      } else if (status === DeliveryAssignmentStatus.ARRIVED) {
        updateData.arrivingAt = new Date();
      } else if (status === DeliveryAssignmentStatus.DELIVERED) {
        updateData.deliveredAt = new Date();
      } else if (status === DeliveryAssignmentStatus.CANCELLED) {
        updateData.cancelledAt = new Date();
      }

      await db
        .collection(FIRESTORE_COLLECTIONS.DELIVERY_ASSIGNMENTS)
        .doc(id)
        .update(updateData);

      const updated = await this.getAssignment(id);
      if (!updated) {
        throw new Error("Assignment not found after update");
      }

      logger.info(`Assignment status updated: ${id} -> ${status}`);
      return updated;
    } catch (error) {
      logger.error(`Failed to update assignment status for ${id}:`, error);
      throw error;
    }
  }

  /**
   * Verify security code
   */
  static async verifySecurityCode(
    assignmentId: string,
    code: string,
    isCustomer: boolean
  ): Promise<{ verified: boolean; bothVerified: boolean }> {
    try {
      const db = getFirestore();
      const verification = await this.getVerification(assignmentId);

      if (!verification) {
        throw new Error("Verification not found");
      }

      // Check expiry
      if (new Date() > verification.codeExpiryAt) {
        throw new Error("Code has expired");
      }

      // Check code
      const expectedCode = isCustomer
        ? verification.customerCode
        : verification.riderCode;

      if (code !== expectedCode) {
        throw new Error("Invalid code");
      }

      // Mark as verified
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (isCustomer) {
        updateData.customerVerifiedAt = new Date();
      } else {
        updateData.riderVerifiedAt = new Date();
      }

      // Check if both verified
      let bothVerified = false;
      if (isCustomer && verification.riderVerifiedAt) {
        bothVerified = true;
        updateData.bothVerifiedAt = new Date();
      } else if (!isCustomer && verification.customerVerifiedAt) {
        bothVerified = true;
        updateData.bothVerifiedAt = new Date();
      }

      await db
        .collection(FIRESTORE_COLLECTIONS.DELIVERY_VERIFICATIONS)
        .doc(verification.id)
        .update(updateData);

      logger.info(`Security code verified for assignment ${assignmentId}`);
      return { verified: true, bothVerified };
    } catch (error) {
      logger.error(`Failed to verify security code for ${assignmentId}:`, error);
      throw error;
    }
  }

  /**
   * Get delivery assignments for a user (rider/provider)
   * Returns all assignments where the user is the delivery provider owner
   */
  static async getMyDeliveries(
    userId: string,
    status?: string,
    limit: number = 50
  ): Promise<DeliveryAssignment[]> {
    try {
      const db = getFirestore();

      // First find the provider linked to this user
      const providerSnapshot = await db
        .collection(FIRESTORE_COLLECTIONS.DELIVERY_PROVIDERS)
        .where("userId", "==", userId)
        .limit(1)
        .get();

      if (providerSnapshot.empty) {
        return [];
      }

      const providerId = providerSnapshot.docs[0].id;

      // Query assignments for this provider
      let query = db
        .collection(FIRESTORE_COLLECTIONS.DELIVERY_ASSIGNMENTS)
        .where("deliveryProviderId", "==", providerId)
        .orderBy("createdAt", "desc")
        .limit(limit);

      if (status) {
        query = db
          .collection(FIRESTORE_COLLECTIONS.DELIVERY_ASSIGNMENTS)
          .where("deliveryProviderId", "==", providerId)
          .where("status", "==", status)
          .orderBy("createdAt", "desc")
          .limit(limit);
      }

      const snapshot = await query.get();
      return snapshot.docs.map((doc) => doc.data() as DeliveryAssignment);
    } catch (error) {
      logger.error(`Failed to get deliveries for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get available delivery orders (orders ready for pickup without assignment)
   */
  static async getAvailableOrders(
    _userId: string,
    limit: number = 50
  ): Promise<Record<string, unknown>[]> {
    try {
      const db = getFirestore();

      // Find orders that are ready_for_pickup and don't yet have a delivery assignment
      const ordersSnapshot = await db
        .collection(FIRESTORE_COLLECTIONS.ORDERS)
        .where("status", "==", "ready_for_pickup")
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

      if (ordersSnapshot.empty) {
        return [];
      }

      const orders = ordersSnapshot.docs.map((doc) => doc.data());

      // Enrich with pharmacy info
      const pharmacyIds = [...new Set(orders.map((o: any) => o.pharmacyId).filter(Boolean))];
      const pharmacyMap = new Map<string, any>();

      for (const pid of pharmacyIds) {
        const pharmacyDoc = await db
          .collection(FIRESTORE_COLLECTIONS.PHARMACIES)
          .doc(pid)
          .get();
        if (pharmacyDoc.exists) {
          pharmacyMap.set(pid, pharmacyDoc.data());
        }
      }

      return orders.map((order: any) => {
        const pharmacy = pharmacyMap.get(order.pharmacyId);
        return {
          ...order,
          pharmacyName: pharmacy?.name || "Unknown Pharmacy",
          pharmacyAddress: pharmacy?.address || "",
          pharmacyLatitude: pharmacy?.latitude || 0,
          pharmacyLongitude: pharmacy?.longitude || 0,
        };
      });
    } catch (error) {
      logger.error(`Failed to get available orders:`, error);
      throw error;
    }
  }

  /**
   * Get provider by ID
   */
  static async getProvider(id: string): Promise<DeliveryProvider | null> {
    try {
      const db = getFirestore();
      const doc = await db
        .collection(FIRESTORE_COLLECTIONS.DELIVERY_PROVIDERS)
        .doc(id)
        .get();

      if (!doc.exists) {
        return null;
      }

      return doc.data() as DeliveryProvider;
    } catch (error) {
      logger.error(`Failed to get provider ${id}:`, error);
      throw error;
    }
  }
}
