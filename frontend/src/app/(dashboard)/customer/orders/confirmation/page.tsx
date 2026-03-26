'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || 'ORD-1234567890';

  // Generate a 6-character delivery code
  const deliveryCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  const orderDetails = {
    orderId,
    pharmacy: 'HealthCare Plus Pharmacy',
    itemCount: 4,
    totalAmount: 15300,
    estimatedDelivery: '45 minutes',
    deliveryProvider: 'SpeedDelivery Express',
    deliveryAddress: '42 Banana Island Road, Lekki, Lagos',
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* Success Animation */}
      <div className="mb-8">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
          <svg
            className="w-12 h-12 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Order Placed Successfully!
          </h1>
          <p className="text-gray-600 text-lg">
            Your medication order has been confirmed
          </p>
        </div>
      </div>

      {/* Order ID */}
      <Card className="mb-6 bg-primary-50 border-primary-200">
        <CardContent className="py-6 text-center">
          <p className="text-sm text-gray-600 mb-2">Your Order ID</p>
          <p className="text-3xl font-bold text-primary-600 font-mono">
            {orderId}
          </p>
          <p className="text-xs text-gray-600 mt-2">
            Save this ID to track your order
          </p>
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-xl font-bold text-gray-900">Order Summary</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">From</p>
              <p className="font-bold text-gray-900 mt-1">
                {orderDetails.pharmacy}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Items</p>
              <p className="font-bold text-gray-900 mt-1">
                {orderDetails.itemCount} items
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="font-bold text-gray-900 mt-1 text-lg">
                ₦{orderDetails.totalAmount.toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Est. Delivery</p>
              <p className="font-bold text-gray-900 mt-1">
                {orderDetails.estimatedDelivery}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Code */}
      <Card className="mb-6 border-yellow-200 bg-yellow-50">
        <CardHeader>
          <h2 className="text-xl font-bold text-gray-900">Your Delivery Code</h2>
          <p className="text-sm text-gray-600 mt-2">
            Show this code to your delivery rider for verification
          </p>
        </CardHeader>
        <CardContent>
          <div className="bg-white border-2 border-yellow-400 rounded-lg p-6 text-center">
            <p className="text-sm text-gray-600 mb-3">Delivery Code</p>
            <p className="text-5xl font-bold text-yellow-600 font-mono tracking-widest mb-4">
              {deliveryCode}
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(deliveryCode);
                alert('Code copied to clipboard!');
              }}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Copy Code
            </button>
          </div>
          <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
            <p className="text-xs text-yellow-900">
              Important: Your rider will ask for this code before handing over your order.
              Never share this code with anyone else.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Details */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-xl font-bold text-gray-900">Delivery Details</h2>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm text-gray-600 mb-2">Delivery Address</p>
            <div className="flex gap-3">
              <span className="text-2xl">📍</span>
              <p className="font-medium text-gray-900">
                {orderDetails.deliveryAddress}
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-600 mb-2">Delivery Provider</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <span className="text-lg">🚚</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {orderDetails.deliveryProvider}
                </p>
                <p className="text-sm text-gray-600">
                  4.9 ★ • {orderDetails.estimatedDelivery} delivery time
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-600 mb-3">What happens next?</p>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary-600 text-white text-sm font-bold">
                    1
                  </div>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Pharmacy Prepares Order</p>
                  <p className="text-xs text-gray-600">
                    Usually takes 10-15 minutes
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary-600 text-white text-sm font-bold">
                    2
                  </div>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Rider Collects Order</p>
                  <p className="text-xs text-gray-600">
                    We'll notify you when they're on the way
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary-600 text-white text-sm font-bold">
                    3
                  </div>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Order Delivered
                  </p>
                  <p className="text-xs text-gray-600">
                    Share your delivery code to confirm receipt
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help & Contact */}
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <CardContent className="py-6">
          <div className="flex gap-3">
            <span className="text-xl">❓</span>
            <div className="text-sm">
              <p className="font-medium text-gray-900 mb-1">Need Help?</p>
              <p className="text-gray-600 mb-3">
                If you have any questions about your order, contact us:
              </p>
              <div className="space-y-1 text-gray-600">
                <p>📞 +234 (0)705 1234 567</p>
                <p>📧 support@pharmaconnect.com</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link href={`/customer/orders/${orderId}`}>
          <Button variant="outline" className="w-full" size="lg">
            Track Order
          </Button>
        </Link>

        <Link href="/browse">
          <Button variant="primary" className="w-full" size="lg">
            Continue Shopping
          </Button>
        </Link>
      </div>

      {/* Additional Info */}
      <div className="mt-8 p-6 bg-gray-50 rounded-lg text-center">
        <p className="text-sm text-gray-600">
          You'll receive SMS and email updates about your order.
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Order Reference: <span className="font-mono">{orderId}</span>
        </p>
      </div>
    </div>
  );
}
