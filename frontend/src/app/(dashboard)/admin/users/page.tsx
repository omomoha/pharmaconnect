'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Tabs from '@/components/ui/Tabs';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'Customer' | 'Pharmacy' | 'Delivery' | 'Admin';
  status: 'Active' | 'Suspended' | 'Pending';
  joinedDate: string;
}

const sampleUsers: User[] = [
  {
    id: '1',
    name: 'John Okafor',
    email: 'john.okafor@email.com',
    role: 'Customer',
    status: 'Active',
    joinedDate: '2026-01-15',
  },
  {
    id: '2',
    name: 'Amara Pharmacy',
    email: 'info@amarapharmacy.com',
    role: 'Pharmacy',
    status: 'Active',
    joinedDate: '2026-01-10',
  },
  {
    id: '3',
    name: 'Swift Logistics',
    email: 'hello@swiftlogistics.com',
    role: 'Delivery',
    status: 'Active',
    joinedDate: '2026-01-20',
  },
  {
    id: '4',
    name: 'Admin User',
    email: 'admin@pharmaconnect.com',
    role: 'Admin',
    status: 'Active',
    joinedDate: '2025-12-01',
  },
  {
    id: '5',
    name: 'Chioma Adeyemi',
    email: 'chioma.a@email.com',
    role: 'Customer',
    status: 'Suspended',
    joinedDate: '2026-02-05',
  },
  {
    id: '6',
    name: 'HealthCare Plus',
    email: 'contact@healthcareplus.com',
    role: 'Pharmacy',
    status: 'Active',
    joinedDate: '2026-01-25',
  },
  {
    id: '7',
    name: 'Express Delivery',
    email: 'ops@expressdelivery.com',
    role: 'Delivery',
    status: 'Pending',
    joinedDate: '2026-03-20',
  },
  {
    id: '8',
    name: 'Tunde Ibrahim',
    email: 'tunde.ibrahim@email.com',
    role: 'Customer',
    status: 'Active',
    joinedDate: '2026-02-12',
  },
  {
    id: '9',
    name: 'MedPlus Pharmacy',
    email: 'support@medplus.com',
    role: 'Pharmacy',
    status: 'Active',
    joinedDate: '2026-01-30',
  },
  {
    id: '10',
    name: 'Lagos Riders',
    email: 'hello@lagosriders.com',
    role: 'Delivery',
    status: 'Active',
    joinedDate: '2026-02-08',
  },
  {
    id: '11',
    name: 'Ngozi Obi',
    email: 'ngozi.obi@email.com',
    role: 'Customer',
    status: 'Active',
    joinedDate: '2026-03-01',
  },
  {
    id: '12',
    name: 'Senior Admin',
    email: 'senioradmin@pharmaconnect.com',
    role: 'Admin',
    status: 'Active',
    joinedDate: '2025-11-15',
  },
  {
    id: '13',
    name: 'Blessing Nwosu',
    email: 'blessing.n@email.com',
    role: 'Customer',
    status: 'Active',
    joinedDate: '2026-03-10',
  },
  {
    id: '14',
    name: 'ProHealth Stores',
    email: 'admin@prohealthstores.com',
    role: 'Pharmacy',
    status: 'Suspended',
    joinedDate: '2026-02-01',
  },
  {
    id: '15',
    name: 'Quick Delivery Co',
    email: 'support@quickdelivery.com',
    role: 'Delivery',
    status: 'Active',
    joinedDate: '2026-02-20',
  },
];

export default function UserManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'suspend' | 'activate' | null>(null);

  const tabs = ['All', 'Customers', 'Pharmacies', 'Delivery Providers', 'Admins'];

  const filterUsers = (users: User[]) => {
    let filtered = users;

    // Filter by role
    if (activeTab === 'Customers') {
      filtered = filtered.filter((u) => u.role === 'Customer');
    } else if (activeTab === 'Pharmacies') {
      filtered = filtered.filter((u) => u.role === 'Pharmacy');
    } else if (activeTab === 'Delivery Providers') {
      filtered = filtered.filter((u) => u.role === 'Delivery');
    } else if (activeTab === 'Admins') {
      filtered = filtered.filter((u) => u.role === 'Admin');
    }

    // Filter by search
    if (searchTerm) {
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredUsers = filterUsers(sampleUsers);

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

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">
                    Name
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">
                    Email
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">
                    Role
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">
                    Status
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">
                    Joined
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
        </CardContent>
      </Card>

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
