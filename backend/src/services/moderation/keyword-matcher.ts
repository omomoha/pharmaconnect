import { PRESCRIPTION_KEYWORDS } from "@pharmaconnect/shared/dist/constants/index.js";

/**
 * Keyword matcher for prescription drug detection
 * Layer 1 of chat moderation pipeline
 */

export interface ModerationResult {
  flagged: boolean;
  keywords: string[];
  category?: string;
}

/**
 * Check message content for prescription drug keywords
 */
export const moderateMessage = (content: string): ModerationResult => {
  const lowerContent = content.toLowerCase();
  const detectedKeywords: string[] = [];
  let category: string | undefined;

  // Check antibiotic keywords
  for (const keyword of PRESCRIPTION_KEYWORDS.ANTIBIOTICS) {
    if (lowerContent.includes(keyword)) {
      detectedKeywords.push(keyword);
      category = "antibiotics";
    }
  }

  // Check controlled substance keywords
  for (const keyword of PRESCRIPTION_KEYWORDS.CONTROLLED) {
    if (lowerContent.includes(keyword)) {
      detectedKeywords.push(keyword);
      category = "controlled_substance";
    }
  }

  // Check prescription phrase keywords
  for (const phrase of PRESCRIPTION_KEYWORDS.PRESCRIPTION_PHRASES) {
    if (lowerContent.includes(phrase)) {
      detectedKeywords.push(phrase);
      category = "prescription_phrase";
    }
  }

  // Check contextual keywords
  for (const phrase of PRESCRIPTION_KEYWORDS.CONTEXTUAL) {
    if (lowerContent.includes(phrase)) {
      detectedKeywords.push(phrase);
      category = "contextual";
    }
  }

  // Remove duplicates
  const uniqueKeywords = [...new Set(detectedKeywords)];

  return {
    flagged: uniqueKeywords.length > 0,
    keywords: uniqueKeywords,
    category,
  };
};

/**
 * Check if text mentions specific OTC drugs
 */
export const isOTCDrug = (content: string): boolean => {
  const lowerContent = content.toLowerCase();

  // This would be more sophisticated in production
  // Could use fuzzy matching or database lookup
  const commonOtcKeywords = [
    "paracetamol",
    "acetaminophen",
    "ibuprofen",
    "aspirin",
    "vitamin",
    "supplement",
    "antacid",
  ];

  return commonOtcKeywords.some((keyword) => lowerContent.includes(keyword));
};

/**
 * Calculate risk score for a message
 */
export const calculateRiskScore = (content: string): number => {
  const result = moderateMessage(content);

  if (!result.flagged) {
    return 0;
  }

  // Risk increases with number of keywords detected
  let riskScore = Math.min(result.keywords.length * 0.2, 1);

  // Higher risk for controlled substance mentions
  if (result.category === "controlled_substance") {
    riskScore += 0.3;
  }

  // Higher risk for explicit prescription phrases
  if (result.category === "prescription_phrase") {
    riskScore += 0.2;
  }

  return Math.min(riskScore, 1);
};

/**
 * Get moderation recommendation
 */
export const getModerationAction = (content: string): string => {
  const riskScore = calculateRiskScore(content);

  if (riskScore === 0) {
    return "allow";
  } else if (riskScore < 0.5) {
    return "review";
  } else if (riskScore < 0.8) {
    return "flag";
  } else {
    return "block";
  }
};
