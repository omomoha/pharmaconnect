'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PageHeader from '@/components/ui/PageHeader';

interface Message {
  id: string;
  sender: 'pharmacy' | 'customer';
  text: string;
  timestamp: string;
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

const SAMPLE_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    customerName: 'John Doe',
    avatar: 'J',
    orderNumber: 'ORD-2026-0001',
    lastMessage: 'Thank you! The medication worked great.',
    lastMessageTime: '2 min ago',
    unreadCount: 1,
    status: 'Online',
    messages: [
      {
        id: '1',
        sender: 'customer',
        text: 'Hi, I received my order. Thank you!',
        timestamp: '10:30 AM',
      },
      {
        id: '2',
        sender: 'pharmacy',
        text: 'You\'re welcome! Please let us know if you have any issues.',
        timestamp: '10:32 AM',
      },
      {
        id: '3',
        sender: 'customer',
        text: 'Thank you! The medication worked great.',
        timestamp: '02:15 PM',
      },
    ],
  },
  {
    id: '2',
    customerName: 'Jane Smith',
    avatar: 'J',
    orderNumber: 'ORD-2026-0002',
    lastMessage: 'Do you have this in stock?',
    lastMessageTime: '15 min ago',
    unreadCount: 0,
    status: 'Online',
    messages: [
      {
        id: '1',
        sender: 'customer',
        text: 'Hi, do you have Ibuprofen in stock?',
        timestamp: '01:45 PM',
      },
      {
        id: '2',
        sender: 'pharmacy',
        text: 'Yes, we have Ibuprofen 400mg available.',
        timestamp: '01:50 PM',
      },
      {
        id: '3',
        sender: 'customer',
        text: 'Great! Do you have this in stock?',
        timestamp: '02:00 PM',
      },
    ],
  },
  {
    id: '3',
    customerName: 'Mike Johnson',
    avatar: 'M',
    orderNumber: 'ORD-2026-0003',
    lastMessage: 'When will my order be ready?',
    lastMessageTime: '1 hour ago',
    unreadCount: 0,
    status: 'Offline',
    messages: [
      {
        id: '1',
        sender: 'customer',
        text: 'I just placed an order. When will it be ready?',
        timestamp: '11:30 AM',
      },
      {
        id: '2',
        sender: 'pharmacy',
        text: 'Your order is being prepared. It will be ready in about 30 minutes.',
        timestamp: '11:35 AM',
      },
      {
        id: '3',
        sender: 'customer',
        text: 'When will my order be ready?',
        timestamp: '12:30 PM',
      },
    ],
  },
  {
    id: '4',
    customerName: 'Sarah Williams',
    avatar: 'S',
    orderNumber: 'ORD-2026-0004',
    lastMessage: 'Can I get a refund for the wrong item?',
    lastMessageTime: '3 hours ago',
    unreadCount: 1,
    status: 'Offline',
    messages: [
      {
        id: '1',
        sender: 'customer',
        text: 'Hi, I received the wrong item in my order.',
        timestamp: '11:00 AM',
      },
      {
        id: '2',
        sender: 'pharmacy',
        text: 'We\'re sorry to hear that. Can you describe what was wrong?',
        timestamp: '11:05 AM',
      },
      {
        id: '3',
        sender: 'customer',
        text: 'I ordered tablets but received capsules. Can I get a refund for the wrong item?',
        timestamp: '11:10 AM',
      },
    ],
  },
];

export default function PharmacyMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>(SAMPLE_CONVERSATIONS);
  const [activeConversationId, setActiveConversationId] = useState(SAMPLE_CONVERSATIONS[0].id);
  const [messageInput, setMessageInput] = useState('');
  const [showMobileList, setShowMobileList] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  );

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
              sender: 'pharmacy' as const,
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
    setConversations(
      conversations.map((c) =>
        c.id === id ? { ...c, unreadCount: 0 } : c
      )
    );
    setShowMobileList(false);
  };

  return (
    <div className="space-y-6 h-full">
      <PageHeader
        title="Messages"
        description="Chat with customers about their orders"
      />

      <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-300px)]">
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
                    <p
                      className={`text-xs mt-1 ${
                        message.sender === 'pharmacy'
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
