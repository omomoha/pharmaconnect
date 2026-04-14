import { getFirestore } from "../config/firebase.js";
import { FIRESTORE_COLLECTIONS } from "@pharmaconnect/shared/dist/constants/index.js";
import logger from "./logger.js";

/**
 * Audit Log Service
 *
 * Logs sensitive admin and system actions to an immutable Firestore collection.
 * Firestore rules block client-side writes — only the backend can create logs.
 *
 * Use this for:
 * - Admin approvals/rejections (pharmacies, delivery providers)
 * - Admin-initiated refunds
 * - Order status overrides
 * - Role changes
 * - Large order flags
 * - Security events (failed verification attempts, escalations)
 */

export enum AuditAction {
  // Admin actions
  PHARMACY_APPROVED = "pharmacy_approved",
  PHARMACY_REJECTED = "pharmacy_rejected",
  DELIVERY_PROVIDER_APPROVED = "delivery_provider_approved",
  DELIVERY_PROVIDER_REJECTED = "delivery_provider_rejected",
  ADMIN_REFUND_INITIATED = "admin_refund_initiated",
  ORDER_STATUS_OVERRIDE = "order_status_override",
  USER_ROLE_CHANGED = "user_role_changed",
  USER_DEACTIVATED = "user_deactivated",

  // System actions
  ORDER_AUTO_CONFIRMED = "order_auto_confirmed",
  DELIVERY_ESCALATED = "delivery_escalated",
  SECURITY_CODE_MAX_ATTEMPTS = "security_code_max_attempts",
  LARGE_ORDER_FLAGGED = "large_order_flagged",
  PRESCRIPTION_DRUG_BLOCKED = "prescription_drug_blocked",

  // Payment actions
  PAYOUT_INITIATED = "payout_initiated",
  SUBSCRIPTION_CHANGED = "subscription_changed",
}

export interface AuditLogEntry {
  id?: string;
  action: AuditAction;
  actorId: string; // User who performed the action (or "system")
  actorRole?: string;
  targetType: string; // e.g., "pharmacy", "order", "user", "delivery_provider"
  targetId: string;
  details?: Record<string, unknown>; // Action-specific metadata
  ipAddress?: string;
  timestamp: Date;
}

/**
 * Write an audit log entry. Fire-and-forget — never blocks the calling operation.
 */
export async function writeAuditLog(entry: Omit<AuditLogEntry, "timestamp">): Promise<void> {
  try {
    const db = getFirestore();
    const logEntry: AuditLogEntry = {
      ...entry,
      timestamp: new Date(),
    };

    await db.collection(FIRESTORE_COLLECTIONS.AUDIT_LOGS).add(logEntry);

    logger.info(`Audit log: ${entry.action} by ${entry.actorId} on ${entry.targetType}:${entry.targetId}`);
  } catch (error) {
    // Audit logging should never break the main flow
    logger.error("Failed to write audit log:", error);
  }
}

/**
 * Query audit logs (admin only)
 */
export async function queryAuditLogs(filters: {
  action?: AuditAction;
  actorId?: string;
  targetType?: string;
  targetId?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
}): Promise<AuditLogEntry[]> {
  try {
    const db = getFirestore();
    let query: any = db
      .collection(FIRESTORE_COLLECTIONS.AUDIT_LOGS)
      .orderBy("timestamp", "desc");

    if (filters.action) {
      query = query.where("action", "==", filters.action);
    }
    if (filters.actorId) {
      query = query.where("actorId", "==", filters.actorId);
    }
    if (filters.targetType) {
      query = query.where("targetType", "==", filters.targetType);
    }
    if (filters.targetId) {
      query = query.where("targetId", "==", filters.targetId);
    }

    query = query.limit(filters.limit || 100);

    const snapshot = await query.get();
    return snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    })) as AuditLogEntry[];
  } catch (error) {
    logger.error("Failed to query audit logs:", error);
    throw error;
  }
}
