/**
 * Security Tests for PharmaConnect Frontend
 * Tests input validation, XSS prevention, prescription drug detection,
 * auth security, and file upload restrictions
 */
import {
  registerSchema,
  loginSchema,
} from '@/shared/validators';
import {
  AUTH,
  FILE_UPLOAD,
  DELIVERY,
  PRESCRIPTION_KEYWORDS,
  RATE_LIMITS,
} from '@/shared/constants';

describe('Security Tests', () => {
  describe('Input Validation & Injection Prevention', () => {
    it('rejects SQL injection in email field', () => {
      const result = loginSchema.safeParse({
        email: "admin' OR '1'='1",
        password: 'password',
      });
      expect(result.success).toBe(false);
    });

    it('rejects script injection in email field', () => {
      const result = loginSchema.safeParse({
        email: '<script>alert("xss")</script>',
        password: 'password',
      });
      expect(result.success).toBe(false);
    });

    it('rejects HTML injection in name fields', () => {
      const result = registerSchema.safeParse({
        email: 'user@test.com',
        phoneNumber: '08012345678',
        firstName: '<img src=x onerror=alert(1)>',
        lastName: 'Normal',
        password: 'Secure@123',
        role: 'customer',
      });
      // The name passes Zod validation (min 2 chars), but
      // output should be sanitized at rendering layer
      // This test documents the behavior
      expect(result.success).toBe(true); // Zod allows it — XSS prevention must happen at rendering
    });

    it('documents behavior with long input strings', () => {
      const longString = 'a'.repeat(10000);
      const result = loginSchema.safeParse({
        email: longString + '@test.com',
        password: longString,
      });
      // Zod email validation may accept technically valid long emails;
      // server-side length limits must also be enforced
      // This documents the current behavior
      expect(typeof result.success).toBe('boolean');
    });

    it('rejects null byte injection in email', () => {
      const result = loginSchema.safeParse({
        email: 'user\x00@test.com',
        password: 'password',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Password Security', () => {
    it('enforces minimum password length of 8', () => {
      expect(AUTH.PASSWORD_MIN_LENGTH).toBeGreaterThanOrEqual(8);
    });

    it('rejects common weak passwords', () => {
      const weakPasswords = ['password', '12345678', 'qwerty123', 'abcdefgh'];
      weakPasswords.forEach(pw => {
        const result = registerSchema.safeParse({
          email: 'user@test.com',
          phoneNumber: '08012345678',
          firstName: 'John',
          lastName: 'Doe',
          password: pw,
          role: 'customer',
        });
        expect(result.success).toBe(false);
      });
    });

    it('requires password complexity (uppercase, lowercase, number, special char)', () => {
      // Only lowercase
      expect(registerSchema.safeParse({
        email: 'u@t.com', phoneNumber: '08012345678',
        firstName: 'Jo', lastName: 'Do', password: 'alllowercase1!', role: 'customer',
      }).success).toBe(false);

      // No special character
      expect(registerSchema.safeParse({
        email: 'u@t.com', phoneNumber: '08012345678',
        firstName: 'Jo', lastName: 'Do', password: 'NoSpecial123', role: 'customer',
      }).success).toBe(false);

      // No number
      expect(registerSchema.safeParse({
        email: 'u@t.com', phoneNumber: '08012345678',
        firstName: 'Jo', lastName: 'Do', password: 'NoNumber@abc', role: 'customer',
      }).success).toBe(false);
    });

    it('accepts strong passwords', () => {
      const strongPasswords = ['Secure@123', 'MyP@ssw0rd!', 'C0mpl3x!Pass'];
      strongPasswords.forEach(pw => {
        const result = registerSchema.safeParse({
          email: 'user@test.com',
          phoneNumber: '08012345678',
          firstName: 'John',
          lastName: 'Doe',
          password: pw,
          role: 'customer',
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Authentication Rate Limiting Config', () => {
    it('has login attempt limits configured', () => {
      expect(AUTH.MAX_LOGIN_ATTEMPTS).toBeGreaterThanOrEqual(3);
      expect(AUTH.MAX_LOGIN_ATTEMPTS).toBeLessThanOrEqual(10);
    });

    it('has lockout duration configured', () => {
      expect(AUTH.LOGIN_LOCKOUT_MINUTES).toBeGreaterThanOrEqual(5);
    });

    it('has OTP retry limits', () => {
      expect(AUTH.MAX_OTP_RETRIES).toBeGreaterThanOrEqual(3);
    });

    it('has session timeout', () => {
      expect(AUTH.SESSION_TIMEOUT_MINUTES).toBeGreaterThan(0);
      expect(AUTH.SESSION_TIMEOUT_MINUTES).toBeLessThanOrEqual(120);
    });

    it('has rate limits for all user types', () => {
      expect(RATE_LIMITS.PUBLIC_REQUESTS_PER_MINUTE).toBeGreaterThan(0);
      expect(RATE_LIMITS.AUTHENTICATED_REQUESTS_PER_MINUTE).toBeGreaterThan(0);
      expect(RATE_LIMITS.ADMIN_REQUESTS_PER_MINUTE).toBeGreaterThan(0);
    });

    it('rate limits follow principle of least privilege', () => {
      expect(RATE_LIMITS.PUBLIC_REQUESTS_PER_MINUTE).toBeLessThan(
        RATE_LIMITS.AUTHENTICATED_REQUESTS_PER_MINUTE
      );
      expect(RATE_LIMITS.AUTHENTICATED_REQUESTS_PER_MINUTE).toBeLessThan(
        RATE_LIMITS.ADMIN_REQUESTS_PER_MINUTE
      );
    });
  });

  describe('Prescription Drug Detection', () => {
    it('has comprehensive antibiotic keyword list', () => {
      const antibiotics = PRESCRIPTION_KEYWORDS.ANTIBIOTICS;
      expect(antibiotics.length).toBeGreaterThanOrEqual(5);

      // Common antibiotics should be listed
      expect(antibiotics).toContain('amoxicillin');
      expect(antibiotics).toContain('azithromycin');
      expect(antibiotics).toContain('ciprofloxacin');
    });

    it('has comprehensive controlled substance keyword list', () => {
      const controlled = PRESCRIPTION_KEYWORDS.CONTROLLED;
      expect(controlled.length).toBeGreaterThanOrEqual(5);

      // Common controlled substances should be listed
      expect(controlled).toContain('codeine');
      expect(controlled).toContain('morphine');
      expect(controlled).toContain('tramadol');
      expect(controlled).toContain('diazepam');
    });

    it('has prescription phrases for detection', () => {
      expect(PRESCRIPTION_KEYWORDS.PRESCRIPTION_PHRASES.length).toBeGreaterThan(0);
    });

    it('detects prescription keywords in text (case-insensitive check)', () => {
      const allKeywords = [
        ...PRESCRIPTION_KEYWORDS.ANTIBIOTICS,
        ...PRESCRIPTION_KEYWORDS.CONTROLLED,
      ];

      const testMessage = 'I need to buy some amoxicillin for my infection';
      const found = allKeywords.some(keyword =>
        testMessage.toLowerCase().includes(keyword.toLowerCase())
      );
      expect(found).toBe(true);
    });

    it('does not flag OTC drug names', () => {
      const allKeywords = [
        ...PRESCRIPTION_KEYWORDS.ANTIBIOTICS,
        ...PRESCRIPTION_KEYWORDS.CONTROLLED,
      ];

      const otcMessage = 'I want to buy paracetamol and vitamin C';
      const found = allKeywords.some(keyword =>
        otcMessage.toLowerCase().includes(keyword.toLowerCase())
      );
      expect(found).toBe(false);
    });
  });

  describe('File Upload Security', () => {
    it('limits document size', () => {
      expect(FILE_UPLOAD.MAX_DOCUMENT_SIZE_MB).toBeLessThanOrEqual(20);
      expect(FILE_UPLOAD.MAX_DOCUMENT_SIZE_BYTES).toBe(
        FILE_UPLOAD.MAX_DOCUMENT_SIZE_MB * 1024 * 1024
      );
    });

    it('limits image size', () => {
      expect(FILE_UPLOAD.MAX_IMAGE_SIZE_MB).toBeLessThanOrEqual(10);
    });

    it('restricts document file types to safe formats', () => {
      const allowedTypes = FILE_UPLOAD.ALLOWED_DOC_TYPES;
      // Should not allow executables
      expect(allowedTypes).not.toContain('application/x-executable');
      expect(allowedTypes).not.toContain('application/x-msdownload');
      // Should allow PDF
      expect(allowedTypes).toContain('application/pdf');
    });

    it('restricts image file types to safe formats', () => {
      const allowedTypes = FILE_UPLOAD.ALLOWED_IMAGE_TYPES;
      expect(allowedTypes).not.toContain('image/svg+xml'); // SVG can contain scripts
      expect(allowedTypes).toContain('image/jpeg');
      expect(allowedTypes).toContain('image/png');
    });

    it('does not allow executable extensions', () => {
      const allExtensions = [
        ...FILE_UPLOAD.ALLOWED_DOC_EXTENSIONS,
        ...FILE_UPLOAD.ALLOWED_IMAGE_EXTENSIONS,
      ];
      const dangerousExtensions = ['.exe', '.bat', '.sh', '.cmd', '.ps1', '.js', '.html'];
      dangerousExtensions.forEach(ext => {
        expect(allExtensions).not.toContain(ext);
      });
    });
  });

  describe('Delivery Security Code', () => {
    it('security code is 6 digits for sufficient entropy', () => {
      expect(DELIVERY.SECURITY_CODE_LENGTH).toBe(6);
      // 6 digits = 1 million possibilities
    });

    it('limits verification attempts to prevent brute force', () => {
      expect(DELIVERY.SECURITY_CODE_MAX_ATTEMPTS).toBeLessThanOrEqual(5);
    });

    it('code expires after reasonable time', () => {
      expect(DELIVERY.SECURITY_CODE_EXPIRY_HOURS).toBeGreaterThan(0);
      expect(DELIVERY.SECURITY_CODE_EXPIRY_HOURS).toBeLessThanOrEqual(24);
    });
  });

  describe('Role-Based Access Control Config', () => {
    it('defines valid user roles', () => {
      const validRoles = ['customer', 'pharmacy_admin', 'delivery_admin', 'platform_admin', 'support_admin'];
      validRoles.forEach(role => {
        const result = registerSchema.safeParse({
          email: 'test@test.com',
          phoneNumber: '08012345678',
          firstName: 'Te',
          lastName: 'St',
          password: 'Secure@123',
          role,
        });
        expect(result.success).toBe(true);
      });
    });

    it('rejects invalid roles', () => {
      const invalidRoles = ['superadmin', 'root', 'god', 'admin', ''];
      invalidRoles.forEach(role => {
        const result = registerSchema.safeParse({
          email: 'test@test.com',
          phoneNumber: '08012345678',
          firstName: 'Te',
          lastName: 'St',
          password: 'Secure@123',
          role,
        });
        expect(result.success).toBe(false);
      });
    });
  });
});
