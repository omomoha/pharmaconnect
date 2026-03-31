'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';

interface DeliveryItem {
  id: string;
  orderId: string;
  customerName: string;
  pharmacyName: string;
  pickupAddress: string;
  deliveryAddress: string;
  distance: number;
  eta: string;
  status: 'Picked Up' | 'In Transit' | 'Arriving';
  customerCode?: string;
  riderCode: string;
}

const SAMPLE_DELIVERIES: DeliveryItem[] = [
  {
    id: '1',
    orderId: 'ORD-2024-0001',
    customerName: 'Chioma Adeyemi',
    pharmacyName: 'HealthFirst Pharmacy, Lekki',
    pickupAddress: '123 Lekki Phase 1, Lagos',
    deliveryAddress: '456 Ikoyi Avenue, Lagos',
    distance: 4.2,
    eta: '8 mins',
    status: 'In Transit',
    riderCode: 'XK9M',
  },
  {
    id: '2',
    orderId: 'ORD-2024-0002',
    customerName: 'Okoro Chinedu',
    pharmacyName: 'MediCare Stores, V.I',
    pickupAddress: '789 VI Road, Lagos',
    deliveryAddress: '321 Ajose Adeogun, V.I',
    distance: 2.1,
    eta: '5 mins',
    status: 'Arriving',
    riderCode: 'PQ7L',
  },
  {
    id: '3',
    orderId: 'ORD-2024-0003',
    customerName: 'Zainab Mohammed',
    pharmacyName: 'PharmaPlus, Ikeja',
    pickupAddress: '555 Obafemi Awolowo Way, Ikeja',
    deliveryAddress: '777 Allen Avenue, Ikeja',
    distance: 6.8,
    eta: '15 mins',
    status: 'Picked Up',
    riderCode: 'RT2K',
  },
];

export default function ActiveDeliveriesPage() {
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>(SAMPLE_DELIVERIES);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryItem | null>(null);
  const [_statusDropdown, _setStatusDropdown] = useState<string | null>(null);
  const [verifyModal, setVerifyModal] = useState(false);
  const [customerCodeInput, setCustomerCodeInput] = useState('');
  const [verificationError, setVerificationError] = useState('');

  const getNextStatus = (current: string): string => {
    switch (current) {
      case 'Picked Up':
        return 'In Transit';
      case 'In Transit':
        return 'Arriving';
      case 'Arriving':
        return 'Delivered';
      default:
        return current;
    }
  };

  const handleStatusUpdate = (deliveryId: string) => {
    setDeliveries((prev) =>
      prev.map((d) =>
        d.id === deliveryId
          ? {
              ...d,
              status:
                (getNextStatus(d.status) as
                  | 'Picked Up'
                  | 'In Transit'
                  | 'Arriving') || d.status,
            }
          : d
      )
    );
    _setStatusDropdown(null);
  };

  const handleArrivingClick = (delivery: DeliveryItem) => {
    setSelectedDelivery(delivery);
    setVerifyModal(true);
    setCustomerCodeInput('');
    setVerificationError('');
  };

  const handleVerifyCode = () => {
    if (!selectedDelivery) return;

    // Simple verification logic - in real app this would be sent to backend
    if (customerCodeInput.trim()) {
      setVerificationError('');
      // Simulate successful verification
      alert(
        `Code verified! Customer ${selectedDelivery.customerName} confirmed receipt.`
      );
      setVerifyModal(false);
      handleStatusUpdate(selectedDelivery.id);
    } else {
      setVerificationError('Please enter the customer code');
    }
  };

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
                      <span className="font-bold text-gray-900">{delivery.orderId}</span>
                      <StatusBadge status={delivery.status} size="sm" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700">
                      {delivery.customerName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{delivery.pharmacyName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{delivery.distance} km</p>
                    <p className="text-sm text-gray-500">ETA: {delivery.eta}</p>
                  </div>
                </div>

                {/* Address Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 border-b border-gray-100">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                      Pickup
                    </p>
                    <p className="text-sm text-gray-700">{delivery.pickupAddress}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                      Delivery
                    </p>
                    <p className="text-sm text-gray-700">{delivery.deliveryAddress}</p>
                  </div>
                </div>

                {/* Security Code Section */}
                {delivery.status === 'Arriving' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-blue-700 uppercase mb-1">
                        Customer Code to Verify
                      </p>
                      <Input
                        placeholder="Enter 4-digit code"
                        maxLength={4}
                        className="uppercase"
                        value={customerCodeInput}
                        onChange={(e) => setCustomerCodeInput(e.target.value.toUpperCase())}
                      />
                      {verificationError && (
                        <p className="text-xs text-red-600 mt-2">{verificationError}</p>
                      )}
                    </div>
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
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  {delivery.status !== 'Arriving' ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleStatusUpdate(delivery.id)}
                      className="flex-1"
                    >
                      Update Status → {getNextStatus(delivery.status)}
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleArrivingClick(delivery)}
                      className="flex-1"
                    >
                      Verify & Deliver
                    </Button>
                  )}

                  <Button variant="outline" size="sm" className="flex-1 sm:flex-initial">
                    📍 Navigate
                  </Button>

                  <Button variant="ghost" size="sm" className="flex-1 sm:flex-initial">
                    ☎️ Call
                  </Button>
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
            Enter the 4-digit code provided by {selectedDelivery?.customerName} to confirm delivery.
          </p>

          <Input
            label="Customer Verification Code"
            placeholder="0000"
            maxLength={4}
            value={customerCodeInput}
            onChange={(e) => setCustomerCodeInput(e.target.value.toUpperCase())}
            error={verificationError}
          />

          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            <strong>Your Code to Show Customer:</strong>
            <div className="text-2xl font-bold text-primary-600 mt-2 tracking-widest">
              {selectedDelivery?.riderCode}
            </div>
          </p>

          <div className="flex gap-3 pt-4">
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleVerifyCode}
            >
              Verify & Complete Delivery
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
