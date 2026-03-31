'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import PageHeader from '@/components/ui/PageHeader';
import Tabs from '@/components/ui/Tabs';
import Modal from '@/components/ui/Modal';

interface Order {
  id: string;
  orderNumber: string;
  customer: string;
  items: number;
  total: string;
  date: string;
  status: 'New' | 'Processing' | 'Ready' | 'In Transit' | 'Completed';
  itemList?: string[];
}

// Sample orders data
const SAMPLE_ORDERS: Order[] = [
  {
    id: '1',
    orderNumber: 'ORD-2026-0001',
    customer: 'John Doe',
    items: 3,
    total: '₦12,500',
    date: '2026-03-26 14:30',
    status: 'New',
    itemList: ['Paracetamol 500mg', 'Cough Syrup', 'Vitamin C'],
  },
  {
    id: '2',
    orderNumber: 'ORD-2026-0002',
    customer: 'Jane Smith',
    items: 2,
    total: '₦8,750',
    date: '2026-03-26 13:15',
    status: 'Processing',
    itemList: ['Ibuprofen 400mg', 'Antacid Tablets'],
  },
  {
    id: '3',
    orderNumber: 'ORD-2026-0003',
    customer: 'Mike Johnson',
    items: 5,
    total: '₦18,300',
    date: '2026-03-26 12:00',
    status: 'Ready',
    itemList: ['Multivitamin', 'First Aid Kit', 'Bandages', 'Antiseptic', 'Cotton Wool'],
  },
  {
    id: '4',
    orderNumber: 'ORD-2026-0004',
    customer: 'Sarah Williams',
    items: 1,
    total: '₦5,200',
    date: '2026-03-26 11:45',
    status: 'In Transit',
    itemList: ['Glucose Meter'],
  },
  {
    id: '5',
    orderNumber: 'ORD-2026-0005',
    customer: 'David Brown',
    items: 4,
    total: '₦15,000',
    date: '2026-03-26 10:30',
    status: 'Completed',
    itemList: ['Eye Drops', 'Eardrops', 'Nasal Spray', 'Throat Lozenges'],
  },
  {
    id: '6',
    orderNumber: 'ORD-2026-0006',
    customer: 'Emma Davis',
    items: 2,
    total: '₦9,500',
    date: '2026-03-25 16:20',
    status: 'New',
    itemList: ['Sleeping Tablets', 'Ginger Tea'],
  },
  {
    id: '7',
    orderNumber: 'ORD-2026-0007',
    customer: 'Robert Wilson',
    items: 3,
    total: '₦11,750',
    date: '2026-03-25 14:00',
    status: 'Processing',
    itemList: ['Vitamin D3', 'Calcium Supplement', 'Zinc Tablets'],
  },
  {
    id: '8',
    orderNumber: 'ORD-2026-0008',
    customer: 'Lisa Anderson',
    items: 6,
    total: '₦22,100',
    date: '2026-03-25 12:15',
    status: 'Ready',
    itemList: ['Antiseptic Cream', 'Pain Relief Gel', 'Plasters', 'Hydrogen Peroxide', 'Medical Tape', 'Gloves'],
  },
  {
    id: '9',
    orderNumber: 'ORD-2026-0009',
    customer: 'James Martin',
    items: 2,
    total: '₦7,300',
    date: '2026-03-25 10:00',
    status: 'In Transit',
    itemList: ['Allergy Tablets', 'Antihistamine Cream'],
  },
  {
    id: '10',
    orderNumber: 'ORD-2026-0010',
    customer: 'Patricia Garcia',
    items: 4,
    total: '₦16,500',
    date: '2026-03-24 15:30',
    status: 'Completed',
    itemList: ['Baby Powder', 'Diaper Rash Cream', 'Baby Wipes', 'Baby Oil'],
  },
  {
    id: '11',
    orderNumber: 'ORD-2026-0011',
    customer: 'Thomas Rodriguez',
    items: 1,
    total: '₦6,800',
    date: '2026-03-24 13:45',
    status: 'New',
    itemList: ['Digital Thermometer'],
  },
  {
    id: '12',
    orderNumber: 'ORD-2026-0012',
    customer: 'Jennifer Lee',
    items: 5,
    total: '₦19,200',
    date: '2026-03-24 11:20',
    status: 'Processing',
    itemList: ['Sunscreen SPF 50', 'Lip Balm', 'Body Moisturizer', 'Face Wash', 'Toner'],
  },
];

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);

  const tabs = [
    { id: 'all', label: 'All', count: SAMPLE_ORDERS.length },
    { id: 'New', label: 'New', count: SAMPLE_ORDERS.filter(o => o.status === 'New').length },
    { id: 'Processing', label: 'Processing', count: SAMPLE_ORDERS.filter(o => o.status === 'Processing').length },
    { id: 'Ready', label: 'Ready', count: SAMPLE_ORDERS.filter(o => o.status === 'Ready').length },
    { id: 'In Transit', label: 'In Transit', count: SAMPLE_ORDERS.filter(o => o.status === 'In Transit').length },
    { id: 'Completed', label: 'Completed', count: SAMPLE_ORDERS.filter(o => o.status === 'Completed').length },
  ];

  const filteredOrders = activeTab === 'all'
    ? SAMPLE_ORDERS
    : SAMPLE_ORDERS.filter(order => order.status === activeTab);

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const handleAcceptOrder = (orderId: string) => {
    console.log('Accept order:', orderId);
    setShowModal(false);
  };

  const handleRejectOrder = (orderId: string) => {
    console.log('Reject order:', orderId);
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders Management"
        description="View and manage all customer orders"
      />

      {/* Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="pt-6">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No orders found in this category</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Order ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Items</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Total</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4 font-medium text-gray-900">{order.orderNumber}</td>
                      <td className="py-4 px-4">{order.customer}</td>
                      <td className="py-4 px-4 text-center">{order.items}</td>
                      <td className="py-4 px-4 text-gray-600">{order.date}</td>
                      <td className="py-4 px-4 text-center">
                        <StatusBadge status={order.status} size="sm" />
                      </td>
                      <td className="py-4 px-4 text-right font-semibold">{order.total}</td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex gap-2 justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewOrder(order)}
                          >
                            View
                          </Button>
                          {order.status === 'New' && (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleAcceptOrder(order.id)}
                              >
                                Accept
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRejectOrder(order.id)}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`Order ${selectedOrder?.orderNumber}`}
        size="md"
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Customer Name</p>
                <p className="font-semibold text-gray-900">{selectedOrder.customer}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Order Status</p>
                <div className="mt-1">
                  <StatusBadge status={selectedOrder.status} />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Order Date</p>
                <p className="font-semibold text-gray-900">{selectedOrder.date}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="font-semibold text-gray-900">{selectedOrder.total}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-3">Items Ordered</p>
              <ul className="space-y-2">
                {selectedOrder.itemList?.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-2 text-gray-700"
                  >
                    <span className="w-2 h-2 bg-primary-600 rounded-full" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              {selectedOrder.status === 'New' && (
                <>
                  <Button
                    variant="primary"
                    size="md"
                    className="flex-1"
                    onClick={() => handleAcceptOrder(selectedOrder.id)}
                  >
                    Accept Order
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    className="flex-1"
                    onClick={() => handleRejectOrder(selectedOrder.id)}
                  >
                    Reject Order
                  </Button>
                </>
              )}
              {selectedOrder.status !== 'New' && (
                <Button
                  variant="outline"
                  size="md"
                  className="w-full"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
