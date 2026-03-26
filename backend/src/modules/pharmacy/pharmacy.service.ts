import { getFirestore } from "../../config/firebase.js";
import logger from "../../utils/logger.js";
import { calculateDistanceKm } from "../../utils/helpers.js";
import {
  Pharmacy,
  PharmacyProduct,
  ApprovalStatus,
  OperatingHours,
} from "@pharmaconnect/shared/dist/types/index.js";
import { FIRESTORE_COLLECTIONS } from "@pharmaconnect/shared/dist/constants/index.js";
import { v4 as uuid } from "uuid";

/**
 * Pharmacy Service
 */
export class PharmacyService {
  /**
   * Register new pharmacy
   */
  static async registerPharmacy(
    ownerId: string,
    data: {
      name: string;
      email: string;
      phoneNumber: string;
      address: string;
      latitude: number;
      longitude: number;
      licenseNumber: string;
      licenseDocUrl: string;
      cacNumber: string;
      cacDocUrl: string;
      ownerName: string;
      ownerIdDocUrl: string;
      operatingHours: OperatingHours;
    }
  ): Promise<Pharmacy> {
    try {
      const db = getFirestore();
      const id = uuid();
      const now = new Date();

      const pharmacy: Pharmacy = {
        id,
        userId: ownerId,
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        licenseNumber: data.licenseNumber,
        licenseDocUrl: data.licenseDocUrl,
        cacNumber: data.cacNumber,
        cacDocUrl: data.cacDocUrl,
        ownerName: data.ownerName,
        ownerIdDocUrl: data.ownerIdDocUrl,
        operatingHours: data.operatingHours,
        approvalStatus: ApprovalStatus.PENDING,
        isActive: true,
        rating: 0,
        totalReviews: 0,
        createdAt: now,
        updatedAt: now,
      };

      await db
        .collection(FIRESTORE_COLLECTIONS.PHARMACIES)
        .doc(id)
        .set(pharmacy);

      logger.info(`Pharmacy registered: ${id}`);
      return pharmacy;
    } catch (error) {
      logger.error("Failed to register pharmacy:", error);
      throw error;
    }
  }

