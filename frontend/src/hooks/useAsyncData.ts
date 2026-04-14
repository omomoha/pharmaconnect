'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ApiResponse } from '@/shared/types';

interface UseAsyncDataOptions {
  /** Whether to fetch immediately on mount */
  immediate?: boolean;
}

interface UseAsyncDataReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Generic hook for async data fetching with loading/error state management.
 * Reduces duplication across dashboard pages that all follow the same pattern.
 *
 * @example
 * const { data: orders, loading, error, refetch } = useAsyncData(
 *   () => orderService.getMyOrders(),
 *   { immediate: true }
 * );
 */
export function useAsyncData<T>(
  fetcher: () => Promise<ApiResponse<T>>,
  options: UseAsyncDataOptions = { immediate: true }
): UseAsyncDataReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(options.immediate ?? true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetcher();
      if (response.success && response.data !== undefined) {
        setData(response.data);
      } else {
        setError(response.error?.message || 'An error occurred');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    if (options.immediate !== false) {
      refetch();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, refetch };
}
