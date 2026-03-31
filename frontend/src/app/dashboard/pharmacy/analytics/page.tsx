'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import StatsCard from '@/components/ui/StatsCard';

interface TopProduct {
  rank: number;
  name: string;
  unitsSold: number;
  revenue: string;
}

interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
}

const TOP_PRODUCTS: TopProduct[] = [
  { rank: 1, name: 'Paracetamol 500mg', unitsSold: 450, revenue: '₦225,000' },
  { rank: 2, name: 'Vitamin C 1000mg', unitsSold: 380, revenue: '₦456,000' },
  { rank: 3, name: 'Ibuprofen 400mg', unitsSold: 320, revenue: '₦208,000' },
  { rank: 4, name: 'Multivitamin', unitsSold: 245, revenue: '₦857,500' },
  { rank: 5, name: 'Antacid Tablets', unitsSold: 210, revenue: '₦189,000' },
];

const SAMPLE_REVIEWS: Review[] = [
  {
    id: '1',
    customerName: 'John Doe',
    rating: 5,
    comment: 'Excellent quality products and very fast delivery!',
    date: '2026-03-26 14:20',
  },
  {
    id: '2',
    customerName: 'Jane Smith',
    rating: 4,
    comment: 'Good selection but wish for more payment options.',
    date: '2026-03-26 12:35',
  },
  {
    id: '3',
    customerName: 'Mike Johnson',
    rating: 5,
    comment: 'Professional service and authentic products. Highly recommend!',
    date: '2026-03-26 10:15',
  },
  {
    id: '4',
    customerName: 'Sarah Williams',
    rating: 4,
    comment: 'Products arrived in good condition. Packaging could be better.',
    date: '2026-03-25 16:45',
  },
  {
    id: '5',
    customerName: 'David Brown',
    rating: 5,
    comment: 'Best pharmacy online! Everything is authentic and affordable.',
    date: '2026-03-25 14:10',
  },
];

export default function AnalyticsPage() {
  const [timePeriod, setTimePeriod] = useState('month');

  const getMetrics = (period: string) => {
    const multipliers: Record<string, number> = {
      today: 1,
      week: 7,
      month: 30,
      year: 365,
    };
    const mult = multipliers[period] || 30;

    return {
      revenue: `₦${(2850000 * (mult / 30)).toLocaleString()}`,
      orders: Math.floor(156 * (mult / 30)),
      avgOrderValue: '₦18,270',
      rating: '4.7',
    };
  };

  const metrics = getMetrics(timePeriod);

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
            viewBox="0 0 20 20"
          >
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics & Reports"
        description="View your pharmacy's performance metrics and insights"
      />

      {/* Time Period Selector */}
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

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-6">
        <StatsCard
          label="Total Revenue"
          value={metrics.revenue}
          change={`${timePeriod === 'today' ? 'Today' : timePeriod === 'week' ? 'This Week' : timePeriod === 'year' ? 'This Year' : 'This Month'}`}
          icon="₦"
        />
        <StatsCard
          label="Total Orders"
          value={String(metrics.orders)}
          change={`${timePeriod === 'today' ? 'Today' : timePeriod === 'week' ? 'This Week' : timePeriod === 'year' ? 'This Year' : 'This Month'}`}
          trend="up"
        />
        <StatsCard
          label="Avg. Order Value"
          value={metrics.avgOrderValue}
          change="Per order"
          icon="₦"
        />
        <StatsCard
          label="Avg. Rating"
          value={metrics.rating}
          change="From 89 reviews"
          icon="★"
        />
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-bold text-gray-900">Revenue Trend</h2>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-flex-end justify-around gap-2 bg-gray-50 p-6 rounded-lg">
            {timePeriod === 'today' ? (
              [65, 72, 55, 78, 68, 80, 72].map((value, i) => (
                <div key={i} className="flex flex-col items-center flex-1">
                  <div
                    className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t transition-all"
                    style={{ height: `${(value / 100) * 100}px` }}
                  />
                  <p className="text-xs text-gray-600 mt-2">Hour {i * 3}</p>
                </div>
              ))
            ) : timePeriod === 'week' ? (
              ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                const values = [42, 65, 58, 72, 68, 88, 76];
                return (
                  <div key={i} className="flex flex-col items-center flex-1">
                    <div
                      className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t transition-all"
                      style={{ height: `${(values[i] / 100) * 100}px` }}
                    />
                    <p className="text-xs text-gray-600 mt-2">{day}</p>
                  </div>
                );
              })
            ) : timePeriod === 'month' ? (
              [...Array(12)].map((_, i) => {
                const values = [42, 65, 58, 72, 68, 88, 76, 55, 82, 70, 78, 95];
                return (
                  <div key={i} className="flex flex-col items-center flex-1">
                    <div
                      className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t transition-all"
                      style={{ height: `${(values[i] / 100) * 100}px` }}
                    />
                    <p className="text-xs text-gray-600 mt-2">Week {i + 1}</p>
                  </div>
                );
              })
            ) : (
              ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, i) => {
                const values = [42, 65, 58, 72, 68, 88, 76, 55, 82, 70, 78, 95];
                return (
                  <div key={i} className="flex flex-col items-center flex-1">
                    <div
                      className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t transition-all"
                      style={{ height: `${(values[i] / 100) * 100}px` }}
                    />
                    <p className="text-xs text-gray-600 mt-2">{month}</p>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-bold text-gray-900">Top Selling Products</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {TOP_PRODUCTS.map(product => (
                <div key={product.rank} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {product.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-xs text-gray-600">{product.unitsSold} units sold</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-gray-900">{product.revenue}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Reviews */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-bold text-gray-900">Recent Reviews</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {SAMPLE_REVIEWS.map(review => (
                <div key={review.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{review.customerName}</p>
                      <p className="text-xs text-gray-600">{review.date}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {renderStarRating(review.rating)}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
