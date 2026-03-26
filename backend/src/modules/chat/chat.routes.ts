import { Router } from "express";
import { ChatController } from "./chat.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { asyncHandler } from "../../middleware/errorHandler.js";
import { authRateLimiter } from "../../middleware/rateLimiter.js";

const router = Router();

/**
 * Chat Routes
 */

// POST /api/v1/chat/conversations - Create conversation
router.post(
  "/conversations",
  authenticate,
  authRateLimiter,
  asyncHandler((req, res) => ChatController.createConversation(req, res))
);

// GET /api/v1/chat/conversations - Get user conversations
router.get(
  "/conversations",
  authenticate,
  asyncHandler((req, res) => ChatController.getUserConversations(req, res))
);

// GET /api/v1/chat/conversations/:conversationId - Get conversation
router.get(
  "/conversations/:conversationId",
  authenticate,
  asyncHandler((req, res) => ChatController.getConversation(req, res))
);

// POST /api/v1/chat/conversations/:conversationId/messages - Send message
router.post(
  "/conversations/:conversationId/messages",
  authenticate,
  authRateLimiter,
  asyncHandler((req, res) => ChatController.sendMessage(req, res))
);

// PATCH /api/v1/chat/conversations/:conversationId/messages/:messageId/read - Mark as read
router.patch(
  "/conversations/:conversationId/messages/:messageId/read",
  authenticate,
  asyncHandler((req, res) => ChatController.markMessageAsRead(req, res))
);

// POST /api/v1/chat/conversations/:conversationId/close - Close conversation
router.post(
  "/conversations/:conversationId/close",
  authenticate,
  authRateLimiter,
  asyncHandler((req, res) => ChatController.closeConversation(req, res))
);

export default router;
