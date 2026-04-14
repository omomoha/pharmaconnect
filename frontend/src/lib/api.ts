import { auth } from './firebase';

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
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
