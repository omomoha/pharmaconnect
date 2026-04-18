'use client';

import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import { getAvailableOrders, createAssignment } from '@/lib/services/delivery.service';

interface AvailableOrder {
  id: string;
  pharmacyId: string;
  pharmacyName: string;
  pharmacyAddress: string;
  pharmacyLatitude: number;
  pharmacyLongitude: number;
  deliveryAddress: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  total: number;
  deliveryFee: number;
  status: string;
  createdAt: Date | string;
}

type SortType = 'newest' | 'reward';

export default function AvailableOrdersPage() {
  const [orders, setOrders] = useState<AvailableOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortType>('newest');
  const [acceptModal, setAcceptModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<AvailableOrder | null>(null);
  const [accepting, setAccepting] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await getAvailableOrders();
      if (res.success && res.data) {
        setOrders((res.data.orders || []) as unknown as AvailableOrder[]);
      }
    } catch (error) {
      console.error('Failed to fetch available orders:', error);
      toast.error('Failed to load available orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const sortedOrders = [...orders].sort((a, b) => {
    if (sortBy === 'reward') {
      return (b.deliveryFee || 0) - (a.deliveryFee || 0);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleAcceptClick = (order: AvailableOrder) => {
    setSelectedOrder(order);
    setAcceptModal(true);
  };

  const handleConfirmAccept = async () => {
    if (!selectedOrder) return;

    setAccepting(true);
    try {
      const res = await createAssignment({
        orderId: selectedOrder.id,
        deliveryProviderId: '', // Will be filled by backend from auth context
        pickupLatitude: selectedOrder.pharmacyLatitude || 0,
        pickupLongitude: selectedOrder.pharmacyLongitude || 0,
        deliveryLatitude: selectedOrder.deliveryLatitude || 0,
        deliveryLongitude: selectedOrder.deliveryLongitude || 0,
      });

      if (res.success) {
        toast.success(`Delivery accepted from ${selectedOrder.pharmacyName}!`);
        setOrders(orders.filter((o) => o.id !== selectedOrder.id));
        setAcceptModal(false);
      } else {
        toast.error(res.error?.message || 'Failed to accept delivery');
      }
    } catch {
      toast.error('Failed to accept delivery');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Available Orders" description="Browse and accept new delivery orders" />
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Available Orders"
        description="Browse and accept new delivery orders"
      />

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2">
          <Button
            variant={sortBy === 'newest' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSortBy('newest')}
          >
            Newest First
          </Button>
          <Button
            variant={sortBy === 'reward' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSortBy('reward')}
          >
            Highest Reward
          </Button>
        </div>
        <div className="text-sm text-gray-600 flex items-center">
          {orders.length} orders available
        </div>
      </div>

      {/* Orders Grid */}
      {sortedOrders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500 text-lg">No available orders right now</p>
            <p className="text-gray-400 text-sm mt-2">Check back soon for new delivery requests</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sortedOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                {/* Pharmacy Info */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg">{order.pharmacyName}</h3>
                    <p className="text-sm text-gray-600">{order.pharmacyAddress}</p>
                  </div>
                  <StatusBadge status="Ready" size="sm" />
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-y border-gray-200">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                      Order Total
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {'\u20A6'}{(order.total || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                      Delivery Fee
                    </p>
                    <p className="text-lg font-bold text-primary-600">
                      {'\u20A6'}{(order.deliveryFee || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Location Info */}
                <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                  <div className="text-xs font-semibold text-gray-600">
                    Pickup: <span className="text-gray-900 font-normal">{order.pharmacyAddress}</span>
                  </div>
                  <div className="text-xs font-semibold text-gray-600">
                    Deliver to: <span className="text-gray-900 font-normal">{order.deliveryAddress || 'Address provided on accept'}</span>
                  </div>
                </div>

                {/* Accept Button */}
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => handleAcceptClick(order)}
                >
                  Accept Delivery
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Accept Confirmation Modal */}
      <Modal
        isOpen={acceptModal}
        onClose={() => setAcceptModal(false)}
        title="Confirm Delivery"
        size="sm"
      >
        <div className="space-y-4">
          {selectedOrder && (
            <>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">From</p>
                  <p className="font-semibold text-gray-900">{selectedOrder.pharmacyName}</p>
                  <p className="text-xs text-gray-500">{selectedOrder.pharmacyAddress}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Deliver to</p>
                  <p className="font-semibold text-gray-900">{selectedOrder.deliveryAddress || 'Customer address'}</p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-blue-700 mb-1">DELIVERY FEE</p>
                  <p className="text-2xl font-bold text-primary-600">
                    {'\u20A6'}{(selectedOrder.deliveryFee || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
                Accept this delivery order? You can navigate to the pickup location after confirmation.
              </p>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleConfirmAccept}
                  disabled={accepting}
                >
                  {accepting ? 'Accepting...' : 'Accept & Start'}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setAcceptModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
