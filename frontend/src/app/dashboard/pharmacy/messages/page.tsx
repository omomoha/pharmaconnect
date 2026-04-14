'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PageHeader from '@/components/ui/PageHeader';
import TypingIndicator from '@/components/chat/TypingIndicator';
import { joinChatRoom, sendChatMessage, onChatMessageReceive, emitTyping, emitStoppedTyping, onTyping } from '@/lib/socket';
import { getConversations, getConversation } from '@/lib/services/chat.service';

interface Message {
  id: string;
  sender: 'pharmacy' | 'customer';
  text: string;
  timestamp: string;
  readAt?: Date;
}

interface Conversation {
  id: string;
  customerName: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  status?: string;
  orderNumber: string;
  messages: Message[];
}


export default function PharmacyMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [apiLoaded, setApiLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [showMobileList, setShowMobileList] = useState(true);
  const [typingUsers, setTypingUsers] = useState<{ [key: string]: string }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  );

  // Fetch conversations from API on mount
  useEffect(() => {
    const fetchConversationsFromApi = async () => {
      try {
        setLoading(true);
        const res = await getConversations();
        if (res.success && res.data) {
          const apiConvs = Array.isArray(res.data) ? res.data : (res.data as any).conversations || [];
          const mapped: Conversation[] = apiConvs.map((conv: any) => ({
            id: conv.id,
            customerName: conv.customerName || conv.participantName || 'Customer',
            avatar: (conv.customerName || conv.participantName || 'C')[0].toUpperCase(),
            orderNumber: conv.orderId || '',
            lastMessage: conv.lastMessage || '',
            lastMessageTime: conv.updatedAt ? new Date(conv.updatedAt._seconds ? conv.updatedAt._seconds * 1000 : conv.updatedAt).toLocaleTimeString() : '',
            unreadCount: conv.unreadCount || 0,
            status: conv.status || 'active',
            messages: [],
          }));
          setConversations(mapped);
          if (mapped.length > 0) {
            setActiveConversationId(mapped[0].id);
          }
          setApiLoaded(true);
        }
      } catch (error) {
        console.error('Failed to fetch conversations from API:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchConversationsFromApi();
  }, []);

  // Fetch messages when active conversation changes (for API-loaded conversations)
  useEffect(() => {
    if (!apiLoaded || !activeConversationId) return;
    const fetchMessages = async () => {
      try {
        const res = await getConversation(activeConversationId);
        if (res.success && res.data) {
          const msgs = (res.data as any).messages || [];
          const mapped = msgs.map((m: any) => ({
            id: m.id,
            sender: m.senderId === 'pharmacy' ? 'pharmacy' : 'customer',
            text: m.content || m.text || '',
            timestamp: m.createdAt ? new Date(m.createdAt._seconds ? m.createdAt._seconds * 1000 : m.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '',
          }));
          setConversations((prev) =>
            prev.map((c) =>
              c.id === activeConversationId ? { ...c, messages: mapped } : c
            )
          );
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    };
    fetchMessages();
  }, [activeConversationId, apiLoaded]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  // Socket setup
  useEffect(() => {
    if (activeConversationId) {
      joinChatRoom(activeConversationId);

      const handleIncomingMessage = (message: any) => {
        if (message.conversationId === activeConversationId) {
          setConversations((prevConversations) =>
            prevConversations.map((conv) =>
              conv.id === activeConversationId
                ? {
                    ...conv,
                    messages: [
                      ...conv.messages,
                      {
                        id: message.id,
                        sender: 'customer' as const,
                        text: message.text,
                        timestamp: new Date(message.timestamp).toLocaleTimeString(
                          'en-US',
                          {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          }
                        ),
                      },
                    ],
                  }
                : conv
            )
          );
        }
      };

      const handleTyping = (data: any) => {
        if (data.conversationId === activeConversationId && data.userId) {
          setTypingUsers((prev) => ({
            ...prev,
            [data.userId]: data.userName || 'User',
          }));
        }
      };

      onChatMessageReceive(handleIncomingMessage);
      const unsubscribeTyping = onTyping(handleTyping);

      return () => {
        unsubscribeTyping();
      };
    }
  }, [activeConversationId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    if (activeConversationId) emitTyping(activeConversationId);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (activeConversationId) emitStoppedTyping(activeConversationId);
    }, 2000);
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !activeConversation || !activeConversationId) return;

    emitStoppedTyping(activeConversationId);

    const updatedConversations = conversations.map((conv) => {
      if (conv.id === activeConversationId) {
        return {
          ...conv,
          lastMessage: messageInput,
          lastMessageTime: 'Just now',
          messages: [
            ...conv.messages,
            {
              id: String(Date.now()),
              sender: 'pharmacy' as const,
              text: messageInput,
              timestamp: new Date().toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              }),
              readAt: new Date(),
            },
          ],
        };
      }
      return conv;
    });

    setConversations(updatedConversations);
    setMessageInput('');

    // Send via socket
    try {
      sendChatMessage(activeConversationId, messageInput);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setConversations(
      conversations.map((c) =>
        c.id === id ? { ...c, unreadCount: 0 } : c
      )
    );
    setShowMobileList(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Messages" description="Chat with customers about their orders" />
        <div className="flex items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Messages" description="Chat with customers about their orders" />
        <Card>
          <CardContent className="py-16 text-center">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-gray-900 font-medium mb-1">No conversations yet</p>
            <p className="text-sm text-gray-500">
              When customers message you about orders, conversations will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full">
      <PageHeader
        title="Messages"
        description="Chat with customers about their orders"
      />

      <div className="grid md:grid-cols-3 gap-4 md:gap-6 h-[calc(100vh-300px)]">
        <Card
          className={`md:block ${
            showMobileList ? 'block' : 'hidden'
          } md:col-span-1 overflow-hidden flex flex-col`}
        >
          <CardHeader>
            <h3 className="font-semibold text-gray-900">Customer Conversations</h3>
          </CardHeader>
          <CardContent className="overflow-y-auto flex-1 p-0">
            <div className="space-y-1">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => handleSelectConversation(conversation.id)}
                  className={`w-full px-4 py-3 text-left transition-colors border-l-4 ${
                    activeConversationId === conversation.id
                      ? 'bg-primary-50 border-l-primary-600'
                      : 'border-l-transparent hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {conversation.avatar}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {conversation.customerName}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          {conversation.orderNumber}
                        </p>
                        {conversation.status && (
                          <p className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
                            <span className="w-1.5 h-1.5 bg-green-600 rounded-full" />
                            {conversation.status}
                          </p>
                        )}
                      </div>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex-shrink-0">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 truncate">
                    {conversation.lastMessage}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {conversation.lastMessageTime}
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {activeConversation && (
          <Card className={`md:col-span-2 ${!showMobileList ? 'block' : 'hidden'} md:block overflow-hidden flex flex-col`}>
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowMobileList(true)}
                    className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-sm">
                    {activeConversation.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {activeConversation.customerName}
                    </p>
                    <p className="text-xs text-gray-600">
                      {activeConversation.orderNumber}
                    </p>
                    {activeConversation.status && (
                      <p className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 bg-green-600 rounded-full" />
                        {activeConversation.status}
                      </p>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                    />
                  </svg>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeConversation.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === 'pharmacy' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                      message.sender === 'pharmacy'
                        ? 'bg-primary-600 text-white rounded-br-none'
                        : 'bg-gray-100 text-gray-900 rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <div
                      className={`text-xs mt-1 flex items-center justify-end gap-2 ${
                        message.sender === 'pharmacy'
                          ? 'text-primary-100'
                          : 'text-gray-600'
                      }`}
                    >
                      <span>{message.timestamp}</span>
                      {message.sender === 'pharmacy' && message.readAt && (
                        <span className="font-bold">✓✓</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing Indicators */}
              {Object.values(typingUsers).length > 0 && (
                <div className="flex justify-start">
                  <TypingIndicator
                    isTyping={true}
                    userName={Object.values(typingUsers).join(', ')}
                  />
                </div>
              )}

              <div ref={messagesEndRef} />
            </CardContent>

            <div className="px-4 py-4 border-t border-gray-200 bg-white">
              <div className="flex gap-3">
                <Input
                  type="text"
                  placeholder="Type your message..."
                  value={messageInput}
                  onChange={handleInputChange}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5.951-2.975A1 1 0 009 13.5V3a1 1 0 011.894-.447l7 14a1 1 0 001.169 1.409l-5.951-2.975A1 1 0 0011 13.5V3a1 1 0 00-1.106-1.447z" />
                  </svg>
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
