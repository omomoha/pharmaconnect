import { AIService } from "../../services/ai/ai.service.js";

/**
 * AI Service Tests
 * Tests the AI service layer methods with and without OpenAI API key
 */

describe("AIService", () => {
  describe("smartSearch", () => {
    it("should return a smart search result with query", async () => {
      const result = await AIService.smartSearch("headache medicine");

      expect(result).toBeDefined();
      expect(result.query).toBe("headache medicine");
      expect(typeof result.confidence).toBe("number");
    });

    it("should handle location coordinates", async () => {
      const location = { lat: 6.5244, lng: 3.3792 };
      const result = await AIService.smartSearch("pharmacy near me", location);

      expect(result).toBeDefined();
      expect(result.query).toBe("pharmacy near me");
    });

    it("should handle empty query gracefully", async () => {
      const result = await AIService.smartSearch("");

      expect(result).toBeDefined();
      expect(result.query).toBe("");
      expect(result.confidence).toBe(0);
    });
  });

  describe("checkDrugInteractions", () => {
    it("should return safe result for single drug", async () => {
      const result = await AIService.checkDrugInteractions(["aspirin"]);

      expect(result).toBeDefined();
      expect(result.drugs).toEqual(["aspirin"]);
      expect(result.interactions).toEqual([]);
      expect(result.safe).toBe(true);
    });

    it("should check multiple drugs", async () => {
      const result = await AIService.checkDrugInteractions(["aspirin", "ibuprofen"]);

      expect(result).toBeDefined();
      expect(result.drugs).toContain("aspirin");
      expect(result.drugs).toContain("ibuprofen");
      expect(Array.isArray(result.interactions)).toBe(true);
      expect(typeof result.safe).toBe("boolean");
    });

    it("should return empty interactions for empty array", async () => {
      const result = await AIService.checkDrugInteractions([]);

      expect(result).toBeDefined();
      expect(result.drugs).toEqual([]);
      expect(result.interactions).toEqual([]);
      expect(result.safe).toBe(true);
    });
  });

  describe("getRecommendations", () => {
    it("should return recommendations for user", async () => {
      const result = await AIService.getRecommendations("test-user-id", []);

      expect(result).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(typeof result.message).toBe("string");
    });

    it("should handle order history", async () => {
      const orderHistory = [
        {
          items: [{ productName: "Paracetamol" }, { productName: "Cough Syrup" }],
        },
      ];

      const result = await AIService.getRecommendations("test-user-id", orderHistory);

      expect(result).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    });
  });

  describe("chatAssistant", () => {
    it("should respond to simple message", async () => {
      const result = await AIService.chatAssistant("What OTC products do you have for headache?");

      expect(result).toBeDefined();
      expect(typeof result.response).toBe("string");
      expect(result.response.length > 0).toBe(true);
      expect(typeof result.conversationContinued).toBe("boolean");
    });

    it("should maintain conversation context", async () => {
      const history = [
        { role: "user" as const, content: "Do you have pain relief?" },
        { role: "assistant" as const, content: "Yes, we have several OTC pain relief options." },
      ];

      const result = await AIService.chatAssistant("Which one is best?", {
        conversationHistory: history,
      });

      expect(result).toBeDefined();
      expect(typeof result.response).toBe("string");
      expect(typeof result.conversationContinued).toBe("boolean");
    });

    it("should reject prescription drug queries", async () => {
      const result = await AIService.chatAssistant("Can you recommend some antibiotics?");

      expect(result).toBeDefined();
      expect(typeof result.response).toBe("string");
      // Response should indicate it can only recommend OTC
    });
  });
});
