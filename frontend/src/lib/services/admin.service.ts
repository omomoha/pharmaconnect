import { apiClient } from '../api';
import type {
  ApiResponse,
  DeliveryProvider,
  FlagAction,
  FlaggedAlert,
  Pharmacy,
} from '@/shared/types';

/**
 * Admin service for managing approvals, flagged alerts, and dashboard
 */

export interface ReviewAlertData {
  action: FlagAction;
  notes?: string;
}

/**
 * Get all pending pharmacy approvals
 */
export async function getPendingPharmacies(): Promise<
  ApiResponse<Pharmacy[]>
> {
  try {
    const response = await apiClient.get('/admin/pending-pharmacies');
    return response;
  } catch (error) {
    console.error('Failed to fetch pending pharmacies:', error);
    return {
      success: false,
      error: {
        code: 'FETCH_PENDING_PHARMACIES_ERROR',
        message: 'Failed to fetch pending pharmacies',
      },
    };
  }
}

/**
 * Approve a pharmacy registration
 */
export async function approvePharmacy(id: string): Promise<ApiResponse<Pharmacy>> {
  try {
    const response = await apiClient.post(`/admin/pharmacies/${id}/approve`, {});
    return response;
  } catch (error) {
    console.error('Failed to approve pharmacy:', error);
    return {
      success: false,
      error: {
        code: 'APPROVE_PHARMACY_ERROR',
        message: 'Failed to approve pharmacy',
      },
    };
  }
}

/**
 * Reject a pharmacy registration
 */
export async function rejectPharmacy(
  id: string,
  reason: string
): Promise<ApiResponse<Pharmacy>> {
  try {
    const response = await apiClient.post(`/admin/pharmacies/${id}/reject`, {
      reason,
    });
    return response;
  } catch (error) {
    console.error('Failed to reject pharmacy:', error);
    return {
      success: false,
      error: {
        code: 'REJECT_PHARMACY_ERROR',
        message: 'Failed to reject pharmacy',
      },
    };
  }
}

/**
 * Get all pending delivery provider approvals
 */
export async function getPendingProviders(): Promise<
  ApiResponse<DeliveryProvider[]>
> {
  try {
    const response = await apiClient.get('/admin/pending-providers');
    return response;
  } catch (error) {
    console.error('Failed to fetch pending providers:', error);
    return {
      success: false,
      error: {
        code: 'FETCH_PENDING_PROVIDERS_ERROR',
        message: 'Failed to fetch pending providers',
      },
    };
  }
}

/**
 * Approve a delivery provider registration
 */
export async function approveProvider(
  id: string
): Promise<ApiResponse<DeliveryProvider>> {
  try {
    const response = await apiClient.post(`/admin/providers/${id}/approve`, {});
    return response;
  } catch (error) {
    console.error('Failed to approve delivery provider:', error);
    return {
      success: false,
      error: {
        code: 'APPROVE_PROVIDER_ERROR',
        message: 'Failed to approve delivery provider',
      },
    };
  }
}

/**
 * Reject a delivery provider registration
 */
export async function rejectProvider(
  id: string,
  reason: string
): Promise<ApiResponse<DeliveryProvider>> {
  try {
    const response = await apiClient.post(`/admin/providers/${id}/reject`, {
      reason,
    });
    return response;
  } catch (error) {
    console.error('Failed to reject delivery provider:', error);
    return {
      success: false,
      error: {
        code: 'REJECT_PROVIDER_ERROR',
        message: 'Failed to reject delivery provider',
      },
    };
  }
}

/**
 * Get all flagged alerts from moderation system
 */
export async function getFlaggedAlerts(): Promise<
  ApiResponse<FlaggedAlert[]>
> {
  try {
    const response = await apiClient.get('/admin/flagged-alerts');
    return response;
  } catch (error) {
    console.error('Failed to fetch flagged alerts:', error);
    return {
      success: false,
      error: {
        code: 'FETCH_FLAGGED_ALERTS_ERROR',
        message: 'Failed to fetch flagged alerts',
      },
    };
  }
}

/**
 * Review and take action on a flagged alert
 */
export async function reviewFlaggedAlert(
  id: string,
  data: ReviewAlertData
): Promise<ApiResponse<FlaggedAlert>> {
  try {
    const response = await apiClient.post(
      `/admin/flagged-alerts/${id}/review`,
      data
    );
    return response;
  } catch (error) {
    console.error('Failed to review flagged alert:', error);
    return {
      success: false,
      error: {
        code: 'REVIEW_ALERT_ERROR',
        message: 'Failed to review flagged alert',
      },
    };
  }
}

