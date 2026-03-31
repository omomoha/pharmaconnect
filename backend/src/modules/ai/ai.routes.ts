import { Router } from "express";
import { AIController } from "./ai.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { asyncHandler } from "../../middleware/errorHandler.js";

const router = Router();

/**
 * AI Module Routes
 * All routes require authentication
 */

// POST /api/v1/ai/search - Smart natural language search
router.post(
  "/search",
  authenticate,
  asyncHandler((req, res) => AIController.smartSearch(req, res))
);

// POST /api/v1/ai/interactions - Check drug interactions
router.post(
  "/interactions",
  authenticate,
  asyncHandler((req, res) => AIController.checkInteractions(req, res))
);

// GET /api/v1/ai/recommendations - Get personalized recommendations
router.get(
  "/recommendations",
  authenticate,
  asyncHandler((req, res) => AIController.getRecommendations(req, res))
);

// POST /api/v1/ai/chat - Chat with pharmacy assistant
router.post(
  "/chat",
  authenticate,
  asyncHandler((req, res) => AIController.chatWithAssistant(req, res))
);

export default router;
