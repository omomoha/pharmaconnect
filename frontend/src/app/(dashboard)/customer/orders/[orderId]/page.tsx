'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';

// Sample order detail data
const SAMPLE_ORDER_DETAIL = {
  id: 'ORD-001',
  status: 'In Transit',
  pharmacy: {
    name: 'HealthPlus Pharmacy',
    location: 'Lekki, Lagos',
    phone: '+234 701 234 5678',
  },
  customer: {
    name: 'Chioma Adeyemi',
    address: '15, Allen Avenue, Ikoyi, Lagos',
    phone: '+234 803 456 7890',
  },
  rider: {
    name: 'Seun Oluwaseun',
    phone: '+234 705 123 4567',
    vehicleNumber: 'LAGOS-MK-123-XYZ',
    securityCode: '4782',
  },
  items: [
    {
      id: '1',
      name: 'Paracetamol 500mg Tablets',
      quantity: 2,
      unitPrice: 800,
      subtotal: 1600,
    },
    {
      id: '2',
      name: 'Vitamin C 1000mg Effervescent',
      quantity: 1,
      unitPrice: 450,
      subtotal: 450,
    },
  ],
  paymentSummary: {
    subtotal: 2050,
    deliveryFee: 450,
    total: 2500,
  },
  dates: {
    placed: '2026-03-24 10:30 AM',
    confirmed: '2026-03-24 10:45 AM',
    preparing: '2026-03-24 11:00 AM',
    inTransit: '2026-03-24 02:15 PM',
    estimated: '2026-03-24 03:00 PM',
  },
};

type TimelineStep =
  | 'placed'
  | 'confirmed'
  | 'preparing'
  | 'inTransit'
  | 'delivered';

const TIMELINE_STEPS: { step: TimelineStep; label: string }[] = [
  { step: 'placed', label: 'Placed' },
  { step: 'confirmed', label: 'Confirmed' },
  { step: 'preparing', label: 'Preparing' },
  { step: 'inTransit', label: 'In Transit' },
  { step: 'delivered', label: 'Delivered' },
];

export default function OrderDetailPage({
  params: _params,
}: {
  params: { orderId: string };
}) {
  const router = useRouter();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Map status to timeline step
  const currentStepIndex = TIMELINE_STEPS.findIndex(
    (s) => s.label === SAMPLE_ORDER_DETAIL.status
  );

  const handleCancelOrder = async () => {
    setIsCancelling(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsCancelling(false);
    setShowCancelModal(false);
    // Show success (in real app, would update order status)
  };

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Orders
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Order {SAMPLE_ORDER_DETAIL.id}
          </h1>
          <p className="text-gray-600 mt-1">
            Placed on {SAMPLE_ORDER_DETAIL.dates.placed}
          </p>
        </div>
        <StatusBadge status={SAMPLE_ORDER_DETAIL.status} size="md" />
      </div>

      {/* Timeline Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <h3 className="font-semibold text-gray-900">Order Progress</h3>
            <div className="flex flex-col md:flex-row gap-4 md:gap-2">
              {TIMELINE_STEPS.map((item, index) => (
                <div key={item.step} className="flex items-center flex-1">
                  {/* Step Circle */}
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                        index <= currentStepIndex
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {index < currentStepIndex ? (
                        <svg
                          className="w-6 h-6"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </div>
                    <p
                      className={`text-xs font-medium mt-2 text-center ${
                        index <= currentStepIndex
                          ? 'text-primary-600'
                          : 'text-gray-500'
                      }`}
                    >
                      {item.label}
                    </p>
                  </div>

                  {/* Line between steps */}
                  {index < TIMELINE_STEPS.length - 1 && (
                    <div
                      className={`h-1 flex-1 mx-1 mt-5 ${
                        index < currentStepIndex
                          ? 'bg-primary-600'
                          : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Pharmacy Info */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">Pharmacy Details</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Pharmacy Name</p>
                <p className="font-semibold text-gray-900">
                  {SAMPLE_ORDER_DETAIL.pharmacy.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-semibold text-gray-900">
                  {SAMPLE_ORDER_DETAIL.pharmacy.location}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-semibold text-gray-900">
                  {SAMPLE_ORDER_DETAIL.pharmacy.phone}
                </p>
              </div>
            </CardContent>
            <CardFooter className="bg-white border-t">
              <Button variant="primary" size="sm" className="w-full">
                Chat with Pharmacy
              </Button>
            </CardFooter>
          </Card>

          {/* Items Table */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">Order Items</h3>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Medication
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">
                        Qty
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">
                        Price
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {SAMPLE_ORDER_DETAIL.items.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-4 px-4 text-gray-700">{item.name}</td>
                        <td className="py-4 px-4 text-center text-gray-600">
                          {item.quantity}
                        </td>
                        <td className="py-4 px-4 text-right text-gray-600">
                          ₦{item.unitPrice.toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-right font-semibold text-gray-900">
                          ₦{item.subtotal.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">Delivery Address</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-semibold text-gray-900">
                  {SAMPLE_ORDER_DETAIL.customer.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="font-semibold text-gray-900">
                  {SAMPLE_ORDER_DETAIL.customer.address}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-semibold text-gray-900">
                  {SAMPLE_ORDER_DETAIL.customer.phone}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">Payment Summary</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold text-gray-900">
                  ₦{SAMPLE_ORDER_DETAIL.paymentSummary.subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">Delivery Fee</span>
                <span className="font-semibold text-gray-900">
                  ₦{SAMPLE_ORDER_DETAIL.paymentSummary.deliveryFee.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-3 bg-primary-50 px-3 rounded-lg">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-xl font-bold text-primary-600">
                  ₦{SAMPLE_ORDER_DETAIL.paymentSummary.total.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Rider Info */}
          {['In Transit', 'Delivered'].includes(SAMPLE_ORDER_DETAIL.status) && (
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-gray-900">Delivery Rider</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-semibold text-gray-900">
                    {SAMPLE_ORDER_DETAIL.rider.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold text-gray-900">
                    {SAMPLE_ORDER_DETAIL.rider.phone}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Vehicle</p>
                  <p className="font-semibold text-gray-900">
                    {SAMPLE_ORDER_DETAIL.rider.vehicleNumber}
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Security Code</p>
                  <p className="text-2xl font-bold text-secondary-600">
                    {SAMPLE_ORDER_DETAIL.rider.securityCode}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Share this with the rider
                  </p>
                </div>
              </CardContent>
              <CardFooter className="bg-white border-t">
                <Button variant="primary" size="sm" className="w-full">
                  Chat with Rider
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            {['Pending', 'Confirmed'].includes(SAMPLE_ORDER_DETAIL.status) && (
              <Button
                variant="outline"
                size="md"
                className="w-full !border-red-500 !text-red-600 hover:!bg-red-50"
                onClick={() => setShowCancelModal(true)}
              >
                Cancel Order
              </Button>
            )}
            <Link href="/dashboard/customer/messages" className="block">
              <Button variant="secondary" size="md" className="w-full">
                View Messages
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Cancel Order Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Order"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to cancel this order? This action cannot be
            undone.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">
              A refund will be processed within 2-3 business days if payment has
              been received.
            </p>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => setShowCancelModal(false)}
              className="flex-1"
            >
              Keep Order
            </Button>
            <Button
              variant="outline"
              className="flex-1 !border-red-500 !text-red-600 hover:!bg-red-50"
              onClick={handleCancelOrder}
              isLoading={isCancelling}
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Order'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
