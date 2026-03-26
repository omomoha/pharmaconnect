'use client';

import { useEffect, useState } from 'react';
import type { ApiResponse } from '@/shared/types';

/**
 * Generic data fetching hook that handles loading, error, and data states
 * @param fetcher - Async function that returns an ApiResponse<T>
 * @param deps - Optional dependency array for refetching
 * @returns Object with data, loading, error states and refetch function
 */
export function useApi<T>(
  fetcher: () => Promise<ApiResponse<T>>,
  deps: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetcher();

      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error?.message || 'An error occurred');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      console.error('useApi error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, deps);

  const refetch = () => fetchData();

  return {
    data,
    loading,
    error,
    refetch,
  };
}
