'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import StatsCard from '@/components/ui/StatsCard';

interface TopEntity {
  id: string;
  name: string;
  value: string | number;
  metric2?: string;
  metric3?: string;
}

const topPharmacies: TopEntity[] = [
  { id: '1', name: 'Amara Pharmacy', value: '245 orders', metric2: '₦2.4M revenue', metric3: '4.8 rating' },
  { id: '2', name: 'HealthCare Plus', value: '189 orders', metric2: '₦1.8M revenue', metric3: '4.9 rating' },
  { id: '3', name: 'MedPlus Pharmacy', value: '156 orders', metric2: '₦1.5M revenue', metric3: '4.7 rating' },
  { id: '4', name: 'ProHealth Stores', value: '142 orders', metric2: '₦1.3M revenue', metric3: '4.6 rating' },
  { id: '5', name: 'Premium Pharmacy Network', value: '128 orders', metric2: '₦1.2M revenue', metric3: '4.8 rating' },
];

const topDeliveryProviders: TopEntity[] = [
  { id: '1', name: 'Swift Logistics', value: '198 deliveries', metric2: '4.9 rating', metric3: '₦1.2M earnings' },
  { id: '2', name: 'Lagos Express Riders', value: '176 deliveries', metric2: '4.8 rating', metric3: '₦1.0M earnings' },
  { id: '3', name: 'Express Delivery', value: '154 deliveries', metric2: '4.7 rating', metric3: '₦920K earnings' },
  { id: '4', name: 'Quick Delivery Services', value: '143 deliveries', metric2: '4.6 rating', metric3: '₦850K earnings' },
  { id: '5', name: 'Speedy Riders Co', value: '128 deliveries', metric2: '4.8 rating', metric3: '₦760K earnings' },
];

const recentActivity = [
  { id: '1', activity: 'User "John Okafor" placed order ORD-2026-001', time: '2 minutes ago' },
  { id: '2', activity: 'Pharmacy "HealthCare Plus" completed order delivery', time: '5 minutes ago' },
  { id: '3', activity: 'New delivery provider "Express Logistics" registered', time: '12 minutes ago' },
  { id: '4', activity: 'Payment of ₦45,600 processed from order ORD-2026-002', time: '18 minutes ago' },
  { id: '5', activity: 'User "Chioma Adeyemi" submitted support ticket', time: '32 minutes ago' },
  { id: '6', activity: 'Pharmacy "MedPlus" inventory updated - 150 new items', time: '45 minutes ago' },
  { id: '7', activity: 'Chat flag submitted - "Suspicious Activity" detected', time: '1 hour ago' },
  { id: '8', activity: 'Delivery rider "Samuel Adekunle" completed 5 orders today', time: '2 hours ago' },
  { id: '9', activity: 'Platform commission earned: ₦8,250 from today orders', time: '2 hours ago' },
  { id: '10', activity: 'New customer "Blessing Nwosu" registered on platform', time: '3 hours ago' },
];

