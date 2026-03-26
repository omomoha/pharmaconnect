'use client';

import { useCallback, useEffect, useState } from 'react';
import { chatService } from '@/lib/services';
import type { Conversation, Message } from '@/shared/types';

/**
 * Hook for fetching all conversations for current user
 */
export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await chatService.getConversations();

      if (response.success && response.data) {
        setConversations(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch conversations');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch conversations';
      setError(message);
      console.error('useConversations error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const refetch = () => fetchConversations();

  return {
    conversations,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook for fetching a specific conversation with messages
 * @param conversationId - ID of the conversation
 */
export function useConversation(conversationId: string) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);

  const fetchConversation = async () => {
    if (!conversationId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await chatService.getConversation(conversationId);

      if (response.success && response.data) {
        setConversation(response.data.conversation);
        setMessages(response.data.messages);
      } else {
        setError(response.error?.message || 'Failed to fetch conversation');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch conversation';
      setError(message);
      console.error('useConversation error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversation();
  }, [conversationId]);

  /**
   * Send a message in the conversation
   */
  const sendMessage = useCallback(
    async (content: string, imageUrl?: string): Promise<Message | null> => {
      if (!conversationId) {
        console.error('No conversation ID provided');
        return null;
      }

      try {
        setSendingMessage(true);
        const response = await chatService.sendMessage(conversationId, {
          content,
          imageUrl,
        });

        if (response.success && response.data) {
          // Optimistically add message to local state
          setMessages((prev) => [...prev, response.data as Message]);
          return response.data;
        } else {
          setError(response.error?.message || 'Failed to send message');
          return null;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send message';
        setError(message);
        console.error('sendMessage error:', err);
        return null;
      } finally {
        setSendingMessage(false);
      }
    },
    [conversationId]
  );

  /**
   * Mark a message as read
   */
  const markAsRead = useCallback(
    async (messageId: string): Promise<boolean> => {
      if (!conversationId) {
        console.error('No conversation ID provided');
        return false;
      }

      try {
        const response = await chatService.markAsRead(conversationId, messageId);

        if (response.success) {
          // Update message in local state
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId ? { ...msg, readAt: new Date() } : msg
            )
          );
          return true;
        } else {
          console.error('Failed to mark message as read');
          return false;
        }
      } catch (err) {
        console.error('markAsRead error:', err);
        return false;
      }
    },
    [conversationId]
  );

  const refetch = () => fetchConversation();

  return {
    conversation,
    messages,
    loading,
    error,
    sendingMessage,
    sendMessage,
    markAsRead,
    refetch,
  };
}
