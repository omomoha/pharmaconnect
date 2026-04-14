import logger from "../../utils/logger.js";
import config from "../../config/index.js";

/**
 * AI Service Layer — Powered by Anthropic Claude API
 * Features:
 * - Smart search with natural language understanding
 * - Drug interaction checking (Nigeria OTC focus)
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let anthropicClient: any = null;

function getAnthropicClient(): any | null {
  if (anthropicClient) return anthropicClient;

  if (!config.ANTHROPIC_API_KEY) {
    logger.debug("Anthropic API key not configured");
    return null;
  }

  try {
    // Dynamic import to handle optional dependency
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Anthropic = require("@anthropic-ai/sdk").default;
    anthropicClient = new Anthropic({
      apiKey: config.ANTHROPIC_API_KEY,
    });
    return anthropicClient;
  } catch (importError) {
    logger.warn("@anthropic-ai/sdk module not available", importError);
    return null;
  }
}

/**
 * Send a message to Claude and get a text response.
 */
async function callClaude(
  systemPrompt: string,
  userMessage: string,
  options?: {
    maxTokens?: number;
    temperature?: number;
    conversationHistory?: ChatAssistantMessage[];
  }
): Promise<string | null> {
  const client = getAnthropicClient();
  if (!client) return null;

  const messages: Array<{ role: "user" | "assistant"; content: string }> = [];

  if (options?.conversationHistory?.length) {
    messages.push(
      ...options.conversationHistory.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }))
    );
  }

  messages.push({ role: "user", content: userMessage });

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: options?.maxTokens ?? 1024,
      system: systemPrompt,
      messages,
    });

    const textBlock = response.content.find(
      (block: any) => block.type === "text"
    );
    return textBlock?.text ?? null;
  } catch (error) {
    logger.error("Claude API call failed:", error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class AIService {
  /**
   * Smart Search — Convert natural language query to structured search parameters
   * Example: "headache medicine near me" -> { symptoms: ["headache"], location: {...} }
   */
  static async smartSearch(
    query: string,
    userLocation?: { lat: number; lng: number }
  ): Promise<SmartSearchResult> {
    try {
      const systemPrompt = `You are a pharmacy search assistant for a Nigerian online pharmacy marketplace.
Analyze the user's search query and extract:
1. Drug categories (e.g., pain relief, cold medicine, vitamins)
2. Symptoms mentioned (e.g., headache, fever, cough)
3. Specific drug names if mentioned (use Nigerian market names where applicable)
4. Whether they want location-based search ("near me")

IMPORTANT: Only extract OTC (over-the-counter) drug information. If the query mentions prescription-only drugs, include a note but still extract what you can.

Respond ONLY with a JSON object (no additional text):
{
  "categories": ["string"],
  "symptoms": ["string"],
  "drugNames": ["string"],
  "wantsNearby": boolean,
  "confidence": 0.0-1.0
}`;

      const responseText = await callClaude(systemPrompt, query, {
        maxTokens: 300,
      });

      if (!responseText) {
        return { query, location: userLocation, confidence: 0 };
      }

      try {
        // Extract JSON from response (Claude may wrap in markdown code block)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(jsonMatch?.[0] ?? responseText);
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
        return { query, location: userLocation, confidence: 0 };
      }
    } catch (error) {
      logger.error("Smart search error:", error);
      return { query, location: userLocation, confidence: 0 };
    }
  }

  /**
   * Check Drug Interactions — Validate drug combinations for safety
   * Focused on Nigerian market OTC drugs
   */
  static async checkDrugInteractions(
    drugNames: string[]
  ): Promise<InteractionCheckResult> {
    try {
      if (drugNames.length < 2) {
        return { drugs: drugNames, interactions: [], warnings: [], safe: true };
      }

      const systemPrompt = `You are a pharmaceutical interaction checker for a Nigerian pharmacy marketplace.
Analyze the provided list of drugs and identify any known interactions.

IMPORTANT RULES:
1. Only flag REAL, well-documented interactions. If you are unsure, mark as safe.
2. Consider the Nigerian market context — common local brands may differ from international names.
3. For each interaction found, provide severity (mild/moderate/severe) and recommendation.
4. Flag if any drug is prescription-only in Nigeria (NAFDAC classification).

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

      const responseText = await callClaude(
        systemPrompt,
        `Check interactions for: ${drugNames.join(", ")}`,
        { maxTokens: 600 }
      );

      if (!responseText) {
        return { drugs: drugNames, interactions: [], warnings: [], safe: true };
      }

      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(jsonMatch?.[0] ?? responseText);
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
        return { drugs: drugNames, interactions: [], warnings: [], safe: true };
      }
    } catch (error) {
      logger.error("Drug interaction check error:", error);
      return { drugs: drugNames, interactions: [], warnings: [], safe: true };
    }
  }

  /**
   * Get Recommendations — Personalized product recommendations based on order history
   */
  static async getRecommendations(
    userId: string,
    orderHistory: any[],
    currentCart?: any[]
  ): Promise<RecommendationResult> {
    try {
      const orderSummary = orderHistory
        .slice(-10)
        .map((order: any) => {
          const items = order.items
            ?.map((item: any) => item.productName || item.name)
            .join(", ");
          return items || "unknown products";
        })
        .join(" | ");

      const cartSummary = currentCart
        ?.map((item: any) => item.productName || item.name)
        .join(", ");

      const systemPrompt = `You are a pharmacy product recommendation assistant for PharmaConnect, a Nigerian online pharmacy marketplace.

CRITICAL RULES:
1. Only recommend legitimate OTC (over-the-counter) products available in Nigeria.
2. NEVER suggest prescription drugs.
3. Consider common Nigerian health needs and locally available brands.
4. Provide reasoning for each recommendation.

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

      const responseText = await callClaude(systemPrompt, userPrompt, {
        maxTokens: 600,
      });

      if (!responseText) {
        return {
          recommendations: [],
          message: "Recommendations not available at this time",
        };
      }

      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(jsonMatch?.[0] ?? responseText);
        logger.info("Recommendations generated", {
          userId,
          recommendationCount: parsed.recommendations?.length || 0,
        });

        return {
          recommendations: parsed.recommendations || [],
          message: "Based on your purchase history",
        };
      } catch (parseError) {
        logger.warn("Failed to parse recommendations response", {
          responseText,
        });
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
   * Chat Assistant — Answer pharmacy-related questions and suggest OTC products
   * Maintains conversation context for follow-up questions
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
      const systemPrompt = `You are a friendly and helpful pharmacy chatbot for PharmaConnect, a Nigerian online pharmacy marketplace.

CRITICAL RULES:
1. NEVER recommend, discuss, or provide information about prescription drugs.
2. NEVER provide medical diagnoses or treatment plans.
3. ONLY discuss OTC (over-the-counter) products and general health information.
4. If asked about prescription drugs, politely decline and suggest consulting a healthcare professional or visiting a nearby pharmacy.
5. Always include appropriate medical disclaimers when discussing health topics.
6. Be helpful, informative, and professional.
7. Be aware of Nigerian market context — reference NAFDAC-approved OTC products when possible.
8. If a user appears to be seeking emergency medical help, direct them to call Nigerian emergency services (112) or visit the nearest hospital immediately.

YOUR ROLE:
- Answer questions about OTC products available on PharmaConnect
- Suggest appropriate OTC remedies for common ailments (with disclaimers)
- Provide general wellness information relevant to Nigerian users
- Help customers navigate product categories
- Direct users to healthcare professionals when needed

When suggesting products, be specific about category/type, not exact names (pharmacy staff will help find specific brands).

Always end health-related responses with: "Important: This is general information only, not medical advice. If symptoms persist, please consult a healthcare professional."`;

      const responseText = await callClaude(systemPrompt, message, {
        maxTokens: 600,
        conversationHistory: context?.conversationHistory,
      });

      if (!responseText) {
        return {
          response:
            "Chat assistant is not available at this time. Please contact support.",
          conversationContinued: false,
        };
      }

      logger.info("Chat assistant response generated", {
        inputLength: message.length,
        outputLength: responseText.length,
      });

      return {
        response: responseText,
        conversationContinued: true,
        disclaimers: responseText.includes("medical advice")
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
