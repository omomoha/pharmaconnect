'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Tabs from '@/components/ui/Tabs';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';
import { getUsers } from '@/lib/services/admin.service';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'Customer' | 'Pharmacy' | 'Delivery' | 'Admin';
  status: 'Active' | 'Suspended' | 'Pending';
  joinedDate: string;
  phone?: string;
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
  const [sortField, setSortField] = useState<keyof User>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getUsers();

        // Map API response to User interface
        const mappedUsers = response.users.map((u: any) => ({
          id: u.id,
          name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
          email: u.email,
          role: u.role,
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

  const allProcessedUsers = processUsers(users);
  const totalPages = Math.ceil(allProcessedUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const filteredUsers = allProcessedUsers.slice(startIndex, startIndex + itemsPerPage);

  const handleRetry = () => {
    setCurrentPage(1);
    setSearchTerm('');
    setActiveTab('All');
    // Trigger refetch by clearing and re-fetching
    setLoading(true);
    setError(null);
    const fetchUsers = async () => {
      try {
        const response = await getUsers();
        const mappedUsers = response.users.map((u: any) => ({
          id: u.id,
          name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
          email: u.email,
          role: u.role,
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

  const handleConfirmAction = () => {
    setIsActionModalOpen(false);
    setSelectedUser(null);
    setActionType(null);
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
      <PageHeader
        title="User Management"
        description="View and manage all platform users"
      />

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="absolute right-3 top-3.5 text-gray-400">🔍</span>
          </div>
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
                    className="text-left py-4 px-6 font-semibold text-gray-700 text-sm cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('name')}
                  >
                    Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="text-left py-4 px-6 font-semibold text-gray-700 text-sm cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('email')}
                  >
                    Email {sortField === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="text-left py-4 px-6 font-semibold text-gray-700 text-sm cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('role')}
                  >
                    Role {sortField === 'role' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="text-left py-4 px-6 font-semibold text-gray-700 text-sm cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('status')}
                  >
                    Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="text-left py-4 px-6 font-semibold text-gray-700 text-sm cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('joinedDate')}
                  >
                    Joined {sortField === 'joinedDate' && (sortDirection === 'asc' ? '↑' : '↓')}
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
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
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
                          className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-lg"
                          title="View details"
                        >
                          👁️
                        </button>
                        {user.status === 'Active' ? (
                          <button
                            onClick={() => openActionModal(user, 'suspend')}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors text-lg"
                            title="Suspend user"
                          >
                            🚫
                          </button>
                        ) : (
                          <button
                            onClick={() => openActionModal(user, 'activate')}
                            className="p-2 hover:bg-green-100 rounded-lg transition-colors text-lg"
                            title="Activate user"
                          >
                            ✅
                          </button>
                        )}
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
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 mt-4">
              <div className="text-sm text-gray-500">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, allProcessedUsers.length)} of{' '}
                {allProcessedUsers.length} results
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded border border-gray-300 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-blue-500 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded border border-gray-300 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
            <div className="grid grid-cols-2 gap-4">
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
        }}
        title={
          actionType === 'suspend'
            ? 'Suspend User'
            : 'Activate User'
        }
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            {actionType === 'suspend'
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
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant={actionType === 'suspend' ? 'primary' : 'primary'}
              onClick={handleConfirmAction}
              className="flex-1"
            >
              {actionType === 'suspend' ? 'Suspend' : 'Activate'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
