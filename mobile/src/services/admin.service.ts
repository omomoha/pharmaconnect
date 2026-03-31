import { apiClient } from '../lib/api';

export const adminService = {
  getDashboard: () => apiClient.get('/admin/dashboard'),

  getFlaggedAlerts: () => apiClient.get('/admin/flagged-alerts'),

  reviewAlert: (alertId: string, data: { action: string; notes?: string }) =>
    apiClient.post(`/admin/flagged-alerts/${alertId}/review`, data),

  resolveAlert: (alertId: string) =>
    apiClient.patch(`/admin/flagged-alerts/${alertId}/resolve`),

  getTransactions: (params?: { page?: number; limit?: number; startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    const qs = query.toString();
    return apiClient.get(`/admin/transactions${qs ? `?${qs}` : ''}`);
  },

  getPendingPharmacies: () => apiClient.get('/admin/pending-pharmacies'),
  approvePharmacy: (id: string) => apiClient.post(`/admin/pharmacies/${id}/approve`),
  rejectPharmacy: (id: string, reason: string) =>
    apiClient.post(`/admin/pharmacies/${id}/reject`, { reason }),

  getPendingProviders: () => apiClient.get('/admin/pending-providers'),
  approveProvider: (id: string) => apiClient.post(`/admin/providers/${id}/approve`),
  rejectProvider: (id: string, reason: string) =>
    apiClient.post(`/admin/providers/${id}/reject`, { reason }),
};
