'use client';

import { useEffect, useState } from 'react';
import { orderService } from '@/lib/services';
import type { Order, OrderStatus } from '@/shared/types';
import { PAGINATION } from '@/shared/constants';

/**
 * Hook for fetching user's orders with pagination
 * @param params - Optional pagination and filtering params
 */
export function useOrders(params?: { page?: number; limit?: number; status?: OrderStatus }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await orderService.getMyOrders({
        page: params?.page || 1,
        limit: params?.limit || PAGINATION.DEFAULT_LIMIT,
        status: params?.status,
      });

      if (response.success && response.data) {
        setOrders(Array.isArray(response.data) ? response.data : response.data.orders || []);
      } else {
        setError(response.error?.message || 'Failed to fetch orders');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch orders';
      setError(message);
      console.error('useOrders error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [params?.page, params?.limit, params?.status]);

  const refetch = () => fetchOrders();

  return {
    orders,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook for fetching a single order by ID
 * @param orderId - The order ID to fetch
 */
export function useOrder(orderId: string) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await orderService.getOrder(orderId);

      if (response.success && response.data) {
        setOrder(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch order');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch order';
      setError(message);
      console.error('useOrder error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const refetch = () => fetchOrder();

  return {
    order,
    loading,
    error,
    refetch,
  };
}
