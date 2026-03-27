'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import StatsCard from '@/components/ui/StatsCard';
import Tabs from '@/components/ui/Tabs';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';

interface FlaggedMessage {
  id: string;
  conversationId: string;
  messageId: string;
  senderName: string;
  senderRole: 'customer' | 'pharmacy' | 'rider';
  recipientName: string;
  messageContent: string;
  riskLevel: 'High' | 'Medium' | 'Low';
  reason: string;
  timestamp: string;
  status: 'Pending' | 'Reviewed' | 'Dismissed' | 'User Warned' | 'User Suspended';
  conversationContext: Array<{
    sender: string;
    content: string;
    timestamp: string;
  }>;
}

// Sample flagged messages data
const SAMPLE_FLAGGED_MESSAGES: FlaggedMessage[] = [
  {
    id: '1',
    conversationId: 'conv-1',
    messageId: 'msg-100',
    senderName: 'John Okafor',
    senderRole: 'customer',
    recipientName: 'Amara Pharmacy',
    messageContent: 'Do you have any antibiotics? I need something strong for my infection.',
    riskLevel: 'High',
    reason: 'Prescription drug mention detected - AI flagged for manual review',
    timestamp: '2026-03-26 14:30',
    status: 'Pending',
    conversationContext: [
      {
        sender: 'John Okafor',
        content: 'Hi, do you have medications in stock?',
        timestamp: '2026-03-26 14:15',
      },
      {
        sender: 'Amara Pharmacy',
        content: 'Yes, what are you looking for?',
        timestamp: '2026-03-26 14:18',
      },
      {
        sender: 'John Okafor',
        content: 'Do you have any antibiotics? I need something strong for my infection.',
        timestamp: '2026-03-26 14:30',
      },
    ],
  },
  {
    id: '2',
    conversationId: 'conv-2',
    messageId: 'msg-101',
    senderName: 'Chioma Adeyemi',
    senderRole: 'customer',
    recipientName: 'HealthCare Plus',
    messageContent: 'This is ridiculous! You are incompetent and your pharmacy sucks!',
    riskLevel: 'High',
    reason: 'Harassment/Abusive language detected',
    timestamp: '2026-03-25 12:15',
    status: 'Reviewed',
    conversationContext: [
      {
        sender: 'Chioma Adeyemi',
        content: 'Hi, is this product in stock?',
        timestamp: '2026-03-25 11:50',
      },
      {
        sender: 'HealthCare Plus',
        content: 'Yes, we have it available',
        timestamp: '2026-03-25 11:55',
      },
      {
        sender: 'Chioma Adeyemi',
        content: 'This is ridiculous! You are incompetent and your pharmacy sucks!',
        timestamp: '2026-03-25 12:15',
      },
    ],
  },
  {
    id: '3',
    conversationId: 'conv-3',
    messageId: 'msg-102',
    senderName: 'Tunde Ibrahim',
    senderRole: 'customer',
    recipientName: 'MedPlus Pharmacy',
    messageContent: 'I need 50 units of this product. Can we negotiate the price outside the platform?',
    riskLevel: 'Medium',
    reason: 'Suspicious activity - bulk order with request for external transaction',
    timestamp: '2026-03-25 10:00',
    status: 'Pending',
    conversationContext: [
      {
        sender: 'Tunde Ibrahim',
        content: 'Do you offer bulk discounts?',
        timestamp: '2026-03-25 09:45',
      },
      {
        sender: 'MedPlus Pharmacy',
        content: 'Yes, for orders above 20 units',
        timestamp: '2026-03-25 09:50',
      },
      {
        sender: 'Tunde Ibrahim',
        content: 'I need 50 units. Can we negotiate outside the platform?',
        timestamp: '2026-03-25 10:00',
      },
    ],
  },
  {
    id: '4',
    conversationId: 'conv-4',
    messageId: 'msg-103',
    senderName: 'Premium Pharmacy',
    senderRole: 'pharmacy',
    recipientName: 'Zainab Mohammed',
    messageContent: 'Contact me on WhatsApp +234-801-234-5678 for faster response',
    riskLevel: 'Medium',
    reason: 'Policy violation - directing customer to external communication channel',
    timestamp: '2026-03-24 16:45',
    status: 'User Warned',
    conversationContext: [
      {
        sender: 'Zainab Mohammed',
        content: 'Hi, do you sell codeine?',
        timestamp: '2026-03-24 16:30',
      },
      {
        sender: 'Premium Pharmacy',
        content: 'Yes, but requires prescription',
        timestamp: '2026-03-24 16:35',
      },
      {
        sender: 'Premium Pharmacy',
        content: 'Contact me on WhatsApp for faster response',
        timestamp: '2026-03-24 16:45',
      },
    ],
  },
  {
    id: '5',
    conversationId: 'conv-5',
    messageId: 'msg-104',
    senderName: 'Samuel Adekunle',
    senderRole: 'rider',
    recipientName: 'Ayo Adebayo',
    messageContent: 'Fine. Your order has been cancelled due to your behavior.',
    riskLevel: 'High',
    reason: 'Delivery conflict - potential harassment between parties',
    timestamp: '2026-03-23 18:00',
    status: 'User Suspended',
    conversationContext: [
      {
        sender: 'Ayo Adebayo',
        content: 'Where is my order? You are late!',
        timestamp: '2026-03-23 17:40',
      },
      {
        sender: 'Samuel Adekunle',
        content: 'I am 10 minutes away',
        timestamp: '2026-03-23 17:45',
      },
      {
        sender: 'Ayo Adebayo',
        content: 'If you are late, you will regret it',
        timestamp: '2026-03-23 17:55',
      },
      {
        sender: 'Samuel Adekunle',
        content: 'Your order has been cancelled due to your behavior',
        timestamp: '2026-03-23 18:00',
      },
    ],
  },
];

