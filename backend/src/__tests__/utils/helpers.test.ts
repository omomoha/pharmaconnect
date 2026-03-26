/**
 * Helper Functions Tests
 * Tests for utility functions
 */

import {
  generateOrderNumber,
  generateSecurityCode,
  calculateDistanceKm,
  apiResponse,
  sanitizeString,
  extractTokenFromHeader,
  getPaginationMeta,
  formatCurrency,
  isValidEmail,
  isValidPhone,
  getTimeUntilExpiry,
  retryAsync,
} from '../../utils/helpers';

describe('Helper Functions', () => {
  describe('generateOrderNumber', () => {
    it('should generate valid order number', () => {
      const orderNum = generateOrderNumber();

      expect(orderNum).toBeDefined();
      expect(orderNum.startsWith('ORD-')).toBe(true);
    });

    it('should include date in YYYYMMDD format', () => {
      const orderNum = generateOrderNumber();
      const datePattern = /ORD-(\d{8})-/;

      expect(orderNum).toMatch(datePattern);
    });

    it('should include random hex suffix', () => {
      const orderNum = generateOrderNumber();
      const hexPattern = /-[A-F0-9]{4}$/;

      expect(orderNum).toMatch(hexPattern);
    });

    it('should generate different numbers on each call', () => {
      const orderNum1 = generateOrderNumber();
      const orderNum2 = generateOrderNumber();

      expect(orderNum1).not.toBe(orderNum2);
    });
  });

  describe('generateSecurityCode', () => {
    it('should generate 6-digit code', () => {
      const code = generateSecurityCode();

      expect(code.length).toBe(6);
      expect(/^\d{6}$/.test(code)).toBe(true);
    });

    it('should generate numeric code', () => {
      const code = generateSecurityCode();

      expect(parseInt(code, 10)).toBeGreaterThanOrEqual(100000);
      expect(parseInt(code, 10)).toBeLessThanOrEqual(999999);
    });

    it('should generate different codes', () => {
      const code1 = generateSecurityCode();
      const code2 = generateSecurityCode();

      expect(code1).not.toBe(code2);
    });

    it('should always be a string', () => {
      const code = generateSecurityCode();

      expect(typeof code).toBe('string');
    });
  });

  describe('calculateDistanceKm', () => {
    it('should calculate distance between two coordinates', () => {
      // Lagos to Ibadan (approximately 126 km)
      const distance = calculateDistanceKm(6.5244, 3.3792, 7.3878, 3.8964);

      expect(distance).toBeGreaterThan(100);
      expect(distance).toBeLessThan(150);
    });

    it('should return 0 for same coordinates', () => {
      const distance = calculateDistanceKm(6.5244, 3.3792, 6.5244, 3.3792);

      expect(distance).toBeLessThan(0.01);
    });

    it('should work for different locations', () => {
      const distance = calculateDistanceKm(0, 0, 1, 1);

      expect(distance).toBeGreaterThan(0);
    });

    it('should be symmetric', () => {
      const d1 = calculateDistanceKm(6.5244, 3.3792, 7.3878, 3.8964);
      const d2 = calculateDistanceKm(7.3878, 3.8964, 6.5244, 3.3792);

      expect(Math.abs(d1 - d2)).toBeLessThan(0.01);
    });
  });

  describe('apiResponse', () => {
    it('should create success response with data', () => {
      const data = { id: 1, name: 'Test' };
      const response = apiResponse(true, data);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.error).toBeUndefined();
    });

    it('should create error response', () => {
      const error = { code: 'ERROR', message: 'Something wrong' };
      const response = apiResponse(false, undefined, error);

      expect(response.success).toBe(false);
      expect(response.error).toEqual(error);
      expect(response.data).toBeUndefined();
    });

    it('should exclude undefined data', () => {
      const response = apiResponse(true);

      expect(response.data).toBeUndefined();
      expect('data' in response).toBe(false);
    });

    it('should include both data and error if provided', () => {
      const data = { id: 1 };
      const error = { code: 'WARNING', message: 'Check this' };
      const response = apiResponse(false, data, error);

      expect(response.data).toEqual(data);
      expect(response.error).toEqual(error);
    });
  });

  describe('sanitizeString', () => {
    it('should escape HTML characters', () => {
      const input = '<script>alert("xss")</script>';
      const sanitized = sanitizeString(input);

      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
      expect(sanitized).toContain('&lt;');
      expect(sanitized).toContain('&gt;');
    });

    it('should escape quotes', () => {
      const input = 'She said "hello" and \'goodbye\'';
      const sanitized = sanitizeString(input);

      expect(sanitized).toContain('&quot;');
      expect(sanitized).toContain('&#x27;');
    });

    it('should escape ampersands', () => {
      const input = 'Coffee & Tea';
      const sanitized = sanitizeString(input);

      expect(sanitized).toBe('Coffee &amp; Tea');
    });

    it('should handle empty string', () => {
      const sanitized = sanitizeString('');

      expect(sanitized).toBe('');
    });

    it('should escape forward slashes', () => {
      const input = '/api/users';
      const sanitized = sanitizeString(input);

      expect(sanitized).toContain('&#x2F;');
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract Bearer token', () => {
      const header = 'Bearer test-token-123';
      const token = extractTokenFromHeader(header);

      expect(token).toBe('test-token-123');
    });

    it('should handle lowercase Bearer', () => {
      const header = 'bearer test-token-123';
      const token = extractTokenFromHeader(header);

      expect(token).toBe('test-token-123');
    });

    it('should return null for missing header', () => {
      const token = extractTokenFromHeader(undefined);

      expect(token).toBeNull();
    });

    it('should return null for missing Bearer prefix', () => {
      const header = 'test-token-123';
      const token = extractTokenFromHeader(header);

      expect(token).toBeNull();
    });

    it('should return null for wrong scheme', () => {
      const header = 'Basic dGVzdDp0ZXN0';
      const token = extractTokenFromHeader(header);

      expect(token).toBeNull();
    });

    it('should return null for empty header', () => {
      const token = extractTokenFromHeader('');

      expect(token).toBeNull();
    });
  });

  describe('getPaginationMeta', () => {
    it('should calculate pagination metadata', () => {
      const meta = getPaginationMeta(1, 10, 50);

      expect(meta.page).toBe(1);
      expect(meta.limit).toBe(10);
      expect(meta.total).toBe(50);
      expect(meta.totalPages).toBe(5);
    });

    it('should detect next page existence', () => {
      const meta = getPaginationMeta(1, 10, 50);

      expect(meta.hasNextPage).toBe(true);
    });

    it('should detect last page', () => {
      const meta = getPaginationMeta(5, 10, 50);

      expect(meta.hasNextPage).toBe(false);
    });

    it('should detect previous page existence', () => {
      const meta = getPaginationMeta(2, 10, 50);

      expect(meta.hasPrevPage).toBe(true);
    });

    it('should detect first page', () => {
      const meta = getPaginationMeta(1, 10, 50);

      expect(meta.hasPrevPage).toBe(false);
    });

    it('should handle odd totals', () => {
      const meta = getPaginationMeta(1, 10, 55);

      expect(meta.totalPages).toBe(6);
    });
  });

  describe('formatCurrency', () => {
    it('should round to 2 decimal places', () => {
      const formatted = formatCurrency(123.456);

      expect(formatted).toBe(123.46);
    });

    it('should round down correctly', () => {
      const formatted = formatCurrency(123.454);

      expect(formatted).toBe(123.45);
    });

    it('should handle integers', () => {
      const formatted = formatCurrency(100);

      expect(formatted).toBe(100);
    });

    it('should handle small decimals', () => {
      const formatted = formatCurrency(0.01);

      expect(formatted).toBe(0.01);
    });

    it('should handle zero', () => {
      const formatted = formatCurrency(0);

      expect(formatted).toBe(0);
    });

    it('should handle large numbers', () => {
      const formatted = formatCurrency(10000000.999);

      expect(formatted).toBe(10000001);
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
    });

    it('should reject email without @', () => {
      expect(isValidEmail('userexample.com')).toBe(false);
    });

    it('should reject email without domain', () => {
      expect(isValidEmail('user@')).toBe(false);
    });

    it('should reject email without local part', () => {
      expect(isValidEmail('@example.com')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidEmail('')).toBe(false);
    });

    it('should accept emails with dots', () => {
      expect(isValidEmail('user.name@example.co.uk')).toBe(true);
    });
  });

  describe('isValidPhone', () => {
    it('should validate Nigerian phone number', () => {
      expect(isValidPhone('2347012345678')).toBe(true);
    });

    it('should validate phone with + prefix', () => {
      expect(isValidPhone('+2347012345678')).toBe(true);
    });

    it('should validate 10-digit number', () => {
      expect(isValidPhone('1234567890')).toBe(true);
    });

    it('should reject phone with letters', () => {
      expect(isValidPhone('123456789a')).toBe(false);
    });

    it('should reject too short number', () => {
      expect(isValidPhone('123456')).toBe(false);
    });

    it('should reject too long number', () => {
      expect(isValidPhone('12345678901234567890')).toBe(false);
    });

    it('should handle hyphens and spaces', () => {
      expect(isValidPhone('234-70-1234-5678')).toBe(true);
    });
  });

  describe('getTimeUntilExpiry', () => {
    it('should return positive seconds for future time', () => {
      const futureTime = new Date(Date.now() + 60000); // 60 seconds from now
      const seconds = getTimeUntilExpiry(futureTime);

      expect(seconds).toBeGreaterThan(0);
      expect(seconds).toBeLessThanOrEqual(60);
    });

    it('should return 0 for past time', () => {
      const pastTime = new Date(Date.now() - 1000);
      const seconds = getTimeUntilExpiry(pastTime);

      expect(seconds).toBe(0);
    });

    it('should return 0 for current time', () => {
      const now = new Date();
      const seconds = getTimeUntilExpiry(now);

      expect(seconds).toBeLessThanOrEqual(1);
    });

    it('should return approximate seconds', () => {
      const futureTime = new Date(Date.now() + 120000); // 2 minutes
      const seconds = getTimeUntilExpiry(futureTime);

      expect(seconds).toBeGreaterThan(100);
      expect(seconds).toBeLessThanOrEqual(120);
    });
  });

  describe('retryAsync', () => {
    it('should call function once on success', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      const result = await retryAsync(mockFn);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(result).toBe('success');
    });

    it('should retry on failure', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockResolvedValueOnce('success');

      const result = await retryAsync(mockFn, 3, 10);

      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(result).toBe('success');
    });

    it('should respect max retries', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Always fails'));

      await expect(retryAsync(mockFn, 2, 10)).rejects.toThrow();

      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should use default max retries', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Always fails'));

      await expect(retryAsync(mockFn, undefined, 10)).rejects.toThrow();

      expect(mockFn).toHaveBeenCalledTimes(3); // Default is 3
    });

    it('should resolve with final value', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValueOnce('success');

      const result = await retryAsync(mockFn, 2, 10);

      expect(result).toBe('success');
    });
  });
});
