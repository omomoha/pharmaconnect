'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import StatsCard from '@/components/ui/StatsCard';
import Tabs from '@/components/ui/Tabs';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';

interface Order {
  id: string;
  orderNumber: string;
  customer: string;
  pharmacy: string;
  rider: string;
  date: string;
  status: 'Active' | 'Completed' | 'Disputed' | 'Cancelled';
  total: string;
  items: number;
}

const sampleOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'ORD-2026-001',
    customer: 'John Okafor',
    pharmacy: 'Amara Pharmacy',
    rider: 'Samuel Adekunle',
    date: '2026-03-26',
    status: 'Completed',
    total: '₦8,500',
    items: 5,
  },
  {
    id: '2',
    orderNumber: 'ORD-2026-002',
    customer: 'Chioma Adeyemi',
    pharmacy: 'HealthCare Plus',
    rider: 'Blessing Nwosu',
    date: '2026-03-26',
    status: 'Active',
    total: '₦12,300',
    items: 8,
  },
  {
    id: '3',
    orderNumber: 'ORD-2026-003',
    customer: 'Tunde Ibrahim',
    pharmacy: 'MedPlus Pharmacy',
    rider: 'Ibrahim Hassan',
    date: '2026-03-25',
    status: 'Completed',
    total: '₦6,200',
    items: 3,
  },
  {
    id: '4',
    orderNumber: 'ORD-2026-004',
    customer: 'Ngozi Obi',
    pharmacy: 'ProHealth Stores',
    rider: 'Kunle Adebayo',
    date: '2026-03-25',
    status: 'Disputed',
    total: '₦15,750',
    items: 10,
  },
  {
    id: '5',
    orderNumber: 'ORD-2026-005',
    customer: 'Blessing Nwosu',
    pharmacy: 'HealthCare Plus',
    rider: 'Tunde Obi',
    date: '2026-03-24',
    status: 'Completed',
    total: '₦9,800',
    items: 6,
  },
  {
    id: '6',
    orderNumber: 'ORD-2026-006',
    customer: 'Amara Johnson',
    pharmacy: 'Amara Pharmacy',
    rider: 'Samuel Adekunle',
    date: '2026-03-24',
    status: 'Active',
    total: '₦11,200',
    items: 7,
  },
  {
    id: '7',
    orderNumber: 'ORD-2026-007',
    customer: 'Emeka Okonkwo',
    pharmacy: 'MedPlus Pharmacy',
    rider: 'Ibrahim Hassan',
    date: '2026-03-23',
    status: 'Cancelled',
    total: '₦5,600',
    items: 4,
  },
  {
    id: '8',
    orderNumber: 'ORD-2026-008',
    customer: 'Ayo Adebayo',
    pharmacy: 'Premium Pharmacy',
    rider: 'Blessing Nwosu',
    date: '2026-03-23',
    status: 'Completed',
    total: '₦13,400',
    items: 9,
  },
  {
    id: '9',
    orderNumber: 'ORD-2026-009',
    customer: 'Zainab Mohammed',
    pharmacy: 'HealthCare Plus',
    rider: 'Kunle Adebayo',
    date: '2026-03-22',
    status: 'Active',
    total: '₦7,900',
    items: 5,
  },
  {
    id: '10',
    orderNumber: 'ORD-2026-010',
    customer: 'Oluwaseun Bello',
    pharmacy: 'ProHealth Stores',
    rider: 'Samuel Adekunle',
    date: '2026-03-22',
    status: 'Disputed',
    total: '₦18,200',
    items: 12,
  },
  {
    id: '11',
    orderNumber: 'ORD-2026-011',
    customer: 'Fatima Abubakar',
    pharmacy: 'Amara Pharmacy',
    rider: 'Tunde Obi',
    date: '2026-03-21',
    status: 'Completed',
    total: '₦10,100',
    items: 6,
  },
  {
    id: '12',
    orderNumber: 'ORD-2026-012',
    customer: 'David Okoro',
    pharmacy: 'MedPlus Pharmacy',
    rider: 'Ibrahim Hassan',
    date: '2026-03-21',
    status: 'Completed',
    total: '₦14,500',
    items: 8,
  },
];

