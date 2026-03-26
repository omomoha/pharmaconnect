'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useOrders } from '@/hooks';
import { useNotifications } from '@/hooks';
import toast from 'react-hot-toast';

export default function CustomerDashboard() {
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const { orders, loading: ordersLoading, error: ordersError } = useOrders({ limit: 2 });
  const { unreadCount } = useNotifications();

  // Show error toast if orders fail to load
  React.useEffect(() => {
    if (ordersError) {
      toast.error('Failed to load recent orders');
    }
  }, [ordersError]);

  // Sample data
  const sampleRecentOrders = [
    {
      id: '1',
      medication: 'Paracetamol 500mg',
      pharmacy: 'HealthPlus Pharmacy',
      date: '2026-03-24',
      status: 'Delivered',
      total: '₦2,500',
    },
    {
      id: '2',
      medication: 'Vitamin C 1000mg',
      pharmacy: 'MediCare Pharmacy',
      date: '2026-03-22',
      status: 'Processing',
      total: '₦3,200',
    },
  ];

  const sampleNearbyPharmacies = [
    {
      id: '1',
      name: 'HealthPlus Pharmacy',
      distance: '0.5 km away',
      rating: 4.8,
      deliveryTime: '30-45 min',
    },
    {
      id: '2',
      name: 'MediCare Pharmacy',
      distance: '1.2 km away',
      rating: 4.6,
      deliveryTime: '45-60 min',
    },
  ];

  // Format orders for display (use API data if available, fallback to sample)
  const displayOrders = (orders && orders.length > 0 ? orders.slice(0, 2) : sampleRecentOrders) as any[];
  const nearbyPharmacies = sampleNearbyPharmacies;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back, {profile?.name}! Find and order medications below.
        </p>
      </div>

      {/* Quick Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Search for medications, pharmacies, or symptoms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
            />
            <Button variant="primary" size="lg">
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-4xl font-bold text-primary-600">{orders?.length || 12}</p>
              <p className="text-gray-600">Total Orders</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-4xl font-bold text-primary-600">₦45,600</p>
              <p className="text-gray-600">Total Spent</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-4xl font-bold text-primary-600">{unreadCount > 0 ? unreadCount : 3}</p>
              <p className="text-gray-600">{unreadCount > 0 ? 'Unread Notifications' : 'Saved Pharmacies'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
            <Link href="/dashboard/customer/orders">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          ) : displayOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Medication
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
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4">{order.medication || order.items}</td>
                      <td className="py-4 px-4">{order.pharmacy}</td>
                      <td className="py-4 px-4 text-gray-600">{order.date}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            order.status === 'Delivered'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
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
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No orders yet</p>
              <Link href="/dashboard/customer/pharmacies">
                <Button variant="primary" size="sm" className="mt-4">
                  Browse Pharmacies
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Nearby Pharmacies */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Nearby Pharmacies</h2>
            <Link href="/dashboard/customer/pharmacies">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {nearbyPharmacies.map((pharmacy) => (
              <div
                key={pharmacy.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">{pharmacy.name}</h3>
                    <p className="text-sm text-gray-600">{pharmacy.distance}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400">★</span>
                      <span className="font-semibold">{pharmacy.rating}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Delivery: {pharmacy.deliveryTime}
                  </p>
                  <Button variant="primary" size="sm">
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
