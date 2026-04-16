import logger from "../utils/logger.js";

/**
 * MalPay Integration Service
 * Handles server-to-server communication with MalPay's Partner API
 * for cross-platform user registration.
 */
export class MalPayService {
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = process.env.MALPAY_API_URL || '';
    this.apiKey = process.env.MALPAY_PARTNER_API_KEY || '';
  }

  /**
   * Register a PharmaConnect user on MalPay.
   * This is a fire-and-forget operation — if it fails,
   * PharmaConnect registration still succeeds.
   */
  async registerUser(data: {
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    partnerUserId: string;
  }): Promise<{ success: boolean; userId?: string; isExisting?: boolean }> {
    if (!this.apiUrl || !this.apiKey) {
      logger.warn('MalPay integration not configured. Skipping MalPay registration.');
      return { success: false };
    }

    try {
      const response = await fetch(`${this.apiUrl}/api/v1/partners/register-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          phoneNumber: data.phoneNumber,
          partnerUserId: data.partnerUserId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        logger.info(`MalPay registration successful for ${data.email}`, {
          malpayUserId: result.data?.userId,
          isExisting: result.data?.isExisting,
        });
        return {
          success: true,
          userId: result.data?.userId,
          isExisting: result.data?.isExisting,
        };
      } else {
        logger.warn(`MalPay registration returned error for ${data.email}: ${result.message}`);
        return { success: false };
      }
    } catch (error) {
      logger.error(`MalPay registration failed for ${data.email}:`, error);
      return { success: false };
    }
  }
}
