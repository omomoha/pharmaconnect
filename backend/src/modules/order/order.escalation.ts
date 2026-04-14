import { getFirestore } from "../../config/firebase.js";
import logger from "../../utils/logger.js";
import {
  OrderStatus,
  DeliveryAssignmentStatus,
} from "@pharmaconnect/shared/dist/types/index.js";
import { FIRESTORE_COLLECTIONS, DELIVERY } from "@pharmaconnect/shared/dist/constants/index.js";

/**
 * Order Escalation Service
 *
 * Handles timeout and retry logic for orders that get stuck:
 * 1. Pharmacy confirmation timeout — auto-confirms after N minutes if pharmacy doesn't respond
 * 2. Delivery rider retry — re-queues order if no rider accepts within timeout
 *
 * This should be called periodically (e.g., via a Cloud Scheduler / cron trigger
 * hitting a backend endpoint, or a Cloud Functions scheduled function).
 */

// How long (in minutes) before we auto-confirm an order the pharmacy hasn't acknowledged
const PHARMACY_CONFIRM_TIMEOUT_MINUTES = 10;

// How many times we retry finding a delivery rider before escalating to admin
const MAX_RIDER_RETRY_ATTEMPTS = 3;

export class OrderEscalationService {
  /**
   * Process stale PENDING orders — auto-confirm if pharmacy hasn't responded
   * within PHARMACY_CONFIRM_TIMEOUT_MINUTES.
   *
   * Call this on a schedule (e.g., every 2 minutes).
   */
  static async processPharmacyTimeouts(): Promise<{
    processed: number;
    autoConfirmed: string[];
  }> {
    try {
      const db = getFirestore();
      const cutoff = new Date(
        Date.now() - PHARMACY_CONFIRM_TIMEOUT_MINUTES * 60 * 1000
      );

      // Find orders that are PENDING and were created before the cutoff
      const snapshot = await db
        .collection(FIRESTORE_COLLECTIONS.ORDERS)
        .where("status", "==", OrderStatus.PENDING)
        .where("paymentStatus", "==", "paid")
        .where("createdAt", "<=", cutoff)
        .limit(50)
        .get();

      if (snapshot.empty) {
        return { processed: 0, autoConfirmed: [] };
      }

      const autoConfirmed: string[] = [];
      const batch = db.batch();

      for (const doc of snapshot.docs) {
        const order = doc.data();

        batch.update(doc.ref, {
          status: OrderStatus.CONFIRMED,
          autoConfirmed: true,
          autoConfirmedAt: new Date(),
          updatedAt: new Date(),
        });

        autoConfirmed.push(order.id);
        logger.info(
          `Auto-confirmed order ${order.id} — pharmacy did not respond within ${PHARMACY_CONFIRM_TIMEOUT_MINUTES} minutes`
        );
      }

      await batch.commit();

      // TODO: Send notifications to pharmacy about auto-confirmation
      // TODO: If repeated auto-confirms for a pharmacy, escalate to admin

      return { processed: autoConfirmed.length, autoConfirmed };
    } catch (error) {
      logger.error("Failed to process pharmacy timeouts:", error);
      throw error;
    }
  }

