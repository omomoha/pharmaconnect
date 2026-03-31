'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';

interface AvailableOrder {
  id: string;
  pharmacyName: string;
  deliveryArea: string;
  distance: number;
  estimatedTime: string;
  reward: number;
  priority: 'Normal' | 'High' | 'Urgent';
  pickupAddress: string;
  customerArea: string;
}

const SAMPLE_ORDERS: AvailableOrder[] = [
  {
    id: '1',
    pharmacyName: 'MediCare Stores',
    deliveryArea: 'Ikoyi to Ajose Adeogun',
    distance: 2.1,
    estimatedTime: '5-8 mins',
    reward: 2500,
    priority: 'Normal',
    pickupAddress: '789 VI Road, Lagos',
    customerArea: 'Ikoyi',
  },
  {
    id: '2',
    pharmacyName: 'HealthFirst Pharmacy',
    deliveryArea: 'Lekki to Ikoyi',
    distance: 4.2,
    estimatedTime: '10-12 mins',
    reward: 3500,
    priority: 'High',
    pickupAddress: '123 Lekki Phase 1, Lagos',
    customerArea: 'Lekki',
  },
  {
    id: '3',
    pharmacyName: 'PharmaPlus',
    deliveryArea: 'Ikeja to Allen Avenue',
    distance: 6.8,
    estimatedTime: '15-18 mins',
    reward: 4500,
    priority: 'Normal',
    pickupAddress: '555 Obafemi Awolowo Way, Ikeja',
    customerArea: 'Ikeja',
  },
  {
    id: '4',
    pharmacyName: 'Guardian Pharmacy',
    deliveryArea: 'Surulere to Yaba',
    distance: 5.3,
    estimatedTime: '12-15 mins',
    reward: 5000,
    priority: 'Urgent',
    pickupAddress: '321 Ikorodu Road, Surulere',
    customerArea: 'Yaba',
  },
  {
    id: '5',
    pharmacyName: 'Life Pharmacy',
    deliveryArea: 'Shomolu to Bariga',
    distance: 3.5,
    estimatedTime: '8-10 mins',
    reward: 2800,
    priority: 'Normal',
    pickupAddress: '111 Ikorodu Road, Shomolu',
    customerArea: 'Shomolu',
  },
  {
    id: '6',
    pharmacyName: 'Quick Med Pharmacy',
    deliveryArea: 'VI to Lekki',
    distance: 3.8,
    estimatedTime: '9-11 mins',
    reward: 3200,
    priority: 'High',
    pickupAddress: '456 Ligali Ayorinde, V.I',
    customerArea: 'Lekki',
  },
];

type SortType = 'distance' | 'reward';

export default function AvailableOrdersPage() {
  const [orders, setOrders] = useState<AvailableOrder[]>(SAMPLE_ORDERS);
  const [sortBy, setSortBy] = useState<SortType>('distance');
  const [acceptModal, setAcceptModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<AvailableOrder | null>(null);

  const sortedOrders = [...orders].sort((a, b) => {
    if (sortBy === 'distance') {
      return a.distance - b.distance;
    } else {
      return b.reward - a.reward;
    }
  });

  const handleAcceptClick = (order: AvailableOrder) => {
    setSelectedOrder(order);
    setAcceptModal(true);
  };

  const handleConfirmAccept = () => {
    if (!selectedOrder) return;
    // Remove order from available list
    setOrders(orders.filter((o) => o.id !== selectedOrder.id));
    setAcceptModal(false);
    alert(`Delivery accepted from ${selectedOrder.pharmacyName}!`);
  };

  const getPriorityIcon = (priority: string): string => {
    switch (priority) {
      case 'Urgent':
        return '🔴';
      case 'High':
        return '🟠';
      default:
        return '🟡';
    }
  };

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
            variant={sortBy === 'distance' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSortBy('distance')}
          >
            📍 Closest First
          </Button>
          <Button
            variant={sortBy === 'reward' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSortBy('reward')}
          >
            💰 Highest Reward
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
                {/* Pharmacy & Priority */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg">{order.pharmacyName}</h3>
                    <p className="text-sm text-gray-600">{order.deliveryArea}</p>
                  </div>
                  <StatusBadge status={order.priority} size="sm" />
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-3 gap-4 py-4 border-y border-gray-200">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                      Distance
                    </p>
                    <p className="text-lg font-bold text-gray-900">{order.distance} km</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                      Est. Time
                    </p>
                    <p className="text-lg font-bold text-gray-900">{order.estimatedTime}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                      Reward
                    </p>
                    <p className="text-lg font-bold text-primary-600">₦{order.reward.toLocaleString()}</p>
                  </div>
                </div>

                {/* Location Info */}
                <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                  <div className="text-xs font-semibold text-gray-600">
                    Pickup: <span className="text-gray-900 font-normal">{order.pickupAddress}</span>
                  </div>
                  <div className="text-xs font-semibold text-gray-600">
                    Deliver to: <span className="text-gray-900 font-normal">{order.customerArea}</span>
                  </div>
                </div>

                {/* Accept Button */}
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => handleAcceptClick(order)}
                >
                  {getPriorityIcon(order.priority)} Accept Delivery
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
                  <p className="text-xs text-gray-500">{selectedOrder.pickupAddress}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">To</p>
                  <p className="font-semibold text-gray-900">{selectedOrder.customerArea}</p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-blue-700 mb-1">ESTIMATED EARNINGS</p>
                  <p className="text-2xl font-bold text-primary-600">₦{selectedOrder.reward.toLocaleString()}</p>
                </div>

                <p className="text-sm text-gray-600">
                  Distance: <span className="font-semibold">{selectedOrder.distance} km</span> | Time:{' '}
                  <span className="font-semibold">{selectedOrder.estimatedTime}</span>
                </p>
              </div>

              <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
                Accept this delivery order? You can navigate to the pickup location after confirmation.
              </p>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleConfirmAccept}
                >
                  Accept & Start
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
