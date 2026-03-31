import { Response } from "express";
import { AuthenticatedRequest } from "../../middleware/authenticate.js";
import { createAppError } from "../../middleware/errorHandler.js";
import logger from "../../utils/logger.js";
import {
  AIService,
  SmartSearchResult,
  InteractionCheckResult,
  RecommendationResult,
  ChatAssistantResult,
  ChatAssistantMessage,
} from "../../services/ai/ai.service.js";

/**
 * AI Controller
 * Handles HTTP requests for AI-powered features
 */
export class AIController {
  /**
   * POST /api/v1/ai/search
   * Converts natural language query to structured search parameters
   * Body: { query: string, lat?: number, lng?: number }
   */
  static async smartSearch(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { query, lat, lng } = req.body;

      // Validate input
      if (!query || typeof query !== "string" || query.trim().length === 0) {
        throw createAppError(
          "Search query is required and must be a non-empty string",
          400,
          "INVALID_SEARCH_QUERY"
        );
      }

      // Build location object if provided
      const userLocation = lat !== undefined && lng !== undefined ? { lat, lng } : undefined;

      // Validate location coordinates if provided
      if (userLocation) {
        if (typeof lat !== "number" || typeof lng !== "number") {
          throw createAppError(
            "Location coordinates must be numbers",
            400,
            "INVALID_LOCATION_COORDS"
          );
        }
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          throw createAppError(
            "Location coordinates are out of valid range",
            400,
            "INVALID_COORDINATES_RANGE"
          );
        }
      }

      const result: SmartSearchResult = await AIService.smartSearch(query.trim(), userLocation);

      logger.info("Smart search completed", {
        userId: req.user?.uid,
        query,
        resultCategories: result.categories?.length || 0,
        resultSymptoms: result.symptoms?.length || 0,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if ((error as any).statusCode) {
        throw error;
      }
      throw createAppError(
        error instanceof Error ? error.message : "Smart search failed",
        500,
        "SMART_SEARCH_ERROR"
      );
    }
  }

  /**
   * POST /api/v1/ai/interactions
   * Checks drug interactions for safety
   * Body: { drugs: string[] }
   */
  static async checkInteractions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { drugs } = req.body;

      // Validate input
      if (!Array.isArray(drugs) || drugs.length === 0) {
        throw createAppError(
          "Drugs must be provided as a non-empty array of strings",
          400,
          "INVALID_DRUGS_ARRAY"
        );
      }

      // Validate each drug name
      if (!drugs.every((drug: any) => typeof drug === "string" && drug.trim().length > 0)) {
        throw createAppError(
          "All drug names must be non-empty strings",
          400,
          "INVALID_DRUG_NAME"
        );
      }

      // Trim drug names
      const trimmedDrugs = drugs.map((drug: string) => drug.trim());

      // Check for duplicate drugs
      const uniqueDrugs = [...new Set(trimmedDrugs)];
      if (uniqueDrugs.length < trimmedDrugs.length) {
        throw createAppError(
          "Duplicate drugs provided. Please provide unique drug names.",
          400,
          "DUPLICATE_DRUGS"
        );
      }

      if (uniqueDrugs.length > 10) {
        throw createAppError(
          "Maximum 10 drugs can be checked at once",
          400,
          "TOO_MANY_DRUGS"
        );
      }

      const result: InteractionCheckResult = await AIService.checkDrugInteractions(uniqueDrugs);

      logger.info("Drug interaction check completed", {
        userId: req.user?.uid,
        drugCount: uniqueDrugs.length,
        interactionCount: result.interactions.length,
        safe: result.safe,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if ((error as any).statusCode) {
        throw error;
      }
      throw createAppError(
        error instanceof Error ? error.message : "Interaction check failed",
        500,
        "INTERACTION_CHECK_ERROR"
      );
    }
  }

  /**
   * GET /api/v1/ai/recommendations
   * Gets personalized product recommendations for authenticated user
   * Query params: none required
   */
  static async getRecommendations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Ensure user is authenticated
      if (!req.user?.uid) {
        throw createAppError(
          "User authentication is required for recommendations",
          401,
          "AUTHENTICATION_REQUIRED"
        );
      }

      // TODO: Fetch actual order history from Firestore
      // For now, using empty arrays as placeholder
      const orderHistory: any[] = [];
      const currentCart: any[] = [];

      const result: RecommendationResult = await AIService.getRecommendations(
        req.user.uid,
        orderHistory,
        currentCart
      );

      logger.info("Recommendations generated", {
        userId: req.user.uid,
        recommendationCount: result.recommendations.length,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if ((error as any).statusCode) {
        throw error;
      }
      throw createAppError(
        error instanceof Error ? error.message : "Recommendation generation failed",
        500,
        "RECOMMENDATION_ERROR"
      );
    }
  }

  /**
   * POST /api/v1/ai/chat
   * Chat with AI pharmacy assistant
   * Body: { message: string, conversationHistory?: Array<{role, content}> }
   */
  static async chatWithAssistant(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { message, conversationHistory } = req.body;

      // Validate input
      if (!message || typeof message !== "string" || message.trim().length === 0) {
        throw createAppError(
          "Message is required and must be a non-empty string",
          400,
          "INVALID_MESSAGE"
        );
      }

      if (message.length > 5000) {
        throw createAppError(
          "Message is too long (max 5000 characters)",
          400,
          "MESSAGE_TOO_LONG"
        );
      }

      // Validate conversation history if provided
      let validHistory: ChatAssistantMessage[] = [];
      if (conversationHistory) {
        if (!Array.isArray(conversationHistory)) {
          throw createAppError(
            "Conversation history must be an array",
            400,
            "INVALID_HISTORY_FORMAT"
          );
        }

        // Validate and filter history - max 10 previous messages
        validHistory = conversationHistory
          .slice(-10)
          .filter(
            (msg: any) =>
              msg &&
              typeof msg === "object" &&
              (msg.role === "user" || msg.role === "assistant") &&
              typeof msg.content === "string" &&
              msg.content.length > 0 &&
              msg.content.length <= 5000
          ) as ChatAssistantMessage[];
      }

      const context = {
        role: req.user?.role,
        conversationHistory: validHistory,
      };

      const result: ChatAssistantResult = await AIService.chatAssistant(message.trim(), context);

      logger.info("Chat assistant response generated", {
        userId: req.user?.uid,
        messageLength: message.length,
        historyLength: validHistory.length,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if ((error as any).statusCode) {
        throw error;
      }
      throw createAppError(
        error instanceof Error ? error.message : "Chat failed",
        500,
        "CHAT_ERROR"
      );
    }
  }
}
