import { getFirestore } from "../../config/firebase.js";
import { FIRESTORE_COLLECTIONS } from "@pharmaconnect/shared/dist/constants/index.js";
import { TicketStatus } from "@pharmaconnect/shared/dist/types/index.js";
import logger from "../../utils/logger.js";

export class SupportService {
  /**
   * Create a new support ticket
   */
  static async createTicket(data: {
    userId: string;
    userEmail: string;
    userName: string;
    userRole: string;
    subject: string;
    description: string;
    category: string;
  }): Promise<any> {
    try {
      const db = getFirestore();
      const now = new Date();
      const ticketData = {
        ...data,
        status: TicketStatus.OPEN,
        createdAt: now,
        updatedAt: now,
      };
      const docRef = await db.collection(FIRESTORE_COLLECTIONS.SUPPORT_TICKETS).add(ticketData);
      logger.info(`Support ticket created: ${docRef.id} by user ${data.userId}`);
      return { id: docRef.id, ...ticketData };
    } catch (error) {
      logger.error("Failed to create support ticket:", error);
      throw error;
    }
  }

  /**
   * Get tickets for a specific user
   */
  static async getUserTickets(userId: string): Promise<any[]> {
    try {
      const db = getFirestore();
      const snapshot = await db
        .collection(FIRESTORE_COLLECTIONS.SUPPORT_TICKETS)
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      logger.error(`Failed to get tickets for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get all tickets (admin)
   */
  static async getAllTickets(status?: string): Promise<any[]> {
    try {
      const db = getFirestore();
      let query: any = db.collection(FIRESTORE_COLLECTIONS.SUPPORT_TICKETS).orderBy("createdAt", "desc");
      if (status && status !== "all") {
        query = db.collection(FIRESTORE_COLLECTIONS.SUPPORT_TICKETS)
          .where("status", "==", status)
          .orderBy("createdAt", "desc");
      }
      const snapshot = await query.get();
      return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      logger.error("Failed to get all support tickets:", error);
      throw error;
    }
  }

  /**
   * Get a single ticket by ID
   */
  static async getTicketById(ticketId: string): Promise<any> {
    try {
      const db = getFirestore();
      const doc = await db.collection(FIRESTORE_COLLECTIONS.SUPPORT_TICKETS).doc(ticketId).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      logger.error(`Failed to get ticket ${ticketId}:`, error);
      throw error;
    }
  }

  /**
   * Admin responds to a ticket
   */
  static async respondToTicket(ticketId: string, adminId: string, response: string): Promise<any> {
    try {
      const db = getFirestore();
      const now = new Date();
      await db.collection(FIRESTORE_COLLECTIONS.SUPPORT_TICKETS).doc(ticketId).update({
        adminResponse: response,
        respondedBy: adminId,
        respondedAt: now,
        status: TicketStatus.RESOLVED,
        updatedAt: now,
      });
      const doc = await db.collection(FIRESTORE_COLLECTIONS.SUPPORT_TICKETS).doc(ticketId).get();
      logger.info(`Ticket ${ticketId} responded to by admin ${adminId}`);
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      logger.error(`Failed to respond to ticket ${ticketId}:`, error);
      throw error;
    }
  }

  /**
   * Close a ticket
   */
  static async closeTicket(ticketId: string, adminId: string): Promise<any> {
    try {
      const db = getFirestore();
      const now = new Date();
      await db.collection(FIRESTORE_COLLECTIONS.SUPPORT_TICKETS).doc(ticketId).update({
        status: TicketStatus.CLOSED,
        closedAt: now,
        closedBy: adminId,
        updatedAt: now,
      });
      const doc = await db.collection(FIRESTORE_COLLECTIONS.SUPPORT_TICKETS).doc(ticketId).get();
      logger.info(`Ticket ${ticketId} closed by admin ${adminId}`);
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      logger.error(`Failed to close ticket ${ticketId}:`, error);
      throw error;
    }
  }
}
