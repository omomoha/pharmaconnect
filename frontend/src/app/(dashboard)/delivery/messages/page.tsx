'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface Message {
  id: string;
  sender: 'customer' | 'rider';
  text: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  customerName: string;
  orderId: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  messages: Message[];
  phoneNumber: string;
}

const CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    customerName: 'Chioma Adeyemi',
    orderId: 'ORD-2024-0001',
    lastMessage: 'Thank you so much! 😊',
    timestamp: '2 mins ago',
    unread: 0,
    phoneNumber: '+234 803 123 4567',
    messages: [
      {
        id: '1',
        sender: 'customer',
        text: 'Hi, are you on your way?',
        timestamp: '5 mins ago',
      },
      {
        id: '2',
        sender: 'rider',
        text: 'Yes! I should be there in about 3 minutes',
        timestamp: '4 mins ago',
      },
      {
        id: '3',
        sender: 'customer',
        text: 'Perfect! Just arrived at my gate',
        timestamp: '3 mins ago',
      },
      {
        id: '4',
        sender: 'customer',
        text: 'Thank you so much! 😊',
        timestamp: '2 mins ago',
      },
    ],
  },
  {
    id: '2',
    customerName: 'Okoro Chinedu',
    orderId: 'ORD-2024-0002',
    lastMessage: 'I am outside your building',
    timestamp: '1 min ago',
    unread: 1,
    phoneNumber: '+234 905 876 5432',
    messages: [
      {
        id: '1',
        sender: 'customer',
        text: 'Hi, when will you arrive?',
        timestamp: '8 mins ago',
      },
      {
        id: '2',
        sender: 'rider',
        text: 'I just left the pharmacy, should be 5 mins away',
        timestamp: '6 mins ago',
      },
      {
        id: '3',
        sender: 'customer',
        text: 'Okay, thanks!',
        timestamp: '5 mins ago',
      },
      {
        id: '4',
        sender: 'rider',
        text: 'I am outside your building',
        timestamp: '1 min ago',
      },
    ],
  },
  {
    id: '3',
    customerName: 'Zainab Mohammed',
    orderId: 'ORD-2024-0003',
    lastMessage: 'Heading to your location now',
    timestamp: '15 mins ago',
    unread: 0,
    phoneNumber: '+234 901 234 5678',
    messages: [
      {
        id: '1',
        sender: 'customer',
        text: 'Good afternoon! Are you picking up my order?',
        timestamp: '20 mins ago',
      },
      {
        id: '2',
        sender: 'rider',
        text: 'Yes! Just collecting from HealthFirst Pharmacy',
        timestamp: '18 mins ago',
      },
      {
        id: '3',
        sender: 'rider',
        text: 'Heading to your location now',
        timestamp: '15 mins ago',
      },
    ],
  },
];

export default function DeliveryMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>(CONVERSATIONS);
  const [selectedId, setSelectedId] = useState<string>('1');
  const [newMessage, setNewMessage] = useState('');
  const [showMobileList, setShowMobileList] = useState(true);

  const selectedConv = conversations.find((c) => c.id === selectedId);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConv) return;

    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === selectedId) {
          return {
            ...conv,
            messages: [
              ...conv.messages,
              {
                id: Date.now().toString(),
                sender: 'rider',
                text: newMessage,
                timestamp: 'now',
              },
            ],
            lastMessage: newMessage,
            timestamp: 'now',
          };
        }
        return conv;
      })
    );

    setNewMessage('');
  };

  const handleSelectConversation = (id: string) => {
    setSelectedId(id);
    setShowMobileList(false);
  };

  const handleBackToList = () => {
    setShowMobileList(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery Messages"
        description="Chat with customers about their deliveries"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
        {/* Conversation List */}
        <div
          className={`${
            showMobileList ? 'block' : 'hidden'
          } md:block md:col-span-1`}
        >
          <Card className="h-full overflow-hidden flex flex-col">
            <CardContent className="p-0 flex-1 overflow-y-auto">
              <div className="divide-y divide-gray-200">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`w-full text-left p-4 border-l-4 transition-colors ${
                      selectedId === conv.id
                        ? 'bg-primary-50 border-primary-600'
                        : 'border-transparent hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{conv.customerName}</h4>
                      {conv.unread > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-1">{conv.orderId}</p>
                    <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>
                    <p className="text-xs text-gray-400 mt-1">{conv.timestamp}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        {selectedConv && (
          <div
            className={`${
              showMobileList ? 'hidden' : 'block'
            } md:block md:col-span-2`}
          >
            <Card className="h-full overflow-hidden flex flex-col">
              {/* Chat Header */}
              <div className="bg-primary-600 text-white p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold">{selectedConv.customerName}</h3>
                  <p className="text-sm text-primary-100">{selectedConv.orderId}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-primary-700 md:hidden"
                    onClick={handleBackToList}
                  >
                    ← Back
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-primary-700"
                    title="Call customer"
                  >
                    ☎️
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {selectedConv.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'rider' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.sender === 'rider'
                          ? 'bg-primary-600 text-white rounded-br-none'
                          : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none'
                      }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.sender === 'rider'
                            ? 'text-primary-100'
                            : 'text-gray-500'
                        }`}
                      >
                        {msg.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>

              {/* Message Input */}
              <div className="border-t border-gray-200 p-4 bg-white space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                  >
                    Send
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    title="Share location"
                  >
                    📍 Share Location
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    title="Call customer"
                  >
                    ☎️ Call
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Empty State for Desktop */}
        {!selectedConv && (
          <div className="hidden md:flex md:col-span-2 items-center justify-center">
            <Card className="w-full text-center py-12">
              <p className="text-gray-500 text-lg">Select a conversation to start chatting</p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
