'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';

// Sample saved pharmacies
const SAMPLE_SAVED_PHARMACIES = [
  {
    id: '1',
    name: 'HealthPlus Pharmacy',
    location: 'Lekki, Lagos',
    rating: 4.8,
  },
  {
    id: '2',
    name: 'MediCare Pharmacy',
    location: 'Ikoyi, Lagos',
    rating: 4.6,
  },
  {
    id: '3',
    name: 'QuickHealth Pharmacy',
    location: 'VI, Lagos',
    rating: 4.7,
  },
];

export default function ProfilePage() {
  const { profile } = useAuth();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Profile form state
  const [formData, setFormData] = useState({
    name: profile?.name || 'Chioma Adeyemi',
    email: profile?.email || 'chioma@example.com',
    phone: '+234 803 456 7890',
    address: '15, Allen Avenue, Ikoyi, Lagos',
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    promotions: false,
    riderLocation: true,
    systemMessages: true,
  });

  // Saved pharmacies
  const [savedPharmacies, setSavedPharmacies] = useState(SAMPLE_SAVED_PHARMACIES);

  const handleSaveProfile = async () => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsEditingProfile(false);
    // Show success notification (in real app)
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsChangingPassword(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsDeleting(false);
    setIsDeleteModalOpen(false);
    // In real app, would redirect to home
  };

  const handleRemovePharmacy = (id: string) => {
    setSavedPharmacies(savedPharmacies.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="My Profile"
        description="Manage your account settings and preferences"
      />

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">Account Information</h3>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-3xl font-bold">
              {profile?.name?.charAt(0) || 'C'}
            </div>
            <div>
              <p className="text-sm text-gray-600">Profile Avatar</p>
              <p className="font-semibold text-gray-900">{profile?.name || 'Chioma Adeyemi'}</p>
              <p className="text-sm text-gray-600">{profile?.email || 'chioma@example.com'}</p>
            </div>
          </div>

          {/* Profile Info - Display or Edit Mode */}
          {!isEditingProfile ? (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Full Name</p>
                  <p className="font-semibold text-gray-900">{formData.name}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <p className="font-semibold text-gray-900">{formData.email}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Phone</p>
                  <p className="font-semibold text-gray-900">{formData.phone}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Delivery Address</p>
                  <p className="font-semibold text-gray-900 text-sm">{formData.address}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                label="Full Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
              <Input
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
              <Input
                label="Phone Number"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
              <Input
                label="Delivery Address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-gray-50 border-t">
          {!isEditingProfile ? (
            <Button
              variant="primary"
              onClick={() => setIsEditingProfile(true)}
              className="w-full"
            >
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-3 w-full">
              <Button
                variant="ghost"
                onClick={() => setIsEditingProfile(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveProfile}
                className="flex-1"
              >
                Save Changes
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>

      {/* Saved Pharmacies */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">Favorite Pharmacies</h3>
        </CardHeader>
        <CardContent>
          {savedPharmacies.length > 0 ? (
            <div className="space-y-3">
              {savedPharmacies.map((pharmacy) => (
                <div
                  key={pharmacy.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {pharmacy.name}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-sm text-gray-600">{pharmacy.location}</p>
                      <div className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4 text-yellow-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm font-semibold text-gray-700">
                          {pharmacy.rating}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemovePharmacy(pharmacy.id)}
                    className="ml-4 text-red-600 hover:text-red-700 font-medium text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-600">No saved pharmacies yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">Account Settings</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Change Password */}
          {!isChangingPassword ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsChangingPassword(true)}
            >
              Change Password
            </Button>
          ) : (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <Input
                label="Current Password"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    currentPassword: e.target.value,
                  })
                }
              />
              <Input
                label="New Password"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    newPassword: e.target.value,
                  })
                }
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirmPassword: e.target.value,
                  })
                }
              />
              <div className="flex gap-3 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => setIsChangingPassword(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleChangePassword}
                  className="flex-1"
                >
                  Update Password
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">Notifications</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(notifications).map(([key, value]) => (
            <div
              key={key}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-900">
                  {key === 'orderUpdates'
                    ? 'Order Updates'
                    : key === 'promotions'
                    ? 'Promotions & Offers'
                    : key === 'riderLocation'
                    ? 'Rider Location Updates'
                    : 'System Messages'}
                </p>
                <p className="text-sm text-gray-600">
                  {key === 'orderUpdates'
                    ? 'Get notified when your orders are confirmed or delivered'
                    : key === 'promotions'
                    ? 'Receive special offers and promotions'
                    : key === 'riderLocation'
                    ? 'Real-time rider location and ETA'
                    : 'Important system notifications'}
                </p>
              </div>
              <button
                onClick={() =>
                  setNotifications({
                    ...notifications,
                    [key]: !value,
                  })
                }
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  value ? 'bg-primary-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    value ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <h3 className="font-semibold text-red-700">Danger Zone</h3>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
        </CardContent>
        <CardFooter className="bg-red-50 border-t border-red-200">
          <Button
            variant="outline"
            className="w-full !border-red-500 !text-red-600 hover:!bg-red-50"
            onClick={() => setIsDeleteModalOpen(true)}
          >
            Delete Account
          </Button>
        </CardFooter>
      </Card>

      {/* Delete Account Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Account"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800 font-semibold mb-2">
              Warning: This action is permanent
            </p>
            <p className="text-sm text-red-700">
              Deleting your account will remove all your data including orders, messages, saved pharmacies, and account information.
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-700 mb-2">
              Type your email to confirm deletion:
            </p>
            <Input
              type="email"
              placeholder={formData.email}
              disabled
              className="opacity-50"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => setIsDeleteModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              className="flex-1 !border-red-500 !text-red-600 hover:!bg-red-50"
              onClick={handleDeleteAccount}
              isLoading={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
