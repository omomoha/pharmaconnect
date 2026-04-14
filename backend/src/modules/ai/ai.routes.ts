import { Router } from "express";
import { AIController } from "./ai.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { asyncHandler } from "../../middleware/errorHandler.js";
import { requireFeature } from "../../middleware/subscriptionGate.js";

const router = Router();

/**
 * AI Module Routes
 * All routes require authentication
 * Some routes gated by subscription tier
 */

// POST /api/v1/ai/search - Smart natural language search (available to all authenticated users)
router.post(
  "/search",
  authenticate,
  asyncHandler((req, res) => AIController.smartSearch(req, res))
);

// POST /api/v1/ai/interactions - Check drug interactions (available to all authenticated users)
router.post(
  "/interactions",
  authenticate,
  asyncHandler((req, res) => AIController.checkInteractions(req, res))
);

// GET /api/v1/ai/recommendations - Get personalized recommendations (available to all)
router.get(
  "/recommendations",
  authenticate,
  asyncHandler((req, res) => AIController.getRecommendations(req, res))
);

// POST /api/v1/ai/chat - Chat with pharmacy assistant (PharmaPro+ only for pharmacies)
router.post(
  "/chat",
  authenticate,
  requireFeature("ai_chat_assistant"),
  asyncHandler((req, res) => AIController.chatWithAssistant(req, res))
);

export default router;
