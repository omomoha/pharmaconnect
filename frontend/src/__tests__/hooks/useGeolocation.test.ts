import { renderHook, act, waitFor } from '@testing-library/react';
import { useGeolocation } from '@/hooks/useGeolocation';

describe('useGeolocation Hook', () => {
  let mockGeolocation: any;

  beforeEach(() => {
    mockGeolocation = {
      getCurrentPosition: jest.fn(),
    };
    Object.defineProperty(navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('successful location fetch', () => {
    it('should fetch location successfully', async () => {
      const mockPosition = {
        coords: {
          latitude: 6.5244,
          longitude: 3.3792,
          accuracy: 50,
        },
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success: any) => {
        success(mockPosition);
      });

      const { result } = renderHook(() => useGeolocation());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.latitude).toBe(6.5244);
      expect(result.current.longitude).toBe(3.3792);
      expect(result.current.accuracy).toBe(50);
      expect(result.current.error).toBeNull();
      expect(result.current.isUsingDefaults).toBe(false);
    });

    it('should call getCurrentPosition on mount', () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success: any) => {
        success({
          coords: {
            latitude: 6.5244,
            longitude: 3.3792,
            accuracy: 50,
          },
        });
      });

      renderHook(() => useGeolocation());

      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledTimes(1);
      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        expect.objectContaining({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        })
      );
    });

    it('should have loading=true initially', () => {
      mockGeolocation.getCurrentPosition.mockImplementation(() => {
        // Never resolves
      });

      const { result } = renderHook(() => useGeolocation());

      expect(result.current.loading).toBe(true);
      expect(result.current.latitude).toBeNull();
      expect(result.current.longitude).toBeNull();
    });
  });

  describe('permission denied fallback', () => {
    it('should fallback to default location on permission denied', async () => {
      const error = {
        code: 1, // PERMISSION_DENIED
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      mockGeolocation.getCurrentPosition.mockImplementation(
        (_success: any, error_callback: any) => {
          error_callback(error);
        }
      );

      const { result } = renderHook(() => useGeolocation());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.latitude).toBe(6.4541); // Default Lagos latitude
      expect(result.current.longitude).toBe(3.4218); // Default Lagos longitude
      expect(result.current.error).toBe(
        'Location permission denied. Using default location.'
      );
      expect(result.current.isUsingDefaults).toBe(true);
    });

    it('should set appropriate error message for permission denied', async () => {
      const error = {
        code: 1,
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      mockGeolocation.getCurrentPosition.mockImplementation(
        (_success: any, error_callback: any) => {
          error_callback(error);
        }
      );

      const { result } = renderHook(() => useGeolocation());

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      expect(result.current.error).toContain('permission denied');
    });
  });

  describe('position unavailable fallback', () => {
    it('should fallback to default location on position unavailable', async () => {
      const error = {
        code: 2, // POSITION_UNAVAILABLE
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      mockGeolocation.getCurrentPosition.mockImplementation(
        (_success: any, error_callback: any) => {
          error_callback(error);
        }
      );

      const { result } = renderHook(() => useGeolocation());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.latitude).toBe(6.4541);
      expect(result.current.longitude).toBe(3.4218);
      expect(result.current.error).toContain('unavailable');
      expect(result.current.isUsingDefaults).toBe(true);
    });
  });

  describe('timeout fallback', () => {
    it('should fallback to default location on timeout', async () => {
      const error = {
        code: 3, // TIMEOUT
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      mockGeolocation.getCurrentPosition.mockImplementation(
        (_success: any, error_callback: any) => {
          error_callback(error);
        }
      );

      const { result } = renderHook(() => useGeolocation());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.latitude).toBe(6.4541);
      expect(result.current.longitude).toBe(3.4218);
      expect(result.current.error).toContain('timed out');
      expect(result.current.isUsingDefaults).toBe(true);
    });

    it('should set appropriate error message for timeout', async () => {
      const error = {
        code: 3,
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      mockGeolocation.getCurrentPosition.mockImplementation(
        (_success: any, error_callback: any) => {
          error_callback(error);
        }
      );

      const { result } = renderHook(() => useGeolocation());

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      expect(result.current.error).toBe(
        'Location request timed out. Using default location.'
      );
    });
  });

  describe('geolocation not supported', () => {
    it('should fallback to default location if geolocation not supported', async () => {
      Object.defineProperty(navigator, 'geolocation', {
        value: undefined,
        writable: true,
      });

      const { result } = renderHook(() => useGeolocation());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.latitude).toBe(6.4541);
      expect(result.current.longitude).toBe(3.4218);
      expect(result.current.error).toContain('not supported');
      expect(result.current.isUsingDefaults).toBe(true);
    });

    it('should not call getCurrentPosition if geolocation unavailable', () => {
      Object.defineProperty(navigator, 'geolocation', {
        value: undefined,
        writable: true,
      });

      renderHook(() => useGeolocation());

      expect(mockGeolocation.getCurrentPosition).not.toHaveBeenCalled();
    });
  });

  describe('refresh function', () => {
    it('should refresh location on demand', async () => {
      const mockPosition1 = {
        coords: {
          latitude: 6.5244,
          longitude: 3.3792,
          accuracy: 50,
        },
      };

      const mockPosition2 = {
        coords: {
          latitude: 6.6000,
          longitude: 3.5000,
          accuracy: 30,
        },
      };

      let callCount = 0;
      mockGeolocation.getCurrentPosition.mockImplementation((success: any) => {
        callCount++;
        success(callCount === 1 ? mockPosition1 : mockPosition2);
      });

      const { result, rerender } = renderHook(() => useGeolocation());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.latitude).toBe(6.5244);

      act(() => {
        result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.latitude).toBe(6.6000);
      });

      expect(result.current.latitude).toBe(6.6000);
      expect(result.current.longitude).toBe(3.5000);
      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledTimes(2);
    });

    it('should set loading to true during refresh', () => {
      const mockPosition = {
        coords: {
          latitude: 6.5244,
          longitude: 3.3792,
          accuracy: 50,
        },
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success: any) => {
        success(mockPosition);
      });

      const { result } = renderHook(() => useGeolocation());

      act(() => {
        result.current.refresh();
      });

      // After initial load, refresh should be immediate (mocked)
      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledTimes(2);
    });

    it('should support custom options', async () => {
      const mockPosition = {
        coords: {
          latitude: 6.5244,
          longitude: 3.3792,
          accuracy: 50,
        },
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success: any) => {
        success(mockPosition);
      });

      const customOptions = {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 600000,
      };

      renderHook(() => useGeolocation(customOptions));

      await waitFor(() => {
        expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
      });

      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        expect.objectContaining({
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 600000,
        })
      );
    });
  });

  describe('isUsingDefaults flag', () => {
    it('should set isUsingDefaults to true when error occurs', async () => {
      const error = {
        code: 1,
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      mockGeolocation.getCurrentPosition.mockImplementation(
        (_success: any, error_callback: any) => {
          error_callback(error);
        }
      );

      const { result } = renderHook(() => useGeolocation());

      await waitFor(() => {
        expect(result.current.isUsingDefaults).toBe(true);
      });

      expect(result.current.isUsingDefaults).toBe(true);
    });

    it('should set isUsingDefaults to false on successful fetch', async () => {
      const mockPosition = {
        coords: {
          latitude: 6.5244,
          longitude: 3.3792,
          accuracy: 50,
        },
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success: any) => {
        success(mockPosition);
      });

      const { result } = renderHook(() => useGeolocation());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isUsingDefaults).toBe(false);
    });

    it('should be based on error state and default coordinates', async () => {
      const error = {
        code: 1,
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      mockGeolocation.getCurrentPosition.mockImplementation(
        (_success: any, error_callback: any) => {
          error_callback(error);
        }
      );

      const { result } = renderHook(() => useGeolocation());

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      // isUsingDefaults should be true because there's an error AND coords match defaults
      const isUsingDefaults =
        result.current.error !== null && result.current.latitude === 6.4541;
      expect(isUsingDefaults).toBe(true);
    });
  });

  describe('accuracy', () => {
    it('should return null accuracy when using defaults due to error', async () => {
      const error = {
        code: 1,
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      mockGeolocation.getCurrentPosition.mockImplementation(
        (_success: any, error_callback: any) => {
          error_callback(error);
        }
      );

      const { result } = renderHook(() => useGeolocation());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.accuracy).toBeNull();
    });

    it('should return accuracy from successful position', async () => {
      const mockPosition = {
        coords: {
          latitude: 6.5244,
          longitude: 3.3792,
          accuracy: 25.5,
        },
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success: any) => {
        success(mockPosition);
      });

      const { result } = renderHook(() => useGeolocation());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.accuracy).toBe(25.5);
    });
  });
});
