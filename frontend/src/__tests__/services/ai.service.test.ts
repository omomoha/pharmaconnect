import { aiService } from '@/lib/services/ai.service';
import { apiClient } from '@/lib/api';

// Mock the API client
jest.mock('@/lib/api', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

const mockedPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;
const mockedGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;

describe('AI Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('smartSearch', () => {
    it('should call /ai/search with query', async () => {
      const mockResponse = {
        success: true,
        data: {
          query: 'headache',
          categories: ['Pain Relief'],
          symptoms: ['Headache'],
          drugNames: ['Paracetamol', 'Ibuprofen'],
          confidence: 0.92,
        },
      };
      mockedPost.mockResolvedValue(mockResponse);

      const result = await aiService.smartSearch('headache');

      expect(mockedPost).toHaveBeenCalledWith('/ai/search', { query: 'headache' });
      expect(result.success).toBe(true);
      expect(result.data?.drugNames).toContain('Paracetamol');
    });

    it('should include lat/lng when provided', async () => {
      mockedPost.mockResolvedValue({ success: true, data: { query: 'pharmacy', categories: [], symptoms: [], drugNames: [], confidence: 0.5 } });

      await aiService.smartSearch('pharmacy', 6.5, 3.4);

      expect(mockedPost).toHaveBeenCalledWith('/ai/search', { query: 'pharmacy', lat: 6.5, lng: 3.4 });
    });

    it('should handle API errors gracefully', async () => {
      mockedPost.mockRejectedValue(new Error('Network error'));

      const result = await aiService.smartSearch('test');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SMART_SEARCH_ERROR');
    });

    it('should return error on empty response', async () => {
      mockedPost.mockResolvedValue({ success: false, error: { code: 'ERR', message: 'Failed' } });

      const result = await aiService.smartSearch('unknown');

      expect(result.success).toBe(false);
    });
  });

  describe('checkDrugInteractions', () => {
    it('should call /ai/interactions with drug list', async () => {
      const mockResponse = {
        success: true,
        data: {
          drugs: ['Ibuprofen', 'Aspirin'],
          interactions: [{
            drug1: 'Ibuprofen',
            drug2: 'Aspirin',
            severity: 'moderate' as const,
            description: 'Both are NSAIDs',
            recommendation: 'Avoid taking together',
          }],
          warnings: ['Consult a doctor'],
          safe: false,
        },
      };
      mockedPost.mockResolvedValue(mockResponse);

      const result = await aiService.checkDrugInteractions(['Ibuprofen', 'Aspirin']);

      expect(mockedPost).toHaveBeenCalledWith('/ai/interactions', { drugs: ['Ibuprofen', 'Aspirin'] });
      expect(result.success).toBe(true);
      expect(result.data?.safe).toBe(false);
      expect(result.data?.interactions).toHaveLength(1);
      expect(result.data?.interactions[0].severity).toBe('moderate');
    });

    it('should handle no interactions found', async () => {
      const mockResponse = {
        success: true,
        data: {
          drugs: ['Paracetamol', 'Vitamin C'],
          interactions: [],
          warnings: [],
          safe: true,
        },
      };
      mockedPost.mockResolvedValue(mockResponse);

      const result = await aiService.checkDrugInteractions(['Paracetamol', 'Vitamin C']);

      expect(result.data?.safe).toBe(true);
      expect(result.data?.interactions).toHaveLength(0);
    });

    it('should handle API errors gracefully', async () => {
      mockedPost.mockRejectedValue(new Error('Server error'));

      const result = await aiService.checkDrugInteractions(['Drug1']);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DRUG_INTERACTION_ERROR');
    });
  });

  describe('getRecommendations', () => {
    it('should call /ai/recommendations', async () => {
      const mockResponse = {
        success: true,
        data: {
          recommendations: [{
            productId: 'prod-1',
            productName: 'Vitamin D3',
            category: 'Vitamins',
            reason: 'Based on your purchase history',
            confidence: 0.85,
          }],
          message: 'Personalized recommendations',
        },
      };
      mockedGet.mockResolvedValue(mockResponse);

      const result = await aiService.getRecommendations();

      expect(mockedGet).toHaveBeenCalledWith('/ai/recommendations');
      expect(result.success).toBe(true);
      expect(result.data?.recommendations).toHaveLength(1);
    });

    it('should handle API errors gracefully', async () => {
      mockedGet.mockRejectedValue(new Error('Auth required'));

      const result = await aiService.getRecommendations();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('RECOMMENDATIONS_ERROR');
    });
  });

  describe('chatWithAssistant', () => {
    it('should call /ai/chat with message and history', async () => {
      const mockResponse = {
        success: true,
        data: {
          response: 'For a headache, you can take paracetamol.',
          conversationContinued: true,
          disclaimers: ['Not medical advice'],
        },
      };
      mockedPost.mockResolvedValue(mockResponse);

      const history = [{ role: 'user' as const, content: 'Hello' }];
      const result = await aiService.chatWithAssistant('headache remedies', history);

      expect(mockedPost).toHaveBeenCalledWith('/ai/chat', {
        message: 'headache remedies',
        conversationHistory: history,
      });
      expect(result.success).toBe(true);
      expect(result.data?.response).toContain('paracetamol');
      expect(result.data?.disclaimers).toContain('Not medical advice');
    });

    it('should default to empty conversation history', async () => {
      mockedPost.mockResolvedValue({ success: true, data: { response: 'Hi', conversationContinued: false, disclaimers: [] } });

      await aiService.chatWithAssistant('Hello');

      expect(mockedPost).toHaveBeenCalledWith('/ai/chat', {
        message: 'Hello',
        conversationHistory: [],
      });
    });

    it('should handle API errors gracefully', async () => {
      mockedPost.mockRejectedValue(new Error('Timeout'));

      const result = await aiService.chatWithAssistant('test');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CHAT_ERROR');
    });
  });
});
