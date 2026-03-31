'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import DocumentUpload from '@/components/ui/DocumentUpload';
import { registerPharmacy, type RegisterPharmacyData } from '@/lib/services/pharmacy.service';

interface OperatingDay {
  open: string;
  close: string;
  closed: boolean;
}

const defaultHours: OperatingDay = { open: '08:00', close: '20:00', closed: false };
const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function PharmacyOnboardingPage() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Step 1: Business Info
  const [pharmacyName, setPharmacyName] = useState('');
  const [pharmacyEmail, setPharmacyEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [ownerName, setOwnerName] = useState('');

  // Step 2: Documents
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseDocUrl, setLicenseDocUrl] = useState('');
  const [cacNumber, setCacNumber] = useState('');
  const [cacDocUrl, setCacDocUrl] = useState('');
  const [ownerIdDocUrl, setOwnerIdDocUrl] = useState('');

  // Step 3: Operating Hours
  const [operatingHours, setOperatingHours] = useState<Record<string, OperatingDay>>(
    Object.fromEntries(days.map((d) => [d, { ...defaultHours }]))
  );

  // Check if pharmacy already registered
  useEffect(() => {
    async function checkExistingPharmacy() {
      if (!user) {
        setCheckingStatus(false);
        return;
      }
      try {
        // Check if there's a pharmacy doc for this user
        const profileDoc = await getDoc(doc(db, 'profiles', user.uid));
        if (profileDoc.exists()) {
          const data = profileDoc.data();
          if (data.pharmacyId) {
            // Already registered — go to pharmacy dashboard
            router.replace('/dashboard/pharmacy');
            return;
          }
        }
      } catch {
        // Continue with onboarding
      }
      setCheckingStatus(false);
    }
    checkExistingPharmacy();
  }, [user, router]);

  const updateHours = (day: string, field: keyof OperatingDay, value: string | boolean) => {
    setOperatingHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const validateStep1 = () => {
    if (!pharmacyName || !pharmacyEmail || !phoneNumber || !address || !ownerName) {
      setError('All business information fields are required');
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep2 = () => {
    if (!licenseNumber || !licenseDocUrl) {
      setError('Pharmacy License number and document are required');
      return false;
    }
    if (!cacNumber || !cacDocUrl) {
      setError('CAC Registration number and certificate are required');
      return false;
    }
    if (!ownerIdDocUrl) {
      setError("Owner's Government ID document is required");
      return false;
    }
    setError(null);
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleSubmit = async () => {
    if (!user) {
      setError('You must be logged in to register a pharmacy');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data: RegisterPharmacyData = {
        name: pharmacyName,
        email: pharmacyEmail,
        phoneNumber,
        address,
        latitude: 6.5244, // Default Lagos coords — can be updated later
        longitude: 3.3792,
        licenseNumber,
        licenseDocUrl,
        cacNumber,
        cacDocUrl,
        ownerName,
        ownerIdDocUrl,
        operatingHours,
      };

      const response = await registerPharmacy(data);

      if (response.success) {
        setStep(4); // Success step
      } else {
        setError(response.error?.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Checking registration status...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Pharmacy Registration</h1>
          <p className="text-gray-600 mt-2">
            Complete the following steps to register your pharmacy on PharmaConnect
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8 gap-2">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= s
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                } ${step === 4 ? 'bg-green-600 text-white' : ''}`}
              >
                {step > s || step === 4 ? '✓' : s}
              </div>
              {s < 3 && (
                <div
                  className={`w-16 h-1 rounded ${
                    step > s ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Labels */}
        <div className="flex justify-between mb-8 text-xs text-gray-500 max-w-md mx-auto">
          <span className={step >= 1 ? 'text-primary-600 font-medium' : ''}>Business Info</span>
          <span className={step >= 2 ? 'text-primary-600 font-medium' : ''}>Documents</span>
          <span className={step >= 3 ? 'text-primary-600 font-medium' : ''}>Hours</span>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Step 1: Business Information */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
            <h2 className="text-xl font-semibold text-gray-900">Business Information</h2>
            <p className="text-sm text-gray-600">
              Provide your pharmacy&apos;s basic details.
            </p>

            <Input
              label="Pharmacy Name"
              placeholder="e.g. HealthPlus Pharmacy"
              value={pharmacyName}
              onChange={(e) => setPharmacyName(e.target.value)}
              required
            />
            <Input
              label="Owner / Pharmacist Name"
              placeholder="Full name of pharmacy owner"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              required
            />
            <Input
              label="Business Email"
              type="email"
              placeholder="pharmacy@example.com"
              value={pharmacyEmail}
              onChange={(e) => setPharmacyEmail(e.target.value)}
              required
            />
            <Input
              label="Phone Number"
              type="tel"
              placeholder="+234 800 000 0000"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
            <Input
              label="Business Address"
              placeholder="Full address of your pharmacy"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />

            <div className="flex justify-end pt-4">
              <Button variant="primary" onClick={handleNext}>
                Next: Upload Documents
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Document Upload */}
        {step === 2 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Required Documents</h2>
            <p className="text-sm text-gray-600">
              Upload the following mandatory documents. Your pharmacy will be reviewed and approved by our admin team before it becomes visible to customers.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
              <strong>Important:</strong> All three documents are required for approval. Your pharmacy will remain in &quot;Pending Review&quot; status until our team verifies these documents.
            </div>

            {/* Pharmacy License */}
            <div className="space-y-2">
              <Input
                label="Pharmacy License Number"
                placeholder="e.g. PCN/2024/XXXX"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                required
              />
              <DocumentUpload
                label="Pharmacy License Document"
                description="Upload a scanned copy of your valid Pharmacy Council of Nigeria (PCN) license"
                storagePath={`pharmacy-docs/${user?.uid}/license`}
                onUploadComplete={(url) => setLicenseDocUrl(url)}
                required
              />
            </div>

            {/* CAC Certificate */}
            <div className="space-y-2">
              <Input
                label="CAC Registration Number"
                placeholder="e.g. RC-XXXXXXX"
                value={cacNumber}
                onChange={(e) => setCacNumber(e.target.value)}
                required
              />
              <DocumentUpload
                label="CAC Certificate"
                description="Upload your Corporate Affairs Commission (CAC) certificate of incorporation"
                storagePath={`pharmacy-docs/${user?.uid}/cac`}
                onUploadComplete={(url) => setCacDocUrl(url)}
                required
              />
            </div>

            {/* Owner's Government ID */}
            <DocumentUpload
              label="Owner's Government-Issued ID"
              description="Upload a valid government ID (NIN, International Passport, or Driver's License)"
              storagePath={`pharmacy-docs/${user?.uid}/owner-id`}
              onUploadComplete={(url) => setOwnerIdDocUrl(url)}
              required
            />

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button variant="primary" onClick={handleNext}>
                Next: Operating Hours
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Operating Hours */}
        {step === 3 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
            <h2 className="text-xl font-semibold text-gray-900">Operating Hours</h2>
            <p className="text-sm text-gray-600">
              Set your pharmacy&apos;s operating hours for each day of the week.
            </p>

            <div className="space-y-3">
              {days.map((day) => (
                <div
                  key={day}
                  className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0"
                >
                  <div className="w-28">
                    <span className="text-sm font-medium text-gray-700 capitalize">{day}</span>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!operatingHours[day].closed}
                      onChange={(e) => updateHours(day, 'closed', !e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-xs text-gray-500">Open</span>
                  </label>

                  {!operatingHours[day].closed && (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="time"
                        value={operatingHours[day].open}
                        onChange={(e) => updateHours(day, 'open', e.target.value)}
                        className="border border-gray-200 rounded px-2 py-1 text-sm"
                      />
                      <span className="text-gray-400 text-sm">to</span>
                      <input
                        type="time"
                        value={operatingHours[day].close}
                        onChange={(e) => updateHours(day, 'close', e.target.value)}
                        className="border border-gray-200 rounded px-2 py-1 text-sm"
                      />
                    </div>
                  )}

                  {operatingHours[day].closed && (
                    <span className="text-sm text-gray-400 italic">Closed</span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button variant="primary" onClick={handleSubmit} isLoading={isLoading}>
                Submit for Review
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Success / Pending Review */}
        {step === 4 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center space-y-4">
            <div className="text-5xl">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900">Registration Submitted!</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Your pharmacy registration has been submitted for review. Our admin team will verify your documents and approve your pharmacy within 1-3 business days.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 max-w-md mx-auto">
              <strong>What happens next?</strong>
              <ul className="mt-2 space-y-1 text-left list-disc list-inside">
                <li>Our team reviews your submitted documents</li>
                <li>You&apos;ll receive a notification once approved</li>
                <li>After approval, your pharmacy becomes visible to customers</li>
                <li>You can then start adding products and receiving orders</li>
              </ul>
            </div>

            <Button
              variant="primary"
              onClick={() => router.push('/dashboard/pharmacy')}
              className="mt-4"
            >
              Go to Pharmacy Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
