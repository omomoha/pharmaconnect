import { Response } from "express";
import { AuthenticatedRequest } from "../../middleware/authenticate.js";
import { apiResponse } from "../../utils/helpers.js";
import logger from "../../utils/logger.js";
import { getAuth, getFirestore } from "../../config/firebase.js";
import { getRedis } from "../../config/redis.js";
import { FIRESTORE_COLLECTIONS } from "@pharmaconnect/shared/dist/constants/index.js";

/**
 * GDPR Controller
 * Handles data deletion and export requests (GDPR compliance)
 */
export class GDPRController {
  /**
   * DELETE /api/v1/auth/me — Account deletion
   * Soft delete user account and anonymize PII
   */
  static async deleteAccount(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(
          apiResponse(false, undefined, {
            code: "UNAUTHORIZED",
            message: "User not authenticated",
          })
        );
        return;
      }

      const uid = req.user.uid;
      const db = getFirestore();
      const auth = getAuth();
      const now = new Date();

      // Start transaction for consistency
      await db.runTransaction(async (transaction) => {
        const userRef = db.collection(FIRESTORE_COLLECTIONS.USERS).doc(uid);
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists) {
          throw new Error("User not found");
        }

        // Soft delete: set deletedAt flag and anonymize email
        const anonymizedEmail = `deleted_${uid}@anonymized.com`;
        transaction.update(userRef, {
          deletedAt: now,
          status: "deleted",
          email: anonymizedEmail,
          phoneNumber: null,
          firstName: "Deleted",
          lastName: "User",
          address: null,
          latitude: null,
          longitude: null,
          profileImageUrl: null,
          isActive: false,
          updatedAt: now,
        });

        // Mark user's orders with deletion flag
        const ordersSnapshot = await db
          .collection(FIRESTORE_COLLECTIONS.ORDERS)
          .where("userId", "==", uid)
          .get();

        ordersSnapshot.docs.forEach((doc) => {
          transaction.update(doc.ref, {
            userDeleted: true,
            updatedAt: now,
          });
        });

        // Mark user's messages with deletion flag
        const messagesSnapshot = await db
          .collection(FIRESTORE_COLLECTIONS.MESSAGES)
          .where("senderId", "==", uid)
          .get();

        messagesSnapshot.docs.forEach((doc) => {
          transaction.update(doc.ref, {
            senderDeleted: true,
            updatedAt: now,
          });
        });

        // Log deletion in audit logs
        const auditRef = db.collection(FIRESTORE_COLLECTIONS.AUDIT_LOGS).doc();
        transaction.set(auditRef, {
          action: "ACCOUNT_DELETION",
          userId: uid,
          timestamp: now,
          ipAddress: req.ip || "unknown",
          userAgent: req.get("user-agent") || "unknown",
        });
      });

      // Disable Firebase user
      try {
        await auth.updateUser(uid, { disabled: true });
      } catch (error) {
        logger.warn(`Could not disable Firebase user ${uid}:`, error);
        // Don't fail the deletion if Firebase update fails
      }

      // Clear user cache
      try {
        const redis = getRedis();
        await redis.del(`user:${uid}`);
      } catch (error) {
        logger.warn(`Could not clear Redis cache for ${uid}:`, error);
      }

      logger.info(`Account deleted for user ${uid}`);

      res.json(
        apiResponse(true, {
          message: "Your account has been successfully deleted. All personal data has been anonymized.",
        })
      );
    } catch (error) {
      logger.error("Account deletion error:", error);
      res.status(500).json(
        apiResponse(false, undefined, {
          code: "DELETION_FAILED",
          message: "Failed to delete account. Please try again later.",
        })
      );
    }
  }

  /**
   * GET /api/v1/auth/me/export — Data export
   * Export all user data as JSON
   * Rate limited: 1 request per hour
   */
  static async exportData(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(
          apiResponse(false, undefined, {
            code: "UNAUTHORIZED",
            message: "User not authenticated",
          })
        );
        return;
      }

      const uid = req.user.uid;
      const db = getFirestore();
      const redis = getRedis();

      // Check rate limit
      const rateLimitKey = `export:${uid}`;
      const lastExport = await redis.get(rateLimitKey);

      if (lastExport) {
        res.status(429).json(
          apiResponse(false, undefined, {
            code: "RATE_LIMIT_EXCEEDED",
            message: "You can export your data once per hour. Please try again later.",
          })
        );
        return;
      }

      // Fetch user data
      const userDoc = await db
        .collection(FIRESTORE_COLLECTIONS.USERS)
        .doc(uid)
        .get();

      if (!userDoc.exists) {
        res.status(404).json(
          apiResponse(false, undefined, {
            code: "USER_NOT_FOUND",
            message: "User profile not found",
          })
        );
        return;
      }

      const userData = userDoc.data();

      // Fetch user's orders
      const ordersSnapshot = await db
        .collection(FIRESTORE_COLLECTIONS.ORDERS)
        .where("userId", "==", uid)
        .get();

      const orders = ordersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Fetch user's conversations (metadata only - no message content)
      const conversationsSnapshot = await db
        .collection(FIRESTORE_COLLECTIONS.CONVERSATIONS)
        .where("participants", "array-contains", uid)
        .get();

      const conversations = conversationsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          participants: data.participants,
          lastMessageAt: data.lastMessageAt,
          createdAt: data.createdAt,
        };
      });

      // Fetch user's notifications
      const notificationsSnapshot = await db
        .collection(FIRESTORE_COLLECTIONS.NOTIFICATIONS)
        .where("userId", "==", uid)
        .get();

      const notifications = notificationsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Compile export data
      const exportData = {
        exportDate: new Date().toISOString(),
        userId: uid,
        profile: userData,
        orders,
        conversations,
        notifications,
      };

      // Set rate limit (1 hour = 3600 seconds)
      await redis.setex(rateLimitKey, 3600, "1");

      // Log the export request
      await db.collection(FIRESTORE_COLLECTIONS.AUDIT_LOGS).add({
        action: "DATA_EXPORT",
        userId: uid,
        timestamp: new Date(),
        ipAddress: req.ip || "unknown",
        userAgent: req.get("user-agent") || "unknown",
      });

      logger.info(`Data exported for user ${uid}`);

      res.json(apiResponse(true, exportData));
    } catch (error) {
      logger.error("Data export error:", error);
      res.status(500).json(
        apiResponse(false, undefined, {
          code: "EXPORT_FAILED",
          message: "Failed to export data. Please try again later.",
        })
      );
    }
  }
}
