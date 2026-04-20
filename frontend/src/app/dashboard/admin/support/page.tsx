'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { getAllTickets, respondToTicket, closeTicket } from '@/lib/services/support.service';
import toast from 'react-hot-toast';

const STATUSES = ['All', 'open', 'in_progress', 'resolved', 'closed'];
const CATEGORIES = ['all', 'order_issue', 'account', 'payment', 'technical', 'other'];

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All Categories',
  order_issue: 'Order Issue',
  account: 'Account',
  payment: 'Payment',
  technical: 'Technical',
  other: 'Other',
};

function formatDate(dateVal: any): string {
  if (!dateVal) return 'N/A';
  if (dateVal._seconds) return new Date(dateVal._seconds * 1000).toLocaleDateString();
  if (typeof dateVal === 'string') return new Date(dateVal).toLocaleDateString();
  return 'N/A';
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'open': return 'bg-blue-100 text-blue-700';
    case 'in_progress': return 'bg-yellow-100 text-yellow-700';
    case 'resolved': return 'bg-green-100 text-green-700';
    case 'closed': return 'bg-gray-100 text-gray-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const status = statusFilter !== 'All' ? statusFilter : undefined;
      const response = await getAllTickets(status);
      if (response.success && response.data) {
        setTickets(response.data);
      } else {
        setError('Failed to load tickets');
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
      setError('Failed to load tickets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async () => {
    if (!selectedTicket || !responseText.trim()) {
      toast.error('Please enter a response');
      return;
    }
    setSubmitting(true);
    try {
      const response = await respondToTicket(selectedTicket.id, responseText);
      if (response.success) {
        toast.success('Response sent successfully');
        setTickets((prev) =>
          prev.map((t) =>
            t.id === selectedTicket.id
              ? { ...t, adminResponse: responseText, respondedAt: new Date().toISOString() }
              : t
          )
        );
        setSelectedTicket((prev: any) => ({
          ...prev,
          adminResponse: responseText,
          respondedAt: new Date().toISOString(),
        }));
        setResponseText('');
      } else {
        toast.error(response.error?.message || 'Failed to send response');
      }
    } catch (err) {
      toast.error('Failed to send response');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = async () => {
    if (!selectedTicket) return;
    setSubmitting(true);
    try {
      const response = await closeTicket(selectedTicket.id);
      if (response.success) {
        toast.success('Ticket closed successfully');
        setTickets((prev) =>
          prev.map((t) =>
            t.id === selectedTicket.id ? { ...t, status: 'closed' } : t
          )
        );
        setSelectedTicket((prev: any) => ({ ...prev, status: 'closed' }));
      } else {
        toast.error(response.error?.message || 'Failed to close ticket');
      }
    } catch (err) {
      toast.error('Failed to close ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const processedTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === 'all' || ticket.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support Tickets"
        description="Manage and respond to customer support requests"
      />

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Search */}
            <div className="sm:col-span-3">
              <div className="relative">
                <Input
                  placeholder="Search by subject, user name, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <svg
                  className="absolute right-3 top-3 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status === 'All' ? 'All Status' : status.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && !loading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div>
                <p className="text-red-800 font-medium">Error loading tickets</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
              <Button
                variant="primary"
                onClick={fetchTickets}
                className="whitespace-nowrap"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="text-gray-600">Loading tickets...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tickets Table */}
      {!loading && !error && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Subject</th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">User</th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Category</th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Created</th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {processedTickets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 px-6 text-center">
                        <p className="text-gray-600">No tickets found</p>
                      </td>
                    </tr>
                  ) : (
                    processedTickets.map((ticket) => (
                      <tr
                        key={ticket.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-6 text-sm font-medium text-gray-900">{ticket.subject}</td>
                        <td className="py-3 px-6 text-sm text-gray-600">{ticket.userName || 'N/A'}</td>
                        <td className="py-3 px-6 text-sm text-gray-600">{CATEGORY_LABELS[ticket.category] || ticket.category}</td>
                        <td className="py-3 px-6">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                            {ticket.status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-sm text-gray-600">{formatDate(ticket.createdAt)}</td>
                        <td className="py-3 px-6">
                          <button
                            onClick={() => setSelectedTicket(ticket)}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ticket Detail Modal */}
      <Modal
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title="Ticket Details"
        size="lg"
      >
        {selectedTicket && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Subject</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{selectedTicket.subject}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getStatusColor(selectedTicket.status)}`}>
                  {selectedTicket.status?.replace('_', ' ')}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">User</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{selectedTicket.userName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Category</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{CATEGORY_LABELS[selectedTicket.category] || selectedTicket.category}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Created</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{formatDate(selectedTicket.createdAt)}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Description</p>
              <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                {selectedTicket.description}
              </p>
            </div>

            {/* Existing Response */}
            {selectedTicket.adminResponse && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-xs text-green-600 uppercase tracking-wide font-medium">Admin Response</p>
                <p className="text-sm text-green-900 mt-2 whitespace-pre-wrap">
                  {selectedTicket.adminResponse}
                </p>
                {selectedTicket.respondedAt && (
                  <p className="text-xs text-green-600 mt-2">Responded on {formatDate(selectedTicket.respondedAt)}</p>
                )}
              </div>
            )}

            {/* Response Form */}
            {selectedTicket.status !== 'closed' && (
              <div className="border-t pt-4 space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Your Response</label>
                  <textarea
                    placeholder="Type your response here..."
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedTicket(null)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleRespond}
                    disabled={submitting || !responseText.trim()}
                    className="flex-1"
                  >
                    {submitting ? 'Sending...' : 'Send Response'}
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleClose}
                    disabled={submitting}
                    className="flex-1 bg-gray-600 hover:bg-gray-700"
                  >
                    {submitting ? 'Closing...' : 'Close Ticket'}
                  </Button>
                </div>
              </div>
            )}

            {/* Closed State */}
            {selectedTicket.status === 'closed' && (
              <div className="border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedTicket(null)}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
