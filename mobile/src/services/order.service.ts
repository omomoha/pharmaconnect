import { apiClient } from '../lib/api';

export const orderService = {
  getOrders: (params?: { status?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return apiClient.get(`/orders${qs ? `?${qs}` : ''}`);
  },

  getOrder: (id: string) => apiClient.get(`/orders/${id}`),

  createOrder: (data: {
    pharmacyId: string;
    items: Array<{ productId: string; quantity: number }>;
    deliveryAddress: { lat: number; lng: number; address: string };
    deliveryProviderId?: string;
  }) => apiClient.post('/orders', data),

  cancelOrder: (id: string) => apiClient.patch(`/orders/${id}/cancel`),
};
