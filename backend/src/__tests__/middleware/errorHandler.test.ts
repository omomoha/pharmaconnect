/**
 * Error Handler Middleware Tests
 * Tests for error handling and 404 responses
 */

import { Request, Response, NextFunction } from 'express';
import {
  errorHandler,
  notFoundHandler,
  createAppError,
  asyncHandler,
} from '../../middleware/errorHandler';

jest.mock('../../utils/logger');

describe('Error Handler Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock<NextFunction>;
  let mockJsonRes: jest.Mock;
  let mockStatusRes: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockJsonRes = jest.fn().mockReturnValue({});
    mockStatusRes = jest.fn().mockReturnValue({ json: mockJsonRes });

    mockReq = {
      url: '/api/test',
      method: 'GET',
    };

    mockRes = {
      status: mockStatusRes,
      json: mockJsonRes,
    };

    mockNext = jest.fn();
  });

  describe('errorHandler middleware', () => {
    it('should return 500 for generic errors', () => {
      const error = new Error('Something went wrong');

      errorHandler(
        error,
        mockReq as Request,
        mockRes as Response,
        mockNext as NextFunction
      );

      expect(mockStatusRes).toHaveBeenCalledWith(500);
      expect(mockJsonRes).toHaveBeenCalled();
    });

    it('should return custom status code if provided', () => {
      const error = createAppError('Not found', 404, 'NOT_FOUND');

      errorHandler(
        error,
        mockReq as Request,
        mockRes as Response,
        mockNext as NextFunction
      );

      expect(mockStatusRes).toHaveBeenCalledWith(404);
    });

    it('should return error in correct format', () => {
      const error = createAppError('Invalid input', 400, 'VALIDATION_ERROR');

      errorHandler(
        error,
        mockReq as Request,
        mockRes as Response,
        mockNext as NextFunction
      );

      const responseBody = mockJsonRes.mock.calls[0][0];
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toBeDefined();
      expect(responseBody.error.code).toBe('VALIDATION_ERROR');
      expect(responseBody.error.message).toBe('Invalid input');
    });

    it('should include error details if provided', () => {
      const details = { field: 'email', issue: 'invalid format' };
      const error = createAppError('Invalid input', 400, 'VALIDATION_ERROR', details);

      errorHandler(
        error,
        mockReq as Request,
        mockRes as Response,
        mockNext as NextFunction
      );

      const responseBody = mockJsonRes.mock.calls[0][0];
      expect(responseBody.error.details).toEqual(details);
    });

    it('should default to INTERNAL_SERVER_ERROR code', () => {
      const error = new Error('Unknown error');

      errorHandler(
        error,
        mockReq as Request,
        mockRes as Response,
        mockNext as NextFunction
      );

      const responseBody = mockJsonRes.mock.calls[0][0];
      expect(responseBody.error.code).toBe('INTERNAL_SERVER_ERROR');
    });

    it('should default to 500 status code', () => {
      const error = new Error('Unknown error');

      errorHandler(
        error,
        mockReq as Request,
        mockRes as Response,
        mockNext as NextFunction
      );

      expect(mockStatusRes).toHaveBeenCalledWith(500);
    });

    it('should handle client errors (4xx)', () => {
      const error = createAppError('Unauthorized', 401, 'UNAUTHORIZED');

      errorHandler(
        error,
        mockReq as Request,
        mockRes as Response,
        mockNext as NextFunction
      );

      expect(mockStatusRes).toHaveBeenCalledWith(401);
      const responseBody = mockJsonRes.mock.calls[0][0];
      expect(responseBody.error.code).toBe('UNAUTHORIZED');
    });

    it('should handle server errors (5xx)', () => {
      const error = createAppError('Database error', 503, 'SERVICE_UNAVAILABLE');

      errorHandler(
        error,
        mockReq as Request,
        mockRes as Response,
        mockNext as NextFunction
      );

      expect(mockStatusRes).toHaveBeenCalledWith(503);
    });
  });

  describe('notFoundHandler middleware', () => {
    it('should return 404 for unknown routes', () => {
      notFoundHandler(
        mockReq as Request,
        mockRes as Response,
        mockNext as NextFunction
      );

      expect(mockStatusRes).toHaveBeenCalledWith(404);
    });

    it('should return NOT_FOUND error code', () => {
      notFoundHandler(
        mockReq as Request,
        mockRes as Response,
        mockNext as NextFunction
      );

      const responseBody = mockJsonRes.mock.calls[0][0];
      expect(responseBody.error.code).toBe('NOT_FOUND');
    });

    it('should include route information in message', () => {
      mockReq = {
        method: 'POST',
        path: '/api/nonexistent',
      };

      notFoundHandler(
        mockReq as Request,
        mockRes as Response,
        mockNext as NextFunction
      );

      const responseBody = mockJsonRes.mock.calls[0][0];
      expect(responseBody.error.message).toContain('POST');
      expect(responseBody.error.message).toContain('/api/nonexistent');
    });

    it('should set success to false', () => {
      notFoundHandler(
        mockReq as Request,
        mockRes as Response,
        mockNext as NextFunction
      );

      const responseBody = mockJsonRes.mock.calls[0][0];
      expect(responseBody.success).toBe(false);
    });
  });

  describe('createAppError utility', () => {
    it('should create error with default values', () => {
      const error = createAppError('Test error');

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_SERVER_ERROR');
    });

    it('should create error with custom status code', () => {
      const error = createAppError('Not found', 404);

      expect(error.statusCode).toBe(404);
    });

    it('should create error with custom code', () => {
      const error = createAppError('Unauthorized', 401, 'UNAUTHORIZED');

      expect(error.code).toBe('UNAUTHORIZED');
    });

    it('should create error with details', () => {
      const details = { field: 'password', reason: 'too short' };
      const error = createAppError('Invalid input', 400, 'VALIDATION_ERROR', details);

      expect(error.details).toEqual(details);
    });

    it('should be instanceof Error', () => {
      const error = createAppError('Test');

      expect(error instanceof Error).toBe(true);
    });
  });

  describe('asyncHandler utility', () => {
    it('should wrap async function and pass through arguments', async () => {
      const mockFn = jest.fn().mockResolvedValue(undefined);
      const wrapped = asyncHandler(mockFn);

      await wrapped(
        mockReq as Request,
        mockRes as Response,
        mockNext as NextFunction
      );

      expect(mockFn).toHaveBeenCalledWith(
        mockReq,
        mockRes,
        mockNext
      );
    });

    it('should call next with error on rejection', async () => {
      const testError = new Error('Async error');
      const mockFn = jest.fn().mockRejectedValue(testError);
      const wrapped = asyncHandler(mockFn);

      const mockNextError = jest.fn();
      await wrapped(
        mockReq as Request,
        mockRes as Response,
        mockNextError as NextFunction
      );

      expect(mockNextError).toHaveBeenCalledWith(testError);
    });

    it('should resolve successfully for normal execution', async () => {
      const mockFn = jest.fn().mockResolvedValue(undefined);
      const wrapped = asyncHandler(mockFn);

      const result = await wrapped(
        mockReq as Request,
        mockRes as Response,
        mockNext as NextFunction
      );

      expect(result).toBeUndefined();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return a function', () => {
      const mockFn = jest.fn().mockResolvedValue(undefined);
      const wrapped = asyncHandler(mockFn);

      expect(typeof wrapped).toBe('function');
    });

    it('should handle Promise rejections with custom errors', async () => {
      const customError = createAppError('Custom error', 422, 'CUSTOM_CODE');
      const mockFn = jest.fn().mockRejectedValue(customError);
      const wrapped = asyncHandler(mockFn);

      const mockNextError = jest.fn();
      await wrapped(
        mockReq as Request,
        mockRes as Response,
        mockNextError as NextFunction
      );

      expect(mockNextError).toHaveBeenCalledWith(customError);
    });
  });

  describe('Error response format', () => {
    it('should not include data field in error response', () => {
      const error = createAppError('Test error', 400);

      errorHandler(
        error,
        mockReq as Request,
        mockRes as Response,
        mockNext as NextFunction
      );

      const responseBody = mockJsonRes.mock.calls[0][0];
      expect(responseBody.data).toBeUndefined();
    });

    it('should include success: false', () => {
      const error = new Error('Test');

      errorHandler(
        error,
        mockReq as Request,
        mockRes as Response,
        mockNext as NextFunction
      );

      const responseBody = mockJsonRes.mock.calls[0][0];
      expect(responseBody.success).toBe(false);
    });
  });
});
