'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import StatsCard from '@/components/ui/StatsCard';
import Tabs from '@/components/ui/Tabs';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';
import { getTransactions } from '@/lib/services/admin.service';

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

// All order data fetched from real API via getTransactions()

export default function OrdersManagementPage() {
  // API state
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [activeTab, setActiveTab] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [sortField, setSortField] = useState<'date' | 'total' | 'status'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Fetch transactions on mount
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getTransactions({ limit: 200 });
        const apiOrders = response.success && response.data ? response.data : [];

        // Map API response to Order interface
        const mapped: Order[] = (apiOrders || []).map((o: any) => ({
          id: o.id,
          orderNumber: `ORD-${o.id?.slice(0, 8) || 'UNKNOWN'}`,
          customer: o.customerName || `User ${o.customerId?.slice(0, 6) || 'N/A'}`,
          pharmacy: o.pharmacyName || `Pharmacy ${o.pharmacyId?.slice(0, 6) || 'N/A'}`,
          rider: o.riderName || 'Unassigned',
          status: (o.status || 'pending').charAt(0).toUpperCase() + (o.status || 'pending').slice(1) as 'Active' | 'Completed' | 'Disputed' | 'Cancelled',
          total: `₦${(o.total || 0).toLocaleString()}`,
          date: o.createdAt?._seconds
            ? new Date(o.createdAt._seconds * 1000).toISOString().split('T')[0]
            : 'N/A',
          items: o.itemCount || 0,
        }));

        setOrders(mapped);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        setError('Failed to load orders. Please try again later.');
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const tabs = ['All', 'Active', 'Completed', 'Disputed', 'Cancelled'];

  const filterOrders = () => {
    let filtered = orders;

    // Filter by tab status
    if (activeTab === 'Active') {
      filtered = filtered.filter((o) => o.status === 'Active');
    } else if (activeTab === 'Completed') {
      filtered = filtered.filter((o) => o.status === 'Completed');
    } else if (activeTab === 'Disputed') {
      filtered = filtered.filter((o) => o.status === 'Disputed');
    } else if (activeTab === 'Cancelled') {
      filtered = filtered.filter((o) => o.status === 'Cancelled');
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((o) =>
        o.customer.toLowerCase().includes(query) ||
        o.pharmacy.toLowerCase().includes(query) ||
        o.orderNumber.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      if (sortField === 'date') {
        aVal = new Date(a.date).getTime();
        bVal = new Date(b.date).getTime();
      } else if (sortField === 'total') {
        // Parse currency string: "₦8,500" -> 8500
        aVal = parseInt(a.total.replace(/[^\d]/g, ''), 10);
        bVal = parseInt(b.total.replace(/[^\d]/g, ''), 10);
      } else if (sortField === 'status') {
        aVal = a.status;
        bVal = b.status;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  const filteredOrders = filterOrders();

  // Pagination
  const totalResults = filteredOrders.length;
  const totalPages = Math.ceil(totalResults / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // Handle tab change - reset search and page
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Handle search - reset page
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  // Handle sort
  const handleSort = (field: 'date' | 'total' | 'status') => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to desc
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIndicator = (field: 'date' | 'total' | 'status') => {
    if (sortField !== field) return ' ↕️';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  // Calculate stats
  const totalOrders = orders.length;
  const activeOrders = orders.filter((o) => o.status === 'Active').length;
  const completedOrders = orders.filter(
    (o) => o.status === 'Completed'
  ).length;
  const disputedOrders = orders.filter(
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

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">Loading orders...</p>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
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
        onChange={handleTabChange}
      />

      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by customer, pharmacy, or order ID..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

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
                  <th
                    className="text-left py-4 px-6 font-semibold text-gray-700 text-sm cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('date')}
                  >
                    Date{getSortIndicator('date')}
                  </th>
                  <th
                    className="text-left py-4 px-6 font-semibold text-gray-700 text-sm cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('status')}
                  >
                    Status{getSortIndicator('status')}
                  </th>
                  <th
                    className="text-left py-4 px-6 font-semibold text-gray-700 text-sm cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('total')}
                  >
                    Total{getSortIndicator('total')}
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((order) => (
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

          {totalResults === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600">No orders found</p>
            </div>
          )}

          {/* Pagination Bar */}
          {totalResults > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1}-{Math.min(endIndex, totalResults)} of{' '}
                {totalResults} results
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center px-3 py-2 text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
