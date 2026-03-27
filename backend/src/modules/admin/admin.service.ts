import { getFirestore } from "../../config/firebase.js";
import logger from "../../utils/logger.js";
import {
  Pharmacy,
  DeliveryProvider,
  FlaggedAlert,
  Order,
  ApprovalStatus,
  FlagAction,
} from "@pharmaconnect/shared/dist/types/index.js";
import { FIRESTORE_COLLECTIONS } from "@pharmaconnect/shared/dist/constants/index.js";

/**
 * Admin Service
 * Admin operations and dashboard functions
 */
export class AdminService {
  /**
   * Get pending pharmacies for approval
   */
  static async getPendingPharmacies(): Promise<Pharmacy[]> {
    try {
      const db = getFirestore();
      const snapshot = await db
        .collection(FIRESTORE_COLLECTIONS.PHARMACIES)
        .where("approvalStatus", "==", ApprovalStatus.PENDING)
        .orderBy("createdAt", "desc")
        .get();

      return snapshot.docs.map((doc) => doc.data() as Pharmacy);
    } catch (error) {
      logger.error("Failed to get pending pharmacies:", error);
      throw error;
    }
  }

  /**
   * Approve pharmacy
   */
  static async approvePharmacy(id: string): Promise<Pharmacy> {
    try {
      const db = getFirestore();
      await db
        .collection(FIRESTORE_COLLECTIONS.PHARMACIES)
        .doc(id)
        .update({
          approvalStatus: ApprovalStatus.APPROVED,
          updatedAt: new Date(),
        });

      const doc = await db
        .collection(FIRESTORE_COLLECTIONS.PHARMACIES)
        .doc(id)
        .get();

      logger.info(`Pharmacy approved: ${id}`);
      return doc.data() as Pharmacy;
    } catch (error) {
      logger.error(`Failed to approve pharmacy ${id}:`, error);
      throw error;
    }
  }

