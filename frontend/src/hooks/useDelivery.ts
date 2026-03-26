'use client';

import { useCallback, useEffect, useState } from 'react';
import { deliveryService } from '@/lib/services';
import type {
  AvailableDeliveryProvider,
  DeliveryAssignment,
  DeliveryAssignmentStatus,
  DeliveryVerification,
} from '@/shared/types';

/**
 * Hook for fetching available delivery providers
 * @param pharmacyId - ID of the pharmacy
 * @param customerLocation - Customer's location {lat, lng}
 */
export function useAvailableProviders(
  pharmacyId: string,
  customerLocation?: { lat: number; lng: number }
) {
  const [providers, setProviders] = useState<AvailableDeliveryProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProviders = async () => {
    if (!pharmacyId || !customerLocation) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await deliveryService.getAvailableProviders({
        pharmacyId,
        customerLatitude: customerLocation.lat,
        customerLongitude: customerLocation.lng,
      });

      if (response.success && response.data) {
        setProviders(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch providers');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch providers';
      setError(message);
      console.error('useAvailableProviders error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [pharmacyId, customerLocation?.lat, customerLocation?.lng]);

  const refetch = () => fetchProviders();

  return {
    providers,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook for managing a delivery assignment
 * @param assignmentId - ID of the delivery assignment
 */
/**
 * Hook for fetching all delivery assignments for the current rider
 * Used by the delivery dashboard page
 */
export function useDelivery() {
  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await deliveryService.getAssignment('my-assignments');

      if (response.success && response.data) {
        setAssignments(Array.isArray(response.data) ? response.data : [response.data]);
      } else {
        // Fallback: no assignments yet or API not connected
        setAssignments([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch assignments';
      setError(message);
      console.error('useDelivery error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const refetch = () => fetchAssignments();

  return {
    assignments,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook for managing a delivery assignment
 * @param assignmentId - ID of the delivery assignment
 */
export function useDeliveryAssignment(assignmentId: string) {
  const [assignment, setAssignment] = useState<DeliveryAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchAssignment = async () => {
    if (!assignmentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await deliveryService.getAssignment(assignmentId);

      if (response.success && response.data) {
        setAssignment(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch assignment');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch assignment';
      setError(message);
      console.error('useDeliveryAssignment error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignment();
  }, [assignmentId]);

  /**
   * Update the assignment status
   */
  const updateStatus = useCallback(
    async (status: DeliveryAssignmentStatus): Promise<boolean> => {
      if (!assignmentId) {
        console.error('No assignment ID provided');
        return false;
      }

      try {
        setUpdating(true);
        const response = await deliveryService.updateAssignmentStatus(
          assignmentId,
          status
        );

        if (response.success && response.data) {
          setAssignment(response.data);
          return true;
        } else {
          setError(response.error?.message || 'Failed to update status');
          return false;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update status';
        setError(message);
        console.error('updateStatus error:', err);
        return false;
      } finally {
        setUpdating(false);
      }
    },
    [assignmentId]
  );

  /**
   * Verify security code for delivery
   */
  const verifyCode = useCallback(
    async (code: string): Promise<DeliveryVerification | null> => {
      if (!assignmentId) {
        console.error('No assignment ID provided');
        return null;
      }

      try {
        setUpdating(true);
        const response = await deliveryService.verifySecurityCode(
          assignmentId,
          code
        );

        if (response.success && response.data) {
          return response.data;
        } else {
          setError(response.error?.message || 'Failed to verify code');
          return null;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to verify code';
        setError(message);
        console.error('verifyCode error:', err);
        return null;
      } finally {
        setUpdating(false);
      }
    },
    [assignmentId]
  );

  const refetch = () => fetchAssignment();

  return {
    assignment,
    loading,
    error,
    updating,
    updateStatus,
    verifyCode,
    refetch,
  };
}
