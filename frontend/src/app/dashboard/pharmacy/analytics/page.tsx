'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import StatsCard from '@/components/ui/StatsCard';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface Order {
  id: string;
  total: number;
  status: string;
  createdAt: string;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [pharmacyRating, setPharmacyRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState('month');

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    if (!user) return {};
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }, [user]);

  useEffect(() => {
    async function loadAnalytics() {
      if (!user) return;
      setLoading(true);
      try {
        const headers = await getAuthHeaders();

        const pharmacyRes = await fetch(`${API_URL}/pharmacies/mine`, { headers });
        const pharmacyResult = await pharmacyRes.json();

        if (!pharmacyResult.success || !pharmacyResult.data?.pharmacy) {
          setLoading(false);
          return;
        }

        const pharmacy = pharmacyResult.data.pharmacy;
        setPharmacyRating(pharmacy.rating || 0);
        setTotalReviews(pharmacy.totalReviews || 0);

        const ordersRes = await fetch(`${API_URL}/orders/pharmacy/${pharmacy.id}`, { headers });
        const ordersResult = await ordersRes.json();

        if (ordersResult.success && ordersResult.data?.orders) {
          setOrders(ordersResult.data.orders);
        }
      } catch {
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, [user, getAuthHeaders]);

  // Filter orders by time period
  const getFilteredOrders = (period: string): Order[] => {
    const now = new Date();
    return orders.filter((o) => {
      const created = new Date(o.createdAt);
      switch (period) {
        case 'today':
          return created.toDateString() === now.toDateString();
        case 'week': {
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return created >= weekAgo;
        }
        case 'month': {
          const monthAgo = new Date(now);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return created >= monthAgo;
        }
        case 'year': {
          const yearAgo = new Date(now);
          yearAgo.setFullYear(yearAgo.getFullYear() - 1);
          return created >= yearAgo;
        }
        default:
          return true;
      }
    });
  };

  const filteredOrders = getFilteredOrders(timePeriod);
  const totalRevenue = filteredOrders
    .filter(o => o.status !== 'cancelled' && o.status !== 'refunded')
    .reduce((sum, o) => sum + (o.total || 0), 0);
  const orderCount = filteredOrders.length;
  const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

  const periodLabel = timePeriod === 'today' ? 'Today'
    : timePeriod === 'week' ? 'This Week'
    : timePeriod === 'year' ? 'This Year'
    : 'This Month';

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics & Reports" description="View your pharmacy's performance metrics and insights" />
        <div className="flex items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics & Reports" description="View your pharmacy's performance metrics and insights" />

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'This Week' },
              { id: 'month', label: 'This Month' },
              { id: 'year', label: 'This Year' },
            ].map(period => (
              <button
                key={period.id}
                onClick={() => setTimePeriod(period.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  timePeriod === period.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <StatsCard label="Total Revenue" value={`₦${totalRevenue.toLocaleString()}`} change={periodLabel} icon="₦" />
        <StatsCard label="Total Orders" value={String(orderCount)} change={periodLabel} trend="up" />
        <StatsCard label="Avg. Order Value" value={`₦${Math.round(avgOrderValue).toLocaleString()}`} change="Per order" icon="₦" />
        <StatsCard label="Avg. Rating" value={pharmacyRating.toFixed(1)} change={`From ${totalReviews} reviews`} icon="★" />
      </div>

      {/* Revenue Chart (derived from actual order data) */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-bold text-gray-900">Revenue Trend</h2>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">No order data for this period</p>
            </div>
          ) : (
            <div className="h-64 flex items-end justify-around gap-2 bg-gray-50 p-6 rounded-lg">
              {(() => {
                // Group orders into buckets based on time period
                const buckets: { label: string; total: number }[] = [];
                const completedOrders = filteredOrders.filter(o => o.status !== 'cancelled' && o.status !== 'refunded');

                if (timePeriod === 'week') {
                  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                  for (let i = 0; i < 7; i++) {
                    const dayOrders = completedOrders.filter(o => new Date(o.createdAt).getDay() === i);
                    buckets.push({ label: days[i], total: dayOrders.reduce((s, o) => s + o.total, 0) });
                  }
                } else if (timePeriod === 'month') {
                  for (let w = 1; w <= 4; w++) {
                    const weekOrders = completedOrders.filter(o => {
                      const d = new Date(o.createdAt).getDate();
                      return d >= (w - 1) * 7 + 1 && d <= w * 7;
                    });
                    buckets.push({ label: `Week ${w}`, total: weekOrders.reduce((s, o) => s + o.total, 0) });
                  }
                } else if (timePeriod === 'year') {
                  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  for (let m = 0; m < 12; m++) {
                    const monthOrders = completedOrders.filter(o => new Date(o.createdAt).getMonth() === m);
                    buckets.push({ label: months[m], total: monthOrders.reduce((s, o) => s + o.total, 0) });
                  }
                } else {
                  // Today: group by 4-hour blocks
                  for (let h = 0; h < 24; h += 4) {
                    const blockOrders = completedOrders.filter(o => {
                      const hour = new Date(o.createdAt).getHours();
                      return hour >= h && hour < h + 4;
                    });
                    buckets.push({ label: `${h}:00`, total: blockOrders.reduce((s, o) => s + o.total, 0) });
                  }
                }

                const maxTotal = Math.max(...buckets.map(b => b.total), 1);

                return buckets.map((bucket, i) => (
                  <div key={i} className="flex flex-col items-center flex-1">
                    <div
                      className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t transition-all min-h-[4px]"
                      style={{ height: `${Math.max((bucket.total / maxTotal) * 180, 4)}px` }}
                    />
                    <p className="text-xs text-gray-600 mt-2">{bucket.label}</p>
                  </div>
                ));
              })()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Status Breakdown */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-bold text-gray-900">Order Status Breakdown</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['pending', 'confirmed', 'preparing', 'delivered', 'cancelled'].map(status => {
              const count = filteredOrders.filter(o => o.status === status).length;
              const colors: Record<string, string> = {
                pending: 'bg-yellow-100 text-yellow-700',
                confirmed: 'bg-blue-100 text-blue-700',
                preparing: 'bg-purple-100 text-purple-700',
                delivered: 'bg-green-100 text-green-700',
                cancelled: 'bg-red-100 text-red-700',
              };
              return (
                <div key={status} className={`p-4 rounded-lg ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm capitalize">{status.replace('_', ' ')}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
