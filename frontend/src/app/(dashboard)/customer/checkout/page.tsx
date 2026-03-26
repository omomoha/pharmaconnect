'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';

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

interface DeliveryProvider {
  id: string;
  name: string;
  rating: number;
  deliveryTime: string;
  price: number;
}

const dummyDeliveryProviders: DeliveryProvider[] = [
  {
    id: 'dp1',
    name: 'SpeedDelivery Express',
    rating: 4.9,
    deliveryTime: '30-45 mins',
    price: 1500,
  },
  {
    id: 'dp2',
    name: 'SafeHand Logistics',
    rating: 4.7,
    deliveryTime: '45-60 mins',
    price: 1200,
  },
  {
    id: 'dp3',
    name: 'FreshMeds Delivery',
    rating: 4.8,
    deliveryTime: '1-2 hours',
    price: 800,
  },
];

const savedAddresses: DeliveryAddress[] = [
  {
    street: '42 Banana Island Road',
    city: 'Lagos',
    state: 'Lagos',
    notes: 'Near the security gate',
  },
  {
    street: '15 Marina Street',
    city: 'Lagos',
    state: 'Lagos',
    notes: 'Office address',
  },
];

export default function CheckoutPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Step 1: Delivery Address
  const [addressType, setAddressType] = useState<'saved' | 'new'>('saved');
  const [selectedSavedAddress, setSelectedSavedAddress] = useState(0);
  const [newAddress, setNewAddress] = useState<DeliveryAddress>({
    street: '',
    city: '',
    state: '',
    notes: '',
  });

  // Step 2: Delivery Provider
  const [selectedProvider, setSelectedProvider] = useState('dp1');

  // Step 3: Payment
  const [paymentMethod, setPaymentMethod] = useState('paystack');

  // Step 4: Review
  const [isProcessing, setIsProcessing] = useState(false);

  const getTotalPrice = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getSelectedProvider = () => {
    return dummyDeliveryProviders.find((p) => p.id === selectedProvider);
  };

  const handleContinue = () => {
    if (currentStep === 1) {
      if (addressType === 'new') {
        if (
          !newAddress.street ||
          !newAddress.city ||
          !newAddress.state
        ) {
          toast.error('Please fill in all address fields');
          return;
        }
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Clear cart
      localStorage.setItem('cart', JSON.stringify([]));

      // Redirect to confirmation page
      router.push(
        `/customer/orders/confirmation?orderId=ORD-${Date.now()}`
      );
    } catch (error) {
      toast.error('Failed to place order. Please try again.');
      setIsProcessing(false);
    }
  };

  // Load cart on mount
  React.useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    if (cart.length === 0) {
      router.push('/customer/cart');
      return;
    }
    setCartItems(cart);
  }, [router]);

  const getTotalWithDelivery = () => {
    const provider = getSelectedProvider();
    const deliveryFee = provider?.price || 0;
    return getTotalPrice() + deliveryFee;
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <PageHeader
        title="Checkout"
        description="Complete your order in just a few steps"
      />

      {/* Step Indicator */}
      <div className="flex justify-between items-center mb-8">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                step < currentStep
                  ? 'bg-green-600 text-white'
                  : step === currentStep
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step < currentStep ? '✓' : step}
            </div>
            <span className="ml-2 text-sm font-medium text-gray-600">
              {['Delivery', 'Service', 'Payment', 'Review'][step - 1]}
            </span>
            {step < 4 && (
              <div
                className={`flex-1 h-1 mx-4 rounded ${
                  step < currentStep ? 'bg-green-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Step 1: Delivery Address */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold text-gray-900">
                  Delivery Address
                </h2>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Address Type Selector */}
                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      checked={addressType === 'saved'}
                      onChange={() => setAddressType('saved')}
                      className="w-4 h-4"
                    />
                    <span className="font-medium text-gray-900">
                      Use Saved Address
                    </span>
                  </label>

                  {addressType === 'saved' && (
                    <div className="space-y-3 ml-7">
                      {savedAddresses.map((addr, idx) => (
                        <label
                          key={idx}
                          className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors"
                          style={{
                            borderColor:
                              selectedSavedAddress === idx
                                ? '#16a34a'
                                : '#e5e7eb',
                            backgroundColor:
                              selectedSavedAddress === idx
                                ? '#dcfce7'
                                : 'transparent',
                          }}
                        >
                          <input
                            type="radio"
                            checked={selectedSavedAddress === idx}
                            onChange={() => setSelectedSavedAddress(idx)}
                            className="w-4 h-4 mt-1"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {addr.street}
                            </p>
                            <p className="text-sm text-gray-600">
                              {addr.city}, {addr.state}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {addr.notes}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  <label className="flex items-center gap-3 cursor-pointer mt-4">
                    <input
                      type="radio"
                      checked={addressType === 'new'}
                      onChange={() => setAddressType('new')}
                      className="w-4 h-4"
                    />
                    <span className="font-medium text-gray-900">
                      Enter New Address
                    </span>
                  </label>
                </div>

                {/* New Address Form */}
                {addressType === 'new' && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg ml-7">
                    <Input
                      label="Street Address"
                      placeholder="e.g., 123 Main Street"
                      value={newAddress.street}
                      onChange={(e) =>
                        setNewAddress({
                          ...newAddress,
                          street: e.target.value,
                        })
                      }
                    />

                    <div className="grid sm:grid-cols-2 gap-4">
                      <Input
                        label="City"
                        placeholder="e.g., Lagos"
                        value={newAddress.city}
                        onChange={(e) =>
                          setNewAddress({
                            ...newAddress,
                            city: e.target.value,
                          })
                        }
                      />
                      <Input
                        label="State"
                        placeholder="e.g., Lagos"
                        value={newAddress.state}
                        onChange={(e) =>
                          setNewAddress({
                            ...newAddress,
                            state: e.target.value,
                          })
                        }
                      />
                    </div>

                    <Input
                      label="Delivery Notes (Optional)"
                      placeholder="e.g., Gate code, apartment number, etc."
                      value={newAddress.notes}
                      onChange={(e) =>
                        setNewAddress({
                          ...newAddress,
                          notes: e.target.value,
                        })
                      }
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 2: Choose Delivery Service */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold text-gray-900">
                  Choose Delivery Service
                </h2>
                <p className="text-sm text-gray-600 mt-2">
                  Select a delivery provider for your order
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {dummyDeliveryProviders.map((provider) => (
                  <label
                    key={provider.id}
                    className="flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-colors"
                    style={{
                      borderColor:
                        selectedProvider === provider.id
                          ? '#16a34a'
                          : '#e5e7eb',
                      backgroundColor:
                        selectedProvider === provider.id
                          ? '#dcfce7'
                          : 'transparent',
                    }}
                  >
                    <input
                      type="radio"
                      checked={selectedProvider === provider.id}
                      onChange={() => setSelectedProvider(provider.id)}
                      className="w-4 h-4"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900">
                        {provider.name}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <span>★ {provider.rating}</span>
                        <span>•</span>
                        <span>{provider.deliveryTime}</span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-primary-600">
                        ₦{provider.price.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600">delivery</div>
                    </div>
                  </label>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Payment */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold text-gray-900">
                  Payment Method
                </h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex items-center gap-3 p-4 border-2 border-primary-600 rounded-lg bg-primary-50 cursor-pointer">
                  <input
                    type="radio"
                    checked={paymentMethod === 'paystack'}
                    onChange={() => setPaymentMethod('paystack')}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="font-medium text-gray-900">
                      Paystack (Secure Payment)
                    </p>
                    <p className="text-sm text-gray-600">
                      Credit card, debit card, or bank transfer
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer opacity-50">
                  <input
                    type="radio"
                    disabled
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="font-medium text-gray-900">
                      Pay on Delivery
                    </p>
                    <p className="text-sm text-gray-600">
                      Coming soon
                    </p>
                  </div>
                </label>

                {/* Paystack Info */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900 space-y-2">
                  <p className="font-medium">Secure Payment Processing</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Your payment information is encrypted</li>
                    <li>PCI DSS compliant</li>
                    <li>Multiple payment options available</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-6">
              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-bold text-gray-900">
                    Order Summary
                  </h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 border-b border-gray-200 pb-4 mb-4">
                    <div className="flex justify-between text-gray-600">
                      <span>Items ({cartItems.length})</span>
                      <span>₦{getTotalPrice().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Delivery Fee</span>
                      <span>
                        ₦{getSelectedProvider()?.price?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900">
                      Total Amount
                    </span>
                    <span className="text-2xl font-bold text-primary-600">
                      ₦{getTotalWithDelivery().toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Info */}
              <Card>
                <CardHeader>
                  <h3 className="font-bold text-gray-900">Delivery Details</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-medium text-gray-900 mt-1">
                      {addressType === 'saved'
                        ? `${savedAddresses[selectedSavedAddress].street}, ${savedAddresses[selectedSavedAddress].city}`
                        : `${newAddress.street}, ${newAddress.city}`}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Delivery Provider</p>
                    <p className="font-medium text-gray-900 mt-1">
                      {getSelectedProvider()?.name}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Expected delivery: {getSelectedProvider()?.deliveryTime}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <p className="font-medium text-gray-900 mt-1">
                      Paystack (Secure Payment)
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Confirm Button */}
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <p className="text-sm text-green-900 mb-4">
                  By clicking "Place Order", you agree to our terms and conditions.
                  You'll receive a delivery code to share with your rider.
                </p>
                <Button
                  variant="primary"
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                  onClick={handlePlaceOrder}
                  isLoading={isProcessing}
                >
                  {isProcessing ? 'Placing Order...' : 'Place Order'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <h3 className="font-bold text-gray-900">Order Details</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Items</div>
                <div className="font-bold text-gray-900">
                  {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                </div>
              </div>

              <div className="space-y-2 border-t border-gray-200 pt-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>₦{getTotalPrice().toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-sm text-gray-600">
                  <span>Delivery</span>
                  <span>
                    ₦{getSelectedProvider()?.price?.toLocaleString() || 'TBD'}
                  </span>
                </div>

                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tax & Charges</span>
                  <span>₦0</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                <span className="font-bold text-gray-900">Total</span>
                <span className="text-xl font-bold text-primary-600">
                  ₦{getTotalWithDelivery().toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-4 justify-between">
        <Button
          variant="outline"
          size="lg"
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          Back
        </Button>

        {currentStep < 4 && (
          <Button
            variant="primary"
            size="lg"
            onClick={handleContinue}
          >
            Continue
          </Button>
        )}
      </div>
    </div>
  );
}
