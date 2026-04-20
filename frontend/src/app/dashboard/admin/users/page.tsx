'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Tabs from '@/components/ui/Tabs';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';
import { getUsers, suspendUser, activateUser, softDeleteUser, hardDeleteUser } from '@/lib/services/admin.service';
import toast from 'react-hot-toast';

/**
 * Map API role to display name
 */
function mapRole(apiRole: string): 'Customer' | 'Pharmacy' | 'Delivery' | 'Admin' {
  switch (apiRole) {
    case 'customer': return 'Customer';
    case 'pharmacy_admin': return 'Pharmacy';
    case 'delivery_admin': return 'Delivery';
    case 'platform_admin':
    case 'support_admin':
    case 'admin':
      return 'Admin';
    default: return 'Customer';
  }
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'Customer' | 'Pharmacy' | 'Delivery' | 'Admin';
  status: 'Active' | 'Suspended' | 'Pending';
  joinedDate: string;
  phone?: string;
}

interface FilterState {
  status: 'All' | 'Active' | 'Suspended' | 'Pending';
  joinedAfter: string;
  joinedBefore: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'suspend' | 'activate' | null>(null);
  const [deleteType, setDeleteType] = useState<'soft' | 'hard' | null>(null);
  const [sortField, setSortField] = useState<keyof User>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    status: 'All',
    joinedAfter: '',
    joinedBefore: '',
  });
  const itemsPerPage = 10;

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getUsers();
        const usersData = response.success && response.data
          ? (Array.isArray(response.data) ? response.data : response.data.users || [])
          : [];

        // Map API response to User interface
        const mappedUsers = usersData.map((u: any) => ({
          id: u.id,
          name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
          email: u.email,
          role: mapRole(u.role),
          status: u.isActive ? 'Active' : 'Suspended',
          joinedDate: u.createdAt?._seconds
            ? new Date(u.createdAt._seconds * 1000).toISOString().split('T')[0]
            : 'N/A',
          phone: u.phoneNumber || '',
        }));

        setUsers(mappedUsers);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        setError('Failed to load users. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const tabs = ['All', 'Customers', 'Pharmacies', 'Delivery Providers', 'Admins'];

  const handleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const processUsers = (users: User[]) => {
    let processed = users;

    // Filter by role
    if (activeTab === 'Customers') {
      processed = processed.filter((u) => u.role === 'Customer');
    } else if (activeTab === 'Pharmacies') {
      processed = processed.filter((u) => u.role === 'Pharmacy');
    } else if (activeTab === 'Delivery Providers') {
      processed = processed.filter((u) => u.role === 'Delivery');
    } else if (activeTab === 'Admins') {
      processed = processed.filter((u) => u.role === 'Admin');
    }

    // Filter by search
    if (searchTerm) {
      processed = processed.filter(
        (u) =>
          u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filters.status !== 'All') {
      processed = processed.filter((u) => u.status === filters.status);
    }

    // Filter by joined date range
    if (filters.joinedAfter) {
      processed = processed.filter((u) => u.joinedDate >= filters.joinedAfter);
    }
    if (filters.joinedBefore) {
      processed = processed.filter((u) => u.joinedDate <= filters.joinedBefore);
    }

    // Sort
    processed = [...processed].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });

    return processed;
  };

  const hasActiveFilters = () => {
    return (
      filters.status !== 'All' ||
      filters.joinedAfter !== '' ||
      filters.joinedBefore !== ''
    );
  };

  const clearFilters = () => {
    setFilters({
      status: 'All',
      joinedAfter: '',
      joinedBefore: '',
    });
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    try {
      const dataToExport = allProcessedUsers;
      if (dataToExport.length === 0) {
        toast.error('No users to export');
        return;
      }

      const headers = ['Name', 'Email', 'Role', 'Status', 'Joined Date'];
      const rows = dataToExport.map((user) => [
        user.name,
        user.email,
        user.role,
        user.status,
        user.joinedDate,
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) =>
          row
            .map((cell) => {
              const cellStr = String(cell);
              return cellStr.includes(',') ? `"${cellStr}"` : cellStr;
            })
            .join(',')
        ),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `users_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Exported ${dataToExport.length} users to CSV`);
    } catch (err) {
      console.error('Failed to export CSV:', err);
      toast.error('Failed to export users');
    }
  };

  const allProcessedUsers = processUsers(users);
  const totalPages = Math.ceil(allProcessedUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const filteredUsers = allProcessedUsers.slice(startIndex, startIndex + itemsPerPage);

  const handleRetry = () => {
    setCurrentPage(1);
    setSearchTerm('');
    setActiveTab('All');
    clearFilters();
    // Trigger refetch by clearing and re-fetching
    setLoading(true);
    setError(null);
    const fetchUsers = async () => {
      try {
        const response = await getUsers();
        const usersData = response.success && response.data
          ? (Array.isArray(response.data) ? response.data : response.data.users || [])
          : [];
        const mappedUsers = usersData.map((u: any) => ({
          id: u.id,
          name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
          email: u.email,
          role: mapRole(u.role),
          status: u.isActive ? 'Active' : 'Suspended',
          joinedDate: u.createdAt?._seconds
            ? new Date(u.createdAt._seconds * 1000).toISOString().split('T')[0]
            : 'N/A',
          phone: u.phoneNumber || '',
        }));
        setUsers(mappedUsers);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        setError('Failed to load users. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  };

  const openActionModal = (user: User, action: 'suspend' | 'activate') => {
    setSelectedUser(user);
    setActionType(action);
    setIsActionModalOpen(true);
  };

  const openDeleteModal = (user: User, type: 'soft' | 'hard') => {
    setSelectedUser(user);
    setDeleteType(type);
    setIsActionModalOpen(true);
    setActionType(null);
  };

  const [actionLoading, setActionLoading] = useState(false);

  const handleConfirmAction = async () => {
    if (!selectedUser) return;

    setActionLoading(true);
    try {
      let response;
      if (deleteType === 'soft') {
        response = await softDeleteUser(selectedUser.id);
      } else if (deleteType === 'hard') {
        response = await hardDeleteUser(selectedUser.id);
      } else if (actionType === 'suspend') {
        response = await suspendUser(selectedUser.id);
      } else if (actionType === 'activate') {
        response = await activateUser(selectedUser.id);
      } else {
        return;
      }

      if (response.success) {
        if (deleteType === 'hard') {
          setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
          toast.success(`${selectedUser.name} has been permanently deleted`);
        } else if (deleteType === 'soft') {
          setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
          toast.success(`${selectedUser.name} has been deactivated`);
        } else {
          setUsers((prev) =>
            prev.map((u) =>
              u.id === selectedUser.id
                ? { ...u, status: actionType === 'suspend' ? 'Suspended' as const : 'Active' as const }
                : u
            )
          );
          toast.success(
            actionType === 'suspend'
              ? `${selectedUser.name} has been suspended`
              : `${selectedUser.name} has been activated`
          );
        }
      } else {
        toast.error(response.error?.message || 'Action failed');
      }
    } catch (err) {
      toast.error('Action failed');
    } finally {
      setActionLoading(false);
      setIsActionModalOpen(false);
      setSelectedUser(null);
      setActionType(null);
      setDeleteType(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-red-100 text-red-700';
      case 'Pharmacy':
        return 'bg-blue-100 text-blue-700';
      case 'Delivery':
        return 'bg-purple-100 text-purple-700';
      case 'Customer':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="User Management"
          description="View and manage all platform users"
        />
        <Button
          variant="primary"
          onClick={exportToCSV}
          className="flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8m0 8l-4-2m4 2l4-2"
            />
          </svg>
          Export CSV
        </Button>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="relative">
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg
              className="absolute right-3 top-3 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            <svg
              className={`w-4 h-4 transition-transform ${
                showFilters ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
            Advanced Filters {hasActiveFilters() && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Active</span>}
          </button>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="border-t pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => {
                      setFilters({
                        ...filters,
                        status: e.target.value as FilterState['status'],
                      });
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="All">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>

                {/* Joined After Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Joined After
                  </label>
                  <input
                    type="date"
                    value={filters.joinedAfter}
                    onChange={(e) => {
                      setFilters({
                        ...filters,
                        joinedAfter: e.target.value,
                      });
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Joined Before Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Joined Before
                  </label>
                  <input
                    type="date"
                    value={filters.joinedBefore}
                    onChange={(e) => {
                      setFilters({
                        ...filters,
                        joinedBefore: e.target.value,
                      });
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {hasActiveFilters() && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs
        tabs={tabs.map((tab) => ({
          id: tab,
          label: tab,
        }))}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="text-gray-600">Loading users...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div>
                <p className="text-red-800 font-medium">Error loading users</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
              <Button
                variant="primary"
                onClick={handleRetry}
                className="whitespace-nowrap"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      {!loading && !error && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th
                      className="text-left py-4 px-6 font-semibold text-gray-700 text-sm cursor-pointer hover:bg-gray-100 select-none transition-colors"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-2">
                        Name
                        {sortField === 'name' && (
                          <svg
                            className={`w-4 h-4 ${
                              sortDirection === 'asc' ? '' : 'rotate-180'
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 16V4m0 0L3 8m0 0l4 4m10-4v12m0 0l4-4m0 0l-4-4"
                            />
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      className="text-left py-4 px-6 font-semibold text-gray-700 text-sm cursor-pointer hover:bg-gray-100 select-none transition-colors"
                      onClick={() => handleSort('email')}
                    >
                      <div className="flex items-center gap-2">
                        Email
                        {sortField === 'email' && (
                          <svg
                            className={`w-4 h-4 ${
                              sortDirection === 'asc' ? '' : 'rotate-180'
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 16V4m0 0L3 8m0 0l4 4m10-4v12m0 0l4-4m0 0l-4-4"
                            />
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      className="text-left py-4 px-6 font-semibold text-gray-700 text-sm cursor-pointer hover:bg-gray-100 select-none transition-colors"
                      onClick={() => handleSort('role')}
                    >
                      <div className="flex items-center gap-2">
                        Role
                        {sortField === 'role' && (
                          <svg
                            className={`w-4 h-4 ${
                              sortDirection === 'asc' ? '' : 'rotate-180'
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 16V4m0 0L3 8m0 0l4 4m10-4v12m0 0l4-4m0 0l-4-4"
                            />
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      className="text-left py-4 px-6 font-semibold text-gray-700 text-sm cursor-pointer hover:bg-gray-100 select-none transition-colors"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-2">
                        Status
                        {sortField === 'status' && (
                          <svg
                            className={`w-4 h-4 ${
                              sortDirection === 'asc' ? '' : 'rotate-180'
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 16V4m0 0L3 8m0 0l4 4m10-4v12m0 0l4-4m0 0l-4-4"
                            />
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      className="text-left py-4 px-6 font-semibold text-gray-700 text-sm cursor-pointer hover:bg-gray-100 select-none transition-colors"
                      onClick={() => handleSort('joinedDate')}
                    >
                      <div className="flex items-center gap-2">
                        Joined
                        {sortField === 'joinedDate' && (
                          <svg
                            className={`w-4 h-4 ${
                              sortDirection === 'asc' ? '' : 'rotate-180'
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 16V4m0 0L3 8m0 0l4 4m10-4v12m0 0l4-4m0 0l-4-4"
                            />
                          </svg>
                        )}
                      </div>
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-gray-100 hover:bg-blue-50 transition-colors"
                    >
                      <td className="py-4 px-6 font-medium text-gray-900 text-sm">
                        {user.name}
                      </td>
                      <td className="py-4 px-6 text-gray-600 text-sm">
                        {user.email}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                            user.role
                          )}`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge status={user.status} />
                      </td>
                      <td className="py-4 px-6 text-gray-600 text-sm">
                        {user.joinedDate}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                            title="View details"
                            aria-label="View user details"
                          >
                            <svg
                              className="w-5 h-5 text-blue-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </button>
                          {user.status === 'Active' ? (
                            <button
                              onClick={() => openActionModal(user, 'suspend')}
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                              title="Suspend user"
                              aria-label="Suspend user"
                            >
                              <svg
                                className="w-5 h-5 text-red-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </button>
                          ) : (
                            <button
                              onClick={() => openActionModal(user, 'activate')}
                              className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                              title="Activate user"
                              aria-label="Activate user"
                            >
                              <svg
                                className="w-5 h-5 text-green-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </button>
                          )}
                          {/* Soft delete */}
                          <button
                            onClick={() => openDeleteModal(user, 'soft')}
                            className="p-2 hover:bg-orange-100 rounded-lg transition-colors"
                            title="Deactivate user"
                            aria-label="Deactivate user"
                          >
                            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          </button>
                          {/* Hard delete */}
                          <button
                            onClick={() => openDeleteModal(user, 'hard')}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                            title="Permanently delete"
                            aria-label="Permanently delete user"
                          >
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600">No users found</p>
              </div>
            )}

            {allProcessedUsers.length > 0 && (
              <div className="border-t border-gray-200 px-6 py-4 space-y-4">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-medium text-gray-900">{startIndex + 1}</span> to{' '}
                  <span className="font-medium text-gray-900">
                    {Math.min(startIndex + itemsPerPage, allProcessedUsers.length)}
                  </span>{' '}
                  of <span className="font-medium text-gray-900">{allProcessedUsers.length}</span> users
                </div>
                <div className="flex items-center justify-between gap-4">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 transition-colors"
                  >
                    Previous
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-blue-500 text-white'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* User Details Modal */}
      <Modal
        isOpen={selectedUser !== null && !isActionModalOpen}
        onClose={() => setSelectedUser(null)}
        title={`User Details - ${selectedUser?.name}`}
        size="md"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide">
                  Name
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedUser.name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide">
                  Email
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedUser.email}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide">
                  Role
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedUser.role}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide">
                  Status
                </p>
                <StatusBadge status={selectedUser.status} />
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide">
                  Joined Date
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedUser.joinedDate}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide">
                  User ID
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedUser.id}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setSelectedUser(null)}
                className="flex-1"
              >
                Close
              </Button>
              {selectedUser.status === 'Active' ? (
                <Button
                  variant="primary"
                  onClick={() => {
                    openActionModal(selectedUser, 'suspend');
                  }}
                  className="flex-1"
                >
                  Suspend
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => {
                    openActionModal(selectedUser, 'activate');
                  }}
                  className="flex-1"
                >
                  Activate
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Action Confirmation Modal */}
      <Modal
        isOpen={isActionModalOpen}
        onClose={() => {
          setIsActionModalOpen(false);
          setSelectedUser(null);
          setActionType(null);
          setDeleteType(null);
        }}
        title={
          deleteType === 'hard' ? 'Permanently Delete User' :
          deleteType === 'soft' ? 'Deactivate User' :
          actionType === 'suspend' ? 'Suspend User' : 'Activate User'
        }
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            {deleteType === 'hard'
              ? `Are you sure you want to PERMANENTLY DELETE ${selectedUser?.name}? This action cannot be undone. All user data will be removed.`
              : deleteType === 'soft'
              ? `Are you sure you want to deactivate ${selectedUser?.name}? The account will be disabled but data will be preserved.`
              : actionType === 'suspend'
              ? `Are you sure you want to suspend ${selectedUser?.name}? This user will no longer be able to access their account.`
              : `Are you sure you want to activate ${selectedUser?.name}? They will regain access to their account.`}
          </p>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsActionModalOpen(false);
                setSelectedUser(null);
                setActionType(null);
                setDeleteType(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmAction}
              className="flex-1"
              disabled={actionLoading}
            >
              {actionLoading ? 'Processing...' :
                deleteType === 'hard' ? 'Delete Permanently' :
                deleteType === 'soft' ? 'Deactivate' :
                actionType === 'suspend' ? 'Suspend' : 'Activate'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
