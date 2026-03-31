import { chatService } from '../../services/chat.service';
import { apiClient } from '../../lib/api';

jest.mock('../../lib/api');

describe('ChatService', () => {
  const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getConversations', () => {
    it('should fetch all conversations', async () => {
      const mockConversations = [
        {
          id: 'conv1',
          participantId: 'p1',
          lastMessage: 'Hello',
          updatedAt: '2026-03-31T10:00:00Z',
        },
        {
          id: 'conv2',
          participantId: 'p2',
          lastMessage: 'Hi there',
          updatedAt: '2026-03-31T09:00:00Z',
        },
      ];

      mockApiClient.get.mockResolvedValueOnce({
        success: true,
        data: mockConversations,
      });

      const result = await chatService.getConversations();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockConversations);
      expect(mockApiClient.get).toHaveBeenCalledWith('/chat/conversations');
    });

    it('should return empty list if no conversations exist', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        success: true,
        data: [],
      });

      const result = await chatService.getConversations();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should handle API errors when fetching conversations', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        success: false,
        error: { message: 'Failed to fetch conversations' },
      });

      const result = await chatService.getConversations();

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Failed to fetch conversations');
    });
  });

  describe('getConversation', () => {
    it('should fetch a single conversation by ID', async () => {
      const mockConversation = {
        id: 'conv1',
        participantId: 'p1',
        participantName: 'Pharmacy A',
        lastMessage: 'Thank you for ordering',
        updatedAt: '2026-03-31T10:00:00Z',
      };

      mockApiClient.get.mockResolvedValueOnce({
        success: true,
        data: mockConversation,
      });

      const result = await chatService.getConversation('conv1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockConversation);
      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/chat/conversations/conv1'
      );
    });

    it('should handle conversation not found error', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        success: false,
        error: { message: 'Conversation not found' },
      });

      const result = await chatService.getConversation('invalid-id');

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Conversation not found');
    });

    it('should call API with correct conversation ID', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        success: true,
        data: {},
      });

      await chatService.getConversation('conv-abc-123');

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/chat/conversations/conv-abc-123'
      );
    });
  });

  describe('getMessages', () => {
    it('should fetch messages for a conversation without pagination params', async () => {
      const mockMessages = [
        {
          id: 'm1',
          conversationId: 'conv1',
          senderId: 'user1',
          text: 'Hi',
          createdAt: '2026-03-31T10:00:00Z',
        },
        {
          id: 'm2',
          conversationId: 'conv1',
          senderId: 'user2',
          text: 'Hello',
          createdAt: '2026-03-31T10:01:00Z',
        },
      ];

      mockApiClient.get.mockResolvedValueOnce({
        success: true,
        data: mockMessages,
      });

      const result = await chatService.getMessages('conv1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMessages);
      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/chat/conversations/conv1/messages'
      );
    });

    it('should fetch messages with limit parameter', async () => {
      const mockMessages: any[] = [];

      mockApiClient.get.mockResolvedValueOnce({
        success: true,
        data: mockMessages,
      });

      const result = await chatService.getMessages('conv1', { limit: 20 });

      expect(result.success).toBe(true);
      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/chat/conversations/conv1/messages?limit=20'
      );
    });

    it('should fetch messages with before parameter for pagination', async () => {
      const mockMessages: any[] = [];

      mockApiClient.get.mockResolvedValueOnce({
        success: true,
        data: mockMessages,
      });

      const result = await chatService.getMessages('conv1', {
        before: 'm100',
      });

      expect(result.success).toBe(true);
      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/chat/conversations/conv1/messages?before=m100'
      );
    });

    it('should fetch messages with both limit and before parameters', async () => {
      const mockMessages: any[] = [];

      mockApiClient.get.mockResolvedValueOnce({
        success: true,
        data: mockMessages,
      });

      const result = await chatService.getMessages('conv1', {
        limit: 15,
        before: 'm100',
      });

      expect(result.success).toBe(true);
      expect(mockApiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('limit=15')
      );
      expect(mockApiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('before=m100')
      );
    });

    it('should handle API errors when fetching messages', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        success: false,
        error: { message: 'Failed to fetch messages' },
      });

      const result = await chatService.getMessages('conv1');

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Failed to fetch messages');
    });

    it('should return empty messages list if no messages exist', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        success: true,
        data: [],
      });

      const result = await chatService.getMessages('conv1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should handle conversation not found when fetching messages', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        success: false,
        error: { message: 'Conversation not found' },
      });

      const result = await chatService.getMessages('invalid-conv');

      expect(result.success).toBe(false);
    });
  });

  describe('startConversation', () => {
    it('should start a new conversation with a participant', async () => {
      const conversationData = {
        participantId: 'p1',
        participantRole: 'pharmacy_admin',
      };

      const mockResponse = {
        id: 'conv1',
        ...conversationData,
        createdAt: '2026-03-31T10:00:00Z',
      };

      mockApiClient.post.mockResolvedValueOnce({
        success: true,
        data: mockResponse,
      });

      const result = await chatService.startConversation(conversationData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/chat/conversations',
        conversationData
      );
    });

    it('should handle error when starting conversation with invalid participant', async () => {
      const conversationData = {
        participantId: 'invalid-id',
        participantRole: 'pharmacy_admin',
      };

      mockApiClient.post.mockResolvedValueOnce({
        success: false,
        error: { message: 'Participant not found' },
      });

      const result = await chatService.startConversation(conversationData);

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Participant not found');
    });

    it('should handle error when conversation already exists', async () => {
      const conversationData = {
        participantId: 'p1',
        participantRole: 'pharmacy_admin',
      };

      mockApiClient.post.mockResolvedValueOnce({
        success: false,
        error: { message: 'Conversation already exists' },
      });

      const result = await chatService.startConversation(conversationData);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('already exists');
    });

    it('should start conversation with delivery_admin role', async () => {
      const conversationData = {
        participantId: 'p2',
        participantRole: 'delivery_admin',
      };

      mockApiClient.post.mockResolvedValueOnce({
        success: true,
        data: { id: 'conv2', ...conversationData },
      });

      const result = await chatService.startConversation(conversationData);

      expect(result.success).toBe(true);
      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/chat/conversations',
        conversationData
      );
    });
  });
});
