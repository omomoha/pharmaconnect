'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

export default function DeliveryDashboard() {
  const { profile } = useAuth();

  // Sample data
  const activeDeliveries = [
    {
      id: '1',
      customer: 'John Doe',
      pharmacy: 'HealthPlus Pharmacy',
      address: '123 Main St, Lagos',
      distance: '2.5 km',
      status: 'In Transit',
      eta: '15 min',
    },
    {
      id: '2',
      customer: 'Jane Smith',
      pharmacy: 'MediCare Pharmacy',
      address: '456 Oak Ave, Lagos',
      distance: '1.8 km',
      status: 'Picked Up',
      eta: '22 min',
    },
  ];

  const earningsSummary = {
    today: '₦8,500',
    thisWeek: '₦42,300',
    thisMonth: '₦156,800',
  };

  const availableOrders = [
    {
      id: '1',
      from: 'HealthPlus Pharmacy',
      to: 'Ikoyi, Lagos',
      distance: '3.2 km',
      reward: '₦1,200',
      priority: 'Normal',
    },
    {
      id: '2',
      from: 'MediCare Pharmacy',
      to: 'Victoria Island, Lagos',
      distance: '4.8 km',
      reward: '₦1,800',
      priority: 'High',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Delivery Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back, {profile?.name}! Manage your deliveries here.
        </p>
      </div>

      {/* Earnings Summary */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-600 text-sm font-medium mb-2">Today's Earnings</p>
            <p className="text-3xl font-bold text-gray-900">{earningsSummary.today}</p>
            <p className="text-xs text-green-600 mt-2">+2 deliveries</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-600 text-sm font-medium mb-2">This Week</p>
            <p className="text-3xl font-bold text-gray-900">{earningsSummary.thisWeek}</p>
            <p className="text-xs text-green-600 mt-2">+12 deliveries</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-600 text-sm font-medium mb-2">This Month</p>
            <p className="text-3xl font-bold text-gray-900">{earningsSummary.thisMonth}</p>
            <p className="text-xs text-green-600 mt-2">+58 deliveries</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Active Deliveries */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Active Deliveries</h2>
              <Link href="/dashboard/delivery/active">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeDeliveries.length > 0 ? (
              activeDeliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{delivery.customer}</h3>
                      <p className="text-sm text-gray-600">{delivery.pharmacy}</p>
                      <p className="text-xs text-gray-500 mt-1">{delivery.address}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        delivery.status === 'In Transit'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {delivery.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <div>
                      <span className="text-gray-600">{delivery.distance}</span>
                      <span className="text-gray-400 mx-2">•</span>
                      <span className="text-primary-600 font-medium">ETA: {delivery.eta}</span>
                    </div>
                    <Button variant="secondary" size="sm">
                      Details
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-600 text-center py-8">No active deliveries</p>
            )}
          </CardContent>
        </Card>

        {/* Rider Stats */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-bold text-gray-900">Your Stats</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Deliveries</p>
              <p className="text-2xl font-bold text-gray-900">342</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Completion Rate</p>
              <p className="text-2xl font-bold text-green-600">98.5%</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Average Rating</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-900">4.8</span>
                <span className="text-yellow-400">★</span>
              </div>
            </div>
            <Link href="/dashboard/delivery/profile">
              <Button variant="outline" className="w-full mt-4">
                View Profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Available Orders */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Available Orders</h2>
            <Link href="/dashboard/delivery/available">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {availableOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{order.from}</p>
                    <p className="text-sm text-gray-600">→ {order.to}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      order.priority === 'High'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {order.priority}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    <span>{order.distance}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-primary-600 text-lg">
                      {order.reward}
                    </span>
                    <Button variant="primary" size="sm">
                      Accept
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
