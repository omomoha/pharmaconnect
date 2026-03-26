import { apiClient } from '../api';
import type {
  ApiResponse,
  AvailableDeliveryProvider,
  DeliveryAssignment,
  DeliveryAssignmentStatus,
  DeliveryProvider,
  DeliveryVerification,
} from '@/shared/types';

/**
 * Delivery service for managing delivery providers and assignments
 */

export interface RegisterDeliveryProviderData {
  businessName: string;
  email: string;
  phoneNumber: string;
  address: string;
  cacNumber: string;
  cacDocUrl: string;
  ownerName: string;
  ownerIdDocUrl: string;
  vehicleDocUrl: string;
  baseFee: number;
  perKmFee: number;
}

export interface AvailableProvidersParams {
  pharmacyId: string;
  customerLatitude: number;
  customerLongitude: number;
}

export interface CreateAssignmentData {
  orderId: string;
  deliveryProviderId: string;
  pickupLatitude: number;
  pickupLongitude: number;
  deliveryLatitude: number;
  deliveryLongitude: number;
}

export interface VerifySecurityCodeData {
  assignmentId: string;
  code: string;
}

/**
 * Register a new delivery provider
 */
export async function registerProvider(
  data: RegisterDeliveryProviderData
): Promise<ApiResponse<DeliveryProvider>> {
  try {
    const response = await apiClient.post('/delivery/providers/register', data);
    return response;
  } catch (error) {
    console.error('Failed to register delivery provider:', error);
    return {
      success: false,
      error: {
        code: 'REGISTER_PROVIDER_ERROR',
        message: 'Failed to register delivery provider',
      },
    };
  }
}

/**
 * Get available delivery providers for a specific location
 */
export async function getAvailableProviders(
  params: AvailableProvidersParams
): Promise<ApiResponse<AvailableDeliveryProvider[]>> {
  try {
    const response = await apiClient.get('/delivery/available', {
      params: {
        pharmacyId: params.pharmacyId,
        customerLatitude: params.customerLatitude.toString(),
        customerLongitude: params.customerLongitude.toString(),
      },
    });
    return response;
  } catch (error) {
    console.error('Failed to fetch available providers:', error);
    return {
      success: false,
      error: {
        code: 'FETCH_PROVIDERS_ERROR',
        message: 'Failed to fetch available delivery providers',
      },
    };
  }
}

/**
 * Create a new delivery assignment
 */
export async function createAssignment(
  data: CreateAssignmentData
): Promise<ApiResponse<DeliveryAssignment>> {
  try {
    const response = await apiClient.post('/delivery/assignments', data);
    return response;
  } catch (error) {
    console.error('Failed to create delivery assignment:', error);
    return {
      success: false,
      error: {
        code: 'CREATE_ASSIGNMENT_ERROR',
        message: 'Failed to create delivery assignment',
      },
    };
  }
}

/**
 * Get a specific delivery assignment by ID
 */
export async function getAssignment(
  id: string
): Promise<ApiResponse<DeliveryAssignment>> {
  try {
    const response = await apiClient.get(`/delivery/assignments/${id}`);
    return response;
  } catch (error) {
    console.error('Failed to fetch delivery assignment:', error);
    return {
      success: false,
      error: {
        code: 'FETCH_ASSIGNMENT_ERROR',
        message: 'Failed to fetch delivery assignment',
      },
    };
  }
}

/**
 * Update delivery assignment status
 */
export async function updateAssignmentStatus(
  id: string,
  status: DeliveryAssignmentStatus
): Promise<ApiResponse<DeliveryAssignment>> {
  try {
    const response = await apiClient.patch(
      `/delivery/assignments/${id}/status`,
      { status }
    );
    return response;
  } catch (error) {
    console.error('Failed to update delivery assignment status:', error);
    return {
      success: false,
      error: {
        code: 'UPDATE_ASSIGNMENT_STATUS_ERROR',
        message: 'Failed to update delivery assignment status',
      },
    };
  }
}

/**
 * Verify security code for delivery
 */
export async function verifySecurityCode(
  assignmentId: string,
  code: string
): Promise<ApiResponse<DeliveryVerification>> {
  try {
    const response = await apiClient.post(
      `/delivery/assignments/${assignmentId}/verify-code`,
      { code }
    );
    return response;
  } catch (error) {
    console.error('Failed to verify security code:', error);
    return {
      success: false,
      error: {
        code: 'VERIFY_CODE_ERROR',
        message: 'Failed to verify security code',
      },
    };
  }
}
