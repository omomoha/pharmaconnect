'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  rating: number;
  totalDeliveries: number;
  completionRate: number;
}

interface Document {
  name: string;
  status: 'Verified' | 'Pending' | 'Expired';
  expiryDate?: string;
}

const INITIAL_PROFILE: ProfileData = {
  name: 'Chioma Adeyemi',
  email: 'chioma.adeyemi@email.com',
  phone: '+234 803 123 4567',
  avatar: 'CA',
  rating: 4.8,
  totalDeliveries: 127,
  completionRate: 98,
};

const DOCUMENTS: Document[] = [
  {
    name: 'CAC Certificate',
    status: 'Verified',
    expiryDate: '2027-05-15',
  },
  {
    name: 'Vehicle License',
    status: 'Verified',
    expiryDate: '2026-08-20',
  },
  {
    name: 'Insurance',
    status: 'Pending',
  },
  {
    name: 'Government ID',
    status: 'Verified',
    expiryDate: '2028-03-10',
  },
];

export default function DeliveryProfilePage() {
  const [profile, setProfile] = useState<ProfileData>(INITIAL_PROFILE);
  const [isOnline, setIsOnline] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [formData, setFormData] = useState(profile);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleEditChange = (field: keyof ProfileData, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!formData.email.includes('@')) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = () => {
    if (validateForm()) {
      setProfile(formData);
      setEditModal(false);
    }
  };

  const handleOpenEditModal = () => {
    setFormData(profile);
    setErrors({});
    setEditModal(true);
  };

  const getRatingStars = (rating: number) => {
    return Array(5)
      .fill(0)
      .map((_, i) => (i < Math.floor(rating) ? '⭐' : '☆'))
      .join('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        description="Manage your delivery profile and settings"
      />

      {/* Profile Card */}
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            {/* Avatar & Basic Info */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {profile.avatar}
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{profile.name}</h2>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getRatingStars(profile.rating)}</span>
                    <span className="font-semibold text-gray-900">{profile.rating}</span>
                    <span className="text-sm text-gray-500">(4.8 out of 5)</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    📦 {profile.totalDeliveries} deliveries
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Email</p>
                  <p className="text-gray-900 font-medium">{profile.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Phone</p>
                  <p className="text-gray-900 font-medium">{profile.phone}</p>
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenEditModal}
                className="mt-4"
              >
                ✏️ Edit Profile
              </Button>
            </div>

            {/* Availability Toggle */}
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={() => setIsOnline(!isOnline)}
                className={`relative w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold transition-all ${
                  isOnline
                    ? 'bg-green-100 text-green-600 shadow-lg'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {isOnline ? '🟢' : '⚪'}
              </button>
              <p className="text-sm font-semibold text-gray-900">
                {isOnline ? 'Online' : 'Offline'}
              </p>
              <p className="text-xs text-gray-500">Click to toggle</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
              Completion Rate
            </p>
            <p className="text-3xl font-bold text-green-600">{profile.completionRate}%</p>
            <p className="text-xs text-gray-600 mt-2">127 completed • 2 cancelled</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
              On-Time Rate
            </p>
            <p className="text-3xl font-bold text-primary-600">96%</p>
            <p className="text-xs text-gray-600 mt-2">124 on time • 3 late</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
              Avg. Rating
            </p>
            <p className="text-3xl font-bold text-orange-500">⭐ 4.8</p>
            <p className="text-xs text-gray-600 mt-2">Based on 127 reviews</p>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Information */}
      <Card>
        <CardHeader>
          <h3 className="font-bold text-gray-900">Vehicle Information</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
                Vehicle Type
              </p>
              <p className="text-gray-900 font-semibold">Honda CB500 Motorcycle</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
                License Plate
              </p>
              <p className="text-gray-900 font-semibold font-mono">BDG 123 XY</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
                Color
              </p>
              <p className="text-gray-900 font-semibold">Black & Red</p>
            </div>
          </div>

          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            Update Vehicle Details
          </Button>
        </CardContent>
      </Card>

      {/* Documents Section */}
      <Card>
        <CardHeader>
          <h3 className="font-bold text-gray-900">Documents & Certifications</h3>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-3">
            {DOCUMENTS.map((doc, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">{doc.name}</h4>
                  {doc.expiryDate && (
                    <p className="text-xs text-gray-600">
                      Expires: {new Date(doc.expiryDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={doc.status} size="sm" />
                  {doc.status === 'Verified' && (
                    <Button variant="ghost" size="sm">
                      📄 View
                    </Button>
                  )}
                  {doc.status === 'Pending' && (
                    <Button variant="outline" size="sm">
                      ⏳ Upload
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-sm font-semibold text-blue-900 mb-2">📝 Document Requirements</p>
            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
              <li>All documents must be valid and not expired</li>
              <li>Clear photos required for verification</li>
              <li>Re-verification may be requested periodically</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={editModal}
        onClose={() => setEditModal(false)}
        title="Edit Profile"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Full Name"
            value={formData.name}
            onChange={(e) => handleEditChange('name', e.target.value)}
            error={errors.name}
            placeholder="Your full name"
          />

          <Input
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => handleEditChange('email', e.target.value)}
            error={errors.email}
            placeholder="your.email@example.com"
          />

          <Input
            label="Phone Number"
            value={formData.phone}
            onChange={(e) => handleEditChange('phone', e.target.value)}
            error={errors.phone}
            placeholder="+234 803 123 4567"
          />

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              To change your password or vehicle details, please contact our support team at{' '}
              <a href="mailto:support@pharmaconnect.com" className="font-semibold text-primary-600">
                support@pharmaconnect.com
              </a>
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="primary" className="flex-1" onClick={handleSaveProfile}>
              Save Changes
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setEditModal(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
