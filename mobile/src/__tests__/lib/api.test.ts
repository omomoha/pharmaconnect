import { apiClient } from '../../lib/api';
import auth from '@react-native-firebase/auth';

jest.mock('@react-native-firebase/auth');

declare const global: any;

describe('ApiClient', () => {
  const mockFetch = (global as any).fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('GET requests', () => {
    it('should make a successful GET request', async () => {
      const mockData = { id: '1', name: 'Test Pharmacy' };
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockData }),
      } as Response);

      (auth as jest.MockedFunction<typeof auth>).mockReturnValue({
        currentUser: null,
      } as any);

      const result = await apiClient.get('/pharmacies/1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/pharmacies/1'),
        expect.objectContaining({ headers: expect.any(Object) })
      );
    });

    it('should attach auth token when user is logged in', async () => {
      const mockToken = 'test-token-123';
      const mockUser = {
        getIdToken: jest.fn().mockResolvedValue(mockToken),
      };

      (auth as jest.MockedFunction<typeof auth>).mockReturnValue({
        currentUser: mockUser,
      } as any);

      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: {} }),
      } as Response);

      await apiClient.get('/test');

      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[1]?.headers).toEqual(
        expect.objectContaining({
          Authorization: `Bearer ${mockToken}`,
        })
      );
    });

    it('should handle GET request errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      (auth as jest.MockedFunction<typeof auth>).mockReturnValue({
        currentUser: null,
      } as any);

      const result = await apiClient.get('/pharmacies/1');

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Network error');
    });

    it('should set Content-Type header to application/json', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true }),
      } as Response);

      (auth as jest.MockedFunction<typeof auth>).mockReturnValue({
        currentUser: null,
      } as any);

      await apiClient.get('/test');

      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[1]?.headers).toEqual(
        expect.objectContaining({
          'Content-Type': 'application/json',
        })
      );
    });
  });

  describe('POST requests', () => {
    it('should make a successful POST request with body', async () => {
      const requestBody = { name: 'New Pharmacy' };
      const mockData = { id: '2', ...requestBody };

      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockData }),
      } as Response);

      (auth as jest.MockedFunction<typeof auth>).mockReturnValue({
        currentUser: null,
      } as any);

      const result = await apiClient.post('/pharmacies', requestBody);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/pharmacies'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestBody),
        })
      );
    });

    it('should make POST request without body when data is undefined', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true }),
      } as Response);

      (auth as jest.MockedFunction<typeof auth>).mockReturnValue({
        currentUser: null,
      } as any);

      await apiClient.post('/test');

      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[1]?.body).toBeUndefined();
    });

    it('should handle POST request errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Server error'));

      (auth as jest.MockedFunction<typeof auth>).mockReturnValue({
        currentUser: null,
      } as any);

      const result = await apiClient.post('/test', { data: 'test' });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Server error');
    });

    it('should attach token to POST request', async () => {
      const mockToken = 'post-token-456';
      const mockUser = {
        getIdToken: jest.fn().mockResolvedValue(mockToken),
      };

      (auth as jest.MockedFunction<typeof auth>).mockReturnValue({
        currentUser: mockUser,
      } as any);

      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true }),
      } as Response);

      await apiClient.post('/test', { data: 'test' });

      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[1]?.headers).toEqual(
        expect.objectContaining({
          Authorization: `Bearer ${mockToken}`,
        })
      );
    });
  });

  describe('PUT requests', () => {
    it('should make a successful PUT request', async () => {
      const updateData = { name: 'Updated Pharmacy' };
      const mockData = { id: '1', ...updateData };

      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockData }),
      } as Response);

      (auth as jest.MockedFunction<typeof auth>).mockReturnValue({
        currentUser: null,
      } as any);

      const result = await apiClient.put('/pharmacies/1', updateData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/pharmacies/1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        })
      );
    });

    it('should handle PUT request errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Update failed'));

      (auth as jest.MockedFunction<typeof auth>).mockReturnValue({
        currentUser: null,
      } as any);

      const result = await apiClient.put('/test', {});

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Update failed');
    });

    it('should attach auth header to PUT request', async () => {
      const mockToken = 'put-token-789';
      const mockUser = {
        getIdToken: jest.fn().mockResolvedValue(mockToken),
      };

      (auth as jest.MockedFunction<typeof auth>).mockReturnValue({
        currentUser: mockUser,
      } as any);

      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true }),
      } as Response);

      await apiClient.put('/test', { data: 'test' });

      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[1]?.headers).toEqual(
        expect.objectContaining({
          Authorization: `Bearer ${mockToken}`,
        })
      );
    });
  });

  describe('PATCH requests', () => {
    it('should make a successful PATCH request', async () => {
      const patchData = { status: 'active' };
      const mockData = { id: '1', ...patchData };

      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockData }),
      } as Response);

      (auth as jest.MockedFunction<typeof auth>).mockReturnValue({
        currentUser: null,
      } as any);

      const result = await apiClient.patch('/orders/1/cancel', patchData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/orders/1/cancel'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(patchData),
        })
      );
    });

    it('should handle PATCH request errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Patch failed'));

      (auth as jest.MockedFunction<typeof auth>).mockReturnValue({
        currentUser: null,
      } as any);

      const result = await apiClient.patch('/test', {});

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Patch failed');
    });

    it('should attach auth header to PATCH request', async () => {
      const mockToken = 'patch-token-000';
      const mockUser = {
        getIdToken: jest.fn().mockResolvedValue(mockToken),
      };

      (auth as jest.MockedFunction<typeof auth>).mockReturnValue({
        currentUser: mockUser,
      } as any);

      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true }),
      } as Response);

      await apiClient.patch('/test', { data: 'test' });

      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[1]?.headers).toEqual(
        expect.objectContaining({
          Authorization: `Bearer ${mockToken}`,
        })
      );
    });
  });

  describe('Error handling', () => {
    it('should catch non-Error exceptions in catch block', async () => {
      mockFetch.mockRejectedValueOnce('String error');

      (auth as jest.MockedFunction<typeof auth>).mockReturnValue({
        currentUser: null,
      } as any);

      const result = await apiClient.get('/test');

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Network error');
    });

    it('should handle JSON parse errors', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as unknown as Response);

      (auth as jest.MockedFunction<typeof auth>).mockReturnValue({
        currentUser: null,
      } as any);

      const result = await apiClient.get('/test');

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Invalid JSON');
    });

    it('should return error response structure on failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      (auth as jest.MockedFunction<typeof auth>).mockReturnValue({
        currentUser: null,
      } as any);

      const result = await apiClient.post('/test');

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('error');
      expect(result.success).toBe(false);
    });
  });

  describe('Auth header behavior', () => {
    it('should not include Authorization header when no user is logged in', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true }),
      } as Response);

      (auth as jest.MockedFunction<typeof auth>).mockReturnValue({
        currentUser: null,
      } as any);

      await apiClient.get('/test');

      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[1]?.headers).not.toHaveProperty('Authorization');
    });

    it('should include Content-Type in all requests', async () => {
      mockFetch.mockResolvedValue({
        json: async () => ({ success: true }),
      } as Response);

      (auth as jest.MockedFunction<typeof auth>).mockReturnValue({
        currentUser: null,
      } as any);

      const methods = [
        () => apiClient.get('/test'),
        () => apiClient.post('/test'),
        () => apiClient.put('/test'),
        () => apiClient.patch('/test'),
      ];

      for (const method of methods) {
        jest.clearAllMocks();
        await method();
        const callArgs = mockFetch.mock.calls[0];
        expect(callArgs[1]?.headers).toEqual(
          expect.objectContaining({
            'Content-Type': 'application/json',
          })
        );
      }
    });
  });
});
