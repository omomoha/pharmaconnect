import logger from "../../utils/logger.js";
import config from "../../config/index.js";

/**
 * NLP Classifier for message moderation
 * Layer 2 of chat moderation pipeline
 * Uses OpenAI API for advanced prescription drug detection
 */

export interface NLPClassificationResult {
  flagged: boolean;
  action: "allow" | "review" | "flag" | "block";
  confidence?: number;
  reason?: string;
}

/**
 * Classify message using OpenAI API
 * Falls back gracefully if API key is not configured or openai library is not installed
 */
export const classifyMessage = async (
  content: string
): Promise<NLPClassificationResult> => {
  try {
    // If OpenAI API is not configured, skip this layer
    if (!config.OPENAI_API_KEY) {
      logger.debug("OpenAI API not configured, skipping NLP classification");
      return {
        flagged: false,
        action: "allow",
      };
    }

    // Try to dynamically import and use OpenAI client
    // Using require to avoid TypeScript compile-time checks
    let openai: any;
    try {
      // @ts-ignore - Dynamic import to handle optional dependency
      const OpenAI = require("openai").default;
      openai = new OpenAI({
        apiKey: config.OPENAI_API_KEY,
      });
    } catch (importError) {
      logger.warn("OpenAI module not available, skipping NLP classification", importError);
      return {
        flagged: false,
        action: "allow",
      };
    }

    // Create moderation prompt
    const systemPrompt = `You are a pharmaceutical compliance moderator. Analyze the following text and determine if it contains:
1. Explicit requests for prescription drugs
2. Attempts to circumvent prescription requirements
3. Instructions for obtaining controlled substances

Respond with a JSON object containing:
- flagged: boolean (true if prescription drug related)
- confidence: number between 0 and 1
- reason: brief explanation (if flagged)

Be conservative - err on the side of caution for ambiguous cases.`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: content,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent results
      max_tokens: 200,
    });

    const responseText = response.choices[0]?.message?.content || "";

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.warn("Failed to parse OpenAI response:", responseText);
      return {
        flagged: false,
        action: "allow",
      };
    }

    const classification = JSON.parse(jsonMatch[0]);

    // Map confidence to action
    const confidence = classification.confidence || 0;
    let action: "allow" | "review" | "flag" | "block" = "allow";

    if (classification.flagged) {
      if (confidence >= 0.8) {
        action = "block";
      } else if (confidence >= 0.5) {
        action = "flag";
      } else {
        action = "review";
      }
    }

    logger.info("NLP classification completed", {
      flagged: classification.flagged,
      confidence,
      action,
    });

    return {
      flagged: classification.flagged,
      confidence,
      action,
      reason: classification.reason,
    };
  } catch (error) {
    logger.warn("NLP classification error:", error);
    // On error, return neutral result
    return {
      flagged: false,
      action: "allow",
    };
  }
};

/**
 * Extract prescription-related entities from text
 */
export const extractPrescriptionEntities = (content: string): string[] => {
  const entities: string[] = [];

  // Common prescription drug names
  const prescriptionPatterns = [
    /\b(amoxicillin|penicillin|azithromycin|ciprofloxacin|lisinopril|metformin|atorvastatin|omeprazole|sertraline|escitalopram|alprazolam|lorazepam|diazepam|codeine|morphine|oxycodone|hydrocodone|tramadol|fentanyl|adderall|ritalin|concerta|xanax|valium)\b/gi,
    /\b(prescription|rx|refill|pharmacy|controlled substance|dea|scheduled|narcotic)\b/gi,
  ];

  for (const pattern of prescriptionPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      entities.push(...matches.map((m) => m.toLowerCase()));
    }
  }

  return [...new Set(entities)]; // Remove duplicates
};

/**
 * Calculate risk score based on NLP classification
 */
export const calculateNLPRiskScore = (
  classification: NLPClassificationResult
): number => {
  if (!classification.flagged) {
    return 0;
  }

  return classification.confidence || 0.5;
};
