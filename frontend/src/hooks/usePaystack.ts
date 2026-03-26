'use client';

import { useCallback, useState } from 'react';
import { paymentService } from '@/lib/services';

/**
 * Hook for managing Paystack payment flow
 * Handles payment initialization and verification
 */
export function usePaystack() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initialize a payment and redirect to Paystack
   * @param orderId - Order ID to pay for
   * @param email - Customer email
   * @param amount - Amount in currency (e.g., 5000 for 5000 Naira)
   * @returns Authorization URL to redirect user to Paystack
   */
  const initializePayment = useCallback(
    async (orderId: string, email: string, amount: number): Promise<string | null> => {
      try {
        setLoading(true);
        setError(null);

        const response = await paymentService.initializePayment(
          orderId,
          email,
          amount
        );

        if (response.success && response.data) {
          return response.data.authorizationUrl;
        } else {
          const errorMsg =
            response.error?.message || 'Failed to initialize payment';
          setError(errorMsg);
          return null;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Payment initialization failed';
        setError(message);
        console.error('initializePayment error:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Verify a payment after user returns from Paystack
   * @param reference - Payment reference from Paystack
   * @returns True if payment is successful, false otherwise
   */
  const verifyPayment = useCallback(
    async (reference: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const response = await paymentService.verifyPayment(reference);

        if (response.success && response.data) {
          const status = response.data.status?.toLowerCase();
          return status === 'success' || status === 'paid';
        } else {
          const errorMsg =
            response.error?.message || 'Failed to verify payment';
          setError(errorMsg);
          return false;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Payment verification failed';
        setError(message);
        console.error('verifyPayment error:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Initiate payment flow (initialize and redirect)
   * @param orderId - Order ID
   * @param email - Customer email
   * @param amount - Payment amount
   */
  const startPayment = useCallback(
    async (orderId: string, email: string, amount: number): Promise<void> => {
      const authUrl = await initializePayment(orderId, email, amount);

      if (authUrl) {
        // Redirect to Paystack authorization URL
        window.location.href = authUrl;
      }
    },
    [initializePayment]
  );

  return {
    loading,
    error,
    initializePayment,
    verifyPayment,
    startPayment,
  };
}
