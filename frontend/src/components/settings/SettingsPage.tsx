'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getProfile, updateProfile } from '@/lib/services/auth.service';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import toast from 'react-hot-toast';

interface SettingsPageProps {
  role: 'customer' | 'pharmacy' | 'delivery' | 'admin';
}

export default function SettingsPage({ role }: SettingsPageProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    profileImageUrl: '',
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    orderUpdates: true,
    promotions: false,
  });

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [language, setLanguage] = useState('en');
  const [currency, setCurrency] = useState('NGN');

  // Fetch user profile from API
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getProfile();
      if (res.success && res.data) {
        const userData = (res.data as any).user || res.data;
        setProfileData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || user?.email || '',
          phone: userData.phoneNumber || user?.phoneNumber || '',
          address: userData.address || '',
          profileImageUrl: userData.profileImageUrl || '',
        });
      } else {
        // Fallback to Firebase Auth data
        setProfileData(prev => ({
          ...prev,
          email: user?.email || '',
          phone: user?.phoneNumber || '',
        }));
      }
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user, fetchProfile]);

  // Profile image upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    try {
      setUploadingPhoto(true);
      setUploadProgress(0);

      const storage = getStorage();
      const storageRef = ref(storage, `profile-photos/${user.uid}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        },
        () => {
          toast.error('Failed to upload photo');
          setUploadingPhoto(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          // Save to backend
          const res = await updateProfile({ profileImageUrl: downloadURL } as any);
          if (res.success) {
            setProfileData(prev => ({ ...prev, profileImageUrl: downloadURL }));
            toast.success('Profile photo updated');
          } else {
            toast.error('Failed to save profile photo');
          }
          setUploadingPhoto(false);
        }
      );
    } catch {
      toast.error('Failed to upload photo');
      setUploadingPhoto(false);
    }
  };

  // Save profile changes
  const handleProfileSave = async () => {
    try {
      setSaving(true);
      const res = await updateProfile({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phoneNumber: profileData.phone,
        address: profileData.address,
      } as any);
      if (res.success) {
        toast.success('Profile updated successfully');
        setEditingProfile(false);
      } else {
        toast.error(res.error?.message || 'Failed to update profile');
      }
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Password reset via Firebase
  const handleChangePassword = async () => {
    if (!profileData.email) {
      toast.error('No email address found');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, profileData.email);
      toast.success('Password reset email sent. Check your inbox.');
    } catch {
      toast.error('Failed to send password reset email');
    }
  };

  const handleDeleteAccount = () => {
    toast.error('Please contact support to delete your account.');
    setShowDeleteConfirm(false);
  };

  // Toggle switch component
  const ToggleSwitch = ({ enabled, onChange }: { enabled: boolean; onChange: (value: boolean) => void }) => (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
        enabled ? 'bg-green-500' : 'bg-gray-300'
      }`}
      role="switch"
      aria-checked={enabled}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  const SectionHeader = ({ title, description }: { title: string; description?: string }) => (
    <div className="mb-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">{title}</h2>
      {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
    </div>
  );

  const SettingRow = ({
    label,
    value,
    action,
  }: {
    label: string;
    value?: string | React.ReactNode;
    action?: React.ReactNode;
  }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 py-4 last:border-b-0 gap-2">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {value && typeof value === 'string' && <p className="mt-1 text-xs text-gray-500 break-words">{value}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );

  const initials = `${profileData.firstName?.[0] || ''}${profileData.lastName?.[0] || ''}`.toUpperCase() || '?';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8 px-3 sm:px-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-sm text-gray-600">Manage your account and preferences</p>
        </div>

        {/* PROFILE PHOTO & INFO SECTION */}
        <div className="mb-8 rounded-xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm">
          <SectionHeader title="Profile" />

          {/* Profile Photo */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 pb-6 border-b border-gray-100">
            <div className="relative">
              {profileData.profileImageUrl ? (
                <img
                  src={profileData.profileImageUrl}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center text-2xl font-bold border-2 border-gray-200">
                  {initials}
                </div>
              )}
              {uploadingPhoto && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{uploadProgress}%</span>
                </div>
              )}
            </div>
            <div className="text-center sm:text-left">
              <p className="font-semibold text-gray-900">
                {profileData.firstName} {profileData.lastName}
              </p>
              <p className="text-sm text-gray-500 capitalize">{role === 'admin' ? 'Platform Admin' : role}</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
              >
                {uploadingPhoto ? 'Uploading...' : 'Change Photo'}
              </button>
            </div>
          </div>

          {/* Profile Fields */}
          <div className="space-y-4">
            {!editingProfile ? (
              <>
                <SettingRow label="First Name" value={profileData.firstName || 'Not set'} />
                <SettingRow label="Last Name" value={profileData.lastName || 'Not set'} />
                <SettingRow label="Email Address" value={profileData.email || 'Not set'} />
                <SettingRow label="Phone Number" value={profileData.phone || 'Not set'} />
                <SettingRow label="Address" value={profileData.address || 'Not set'} />
                <div className="pt-4">
                  <button
                    onClick={() => setEditingProfile(true)}
                    className="rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 transition-colors"
                  >
                    Edit Profile
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={profileData.address}
                    onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                    placeholder="Enter your address"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    onClick={handleProfileSave}
                    disabled={saving}
                    className="rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => setEditingProfile(false)}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* NOTIFICATIONS SECTION */}
        <div className="mb-8 rounded-xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm">
          <SectionHeader
            title="Notifications"
            description="Control how and when you receive updates"
          />
          <div className="space-y-4">
            <SettingRow
              label="Email Notifications"
              value="Receive notifications via email"
              action={
                <ToggleSwitch
                  enabled={notifications.emailNotifications}
                  onChange={(value) =>
                    setNotifications({ ...notifications, emailNotifications: value })
                  }
                />
              }
            />
            <SettingRow
              label="SMS Notifications"
              value="Receive notifications via SMS"
              action={
                <ToggleSwitch
                  enabled={notifications.smsNotifications}
                  onChange={(value) =>
                    setNotifications({ ...notifications, smsNotifications: value })
                  }
                />
              }
            />
            <SettingRow
              label="Order Updates"
              value="Get notified about order status changes"
              action={
                <ToggleSwitch
                  enabled={notifications.orderUpdates}
                  onChange={(value) =>
                    setNotifications({ ...notifications, orderUpdates: value })
                  }
                />
              }
            />
            <SettingRow
              label="Promotions & Offers"
              value="Receive promotional messages"
              action={
                <ToggleSwitch
                  enabled={notifications.promotions}
                  onChange={(value) => setNotifications({ ...notifications, promotions: value })}
                />
              }
            />
          </div>
        </div>

        {/* SECURITY SECTION */}
        <div className="mb-8 rounded-xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm">
          <SectionHeader
            title="Security"
            description="Keep your account secure"
          />
          <div className="space-y-4">
            <SettingRow
              label="Password"
              value="Send a password reset email"
              action={
                <button
                  onClick={handleChangePassword}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Reset
                </button>
              }
            />
            <SettingRow
              label="Two-Factor Authentication"
              value={twoFactorEnabled ? 'Enabled' : 'Not enabled'}
              action={
                <ToggleSwitch
                  enabled={twoFactorEnabled}
                  onChange={() => setTwoFactorEnabled(!twoFactorEnabled)}
                />
              }
            />
          </div>
        </div>

        {/* PREFERENCES SECTION */}
        <div className="mb-8 rounded-xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm">
          <SectionHeader
            title="Preferences"
            description="Customize your experience"
          />
          <div className="space-y-4">
            <div className="border-b border-gray-100 py-4 last:border-b-0">
              <label className="block text-sm font-medium text-gray-900 mb-2">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              >
                <option value="en">English</option>
                <option value="fr">Fran&ccedil;ais</option>
                <option value="yo">Yoruba</option>
                <option value="ha">Hausa</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              >
                <option value="NGN">Nigerian Naira (NGN)</option>
                <option value="USD">US Dollar (USD)</option>
                <option value="GBP">British Pound (GBP)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ROLE-SPECIFIC SECTIONS */}
        {role === 'pharmacy' && (
          <div className="mb-8 rounded-xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm">
            <SectionHeader
              title="Business Hours"
              description="Set your pharmacy operating hours"
            />
            <div className="space-y-4">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                <div key={day} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 py-4 last:border-b-0 gap-2">
                  <p className="text-sm font-medium text-gray-900">{day}</p>
                  <div className="flex gap-2 items-center">
                    <input
                      type="time"
                      defaultValue="09:00"
                      className="rounded-lg border border-gray-300 px-2 sm:px-3 py-2 text-sm flex-1 sm:flex-none"
                    />
                    <span className="text-gray-500 text-sm">to</span>
                    <input
                      type="time"
                      defaultValue="17:00"
                      className="rounded-lg border border-gray-300 px-2 sm:px-3 py-2 text-sm flex-1 sm:flex-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {role === 'delivery' && (
          <div className="mb-8 rounded-xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm">
            <SectionHeader
              title="Vehicle Information"
              description="Manage your delivery vehicle details"
            />
            <div className="space-y-4">
              <SettingRow
                label="Vehicle Type"
                value="Motorcycle"
                action={
                  <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    Edit
                  </button>
                }
              />
              <SettingRow label="License Plate" value="ABC-123-XY" />
              <SettingRow label="Insurance Valid Until" value="2026-12-31" />
            </div>
          </div>
        )}

        {role === 'admin' && (
          <div className="mb-8 rounded-xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm">
            <SectionHeader
              title="Admin Privileges"
              description="Administrator-only settings"
            />
            <div className="space-y-4">
              <SettingRow label="System Access Level" value="Full Administrator" />
              <SettingRow
                label="Audit Logs"
                action={
                  <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    View
                  </button>
                }
              />
            </div>
          </div>
        )}

        {/* DANGER ZONE SECTION */}
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 sm:p-6">
          <SectionHeader title="Danger Zone" />
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Deleting your account is permanent and cannot be undone. All your data will be removed.
            </p>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
              >
                Delete Account
              </button>
            ) : (
              <div className="rounded-lg border border-red-300 bg-white p-4">
                <p className="mb-4 text-sm font-medium text-gray-900">
                  Are you sure? This action cannot be undone.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleDeleteAccount}
                    className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
                  >
                    Yes, Delete My Account
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
