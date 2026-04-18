'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import PageHeader from '@/components/ui/PageHeader';
import Tabs from '@/components/ui/Tabs';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface Order {
  id: string;
  customerId: string;
  pharmacyId: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  total: number;
  deliveryAddress: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface OrderWithItems extends Order {
  items?: Array<{
    id: string;
    drugName: string;
    category: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
}

// Map backend status to display-friendly labels
const STATUS_MAP: Record<string, string> = {
  pending: 'New',
  confirmed: 'Processing',
  preparing: 'Processing',
  ready_for_pickup: 'Ready',
  out_for_delivery: 'In Transit',
  delivered: 'Completed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

const getDisplayStatus = (status: string) => STATUS_MAP[status] || status;

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [pharmacyId, setPharmacyId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    if (!user) return {};
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }, [user]);

  // Fetch pharmacy ID first, then orders
  useEffect(() => {
    async function loadPharmacyAndOrders() {
      if (!user) return;
      setLoading(true);
      try {
        const headers = await getAuthHeaders();

        // Get my pharmacy
        const pharmacyRes = await fetch(`${API_URL}/pharmacies/mine`, { headers });
        const pharmacyResult = await pharmacyRes.json();

        if (!pharmacyResult.success || !pharmacyResult.data?.pharmacy) {
          setLoading(false);
          return;
        }

        const myPharmacyId = pharmacyResult.data.pharmacy.id;
        setPharmacyId(myPharmacyId);

        // Get pharmacy orders
        const ordersRes = await fetch(`${API_URL}/orders/pharmacy/${myPharmacyId}`, { headers });
        const ordersResult = await ordersRes.json();

        if (ordersResult.success && ordersResult.data?.orders) {
          setOrders(ordersResult.data.orders);
        }
      } catch {
        toast.error('Failed to load orders');
      } finally {
        setLoading(false);
      }
    }

    loadPharmacyAndOrders();
  }, [user, getAuthHeaders]);

  const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
    const display = getDisplayStatus(o.status);
    acc[display] = (acc[display] || 0) + 1;
    return acc;
  }, {});

  const tabs = [
    { id: 'all', label: 'All', count: orders.length },
    { id: 'New', label: 'New', count: statusCounts['New'] || 0 },
    { id: 'Processing', label: 'Processing', count: statusCounts['Processing'] || 0 },
    { id: 'Ready', label: 'Ready', count: statusCounts['Ready'] || 0 },
    { id: 'In Transit', label: 'In Transit', count: statusCounts['In Transit'] || 0 },
    { id: 'Completed', label: 'Completed', count: statusCounts['Completed'] || 0 },
  ];

  const filteredOrders = activeTab === 'all'
    ? orders
    : orders.filter(order => getDisplayStatus(order.status) === activeTab);

  const handleViewOrder = async (order: Order) => {
    setLoadingDetail(true);
    setShowModal(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/orders/${order.id}`, { headers });
      const result = await res.json();
      if (result.success && result.data) {
        setSelectedOrder({ ...result.data.order, items: result.data.items });
      } else {
        setSelectedOrder({ ...order, items: [] });
      }
    } catch {
      setSelectedOrder({ ...order, items: [] });
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await res.json();
      if (result.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        setShowModal(false);
        toast.success(`Order ${newStatus === 'confirmed' ? 'accepted' : 'updated'}`);
      } else {
        toast.error(result.error?.message || 'Failed to update order');
      }
    } catch {
      toast.error('Failed to update order status');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason: 'Rejected by pharmacy' }),
      });
      const result = await res.json();
      if (result.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
        setShowModal(false);
        toast.success('Order rejected');
      } else {
        toast.error(result.error?.message || 'Failed to reject order');
      }
    } catch {
      toast.error('Failed to reject order');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Orders Management" description="View and manage all customer orders" />
        <div className="flex items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!pharmacyId) {
    return (
      <div className="space-y-6">
        <PageHeader title="Orders Management" description="View and manage all customer orders" />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">No pharmacy found. Please register your pharmacy first.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Orders Management" description="View and manage all customer orders" />

      <Card>
        <CardContent className="pt-6">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </CardContent>
      </Card>

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
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Payment</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Total</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4 font-medium text-gray-900 font-mono text-xs">
                        {order.id.slice(0, 8)}...
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString('en-NG', {
                          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <StatusBadge status={getDisplayStatus(order.status)} size="sm" />
                      </td>
                      <td className="py-4 px-4 text-center">
                        <StatusBadge status={order.paymentStatus === 'paid' ? 'Completed' : 'Pending'} size="sm" />
                      </td>
                      <td className="py-4 px-4 text-right font-semibold">
                        ₦{order.total?.toLocaleString() || '0'}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex gap-2 justify-center">
                          <Button variant="outline" size="sm" onClick={() => handleViewOrder(order)}>
                            View
                          </Button>
                          {order.status === 'pending' && (
                            <>
                              <Button variant="primary" size="sm" onClick={() => handleUpdateStatus(order.id, 'confirmed')}>
                                Accept
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleCancelOrder(order.id)}>
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

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`Order ${selectedOrder?.id?.slice(0, 8) || ''}...`}
        size="md"
      >
        {loadingDetail ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : selectedOrder && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Order Status</p>
                <div className="mt-1">
                  <StatusBadge status={getDisplayStatus(selectedOrder.status)} />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment Status</p>
                <div className="mt-1">
                  <StatusBadge status={selectedOrder.paymentStatus === 'paid' ? 'Completed' : 'Pending'} />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Order Date</p>
                <p className="font-semibold text-gray-900">
                  {new Date(selectedOrder.createdAt).toLocaleDateString('en-NG', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="font-semibold text-gray-900">₦{selectedOrder.total?.toLocaleString()}</p>
              </div>
            </div>

            {selectedOrder.deliveryAddress && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Delivery Address</p>
                <p className="text-gray-900">{selectedOrder.deliveryAddress}</p>
              </div>
            )}

            {selectedOrder.items && selectedOrder.items.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-3">Items Ordered</p>
                <ul className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between text-gray-700">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-primary-600 rounded-full" />
                        <span>{item.drugName}</span>
                        <span className="text-gray-400">x{item.quantity}</span>
                      </div>
                      <span className="font-medium">₦{item.subtotal?.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedOrder.notes && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Notes</p>
                <p className="text-gray-700 text-sm">{selectedOrder.notes}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              {selectedOrder.status === 'pending' && (
                <>
                  <Button variant="primary" size="md" className="flex-1" onClick={() => handleUpdateStatus(selectedOrder.id, 'confirmed')}>
                    Accept Order
                  </Button>
                  <Button variant="outline" size="md" className="flex-1" onClick={() => handleCancelOrder(selectedOrder.id)}>
                    Reject Order
                  </Button>
                </>
              )}
              {selectedOrder.status === 'confirmed' && (
                <Button variant="primary" size="md" className="w-full" onClick={() => handleUpdateStatus(selectedOrder.id, 'preparing')}>
                  Start Preparing
                </Button>
              )}
              {selectedOrder.status === 'preparing' && (
                <Button variant="primary" size="md" className="w-full" onClick={() => handleUpdateStatus(selectedOrder.id, 'ready_for_pickup')}>
                  Mark as Ready
                </Button>
              )}
              {!['pending', 'confirmed', 'preparing'].includes(selectedOrder.status) && (
                <Button variant="outline" size="md" className="w-full" onClick={() => setShowModal(false)}>
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
