'use client';
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface SettingsPageProps {
  role: 'customer' | 'pharmacy' | 'delivery' | 'admin';
}

export default function SettingsPage({ role }: SettingsPageProps) {
  const { user } = useAuth();
  const [editingProfile, setEditingProfile] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    phone: user?.phoneNumber || '',
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    orderUpdates: true,
    promotions: false,
  });

  // Security & Preferences
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [language, setLanguage] = useState('en');
  const [currency, setCurrency] = useState('NGN');

  // Toggle switch component
  const ToggleSwitch = ({ enabled, onChange }: { enabled: boolean; onChange: (value: boolean) => void }) => (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
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

  // Section header component
  const SectionHeader = ({ title, description }: { title: string; description?: string }) => (
    <div className="mb-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">{title}</h2>
      {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
    </div>
  );

  // Setting row component
  const SettingRow = ({
    label,
    value,
    action,
  }: {
    label: string;
    value?: string | React.ReactNode;
    action?: React.ReactNode;
  }) => (
    <div className="flex items-center justify-between border-b border-gray-100 py-4 last:border-b-0">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {value && typeof value === 'string' && <p className="mt-1 text-xs text-gray-500">{value}</p>}
      </div>
      {action}
    </div>
  );

  const handleProfileSave = () => {
    // TODO: Implement profile update logic
    setEditingProfile(false);
  };

  const handleChangePassword = () => {
    // TODO: Implement password change flow
    alert('Password change flow - not yet implemented');
  };

  const handleDeleteAccount = () => {
    // TODO: Implement account deletion logic
    alert('Account deletion - not yet implemented');
  };

  const handleEnable2FA = () => {
    // TODO: Implement 2FA setup
    setTwoFactorEnabled(!twoFactorEnabled);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-sm text-gray-600">Manage your account and preferences</p>
        </div>

        {/* PROFILE SECTION */}
        <div className="mb-8 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <SectionHeader title="Profile" />
          <div className="space-y-4">
            {!editingProfile ? (
              <>
                <SettingRow label="Full Name" value={profileData.name} />
                <SettingRow label="Email Address" value={profileData.email} />
                <SettingRow label="Phone Number" value={profileData.phone} />
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
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                  />
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
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleProfileSave}
                    className="rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 transition-colors"
                  >
                    Save Changes
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
        <div className="mb-8 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
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
        <div className="mb-8 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <SectionHeader
            title="Security"
            description="Keep your account secure"
          />
          <div className="space-y-4">
            <SettingRow
              label="Password"
              value="Last changed 6 months ago"
              action={
                <button
                  onClick={handleChangePassword}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Change
                </button>
              }
            />
            <SettingRow
              label="Two-Factor Authentication"
              value={twoFactorEnabled ? 'Enabled' : 'Not enabled'}
              action={
                <ToggleSwitch
                  enabled={twoFactorEnabled}
                  onChange={handleEnable2FA}
                />
              }
            />
          </div>
        </div>

        {/* PREFERENCES SECTION */}
        <div className="mb-8 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
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
                <option value="fr">Français</option>
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
          <div className="mb-8 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <SectionHeader
              title="Business Hours"
              description="Set your pharmacy operating hours"
            />
            <div className="space-y-4">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                <div key={day} className="flex items-center justify-between border-b border-gray-100 py-4 last:border-b-0">
                  <p className="text-sm font-medium text-gray-900">{day}</p>
                  <div className="flex gap-2">
                    <input
                      type="time"
                      defaultValue="09:00"
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="time"
                      defaultValue="17:00"
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {role === 'delivery' && (
          <div className="mb-8 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
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
              <SettingRow
                label="License Plate"
                value="ABC-123-XY"
              />
              <SettingRow
                label="Insurance Valid Until"
                value="2026-12-31"
              />
            </div>
          </div>
        )}

        {role === 'admin' && (
          <div className="mb-8 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <SectionHeader
              title="Admin Privileges"
              description="Administrator-only settings"
            />
            <div className="space-y-4">
              <SettingRow
                label="System Access Level"
                value="Full Administrator"
              />
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
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
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
                <div className="flex gap-3">
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
