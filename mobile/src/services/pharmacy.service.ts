import { apiClient } from '../lib/api';

export const pharmacyService = {
  getNearbyPharmacies: (params: { lat: number; lng: number; radius?: number }) => {
    const query = `?lat=${params.lat}&lng=${params.lng}${params.radius ? `&radius=${params.radius}` : ''}`;
    return apiClient.get(`/pharmacies/nearby${query}`);
  },

  getPharmacy: (id: string) => apiClient.get(`/pharmacies/${id}`),

  getPharmacyProducts: (pharmacyId: string) =>
    apiClient.get(`/pharmacies/${pharmacyId}/products`),

  searchPharmacies: (query: string) =>
    apiClient.get(`/pharmacies/search?q=${encodeURIComponent(query)}`),
};
