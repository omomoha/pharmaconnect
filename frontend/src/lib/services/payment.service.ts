import { apiClient } from '../api';
import type { ApiResponse } from '@/shared/types';

/**
 * Payment service for Paystack integration
 */

export interface InitializePaymentResponse {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

export interface VerifyPaymentResponse {
  status: string;
  amount: number;
  reference: string;
}

export interface RefundResponse {
  status: string;
  refundId?: string;
}

/**
 * Initialize a payment with Paystack
 */
export async function initializePayment(
  orderId: string,
  email: string,
  amount: number
): Promise<ApiResponse<InitializePaymentResponse>> {
  try {
    const response = await apiClient.post('/payments/initialize', {
      orderId,
      email,
      amount,
    });
    return response;
  } catch (error) {
    console.error('Failed to initialize payment:', error);
    return {
      success: false,
      error: {
        code: 'INITIALIZE_PAYMENT_ERROR',
        message: 'Failed to initialize payment',
      },
    };
  }
}

/**
 * Verify a payment using the reference from Paystack
 */
export async function verifyPayment(
  reference: string
): Promise<ApiResponse<VerifyPaymentResponse>> {
  try {
    const response = await apiClient.get(`/payments/verify/${reference}`);
    return response;
  } catch (error) {
    console.error('Failed to verify payment:', error);
    return {
      success: false,
      error: {
        code: 'VERIFY_PAYMENT_ERROR',
        message: 'Failed to verify payment',
      },
    };
  }
}

/**
 * Request a refund for an order
 */
export async function requestRefund(
  orderId: string
): Promise<ApiResponse<RefundResponse>> {
  try {
    const response = await apiClient.post('/payments/refund', {
      orderId,
    });
    return response;
  } catch (error) {
    console.error('Failed to request refund:', error);
    return {
      success: false,
      error: {
        code: 'REQUEST_REFUND_ERROR',
        message: 'Failed to request refund',
      },
    };
  }
}