/**
 * Get all platform users
 */
export async function getUsers(limit: number = 200): Promise<ApiResponse<any>> {
  try {
    const response = await apiClient.get(`/admin/users?limit=${limit}`);
    return response;
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return {
      success: false,
      error: {
        code: 'FETCH_USERS_ERROR',
        message: 'Failed to fetch users',
      },
    };
  }
}

/**
 * Get admin dashboard statistics
 */
export async function getDashboard(): Promise<ApiResponse<any>> {
  try {
    const response = await apiClient.get('/admin/dashboard');
    return response;
  } catch (error) {
    console.error('Failed to fetch admin dashboard:', error);
    return {
      success: false,
      error: {
        code: 'FETCH_DASHBOARD_ERROR',
        message: 'Failed to fetch dashboard data',
      },
    };
  }
}

/**
 * Get all orders (admin)
 */
export async function getOrders(
  status?: string,
  limit?: number
): Promise<ApiResponse<{ orders: any[]; count: number }>> {
  try {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    if (limit) params.limit = limit.toString();
    const response = await apiClient.get('/admin/orders', { params });
    return response;
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return {
      success: false,
      error: {
        code: 'FETCH_ORDERS_ERROR',
        message: 'Failed to fetch orders',
      },
    };
  }
}

export interface TransactionsParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

/**
 * Get transaction history
 */
export async function getTransactions(
  params?: TransactionsParams
): Promise<ApiResponse<any[]>> {
  try {
    const queryParams: Record<string, string> = {};
    if (params?.page) queryParams.page = params.page.toString();
    if (params?.limit) queryParams.limit = params.limit.toString();
    if (params?.startDate) queryParams.startDate = params.startDate;
    if (params?.endDate) queryParams.endDate = params.endDate;

    const response = await apiClient.get('/admin/transactions', {
      params: queryParams,
    });
    return response;
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    return {
      success: false,
      error: {
        code: 'FETCH_TRANSACTIONS_ERROR',
        message: 'Failed to fetch transactions',
      },
    };
  }
}

/**
 * Get analytics with date-range filtering
 */
export async function getAnalytics(
  period: 'today' | 'week' | 'month' | 'year' = 'month'
): Promise<ApiResponse<any>> {
  try {
    const response = await apiClient.get(`/admin/analytics?period=${period}`);
    return response;
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return {
      success: false,
      error: {
        code: 'FETCH_ANALYTICS_ERROR',
        message: 'Failed to fetch analytics',
      },
    };
  }
}

/**
 * Suspend a user account
 */
export async function suspendUser(userId: string): Promise<ApiResponse<any>> {
  try {
    const response = await apiClient.post(`/admin/users/${userId}/suspend`, {});
    return response;
  } catch (error) {
    console.error('Failed to suspend user:', error);
    return {
      success: false,
      error: {
        code: 'SUSPEND_USER_ERROR',
        message: 'Failed to suspend user',
      },
    };
  }
}

/**
 * Activate a user account
 */
export async function activateUser(userId: string): Promise<ApiResponse<any>> {
  try {
    const response = await apiClient.post(`/admin/users/${userId}/activate`, {});
    return response;
  } catch (error) {
    console.error('Failed to activate user:', error);
    return {
      success: false,
      error: {
        code: 'ACTIVATE_USER_ERROR',
        message: 'Failed to activate user',
      },
    };
  }
}

/**
 * Soft-delete (deactivate) a user
 */
export async function softDeleteUser(userId: string): Promise<ApiResponse<any>> {
  try {
    const response = await apiClient.post(`/admin/users/${userId}/soft-delete`, {});
    return response;
  } catch (error) {
    console.error('Failed to soft-delete user:', error);
    return {
      success: false,
      error: {
        code: 'SOFT_DELETE_USER_ERROR',
        message: 'Failed to deactivate user',
      },
    };
  }
}

/**
 * Hard-delete (permanently remove) a user
 */
export async function hardDeleteUser(userId: string): Promise<ApiResponse<any>> {
  try {
    const response = await apiClient.delete(`/admin/users/${userId}`);
    return response;
  } catch (error) {
    console.error('Failed to hard-delete user:', error);
    return {
      success: false,
      error: {
        code: 'HARD_DELETE_USER_ERROR',
        message: 'Failed to permanently delete user',
      },
    };
  }
}
