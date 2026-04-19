import { auth } from './firebase';

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// Safety check: warn if using insecure HTTP in a non-localhost context
if (typeof window !== 'undefined' && baseUrl.startsWith('http://') && !baseUrl.includes('localhost')) {
  console.warn('WARNING: API is configured to use insecure HTTP. Set NEXT_PUBLIC_API_URL to an HTTPS endpoint.');
}

export interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

/**
 * Generic API response type for type safety
 * TODO: Consider creating more specific response types for different endpoints
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    errorId?: string;
  };
}

/**
 * Fetch with Firebase authentication token attached
 */
export async function fetchWithAuth(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { params, ...fetchOptions } = options;

  // Build URL with query parameters
  let fullUrl = `${baseUrl}${url}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value));
    });
    fullUrl += `?${searchParams.toString()}`;
  }

  // Get Firebase ID token if user is authenticated
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (auth.currentUser) {
    try {
      const idToken = await auth.currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${idToken}`;
    } catch (error) {
      console.error('Failed to get ID token:', error);
    }
  }

  // Make request
  const response = await fetch(fullUrl, {
    ...fetchOptions,
    headers,
  });

  return response;
}

/**
 * GET request with auth
 */
export async function get(url: string, options?: FetchOptions) {
  const response = await fetchWithAuth(url, {
    ...options,
    method: 'GET',
  });

  if (!response.ok) {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.error?.message || errorBody.message || errorMessage;
    } catch {
      // Response body not JSON, use default message
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * POST request with auth
 * TODO: Replace Record<string, any> with specific request body types
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function post(url: string, data?: Record<string, any>, options?: FetchOptions) {
  const response = await fetchWithAuth(url, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.error?.message || errorBody.message || errorMessage;
    } catch {
      // Response body not JSON, use default message
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * PUT request with auth
 * TODO: Replace Record<string, any> with specific request body types
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function put(url: string, data?: Record<string, any>, options?: FetchOptions) {
  const response = await fetchWithAuth(url, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.error?.message || errorBody.message || errorMessage;
    } catch {
      // Response body not JSON, use default message
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * PATCH request with auth
 * TODO: Replace Record<string, any> with specific request body types
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function patch(url: string, data?: Record<string, any>, options?: FetchOptions) {
  const response = await fetchWithAuth(url, {
    ...options,
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.error?.message || errorBody.message || errorMessage;
    } catch {
      // Response body not JSON, use default message
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * DELETE request with auth
 */
export async function deleteRequest(url: string, options?: FetchOptions) {
  const response = await fetchWithAuth(url, {
    ...options,
    method: 'DELETE',
  });

  if (!response.ok) {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.error?.message || errorBody.message || errorMessage;
    } catch {
      // Response body not JSON, use default message
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export const apiClient = {
  get,
  post,
  put,
  patch,
  delete: deleteRequest,
  fetchWithAuth,
};