  /**
   * Get pharmacy by ID
   */
  static async getPharmacy(id: string): Promise<Pharmacy | null> {
    try {
      const db = getFirestore();
      const doc = await db
        .collection(FIRESTORE_COLLECTIONS.PHARMACIES)
        .doc(id)
        .get();

      if (!doc.exists) {
        return null;
      }

      return doc.data() as Pharmacy;
    } catch (error) {
      logger.error(`Failed to get pharmacy ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get pharmacy by owner ID
   */
  static async getPharmacyByUserId(userId: string): Promise<Pharmacy | null> {
    try {
      const db = getFirestore();
      const snapshot = await db
        .collection(FIRESTORE_COLLECTIONS.PHARMACIES)
        .where("userId", "==", userId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      return snapshot.docs[0].data() as Pharmacy;
    } catch (error) {
      logger.error(`Failed to get pharmacy for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Update pharmacy
   */
  static async updatePharmacy(
    id: string,
    data: Partial<Pharmacy>
  ): Promise<Pharmacy> {
    try {
      const db = getFirestore();
      const updateData = {
        ...data,
        updatedAt: new Date(),
      };

      await db
        .collection(FIRESTORE_COLLECTIONS.PHARMACIES)
        .doc(id)
        .update(updateData);

      const updated = await this.getPharmacy(id);
      if (!updated) {
        throw new Error("Pharmacy not found after update");
      }

      logger.info(`Pharmacy updated: ${id}`);
      return updated;
    } catch (error) {
      logger.error(`Failed to update pharmacy ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get nearby pharmacies within radius
   */
  static async getNearbyPharmacies(
    lat: number,
    lng: number,
    radiusKm: number = 10,
    limit: number = 20
  ): Promise<Pharmacy[]> {
    try {
      const db = getFirestore();

      // Get all approved and active pharmacies
      const snapshot = await db
        .collection(FIRESTORE_COLLECTIONS.PHARMACIES)
        .where("approvalStatus", "==", ApprovalStatus.APPROVED)
        .where("isActive", "==", true)
        .get();

      const pharmacies: Pharmacy[] = [];

      snapshot.forEach((doc) => {
        const pharmacy = doc.data() as Pharmacy;
        const distance = calculateDistanceKm(
          lat,
          lng,
          pharmacy.latitude,
          pharmacy.longitude
        );

        if (distance <= radiusKm) {
          pharmacies.push(pharmacy);
        }
      });

      // Sort by distance and limit
      pharmacies.sort((a, b) => {
        const distA = calculateDistanceKm(
          lat,
          lng,
          a.latitude,
          a.longitude
        );
        const distB = calculateDistanceKm(
          lat,
          lng,
          b.latitude,
          b.longitude
        );
        return distA - distB;
      });

      return pharmacies.slice(0, limit);
    } catch (error) {
      logger.error("Failed to get nearby pharmacies:", error);
      throw error;
    }
  }

  /**
   * Get pharmacy products
   */
  static async getPharmacyProducts(pharmacyId: string): Promise<PharmacyProduct[]> {
    try {
      const db = getFirestore();
      const snapshot = await db
        .collection(FIRESTORE_COLLECTIONS.PHARMACY_PRODUCTS)
        .where("pharmacyId", "==", pharmacyId)
        .where("isActive", "==", true)
        .get();

      return snapshot.docs.map((doc) => doc.data() as PharmacyProduct);
    } catch (error) {
      logger.error(`Failed to get products for pharmacy ${pharmacyId}:`, error);
      throw error;
    }
  }

  /**
   * Add product to pharmacy
   */
  static async addProduct(
    pharmacyId: string,
    data: {
      drugCatalogItemId: string;
      sku: string;
      quantity: number;
      price: number;
      discount?: number;
      expiryDate: Date;
      batchNumber: string;
    }
  ): Promise<PharmacyProduct> {
    try {
      const db = getFirestore();
      const id = uuid();
      const now = new Date();

      const product: PharmacyProduct = {
        id,
        pharmacyId,
        drugCatalogItemId: data.drugCatalogItemId,
        sku: data.sku,
        quantity: data.quantity,
        price: data.price,
        discount: data.discount,
        expiryDate: data.expiryDate,
        batchNumber: data.batchNumber,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      await db
        .collection(FIRESTORE_COLLECTIONS.PHARMACY_PRODUCTS)
        .doc(id)
        .set(product);

      logger.info(`Product added to pharmacy ${pharmacyId}: ${id}`);
      return product;
    } catch (error) {
      logger.error(`Failed to add product to pharmacy ${pharmacyId}:`, error);
      throw error;
    }
  }

  /**
   * Update product
   */
  static async updateProduct(
    productId: string,
    data: Partial<PharmacyProduct>
  ): Promise<PharmacyProduct> {
    try {
      const db = getFirestore();
      const updateData = {
        ...data,
        updatedAt: new Date(),
      };

      await db
        .collection(FIRESTORE_COLLECTIONS.PHARMACY_PRODUCTS)
        .doc(productId)
        .update(updateData);

      const doc = await db
        .collection(FIRESTORE_COLLECTIONS.PHARMACY_PRODUCTS)
        .doc(productId)
        .get();

      if (!doc.exists) {
        throw new Error("Product not found after update");
      }

      logger.info(`Product updated: ${productId}`);
      return doc.data() as PharmacyProduct;
    } catch (error) {
      logger.error(`Failed to update product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Delete product (soft delete)
   */
  static async deleteProduct(productId: string): Promise<void> {
    try {
      const db = getFirestore();
      await db
        .collection(FIRESTORE_COLLECTIONS.PHARMACY_PRODUCTS)
        .doc(productId)
        .update({
          isActive: false,
          updatedAt: new Date(),
        });

      logger.info(`Product deleted: ${productId}`);
    } catch (error) {
      logger.error(`Failed to delete product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Search pharmacies by name
   */
  static async searchPharmacies(query: string): Promise<Pharmacy[]> {
    try {
      const db = getFirestore();
      const snapshot = await db
        .collection(FIRESTORE_COLLECTIONS.PHARMACIES)
        .where("approvalStatus", "==", ApprovalStatus.APPROVED)
        .where("isActive", "==", true)
        .limit(20)
        .get();

      const results = snapshot.docs
        .map((doc) => doc.data() as Pharmacy)
        .filter(
          (pharmacy) =>
            pharmacy.name.toLowerCase().includes(query.toLowerCase()) ||
            pharmacy.address.toLowerCase().includes(query.toLowerCase())
        );

      return results;
    } catch (error) {
      logger.error("Failed to search pharmacies:", error);
      throw error;
    }
  }
}
