'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

function CallbackContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const reference = searchParams?.get('reference') || searchParams?.get('trxref');
    if (!reference) {
      setStatus('failed');
      return;
    }

    verifyPayment(reference);
  }, [searchParams]);

  async function verifyPayment(reference: string) {
    try {
      // Verify with backend (no auth needed for guest)
      const res = await fetch(`${API_URL}/payments/verify/${reference}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await res.json();
      const isSuccess = result.success && result.data?.verification?.success;

      if (isSuccess) {
        // Clear cart on successful payment
        localStorage.removeItem('cart');

        // Get order info from localStorage
        const guestOrderStr = localStorage.getItem('guestOrder');
        if (guestOrderStr) {
          const guestOrder = JSON.parse(guestOrderStr);
          setOrderId(guestOrder.orderId);
          localStorage.removeItem('guestOrder');
        }

        setStatus('success');
      } else {
        setStatus('failed');
      }
    } catch {
      setStatus('failed');
    }
  }

  if (status === 'verifying') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Verifying your payment...</h2>
          <p className="text-gray-600 mt-2">Please wait while we confirm your transaction</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-2">
            Your order has been placed and the pharmacy has been notified.
          </p>
          {orderId && (
            <p className="text-sm text-gray-500 mb-6">
              Order ID: <span className="font-mono font-medium">{orderId}</span>
            </p>
          )}
          <div className="space-y-3">
            <Link
              href="/browse"
              className="block w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
            >
              Continue Shopping
            </Link>
            <Link
              href="/register?role=customer"
              className="block w-full border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Create an Account to Track Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
        <p className="text-gray-600 mb-6">
          We couldn&apos;t verify your payment. If money was deducted, it will be refunded automatically.
        </p>
        <div className="space-y-3">
          <Link
            href="/checkout"
            className="block w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
          >
            Try Again
          </Link>
          <Link
            href="/contact"
            className="block text-sm text-gray-500 hover:text-gray-700"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutCallbackPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Suspense
        fallback={
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
          </div>
        }
      >
        <CallbackContent />
      </Suspense>
    </div>
  );
}
