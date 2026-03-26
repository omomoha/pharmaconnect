import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/shared/validators';

describe('Auth Validators', () => {
  describe('registerSchema', () => {
    const validData = {
      email: 'user@example.com',
      phoneNumber: '08012345678',
      firstName: 'John',
      lastName: 'Doe',
      password: 'Secure@123',
      role: 'customer' as const,
    };

    it('validates correct registration data', () => {
      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const result = registerSchema.safeParse({ ...validData, email: 'invalid' });
      expect(result.success).toBe(false);
    });

    it('rejects short first name', () => {
      const result = registerSchema.safeParse({ ...validData, firstName: 'J' });
      expect(result.success).toBe(false);
    });

    it('rejects short last name', () => {
      const result = registerSchema.safeParse({ ...validData, lastName: 'D' });
      expect(result.success).toBe(false);
    });

    it('rejects weak password - no uppercase', () => {
      const result = registerSchema.safeParse({ ...validData, password: 'secure@123' });
      expect(result.success).toBe(false);
    });

    it('rejects weak password - no special character', () => {
      const result = registerSchema.safeParse({ ...validData, password: 'Secure1234' });
      expect(result.success).toBe(false);
    });

    it('rejects weak password - too short', () => {
      const result = registerSchema.safeParse({ ...validData, password: 'Se@1' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid role', () => {
      const result = registerSchema.safeParse({ ...validData, role: 'superadmin' });
      expect(result.success).toBe(false);
    });

    it('accepts all valid roles', () => {
      const roles = ['customer', 'pharmacy_admin', 'delivery_admin', 'platform_admin', 'support_admin'];
      roles.forEach(role => {
        const result = registerSchema.safeParse({ ...validData, role });
        expect(result.success).toBe(true);
      });
    });

    it('allows optional address', () => {
      const result = registerSchema.safeParse({ ...validData, address: undefined });
      expect(result.success).toBe(true);
    });

    it('accepts address when provided', () => {
      const result = registerSchema.safeParse({ ...validData, address: '123 Main St' });
      expect(result.success).toBe(true);
    });
  });

  describe('loginSchema', () => {
    it('validates correct login data', () => {
      const result = loginSchema.safeParse({ email: 'user@test.com', password: 'pass123' });
      expect(result.success).toBe(true);
    });

    it('rejects empty password', () => {
      const result = loginSchema.safeParse({ email: 'user@test.com', password: '' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid email', () => {
      const result = loginSchema.safeParse({ email: 'not-email', password: 'pass' });
      expect(result.success).toBe(false);
    });

    it('rejects missing fields', () => {
      const result = loginSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('verifyOtpSchema', () => {
    it('validates correct OTP', () => {
      const result = verifyOtpSchema.safeParse({ email: 'user@test.com', otp: '123456' });
      expect(result.success).toBe(true);
    });

    it('rejects non-6-digit OTP', () => {
      const result = verifyOtpSchema.safeParse({ email: 'user@test.com', otp: '12345' });
      expect(result.success).toBe(false);
    });

    it('rejects OTP with letters', () => {
      const result = verifyOtpSchema.safeParse({ email: 'user@test.com', otp: 'abc123' });
      expect(result.success).toBe(false);
    });
  });

  describe('forgotPasswordSchema', () => {
    it('validates correct email', () => {
      const result = forgotPasswordSchema.safeParse({ email: 'user@test.com' });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const result = forgotPasswordSchema.safeParse({ email: 'invalid' });
      expect(result.success).toBe(false);
    });
  });

  describe('resetPasswordSchema', () => {
    it('validates correct reset data', () => {
      const result = resetPasswordSchema.safeParse({
        email: 'user@test.com',
        otp: '123456',
        newPassword: 'NewSecure@123',
        confirmPassword: 'NewSecure@123',
      });
      expect(result.success).toBe(true);
    });

    it('rejects weak new password', () => {
      const result = resetPasswordSchema.safeParse({
        email: 'user@test.com',
        otp: '123456',
        newPassword: 'weak',
        confirmPassword: 'weak',
      });
      expect(result.success).toBe(false);
    });
  });
});
