import { apiClient } from '../api';
import type { ApiResponse, Pharmacy, PharmacyProduct } from '@/shared/types';

/**
 * Pharmacy service for searching, retrieving, and managing pharmacies
 */

export interface NearbyPharmaciesParams {
  lat: number;
  lng: number;
  radius?: number;
}

export interface PharmacySearchParams {
  query: string;
  lat?: number;
  lng?: number;
  radius?: number;
  limit?: number;
  offset?: number;
}

export interface RegisterPharmacyData {
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
  latitude: number;
  longitude: number;
  licenseNumber: string;
  licenseDocUrl: string;
  cacNumber: string;
  cacDocUrl: string;
  ownerName: string;
  ownerIdDocUrl: string;
  operatingHours: Record<string, any>;
}

export interface AddProductData {
  drugCatalogItemId: string;
  sku: string;
  quantity: number;
  price: number;
  discount?: number;
  expiryDate: string;
  batchNumber: string;
}

/**
 * Get nearby pharmacies within a specified radius
 */
export async function getNearbyPharmacies(
  params: NearbyPharmaciesParams
): Promise<ApiResponse<Pharmacy[]>> {
  try {
    const response = await apiClient.get('/pharmacies/nearby', {
      params: {
        lat: params.lat.toString(),
        lng: params.lng.toString(),
        radius: (params.radius || 10).toString(),
      },
    });
    return response;
  } catch (error) {
    console.error('Failed to fetch nearby pharmacies:', error);
    return {
      success: false,
      error: {
        code: 'FETCH_NEARBY_PHARMACIES_ERROR',
        message: 'Failed to fetch nearby pharmacies',
      },
    };
  }
}

/**
 * Search pharmacies by name or location
 */
export async function searchPharmacies(
  params: PharmacySearchParams
): Promise<ApiResponse<Pharmacy[]>> {
  try {
    const queryParams: Record<string, string> = {
      query: params.query,
    };

    if (params.lat !== undefined) queryParams.lat = params.lat.toString();
    if (params.lng !== undefined) queryParams.lng = params.lng.toString();
    if (params.radius) queryParams.radius = params.radius.toString();
    if (params.limit) queryParams.limit = params.limit.toString();
    if (params.offset) queryParams.offset = params.offset.toString();

    const response = await apiClient.get('/pharmacies/search', {
      params: queryParams,
    });
    return response;
  } catch (error) {
    console.error('Failed to search pharmacies:', error);
    return {
      success: false,
      error: {
        code: 'SEARCH_PHARMACIES_ERROR',
        message: 'Failed to search pharmacies',
      },
    };
  }
}

/**
 * Get a specific pharmacy by ID
 */
export async function getPharmacy(id: string): Promise<ApiResponse<Pharmacy>> {
  try {
    const response = await apiClient.get(`/pharmacies/${id}`);
    return response;
  } catch (error) {
    console.error('Failed to fetch pharmacy:', error);
    return {
      success: false,
      error: {
        code: 'FETCH_PHARMACY_ERROR',
        message: 'Failed to fetch pharmacy details',
      },
    };
  }
}

/**
 * Get products from a specific pharmacy
 */
export async function getPharmacyProducts(
  pharmacyId: string
): Promise<ApiResponse<PharmacyProduct[]>> {
  try {
    const response = await apiClient.get(`/pharmacies/${pharmacyId}/products`);
    return response;
  } catch (error) {
    console.error('Failed to fetch pharmacy products:', error);
    return {
      success: false,
      error: {
        code: 'FETCH_PHARMACY_PRODUCTS_ERROR',
        message: 'Failed to fetch pharmacy products',
      },
    };
  }
}

/**
 * Register a new pharmacy
 */
export async function registerPharmacy(
  data: RegisterPharmacyData
): Promise<ApiResponse<Pharmacy>> {
  try {
    const response = await apiClient.post('/pharmacies/register', data);
    return response;
  } catch (error) {
    console.error('Failed to register pharmacy:', error);
    return {
      success: false,
      error: {
        code: 'REGISTER_PHARMACY_ERROR',
        message: 'Failed to register pharmacy',
      },
    };
  }
}

/**
 * Add a product to a pharmacy
 */
export async function addProduct(
  pharmacyId: string,
  data: AddProductData
): Promise<ApiResponse<PharmacyProduct>> {
  try {
    const response = await apiClient.post(
      `/pharmacies/${pharmacyId}/products`,
      data
    );
    return response;
  } catch (error) {
    console.error('Failed to add product:', error);
    return {
      success: false,
      error: {
        code: 'ADD_PRODUCT_ERROR',
        message: 'Failed to add product to pharmacy',
      },
    };
  }
}
