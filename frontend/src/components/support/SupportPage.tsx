'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { createTicket, getMyTickets } from '@/lib/services/support.service';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: 'order_issue', label: 'Order Issue' },
  { value: 'account', label: 'Account' },
  { value: 'payment', label: 'Payment' },
  { value: 'technical', label: 'Technical' },
  { value: 'other', label: 'Other' },
];

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

function getCategoryLabel(cat: string): string {
  const found = CATEGORIES.find(c => c.value === cat);
  return found ? found.label : cat;
}

export default function SupportPage() {
  const { profile } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [form, setForm] = useState({ subject: '', description: '', category: 'order_issue' });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await getMyTickets();
      if (response.success && response.data) {
        setTickets(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const response = await createTicket({
        subject: form.subject,
        description: form.description,
        category: form.category,
        userName: profile?.name || profile?.email || '',
      });
      if (response.success) {
        toast.success('Support ticket submitted successfully');
        setShowNewTicket(false);
        setForm({ subject: '', description: '', category: 'order_issue' });
        fetchTickets();
      } else {
        toast.error(response.error?.message || 'Failed to submit ticket');
      }
    } catch (err) {
      toast.error('Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Support" description="Submit and track your support requests" />
        <Button variant="primary" onClick={() => setShowNewTicket(true)} className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Ticket
        </Button>
      </div>

      {/* New Ticket Form */}
      {showNewTicket && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Submit a Support Ticket</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Subject</label>
                <Input
                  placeholder="Brief summary of your issue"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Description</label>
                <textarea
                  placeholder="Describe your issue in detail..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" type="button" onClick={() => setShowNewTicket(false)}>Cancel</Button>
                <Button variant="primary" type="submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tickets List */}
      {loading ? (
        <Card>
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
              <p className="text-gray-600">Loading tickets...</p>
            </div>
          </CardContent>
        </Card>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.065 2.386-1.772 3.772-1.772 1.928 0 3.5 1.343 3.5 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No Support Tickets</h3>
            <p className="text-gray-600 mb-4">You haven't submitted any support tickets yet.</p>
            <Button variant="primary" onClick={() => setShowNewTicket(true)}>Create Your First Ticket</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Subject</th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Category</th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Created</th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map(ticket => (
                    <tr key={ticket.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-6 text-sm font-medium text-gray-900">{ticket.subject}</td>
                      <td className="py-3 px-6 text-sm text-gray-600">{getCategoryLabel(ticket.category)}</td>
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
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ticket Detail Modal */}
      <Modal isOpen={!!selectedTicket} onClose={() => setSelectedTicket(null)} title="Ticket Details" size="md">
        {selectedTicket && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getStatusColor(selectedTicket.status)}`}>
                  {selectedTicket.status?.replace('_', ' ')}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Category</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{getCategoryLabel(selectedTicket.category)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Created</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{formatDate(selectedTicket.createdAt)}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Subject</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{selectedTicket.subject}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Description</p>
              <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{selectedTicket.description}</p>
            </div>
            {selectedTicket.adminResponse && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-xs text-green-600 uppercase tracking-wide font-medium">Admin Response</p>
                <p className="text-sm text-green-900 mt-1 whitespace-pre-wrap">{selectedTicket.adminResponse}</p>
                {selectedTicket.respondedAt && (
                  <p className="text-xs text-green-600 mt-2">Responded on {formatDate(selectedTicket.respondedAt)}</p>
                )}
              </div>
            )}
            <Button variant="outline" onClick={() => setSelectedTicket(null)} className="w-full">Close</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
