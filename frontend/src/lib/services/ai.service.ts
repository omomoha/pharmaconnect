import { apiClient } from '../api';
import type { ApiResponse } from '@/shared/types';

/**
 * AI service for smart search, drug interactions, recommendations, and chat
 */

export interface SmartSearchResult {
  suggestions: string[];
  categories: string[];
  recommendedPharmacies: Array<{
    id: string;
    name: string;
    distance: number;
  }>;
}

export interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: 'info' | 'warning' | 'danger';
  description: string;
}

export interface DrugInteractionCheckResult {
  drugs: string[];
  interactions: DrugInteraction[];
}

export interface Recommendation {
  type: 'medication' | 'pharmacy' | 'health_tip';
  title: string;
  description: string;
  action?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  message: string;
  disclaimer?: string;
}

/**
 * Perform a smart search with AI suggestions and pharmacy recommendations
 */
export async function smartSearch(
  query: string,
  lat?: number,
  lng?: number
): Promise<ApiResponse<SmartSearchResult>> {
  try {
    const params: Record<string, string | number> = {
      q: query,
    };

    if (lat !== undefined) params.lat = lat;
    if (lng !== undefined) params.lng = lng;

    const response = await apiClient.get('/ai/search', { params });
    return response;
  } catch (error) {
    console.error('Smart search failed:', error);
    return {
      success: false,
      error: {
        code: 'SMART_SEARCH_ERROR',
        message: 'Failed to perform smart search',
      },
    };
  }
}

/**
 * Check for drug interactions between multiple drugs
 */
export async function checkDrugInteractions(
  drugs: string[]
): Promise<ApiResponse<DrugInteractionCheckResult>> {
  try {
    const response = await apiClient.post('/ai/drug-interactions', { drugs });
    return response;
  } catch (error) {
    console.error('Drug interaction check failed:', error);
    return {
      success: false,
      error: {
        code: 'DRUG_INTERACTION_ERROR',
        message: 'Failed to check drug interactions',
      },
    };
  }
}

/**
 * Get personalized recommendations for the user
 */
export async function getRecommendations(): Promise<
  ApiResponse<Recommendation[]>
> {
  try {
    const response = await apiClient.get('/ai/recommendations');
    return response;
  } catch (error) {
    console.error('Failed to get recommendations:', error);
    return {
      success: false,
      error: {
        code: 'RECOMMENDATIONS_ERROR',
        message: 'Failed to get recommendations',
      },
    };
  }
}

/**
 * Chat with the AI assistant about health and medications
 */
export async function chatWithAssistant(
  message: string,
  conversationHistory?: ChatMessage[]
): Promise<ApiResponse<ChatResponse>> {
  try {
    const payload = {
      message,
      history: conversationHistory || [],
    };

    const response = await apiClient.post('/ai/chat', payload);
    return response;
  } catch (error) {
    console.error('Chat with assistant failed:', error);
    return {
      success: false,
      error: {
        code: 'CHAT_ERROR',
        message: 'Failed to send message to assistant',
      },
    };
  }
}

export const aiService = {
  smartSearch,
  checkDrugInteractions,
  getRecommendations,
  chatWithAssistant,
};
