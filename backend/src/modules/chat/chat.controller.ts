import { Response } from "express";
import { AuthenticatedRequest } from "../../middleware/authenticate.js";
import { ChatService } from "./chat.service.js";
import { apiResponse } from "../../utils/helpers.js";
import logger from "../../utils/logger.js";
import { z } from "zod";
import { ConversationType, MessageType } from "@pharmaconnect/shared/dist/types/index.js";

/**
 * Chat Controller
 */
export class ChatController {
  /**
   * POST /conversations
   * Create conversation
   */
  static async createConversation(
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

      const schema = z.object({
        type: z.nativeEnum(ConversationType),
        pharmacyId: z.string().optional(),
        deliveryRiderId: z.string().optional(),
      });

      const validated = schema.parse(req.body);

      const conversation = await ChatService.createConversation({
        type: validated.type,
        customerId: req.user.uid,
        pharmacyId: validated.pharmacyId,
        deliveryRiderId: validated.deliveryRiderId,
      });

      logger.info(`Conversation created by user ${req.user.uid}`);

      res.status(201).json(
        apiResponse(true, {
          conversation,
        })
      );
    } catch (error) {
      logger.error("Create conversation error:", error);
      res.status(500).json(
        apiResponse(false, undefined, {
          code: "CONVERSATION_CREATION_FAILED",
          message: "Failed to create conversation",
        })
      );
    }
  }

  /**
   * GET /conversations/:conversationId
   * Get conversation
   */
  static async getConversation(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { conversationId } = req.params;

      const conversation = await ChatService.getConversation(conversationId);

      if (!conversation) {
        res.status(404).json(
          apiResponse(false, undefined, {
            code: "CONVERSATION_NOT_FOUND",
            message: "Conversation not found",
          })
        );
        return;
      }

      const messages = await ChatService.getMessages(conversationId, 100);

      res.json(
        apiResponse(true, {
          conversation,
          messages,
        })
      );
    } catch (error) {
      logger.error("Get conversation error:", error);
      res.status(500).json(
        apiResponse(false, undefined, {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve conversation",
        })
      );
    }
  }

  /**
   * GET /conversations
   * Get user conversations
   */
  static async getUserConversations(
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

      const conversations = await ChatService.getUserConversations(req.user.uid);

      res.json(
        apiResponse(true, {
          conversations,
          count: conversations.length,
        })
      );
    } catch (error) {
      logger.error("Get user conversations error:", error);
      res.status(500).json(
        apiResponse(false, undefined, {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve conversations",
        })
      );
    }
  }

  /**
   * POST /conversations/:conversationId/messages
   * Send message
   */
  static async sendMessage(
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

      const { conversationId } = req.params;

      const schema = z.object({
        content: z.string().min(1).max(10000),
        type: z.nativeEnum(MessageType).optional().default(MessageType.TEXT),
        imageUrl: z.string().url().optional(),
      });

      const validated = schema.parse(req.body);

      const result = await ChatService.sendMessage({
        conversationId,
        senderId: req.user.uid,
        senderRole: req.user.role!,
        content: validated.content,
        type: validated.type,
        imageUrl: validated.imageUrl,
      });

      logger.info(`Message sent by user ${req.user.uid}`, {
        flagged: result.flagged,
      });

      res.status(201).json(
        apiResponse(true, {
          message: result.message,
          flagged: result.flagged,
          alert: result.alert,
        })
      );
    } catch (error) {
      logger.error("Send message error:", error);
      res.status(500).json(
        apiResponse(false, undefined, {
          code: "MESSAGE_SEND_FAILED",
          message: "Failed to send message",
        })
      );
    }
  }

  /**
   * PATCH /conversations/:conversationId/messages/:messageId/read
   * Mark message as read
   */
  static async markMessageAsRead(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { messageId } = req.params;

      await ChatService.markMessageAsRead(messageId);

      logger.info(`Message marked as read: ${messageId}`);

      res.json(apiResponse(true, { success: true }));
    } catch (error) {
      logger.error("Mark message as read error:", error);
      res.status(500).json(
        apiResponse(false, undefined, {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to mark message as read",
        })
      );
    }
  }

  /**
   * POST /conversations/:conversationId/close
   * Close conversation
   */
  static async closeConversation(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { conversationId } = req.params;

      await ChatService.closeConversation(conversationId);

      logger.info(`Conversation closed: ${conversationId}`);

      res.json(apiResponse(true, { success: true }));
    } catch (error) {
      logger.error("Close conversation error:", error);
      res.status(500).json(
        apiResponse(false, undefined, {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to close conversation",
        })
      );
    }
  }

  /**
   * GET /unread-count
   * Get unread message count for user
   */
  static async getUnreadCount(
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

      const count = await ChatService.getUnreadCount(req.user.uid);

      logger.info(`Unread count retrieved for user ${req.user.uid}: ${count}`);

      res.json(
        apiResponse(true, {
          count,
        })
      );
    } catch (error) {
      logger.error("Get unread count error:", error);
      res.status(500).json(
        apiResponse(false, undefined, {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve unread count",
        })
      );
    }
  }
}
