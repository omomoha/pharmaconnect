'use client';

import { useEffect, useState } from 'react';
import { pharmacyService } from '@/lib/services';
import type { Pharmacy, PharmacyProduct } from '@/shared/types';

/**
 * Hook for fetching nearby pharmacies
 * @param lat - Latitude of user location
 * @param lng - Longitude of user location
 * @param radius - Optional radius in km (default 10)
 */
export function useNearbyPharmacies(lat: number, lng: number, radius?: number) {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPharmacies = async () => {
    if (lat === undefined || lng === undefined) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await pharmacyService.getNearbyPharmacies({
        lat,
        lng,
        radius,
      });

      if (response.success && response.data) {
        setPharmacies(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch pharmacies');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch pharmacies';
      setError(message);
      console.error('useNearbyPharmacies error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPharmacies();
  }, [lat, lng, radius]);

  return {
    pharmacies,
    loading,
    error,
  };
}

/**
 * Hook for fetching a single pharmacy by ID
 * @param id - Pharmacy ID
 */
export function usePharmacy(id: string) {
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPharmacy = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await pharmacyService.getPharmacy(id);

      if (response.success && response.data) {
        setPharmacy(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch pharmacy');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch pharmacy';
      setError(message);
      console.error('usePharmacy error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPharmacy();
  }, [id]);

  const refetch = () => fetchPharmacy();

  return {
    pharmacy,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook for fetching products from a pharmacy
 * @param pharmacyId - ID of the pharmacy
 */
export function usePharmacyProducts(pharmacyId: string) {
  const [products, setProducts] = useState<PharmacyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    if (!pharmacyId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await pharmacyService.getPharmacyProducts(pharmacyId);

      if (response.success && response.data) {
        setProducts(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch products');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch products';
      setError(message);
      console.error('usePharmacyProducts error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [pharmacyId]);

  const refetch = () => fetchProducts();

  return {
    products,
    loading,
    error,
    refetch,
  };
}
