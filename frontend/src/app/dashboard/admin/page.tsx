'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAdminDashboard, usePendingApprovals, useFlaggedAlerts } from '@/hooks';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const { stats, loading: dashboardLoading, error: dashboardError } = useAdminDashboard();
  const { pharmacies: pendingPharmacies, providers: pendingProviders, loading: approvalsLoading } = usePendingApprovals();
  const { alerts: flaggedAlerts, loading: alertsLoading } = useFlaggedAlerts();

  // Show error toast if dashboard fails to load
  useEffect(() => {
    if (dashboardError) {
      toast.error('Failed to load admin dashboard');
    }
  }, [dashboardError]);

  // Build stats from real API data
  const displayStats = stats ? [
    { label: 'Total Pharmacies', value: String(stats.totalPharmacies || 0), change: `${stats.pendingPharmacies || 0} pending approval` },
    { label: 'Total Orders', value: String(stats.totalOrders || 0), change: `₦${((stats.totalRevenue || 0) / 1000).toFixed(0)}K revenue` },
    { label: 'Delivery Providers', value: String(stats.totalDeliveryProviders || 0), change: `${stats.pendingProviders || 0} pending approval` },
    { label: 'Flagged Alerts', value: String(stats.flaggedAlerts || 0), change: `${flaggedAlerts.length} active` },
  ] : [];

  // Build pending approvals from real data
  const displayPendingApprovals = [
    ...pendingPharmacies.map((p: any) => ({
      id: p.id,
      type: 'Pharmacy',
      name: p.name || p.businessName || 'Unnamed Pharmacy',
      date: p.createdAt?._seconds
        ? new Date(p.createdAt._seconds * 1000).toISOString().split('T')[0]
        : 'N/A',
    })),
    ...pendingProviders.map((p: any) => ({
      id: p.id,
      type: 'Delivery Provider',
      name: p.name || p.businessName || 'Unnamed Provider',
      date: p.createdAt?._seconds
        ? new Date(p.createdAt._seconds * 1000).toISOString().split('T')[0]
        : 'N/A',
    })),
  ].sort((a, b) => (b.date > a.date ? 1 : -1)).slice(0, 5);

  // Use real flagged alerts (show latest 5)
  const displayRecentFlags = flaggedAlerts.slice(0, 5).map((alert: any) => ({
    id: alert.id,
    type: alert.category || alert.type || 'Unknown',
    message: alert.message || alert.reason || 'No details',
    severity: alert.severity || 'Medium',
    date: alert.createdAt?._seconds
      ? new Date(alert.createdAt._seconds * 1000).toLocaleString()
      : 'N/A',
    status: alert.status || 'Pending',
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Monitor platform activity and manage approvals
        </p>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        {dashboardLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-gray-200 rounded animate-pulse" />
            ))}
          </>
        ) : (
          displayStats.map((stat: { label: string; value: string; change: string }, index: number) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <p className="text-gray-600 text-sm font-medium mb-2">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>
                <p className="text-xs text-green-600">{stat.change}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/admin/approvals">
              <Button variant="primary" className="w-full justify-start">
                View Pending Approvals ({approvalsLoading ? '...' : displayPendingApprovals.length})
              </Button>
            </Link>
            <Link href="/dashboard/admin/flags">
              <Button variant="secondary" className="w-full justify-start">
                Review Flagged Chats ({alertsLoading ? '...' : flaggedAlerts.length})
              </Button>
            </Link>
            <Link href="/dashboard/admin/users">
              <Button variant="outline" className="w-full justify-start">
                Manage Users
              </Button>
            </Link>
            <Link href="/dashboard/admin/analytics">
              <Button variant="ghost" className="w-full justify-start">
                View Analytics
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-bold text-gray-900">Pending Approvals</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {displayPendingApprovals.length > 0 ? (
              displayPendingApprovals.map((approval) => (
                <div
                  key={approval.id}
                  className="p-3 border border-yellow-200 bg-yellow-50 rounded-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {approval.type}
                      </p>
                      <p className="text-xs text-gray-600">{approval.name}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    Submitted: {approval.date}
                  </p>
                  <Link href={`/dashboard/admin/approvals/${approval.id}`}>
                    <Button variant="ghost" size="sm" className="w-full">
                      Review
                    </Button>
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-gray-600 text-sm text-center py-4">
                All approvals are current
              </p>
            )}
          </CardContent>
        </Card>

        {/* Platform Summary */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-bold text-gray-900">Platform Summary</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats ? (
              <>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm text-gray-600">Approved Pharmacies</p>
                    <span className="text-sm font-medium text-gray-900">{stats.approvedPharmacies || 0}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: stats.totalPharmacies ? `${((stats.approvedPharmacies || 0) / stats.totalPharmacies) * 100}%` : '0%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm text-gray-600">Approved Providers</p>
                    <span className="text-sm font-medium text-gray-900">{stats.approvedProviders || 0}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: stats.totalDeliveryProviders ? `${((stats.approvedProviders || 0) / stats.totalDeliveryProviders) * 100}%` : '0%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <span className="text-sm font-medium text-gray-900">{`₦${((stats.totalRevenue || 0)).toLocaleString()}`}</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">Loading...</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Flags */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Recent Flags</h2>
            <Link href="/dashboard/admin/flags">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Message
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Severity
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayRecentFlags.map((flag) => (
                  <tr
                    key={flag.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-4 font-medium">{flag.type}</td>
                    <td className="py-4 px-4 text-gray-600">{flag.message}</td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          flag.severity === 'High'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {flag.severity}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-600">{flag.date}</td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          flag.status === 'Pending'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {flag.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
