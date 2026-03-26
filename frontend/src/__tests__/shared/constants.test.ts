import {
  AUTH,
  PAGINATION,
  RATE_LIMITS,
  FILE_UPLOAD,
  DELIVERY,
  COMMISSION,
  SEARCH,
  PRESCRIPTION_KEYWORDS,
} from '@/shared/constants';

describe('Constants', () => {
  describe('AUTH constants', () => {
    it('has sensible OTP expiry', () => {
      expect(AUTH.OTP_EXPIRY_MINUTES).toBeGreaterThan(0);
      expect(AUTH.OTP_EXPIRY_MINUTES).toBeLessThanOrEqual(15);
    });

    it('limits login attempts', () => {
      expect(AUTH.MAX_LOGIN_ATTEMPTS).toBeGreaterThanOrEqual(3);
      expect(AUTH.MAX_LOGIN_ATTEMPTS).toBeLessThanOrEqual(10);
    });

    it('enforces minimum password length of 8', () => {
      expect(AUTH.PASSWORD_MIN_LENGTH).toBeGreaterThanOrEqual(8);
    });

    it('has lockout period', () => {
      expect(AUTH.LOGIN_LOCKOUT_MINUTES).toBeGreaterThan(0);
    });
  });

  describe('PAGINATION constants', () => {
    it('has valid default and max limits', () => {
      expect(PAGINATION.DEFAULT_LIMIT).toBeGreaterThan(0);
      expect(PAGINATION.MAX_LIMIT).toBeGreaterThan(PAGINATION.DEFAULT_LIMIT);
      expect(PAGINATION.MIN_LIMIT).toBe(1);
    });
  });

  describe('RATE_LIMITS constants', () => {
    it('authenticated users have higher limits than public', () => {
      expect(RATE_LIMITS.AUTHENTICATED_REQUESTS_PER_MINUTE).toBeGreaterThan(
        RATE_LIMITS.PUBLIC_REQUESTS_PER_MINUTE
      );
    });

    it('admin has highest rate limits', () => {
      expect(RATE_LIMITS.ADMIN_REQUESTS_PER_MINUTE).toBeGreaterThan(
        RATE_LIMITS.AUTHENTICATED_REQUESTS_PER_MINUTE
      );
    });

    it('chat has reasonable rate limit', () => {
      expect(RATE_LIMITS.CHAT_MESSAGES_PER_MINUTE).toBeGreaterThan(0);
      expect(RATE_LIMITS.CHAT_MESSAGES_PER_MINUTE).toBeLessThanOrEqual(60);
    });
  });

  describe('FILE_UPLOAD constants', () => {
    it('document size limit matches bytes', () => {
      expect(FILE_UPLOAD.MAX_DOCUMENT_SIZE_BYTES).toBe(
        FILE_UPLOAD.MAX_DOCUMENT_SIZE_MB * 1024 * 1024
      );
    });

    it('image size limit matches bytes', () => {
      expect(FILE_UPLOAD.MAX_IMAGE_SIZE_BYTES).toBe(
        FILE_UPLOAD.MAX_IMAGE_SIZE_MB * 1024 * 1024
      );
    });

    it('allows PDF for documents', () => {
      expect(FILE_UPLOAD.ALLOWED_DOC_TYPES).toContain('application/pdf');
    });

    it('allows common image types', () => {
      expect(FILE_UPLOAD.ALLOWED_IMAGE_TYPES).toContain('image/jpeg');
      expect(FILE_UPLOAD.ALLOWED_IMAGE_TYPES).toContain('image/png');
    });
  });

  describe('DELIVERY constants', () => {
    it('security code is 6 digits', () => {
      expect(DELIVERY.SECURITY_CODE_LENGTH).toBe(6);
    });

    it('limits security code attempts', () => {
      expect(DELIVERY.SECURITY_CODE_MAX_ATTEMPTS).toBeGreaterThanOrEqual(3);
    });

    it('has reasonable GPS update interval', () => {
      expect(DELIVERY.GPS_UPDATE_INTERVAL_SECONDS).toBeGreaterThanOrEqual(5);
      expect(DELIVERY.GPS_UPDATE_INTERVAL_SECONDS).toBeLessThanOrEqual(60);
    });
  });

  describe('COMMISSION constants', () => {
    it('total commissions are reasonable (under 25%)', () => {
      const total =
        COMMISSION.PHARMACY_COMMISSION_PERCENT +
        COMMISSION.DELIVERY_COMMISSION_PERCENT +
        COMMISSION.SERVICE_FEE_PERCENT;
      expect(total).toBeLessThanOrEqual(25);
    });

    it('all commissions are positive', () => {
      expect(COMMISSION.PHARMACY_COMMISSION_PERCENT).toBeGreaterThan(0);
      expect(COMMISSION.DELIVERY_COMMISSION_PERCENT).toBeGreaterThan(0);
      expect(COMMISSION.SERVICE_FEE_PERCENT).toBeGreaterThan(0);
    });
  });

  describe('SEARCH constants', () => {
    it('max radius is larger than default', () => {
      expect(SEARCH.MAX_RADIUS_KM).toBeGreaterThan(SEARCH.DEFAULT_RADIUS_KM);
    });
  });

  describe('PRESCRIPTION_KEYWORDS', () => {
    it('contains antibiotic keywords', () => {
      expect(PRESCRIPTION_KEYWORDS.ANTIBIOTICS.length).toBeGreaterThan(0);
      expect(PRESCRIPTION_KEYWORDS.ANTIBIOTICS).toContain('amoxicillin');
    });

    it('contains controlled substance keywords', () => {
      expect(PRESCRIPTION_KEYWORDS.CONTROLLED.length).toBeGreaterThan(0);
      expect(PRESCRIPTION_KEYWORDS.CONTROLLED).toContain('codeine');
      expect(PRESCRIPTION_KEYWORDS.CONTROLLED).toContain('tramadol');
    });

    it('contains prescription phrases', () => {
      expect(PRESCRIPTION_KEYWORDS.PRESCRIPTION_PHRASES.length).toBeGreaterThan(0);
    });
  });
});
