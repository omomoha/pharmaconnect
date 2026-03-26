/**
 * Authentication Middleware Tests
 * Tests for Firebase ID token verification and user info attachment
 */

import { Response, NextFunction } from 'express';
import { authenticate, optionalAuthenticate, AuthenticatedRequest } from '../../middleware/authenticate';
import { getAuth } from '../../config/firebase';
import { createAuthMock } from '../mocks/firestore.mock';

jest.mock('../../config/firebase');
jest.mock('../../utils/logger');

const mockAuth = createAuthMock();

describe('Authentication Middleware', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock<NextFunction>;
  let mockJsonRes: jest.Mock;
  let mockStatusRes: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockJsonRes = jest.fn().mockReturnValue({});
    mockStatusRes = jest.fn().mockReturnValue({ json: mockJsonRes });

    mockReq = {
      headers: {},
    };

    mockRes = {
      status: mockStatusRes,
      json: mockJsonRes,
    };

    mockNext = jest.fn();
    (getAuth as jest.Mock).mockReturnValue(mockAuth);
  });

  describe('authenticate middleware', () => {
    it('should return 401 if no authorization header', async () => {
      await authenticate(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext as NextFunction
      );

      expect(mockStatusRes).toHaveBeenCalledWith(401);
      expect(mockJsonRes).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if authorization header is malformed', async () => {
      mockReq.headers = {
        authorization: 'InvalidFormat token',
      };

      await authenticate(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext as NextFunction
      );

      expect(mockStatusRes).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should verify token and set user info on success', async () => {
      mockReq.headers = {
        authorization: 'Bearer valid-token',
      };

      await authenticate(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext as NextFunction
      );

      expect(mockReq.user).toBeDefined();
      expect(mockReq.user?.uid).toBe('test-user-123');
      expect(mockReq.user?.email).toBe('test@example.com');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should attach token to request', async () => {
      mockReq.headers = {
        authorization: 'Bearer valid-token',
      };

      await authenticate(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext as NextFunction
      );

      expect(mockReq.token).toBe('valid-token');
    });

    it('should attach user role from custom claims', async () => {
      mockReq.headers = {
        authorization: 'Bearer valid-token',
      };

      await authenticate(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext as NextFunction
      );

      expect(mockReq.user?.role).toBe('customer');
    });

    it('should return 401 for invalid token', async () => {
      mockReq.headers = {
        authorization: 'Bearer invalid-token',
      };

      const mockAuthWithError = {
        verifyIdToken: jest.fn().mockRejectedValue(new Error('Invalid token')),
      };

      (getAuth as jest.Mock).mockReturnValue(mockAuthWithError);

      await authenticate(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext as NextFunction
      );

      expect(mockStatusRes).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for expired token', async () => {
      mockReq.headers = {
        authorization: 'Bearer expired-token',
      };

      const mockAuthWithError = {
        verifyIdToken: jest.fn().mockRejectedValue(new Error('Token has expired')),
      };

      (getAuth as jest.Mock).mockReturnValue(mockAuthWithError);

      await authenticate(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext as NextFunction
      );

      expect(mockStatusRes).toHaveBeenCalledWith(401);
      const responseBody = mockJsonRes.mock.calls[0][0];
      expect(responseBody.error.code).toBe('TOKEN_EXPIRED');
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuthenticate middleware', () => {
    it('should call next without authentication if no token', async () => {
      mockReq.headers = {};

      await optionalAuthenticate(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeUndefined();
    });

    it('should authenticate if valid token is provided', async () => {
      mockReq.headers = {
        authorization: 'Bearer valid-token',
      };

      await optionalAuthenticate(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext as NextFunction
      );

      expect(mockReq.user).toBeDefined();
      expect(mockReq.user?.uid).toBe('test-user-123');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without error if invalid token provided', async () => {
      mockReq.headers = {
        authorization: 'Bearer invalid-token',
      };

      const mockAuthWithError = {
        verifyIdToken: jest.fn().mockRejectedValue(new Error('Invalid token')),
      };

      (getAuth as jest.Mock).mockReturnValue(mockAuthWithError);

      await optionalAuthenticate(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockStatusRes).not.toHaveBeenCalled();
    });

    it('should continue without error if token verification fails', async () => {
      mockReq.headers = {
        authorization: 'Bearer malformed-token',
      };

      const mockAuthWithError = {
        verifyIdToken: jest.fn().mockRejectedValue(new Error('Verification failed')),
      };

      (getAuth as jest.Mock).mockReturnValue(mockAuthWithError);

      await optionalAuthenticate(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should set user role if token is valid', async () => {
      mockReq.headers = {
        authorization: 'Bearer valid-token',
      };

      await optionalAuthenticate(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext as NextFunction
      );

      expect(mockReq.user?.role).toBe('customer');
    });
  });

  describe('Bearer token extraction', () => {
    it('should extract token from Bearer header', async () => {
      const token = 'test-token-12345';
      mockReq.headers = {
        authorization: `Bearer ${token}`,
      };

      await authenticate(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext as NextFunction
      );

      expect(mockReq.token).toBe(token);
    });

    it('should handle token with special characters', async () => {
      const token = 'token.with.dots_and-dashes';
      mockReq.headers = {
        authorization: `Bearer ${token}`,
      };

      await authenticate(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext as NextFunction
      );

      expect(mockReq.token).toBe(token);
    });

    it('should not extract token if not using Bearer scheme', async () => {
      mockReq.headers = {
        authorization: 'Basic base64string',
      };

      await authenticate(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext as NextFunction
      );

      expect(mockStatusRes).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should be case insensitive for Bearer scheme', async () => {
      const token = 'test-token';
      mockReq.headers = {
        authorization: `bearer ${token}`,
      };

      await authenticate(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
