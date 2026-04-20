import { getFirestore } from "../../config/firebase.js";
import { getAuth } from "firebase-admin/auth";
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
   * Get all users/profiles
   */
  static async getAllUsers(limit: number = 200): Promise<any[]> {
    try {
      const db = getFirestore();
      const snapshot = await db
        .collection(FIRESTORE_COLLECTIONS.USERS)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      logger.error("Failed to get all users:", error);
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

  /**
   * Get all orders with optional status filter
   */
  static async getAllOrders(
    status?: string,
    limit: number = 100
  ): Promise<Order[]> {
    try {
      const db = getFirestore();
      let query = db
        .collection(FIRESTORE_COLLECTIONS.ORDERS)
        .orderBy("createdAt", "desc")
        .limit(limit);

      if (status) {
        query = db
          .collection(FIRESTORE_COLLECTIONS.ORDERS)
          .where("status", "==", status)
          .orderBy("createdAt", "desc")
          .limit(limit);
      }

      const snapshot = await query.get();
      return snapshot.docs.map((doc) => doc.data() as Order);
    } catch (error) {
      logger.error("Failed to get all orders:", error);
      throw error;
    }
  }

  /**
   * Get analytics with date-range filtering, time-series data, and top performers
   */
  static async getAnalytics(period: string = "month"): Promise<{
    revenue: number;
    commission: number;
    activeUsers: number;
    newRegistrations: number;
    revenueChartData: { label: string; value: number }[];
    userChartData: { label: string; value: number }[];
    topPharmacies: { name: string; orders: number; revenue: number; rating: number }[];
    topDeliveryProviders: { name: string; deliveries: number; rating: number; earnings: number }[];
    recentActivity: { id: string; description: string; amount: number; time: string }[];
  }> {
    try {
      const db = getFirestore();
      const now = new Date();
      let startDate: Date;

      // Determine date range based on period
      switch (period) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        case "month":
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }

      // Fetch orders within date range
      const ordersSnapshot = await db
        .collection(FIRESTORE_COLLECTIONS.ORDERS)
        .where("createdAt", ">=", startDate)
        .orderBy("createdAt", "desc")
        .get();
      const orders = ordersSnapshot.docs.map((d) => ({ id: d.id, ...d.data() } as any));

      // Revenue and commission
      const revenue = orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
      const commission = revenue * 0.05; // 5% platform commission

      // Fetch users within date range for new registrations
      const usersSnapshot = await db
        .collection(FIRESTORE_COLLECTIONS.USERS)
        .where("createdAt", ">=", startDate)
        .get();
      const newRegistrations = usersSnapshot.size;

      // Active users (all users)
      const allUsersSnapshot = await db.collection(FIRESTORE_COLLECTIONS.USERS).get();
      const activeUsers = allUsersSnapshot.docs.filter((d) => {
        const data = d.data();
        return data.isActive !== false;
      }).length;

      // Build time-series chart data
      const revenueByLabel: Record<string, number> = {};
      const usersByLabel: Record<string, number> = {};

      orders.forEach((order: any) => {
        const date = order.createdAt?.toDate?.() || (order.createdAt?._seconds ? new Date(order.createdAt._seconds * 1000) : new Date());
        let label: string;
        if (period === "today") {
          label = `${date.getHours()}:00`;
        } else if (period === "week") {
          label = date.toLocaleDateString("en-US", { weekday: "short" });
        } else if (period === "year") {
          label = date.toLocaleDateString("en-US", { month: "short" });
        } else {
          label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        }
        revenueByLabel[label] = (revenueByLabel[label] || 0) + (order.total || 0);
      });

      usersSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const date = data.createdAt?.toDate?.() || (data.createdAt?._seconds ? new Date(data.createdAt._seconds * 1000) : new Date());
        let label: string;
        if (period === "today") {
          label = `${date.getHours()}:00`;
        } else if (period === "week") {
          label = date.toLocaleDateString("en-US", { weekday: "short" });
        } else if (period === "year") {
          label = date.toLocaleDateString("en-US", { month: "short" });
        } else {
          label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        }
        usersByLabel[label] = (usersByLabel[label] || 0) + 1;
      });

      const revenueChartData = Object.entries(revenueByLabel).map(([label, value]) => ({ label, value }));
      const userChartData = Object.entries(usersByLabel).map(([label, value]) => ({ label, value }));

      // Top pharmacies by order count and revenue
      const pharmacyStats: Record<string, { name: string; orders: number; revenue: number; rating: number }> = {};
      orders.forEach((order: any) => {
        const pid = order.pharmacyId || "unknown";
        if (!pharmacyStats[pid]) {
          pharmacyStats[pid] = { name: order.pharmacyName || `Pharmacy ${pid.slice(0, 6)}`, orders: 0, revenue: 0, rating: 0 };
        }
        pharmacyStats[pid].orders++;
        pharmacyStats[pid].revenue += order.total || 0;
      });
      const topPharmacies = Object.values(pharmacyStats)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Top delivery providers (from delivery assignments or orders with rider info)
      const providerStats: Record<string, { name: string; deliveries: number; rating: number; earnings: number }> = {};
      orders.forEach((order: any) => {
        if (order.riderId || order.deliveryProviderId) {
          const rid = order.riderId || order.deliveryProviderId || "unknown";
          if (!providerStats[rid]) {
            providerStats[rid] = { name: order.riderName || `Rider ${rid.slice(0, 6)}`, deliveries: 0, rating: 0, earnings: 0 };
          }
          providerStats[rid].deliveries++;
          providerStats[rid].earnings += (order.deliveryFee || 0);
        }
      });
      const topDeliveryProviders = Object.values(providerStats)
        .sort((a, b) => b.deliveries - a.deliveries)
        .slice(0, 5);

      // Recent activity (latest 10 orders)
      const recentActivity = orders.slice(0, 10).map((o: any) => {
        const date = o.createdAt?.toDate?.() || (o.createdAt?._seconds ? new Date(o.createdAt._seconds * 1000) : new Date());
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        let timeStr: string;
        if (diffMins < 60) timeStr = `${diffMins} min ago`;
        else if (diffMins < 1440) timeStr = `${Math.floor(diffMins / 60)} hours ago`;
        else timeStr = `${Math.floor(diffMins / 1440)} days ago`;

        return {
          id: o.id,
          description: `Order from ${o.customerName || "Customer"} at ${o.pharmacyName || "Pharmacy"}`,
          amount: o.total || 0,
          time: timeStr,
        };
      });

      return {
        revenue,
        commission,
        activeUsers,
        newRegistrations,
        revenueChartData,
        userChartData,
        topPharmacies,
        topDeliveryProviders,
        recentActivity,
      };
    } catch (error) {
      logger.error("Failed to get analytics:", error);
      throw error;
    }
  }

  /**
   * Suspend a user account
   */
  static async suspendUser(userId: string, adminId: string): Promise<any> {
    try {
      const db = getFirestore();

      await db.collection(FIRESTORE_COLLECTIONS.USERS).doc(userId).update({
        isActive: false,
        suspendedAt: new Date(),
        suspendedBy: adminId,
        updatedAt: new Date(),
      });

      const doc = await db.collection(FIRESTORE_COLLECTIONS.USERS).doc(userId).get();
      logger.info(`User suspended: ${userId} by admin ${adminId}`);
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      logger.error(`Failed to suspend user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Activate (un-suspend) a user account
   */
  static async activateUser(userId: string, adminId: string): Promise<any> {
    try {
      const db = getFirestore();

      await db.collection(FIRESTORE_COLLECTIONS.USERS).doc(userId).update({
        isActive: true,
        suspendedAt: null,
        suspendedBy: null,
        updatedAt: new Date(),
      });

      const doc = await db.collection(FIRESTORE_COLLECTIONS.USERS).doc(userId).get();
      logger.info(`User activated: ${userId} by admin ${adminId}`);
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      logger.error(`Failed to activate user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Soft delete a user account (mark as deleted, disable auth)
   */
  static async softDeleteUser(userId: string, adminId: string): Promise<any> {
    try {
      const db = getFirestore();
      const auth = getAuth();

      // Disable Firebase Auth user
      await auth.updateUser(userId, { disabled: true });

      // Soft delete in Firestore
      await db.collection(FIRESTORE_COLLECTIONS.USERS).doc(userId).update({
        isActive: false,
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: adminId,
        updatedAt: new Date(),
      });

      const doc = await db.collection(FIRESTORE_COLLECTIONS.USERS).doc(userId).get();
      logger.info(`User soft deleted: ${userId} by admin ${adminId}`);
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      logger.error(`Failed to soft delete user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Hard delete a user account (permanently delete from both Auth and Firestore)
   */
  static async hardDeleteUser(userId: string, adminId: string): Promise<any> {
    try {
      const db = getFirestore();
      const auth = getAuth();

      // Verify user exists in Firestore
      const userDoc = await db.collection(FIRESTORE_COLLECTIONS.USERS).doc(userId).get();
      if (!userDoc.exists) {
        throw new Error(`User ${userId} not found`);
      }

      // Delete Firebase Auth user
      await auth.deleteUser(userId);

      // Delete Firestore user document
      await db.collection(FIRESTORE_COLLECTIONS.USERS).doc(userId).delete();

      logger.info(`User hard deleted: ${userId} by admin ${adminId}`);
      return { id: userId, deleted: true };
    } catch (error) {
      logger.error(`Failed to hard delete user ${userId}:`, error);
      throw error;
    }
  }
}