export default function AnalyticsPage() {
  const [timePeriod, setTimePeriod] = useState('This Month');

  const periods = ['Today', 'This Week', 'This Month', 'This Year'];

  // Sample data that changes based on period selection
  const getAnalyticsData = () => {
    const data: Record<string, any> = {
      Today: {
        revenue: '₦428,500',
        commission: '₦42,850',
        users: '342',
        registrations: '24',
        revenueChartData: [12, 19, 8, 15, 22, 11, 18],
        userChartData: [45, 52, 38, 41, 55, 48, 52],
      },
      'This Week': {
        revenue: '₦2,856,400',
        commission: '₦285,640',
        users: '1,240',
        registrations: '142',
        revenueChartData: [428, 615, 523, 687, 856, 742, 605],
        userChartData: [340, 385, 412, 456, 523, 478, 495],
      },
      'This Month': {
        revenue: '₦11,425,800',
        commission: '₦1,142,580',
        users: '4,856',
        registrations: '528',
        revenueChartData: [2850, 3120, 2890, 3450, 3780, 3210, 3920, 2750, 3115, 3625, 4025, 3400],
        userChartData: [1240, 1385, 1512, 1698, 1923, 2145, 2289, 2456, 2645, 2856, 3021, 3256],
      },
      'This Year': {
        revenue: '₦145,625,300',
        commission: '₦14,562,530',
        users: '24,560',
        registrations: '6,420',
        revenueChartData: [9250, 10125, 9850, 11200, 12450, 10850, 11920, 13250, 12150, 14325, 15210, 13540],
        userChartData: [8450, 9120, 9856, 10450, 11230, 12100, 13045, 13890, 14560, 15240, 16120, 17340],
      },
    };
    return data[timePeriod];
  };

  const analyticsData = getAnalyticsData();

  const maxRevenue = Math.max(...analyticsData.revenueChartData);
  const maxUsers = Math.max(...analyticsData.userChartData);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Analytics"
        description="Monitor platform performance and user growth"
      />

      {/* Time Period Selector */}
      <div className="flex gap-2 flex-wrap">
        {periods.map((period) => (
          <Button
            key={period}
            variant={timePeriod === period ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setTimePeriod(period)}
          >
            {period}
          </Button>
        ))}
      </div>

      {/* Stats Row */}
      <div className="grid md:grid-cols-4 gap-6">
        <StatsCard
          label="Total Revenue"
          value={analyticsData.revenue}
          icon="💰"
        />
        <StatsCard
          label="Platform Commission"
          value={analyticsData.commission}
          icon="📈"
        />
        <StatsCard
          label="Active Users"
          value={analyticsData.users}
          icon="👥"
        />
        <StatsCard
          label="New Registrations"
          value={analyticsData.registrations}
          icon="📝"
        />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <h3 className="font-bold text-gray-900">Revenue Trend</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end gap-2 h-40 px-2">
              {analyticsData.revenueChartData.map((value: number, index: number) => (
                <div
                  key={index}
                  className="flex-1 bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-lg transition-all hover:from-primary-600 hover:to-primary-500 cursor-pointer group relative"
                  style={{ height: `${(value / maxRevenue) * 100}%` }}
                  title={`₦${(value * 1000).toLocaleString()}`}
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    ₦{(value * 1000).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-600 text-center">
              {timePeriod === 'Today' && 'Revenue by hour'}
              {timePeriod === 'This Week' && 'Revenue by day'}
              {timePeriod === 'This Month' && 'Revenue by day'}
              {timePeriod === 'This Year' && 'Revenue by month'}
            </div>
          </CardContent>
        </Card>

        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <h3 className="font-bold text-gray-900">User Growth</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end gap-2 h-40 px-2">
              {analyticsData.userChartData.map((value: number, index: number) => (
                <div
                  key={index}
                  className="flex-1 bg-gradient-to-t from-secondary-500 to-secondary-400 rounded-t-lg transition-all hover:from-secondary-600 hover:to-secondary-500 cursor-pointer group relative"
                  style={{ height: `${(value / maxUsers) * 100}%` }}
                  title={`${value.toLocaleString()} users`}
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {value.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-600 text-center">
              {timePeriod === 'Today' && 'Users by hour'}
              {timePeriod === 'This Week' && 'Users by day'}
              {timePeriod === 'This Month' && 'Users by day'}
              {timePeriod === 'This Year' && 'Users by month'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Pharmacies and Delivery Providers */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Pharmacies */}
        <Card>
          <CardHeader>
            <h3 className="font-bold text-gray-900">Top Pharmacies</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPharmacies.map((pharmacy, index) => (
                <div
                  key={pharmacy.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="font-medium text-gray-900">
                        {pharmacy.name}
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs text-gray-600 mt-1">
                      <span>{pharmacy.value}</span>
                      <span>{pharmacy.metric2}</span>
                      <span>{pharmacy.metric3}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Delivery Providers */}
        <Card>
          <CardHeader>
            <h3 className="font-bold text-gray-900">Top Delivery Providers</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topDeliveryProviders.map((provider, index) => (
                <div
                  key={provider.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-secondary-100 text-secondary-700 rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="font-medium text-gray-900">
                        {provider.name}
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs text-gray-600 mt-1">
                      <span>{provider.value}</span>
                      <span>{provider.metric2}</span>
                      <span>{provider.metric3}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Feed */}
      <Card>
        <CardHeader>
          <h3 className="font-bold text-gray-900">Recent Activity Feed</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 p-3 border-l-4 border-primary-500 bg-primary-50 rounded-r-lg hover:bg-primary-100 transition-colors"
              >
                <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-2" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 break-words">
                    {activity.activity}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
