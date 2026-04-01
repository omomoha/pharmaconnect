import { apiClient } from '../lib/api';
import type { ApiResponse } from '@shared/types';

/**
 * AI service for smart search, drug interactions, recommendations, and chat
 */

export interface SmartSearchResult {
  query: string;
  categories: string[];
  symptoms: string[];
  drugNames: string[];
  location?: { lat: number; lng: number };
  confidence: number;
}

export interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: 'mild' | 'moderate' | 'severe';
  description: string;
  recommendation: string;
}

export interface DrugInteractionCheckResult {
  drugs: string[];
  interactions: DrugInteraction[];
  warnings: string[];
  safe: boolean;
}

export interface Recommendation {
  productId: string;
  productName: string;
  category: string;
  reason: string;
  confidence: number;
}

export interface RecommendationsResult {
  recommendations: Recommendation[];
  message: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  response: string;
  conversationContinued: boolean;
  disclaimers: string[];
}

export const aiService = {
  /**
   * Perform a smart search with AI suggestions and pharmacy recommendations
   */
  smartSearch: (
    query: string,
    lat?: number,
    lng?: number
  ): Promise<ApiResponse<SmartSearchResult>> => {
    const payload: Record<string, string | number> = { query };
    if (lat !== undefined) payload.lat = lat;
    if (lng !== undefined) payload.lng = lng;

    return apiClient.post('/ai/search', payload);
  },

  /**
   * Check for drug interactions between multiple drugs
   */
  checkDrugInteractions: (
    drugs: string[]
  ): Promise<ApiResponse<DrugInteractionCheckResult>> => {
    return apiClient.post('/ai/interactions', { drugs });
  },

  /**
   * Get personalized recommendations for the user
   */
  getRecommendations: (): Promise<ApiResponse<RecommendationsResult>> => {
    return apiClient.get('/ai/recommendations');
  },

  /**
   * Chat with the AI assistant about health and medications
   */
  chatWithAssistant: (
    message: string,
    conversationHistory?: ChatMessage[]
  ): Promise<ApiResponse<ChatResponse>> => {
    const payload = {
      message,
      conversationHistory: conversationHistory || [],
    };

    return apiClient.post('/ai/chat', payload);
  },
};
