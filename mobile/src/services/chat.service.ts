import { apiClient } from '../lib/api';

export const chatService = {
  getConversations: () => apiClient.get('/chat/conversations'),

  getConversation: (id: string) => apiClient.get(`/chat/conversations/${id}`),

  getMessages: (conversationId: string, params?: { limit?: number; before?: string }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.before) query.set('before', params.before);
    const qs = query.toString();
    return apiClient.get(`/chat/conversations/${conversationId}/messages${qs ? `?${qs}` : ''}`);
  },

  startConversation: (data: { participantId: string; participantRole: string }) =>
    apiClient.post('/chat/conversations', data),
};
