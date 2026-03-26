'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PageHeader from '@/components/ui/PageHeader';

interface PharmacySettings {
  pharmacyName: string;
  address: string;
  phone: string;
  email: string;
  description: string;
  operatingHoursStart: string;
  operatingHoursEnd: string;
  deliveryRadius: string;
  minOrderFreeDelivery: string;
  deliveryFee: string;
  notifyOrderReceived: boolean;
  notifyNewReview: boolean;
  notifyLowStock: boolean;
  notifyMessages: boolean;
}

interface DocumentStatus {
  name: string;
  status: 'Verified' | 'Pending' | 'Rejected';
  uploadedDate: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<PharmacySettings>({
    pharmacyName: 'HealthPlus Pharmacy',
    address: '123 Medicine Street, Lagos, Nigeria',
    phone: '+234 802 123 4567',
    email: 'contact@healthplus.com',
    description: 'Your trusted online pharmacy for OTC medications and health products',
    operatingHoursStart: '08:00',
    operatingHoursEnd: '22:00',
    deliveryRadius: '15',
    minOrderFreeDelivery: '10000',
    deliveryFee: '1500',
    notifyOrderReceived: true,
    notifyNewReview: true,
    notifyLowStock: true,
    notifyMessages: true,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const documents: DocumentStatus[] = [
    {
      name: 'Pharmacy License',
      status: 'Verified',
      uploadedDate: '2026-01-15',
    },
    {
      name: 'CAC Certificate',
      status: 'Pending',
      uploadedDate: '2026-02-20',
    },
    {
      name: 'Owner\'s Government ID',
      status: 'Verified',
      uploadedDate: '2026-01-10',
    },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setSettings(prev => ({
      ...prev,
      [name]: finalValue,
    }));
  };

  const handleSave = () => {
    console.log('Save settings:', settings);
    setSaveSuccess(true);
    setIsEditing(false);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const renderDocumentStatus = (status: string) => {
    const variants: Record<string, { bg: string; text: string; icon: string }> = {
      Verified: {
        bg: 'bg-green-100',
        text: 'text-green-700',
        icon: '✓',
      },
      Pending: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        icon: '⏳',
      },
      Rejected: {
        bg: 'bg-red-100',
        text: 'text-red-700',
        icon: '✕',
      },
    };

    const variant = variants[status];
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${variant.bg} ${variant.text}`}>
        {variant.icon} {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pharmacy Settings"
        description="Manage your pharmacy profile and preferences"
      />

      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Changes saved successfully!</p>
        </div>
      )}

      {/* Pharmacy Profile */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Pharmacy Profile</h2>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <div className="space-y-4">
              <Input
                label="Pharmacy Name"
                name="pharmacyName"
                type="text"
                value={settings.pharmacyName}
                onChange={handleInputChange}
              />

              <Input
                label="Address"
                name="address"
                type="text"
                value={settings.address}
                onChange={handleInputChange}
              />

              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  value={settings.phone}
                  onChange={handleInputChange}
                />

                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  value={settings.email}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={settings.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Operating Hours Start"
                  name="operatingHoursStart"
                  type="time"
                  value={settings.operatingHoursStart}
                  onChange={handleInputChange}
                />

                <Input
                  label="Operating Hours End"
                  name="operatingHoursEnd"
                  type="time"
                  value={settings.operatingHoursEnd}
                  onChange={handleInputChange}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleSave}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pharmacy Name</p>
                  <p className="font-semibold text-gray-900">{settings.pharmacyName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <p className="font-semibold text-gray-900">{settings.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Phone</p>
                  <p className="font-semibold text-gray-900">{settings.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Operating Hours</p>
                  <p className="font-semibold text-gray-900">
                    {settings.operatingHoursStart} - {settings.operatingHoursEnd}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Address</p>
                <p className="font-semibold text-gray-900">{settings.address}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Description</p>
                <p className="text-gray-900">{settings.description}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-bold text-gray-900">Documents & Verification</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {documents.map((doc, index) => (
              <div
                key={index}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">{doc.name}</p>
                  <p className="text-xs text-gray-600 mt-1">Uploaded: {doc.uploadedDate}</p>
                </div>
                <div className="flex-shrink-0">
                  {renderDocumentStatus(doc.status)}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> All documents must be verified before you can fully operate on the platform. Pending documents are under review.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Settings */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Delivery Settings</h2>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                Edit Settings
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <div className="space-y-4">
              <Input
                label="Delivery Radius (km)"
                name="deliveryRadius"
                type="number"
                value={settings.deliveryRadius}
                onChange={handleInputChange}
                min="1"
                max="100"
              />

              <Input
                label="Minimum Order for Free Delivery (₦)"
                name="minOrderFreeDelivery"
                type="number"
                value={settings.minOrderFreeDelivery}
                onChange={handleInputChange}
                min="0"
              />

              <Input
                label="Standard Delivery Fee (₦)"
                name="deliveryFee"
                type="number"
                value={settings.deliveryFee}
                onChange={handleInputChange}
                min="0"
              />

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleSave}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Delivery Radius</p>
                <p className="font-semibold text-gray-900">{settings.deliveryRadius} km</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Free Delivery Minimum</p>
                <p className="font-semibold text-gray-900">₦{parseInt(settings.minOrderFreeDelivery).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Standard Delivery Fee</p>
                <p className="font-semibold text-gray-900">₦{parseInt(settings.deliveryFee).toLocaleString()}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-bold text-gray-900">Notification Preferences</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer p-3 hover:bg-gray-50 rounded-lg transition-colors">
            <input
              type="checkbox"
              name="notifyOrderReceived"
              checked={settings.notifyOrderReceived}
              onChange={handleInputChange}
              className="w-4 h-4 rounded"
            />
            <div>
              <p className="font-medium text-gray-900">Order Notifications</p>
              <p className="text-sm text-gray-600">Get notified when customers place new orders</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer p-3 hover:bg-gray-50 rounded-lg transition-colors">
            <input
              type="checkbox"
              name="notifyNewReview"
              checked={settings.notifyNewReview}
              onChange={handleInputChange}
              className="w-4 h-4 rounded"
            />
            <div>
              <p className="font-medium text-gray-900">Review Notifications</p>
              <p className="text-sm text-gray-600">Get notified when customers leave reviews</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer p-3 hover:bg-gray-50 rounded-lg transition-colors">
            <input
              type="checkbox"
              name="notifyLowStock"
              checked={settings.notifyLowStock}
              onChange={handleInputChange}
              className="w-4 h-4 rounded"
            />
            <div>
              <p className="font-medium text-gray-900">Low Stock Alerts</p>
              <p className="text-sm text-gray-600">Get notified when product stock runs low</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer p-3 hover:bg-gray-50 rounded-lg transition-colors">
            <input
              type="checkbox"
              name="notifyMessages"
              checked={settings.notifyMessages}
              onChange={handleInputChange}
              className="w-4 h-4 rounded"
            />
            <div>
              <p className="font-medium text-gray-900">Message Notifications</p>
              <p className="text-sm text-gray-600">Get notified about new customer messages</p>
            </div>
          </label>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleSave}
            >
              Save Preferences
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
