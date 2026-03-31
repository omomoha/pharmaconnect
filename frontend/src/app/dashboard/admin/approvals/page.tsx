'use client';

import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Tabs from '@/components/ui/Tabs';
import Modal from '@/components/ui/Modal';
import {
  getPendingPharmacies,
  getPendingProviders,
  approvePharmacy,
  rejectPharmacy,
  approveProvider,
  rejectProvider,
} from '@/lib/services/admin.service';
import toast from 'react-hot-toast';

/** Unified type for displaying both pharmacies and delivery providers */
interface ApprovalItem {
  id: string;
  businessName: string;
  type: 'Pharmacy' | 'Delivery';
  submittedDate: string;
  documents: { name: string; url: string; status: 'Uploaded' | 'Missing' }[];
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  licenseNumber?: string;
  cacNumber?: string;
  address: string;
}

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState('All');
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [selectedApproval, setSelectedApproval] = useState<ApprovalItem | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Document preview modal
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
  const [previewDocName, setPreviewDocName] = useState<string>('');

  const tabs = ['All', 'Pharmacies', 'Delivery Providers'];

  /** Fetch all pending approvals from the backend */
  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [pharmacyRes, providerRes] = await Promise.all([
        getPendingPharmacies(),
        getPendingProviders(),
      ]);

      const items: ApprovalItem[] = [];

      // Map pharmacies
      if (pharmacyRes.success && pharmacyRes.data) {
        const pharmacies = (pharmacyRes.data as any).pharmacies || pharmacyRes.data;
        const pharmacyList = Array.isArray(pharmacies) ? pharmacies : [];
        pharmacyList.forEach((p: any) => {
          items.push({
            id: p.id,
            businessName: p.name,
            type: 'Pharmacy',
            submittedDate: p.createdAt
              ? new Date(p.createdAt._seconds ? p.createdAt._seconds * 1000 : p.createdAt).toLocaleDateString()
              : 'Unknown',
            documents: [
              {
                name: 'Pharmacy License',
                url: p.licenseDocUrl || '',
                status: p.licenseDocUrl ? 'Uploaded' : 'Missing',
              },
              {
                name: 'CAC Certificate',
                url: p.cacDocUrl || '',
                status: p.cacDocUrl ? 'Uploaded' : 'Missing',
              },
              {
                name: "Owner's Government ID",
                url: p.ownerIdDocUrl || '',
                status: p.ownerIdDocUrl ? 'Uploaded' : 'Missing',
              },
            ],
            ownerName: p.ownerName || 'N/A',
            ownerEmail: p.email || 'N/A',
            ownerPhone: p.phoneNumber || 'N/A',
            licenseNumber: p.licenseNumber,
            cacNumber: p.cacNumber,
            address: p.address || 'N/A',
          });
        });
      }

      // Map delivery providers
      if (providerRes.success && providerRes.data) {
        const providers = (providerRes.data as any).providers || providerRes.data;
        const providerList = Array.isArray(providers) ? providers : [];
        providerList.forEach((d: any) => {
          items.push({
            id: d.id,
            businessName: d.businessName,
            type: 'Delivery',
            submittedDate: d.createdAt
              ? new Date(d.createdAt._seconds ? d.createdAt._seconds * 1000 : d.createdAt).toLocaleDateString()
              : 'Unknown',
            documents: [
              {
                name: 'CAC Certificate',
                url: d.cacDocUrl || '',
                status: d.cacDocUrl ? 'Uploaded' : 'Missing',
              },
              {
                name: "Owner's Government ID",
                url: d.ownerIdDocUrl || '',
                status: d.ownerIdDocUrl ? 'Uploaded' : 'Missing',
              },
              {
                name: 'Vehicle Registration / Insurance',
                url: d.vehicleDocUrl || '',
                status: d.vehicleDocUrl ? 'Uploaded' : 'Missing',
              },
            ],
            ownerName: d.ownerName || 'N/A',
            ownerEmail: d.email || 'N/A',
            ownerPhone: d.phoneNumber || 'N/A',
            cacNumber: d.cacNumber,
            address: d.address || 'N/A',
          });
        });
      }

      // Sort by most recent first
      items.sort((a, b) => {
        const dateA = new Date(a.submittedDate).getTime();
        const dateB = new Date(b.submittedDate).getTime();
        return dateB - dateA;
      });

      setApprovals(items);
    } catch (err) {
      console.error('Failed to fetch approvals:', err);
      setError('Failed to load pending approvals. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  /** Filter by active tab */
  const filteredApprovals = approvals.filter((a) => {
    if (activeTab === 'Pharmacies') return a.type === 'Pharmacy';
    if (activeTab === 'Delivery Providers') return a.type === 'Delivery';
    return true;
  });

  /** Open review modal */
  const openReviewModal = (approval: ApprovalItem, action: 'approve' | 'reject') => {
    setSelectedApproval(approval);
    setActionType(action);
    setIsReviewOpen(true);
    setRejectionReason('');
  };

  /** Handle approve or reject */
  const handleConfirmAction = async () => {
    if (!selectedApproval || !actionType) return;

    setActionLoading(true);

    try {
      let result;

      if (actionType === 'approve') {
        result =
          selectedApproval.type === 'Pharmacy'
            ? await approvePharmacy(selectedApproval.id)
            : await approveProvider(selectedApproval.id);
      } else {
        result =
          selectedApproval.type === 'Pharmacy'
            ? await rejectPharmacy(selectedApproval.id, rejectionReason)
            : await rejectProvider(selectedApproval.id, rejectionReason);
      }

      if (result.success) {
        toast.success(
          `${selectedApproval.businessName} has been ${actionType === 'approve' ? 'approved' : 'rejected'}.`
        );
        // Remove from local list
        setApprovals((prev) => prev.filter((a) => a.id !== selectedApproval.id));
      } else {
        toast.error(result.error?.message || `Failed to ${actionType} registration.`);
      }
    } catch (err) {
      toast.error(`Failed to ${actionType} registration. Please try again.`);
    } finally {
      setActionLoading(false);
      setIsReviewOpen(false);
      setSelectedApproval(null);
      setActionType(null);
      setRejectionReason('');
    }
  };

  /** Open document preview */
  const openDocPreview = (docName: string, docUrl: string) => {
    if (!docUrl) return;
    setPreviewDocName(docName);
    setPreviewDocUrl(docUrl);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pending Approvals"
        description="Review and approve new pharmacy and delivery provider registrations"
      />

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{approvals.length}</p>
          <p className="text-sm text-gray-500">Total Pending</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-primary-600">
            {approvals.filter((a) => a.type === 'Pharmacy').length}
          </p>
          <p className="text-sm text-gray-500">Pharmacies</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">
            {approvals.filter((a) => a.type === 'Delivery').length}
          </p>
          <p className="text-sm text-gray-500">Delivery Providers</p>
        </div>
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

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          <p className="text-gray-500 mt-3">Loading pending approvals...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button variant="primary" onClick={fetchApprovals}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Approvals Grid */}
      {!loading && !error && (
        <>
          <div className="grid md:grid-cols-2 gap-6">
            {filteredApprovals.map((approval) => (
              <Card
                key={`${approval.type}-${approval.id}`}
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

                <CardContent className="space-y-5">
                  {/* Submitted Date & Address */}
                  <div className="pb-4 border-b border-gray-200 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Submitted</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {approval.submittedDate}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Address</p>
                      <p className="text-sm text-gray-700 mt-1 truncate" title={approval.address}>
                        {approval.address}
                      </p>
                    </div>
                  </div>

                  {/* Registration Numbers */}
                  {(approval.licenseNumber || approval.cacNumber) && (
                    <div className="pb-4 border-b border-gray-200 grid grid-cols-2 gap-4">
                      {approval.licenseNumber && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">License #</p>
                          <p className="text-sm font-mono text-gray-900 mt-1">{approval.licenseNumber}</p>
                        </div>
                      )}
                      {approval.cacNumber && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">CAC #</p>
                          <p className="text-sm font-mono text-gray-900 mt-1">{approval.cacNumber}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Documents */}
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide mb-3">Documents</p>
                    <div className="space-y-2">
                      {approval.documents.map((doc, index) => (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            doc.status === 'Uploaded'
                              ? 'bg-green-50 hover:bg-green-100 cursor-pointer'
                              : 'bg-red-50'
                          }`}
                          onClick={() =>
                            doc.status === 'Uploaded' && openDocPreview(doc.name, doc.url)
                          }
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">
                              {doc.status === 'Uploaded' ? '✅' : '❌'}
                            </span>
                            <span className="text-sm text-gray-700">{doc.name}</span>
                          </div>
                          {doc.status === 'Uploaded' ? (
                            <span className="text-xs text-primary-600 font-medium">
                              View
                            </span>
                          ) : (
                            <span className="text-xs text-red-500 font-medium">Missing</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Owner Info */}
                  <div className="space-y-2">
                    <p className="text-xs text-gray-600 uppercase tracking-wide">Owner Information</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500 w-14">Name:</span>
                        <span className="text-gray-900 font-medium">{approval.ownerName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500 w-14">Email:</span>
                        <span className="text-gray-900 break-all">{approval.ownerEmail}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500 w-14">Phone:</span>
                        <span className="text-gray-900">{approval.ownerPhone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      onClick={() => openReviewModal(approval, 'reject')}
                      className="flex-1 !text-red-600 !border-red-200 hover:!bg-red-50"
                    >
                      Reject
                    </Button>
                    <Button
                      variant="primary"
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

          {/* Empty State */}
          {filteredApprovals.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="text-4xl mb-3">🎉</div>
                <p className="text-gray-600 font-medium">No pending approvals</p>
                <p className="text-sm text-gray-500 mt-1">
                  All registrations have been reviewed. Check back later.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Approve / Reject Confirmation Modal */}
      <Modal
        isOpen={isReviewOpen && selectedApproval !== null}
        onClose={() => {
          if (!actionLoading) {
            setIsReviewOpen(false);
            setSelectedApproval(null);
            setActionType(null);
            setRejectionReason('');
          }
        }}
        title={
          actionType === 'approve'
            ? `Approve ${selectedApproval?.businessName}`
            : `Reject ${selectedApproval?.businessName}`
        }
        size="md"
      >
        <div className="space-y-4">
          {actionType === 'approve' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <strong>{selectedApproval?.businessName}</strong> will be approved and become visible
                to customers on the platform. The owner will be notified.
              </p>
            </div>
          )}

          {actionType === 'reject' && (
            <>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  <strong>{selectedApproval?.businessName}</strong> will be rejected. Please provide
                  a reason so the applicant knows what to fix.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Reason for Rejection
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Pharmacy license is expired, please upload a valid license..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  rows={4}
                />
              </div>
            </>
          )}

          {/* Document Summary */}
          {selectedApproval && (
            <div className="border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Document Status</p>
              <div className="space-y-1">
                {selectedApproval.documents.map((doc, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span>{doc.status === 'Uploaded' ? '✅' : '❌'}</span>
                    <span className="text-gray-700">{doc.name}</span>
                  </div>
                ))}
              </div>
              {selectedApproval.documents.some((d) => d.status === 'Missing') && (
                <p className="text-xs text-amber-600 mt-2 font-medium">
                  Warning: Some documents are missing
                </p>
              )}
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
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmAction}
              className={`flex-1 ${actionType === 'reject' ? '!bg-red-600 hover:!bg-red-700' : ''}`}
              isLoading={actionLoading}
              disabled={actionType === 'reject' && !rejectionReason.trim()}
            >
              {actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Document Preview Modal */}
      <Modal
        isOpen={previewDocUrl !== null}
        onClose={() => {
          setPreviewDocUrl(null);
          setPreviewDocName('');
        }}
        title={previewDocName}
        size="xl"
      >
        <div className="space-y-4">
          {previewDocUrl && (
            <>
              {/* Try to render as image; if it's a PDF, show an iframe */}
              {previewDocUrl.toLowerCase().includes('.pdf') ? (
                <iframe
                  src={previewDocUrl}
                  className="w-full h-[500px] rounded-lg border border-gray-200"
                  title={previewDocName}
                />
              ) : (
                <div className="flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewDocUrl}
                    alt={previewDocName}
                    className="max-w-full max-h-[500px] rounded-lg border border-gray-200 object-contain"
                  />
                </div>
              )}
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">Document preview</p>
                <a
                  href={previewDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Open in new tab
                </a>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
