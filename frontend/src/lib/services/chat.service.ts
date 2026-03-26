import { apiClient } from '../api';
import type {
  ApiResponse,
  Conversation,
  ConversationType,
  Message,
} from '@/shared/types';

/**
 * Chat service for managing conversations and messages
 */

export interface CreateConversationData {
  type: ConversationType;
  pharmacyId?: string;
  deliveryRiderId?: string;
}

export interface SendMessageData {
  content: string;
  imageUrl?: string;
}

export interface ConversationDetailsResponse {
  conversation: Conversation;
  messages: Message[];
}

/**
 * Create a new conversation
 */
export async function createConversation(
  data: CreateConversationData
): Promise<ApiResponse<Conversation>> {
  try {
    const response = await apiClient.post('/chat/conversations', data);
    return response;
  } catch (error) {
    console.error('Failed to create conversation:', error);
    return {
      success: false,
      error: {
        code: 'CREATE_CONVERSATION_ERROR',
        message: 'Failed to create conversation',
      },
    };
  }
}

/**
 * Get all conversations for the current user
 */
export async function getConversations(): Promise<ApiResponse<Conversation[]>> {
  try {
    const response = await apiClient.get('/chat/conversations');
    return response;
  } catch (error) {
    console.error('Failed to fetch conversations:', error);
    return {
      success: false,
      error: {
        code: 'FETCH_CONVERSATIONS_ERROR',
        message: 'Failed to fetch conversations',
      },
    };
  }
}

/**
 * Get a specific conversation with all its messages
 */
export async function getConversation(
  id: string
): Promise<ApiResponse<ConversationDetailsResponse>> {
  try {
    const response = await apiClient.get(`/chat/conversations/${id}`);
    return response;
  } catch (error) {
    console.error('Failed to fetch conversation:', error);
    return {
      success: false,
      error: {
        code: 'FETCH_CONVERSATION_ERROR',
        message: 'Failed to fetch conversation',
      },
    };
  }
}

/**
 * Send a message in a conversation
 */
export async function sendMessage(
  conversationId: string,
  data: SendMessageData
): Promise<ApiResponse<Message>> {
  try {
    const response = await apiClient.post(
      `/chat/conversations/${conversationId}/messages`,
      data
    );
    return response;
  } catch (error) {
    console.error('Failed to send message:', error);
    return {
      success: false,
      error: {
        code: 'SEND_MESSAGE_ERROR',
        message: 'Failed to send message',
      },
    };
  }
}

/**
 * Mark a message as read
 */
export async function markAsRead(
  conversationId: string,
  messageId: string
): Promise<ApiResponse<void>> {
  try {
    const response = await apiClient.patch(
      `/chat/conversations/${conversationId}/messages/${messageId}/read`,
      {}
    );
    return response;
  } catch (error) {
    console.error('Failed to mark message as read:', error);
    return {
      success: false,
      error: {
        code: 'MARK_READ_ERROR',
        message: 'Failed to mark message as read',
      },
    };
  }
}

/**
 * Close a conversation
 */
export async function closeConversation(
  conversationId: string
): Promise<ApiResponse<Conversation>> {
  try {
    const response = await apiClient.post(
      `/chat/conversations/${conversationId}/close`,
      {}
    );
    return response;
  } catch (error) {
    console.error('Failed to close conversation:', error);
    return {
      success: false,
      error: {
        code: 'CLOSE_CONVERSATION_ERROR',
        message: 'Failed to close conversation',
      },
    };
  }
}
