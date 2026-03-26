'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useOrders } from '@/hooks';
import { useNotifications } from '@/hooks';
import toast from 'react-hot-toast';

export default function PharmacyDashboard() {
  const { profile } = useAuth();
  const { orders, loading: ordersLoading, error: ordersError } = useOrders();
  useNotifications();

  // Show error toast if orders fail to load
  useEffect(() => {
    if (ordersError) {
      toast.error('Failed to load orders');
    }
  }, [ordersError]);

  // Sample data
  const stats = [
    { label: 'Total Orders', value: '156', change: '+12% from last week' },
    { label: 'Total Revenue', value: '₦850,000', change: '+8% from last week' },
    { label: 'Products Listed', value: '342', change: '+5 new this week' },
    { label: 'Avg. Rating', value: '4.7', change: 'From 234 reviews' },
  ];

  const sampleRecentOrders = [
    {
      id: '1',
      customer: 'John Doe',
      items: 3,
      total: '₦12,500',
      date: '2026-03-24 14:30',
      status: 'Delivered',
    },
    {
      id: '2',
      customer: 'Jane Smith',
      items: 2,
      total: '₦8,750',
      date: '2026-03-24 12:15',
      status: 'In Transit',
    },
    {
      id: '3',
      customer: 'Mike Johnson',
      items: 5,
      total: '₦18,300',
      date: '2026-03-24 10:00',
      status: 'Pending',
    },
  ];

  // Use API orders if available, otherwise fallback to sample
  const displayRecentOrders = (
    orders && orders.length > 0 ? orders.slice(0, 3) : sampleRecentOrders
  ) as any[];

  const lowStockAlerts = [
    { id: '1', product: 'Paracetamol 500mg', current: 12, reorderLevel: 50 },
    { id: '2', product: 'Ibuprofen 400mg', current: 8, reorderLevel: 40 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pharmacy Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back, {profile?.name}! Manage your pharmacy here.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard/pharmacy/products/new">
          <Button variant="primary">Add Product</Button>
        </Link>
        <Link href="/dashboard/pharmacy/orders">
          <Button variant="secondary">View All Orders</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <p className="text-gray-600 text-sm font-medium mb-2">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>
              <p className="text-xs text-green-600">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
              <Link href="/dashboard/pharmacy/orders">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Customer
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Items
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
                    </tr>
                  </thead>
                  <tbody>
                    {displayRecentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4">{order.customer}</td>
                      <td className="py-4 px-4">{order.items} items</td>
                      <td className="py-4 px-4 text-gray-600">{order.date}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            order.status === 'Delivered'
                              ? 'bg-green-100 text-green-700'
                              : order.status === 'In Transit'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-semibold">
                        {order.total}
                      </td>
                    </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-bold text-gray-900">Low Stock Alerts</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {lowStockAlerts.length > 0 ? (
              lowStockAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 border-l-4 border-yellow-400 bg-yellow-50 rounded"
                >
                  <p className="font-medium text-gray-900 text-sm">
                    {alert.product}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Current: {alert.current} | Reorder level: {alert.reorderLevel}
                  </p>
                  <Button variant="ghost" size="sm" className="mt-2 w-full">
                    Reorder
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-gray-600 text-sm">All products are well stocked</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