  /**
   * Reject pharmacy
   */
  static async rejectPharmacy(id: string, reason?: string): Promise<Pharmacy> {
    try {
      const db = getFirestore();
      const updateData: any = {
        approvalStatus: ApprovalStatus.REJECTED,
        updatedAt: new Date(),
      };

      if (reason) {
        updateData.rejectionReason = reason;
      }

      await db
        .collection(FIRESTORE_COLLECTIONS.PHARMACIES)
        .doc(id)
        .update(updateData);

      const doc = await db
        .collection(FIRESTORE_COLLECTIONS.PHARMACIES)
        .doc(id)
        .get();

      logger.info(`Pharmacy rejected: ${id}`);
      return doc.data() as Pharmacy;
    } catch (error) {
      logger.error(`Failed to reject pharmacy ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get pending delivery providers
   */
  static async getPendingDeliveryProviders(): Promise<DeliveryProvider[]> {
    try {
      const db = getFirestore();
      const snapshot = await db
        .collection(FIRESTORE_COLLECTIONS.DELIVERY_PROVIDERS)
        .where("approvalStatus", "==", ApprovalStatus.PENDING)
        .orderBy("createdAt", "desc")
        .get();

      return snapshot.docs.map((doc) => doc.data() as DeliveryProvider);
    } catch (error) {
      logger.error("Failed to get pending delivery providers:", error);
      throw error;
    }
  }

  /**
   * Approve delivery provider
   */
  static async approveProvider(id: string): Promise<DeliveryProvider> {
    try {
      const db = getFirestore();
      await db
        .collection(FIRESTORE_COLLECTIONS.DELIVERY_PROVIDERS)
        .doc(id)
        .update({
          approvalStatus: ApprovalStatus.APPROVED,
          updatedAt: new Date(),
        });

      const doc = await db
        .collection(FIRESTORE_COLLECTIONS.DELIVERY_PROVIDERS)
        .doc(id)
        .get();

      logger.info(`Delivery provider approved: ${id}`);
      return doc.data() as DeliveryProvider;
    } catch (error) {
      logger.error(`Failed to approve provider ${id}:`, error);
      throw error;
    }
  }

  /**
   * Reject delivery provider
   */
  static async rejectProvider(id: string, reason?: string): Promise<DeliveryProvider> {
    try {
      const db = getFirestore();
      const updateData: any = {
        approvalStatus: ApprovalStatus.REJECTED,
        updatedAt: new Date(),
      };

      if (reason) {
        updateData.rejectionReason = reason;
      }

      await db
        .collection(FIRESTORE_COLLECTIONS.DELIVERY_PROVIDERS)
        .doc(id)
        .update(updateData);

      const doc = await db
        .collection(FIRESTORE_COLLECTIONS.DELIVERY_PROVIDERS)
        .doc(id)
        .get();

      logger.info(`Delivery provider rejected: ${id}`);
      return doc.data() as DeliveryProvider;
    } catch (error) {
      logger.error(`Failed to reject provider ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get flagged alerts with pagination
   */
  static async getFlaggedAlerts(
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    alerts: FlaggedAlert[];
    total: number;
  }> {
    try {
      const db = getFirestore();

      // Get total count of flagged alerts
      const countSnapshot = await db
        .collection(FIRESTORE_COLLECTIONS.FLAGGED_ALERTS)
        .where("action", "==", FlagAction.DISMISSED)
        .get();

      const total = countSnapshot.size;

      // Get paginated results
      const snapshot = await db
        .collection(FIRESTORE_COLLECTIONS.FLAGGED_ALERTS)
        .where("action", "==", FlagAction.DISMISSED)
        .orderBy("createdAt", "desc")
        .limit(limit + offset)
        .get();

      const alerts = snapshot.docs
        .slice(offset)
        .slice(0, limit)
        .map((doc) => doc.data() as FlaggedAlert);

      return {
        alerts,
        total,
      };
    } catch (error) {
      logger.error("Failed to get flagged alerts:", error);
      throw error;
    }
  }

  /**
   * Review flagged alert
   */
  static async reviewAlert(
    alertId: string,
    action: FlagAction,
    adminId: string,
    notes?: string
  ): Promise<FlaggedAlert> {
    try {
      const db = getFirestore();
      const updateData: any = {
        action,
        actionTakenBy: adminId,
        updatedAt: new Date(),
      };

      if (notes) {
        updateData.actionNotes = notes;
      }

      await db
        .collection(FIRESTORE_COLLECTIONS.FLAGGED_ALERTS)
        .doc(alertId)
        .update(updateData);

      const doc = await db
        .collection(FIRESTORE_COLLECTIONS.FLAGGED_ALERTS)
        .doc(alertId)
        .get();

      logger.info(`Alert reviewed: ${alertId} -> ${action}`);
      return doc.data() as FlaggedAlert;
    } catch (error) {
      logger.error(`Failed to review alert ${alertId}:`, error);
      throw error;
    }
  }

  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(): Promise<{
    totalPharmacies: number;
    approvedPharmacies: number;
    pendingPharmacies: number;
    totalDeliveryProviders: number;
    approvedProviders: number;
    pendingProviders: number;
    totalOrders: number;
    totalRevenue: number;
    flaggedAlerts: number;
  }> {
    try {
      const db = getFirestore();

      // Get pharmacy stats
      const pharmaciesSnapshot = await db
        .collection(FIRESTORE_COLLECTIONS.PHARMACIES)
        .get();
      const pharmacies = pharmaciesSnapshot.docs.map((d) => d.data() as Pharmacy);

      // Get delivery provider stats
      const providersSnapshot = await db
        .collection(FIRESTORE_COLLECTIONS.DELIVERY_PROVIDERS)
        .get();
      const providers = providersSnapshot.docs.map((d) => d.data() as DeliveryProvider);

      // Get order stats
      const ordersSnapshot = await db.collection(FIRESTORE_COLLECTIONS.ORDERS).get();
      const orders = ordersSnapshot.docs.map((d) => d.data() as Order);
      const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

      // Get flagged alerts
      const alertsSnapshot = await db
        .collection(FIRESTORE_COLLECTIONS.FLAGGED_ALERTS)
        .where("action", "==", FlagAction.DISMISSED)
        .get();

      return {
        totalPharmacies: pharmacies.length,
        approvedPharmacies: pharmacies.filter((p) => p.approvalStatus === ApprovalStatus.APPROVED)
          .length,
        pendingPharmacies: pharmacies.filter((p) => p.approvalStatus === ApprovalStatus.PENDING)
          .length,
        totalDeliveryProviders: providers.length,
        approvedProviders: providers.filter((p) => p.approvalStatus === ApprovalStatus.APPROVED)
          .length,
        pendingProviders: providers.filter((p) => p.approvalStatus === ApprovalStatus.PENDING)
          .length,
        totalOrders: orders.length,
        totalRevenue,
        flaggedAlerts: alertsSnapshot.size,
      };
    } catch (error) {
      logger.error("Failed to get dashboard stats:", error);
      throw error;
    }
  }

  /**
   * Get all transactions
   */
  static async getAllTransactions(limit: number = 100): Promise<Order[]> {
    try {
      const db = getFirestore();
      const snapshot = await db
        .collection(FIRESTORE_COLLECTIONS.ORDERS)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => doc.data() as Order);
    } catch (error) {
      logger.error("Failed to get transactions:", error);
      throw error;
    }
  }
}
