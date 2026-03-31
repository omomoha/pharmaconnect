import logger from "../../utils/logger.js";
import config from "../../config/index.js";

/**
 * AI Service Layer
 * Wraps OpenAI API calls for various AI-powered features:
 * - Smart search with natural language understanding
 * - Drug interaction checking
 * - Personalized recommendations
 * - AI chatbot for pharmacy questions
 */

export interface SmartSearchResult {
  query: string;
  categories?: string[];
  symptoms?: string[];
  drugNames?: string[];
  location?: { lat: number; lng: number };
  confidence?: number;
}

export interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: "mild" | "moderate" | "severe";
  description: string;
  recommendation: string;
}

export interface InteractionCheckResult {
  drugs: string[];
  interactions: DrugInteraction[];
  warnings: string[];
  safe: boolean;
}

export interface ProductRecommendation {
  productId: string;
  productName: string;
  category: string;
  reason: string;
  confidence: number;
}

export interface RecommendationResult {
  recommendations: ProductRecommendation[];
  message?: string;
}

export interface ChatAssistantMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatAssistantResult {
  response: string;
  conversationContinued: boolean;
  disclaimers?: string[];
}

/**
 * AIService class with static methods for AI operations
 */
export class AIService {
  /**
   * Smart Search - Convert natural language query to structured search parameters
   * Example: "headache medicine near me" -> { symptoms: ["headache"], location: {...} }
   */
  static async smartSearch(
    query: string,
    userLocation?: { lat: number; lng: number }
  ): Promise<SmartSearchResult> {
    try {
      if (!config.OPENAI_API_KEY) {
        logger.debug("OpenAI API not configured, returning basic search result");
        return {
          query,
          location: userLocation,
          confidence: 0,
        };
      }

      // Dynamically import OpenAI
      let openai: any;
      try {
        // @ts-ignore - Dynamic import to handle optional dependency
        const OpenAI = require("openai").default;
        openai = new OpenAI({
          apiKey: config.OPENAI_API_KEY,
        });
      } catch (importError) {
        logger.warn("OpenAI module not available for smart search", importError);
        return {
          query,
          location: userLocation,
          confidence: 0,
        };
      }

      const systemPrompt = `You are a pharmacy search assistant. Analyze the user's search query and extract:
1. Drug categories (e.g., pain relief, cold medicine, vitamins)
2. Symptoms mentioned (e.g., headache, fever, cough)
3. Specific drug names if mentioned
4. Whether they want location-based search ("near me")

Respond ONLY with a JSON object (no additional text):
{
  "categories": ["string"],
  "symptoms": ["string"],
  "drugNames": ["string"],
  "wantsNearby": boolean,
  "confidence": 0.0-1.0
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: query,
          },
        ],
        temperature: 0.3,
        max_tokens: 300,
      });

      const responseText = response.choices[0]?.message?.content || "";

      try {
        const parsed = JSON.parse(responseText);
        logger.info("Smart search parsed", { query, parsed });

        return {
          query,
          categories: parsed.categories || [],
          symptoms: parsed.symptoms || [],
          drugNames: parsed.drugNames || [],
          location: parsed.wantsNearby ? userLocation : undefined,
          confidence: parsed.confidence || 0,
        };
      } catch (parseError) {
        logger.warn("Failed to parse smart search response", { responseText });
        return {
          query,
          location: userLocation,
          confidence: 0,
        };
      }
    } catch (error) {
      logger.error("Smart search error:", error);
      return {
        query,
        location: userLocation,
        confidence: 0,
      };
    }
  }

  /**
   * Check Drug Interactions - Validate drug combinations for safety
   * Takes array of drug names, returns potential interactions and warnings
   */
  static async checkDrugInteractions(drugNames: string[]): Promise<InteractionCheckResult> {
    try {
      if (!config.OPENAI_API_KEY) {
        logger.debug("OpenAI API not configured, skipping interaction check");
        return {
          drugs: drugNames,
          interactions: [],
          warnings: [],
          safe: true,
        };
      }

      if (drugNames.length < 2) {
        return {
          drugs: drugNames,
          interactions: [],
          warnings: [],
          safe: true,
        };
      }

      let openai: any;
      try {
        // @ts-ignore
        const OpenAI = require("openai").default;
        openai = new OpenAI({
          apiKey: config.OPENAI_API_KEY,
        });
      } catch (importError) {
        logger.warn("OpenAI module not available for interaction check", importError);
        return {
          drugs: drugNames,
          interactions: [],
          warnings: [],
          safe: true,
        };
      }

      const systemPrompt = `You are a pharmaceutical interaction checker. Analyze the provided list of drugs and identify any interactions.
IMPORTANT: Only flag REAL, known interactions. If you're unsure, mark as safe.
For each interaction found, provide severity (mild/moderate/severe) and recommendation.

Respond ONLY with JSON (no additional text):
{
  "interactions": [
    {
      "drug1": "name",
      "drug2": "name",
      "severity": "mild|moderate|severe",
      "description": "brief description",
      "recommendation": "what to do"
    }
  ],
  "warnings": ["string"],
  "safe": boolean
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: `Check interactions for: ${drugNames.join(", ")}`,
          },
        ],
        temperature: 0.2,
        max_tokens: 500,
      });

      const responseText = response.choices[0]?.message?.content || "";

      try {
        const parsed = JSON.parse(responseText);
        logger.info("Drug interaction check completed", {
          drugs: drugNames,
          interactionCount: parsed.interactions?.length || 0,
        });

        return {
          drugs: drugNames,
          interactions: parsed.interactions || [],
          warnings: parsed.warnings || [],
          safe: parsed.safe !== false,
        };
      } catch (parseError) {
        logger.warn("Failed to parse interaction response", { responseText });
        return {
          drugs: drugNames,
          interactions: [],
          warnings: [],
          safe: true,
        };
      }
    } catch (error) {
      logger.error("Drug interaction check error:", error);
      return {
        drugs: drugNames,
        interactions: [],
        warnings: [],
        safe: true,
      };
    }
  }

  /**
   * Get Recommendations - Personalized product recommendations based on order history
   * Uses past purchases and browsing patterns to suggest relevant products
   */
  static async getRecommendations(
    userId: string,
    orderHistory: any[],
    currentCart?: any[]
  ): Promise<RecommendationResult> {
    try {
      if (!config.OPENAI_API_KEY) {
        logger.debug("OpenAI API not configured, skipping recommendations");
        return {
          recommendations: [],
          message: "Recommendations not available at this time",
        };
      }

      let openai: any;
      try {
        // @ts-ignore
        const OpenAI = require("openai").default;
        openai = new OpenAI({
          apiKey: config.OPENAI_API_KEY,
        });
      } catch (importError) {
        logger.warn("OpenAI module not available for recommendations", importError);
        return {
          recommendations: [],
          message: "Recommendations not available at this time",
        };
      }

      // Prepare order history summary
      const orderSummary = orderHistory
        .slice(-10) // Last 10 orders
        .map((order: any) => {
          const items = order.items?.map((item: any) => item.productName || item.name).join(", ");
          return items || "unknown products";
        })
        .join(" | ");

      const cartSummary = currentCart
        ?.map((item: any) => item.productName || item.name)
        .join(", ");

      const systemPrompt = `You are a pharmacy product recommendation assistant. Based on purchase history, suggest complementary OTC products.
IMPORTANT: Only recommend legitimate OTC (over-the-counter) products. NEVER suggest prescription drugs.
Provide recommendations with reasoning.

Respond ONLY with JSON (no additional text):
{
  "recommendations": [
    {
      "productId": "simulated_id",
      "productName": "actual product name",
      "category": "category",
      "reason": "why recommended",
      "confidence": 0.0-1.0
    }
  ]
}`;

      const userPrompt = `User history: ${orderSummary || "No previous orders"}
${cartSummary ? `Current cart: ${cartSummary}` : ""}

Recommend 3-5 complementary OTC products based on this history.`;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature: 0.4,
        max_tokens: 500,
      });

      const responseText = response.choices[0]?.message?.content || "";

      try {
        const parsed = JSON.parse(responseText);
        logger.info("Recommendations generated", {
          userId,
          recommendationCount: parsed.recommendations?.length || 0,
        });

        return {
          recommendations: parsed.recommendations || [],
          message: "Based on your purchase history",
        };
      } catch (parseError) {
        logger.warn("Failed to parse recommendations response", { responseText });
        return {
          recommendations: [],
          message: "Could not generate recommendations at this time",
        };
      }
    } catch (error) {
      logger.error("Recommendation error:", error);
      return {
        recommendations: [],
        message: "Could not generate recommendations at this time",
      };
    }
  }

  /**
   * Chat Assistant - Answer pharmacy-related questions and suggest OTC products
   * Maintains context of conversation for follow-up questions
   * CRITICAL: Must never recommend prescription drugs
   */
  static async chatAssistant(
    message: string,
    context?: {
      role?: string;
      conversationHistory?: ChatAssistantMessage[];
    }
  ): Promise<ChatAssistantResult> {
    try {
      if (!config.OPENAI_API_KEY) {
        logger.debug("OpenAI API not configured, skipping chat assistant");
        return {
          response: "Chat assistant is not available at this time. Please contact support.",
          conversationContinued: false,
        };
      }

      let openai: any;
      try {
        // @ts-ignore
        const OpenAI = require("openai").default;
        openai = new OpenAI({
          apiKey: config.OPENAI_API_KEY,
        });
      } catch (importError) {
        logger.warn("OpenAI module not available for chat assistant", importError);
        return {
          response: "Chat assistant is not available at this time. Please contact support.",
          conversationContinued: false,
        };
      }

      const systemPrompt = `You are a friendly and helpful pharmacy chatbot for PharmaConnect marketplace.

CRITICAL RULES:
1. NEVER recommend, discuss, or provide information about prescription drugs
2. NEVER provide medical diagnoses or treatment plans
3. ONLY discuss OTC (over-the-counter) products and general health information
4. If asked about prescription drugs, politely decline and suggest consulting a healthcare professional
5. Always include appropriate medical disclaimers when discussing health topics
6. Be helpful, informative, and professional

Your role:
- Answer questions about OTC products available on our platform
- Suggest appropriate OTC remedies for common ailments (with disclaimers)
- Provide general wellness information
- Help customers navigate our product categories
- Direct users to healthcare professionals when needed

When suggesting products, be specific about category/type, not exact names (pharmacy staff will help find specific brands).

Always end health-related responses with: "Important: This is general information only, not medical advice. If symptoms persist, consult a healthcare professional."`;

      // Build conversation history
      const messages: ChatAssistantMessage[] = [];

      if (context?.conversationHistory && context.conversationHistory.length > 0) {
        // Keep last 5 exchanges for context
        messages.push(...context.conversationHistory.slice(-10));
      }

      // Add current message
      messages.push({
        role: "user",
        content: message,
      });

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          ...messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const assistantResponse = response.choices[0]?.message?.content || "";

      logger.info("Chat assistant response generated", {
        inputLength: message.length,
        outputLength: assistantResponse.length,
      });

      return {
        response: assistantResponse,
        conversationContinued: true,
        disclaimers: assistantResponse.includes("medical advice")
          ? ["This is general information only, not medical advice"]
          : undefined,
      };
    } catch (error) {
      logger.error("Chat assistant error:", error);
      return {
        response:
          "I encountered an issue processing your message. Please try again or contact support.",
        conversationContinued: false,
      };
    }
  }
}
