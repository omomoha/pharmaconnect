'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAdminDashboard } from '@/hooks';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const { stats, loading: dashboardLoading, error: dashboardError } = useAdminDashboard();

  // Show error toast if dashboard fails to load
  useEffect(() => {
    if (dashboardError) {
      toast.error('Failed to load admin dashboard');
    }
  }, [dashboardError]);

  // Sample data
  const samplePlatformStats = [
    { label: 'Total Users', value: '2,834', change: '+125 this week' },
    { label: 'Total Orders', value: '12,456', change: '+8% from last week' },
    { label: 'Total Revenue', value: '₦5.2M', change: '+12% from last week' },
    { label: 'Flagged Chats', value: '23', change: '8 pending review' },
  ];

  // Use API stats if available, otherwise fallback to sample
  const displayStats = stats && Object.keys(stats).length > 0 ? stats : samplePlatformStats;

  const sampleRecentFlags = [
    {
      id: '1',
      type: 'Prescription Drug Detection',
      message: 'User mentioned prescription drug in chat',
      severity: 'High',
      date: '2026-03-24 14:30',
      status: 'Pending',
    },
    {
      id: '2',
      type: 'Suspicious Activity',
      message: 'Multiple failed payment attempts',
      severity: 'Medium',
      date: '2026-03-24 12:15',
      status: 'Reviewing',
    },
    {
      id: '3',
      type: 'Harassment Report',
      message: 'Customer reported pharmacy staff behavior',
      severity: 'High',
      date: '2026-03-24 10:00',
      status: 'Pending',
    },
  ];

  const samplePendingApprovals = [
    { id: '1', type: 'Pharmacy', name: 'HealthCare Plus', date: '2026-03-23' },
    { id: '2', type: 'Delivery Provider', name: 'Swift Logistics', date: '2026-03-22' },
  ];

  const displayRecentFlags = sampleRecentFlags;
  const displayPendingApprovals = samplePendingApprovals;

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
      <div className="grid md:grid-cols-4 gap-6">
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
                View Pending Approvals ({displayPendingApprovals.length})
              </Button>
            </Link>
            <Link href="/dashboard/admin/flags">
              <Button variant="secondary" className="w-full justify-start">
                Review Flagged Chats (23)
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

        {/* System Health */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-bold text-gray-900">System Health</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-gray-600">API Status</p>
                <span className="text-xs font-medium text-green-600">Healthy</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-gray-600">Database Load</p>
                <span className="text-xs font-medium text-green-600">45%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '45%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-gray-600">Storage Usage</p>
                <span className="text-xs font-medium text-green-600">62%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-secondary-500 h-2 rounded-full" style={{ width: '62%' }} />
              </div>
            </div>
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
