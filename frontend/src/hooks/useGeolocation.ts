'use client';

import { useState, useEffect, useCallback } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

const DEFAULT_OPTIONS: UseGeolocationOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 300000, // 5 minutes cache
};

// Default coordinates: Lagos, Nigeria (Lekki)
const DEFAULT_LATITUDE = 6.4541;
const DEFAULT_LONGITUDE = 3.4218;

/**
 * Hook for accessing browser geolocation with fallback to Lagos defaults.
 * Provides latitude, longitude, accuracy, loading, and error states.
 */
export function useGeolocation(options?: UseGeolocationOptions) {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    loading: true,
    error: null,
  });

  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState({
        latitude: DEFAULT_LATITUDE,
        longitude: DEFAULT_LONGITUDE,
        accuracy: null,
        loading: false,
        error: 'Geolocation is not supported. Using default location.',
      });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          loading: false,
          error: null,
        });
      },
      (error) => {
        let errorMessage = 'Unable to retrieve location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Using default location.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location unavailable. Using default location.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Using default location.';
            break;
        }
        // Fall back to Lagos defaults
        setState({
          latitude: DEFAULT_LATITUDE,
          longitude: DEFAULT_LONGITUDE,
          accuracy: null,
          loading: false,
          error: errorMessage,
        });
      },
      {
        enableHighAccuracy: mergedOptions.enableHighAccuracy,
        timeout: mergedOptions.timeout,
        maximumAge: mergedOptions.maximumAge,
      }
    );
  }, [mergedOptions.enableHighAccuracy, mergedOptions.timeout, mergedOptions.maximumAge]);

  useEffect(() => {
    requestLocation();
  }, []);

  return {
    ...state,
    /** Re-request the user's location */
    refresh: requestLocation,
    /** Whether real coordinates are available (not defaults) */
    isUsingDefaults: state.error !== null && state.latitude === DEFAULT_LATITUDE,
  };
}
