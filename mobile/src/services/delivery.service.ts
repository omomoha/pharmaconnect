import { apiClient } from '../lib/api';

export const deliveryService = {
  getAvailableProviders: (params: {
    pharmacyId: string;
    customerLat: number;
    customerLng: number;
  }) => {
    const query = `?pharmacyId=${params.pharmacyId}&customerLat=${params.customerLat}&customerLng=${params.customerLng}`;
    return apiClient.get(`/delivery/available${query}`);
  },

  getAssignment: (assignmentId: string) =>
    apiClient.get(`/delivery/assignments/${assignmentId}`),

  updateAssignmentStatus: (assignmentId: string, status: string) =>
    apiClient.patch(`/delivery/assignments/${assignmentId}/status`, { status }),

  verifyDeliveryCode: (assignmentId: string, code: string) =>
    apiClient.post(`/delivery/assignments/${assignmentId}/verify-code`, { code }),

  getMyProvider: () => apiClient.get('/delivery/providers/my-provider'),
};
