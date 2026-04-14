'use client';

import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import { getMyDeliveries, updateAssignmentStatus, verifySecurityCode } from '@/lib/services/delivery.service';
import type { DeliveryAssignment } from '@/shared/types';
import { DeliveryAssignmentStatus } from '@/shared/types';

type DeliveryItem = DeliveryAssignment & {
  riderCode?: string;
  customerCode?: string;
};

const STATUS_MAP: Record<string, string> = {
  accepted: 'Accepted',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  arrived: 'Arriving',
};

const NEXT_STATUS: Record<string, string> = {
  accepted: 'picked_up',
  picked_up: 'in_transit',
  in_transit: 'arrived',
};

export default function ActiveDeliveriesPage() {
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryItem | null>(null);
  const [verifyModal, setVerifyModal] = useState(false);
  const [customerCodeInput, setCustomerCodeInput] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchDeliveries = useCallback(async () => {
    try {
      const res = await getMyDeliveries();
      if (res.success && res.data) {
        // Filter for active statuses only
        const activeStatuses: string[] = [
          DeliveryAssignmentStatus.ACCEPTED,
          DeliveryAssignmentStatus.PICKED_UP,
          DeliveryAssignmentStatus.IN_TRANSIT,
          DeliveryAssignmentStatus.ARRIVED,
        ];
        const active = (res.data.deliveries || []).filter((d) =>
          activeStatuses.includes(d.status)
        );
        setDeliveries(active);
      }
    } catch (error) {
      console.error('Failed to fetch deliveries:', error);
      toast.error('Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  const handleStatusUpdate = async (deliveryId: string) => {
    const delivery = deliveries.find((d) => d.id === deliveryId);
    if (!delivery) return;

    const nextStatus = NEXT_STATUS[delivery.status];
    if (!nextStatus) return;

    setUpdating(true);
    try {
      const res = await updateAssignmentStatus(deliveryId, nextStatus as any);
      if (res.success) {
        toast.success(`Status updated to ${STATUS_MAP[nextStatus] || nextStatus}`);
        fetchDeliveries();
      } else {
        toast.error(res.error?.message || 'Failed to update status');
      }
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleArrivingClick = (delivery: DeliveryItem) => {
    setSelectedDelivery(delivery);
    setVerifyModal(true);
    setCustomerCodeInput('');
    setVerificationError('');
  };

  const handleVerifyCode = async () => {
    if (!selectedDelivery) return;

    if (!customerCodeInput.trim() || customerCodeInput.length < 6) {
      setVerificationError('Please enter the 6-digit customer code');
      return;
    }

    setUpdating(true);
    try {
      const res = await verifySecurityCode(selectedDelivery.id, customerCodeInput);
      if (res.success) {
        toast.success('Delivery verified successfully!');
        setVerifyModal(false);
        fetchDeliveries();
      } else {
        setVerificationError(res.error?.message || 'Invalid code');
      }
    } catch {
      setVerificationError('Verification failed. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Active Deliveries" description="Manage your current delivery orders" />
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Active Deliveries"
        description="Manage your current delivery orders"
      />

      {deliveries.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500 text-lg">No active deliveries at the moment</p>
            <p className="text-gray-400 text-sm mt-2">
              Check available orders to accept new deliveries
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {deliveries.map((delivery) => (
            <Card key={delivery.id} className="hover:shadow-lg">
              <CardContent className="p-6 space-y-4">
                {/* Header Row */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-4 border-b border-gray-200">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-gray-900">
                        {delivery.orderId?.slice(0, 13) || delivery.id.slice(0, 8)}
                      </span>
                      <StatusBadge status={STATUS_MAP[delivery.status] || delivery.status} size="sm" />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {new Date(delivery.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Security Code Section */}
                {delivery.status === 'arrived' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-blue-700 uppercase mb-1">
                        Customer Code to Verify
                      </p>
                      <Input
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                        value={customerCodeInput}
                        onChange={(e) => setCustomerCodeInput(e.target.value)}
                      />
                    </div>
                    {delivery.riderCode && (
                      <div>
                        <p className="text-xs font-semibold text-blue-700 uppercase mb-2">
                          Your Code (Show Customer)
                        </p>
                        <div className="bg-white border-2 border-blue-300 rounded-lg p-3 text-center">
                          <p className="text-3xl font-bold text-primary-600 tracking-widest">
                            {delivery.riderCode}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  {delivery.status !== 'arrived' ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleStatusUpdate(delivery.id)}
                      disabled={updating}
                      className="flex-1"
                    >
                      {updating ? 'Updating...' : `Update Status → ${STATUS_MAP[NEXT_STATUS[delivery.status]] || 'Next'}`}
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleArrivingClick(delivery)}
                      disabled={updating}
                      className="flex-1"
                    >
                      Verify & Deliver
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Verification Modal */}
      <Modal
        isOpen={verifyModal}
        onClose={() => setVerifyModal(false)}
        title="Verify Delivery"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Enter the 6-digit code provided by the customer to confirm delivery.
          </p>

          <Input
            label="Customer Verification Code"
            placeholder="000000"
            maxLength={6}
            value={customerCodeInput}
            onChange={(e) => setCustomerCodeInput(e.target.value)}
            error={verificationError}
          />

          {selectedDelivery?.riderCode && (
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <strong>Your Code to Show Customer:</strong>
              <div className="text-2xl font-bold text-primary-600 mt-2 tracking-widest">
                {selectedDelivery.riderCode}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleVerifyCode}
              disabled={updating}
            >
              {updating ? 'Verifying...' : 'Verify & Complete Delivery'}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setVerifyModal(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
