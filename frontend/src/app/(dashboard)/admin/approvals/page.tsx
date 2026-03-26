'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Tabs from '@/components/ui/Tabs';
import Modal from '@/components/ui/Modal';

interface Document {
  name: string;
  status: 'Uploaded' | 'Missing';
}

interface Approval {
  id: string;
  businessName: string;
  type: 'Pharmacy' | 'Delivery';
  submittedDate: string;
  documents: Document[];
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
}

const sampleApprovals: Approval[] = [
  {
    id: '1',
    businessName: 'HealthCare Plus',
    type: 'Pharmacy',
    submittedDate: '2026-03-25',
    documents: [
      { name: 'Pharmacy License', status: 'Uploaded' },
      { name: 'CAC Certificate', status: 'Uploaded' },
      { name: "Owner's Government ID", status: 'Uploaded' },
    ],
    ownerName: 'Dr. Emeka Okafor',
    ownerEmail: 'emeka@healthcareplus.com',
    ownerPhone: '+234-801-234-5678',
  },
  {
    id: '2',
    businessName: 'Swift Logistics',
    type: 'Delivery',
    submittedDate: '2026-03-24',
    documents: [
      { name: 'CAC Certificate', status: 'Uploaded' },
      { name: "Owner's Government ID", status: 'Uploaded' },
      { name: 'Vehicle Registration', status: 'Uploaded' },
      { name: 'Vehicle Insurance', status: 'Missing' },
    ],
    ownerName: 'Kunle Adebayo',
    ownerEmail: 'kunle@swiftlogistics.com',
    ownerPhone: '+234-802-345-6789',
  },
  {
    id: '3',
    businessName: 'MedStore Solutions',
    type: 'Pharmacy',
    submittedDate: '2026-03-22',
    documents: [
      { name: 'Pharmacy License', status: 'Uploaded' },
      { name: 'CAC Certificate', status: 'Uploaded' },
      { name: "Owner's Government ID", status: 'Missing' },
    ],
    ownerName: 'Amara Nwosu',
    ownerEmail: 'amara@medstore.com',
    ownerPhone: '+234-803-456-7890',
  },
  {
    id: '4',
    businessName: 'Lagos Express Riders',
    type: 'Delivery',
    submittedDate: '2026-03-20',
    documents: [
      { name: 'CAC Certificate', status: 'Uploaded' },
      { name: "Owner's Government ID", status: 'Uploaded' },
      { name: 'Vehicle Registration', status: 'Uploaded' },
      { name: 'Vehicle Insurance', status: 'Uploaded' },
    ],
    ownerName: 'Tunde Obi',
    ownerEmail: 'tunde@lagosriders.com',
    ownerPhone: '+234-804-567-8901',
  },
  {
    id: '5',
    businessName: 'Premium Pharmacy Network',
    type: 'Pharmacy',
    submittedDate: '2026-03-19',
    documents: [
      { name: 'Pharmacy License', status: 'Uploaded' },
      { name: 'CAC Certificate', status: 'Uploaded' },
      { name: "Owner's Government ID", status: 'Uploaded' },
    ],
    ownerName: 'Dr. Ngozi Ejiro',
    ownerEmail: 'ngozi@premiumpharmacy.com',
    ownerPhone: '+234-805-678-9012',
  },
  {
    id: '6',
    businessName: 'Quick Delivery Services',
    type: 'Delivery',
    submittedDate: '2026-03-18',
    documents: [
      { name: 'CAC Certificate', status: 'Uploaded' },
      { name: "Owner's Government ID", status: 'Uploaded' },
      { name: 'Vehicle Registration', status: 'Missing' },
      { name: 'Vehicle Insurance', status: 'Missing' },
    ],
    ownerName: 'Chinedu Eze',
    ownerEmail: 'chinedu@quickdelivery.com',
    ownerPhone: '+234-806-789-0123',
  },
];

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState('All');
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const tabs = ['All', 'Pharmacies', 'Delivery Providers'];

  const filterApprovals = () => {
    let filtered = sampleApprovals;

    if (activeTab === 'Pharmacies') {
      filtered = filtered.filter((a) => a.type === 'Pharmacy');
    } else if (activeTab === 'Delivery Providers') {
      filtered = filtered.filter((a) => a.type === 'Delivery');
    }

    return filtered;
  };

  const filteredApprovals = filterApprovals();

  const openReviewModal = (
    approval: Approval,
    action: 'approve' | 'reject'
  ) => {
    setSelectedApproval(approval);
    setActionType(action);
    setIsReviewOpen(true);
    setRejectionReason('');
  };

  const handleConfirmAction = () => {
    setIsReviewOpen(false);
    setSelectedApproval(null);
    setActionType(null);
    setRejectionReason('');
  };

  const getDocumentIcon = (status: string) => {
    return status === 'Uploaded' ? '✅' : '❌';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pending Approvals"
        description="Review and approve new pharmacy and delivery provider registrations"
      />

      {/* Tabs */}
      <Tabs
        tabs={tabs.map((tab) => ({
          id: tab,
          label: tab,
        }))}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Approvals Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {filteredApprovals.map((approval) => (
          <Card
            key={approval.id}
            className="hover:shadow-lg transition-shadow duration-200"
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {approval.businessName}
                  </h3>
                  <p className="text-xs text-gray-600 uppercase tracking-wide mt-1">
                    {approval.type}
                  </p>
                </div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                  Pending
                </span>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Submitted Date */}
              <div className="pb-4 border-b border-gray-200">
                <p className="text-xs text-gray-600 uppercase tracking-wide">
                  Submitted
                </p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {approval.submittedDate}
                </p>
              </div>

              {/* Documents */}
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide mb-3">
                  Documents
                </p>
                <div className="space-y-2">
                  {approval.documents.map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">📄</span>
                        <span className="text-sm text-gray-700">
                          {doc.name}
                        </span>
                      </div>
                      <span className="text-lg">{getDocumentIcon(doc.status)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Owner Info */}
              <div className="space-y-3">
                <p className="text-xs text-gray-600 uppercase tracking-wide">
                  Owner Information
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <span className="text-gray-600 text-sm">Name:</span>
                    <span className="text-gray-900 font-medium text-sm">
                      {approval.ownerName}
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-lg flex-shrink-0">📧</span>
                    <span className="text-gray-900 text-sm break-all">
                      {approval.ownerEmail}
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-lg flex-shrink-0">📱</span>
                    <span className="text-gray-900 text-sm">
                      {approval.ownerPhone}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openReviewModal(approval, 'reject')}
                  className="flex-1"
                >
                  Reject
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => openReviewModal(approval, 'approve')}
                  className="flex-1"
                >
                  Approve
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredApprovals.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">No pending approvals in this category</p>
          </CardContent>
        </Card>
      )}

      {/* Review Modal */}
      <Modal
        isOpen={isReviewOpen && selectedApproval !== null}
        onClose={() => {
          setIsReviewOpen(false);
          setSelectedApproval(null);
          setActionType(null);
          setRejectionReason('');
        }}
        title={
          actionType === 'approve'
            ? `Approve ${selectedApproval?.businessName}`
            : `Reject ${selectedApproval?.businessName}`
        }
        size="md"
      >
        <div className="space-y-4">
          {actionType === 'reject' && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Reason for Rejection
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide a detailed reason for rejection (this will be communicated to the applicant)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                rows={4}
              />
            </div>
          )}

          {actionType === 'approve' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                This will automatically notify the applicant that their registration has been approved.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsReviewOpen(false);
                setSelectedApproval(null);
                setActionType(null);
                setRejectionReason('');
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
              {actionType === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