export default function OrdersManagementPage() {
  const [activeTab, setActiveTab] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const tabs = ['All', 'Active', 'Completed', 'Disputed', 'Cancelled'];

  const filterOrders = () => {
    let filtered = sampleOrders;

    if (activeTab === 'Active') {
      filtered = filtered.filter((o) => o.status === 'Active');
    } else if (activeTab === 'Completed') {
      filtered = filtered.filter((o) => o.status === 'Completed');
    } else if (activeTab === 'Disputed') {
      filtered = filtered.filter((o) => o.status === 'Disputed');
    } else if (activeTab === 'Cancelled') {
      filtered = filtered.filter((o) => o.status === 'Cancelled');
    }

    return filtered;
  };

  const filteredOrders = filterOrders();

  // Calculate stats
  const totalOrders = sampleOrders.length;
  const activeOrders = sampleOrders.filter((o) => o.status === 'Active').length;
  const completedOrders = sampleOrders.filter(
    (o) => o.status === 'Completed'
  ).length;
  const disputedOrders = sampleOrders.filter(
    (o) => o.status === 'Disputed'
  ).length;

  const openDetailModal = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders Overview"
        description="View and manage all platform orders"
      />

      {/* Stats Row */}
      <div className="grid md:grid-cols-4 gap-6">
        <StatsCard
          label="Total Orders"
          value={totalOrders.toString()}
          icon="📦"
        />
        <StatsCard
          label="Active Orders"
          value={activeOrders.toString()}
          change="In Progress"
          icon="⏳"
        />
        <StatsCard
          label="Completed"
          value={completedOrders.toString()}
          icon="✅"
        />
        <StatsCard
          label="Disputed"
          value={disputedOrders.toString()}
          icon="⚠️"
        />
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

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">
                    Order ID
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">
                    Customer
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">
                    Pharmacy
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">
                    Rider
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">
                    Date
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">
                    Status
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">
                    Total
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-6 font-medium text-gray-900 text-sm">
                      {order.orderNumber}
                    </td>
                    <td className="py-4 px-6 text-gray-600 text-sm">
                      {order.customer}
                    </td>
                    <td className="py-4 px-6 text-gray-600 text-sm">
                      {order.pharmacy}
                    </td>
                    <td className="py-4 px-6 text-gray-600 text-sm">
                      {order.rider}
                    </td>
                    <td className="py-4 px-6 text-gray-600 text-sm">
                      {order.date}
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="py-4 px-6 font-medium text-gray-900 text-sm">
                      {order.total}
                    </td>
                    <td className="py-4 px-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDetailModal(order)}
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600">No orders found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen && selectedOrder !== null}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedOrder(null);
        }}
        title={`Order Details - ${selectedOrder?.orderNumber}`}
        size="md"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Order Information */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Order Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide">
                    Order Number
                  </p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {selectedOrder.orderNumber}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide">
                    Date
                  </p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {selectedOrder.date}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide">
                    Status
                  </p>
                  <div className="mt-1">
                    <StatusBadge status={selectedOrder.status} />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide">
                    Total
                  </p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {selectedOrder.total}
                  </p>
                </div>
              </div>
            </div>

            {/* Parties Involved */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Parties Involved
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 uppercase tracking-wide">
                    Customer
                  </p>
                  <p className="text-sm font-medium text-gray-900 mt-2">
                    {selectedOrder.customer}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 uppercase tracking-wide">
                    Pharmacy
                  </p>
                  <p className="text-sm font-medium text-gray-900 mt-2">
                    {selectedOrder.pharmacy}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 uppercase tracking-wide">
                    Rider
                  </p>
                  <p className="text-sm font-medium text-gray-900 mt-2">
                    {selectedOrder.rider}
                  </p>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Items
              </h3>
              <p className="text-sm text-gray-600">
                {selectedOrder.items} item(s) in this order
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 border-t border-gray-200 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedOrder(null);
                }}
                className="flex-1"
              >
                Close
              </Button>
              {selectedOrder.status === 'Disputed' && (
                <Button variant="primary" className="flex-1">
                  Resolve Dispute
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
