import { getFirestore } from "../../config/firebase.js";
import logger from "../../utils/logger.js";
import { sanitizeString } from "../../utils/helpers.js";
import {
  Conversation,
  Message,
  FlaggedAlert,
  ConversationType,
  ConversationStatus,
  MessageType,
  UserRole,
  FlagAction,
} from "@pharmaconnect/shared/dist/types/index.js";
import { FIRESTORE_COLLECTIONS } from "@pharmaconnect/shared/dist/constants/index.js";
import { v4 as uuid } from "uuid";
import { moderateMessage } from "../../services/moderation/keyword-matcher.js";

/**
 * Chat Service
 */
export class ChatService {
  /**
   * Create conversation
   */
  static async createConversation(data: {
    type: ConversationType;
    customerId: string;
    pharmacyId?: string;
    deliveryRiderId?: string;
  }): Promise<Conversation> {
    try {
      const db = getFirestore();
      const id = uuid();
      const now = new Date();

      const conversation: Conversation = {
        id,
        type: data.type,
        customerId: data.customerId,
        pharmacyId: data.pharmacyId,
        deliveryRiderId: data.deliveryRiderId,
        status: ConversationStatus.ACTIVE,
        createdAt: now,
        updatedAt: now,
      };

      await db
        .collection(FIRESTORE_COLLECTIONS.CONVERSATIONS)
        .doc(id)
        .set(conversation);

      logger.info(`Conversation created: ${id}`);
      return conversation;
    } catch (error) {
      logger.error("Failed to create conversation:", error);
      throw error;
    }
  }

