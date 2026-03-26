'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import Tabs from '@/components/ui/Tabs';
import { Card, CardContent } from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';

// Sample order data
const SAMPLE_ORDERS = [
  {
    id: 'ORD-001',
    items: 'Paracetamol 500mg x2',
    pharmacy: 'HealthPlus Pharmacy',
    date: '2026-03-24',
    status: 'Delivered',
    total: '₦2,500',
  },
  {
    id: 'ORD-002',
    items: 'Vitamin C 1000mg x1',
    pharmacy: 'MediCare Pharmacy',
    date: '2026-03-22',
    status: 'Delivered',
    total: '₦3,200',
  },
  {
    id: 'ORD-003',
    items: 'Cough Syrup, Lozenges',
    pharmacy: 'HealthPlus Pharmacy',
    date: '2026-03-20',
    status: 'Completed',
    total: '₦4,150',
  },
  {
    id: 'ORD-004',
    items: 'Antacid Tablets x3',
    pharmacy: 'QuickHealth Pharmacy',
    date: '2026-03-19',
    status: 'Completed',
    total: '₦5,600',
  },
  {
    id: 'ORD-005',
    items: 'Blood Pressure Monitor',
    pharmacy: 'MediCare Pharmacy',
    date: '2026-03-18',
    status: 'In Transit',
    total: '₦12,800',
  },
  {
    id: 'ORD-006',
    items: 'Multivitamins x2 boxes',
    pharmacy: 'HealthPlus Pharmacy',
    date: '2026-03-17',
    status: 'Confirmed',
    total: '₦8,900',
  },
  {
    id: 'ORD-007',
    items: 'Eye Drops, Lubricants',
    pharmacy: 'PharmaCare Plus',
    date: '2026-03-15',
    status: 'Cancelled',
    total: '₦3,500',
  },
  {
    id: 'ORD-008',
    items: 'Antiseptic Cream, Bandages',
    pharmacy: 'QuickHealth Pharmacy',
    date: '2026-03-14',
    status: 'Pending',
    total: '₦2,900',
  },
  {
    id: 'ORD-009',
    items: 'Fever Relief Pack',
    pharmacy: 'MediCare Pharmacy',
    date: '2026-03-12',
    status: 'Delivered',
    total: '₦6,700',
  },
  {
    id: 'ORD-010',
    items: 'Digestive Aids, Probiotics',
    pharmacy: 'HealthPlus Pharmacy',
    date: '2026-03-10',
    status: 'Completed',
    total: '₦7,200',
  },
];

type OrderStatus = 'All' | 'Active' | 'Completed' | 'Cancelled';

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<OrderStatus>('All');

  // Filter orders by tab
  const filteredOrders = SAMPLE_ORDERS.filter((order) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Active')
      return ['Pending', 'Confirmed', 'In Transit'].includes(order.status);
    if (activeTab === 'Completed')
      return ['Delivered', 'Completed'].includes(order.status);
    if (activeTab === 'Cancelled') return order.status === 'Cancelled';
    return true;
  });

  // Count orders by status
  const allCount = SAMPLE_ORDERS.length;
  const activeCount = SAMPLE_ORDERS.filter((o) =>
    ['Pending', 'Confirmed', 'In Transit'].includes(o.status)
  ).length;
  const completedCount = SAMPLE_ORDERS.filter((o) =>
    ['Delivered', 'Completed'].includes(o.status)
  ).length;
  const cancelledCount = SAMPLE_ORDERS.filter(
    (o) => o.status === 'Cancelled'
  ).length;

  const tabs = [
    { id: 'All', label: 'All Orders', count: allCount },
    { id: 'Active', label: 'Active', count: activeCount },
    { id: 'Completed', label: 'Completed', count: completedCount },
    { id: 'Cancelled', label: 'Cancelled', count: cancelledCount },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="My Orders"
        description="Track and manage all your medication orders"
      />

      {/* Tabs */}
      <Card>
        <CardContent className="pt-0">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={(id) => setActiveTab(id as OrderStatus)}
          />
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="pt-6">
          {filteredOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Order ID
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Items
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Pharmacy
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">
                      Total
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4 font-medium text-primary-600">
                        {order.id}
                      </td>
                      <td className="py-4 px-4 text-gray-700">{order.items}</td>
                      <td className="py-4 px-4 text-gray-600">{order.pharmacy}</td>
                      <td className="py-4 px-4 text-gray-600">{order.date}</td>
                      <td className="py-4 px-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="py-4 px-4 text-right font-semibold text-gray-900">
                        {order.total}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Link href={`/dashboard/customer/orders/${order.id}`}>
                          <button className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                            View
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <svg
                className="w-12 h-12 text-gray-300 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-600 font-medium">No orders found</p>
              <p className="text-gray-500 text-sm mt-1">
                Start browsing pharmacies to place your first order
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
