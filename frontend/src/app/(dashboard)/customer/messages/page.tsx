'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PageHeader from '@/components/ui/PageHeader';

interface Message {
  id: string;
  sender: 'user' | 'other';
  text: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  name: string;
  type: 'pharmacy' | 'rider' | 'support';
  avatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  status?: string;
  messages: Message[];
}

// Sample conversations data
const SAMPLE_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    name: 'HealthPlus Pharmacy',
    type: 'pharmacy',
    avatar: 'H',
    lastMessage: 'Your order is being prepared. Will be ready in 15 minutes.',
    lastMessageTime: '2 min ago',
    unreadCount: 1,
    status: 'Online',
    messages: [
      {
        id: '1',
        sender: 'other',
        text: 'Hello! Thank you for your order. We have received it.',
        timestamp: '10:30 AM',
      },
      {
        id: '2',
        sender: 'user',
        text: 'Thanks! Is the medication in stock?',
        timestamp: '10:32 AM',
      },
      {
        id: '3',
        sender: 'other',
        text: 'Yes, all items are in stock and we are preparing them now.',
        timestamp: '10:35 AM',
      },
      {
        id: '4',
        sender: 'other',
        text: 'Your order is being prepared. Will be ready in 15 minutes.',
        timestamp: '10:40 AM',
      },
    ],
  },
  {
    id: '2',
    name: 'Seun Oluwaseun (Rider)',
    type: 'rider',
    avatar: 'S',
    lastMessage: 'I am on the way. ETA 3 minutes.',
    lastMessageTime: '1 min ago',
    unreadCount: 0,
    status: 'Online',
    messages: [
      {
        id: '1',
        sender: 'other',
        text: 'Hello! I am your delivery rider. I will pick up your order soon.',
        timestamp: '02:00 PM',
      },
      {
        id: '2',
        sender: 'user',
        text: 'Thanks! What time should I expect the delivery?',
        timestamp: '02:05 PM',
      },
      {
        id: '3',
        sender: 'other',
        text: 'I am on the way. ETA 3 minutes.',
        timestamp: '02:45 PM',
      },
    ],
  },
  {
    id: '3',
    name: 'Customer Support',
    type: 'support',
    avatar: 'C',
    lastMessage: 'We are here to help. Please let us know if you have any issues.',
    lastMessageTime: '5 min ago',
    unreadCount: 0,
    status: 'Online',
    messages: [
      {
        id: '1',
        sender: 'other',
        text: 'Welcome to PharmaConnect customer support! How can we help you today?',
        timestamp: '09:00 AM',
      },
      {
        id: '2',
        sender: 'user',
        text: 'I have a question about my recent order.',
        timestamp: '09:15 AM',
      },
      {
        id: '3',
        sender: 'other',
        text: 'We are here to help. Please let us know if you have any issues.',
        timestamp: '09:20 AM',
      },
    ],
  },
];

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>(SAMPLE_CONVERSATIONS);
  const [activeConversationId, setActiveConversationId] = useState(SAMPLE_CONVERSATIONS[0].id);
  const [messageInput, setMessageInput] = useState('');
  const [showMobileList, setShowMobileList] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  );

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !activeConversation) return;

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
              sender: 'user' as const,
              text: messageInput,
              timestamp: new Date().toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              }),
            },
          ],
        };
      }
      return conv;
    });

    setConversations(updatedConversations);
    setMessageInput('');
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    // Mark as read
    setConversations(
      conversations.map((c) =>
        c.id === id ? { ...c, unreadCount: 0 } : c
      )
    );
    // Show mobile conversation view
    setShowMobileList(false);
  };

  return (
    <div className="space-y-6 h-full">
      {/* Header */}
      <PageHeader
        title="Messages"
        description="Chat with pharmacies, riders, and support"
      />

      {/* Messages Layout */}
      <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-300px)]">
        {/* Conversation List */}
        <Card
          className={`md:block ${
            showMobileList ? 'block' : 'hidden'
          } md:col-span-1 overflow-hidden flex flex-col`}
        >
          <CardHeader>
            <h3 className="font-semibold text-gray-900">Conversations</h3>
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
                          {conversation.name}
                        </p>
                        {conversation.status && (
                          <p className="text-xs text-green-600 flex items-center gap-1">
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

        {/* Active Conversation */}
        {activeConversation && (
          <Card className={`md:col-span-2 ${!showMobileList ? 'block' : 'hidden'} md:block overflow-hidden flex flex-col`}>
            {/* Header */}
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
                      {activeConversation.name}
                    </p>
                    {activeConversation.status && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
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

            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeConversation.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-primary-600 text-white rounded-br-none'
                        : 'bg-gray-100 text-gray-900 rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.sender === 'user'
                          ? 'text-primary-100'
                          : 'text-gray-600'
                      }`}
                    >
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </CardContent>

            {/* Input */}
            <div className="px-4 py-4 border-t border-gray-200 bg-white">
              <div className="flex gap-3">
                <Input
                  type="text"
                  placeholder="Type your message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
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