export default function ModerationDashboardPage() {
  const [flags, setFlags] = useState<FlaggedMessage[]>(SAMPLE_FLAGGED_MESSAGES);
  const [activeTab, setActiveTab] = useState('Pending');
  const [selectedFlag, setSelectedFlag] = useState<FlaggedMessage | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<
    'dismiss' | 'warn' | 'suspend' | null
  >(null);
  const [loading, setLoading] = useState(false);

  const tabs = ['Pending', 'Reviewed', 'Dismissed', 'User Warned', 'User Suspended'];

  // Fetch flagged messages (currently using sample data, would be API call)
  useEffect(() => {
    const fetchFlags = async () => {
      try {
        setLoading(true);
        // In production, would call: const response = await apiClient.get('/api/v1/admin/flagged-messages');
        // For now, using sample data
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch flagged messages:', error);
        setLoading(false);
      }
    };

    fetchFlags();
  }, []);

  const filteredFlags = flags.filter((flag) => {
    if (activeTab === 'All') return true;
    return flag.status === activeTab;
  });

  // Calculate stats
  const totalFlags = flags.length;
  const pendingFlags = flags.filter((f) => f.status === 'Pending').length;
  const highRiskFlags = flags.filter((f) => f.riskLevel === 'High').length;
  const reviewedFlags = flags.filter((f) => f.status === 'Reviewed').length;

  const openDetailModal = (flag: FlaggedMessage) => {
    setSelectedFlag(flag);
    setIsDetailModalOpen(true);
  };

  const openActionModal = (
    flag: FlaggedMessage,
    action: 'dismiss' | 'warn' | 'suspend'
  ) => {
    setSelectedFlag(flag);
    setSelectedAction(action);
    setIsActionModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedFlag || !selectedAction) return;

    try {
      // Optimistic update
      const updatedFlags = flags.map((f) => {
        if (f.id === selectedFlag.id) {
          const newStatus: FlaggedMessage['status'] =
            selectedAction === 'dismiss'
              ? 'Dismissed'
              : selectedAction === 'warn'
                ? 'User Warned'
                : 'User Suspended';
          return {
            ...f,
            status: newStatus,
          };
        }
        return f;
      });

      setFlags(updatedFlags);
      setIsActionModalOpen(false);
      setSelectedAction(null);

      // In production, would call API to persist action
      const actionName =
        selectedAction === 'dismiss'
          ? 'dismissed'
          : selectedAction === 'warn'
            ? 'warned the user for'
            : 'suspended the user for';

      toast.success(`Successfully ${actionName} flag #${selectedFlag.id}`);
    } catch (error) {
      toast.error('Failed to perform action on flag');
      console.error('Action error:', error);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'High':
        return 'bg-red-100 text-red-700';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'Low':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-orange-100 text-orange-700';
      case 'Reviewed':
        return 'bg-blue-100 text-blue-700';
      case 'Dismissed':
        return 'bg-green-100 text-green-700';
      case 'User Warned':
        return 'bg-yellow-100 text-yellow-700';
      case 'User Suspended':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Message Moderation"
        description="Review and manage flagged messages from users"
      />

      {/* Stats Row */}
      <div className="grid md:grid-cols-4 gap-6">
        <StatsCard label="Total Flags" value={totalFlags.toString()} icon="🚩" />
        <StatsCard label="Pending Review" value={pendingFlags.toString()} icon="⏳" />
        <StatsCard label="High Risk" value={highRiskFlags.toString()} icon="🔴" />
        <StatsCard label="Reviewed" value={reviewedFlags.toString()} icon="✅" />
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs.map((tab) => ({
          id: tab,
          label: tab,
        }))}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Flags List */}
      <div className="space-y-4">
        {loading ? (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-gray-200 rounded animate-pulse" />
            ))}
          </>
        ) : filteredFlags.length > 0 ? (
          filteredFlags.map((flag) => (
            <Card
              key={flag.id}
              className="hover:shadow-md transition-shadow duration-200"
            >
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">⚠️</span>
                        <h3 className="font-semibold text-gray-900">
                          {flag.reason}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Message:</span>{' '}
                        {flag.messageContent}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskColor(
                          flag.riskLevel
                        )}`}
                      >
                        {flag.riskLevel}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          flag.status
                        )}`}
                      >
                        {flag.status}
                      </span>
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="flex gap-6 text-sm py-3 border-y border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">👤</span>
                      <div>
                        <p className="text-xs text-gray-600">Sender</p>
                        <p className="font-medium text-gray-900">
                          {flag.senderName}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {flag.senderRole}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">→</span>
                      <div>
                        <p className="text-xs text-gray-600">Recipient</p>
                        <p className="font-medium text-gray-900">
                          {flag.recipientName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                      <span className="text-lg">🕐</span>
                      <div>
                        <p className="text-xs text-gray-600">Flagged At</p>
                        <p className="font-medium text-gray-900">
                          {flag.timestamp}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Conversation Context */}
                  <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                    <p className="text-xs text-gray-600 uppercase tracking-wide mb-3">
                      Conversation Context
                    </p>
                    <div className="space-y-2">
                      {flag.conversationContext.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded text-sm ${
                            msg.sender === flag.senderName
                              ? 'bg-blue-50 text-blue-900'
                              : 'bg-green-50 text-green-900'
                          }`}
                        >
                          <p className="font-medium text-xs mb-1">
                            {msg.sender}
                          </p>
                          <p className="text-xs">{msg.content}</p>
                          <p className="text-xs opacity-75 mt-1">
                            {msg.timestamp}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {flag.status === 'Pending' && (
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openActionModal(flag, 'dismiss')}
                      >
                        Dismiss
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openActionModal(flag, 'warn')}
                      >
                        Warn User
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openActionModal(flag, 'suspend')}
                      >
                        Suspend User
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDetailModal(flag)}
                        className="ml-auto"
                      >
                        View Full Details
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600">No flagged messages in this category</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen && selectedFlag !== null}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedFlag(null);
        }}
        title={`Flag #${selectedFlag?.id} Details`}
        size="md"
      >
        {selectedFlag && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide">
                  Risk Level
                </p>
                <div className="mt-1">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getRiskColor(
                      selectedFlag.riskLevel
                    )}`}
                  >
                    {selectedFlag.riskLevel}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide">
                  Status
                </p>
                <div className="mt-1">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      selectedFlag.status
                    )}`}
                  >
                    {selectedFlag.status}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide">
                Reason
              </p>
              <p className="text-sm text-gray-900 mt-1">{selectedFlag.reason}</p>
            </div>

            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide">
                Message
              </p>
              <p className="text-sm text-gray-900 mt-1">
                {selectedFlag.messageContent}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedFlag(null);
                }}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Action Confirmation Modal */}
      <Modal
        isOpen={isActionModalOpen}
        onClose={() => {
          setIsActionModalOpen(false);
          setSelectedAction(null);
        }}
        title={`${
          selectedAction
            ? selectedAction.charAt(0).toUpperCase() + selectedAction.slice(1)
            : 'Action'
        } - Flag #${selectedFlag?.id}`}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            {selectedAction === 'dismiss' &&
              'This will dismiss the flag. The conversation will be marked as reviewed and no action will be taken against users.'}
            {selectedAction === 'warn' &&
              'This will send a warning to the flagged user. They will receive a notification about the policy violation and a record will be added to their account.'}
            {selectedAction === 'suspend' &&
              'This will suspend the user account. They will no longer be able to access the platform. This action is irreversible without admin intervention.'}
          </p>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsActionModalOpen(false);
                setSelectedAction(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmAction}
              className="flex-1"
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
