'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminService } from '@/lib/services';
import type { DeliveryProvider, FlaggedAlert, Pharmacy } from '@/shared/types';

/**
 * Hook for admin dashboard statistics
 */
export function useAdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getDashboard();

      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch dashboard');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch dashboard';
      setError(message);
      console.error('useAdminDashboard error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    stats,
    loading,
    error,
    refetch: fetchDashboard,
  };
}

/**
 * Hook for pending pharmacy and delivery provider approvals
 */
export function usePendingApprovals() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [providers, setProviders] = useState<DeliveryProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState(false);

  const fetchApprovals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [pharmaciesRes, providersRes] = await Promise.all([
        adminService.getPendingPharmacies(),
        adminService.getPendingProviders(),
      ]);

      if (pharmaciesRes.success && pharmaciesRes.data) {
        setPharmacies(pharmaciesRes.data);
      }

      if (providersRes.success && providersRes.data) {
        setProviders(providersRes.data);
      }

      if (!pharmaciesRes.success && !providersRes.success) {
        setError('Failed to fetch approvals');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch approvals';
      setError(message);
      console.error('usePendingApprovals error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  /**
   * Approve a pharmacy registration
   */
  const approvePharmacy = useCallback(
    async (pharmacyId: string): Promise<boolean> => {
      try {
        setActionInProgress(true);
        const response = await adminService.approvePharmacy(pharmacyId);

        if (response.success) {
          // Remove from pending list
          setPharmacies((prev) =>
            prev.filter((p) => p.id !== pharmacyId)
          );
          return true;
        } else {
          setError(response.error?.message || 'Failed to approve pharmacy');
          return false;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to approve';
        setError(message);
        console.error('approvePharmacy error:', err);
        return false;
      } finally {
        setActionInProgress(false);
      }
    },
    []
  );

  /**
   * Reject a pharmacy registration
   */
  const rejectPharmacy = useCallback(
    async (pharmacyId: string, reason: string): Promise<boolean> => {
      try {
        setActionInProgress(true);
        const response = await adminService.rejectPharmacy(pharmacyId, reason);

        if (response.success) {
          // Remove from pending list
          setPharmacies((prev) =>
            prev.filter((p) => p.id !== pharmacyId)
          );
          return true;
        } else {
          setError(response.error?.message || 'Failed to reject pharmacy');
          return false;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to reject';
        setError(message);
        console.error('rejectPharmacy error:', err);
        return false;
      } finally {
        setActionInProgress(false);
      }
    },
    []
  );

  /**
   * Approve a delivery provider registration
   */
  const approveProvider = useCallback(
    async (providerId: string): Promise<boolean> => {
      try {
        setActionInProgress(true);
        const response = await adminService.approveProvider(providerId);

        if (response.success) {
          // Remove from pending list
          setProviders((prev) =>
            prev.filter((p) => p.id !== providerId)
          );
          return true;
        } else {
          setError(response.error?.message || 'Failed to approve provider');
          return false;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to approve';
        setError(message);
        console.error('approveProvider error:', err);
        return false;
      } finally {
        setActionInProgress(false);
      }
    },
    []
  );

  /**
   * Reject a delivery provider registration
   */
  const rejectProvider = useCallback(
    async (providerId: string, reason: string): Promise<boolean> => {
      try {
        setActionInProgress(true);
        const response = await adminService.rejectProvider(providerId, reason);

        if (response.success) {
          // Remove from pending list
          setProviders((prev) =>
            prev.filter((p) => p.id !== providerId)
          );
          return true;
        } else {
          setError(response.error?.message || 'Failed to reject provider');
          return false;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to reject';
        setError(message);
        console.error('rejectProvider error:', err);
        return false;
      } finally {
        setActionInProgress(false);
      }
    },
    []
  );

  return {
    pharmacies,
    providers,
    loading,
    error,
    actionInProgress,
    refetch: fetchApprovals,
    approvePharmacy,
    rejectPharmacy,
    approveProvider,
    rejectProvider,
  };
}

/**
 * Hook for flagged alerts from moderation system
 */
export function useFlaggedAlerts() {
  const [alerts, setAlerts] = useState<FlaggedAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getFlaggedAlerts();

      if (response.success && response.data) {
        setAlerts(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch flagged alerts');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch alerts';
      setError(message);
      console.error('useFlaggedAlerts error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  /**
   * Review a flagged alert and take action
   */
  const review = useCallback(
    async (
      alertId: string,
      action: string,
      notes?: string
    ): Promise<boolean> => {
      try {
        setReviewingId(alertId);
        const response = await adminService.reviewFlaggedAlert(alertId, {
          action: action as any,
          notes,
        });

        if (response.success) {
          // Remove reviewed alert from list
          setAlerts((prev) => prev.filter((a) => a.id !== alertId));
          return true;
        } else {
          setError(response.error?.message || 'Failed to review alert');
          return false;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to review';
        setError(message);
        console.error('review error:', err);
        return false;
      } finally {
        setReviewingId(null);
      }
    },
    []
  );

  return {
    alerts,
    loading,
    error,
    reviewingId,
    refetch: fetchAlerts,
    review,
  };
}
