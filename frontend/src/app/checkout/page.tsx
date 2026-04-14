'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface CartItem {
  pharmacyId: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

interface DeliveryAddress {
  street: string;
  city: string;
  state: string;
  notes: string;
}

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT',
  'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi',
  'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo',
  'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export default function GuestCheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Guest info
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestName, setGuestName] = useState('');

  // Step 2: Delivery address
  const [address, setAddress] = useState<DeliveryAddress>({
    street: '',
    city: '',
    state: 'Lagos',
    notes: '',
  });

  // Step 3: Payment method
  const [createAccount, setCreateAccount] = useState(false);

  // Redirect signed-in users to authenticated checkout
  useEffect(() => {
    if (user) {
      router.push('/dashboard/customer/checkout');
    }
  }, [user, router]);

  // Load cart
  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    if (cart.length === 0) {
      router.push('/cart');
      return;
    }
    setCartItems(cart);
  }, [router]);

  const getTotalPrice = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const deliveryFee = 1500; // Flat estimate for guest checkout
  const totalWithDelivery = getTotalPrice() + deliveryFee;

  const validateStep1 = () => {
    if (!guestEmail || !guestEmail.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!guestPhone || guestPhone.length < 10) {
      setError('Please enter a valid phone number');
      return false;
    }
    if (!guestName.trim()) {
      setError('Please enter your name');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!address.street || !address.city || !address.state) {
      setError('Please fill in all address fields');
      return false;
    }
    return true;
  };

  const handleContinue = () => {
    setError(null);
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    setError(null);
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const orderId = `GUEST-${Date.now()}`;

      const response = await fetch(`${API_URL}/payments/guest/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: guestEmail,
          phone: guestPhone,
          amount: totalWithDelivery,
          orderId,
        }),
      });

      const result = await response.json();

      if (result.success && result.data?.payment?.authorizationUrl) {
        // Save guest order info for post-payment
        localStorage.setItem(
          'guestOrder',
          JSON.stringify({
            orderId,
            email: guestEmail,
            phone: guestPhone,
            name: guestName,
            address,
            createAccount,
            items: cartItems,
          })
        );

        window.location.href = result.data.payment.authorizationUrl;
      } else {
        setError(result.error?.message || 'Failed to initialize payment. Please try again.');
        setIsProcessing(false);
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setIsProcessing(false);
    }
  };

  const stepLabels = ['Your Info', 'Delivery', 'Review & Pay'];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Guest Checkout</h1>
        <p className="text-gray-600 mt-1">
          No account needed — or{' '}
          <Link href="/login" className="text-green-600 hover:underline font-medium">
            sign in
          </Link>{' '}
          for faster checkout
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-8">
        {stepLabels.map((label, idx) => {
          const step = idx + 1;
          return (
            <div key={step} className="flex items-center flex-1">
              <div className="flex items-center gap-2">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    step < currentStep
                      ? 'bg-green-600 text-white'
                      : step === currentStep
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step < currentStep ? '✓' : step}
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">{label}</span>
              </div>
              {step < 3 && (
                <div className={`flex-1 h-0.5 mx-3 rounded ${step < currentStep ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Step 1: Guest Info */}
          {currentStep === 1 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Your Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">We&apos;ll send your order confirmation here</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="+234 800 000 0000"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">For delivery coordination and order updates</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Delivery Address */}
          {currentStep === 2 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Delivery Address</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    placeholder="e.g., 42 Banana Island Road"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      placeholder="e.g., Ikeja"
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <select
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    >
                      {NIGERIAN_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Notes (Optional)</label>
                  <input
                    type="text"
                    value={address.notes}
                    onChange={(e) => setAddress({ ...address, notes: e.target.value })}
                    placeholder="Gate code, landmark, apartment number..."
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review & Pay */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.productId} className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        {item.productName} x{item.quantity}
                      </span>
                      <span className="font-medium text-gray-900">
                        &#8358;{(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-3 space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Subtotal</span>
                      <span>&#8358;{getTotalPrice().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Delivery Fee</span>
                      <span>&#8358;{deliveryFee.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="text-xl font-bold text-green-600">
                      &#8358;{totalWithDelivery.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivery Info Review */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-3">Delivery Details</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-gray-500">Name:</span>{' '}
                    <span className="font-medium text-gray-900">{guestName}</span>
                  </p>
                  <p>
                    <span className="text-gray-500">Email:</span>{' '}
                    <span className="font-medium text-gray-900">{guestEmail}</span>
                  </p>
                  <p>
                    <span className="text-gray-500">Phone:</span>{' '}
                    <span className="font-medium text-gray-900">{guestPhone}</span>
                  </p>
                  <p>
                    <span className="text-gray-500">Address:</span>{' '}
                    <span className="font-medium text-gray-900">
                      {address.street}, {address.city}, {address.state}
                    </span>
                  </p>
                  {address.notes && (
                    <p>
                      <span className="text-gray-500">Notes:</span>{' '}
                      <span className="font-medium text-gray-900">{address.notes}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Create Account Option */}
              <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createAccount}
                    onChange={(e) => setCreateAccount(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-gray-300"
                  />
                  <div>
                    <p className="font-medium text-green-900">Create an account for faster checkout next time</p>
                    <p className="text-sm text-green-700 mt-0.5">
                      Track orders, save addresses, and get personalized recommendations
                    </p>
                  </div>
                </label>
              </div>

              {/* Place Order Button */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
                <p className="text-sm text-gray-600 mb-4">
                  By clicking &quot;Pay with Paystack&quot;, you agree to our{' '}
                  <Link href="/terms" className="text-green-600 hover:underline">
                    Terms of Service
                  </Link>
                  . You&apos;ll be redirected to Paystack for secure payment.
                </p>
                <button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                  className={`w-full py-3.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isProcessing
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow-md'
                  }`}
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    `Pay ₦${totalWithDelivery.toLocaleString()} with Paystack`
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-4">
            <h3 className="font-bold text-gray-900 mb-4">Order Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</span>
                <span>&#8358;{getTotalPrice().toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery</span>
                <span>&#8358;{deliveryFee.toLocaleString()}</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                <span className="font-bold text-gray-900">Total</span>
                <span className="text-lg font-bold text-green-600">
                  &#8358;{totalWithDelivery.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-xs text-blue-800">
                <span className="font-medium">Secure Payment</span> — All payments are processed securely through Paystack with 256-bit encryption.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-4 justify-between mt-8">
        <button
          onClick={handleBack}
          disabled={currentStep === 1}
          className={`px-6 py-3 rounded-xl text-sm font-semibold border transition-colors ${
            currentStep === 1
              ? 'border-gray-200 text-gray-400 cursor-not-allowed'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Back
        </button>
        {currentStep < 3 && (
          <button
            onClick={handleContinue}
            className="px-6 py-3 rounded-xl text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
