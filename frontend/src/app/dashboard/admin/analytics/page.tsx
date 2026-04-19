'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import StatsCard from '@/components/ui/StatsCard';
import { getAnalytics } from '@/lib/services/admin.service';

interface TopEntity {
  id: string;
  name: string;
  value: string | number;
  metric2?: string;
  metric3?: string;
}

interface ChartPoint {
  label: string;
  value: number;
}

interface DashboardData {
  revenue: number;
  commission: number;
  activeUsers: number;
  newRegistrations: number;
  revenueChartData: ChartPoint[];
  userChartData: ChartPoint[];
}

interface ActivityData {
  id: string;
  activity: string;
  time: string;
}

export default function AnalyticsPage() {
  const [timePeriod, setTimePeriod] = useState('This Month');
  const [analyticsData, setAnalyticsData] = useState<DashboardData | null>(null);
  const [topPharmacies, setTopPharmacies] = useState<TopEntity[]>([]);
  const [topDeliveryProviders, setTopDeliveryProviders] = useState<TopEntity[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const periods = ['Today', 'This Week', 'This Month', 'This Year'];

  // Map UI period labels to API params
  const periodMap: Record<string, 'today' | 'week' | 'month' | 'year'> = {
    'Today': 'today',
    'This Week': 'week',
    'This Month': 'month',
    'This Year': 'year',
  };

  // Fetch analytics data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiPeriod = periodMap[timePeriod] || 'month';
        const res = await getAnalytics(apiPeriod);

        if (res.success && res.data) {
          const d = res.data;

          setAnalyticsData({
            revenue: d.revenue || 0,
            commission: d.commission || 0,
            activeUsers: d.activeUsers || 0,
            newRegistrations: d.newRegistrations || 0,
            revenueChartData: d.revenueChartData || [],
            userChartData: d.userChartData || [],
          });

          // Map top pharmacies
          const pharmacies = (d.topPharmacies || []).map((p: any, idx: number) => ({
            id: idx.toString(),
            name: p.name || 'Unknown Pharmacy',
            value: `${p.orders || 0} orders`,
            metric2: `₦${(p.revenue || 0).toLocaleString()} revenue`,
            metric3: `${p.rating || 0} rating`,
          }));
          setTopPharmacies(pharmacies);

          // Map top delivery providers
          const providers = (d.topDeliveryProviders || []).map((p: any, idx: number) => ({
            id: idx.toString(),
            name: p.name || 'Unknown Provider',
            value: `${p.deliveries || 0} deliveries`,
            metric2: `${p.rating || 0} rating`,
            metric3: `₦${(p.earnings || 0).toLocaleString()} earnings`,
          }));
          setTopDeliveryProviders(providers);

          // Map recent activity
          const activities = (d.recentActivity || []).map((a: any, idx: number) => ({
            id: a.id || idx.toString(),
            activity: a.description || 'Activity',
            time: a.time || 'Unknown time',
          }));
          setRecentActivity(activities);
        } else {
          setError(res.error?.message || 'Failed to fetch analytics data');
        }
      } catch (err) {
        console.error('Failed to fetch analytics data:', err);
        setError('Failed to load analytics data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timePeriod]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Platform Analytics"
          description="Monitor platform performance and user growth"
        />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading analytics data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Platform Analytics"
          description="Monitor platform performance and user growth"
        />
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button
                variant="primary"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Platform Analytics"
          description="Monitor platform performance and user growth"
        />
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-gray-600">No data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const revenueValues = analyticsData.revenueChartData.map((d) => d.value);
  const userValues = analyticsData.userChartData.map((d) => d.value);
  const maxRevenue = revenueValues.length > 0 ? Math.max(...revenueValues) : 1;
  const maxUsers = userValues.length > 0 ? Math.max(...userValues) : 1;

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <StatsCard
          label="Total Revenue"
          value={`₦${analyticsData.revenue.toLocaleString()}`}
          icon="💰"
        />
        <StatsCard
          label="Platform Commission"
          value={`₦${analyticsData.commission.toLocaleString()}`}
          icon="📈"
        />
        <StatsCard
          label="Active Users"
          value={analyticsData.activeUsers.toLocaleString()}
          icon="👥"
        />
        <StatsCard
          label="New Registrations"
          value={analyticsData.newRegistrations.toLocaleString()}
          icon="📝"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <h3 className="font-bold text-gray-900">Revenue Trend</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end gap-2 h-40 px-2">
              {analyticsData.revenueChartData.map((point, index) => (
                <div
                  key={index}
                  className="flex-1 bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-lg transition-all hover:from-primary-600 hover:to-primary-500 cursor-pointer group relative"
                  style={{ height: `${(point.value / maxRevenue) * 100}%`, minHeight: point.value > 0 ? '4px' : '0' }}
                  title={`${point.label}: ₦${point.value.toLocaleString()}`}
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {point.label}: ₦{point.value.toLocaleString()}
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
              {analyticsData.userChartData.map((point, index) => (
                <div
                  key={index}
                  className="flex-1 bg-gradient-to-t from-secondary-500 to-secondary-400 rounded-t-lg transition-all hover:from-secondary-600 hover:to-secondary-500 cursor-pointer group relative"
                  style={{ height: `${(point.value / maxUsers) * 100}%`, minHeight: point.value > 0 ? '4px' : '0' }}
                  title={`${point.label}: ${point.value.toLocaleString()} users`}
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {point.label}: {point.value.toLocaleString()}
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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
