import { apiClient } from '../api';
import type { ApiResponse, Order, OrderStatus, PaginationMeta } from '@/shared/types';

/**
 * Order service for creating, retrieving, and managing orders
 */

export interface OrderItemData {
  pharmacyProductId: string;
  quantity: number;
}

export interface CreateOrderData {
  pharmacyId: string;
  items: OrderItemData[];
  deliveryProviderId: string;
  deliveryAddress: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  notes?: string;
}

export interface GetOrdersParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
}

export interface OrdersResponse {
  orders: Order[];
  meta?: PaginationMeta;
}

/**
 * Create a new order
 */
export async function createOrder(
  data: CreateOrderData
): Promise<ApiResponse<Order>> {
  try {
    const response = await apiClient.post('/orders', data);
    return response;
  } catch (error) {
    console.error('Failed to create order:', error);
    return {
      success: false,
      error: {
        code: 'CREATE_ORDER_ERROR',
        message: 'Failed to create order',
      },
    };
  }
}

/**
 * Get current user's orders
 */
export async function getMyOrders(
  params?: GetOrdersParams
): Promise<ApiResponse<OrdersResponse>> {
  try {
    const queryParams: Record<string, string> = {};
    if (params?.page) queryParams.page = params.page.toString();
    if (params?.limit) queryParams.limit = params.limit.toString();
    if (params?.status) queryParams.status = params.status;

    const response = await apiClient.get('/orders/user/my-orders', {
      params: queryParams,
    });
    return response;
  } catch (error) {
    console.error('Failed to fetch user orders:', error);
    return {
      success: false,
      error: {
        code: 'FETCH_ORDERS_ERROR',
        message: 'Failed to fetch your orders',
      },
    };
  }
}

/**
 * Get a specific order by ID
 */
export async function getOrder(id: string): Promise<ApiResponse<Order>> {
  try {
    const response = await apiClient.get(`/orders/${id}`);
    return response;
  } catch (error) {
    console.error('Failed to fetch order:', error);
    return {
      success: false,
      error: {
        code: 'FETCH_ORDER_ERROR',
        message: 'Failed to fetch order details',
      },
    };
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<ApiResponse<Order>> {
  try {
    const response = await apiClient.patch(`/orders/${id}/status`, {
      status,
    });
    return response;
  } catch (error) {
    console.error('Failed to update order status:', error);
    return {
      success: false,
      error: {
        code: 'UPDATE_ORDER_STATUS_ERROR',
        message: 'Failed to update order status',
      },
    };
  }
}

/**
 * Cancel an order
 */
export async function cancelOrder(id: string): Promise<ApiResponse<Order>> {
  try {
    const response = await apiClient.post(`/orders/${id}/cancel`, {});
    return response;
  } catch (error) {
    console.error('Failed to cancel order:', error);
    return {
      success: false,
      error: {
        code: 'CANCEL_ORDER_ERROR',
        message: 'Failed to cancel order',
      },
    };
  }
}
