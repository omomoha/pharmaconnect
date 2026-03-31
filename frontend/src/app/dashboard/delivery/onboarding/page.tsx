'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import DocumentUpload from '@/components/ui/DocumentUpload';
import { registerProvider, type RegisterDeliveryProviderData } from '@/lib/services/delivery.service';

export default function DeliveryOnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Step 1: Business Info
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [ownerName, setOwnerName] = useState('');

  // Step 2: Documents
  const [cacNumber, setCacNumber] = useState('');
  const [cacDocUrl, setCacDocUrl] = useState('');
  const [ownerIdDocUrl, setOwnerIdDocUrl] = useState('');
  const [vehicleDocUrl, setVehicleDocUrl] = useState('');

  // Step 3: Pricing
  const [baseFee, setBaseFee] = useState('');
  const [perKmFee, setPerKmFee] = useState('');

  // Check if delivery provider already registered
  useEffect(() => {
    async function checkExistingProvider() {
      if (!user) {
        setCheckingStatus(false);
        return;
      }
      try {
        const profileDoc = await getDoc(doc(db, 'profiles', user.uid));
        if (profileDoc.exists()) {
          const data = profileDoc.data();
          if (data.deliveryProviderId) {
            router.replace('/dashboard/delivery');
            return;
          }
        }
      } catch {
        // Continue with onboarding
      }
      setCheckingStatus(false);
    }
    checkExistingProvider();
  }, [user, router]);

  const validateStep1 = () => {
    if (!businessName || !email || !phoneNumber || !address || !ownerName) {
      setError('All business information fields are required');
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep2 = () => {
    if (!cacNumber || !cacDocUrl) {
      setError('CAC Registration number and certificate are required');
      return false;
    }
    if (!ownerIdDocUrl) {
      setError("Owner's Government ID document is required");
      return false;
    }
    if (!vehicleDocUrl) {
      setError('Vehicle registration/insurance document is required');
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep3 = () => {
    if (!baseFee || !perKmFee) {
      setError('Both base fee and per-km fee are required');
      return false;
    }
    if (parseFloat(baseFee) < 0 || parseFloat(perKmFee) < 0) {
      setError('Fees cannot be negative');
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
      setError('You must be logged in to register');
      return;
    }

    if (!validateStep3()) return;

    setIsLoading(true);
    setError(null);

    try {
      const data: RegisterDeliveryProviderData = {
        businessName,
        email,
        phoneNumber,
        address,
        cacNumber,
        cacDocUrl,
        ownerName,
        ownerIdDocUrl,
        vehicleDocUrl,
        baseFee: parseFloat(baseFee),
        perKmFee: parseFloat(perKmFee),
      };

      const response = await registerProvider(data);

      if (response.success) {
        setStep(4); // Success
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
          <h1 className="text-3xl font-bold text-gray-900">Delivery Provider Registration</h1>
          <p className="text-gray-600 mt-2">
            Register your delivery business to start fulfilling orders on PharmaConnect
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
          <span className={step >= 3 ? 'text-primary-600 font-medium' : ''}>Pricing</span>
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
              Provide your delivery company&apos;s basic details.
            </p>

            <Input
              label="Business Name"
              placeholder="e.g. Swift Delivery Services"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
            />
            <Input
              label="Owner / Manager Name"
              placeholder="Full name of business owner"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              required
            />
            <Input
              label="Business Email"
              type="email"
              placeholder="delivery@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              placeholder="Full address of your business"
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
              Upload the following mandatory documents. Your business will be reviewed and approved by our admin team before you can start accepting deliveries.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
              <strong>Important:</strong> All three documents are required for approval. Your business will remain in &quot;Pending Review&quot; status until our team verifies these documents.
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
                storagePath={`delivery-docs/${user?.uid}/cac`}
                onUploadComplete={(url) => setCacDocUrl(url)}
                required
              />
            </div>

            {/* Owner's Government ID */}
            <DocumentUpload
              label="Owner's Government-Issued ID"
              description="Upload a valid government ID (NIN, International Passport, or Driver's License)"
              storagePath={`delivery-docs/${user?.uid}/owner-id`}
              onUploadComplete={(url) => setOwnerIdDocUrl(url)}
              required
            />

            {/* Vehicle Documents */}
            <DocumentUpload
              label="Vehicle Registration / Insurance"
              description="Upload vehicle registration papers or valid insurance certificate for your delivery fleet"
              storagePath={`delivery-docs/${user?.uid}/vehicle`}
              onUploadComplete={(url) => setVehicleDocUrl(url)}
              required
            />

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button variant="primary" onClick={handleNext}>
                Next: Set Pricing
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Pricing */}
        {step === 3 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
            <h2 className="text-xl font-semibold text-gray-900">Delivery Pricing</h2>
            <p className="text-sm text-gray-600">
              Set your base delivery fee and per-kilometer rate. Customers will see the total estimated fee at checkout.
            </p>

            <Input
              label="Base Delivery Fee (NGN)"
              type="number"
              placeholder="e.g. 500"
              value={baseFee}
              onChange={(e) => setBaseFee(e.target.value)}
              helper="Flat fee charged for every delivery"
              required
            />

            <Input
              label="Per-Kilometer Fee (NGN)"
              type="number"
              placeholder="e.g. 100"
              value={perKmFee}
              onChange={(e) => setPerKmFee(e.target.value)}
              helper="Additional charge per kilometer of delivery distance"
              required
            />

            {baseFee && perKmFee && (
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
                <strong>Example:</strong> A 5km delivery would cost the customer{' '}
                <span className="font-semibold text-primary-700">
                  NGN {(parseFloat(baseFee) + parseFloat(perKmFee) * 5).toLocaleString()}
                </span>{' '}
                (NGN {baseFee} base + NGN {(parseFloat(perKmFee) * 5).toLocaleString()} for 5km)
              </div>
            )}

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
              Your delivery provider registration has been submitted for review. Our admin team will verify your documents and approve your business within 1-3 business days.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 max-w-md mx-auto">
              <strong>What happens next?</strong>
              <ul className="mt-2 space-y-1 text-left list-disc list-inside">
                <li>Our team reviews your submitted documents</li>
                <li>You&apos;ll receive a notification once approved</li>
                <li>After approval, you can start accepting delivery orders</li>
                <li>Customers will see your service when selecting delivery options</li>
              </ul>
            </div>

            <Button
              variant="primary"
              onClick={() => router.push('/dashboard/delivery')}
              className="mt-4"
            >
              Go to Delivery Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
