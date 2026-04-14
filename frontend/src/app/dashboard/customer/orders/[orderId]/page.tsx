'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface OrderItem {
  id: string;
  drugName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface OrderDetail {
  id: string;
  customerId: string;
  pharmacyId: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  deliveryAddress: string;
  notes?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_LABEL_MAP: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready_for_pickup: 'Ready',
  out_for_delivery: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

type TimelineStep = 'placed' | 'confirmed' | 'preparing' | 'inTransit' | 'delivered';

const TIMELINE_STEPS: { step: TimelineStep; label: string; backendStatuses: string[] }[] = [
  { step: 'placed', label: 'Placed', backendStatuses: ['pending'] },
  { step: 'confirmed', label: 'Confirmed', backendStatuses: ['confirmed'] },
  { step: 'preparing', label: 'Preparing', backendStatuses: ['preparing', 'ready_for_pickup'] },
  { step: 'inTransit', label: 'In Transit', backendStatuses: ['out_for_delivery'] },
  { step: 'delivered', label: 'Delivered', backendStatuses: ['delivered'] },
];

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.orderId as string;
  const { user } = useAuth();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const getAuthHeaders = useCallback(async () => {
    if (!user) return {};
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }, [user]);

  useEffect(() => {
    async function loadOrder() {
      if (!user || !orderId) return;
      setLoading(true);
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_URL}/orders/${orderId}`, { headers });
        const result = await res.json();

        if (result.success && result.data) {
          setOrder(result.data.order);
          setItems(result.data.items || []);
        } else {
          toast.error('Order not found');
        }
      } catch {
        toast.error('Failed to load order details');
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [user, orderId, getAuthHeaders]);

  const getCurrentStepIndex = (status: string): number => {
    for (let i = 0; i < TIMELINE_STEPS.length; i++) {
      if (TIMELINE_STEPS[i].backendStatuses.includes(status)) return i;
    }
    return 0;
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    setIsCancelling(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/orders/${order.id}/cancel`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason: 'Cancelled by customer' }),
      });
      const result = await res.json();
      if (result.success) {
        setOrder(prev => prev ? { ...prev, status: 'cancelled' } : null);
        toast.success('Order cancelled successfully');
      } else {
        toast.error(result.error?.message || 'Failed to cancel order');
      }
    } catch {
      toast.error('Failed to cancel order');
    } finally {
      setIsCancelling(false);
      setShowCancelModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-gray-600">Order not found</p>
        <Button variant="primary" size="sm" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const currentStepIndex = getCurrentStepIndex(order.status);
  const displayStatus = STATUS_LABEL_MAP[order.status] || order.status;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Orders
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order {order.id.slice(0, 8)}...</h1>
          <p className="text-gray-600 mt-1">
            Placed on {new Date(order.createdAt).toLocaleDateString('en-NG', {
              year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
        <StatusBadge status={displayStatus} size="md" />
      </div>

      {/* Timeline Progress */}
      {order.status !== 'cancelled' && order.status !== 'refunded' && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <h3 className="font-semibold text-gray-900">Order Progress</h3>
              <div className="flex flex-col md:flex-row gap-4 md:gap-2">
                {TIMELINE_STEPS.map((item, index) => (
                  <div key={item.step} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                        index <= currentStepIndex ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {index < currentStepIndex ? (
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : index + 1}
                      </div>
                      <p className={`text-xs font-medium mt-2 text-center ${
                        index <= currentStepIndex ? 'text-primary-600' : 'text-gray-500'
                      }`}>{item.label}</p>
                    </div>
                    {index < TIMELINE_STEPS.length - 1 && (
                      <div className={`h-1 flex-1 mx-1 mt-5 ${
                        index < currentStepIndex ? 'bg-primary-600' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Items Table */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">Order Items</h3>
            </CardHeader>
            <CardContent>
              {items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Medication</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Qty</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Price</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-4 text-gray-700">{item.drugName}</td>
                          <td className="py-4 px-4 text-center text-gray-600">{item.quantity}</td>
                          <td className="py-4 px-4 text-right text-gray-600">₦{item.unitPrice?.toLocaleString()}</td>
                          <td className="py-4 px-4 text-right font-semibold text-gray-900">₦{item.subtotal?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No items data available</p>
              )}
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">Delivery Address</h3>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-gray-900">{order.deliveryAddress}</p>
              {order.notes && (
                <p className="text-sm text-gray-600 mt-2">Notes: {order.notes}</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">Payment Summary</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold text-gray-900">₦{order.subtotal?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">Delivery Fee</span>
                <span className="font-semibold text-gray-900">₦{order.deliveryFee?.toLocaleString() || '0'}</span>
              </div>
              {order.serviceFee > 0 && (
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Service Fee</span>
                  <span className="font-semibold text-gray-900">₦{order.serviceFee?.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between py-3 bg-primary-50 px-3 rounded-lg">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-xl font-bold text-primary-600">₦{order.total?.toLocaleString()}</span>
              </div>
              <div className="text-sm text-gray-500">
                Payment: <StatusBadge status={order.paymentStatus === 'paid' ? 'Completed' : 'Pending'} size="sm" />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-2">
            {['pending', 'confirmed'].includes(order.status) && (
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
              <Button variant="secondary" size="md" className="w-full">View Messages</Button>
            </Link>
          </div>
        </div>
      </div>

      <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} title="Cancel Order" size="md">
        <div className="space-y-4">
          <p className="text-gray-600">Are you sure you want to cancel this order? This action cannot be undone.</p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">A refund will be processed within 2-3 business days if payment has been received.</p>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowCancelModal(false)} className="flex-1">Keep Order</Button>
            <Button variant="outline" className="flex-1 !border-red-500 !text-red-600 hover:!bg-red-50" onClick={handleCancelOrder} isLoading={isCancelling}>
              {isCancelling ? 'Cancelling...' : 'Cancel Order'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