  /**
   * Process stale delivery assignments — if a PENDING assignment hasn't been
   * accepted within INITIAL_ASSIGNMENT_TIMEOUT_MINUTES, cancel it and
   * re-queue the order for new rider assignment.
   *
   * Call this on a schedule (e.g., every 2 minutes).
   */
  static async processRiderTimeouts(): Promise<{
    processed: number;
    requeued: string[];
    escalated: string[];
  }> {
    try {
      const db = getFirestore();
      const cutoff = new Date(
        Date.now() - DELIVERY.INITIAL_ASSIGNMENT_TIMEOUT_MINUTES * 60 * 1000
      );

      // Find PENDING assignments created before the cutoff
      const snapshot = await db
        .collection(FIRESTORE_COLLECTIONS.DELIVERY_ASSIGNMENTS)
        .where("status", "==", DeliveryAssignmentStatus.PENDING)
        .where("createdAt", "<=", cutoff)
        .limit(50)
        .get();

      if (snapshot.empty) {
        return { processed: 0, requeued: [], escalated: [] };
      }

      const requeued: string[] = [];
      const escalated: string[] = [];

      for (const doc of snapshot.docs) {
        const assignment = doc.data();
        const retryCount = assignment.retryCount || 0;

        if (retryCount >= MAX_RIDER_RETRY_ATTEMPTS) {
          // Max retries exceeded — escalate to admin
          await doc.ref.update({
            status: DeliveryAssignmentStatus.CANCELLED,
            cancelReason: "No rider accepted after maximum retries",
            updatedAt: new Date(),
          });

          // Re-queue the order back to ready_for_pickup so it shows up for other providers
          const orderRef = db
            .collection(FIRESTORE_COLLECTIONS.ORDERS)
            .doc(assignment.orderId);
          await orderRef.update({
            status: OrderStatus.READY_FOR_PICKUP,
            deliveryAssignmentId: null,
            deliveryProviderId: null,
            escalatedToAdmin: true,
            escalatedAt: new Date(),
            updatedAt: new Date(),
          });

          // Create an admin notification / flagged alert
          await db.collection(FIRESTORE_COLLECTIONS.FLAGGED_ALERTS).add({
            type: "delivery_escalation",
            orderId: assignment.orderId,
            assignmentId: assignment.id,
            message: `Order ${assignment.orderId} has failed to find a delivery rider after ${MAX_RIDER_RETRY_ATTEMPTS} attempts. Requires admin intervention.`,
            severity: "high",
            resolved: false,
            createdAt: new Date(),
          });

          escalated.push(assignment.orderId);
          logger.warn(
            `Escalated order ${assignment.orderId} to admin — no rider accepted after ${MAX_RIDER_RETRY_ATTEMPTS} retries`
          );
        } else {
          // Cancel current assignment and re-queue the order for new assignment
          await doc.ref.update({
            status: DeliveryAssignmentStatus.CANCELLED,
            cancelReason: "Rider did not accept in time",
            retryCount: retryCount + 1,
            updatedAt: new Date(),
          });

          // Clear the assignment from the order so a new rider can claim it
          const orderRef = db
            .collection(FIRESTORE_COLLECTIONS.ORDERS)
            .doc(assignment.orderId);
          await orderRef.update({
            status: OrderStatus.READY_FOR_PICKUP,
            deliveryAssignmentId: null,
            deliveryProviderId: null,
            updatedAt: new Date(),
          });

          requeued.push(assignment.orderId);
          logger.info(
            `Re-queued order ${assignment.orderId} for rider assignment (retry ${retryCount + 1}/${MAX_RIDER_RETRY_ATTEMPTS})`
          );
        }
      }

      return {
        processed: requeued.length + escalated.length,
        requeued,
        escalated,
      };
    } catch (error) {
      logger.error("Failed to process rider timeouts:", error);
      throw error;
    }
  }

  /**
   * Run all escalation checks — convenience method for a single cron trigger
   */
  static async runAll(): Promise<{
    pharmacyTimeouts: { processed: number; autoConfirmed: string[] };
    riderTimeouts: { processed: number; requeued: string[]; escalated: string[] };
  }> {
    const [pharmacyTimeouts, riderTimeouts] = await Promise.all([
      this.processPharmacyTimeouts(),
      this.processRiderTimeouts(),
    ]);

    logger.info("Escalation run complete", {
      pharmacyAutoConfirmed: pharmacyTimeouts.processed,
      riderRequeued: riderTimeouts.requeued.length,
      riderEscalated: riderTimeouts.escalated.length,
    });

    return { pharmacyTimeouts, riderTimeouts };
  }
}
