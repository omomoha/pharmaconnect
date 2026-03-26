/**
 * Payment Service Tests
 * Tests for Paystack payment integration
 */

// Mock the config module BEFORE importing anything that uses it
jest.mock('../../config/index.js', () => ({
  __esModule: true,
  default: {
    PAYSTACK_SECRET_KEY: 'sk_test_1234567890',
    PAYSTACK_PUBLIC_KEY: 'pk_test_1234567890',
    LOG_FILE_PATH: './logs',
    LOG_LEVEL: 'info',
  },
}));

import { PaymentService } from '../../modules/payment/payment.service';
import crypto from 'crypto';

// Mock fetch globally
global.fetch = jest.fn();

jest.mock('../../config/firebase');
jest.mock('../../utils/logger');
jest.mock('../../modules/order/order.service', () => ({
  OrderService: {
    updatePaymentStatus: jest.fn().mockResolvedValue({
      id: 'order-123',
      paymentStatus: 'paid',
    }),
  },
}));

describe('PaymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('initializePayment', () => {
    it('should initialize payment with Paystack API', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          status: true,
          message: 'Authorization URL created',
          data: {
            authorization_url: 'https://checkout.paystack.co/test-code',
            access_code: 'test-code',
            reference: 'ORDER-123-1234567890',
          },
        }),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await PaymentService.initializePayment({
        email: 'customer@example.com',
        amount: 5000,
        orderId: 'order-123',
      });

      expect(result.authorizationUrl).toBe('https://checkout.paystack.co/test-code');
      expect(result.accessCode).toBe('test-code');
      expect(result.reference).toContain('ORDER-123');
    });

    it('should convert amount to kobo', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          status: true,
          data: {
            authorization_url: 'https://checkout.paystack.co/test-code',
            access_code: 'test-code',
            reference: 'ORDER-123-1234567890',
          },
        }),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      await PaymentService.initializePayment({
        email: 'customer@example.com',
        amount: 5000,
        orderId: 'order-123',
      });

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const bodyStr = callArgs[1].body;
      const body = JSON.parse(bodyStr);

      // 5000 naira = 500000 kobo
      expect(body.amount).toBe(5000 * 100);
    });

    it('should include metadata in initialization', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          status: true,
          data: {
            authorization_url: 'https://checkout.paystack.co/test-code',
            access_code: 'test-code',
            reference: 'ORDER-123-1234567890',
          },
        }),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const metadata = { userId: 'user-123', customField: 'value' };

      await PaymentService.initializePayment({
        email: 'customer@example.com',
        amount: 5000,
        orderId: 'order-123',
        metadata,
      });

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const bodyStr = callArgs[1].body;
      const body = JSON.parse(bodyStr);

      expect(body.metadata.orderId).toBe('order-123');
      expect(body.metadata.userId).toBe('user-123');
      expect(body.metadata.customField).toBe('value');
    });

    it('should throw on API error', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({
          message: 'Invalid request',
        }),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      await expect(
        PaymentService.initializePayment({
          email: 'customer@example.com',
          amount: 5000,
          orderId: 'order-123',
        })
      ).rejects.toThrow();
    });
  });

  describe('verifyPayment', () => {
    it('should verify successful payment', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          status: true,
          data: {
            status: 'success',
            amount: 500000,
            reference: 'ORDER-123-1234567890',
            metadata: {
              orderId: 'order-123',
            },
          },
        }),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await PaymentService.verifyPayment('ORDER-123-1234567890');

      expect(result.success).toBe(true);
      expect(result.status).toBe('success');
      expect(result.amount).toBe(5000); // Converted from kobo
      expect(result.orderId).toBe('order-123');
    });

    it('should handle failed payment', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          status: true,
          data: {
            status: 'failed',
            amount: 500000,
            reference: 'ORDER-123-1234567890',
            metadata: {
              orderId: 'order-123',
            },
          },
        }),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await PaymentService.verifyPayment('ORDER-123-1234567890');

      expect(result.success).toBe(false);
      expect(result.status).toBe('failed');
    });

    it('should convert amount from kobo to naira', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          status: true,
          data: {
            status: 'success',
            amount: 750000, // 7500 naira
            reference: 'ORDER-123-1234567890',
            metadata: {},
          },
        }),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await PaymentService.verifyPayment('ORDER-123-1234567890');

      expect(result.amount).toBe(7500);
    });

    it('should throw on verification error', async () => {
      const mockResponse = {
        ok: false,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      await expect(
        PaymentService.verifyPayment('ORDER-123-1234567890')
      ).rejects.toThrow();
    });
  });

  describe('handleWebhook', () => {
    // Use the secret from the mocked config
    const testSecret = 'sk_test_1234567890';

    it('should process successful charge webhook', async () => {
      const orderId = 'order-123';
      const webhookData = {
        event: 'charge.success',
        data: {
          reference: 'ORDER-123-1234567890',
          status: 'success',
          metadata: {
            orderId,
          },
        },
      };

      const body = JSON.stringify(webhookData);
      const signature = crypto.createHmac('sha512', testSecret).update(body).digest('hex');

      const result = await PaymentService.handleWebhook(signature, body);

      expect(result.success).toBe(true);
      expect(result.orderId).toBe(orderId);
    });

    it('should reject invalid signature', async () => {
      const webhookData = {
        event: 'charge.success',
        data: {
          reference: 'ORDER-123-1234567890',
          status: 'success',
          metadata: {
            orderId: 'order-123',
          },
        },
      };

      const body = JSON.stringify(webhookData);
      const invalidSignature = 'invalid-signature';

      const result = await PaymentService.handleWebhook(invalidSignature, body);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid signature');
    });

    it('should ignore non-charge.success events', async () => {
      const webhookData = {
        event: 'charge.failed',
        data: {
          reference: 'ORDER-123-1234567890',
          status: 'failed',
          metadata: {
            orderId: 'order-123',
          },
        },
      };

      const body = JSON.stringify(webhookData);
      const signature = crypto.createHmac('sha512', testSecret).update(body).digest('hex');

      const result = await PaymentService.handleWebhook(signature, body);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Event not processed');
    });

    it('should reject webhook with non-success status', async () => {
      const webhookData = {
        event: 'charge.success',
        data: {
          reference: 'ORDER-123-1234567890',
          status: 'failed',
          metadata: {
            orderId: 'order-123',
          },
        },
      };

      const body = JSON.stringify(webhookData);
      const signature = crypto.createHmac('sha512', testSecret).update(body).digest('hex');

      const result = await PaymentService.handleWebhook(signature, body);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Payment not successful');
    });

    it('should handle missing order ID', async () => {
      const webhookData = {
        event: 'charge.success',
        data: {
          reference: 'ORDER-123-1234567890',
          status: 'success',
          metadata: {},
        },
      };

      const body = JSON.stringify(webhookData);
      const signature = crypto.createHmac('sha512', testSecret).update(body).digest('hex');

      const result = await PaymentService.handleWebhook(signature, body);

      expect(result.success).toBe(false);
      expect(result.message).toBe('No order ID found');
    });
  });

  describe('getPaymentStatus', () => {
    it('should return PAID status for successful payment', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          status: true,
          data: {
            status: 'success',
            amount: 500000,
            reference: 'ORDER-123-1234567890',
            metadata: {
              orderId: 'order-123',
            },
          },
        }),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await PaymentService.getPaymentStatus('ORDER-123-1234567890');

      expect(result.status).toBe('paid');
      expect(result.paidAt).toBeDefined();
    });

    it('should return FAILED status for failed payment', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          status: true,
          data: {
            status: 'failed',
            amount: 500000,
            reference: 'ORDER-123-1234567890',
            metadata: {},
          },
        }),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await PaymentService.getPaymentStatus('ORDER-123-1234567890');

      expect(result.status).toBe('failed');
    });

    it('should return PENDING on error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await PaymentService.getPaymentStatus('ORDER-123-1234567890');

      expect(result.status).toBe('pending');
    });
  });

  describe('refundPayment', () => {
    it('should create refund request', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          status: true,
          data: {
            reference: 'REFUND-123-1234567890',
            status: 'pending',
          },
        }),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await PaymentService.refundPayment('ORDER-123-1234567890', 'Customer requested');

      expect(result.refundReference).toBe('REFUND-123-1234567890');
      expect(result.status).toBe('pending');
    });

    it('should include reason in refund request', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          status: true,
          data: {
            reference: 'REFUND-123-1234567890',
            status: 'pending',
          },
        }),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const reason = 'Product not available';
      await PaymentService.refundPayment('ORDER-123-1234567890', reason);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const bodyStr = callArgs[1].body;
      const body = JSON.parse(bodyStr);

      expect(body.reason).toBe(reason);
    });

    it('should throw on refund error', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({
          message: 'Transaction not found',
        }),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      await expect(
        PaymentService.refundPayment('ORDER-123-1234567890')
      ).rejects.toThrow();
    });
  });
});
