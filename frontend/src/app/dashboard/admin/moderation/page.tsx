'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import StatsCard from '@/components/ui/StatsCard';
import Tabs from '@/components/ui/Tabs';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import { getFlaggedAlerts, reviewFlaggedAlert } from '@/lib/services/admin.service';

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


export default function ModerationDashboardPage() {
  const [flags, setFlags] = useState<FlaggedMessage[]>([]);
  const [activeTab, setActiveTab] = useState('Pending');
  const [selectedFlag, setSelectedFlag] = useState<FlaggedMessage | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<
    'dismiss' | 'warn' | 'suspend' | null
  >(null);
  const [loading, setLoading] = useState(false);

  const tabs = ['Pending', 'Reviewed', 'Dismissed', 'User Warned', 'User Suspended'];

  // Fetch flagged alerts from API
  useEffect(() => {
    const fetchFlags = async () => {
      try {
        setLoading(true);
        const response = await getFlaggedAlerts();
        if (response.success && response.data) {
          const alerts = Array.isArray(response.data) ? response.data : (response.data as any).alerts || [];
          const mapped: FlaggedMessage[] = alerts.map((alert: any) => ({
            id: alert.id,
            conversationId: alert.conversationId || '',
            messageId: alert.messageId || '',
            senderName: alert.senderName || 'Unknown',
            senderRole: alert.senderRole || 'customer',
            recipientName: alert.recipientName || 'Unknown',
            messageContent: alert.messageContent || alert.flaggedTerms?.join(', ') || '',
            riskLevel: alert.aiConfidence > 0.9 ? 'High' : alert.aiConfidence > 0.6 ? 'Medium' : 'Low',
            reason: alert.flagReason || alert.flaggedTerms?.join(', ') || 'Flagged for review',
            timestamp: alert.createdAt ? new Date(alert.createdAt._seconds ? alert.createdAt._seconds * 1000 : alert.createdAt).toLocaleString() : '',
            status: alert.adminReviewed ? (alert.adminAction === 'dismissed' ? 'Dismissed' : alert.adminAction === 'warning_sent' ? 'User Warned' : alert.adminAction === 'user_suspended' ? 'User Suspended' : 'Reviewed') : 'Pending',
            conversationContext: alert.conversationContext || [],
          }));
          setFlags(mapped);
        }
      } catch (error) {
        console.error('Failed to fetch flagged messages:', error);
      } finally {
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
      // Map local action names to API FlagAction enum
      const actionMap: Record<string, string> = {
        dismiss: 'dismissed',
        warn: 'warning_sent',
        suspend: 'user_suspended',
      };

      // Call the real API
      const apiAction = actionMap[selectedAction] || 'dismissed';
      await reviewFlaggedAlert(selectedFlag.id, {
        action: apiAction as any,
        notes: `Action taken via moderation dashboard: ${selectedAction}`,
      });

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
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
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl flex-shrink-0">⚠️</span>
                        <h3 className="font-semibold text-gray-900 break-words">
                          {flag.reason}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 break-words">
                        <span className="font-medium">Message:</span>{' '}
                        {flag.messageContent}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0 flex-wrap">
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
                  <div className="flex flex-wrap gap-4 md:gap-6 text-sm py-3 border-y border-gray-200">
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
            <CardContent className="py-16 text-center">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-gray-900 font-medium mb-1">
                {flags.length === 0 ? 'No flagged messages yet' : `No ${activeTab.toLowerCase()} flags`}
              </p>
              <p className="text-sm text-gray-500">
                {flags.length === 0
                  ? 'When the moderation system flags a message, it will appear here for review.'
                  : 'Check other tabs for flagged messages.'}
              </p>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
