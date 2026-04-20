'use client';

import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import DocumentUpload from '@/components/ui/DocumentUpload';
import { registerPharmacy } from '@/lib/services/pharmacy.service';
import { registerProvider } from '@/lib/services/delivery.service';
import toast from 'react-hot-toast';

interface VerificationPageProps {
  role: 'pharmacy' | 'delivery_provider';
}

interface RegistrationData {
  // Common
  businessName: string;
  ownerName: string;
  ownerIdDocUrl: string;
  // Pharmacy-specific
  licenseNumber?: string;
  licenseDocUrl?: string;
  cacNumber?: string;
  cacDocUrl?: string;
  // Delivery-specific
  vehicleDocUrl?: string;
}

interface VerificationStatus {
  status: 'pending' | 'approved' | 'rejected' | 'not_registered';
  submittedAt?: Date;
  approvedAt?: Date;
  rejectionReason?: string;
}

export default function VerificationPage({ role }: VerificationPageProps) {
  const { user, profile } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({
    status: 'not_registered',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<RegistrationData>({
    businessName: '',
    ownerName: '',
    ownerIdDocUrl: '',
    licenseNumber: '',
    licenseDocUrl: '',
    cacNumber: '',
    cacDocUrl: '',
    vehicleDocUrl: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch verification status on mount
  useEffect(() => {
    const fetchVerificationStatus = async () => {
      if (!user?.uid) return;

      try {
        const collectionName = role === 'pharmacy' ? 'pharmacies' : 'delivery_providers';
        const docRef = doc(db, collectionName, user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setVerificationStatus({
            status: (data.approvalStatus || 'pending') as any,
            submittedAt: data.createdAt?.toDate(),
            approvedAt: data.approvedAt?.toDate(),
            rejectionReason: data.rejectionReason,
          });
        } else {
          setVerificationStatus({ status: 'not_registered' });
        }
      } catch (error) {
        console.error('Error fetching verification status:', error);
        toast.error('Failed to fetch verification status');
      } finally {
        setLoading(false);
      }
    };

    fetchVerificationStatus();
  }, [user?.uid, role]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }
    if (!formData.ownerName.trim()) {
      newErrors.ownerName = 'Owner name is required';
    }
    if (!formData.ownerIdDocUrl) {
      newErrors.ownerIdDocUrl = 'Owner ID document is required';
    }

    if (role === 'pharmacy') {
      if (!formData.licenseNumber?.trim()) {
        newErrors.licenseNumber = 'Pharmacy license number is required';
      }
      if (!formData.licenseDocUrl) {
        newErrors.licenseDocUrl = 'Pharmacy license document is required';
      }
      if (!formData.cacNumber?.trim()) {
        newErrors.cacNumber = 'CAC number is required';
      }
      if (!formData.cacDocUrl) {
        newErrors.cacDocUrl = 'CAC certificate is required';
      }
    } else if (role === 'delivery_provider') {
      if (!formData.cacNumber?.trim()) {
        newErrors.cacNumber = 'CAC number is required';
      }
      if (!formData.cacDocUrl) {
        newErrors.cacDocUrl = 'CAC certificate is required';
      }
      if (!formData.vehicleDocUrl) {
        newErrors.vehicleDocUrl = 'Vehicle registration document is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit registration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      if (role === 'pharmacy') {
        const response = await registerPharmacy({
          name: formData.businessName,
          email: user?.email || '',
          phoneNumber: profile?.phone || '',
          address: '', // Note: Could be added to form if needed
          latitude: 0, // Note: Could use geolocation if needed
          longitude: 0,
          licenseNumber: formData.licenseNumber || '',
          licenseDocUrl: formData.licenseDocUrl || '',
          cacNumber: formData.cacNumber || '',
          cacDocUrl: formData.cacDocUrl || '',
          ownerName: formData.ownerName,
          ownerIdDocUrl: formData.ownerIdDocUrl,
          operatingHours: {}, // Could be added to form if needed
        });

        if (!response.success) {
          toast.error(response.error?.message || 'Failed to submit registration');
          return;
        }

        toast.success('Pharmacy registration submitted for review!');
      } else {
        const response = await registerProvider({
          businessName: formData.businessName,
          email: user?.email || '',
          phoneNumber: profile?.phone || '',
          address: '',
          cacNumber: formData.cacNumber || '',
          cacDocUrl: formData.cacDocUrl || '',
          ownerName: formData.ownerName,
          ownerIdDocUrl: formData.ownerIdDocUrl,
          vehicleDocUrl: formData.vehicleDocUrl || '',
          baseFee: 0,
          perKmFee: 0,
        });

        if (!response.success) {
          toast.error(response.error?.message || 'Failed to submit registration');
          return;
        }

        toast.success('Delivery provider registration submitted for review!');
      }

      // Refresh verification status
      setVerificationStatus({
        status: 'pending',
        submittedAt: new Date(),
      });
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('An error occurred while submitting your registration');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-primary-600 mb-4" />
          <p className="text-gray-600">Loading verification status...</p>
        </div>
      </div>
    );
  }

  // Not Registered State - Show Form
  if (verificationStatus.status === 'not_registered') {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {role === 'pharmacy' ? 'Complete Your Pharmacy Registration' : 'Complete Your Delivery Provider Registration'}
          </h1>
          <p className="text-gray-600">
            {role === 'pharmacy'
              ? 'Submit your pharmacy documents to get verified and start accepting orders.'
              : 'Submit your documents to get verified and start accepting deliveries.'}
          </p>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">
              {role === 'pharmacy' ? 'Pharmacy Information' : 'Business Information'}
            </h2>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* Business Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {role === 'pharmacy' ? 'Pharmacy Name' : 'Business Name'}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) =>
                    setFormData({ ...formData, businessName: e.target.value })
                  }
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition ${
                    errors.businessName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={role === 'pharmacy' ? 'Enter pharmacy name' : 'Enter business name'}
                />
                {errors.businessName && (
                  <p className="text-red-500 text-sm mt-1">{errors.businessName}</p>
                )}
              </div>

              {/* Owner Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner Name
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={formData.ownerName}
                  onChange={(e) =>
                    setFormData({ ...formData, ownerName: e.target.value })
                  }
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition ${
                    errors.ownerName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Full name of business owner"
                />
                {errors.ownerName && (
                  <p className="text-red-500 text-sm mt-1">{errors.ownerName}</p>
                )}
              </div>

              {/* Pharmacy-specific fields */}
              {role === 'pharmacy' && (
                <>
                  {/* License Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pharmacy License Number
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.licenseNumber || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, licenseNumber: e.target.value })
                      }
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition ${
                        errors.licenseNumber ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter license number"
                    />
                    {errors.licenseNumber && (
                      <p className="text-red-500 text-sm mt-1">{errors.licenseNumber}</p>
                    )}
                  </div>

                  {/* License Document */}
                  <DocumentUpload
                    label="Pharmacy License"
                    description="Upload a clear copy of your pharmacy license (PDF, JPG, or PNG)"
                    storagePath={`pharmacies/${user?.uid}/license`}
                    onUploadComplete={(url) =>
                      setFormData({ ...formData, licenseDocUrl: url })
                    }
                    required
                  />
                  {errors.licenseDocUrl && (
                    <p className="text-red-500 text-sm">{errors.licenseDocUrl}</p>
                  )}

                  {/* CAC Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CAC Number
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.cacNumber || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, cacNumber: e.target.value })
                      }
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition ${
                        errors.cacNumber ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter CAC number"
                    />
                    {errors.cacNumber && (
                      <p className="text-red-500 text-sm mt-1">{errors.cacNumber}</p>
                    )}
                  </div>

                  {/* CAC Document */}
                  <DocumentUpload
                    label="CAC Certificate"
                    description="Upload your Corporate Affairs Commission (CAC) certificate"
                    storagePath={`pharmacies/${user?.uid}/cac`}
                    onUploadComplete={(url) =>
                      setFormData({ ...formData, cacDocUrl: url })
                    }
                    required
                  />
                  {errors.cacDocUrl && (
                    <p className="text-red-500 text-sm">{errors.cacDocUrl}</p>
                  )}
                </>
              )}

              {/* Delivery Provider-specific fields */}
              {role === 'delivery_provider' && (
                <>
                  {/* CAC Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CAC Number
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.cacNumber || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, cacNumber: e.target.value })
                      }
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition ${
                        errors.cacNumber ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter CAC number"
                    />
                    {errors.cacNumber && (
                      <p className="text-red-500 text-sm mt-1">{errors.cacNumber}</p>
                    )}
                  </div>

                  {/* CAC Document */}
                  <DocumentUpload
                    label="CAC Certificate"
                    description="Upload your Corporate Affairs Commission (CAC) certificate"
                    storagePath={`delivery_providers/${user?.uid}/cac`}
                    onUploadComplete={(url) =>
                      setFormData({ ...formData, cacDocUrl: url })
                    }
                    required
                  />
                  {errors.cacDocUrl && (
                    <p className="text-red-500 text-sm">{errors.cacDocUrl}</p>
                  )}

                  {/* Vehicle Document */}
                  <DocumentUpload
                    label="Vehicle Registration"
                    description="Upload your vehicle registration document"
                    storagePath={`delivery_providers/${user?.uid}/vehicle`}
                    onUploadComplete={(url) =>
                      setFormData({ ...formData, vehicleDocUrl: url })
                    }
                    required
                  />
                  {errors.vehicleDocUrl && (
                    <p className="text-red-500 text-sm">{errors.vehicleDocUrl}</p>
                  )}
                </>
              )}

              {/* Owner ID Document */}
              <DocumentUpload
                label="Owner's Government ID"
                description="Upload a clear copy of the owner's government-issued ID (driver's license, national ID, passport, etc.)"
                storagePath={`${role === 'pharmacy' ? 'pharmacies' : 'delivery_providers'}/${user?.uid}/owner-id`}
                onUploadComplete={(url) =>
                  setFormData({ ...formData, ownerIdDocUrl: url })
                }
                required
              />
              {errors.ownerIdDocUrl && (
                <p className="text-red-500 text-sm">{errors.ownerIdDocUrl}</p>
              )}
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={submitting}
                disabled={submitting}
                className="w-full"
              >
                {submitting ? 'Submitting...' : 'Submit for Verification'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  // Pending State
  if (verificationStatus.status === 'pending') {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-8 px-6">
            <div className="text-center">
              {/* Clock Icon */}
              <div className="flex justify-center mb-6">
                <svg
                  className="w-16 h-16 text-amber-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-amber-900 mb-2">
                Your Registration is Under Review
              </h2>
              <p className="text-amber-800 mb-6">
                We're verifying your documents. This typically takes 1-3 business days.
              </p>

              {verificationStatus.submittedAt && (
                <div className="inline-block bg-white rounded-lg px-4 py-3 mb-6 border border-amber-200">
                  <p className="text-sm text-gray-600">
                    Submitted on{' '}
                    <span className="font-medium text-gray-900">
                      {new Date(verificationStatus.submittedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </p>
                </div>
              )}

              <div className="space-y-3 text-left bg-white rounded-lg p-4 border border-amber-200 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">What happens next:</h3>
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-amber-600 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-700">Our team will verify all submitted documents</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-amber-600 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-700">We'll notify you via email once your registration is approved</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-amber-600 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-700">
                    {role === 'pharmacy'
                      ? 'Once approved, you can start adding products and accepting orders'
                      : 'Once approved, you can start accepting delivery assignments'}
                  </p>
                </div>
              </div>

              <p className="text-sm text-amber-800">
                Have questions? Contact our support team for assistance.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Approved State
  if (verificationStatus.status === 'approved') {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="py-8 px-6">
            <div className="text-center">
              {/* Checkmark Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-green-900 mb-2">
                You're All Set!
              </h2>
              <p className="text-green-800 mb-6">
                Your account has been verified and approved.
              </p>

              {verificationStatus.approvedAt && (
                <div className="inline-block bg-white rounded-lg px-4 py-3 mb-6 border border-green-200">
                  <p className="text-sm text-gray-600">
                    Approved on{' '}
                    <span className="font-medium text-gray-900">
                      {new Date(verificationStatus.approvedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </p>
                </div>
              )}

              <div className="space-y-3 text-left bg-white rounded-lg p-4 border border-green-200 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">You can now:</h3>
                {role === 'pharmacy' ? (
                  <>
                    <div className="flex gap-3">
                      <svg
                        className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                      </svg>
                      <p className="text-sm text-gray-700">Add and manage your pharmacy products</p>
                    </div>
                    <div className="flex gap-3">
                      <svg
                        className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                      </svg>
                      <p className="text-sm text-gray-700">Accept customer orders and manage inventory</p>
                    </div>
                    <div className="flex gap-3">
                      <svg
                        className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                      </svg>
                      <p className="text-sm text-gray-700">View your earnings and analytics</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex gap-3">
                      <svg
                        className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                      </svg>
                      <p className="text-sm text-gray-700">Accept delivery assignments</p>
                    </div>
                    <div className="flex gap-3">
                      <svg
                        className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                      </svg>
                      <p className="text-sm text-gray-700">Track deliveries and earn commission</p>
                    </div>
                    <div className="flex gap-3">
                      <svg
                        className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                      </svg>
                      <p className="text-sm text-gray-700">View your earnings and ratings</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Rejected State
  if (verificationStatus.status === 'rejected') {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-8 px-6">
            <div className="text-center mb-6">
              {/* Alert Triangle Icon */}
              <div className="flex justify-center mb-6">
                <svg
                  className="w-16 h-16 text-red-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-red-900 mb-2">
                Verification Rejected
              </h2>
              <p className="text-red-800 mb-6">
                We were unable to verify your account with the provided documents.
              </p>

              {verificationStatus.rejectionReason && (
                <div className="bg-white rounded-lg px-4 py-3 mb-6 border border-red-200 text-left">
                  <h3 className="font-semibold text-gray-900 mb-2">Rejection Reason:</h3>
                  <p className="text-gray-700 text-sm">{verificationStatus.rejectionReason}</p>
                </div>
              )}

              <div className="space-y-3 text-left bg-white rounded-lg p-4 border border-red-200 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">What you can do:</h3>
                <div className="flex gap-3">
                  <svg
                    className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M5 13h14v-2H5v2z" />
                  </svg>
                  <p className="text-sm text-gray-700">Review the rejection reason above</p>
                </div>
                <div className="flex gap-3">
                  <svg
                    className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M5 13h14v-2H5v2z" />
                  </svg>
                  <p className="text-sm text-gray-700">Obtain the correct or missing documents</p>
                </div>
                <div className="flex gap-3">
                  <svg
                    className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M5 13h14v-2H5v2z" />
                  </svg>
                  <p className="text-sm text-gray-700">Click the button below to resubmit your documents</p>
                </div>
              </div>

              <Button
                variant="danger"
                size="lg"
                onClick={() => {
                  setVerificationStatus({ status: 'not_registered' });
                  setFormData({
                    businessName: '',
                    ownerName: '',
                    ownerIdDocUrl: '',
                    licenseNumber: '',
                    licenseDocUrl: '',
                    cacNumber: '',
                    cacDocUrl: '',
                    vehicleDocUrl: '',
                  });
                }}
                className="w-full"
              >
                Resubmit Documents
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
