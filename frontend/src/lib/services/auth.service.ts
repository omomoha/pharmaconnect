import { apiClient } from '../api';
import type { ApiResponse, User } from '@/shared/types';

/**
 * Authentication service for user profile management
 */

/**
 * Fetch the current user's profile
 */
export async function getProfile(): Promise<ApiResponse<User>> {
  try {
    const response = await apiClient.get('/auth/me');
    return response;
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    return {
      success: false,
      error: {
        code: 'FETCH_PROFILE_ERROR',
        message: 'Failed to fetch user profile',
      },
    };
  }
}

/**
 * Update the current user's profile
 * @param data - Partial user data to update
 */
export async function updateProfile(
  data: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<ApiResponse<User>> {
  try {
    const response = await apiClient.put('/auth/me', data);
    return response;
  } catch (error) {
    console.error('Failed to update profile:', error);
    return {
      success: false,
      error: {
        code: 'UPDATE_PROFILE_ERROR',
        message: 'Failed to update user profile',
      },
    };
  }
}
