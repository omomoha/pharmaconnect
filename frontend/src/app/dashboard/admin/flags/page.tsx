'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import StatsCard from '@/components/ui/StatsCard';
import Tabs from '@/components/ui/Tabs';
import Modal from '@/components/ui/Modal';
import { getFlaggedAlerts, reviewFlaggedAlert } from '@/lib/services/admin.service';

interface ChatMessage {
  sender: string;
  role: 'Sender' | 'Recipient';
  message: string;
  timestamp: string;
}

interface Flag {
  id: string;
  type:
    | 'Prescription Drug Detection'
    | 'Harassment'
    | 'Suspicious Activity'
    | 'Policy Violation';
  severity: 'High' | 'Medium' | 'Low';
  description: string;
  sender: string;
  recipient: string;
  flaggedAt: string;
  status: 'Pending' | 'Reviewing' | 'Resolved' | 'Escalated';
  messages: ChatMessage[];
}


export default function FlagsModerationPage() {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('All');
  const [selectedFlag, setSelectedFlag] = useState<Flag | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<
    'dismiss' | 'warn' | 'suspend' | 'escalate' | null
  >(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('newest');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch flagged alerts on component mount
  useEffect(() => {
    const loadFlags = async () => {
      setLoading(true);
      setError(null);
      const response = await getFlaggedAlerts();

      if (response.success && response.data) {
        // Map API response to Flag interface
        const mappedFlags: Flag[] = response.data.map((alert: any) => ({
          id: alert.id,
          type: alert.type || alert.nlpClassification || 'Policy Violation',
          severity: alert.severity || (alert.confidenceScore > 0.8 ? 'High' : 'Medium'),
          description: alert.description || alert.suspiciousKeywords?.join(', ') || '',
          sender: alert.senderName || alert.senderId || 'Unknown',
          recipient: alert.recipientName || 'Unknown',
          flaggedAt: alert.createdAt
            ? new Date(alert.createdAt).toLocaleString()
            : 'Unknown',
          status: alert.status || alert.action || 'Pending',
          messages: alert.context || [],
        }));
        setFlags(mappedFlags);
      } else {
        setError(response.error?.message || 'Failed to load flagged alerts');
      }
      setLoading(false);
    };

    loadFlags();
  }, []);

  const tabs = ['All', 'Pending', 'Reviewing', 'Resolved', 'Escalated'];

  const itemsPerPage = 10;

  const filterFlags = () => {
    let filtered = flags;

    // Filter by tab status
    if (activeTab === 'Pending') {
      filtered = filtered.filter((f) => f.status === 'Pending');
    } else if (activeTab === 'Reviewing') {
      filtered = filtered.filter((f) => f.status === 'Reviewing');
    } else if (activeTab === 'Resolved') {
      filtered = filtered.filter((f) => f.status === 'Resolved');
    } else if (activeTab === 'Escalated') {
      filtered = filtered.filter((f) => f.status === 'Escalated');
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((f) =>
        f.description.toLowerCase().includes(query) ||
        f.sender.toLowerCase().includes(query) ||
        f.recipient.toLowerCase().includes(query) ||
        f.type.toLowerCase().includes(query) ||
        f.messages.some((msg) => msg.message.toLowerCase().includes(query))
      );
    }

    // Sort flags
    if (sortBy === 'newest') {
      filtered = filtered.sort(
        (a, b) => new Date(b.flaggedAt).getTime() - new Date(a.flaggedAt).getTime()
      );
    } else if (sortBy === 'oldest') {
      filtered = filtered.sort(
        (a, b) => new Date(a.flaggedAt).getTime() - new Date(b.flaggedAt).getTime()
      );
    } else if (sortBy === 'severity') {
      const severityOrder = { High: 0, Medium: 1, Low: 2 };
      filtered = filtered.sort(
        (a, b) =>
          (severityOrder[a.severity as keyof typeof severityOrder] || 3) -
          (severityOrder[b.severity as keyof typeof severityOrder] || 3)
      );
    }

    return filtered;
  };

  const filteredFlags = filterFlags();
  const totalResults = filteredFlags.length;
  const totalPages = Math.ceil(totalResults / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalResults);
  const paginatedFlags = filteredFlags.slice(startIndex, endIndex);

  // Calculate stats
  const totalFlags = flags.length;
  const pendingFlags = flags.filter((f) => f.status === 'Pending').length;
  const resolvedFlags = flags.filter((f) => f.status === 'Resolved').length;
  const escalatedFlags = flags.filter((f) => f.status === 'Escalated')
    .length;

  const openDetailModal = (flag: Flag) => {
    setSelectedFlag(flag);
    setIsDetailModalOpen(true);
  };

  const openActionModal = (
    flag: Flag,
    action: 'dismiss' | 'warn' | 'suspend' | 'escalate'
  ) => {
    setSelectedFlag(flag);
    setSelectedAction(action);
    setIsActionModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedFlag || !selectedAction) return;

    setActionLoading(true);
    const actionMap: Record<
      string,
      'APPROVED' | 'FLAGGED_FOR_REVIEW'
    > = {
      dismiss: 'APPROVED',
      escalate: 'FLAGGED_FOR_REVIEW',
    };

    const reviewAction = actionMap[selectedAction];
    let response;

    if (reviewAction) {
      response = await reviewFlaggedAlert(selectedFlag.id, {
        action: reviewAction,
        notes: `User action: ${selectedAction}`,
      });
    }

    setActionLoading(false);

    if (response?.success) {
      // Update flag in state
      setFlags((prevFlags) =>
        prevFlags.map((f) =>
          f.id === selectedFlag.id
            ? {
                ...f,
                status:
                  selectedAction === 'escalate'
                    ? 'Escalated'
                    : selectedAction === 'dismiss'
                      ? 'Resolved'
                      : f.status,
              }
            : f
        )
      );
      setIsActionModalOpen(false);
      setSelectedAction(null);
    } else {
      setError(response?.error?.message || 'Failed to perform action');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
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
      case 'Reviewing':
        return 'bg-blue-100 text-blue-700';
      case 'Resolved':
        return 'bg-green-100 text-green-700';
      case 'Escalated':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Flags & Moderation"
        description="Review and manage flagged conversations and user reports"
      />

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-red-900 font-medium">Error Loading Flags</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">Loading flagged alerts...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats Row */}
          <div className="grid md:grid-cols-4 gap-6">
            <StatsCard label="Total Flags" value={totalFlags.toString()} icon="🚩" />
            <StatsCard label="Pending Review" value={pendingFlags.toString()} icon="⏳" />
            <StatsCard label="Resolved" value={resolvedFlags.toString()} icon="✅" />
            <StatsCard label="Escalated" value={escalatedFlags.toString()} icon="🔴" />
          </div>
        </>
      )}

      {!loading && (
        <>
          {/* Tabs */}
          <Tabs
            tabs={tabs.map((tab) => ({
              id: tab,
              label: tab,
            }))}
            activeTab={activeTab}
            onChange={(newTab) => {
              setActiveTab(newTab);
              setCurrentPage(1);
            }}
          />

          {/* Search and Sort Row */}
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <input
              type="text"
              placeholder="Search flags..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="severity">Severity (High → Low)</option>
            </select>
          </div>

          {/* Results Info */}
          {totalResults > 0 && (
            <div className="text-sm text-gray-600 mb-4">
              Showing {startIndex + 1}-{endIndex} of {totalResults} results
            </div>
          )}

          {/* Flags Grid */}
          <div className="space-y-4">
            {paginatedFlags.map((flag) => (
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
                        {flag.type}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600">{flag.description}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(
                        flag.severity
                      )}`}
                    >
                      {flag.severity}
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

                {/* Users Involved */}
                <div className="flex gap-8 text-sm py-3 border-y border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👤</span>
                    <div>
                      <p className="text-xs text-gray-600">Sender</p>
                      <p className="font-medium text-gray-900">{flag.sender}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👤</span>
                    <div>
                      <p className="text-xs text-gray-600">Recipient</p>
                      <p className="font-medium text-gray-900">
                        {flag.recipient}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-lg">🕐</span>
                    <div>
                      <p className="text-xs text-gray-600">Flagged At</p>
                      <p className="font-medium text-gray-900">
                        {flag.flaggedAt}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Conversation Preview */}
                <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                  <p className="text-xs text-gray-600 uppercase tracking-wide mb-3">
                    Conversation Context
                  </p>
                  <div className="space-y-2">
                    {flag.messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded text-sm ${
                          msg.role === 'Sender'
                            ? 'bg-blue-50 text-blue-900'
                            : 'bg-green-50 text-green-900'
                        }`}
                      >
                        <p className="font-medium mb-1">{msg.sender}</p>
                        <p>{msg.message}</p>
                        <p className="text-xs opacity-75 mt-1">{msg.timestamp}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
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
                    variant="outline"
                    size="sm"
                    onClick={() => openActionModal(flag, 'escalate')}
                  >
                    Escalate
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
              </div>
            </CardContent>
            </Card>
          ))}
          </div>

          {filteredFlags.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-600">
                  {searchQuery ? 'No flags match your search' : 'No flags in this category'}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Pagination Bar */}
          {totalResults > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between py-4 border-t border-gray-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen && selectedFlag !== null}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedFlag(null);
        }}
        title={`Flag Details - ${selectedFlag?.id}`}
        size="md"
      >
        {selectedFlag && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide">
                  Flag Type
                </p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {selectedFlag.type}
                </p>
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
                Description
              </p>
              <p className="text-sm text-gray-900 mt-1">
                {selectedFlag.description}
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
        title={`${selectedAction?.charAt(0).toUpperCase()}${selectedAction?.slice(1)} User`}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            {selectedAction === 'dismiss' &&
              'This will dismiss the flag. The users will not be notified.'}
            {selectedAction === 'warn' &&
              'This will send a warning to the user. They will receive a notification about policy violation.'}
            {selectedAction === 'suspend' &&
              'This will suspend the user account. They will no longer be able to access the platform.'}
            {selectedAction === 'escalate' &&
              'This will escalate the flag to the senior moderation team for further investigation.'}
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
              disabled={actionLoading}
              className="flex-1"
            >
              {actionLoading ? 'Processing...' : 'Confirm'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