  /**
   * Get conversation
   */
  static async getConversation(id: string): Promise<Conversation | null> {
    try {
      const db = getFirestore();
      const doc = await db
        .collection(FIRESTORE_COLLECTIONS.CONVERSATIONS)
        .doc(id)
        .get();

      if (!doc.exists) {
        return null;
      }

      return doc.data() as Conversation;
    } catch (error) {
      logger.error(`Failed to get conversation ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get user conversations
   */
  static async getUserConversations(userId: string): Promise<Conversation[]> {
    try {
      const db = getFirestore();
      const snapshot = await db
        .collection(FIRESTORE_COLLECTIONS.CONVERSATIONS)
        .where("customerId", "==", userId)
        .orderBy("updatedAt", "desc")
        .get();

      return snapshot.docs.map((doc) => doc.data() as Conversation);
    } catch (error) {
      logger.error(`Failed to get conversations for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Send message with moderation
   */
  static async sendMessage(data: {
    conversationId: string;
    senderId: string;
    senderRole: UserRole;
    content: string;
    type?: MessageType;
    imageUrl?: string;
  }): Promise<{
    message: Message;
    flagged: boolean;
    alert?: FlaggedAlert;
  }> {
    try {
      const db = getFirestore();
      const messageId = uuid();
      const now = new Date();

      // Sanitize content
      const sanitizedContent = sanitizeString(data.content);

      // Moderate message
      const moderation = await this.moderateMessage({
        content: data.content,
        senderId: data.senderId,
        senderRole: data.senderRole,
      });

      const message: Message = {
        id: messageId,
        conversationId: data.conversationId,
        senderId: data.senderId,
        senderRole: data.senderRole,
        type: data.type || MessageType.TEXT,
        content: sanitizedContent,
        imageUrl: data.imageUrl,
        flagged: moderation.flagged,
        flaggedReason: moderation.reason,
        createdAt: now,
        updatedAt: now,
      };

      // Save message
      await db
        .collection(FIRESTORE_COLLECTIONS.MESSAGES)
        .doc(messageId)
        .set(message);

      // Update conversation
      await db
        .collection(FIRESTORE_COLLECTIONS.CONVERSATIONS)
        .doc(data.conversationId)
        .update({
          lastMessage: sanitizedContent,
          lastMessageAt: now,
          updatedAt: now,
        });

      logger.info(`Message sent: ${messageId}`);

      // Create alert if flagged
      let alert: FlaggedAlert | undefined;
      if (moderation.flagged && moderation.keywords) {
        alert = await this.flagMessage(messageId, data.conversationId, data.senderId, data.senderRole, moderation);
      }

      return {
        message,
        flagged: moderation.flagged,
        alert,
      };
    } catch (error) {
      logger.error("Failed to send message:", error);
      throw error;
    }
  }

  /**
   * Get messages for conversation
   */
  static async getMessages(
    conversationId: string,
    limit: number = 50
  ): Promise<Message[]> {
    try {
      const db = getFirestore();
      const snapshot = await db
        .collection(FIRESTORE_COLLECTIONS.MESSAGES)
        .where("conversationId", "==", conversationId)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

      return snapshot.docs
        .map((doc) => doc.data() as Message)
        .reverse();
    } catch (error) {
      logger.error(`Failed to get messages for conversation ${conversationId}:`, error);
      throw error;
    }
  }

  /**
   * Mark message as read
   */
  static async markMessageAsRead(messageId: string): Promise<void> {
    try {
      const db = getFirestore();
      await db
        .collection(FIRESTORE_COLLECTIONS.MESSAGES)
        .doc(messageId)
        .update({
          readAt: new Date(),
        });

      logger.info(`Message marked as read: ${messageId}`);
    } catch (error) {
      logger.error(`Failed to mark message as read ${messageId}:`, error);
      throw error;
    }
  }

  /**
   * Moderate message - 3 layers
   */
  static async moderateMessage(data: {
    content: string;
    senderId: string;
    senderRole: UserRole;
  }): Promise<{
    flagged: boolean;
    reason?: string;
    keywords?: string[];
    confidenceScore?: number;
  }> {
    try {
      // Layer 1: Keyword matching
      const keywordResult = moderateMessage(data.content);

      if (keywordResult.flagged) {
        return {
          flagged: true,
          reason: "Prescription drug detection",
          keywords: keywordResult.keywords,
          confidenceScore: 0.9,
        };
      }

      // Layer 2 & 3: Stubs for NLP and context analysis
      // In production, integrate with OpenAI API or custom NLP model
      // return {
      //   flagged: false,
      // };

      return {
        flagged: false,
      };
    } catch (error) {
      logger.warn("Message moderation error:", error);
      return { flagged: false };
    }
  }

  /**
   * Flag message and create alert
   */
  static async flagMessage(
    messageId: string,
    conversationId: string,
    senderId: string,
    senderRole: UserRole,
    moderation: {
      flagged: boolean;
      reason?: string;
      keywords?: string[];
      confidenceScore?: number;
    }
  ): Promise<FlaggedAlert> {
    try {
      const db = getFirestore();
      const alertId = uuid();
      const now = new Date();

      const alert: FlaggedAlert = {
        id: alertId,
        messageId,
        conversationId,
        senderId,
        senderRole,
        suspiciousKeywords: moderation.keywords || [],
        nlpClassification: "prescription_request",
        confidenceScore: moderation.confidenceScore || 0.5,
        action: FlagAction.DISMISSED,
        createdAt: now,
        updatedAt: now,
      };

      await db
        .collection(FIRESTORE_COLLECTIONS.FLAGGED_ALERTS)
        .doc(alertId)
        .set(alert);

      // Update conversation status
      await db
        .collection(FIRESTORE_COLLECTIONS.CONVERSATIONS)
        .doc(conversationId)
        .update({
          status: ConversationStatus.FLAGGED,
          flaggedAt: now,
        });

      logger.info(`Message flagged: ${messageId}`, {
        keywords: moderation.keywords,
      });

      return alert;
    } catch (error) {
      logger.error(`Failed to flag message ${messageId}:`, error);
      throw error;
    }
  }

  /**
   * Close conversation
   */
  static async closeConversation(id: string): Promise<void> {
    try {
      const db = getFirestore();
      await db
        .collection(FIRESTORE_COLLECTIONS.CONVERSATIONS)
        .doc(id)
        .update({
          status: ConversationStatus.CLOSED,
          updatedAt: new Date(),
        });

      logger.info(`Conversation closed: ${id}`);
    } catch (error) {
      logger.error(`Failed to close conversation ${id}:`, error);
      throw error;
    }
  }
}
