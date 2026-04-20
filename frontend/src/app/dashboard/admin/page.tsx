'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { useAdminDashboard, usePendingApprovals, useFlaggedAlerts } from '@/hooks';

// SVG Icons
const StoreIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m0 10v10l8 4m0-10l8-4" />
  </svg>
);

const PackageIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9-4v4m0 0H9m3 0h3" />
  </svg>
);

const TruckIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const AlertIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const SkeletonLoader = ({ count = 4 }: { count?: number }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="h-32 bg-gradient-to-r from-slate-200 to-slate-100 rounded-lg animate-pulse" />
    ))}
  </>
);

const ErrorRetryBanner = ({ onRetry }: { onRetry: () => void }) => (
  <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start justify-between">
    <div className="flex items-start gap-3">
      <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
      <div>
        <h3 className="text-sm font-semibold text-red-800">Failed to load dashboard</h3>
        <p className="text-sm text-red-700 mt-1">There was an issue fetching your dashboard data. Please try again.</p>
      </div>
    </div>
    <button
      onClick={onRetry}
      className="text-sm font-medium text-red-600 hover:text-red-800 whitespace-nowrap ml-4"
    >
      Retry
    </button>
  </div>
);

// Stat Card with gradient border
const StatCard = ({ icon: Icon, label, value, subtext, accentColor }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
  accentColor: string;
}) => (
  <div className={`relative overflow-hidden rounded-lg bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow`}>
    <div className={`absolute top-0 left-0 w-1 h-full ${accentColor}`} />
    <div className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-lg ${accentColor === 'bg-blue-500' ? 'bg-blue-50' : accentColor === 'bg-green-500' ? 'bg-green-50' : accentColor === 'bg-purple-500' ? 'bg-purple-50' : 'bg-amber-50'} text-gray-700`}>
          {Icon}
        </div>
      </div>
      <p className="text-gray-600 text-sm font-medium mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
      <p className="text-xs text-gray-500">{subtext}</p>
    </div>
  </div>
);

// Quick Action Link
const QuickActionLink = ({ href, icon: Icon, label, count }: {
  href: string;
  icon: React.ReactNode;
  label: string;
  count?: number | string;
}) => (
  <Link href={href}>
    <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all cursor-pointer">
      <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg text-gray-700">
        {Icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {count !== undefined && <p className="text-xs text-gray-500">({count})</p>}
      </div>
      <ChevronRightIcon />
    </div>
  </Link>
);

// Progress Bar Section
const ProgressSection = ({ label, current, total, color }: {
  label: string;
  current: number;
  total: number;
  color: string;
}) => {
  const percentage = total > 0 ? (current / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm font-semibold text-gray-900">{current}</span>
      </div>
      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Pending Approvals Table
const PendingApprovalsTable = ({ approvals, loading }: {
  approvals: Array<{ id: string; type: string; name: string; date: string }>;
  loading: boolean;
}) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-200">
          <th className="text-left py-3 px-4 font-semibold text-gray-700">Entity</th>
          <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
          <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
          <th className="text-right py-3 px-4 font-semibold text-gray-700">Action</th>
        </tr>
      </thead>
      <tbody>
        {loading ? (
          <tr>
            <td colSpan={4} className="py-8 px-4 text-center text-gray-500">Loading...</td>
          </tr>
        ) : approvals.length > 0 ? (
          approvals.map((approval) => (
            <tr key={approval.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="py-3 px-4 font-medium text-gray-900">{approval.name}</td>
              <td className="py-3 px-4 text-gray-600">{approval.type}</td>
              <td className="py-3 px-4 text-gray-500 text-xs">{approval.date}</td>
              <td className="py-3 px-4 text-right">
                <Link href={`/dashboard/admin/approvals/${approval.id}`}>
                  <button className="text-blue-600 hover:text-blue-800 font-medium text-xs">
                    Review
                  </button>
                </Link>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={4} className="py-8 px-4 text-center text-gray-500">No pending approvals</td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

// Flagged Alerts Table
const FlaggedAlertsTable = ({ alerts, loading }: {
  alerts: Array<{ id: string; type: string; message: string; severity: string; date: string; status: string }>;
  loading: boolean;
}) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-200">
          <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
          <th className="text-left py-3 px-4 font-semibold text-gray-700">Message</th>
          <th className="text-left py-3 px-4 font-semibold text-gray-700">Severity</th>
          <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
          <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
        </tr>
      </thead>
      <tbody>
        {loading ? (
          <tr>
            <td colSpan={5} className="py-8 px-4 text-center text-gray-500">Loading...</td>
          </tr>
        ) : alerts.length > 0 ? (
          alerts.map((alert) => (
            <tr key={alert.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="py-3 px-4 font-medium text-gray-900">{alert.type}</td>
              <td className="py-3 px-4 text-gray-600 max-w-md truncate">{alert.message}</td>
              <td className="py-3 px-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  alert.severity === 'High'
                    ? 'bg-red-100 text-red-800'
                    : alert.severity === 'Medium'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {alert.severity}
                </span>
              </td>
              <td className="py-3 px-4 text-gray-500 text-xs">{alert.date}</td>
              <td className="py-3 px-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  alert.status === 'Pending'
                    ? 'bg-orange-100 text-orange-800'
                    : alert.status === 'Resolved'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {alert.status}
                </span>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={5} className="py-8 px-4 text-center text-gray-500">No flagged alerts</td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

export default function AdminDashboard() {
  const { stats, loading: dashboardLoading, error: dashboardError, refetch: refetchDashboard } = useAdminDashboard();
  const { pharmacies: pendingPharmacies, providers: pendingProviders, loading: approvalsLoading } = usePendingApprovals();
  const { alerts: flaggedAlerts, loading: alertsLoading } = useFlaggedAlerts();
  const handleRetry = () => {
    refetchDashboard?.();
  };

  // Build stats from real API data
  const displayStats = stats ? [
    {
      icon: <StoreIcon />,
      label: 'Total Pharmacies',
      value: String(stats.totalPharmacies || 0),
      subtext: `${stats.pendingPharmacies || 0} pending approval`,
      accentColor: 'bg-blue-500',
    },
    {
      icon: <PackageIcon />,
      label: 'Total Orders',
      value: String(stats.totalOrders || 0),
      subtext: `₦${((stats.totalRevenue || 0) / 1000).toFixed(0)}K revenue`,
      accentColor: 'bg-green-500',
    },
    {
      icon: <TruckIcon />,
      label: 'Delivery Providers',
      value: String(stats.totalDeliveryProviders || 0),
      subtext: `${stats.pendingProviders || 0} pending approval`,
      accentColor: 'bg-purple-500',
    },
    {
      icon: <AlertIcon />,
      label: 'Flagged Alerts',
      value: String(stats.flaggedAlerts || 0),
      subtext: `${flaggedAlerts.length} active alerts`,
      accentColor: 'bg-amber-500',
    },
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
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2 text-lg">
          Monitor platform activity, manage approvals, and track flagged content
        </p>
      </div>

      {/* Error Banner */}
      {dashboardError && !dashboardLoading && (
        <ErrorRetryBanner onRetry={handleRetry} />
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {dashboardLoading ? (
          <SkeletonLoader count={4} />
        ) : (
          displayStats.map((stat, index) => (
            <StatCard
              key={index}
              icon={stat.icon}
              label={stat.label}
              value={stat.value}
              subtext={stat.subtext}
              accentColor={stat.accentColor}
            />
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickActionLink
            href="/dashboard/admin/approvals"
            icon={<CheckCircleIcon />}
            label="Pending Approvals"
            count={approvalsLoading ? '...' : displayPendingApprovals.length}
          />
          <QuickActionLink
            href="/dashboard/admin/flags"
            icon={<AlertIcon />}
            label="Flagged Chats"
            count={alertsLoading ? '...' : flaggedAlerts.length}
          />
          <QuickActionLink
            href="/dashboard/admin/users"
            icon={<StoreIcon />}
            label="Manage Users"
          />
          <QuickActionLink
            href="/dashboard/admin/analytics"
            icon={<PackageIcon />}
            label="View Analytics"
          />
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pending Approvals Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Pending Approvals</h2>
              <Link href="/dashboard/admin/approvals">
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View All</button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <PendingApprovalsTable approvals={displayPendingApprovals} loading={approvalsLoading} />
          </CardContent>
        </Card>

        {/* Platform Summary Card */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-bold text-gray-900">Platform Summary</h2>
          </CardHeader>
          <CardContent className="space-y-6">
            {dashboardLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i}>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse" />
                    <div className="h-2 bg-gray-200 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : stats ? (
              <>
                <ProgressSection
                  label="Approved Pharmacies"
                  current={stats.approvedPharmacies || 0}
                  total={stats.totalPharmacies || 0}
                  color="bg-blue-500"
                />
                <ProgressSection
                  label="Approved Providers"
                  current={stats.approvedProviders || 0}
                  total={stats.totalDeliveryProviders || 0}
                  color="bg-green-500"
                />
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {`₦${((stats.totalRevenue || 0)).toLocaleString()}`}
                  </p>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Recent Flags Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Recent Flagged Alerts</h2>
            <Link href="/dashboard/admin/flags">
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View All</button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <FlaggedAlertsTable alerts={displayRecentFlags} loading={alertsLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
