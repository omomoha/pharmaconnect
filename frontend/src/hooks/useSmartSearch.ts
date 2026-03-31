'use client';

import { useEffect, useState, useCallback } from 'react';
import { aiService } from '@/lib/services';
import type { SmartSearchResult } from '@/lib/services/ai.service';

/**
 * Hook for AI-powered smart search with suggestions and pharmacy recommendations
 * @param query - Search query
 * @param lat - Optional latitude for location-based search
 * @param lng - Optional longitude for location-based search
 * @param debounceMs - Debounce delay in milliseconds (default 500)
 */
export function useSmartSearch(
  query: string,
  lat?: number,
  lng?: number,
  debounceMs: number = 500
) {
  const [results, setResults] = useState<SmartSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  // Clear previous timer on cleanup
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults(null);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await aiService.smartSearch(searchQuery, lat, lng);

      if (response.success && response.data) {
        setResults(response.data);
      } else {
        setError(response.error?.message || 'Failed to perform search');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      setError(message);
      console.error('Smart search error:', err);
    } finally {
      setLoading(false);
    }
  }, [lat, lng]);

  // Debounced search effect
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setError(null);
      return;
    }

    // Clear previous timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      performSearch(query);
    }, debounceMs);

    setDebounceTimer(timer);

    return () => {
      clearTimeout(timer);
    };
  }, [query, lat, lng, debounceMs, performSearch]);

  // Manual search trigger (bypasses debounce)
  const search = useCallback(
    async (searchQuery: string) => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        setDebounceTimer(null);
      }
      await performSearch(searchQuery);
    },
    [debounceTimer, performSearch]
  );

  // Clear results
  const clear = useCallback(() => {
    setResults(null);
    setError(null);
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      setDebounceTimer(null);
    }
  }, [debounceTimer]);

  return {
    results,
    loading,
    error,
    search,
    clear,
    suggestions: results?.suggestions || [],
    categories: results?.categories || [],
    recommendedPharmacies: results?.recommendedPharmacies || [],
  };
}
