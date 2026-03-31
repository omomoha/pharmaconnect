import { pharmacyService } from '../../services/pharmacy.service';
import { apiClient } from '../../lib/api';

jest.mock('../../lib/api');

describe('PharmacyService', () => {
  const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getNearbyPharmacies', () => {
    it('should fetch nearby pharmacies with latitude and longitude', async () => {
      const mockPharmacies = [
        { id: '1', name: 'Pharmacy A', distance: 0.5 },
        { id: '2', name: 'Pharmacy B', distance: 1.2 },
      ];

      mockApiClient.get.mockResolvedValueOnce({
        success: true,
        data: mockPharmacies,
      });

      const result = await pharmacyService.getNearbyPharmacies({
        lat: 6.4541,
        lng: 3.4218,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPharmacies);
      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/pharmacies/nearby?lat=6.4541&lng=3.4218'
      );
    });

    it('should include radius parameter when provided', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        success: true,
        data: [],
      });

      await pharmacyService.getNearbyPharmacies({
        lat: 6.4541,
        lng: 3.4218,
        radius: 5,
      });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/pharmacies/nearby?lat=6.4541&lng=3.4218&radius=5'
      );
    });

    it('should handle missing radius parameter', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        success: true,
        data: [],
      });

      await pharmacyService.getNearbyPharmacies({
        lat: 6.4541,
        lng: 3.4218,
      });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/pharmacies/nearby?lat=6.4541&lng=3.4218'
      );
      expect(mockApiClient.get).not.toHaveBeenCalledWith(
        expect.stringContaining('&radius=')
      );
    });

    it('should handle API errors gracefully', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        success: false,
        error: { message: 'API Error' },
      });

      const result = await pharmacyService.getNearbyPharmacies({
        lat: 6.4541,
        lng: 3.4218,
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('API Error');
    });
  });

  describe('getPharmacy', () => {
    it('should fetch a single pharmacy by ID', async () => {
      const mockPharmacy = {
        id: '1',
        name: 'Pharmacy A',
        address: '123 Main St',
      };

      mockApiClient.get.mockResolvedValueOnce({
        success: true,
        data: mockPharmacy,
      });

      const result = await pharmacyService.getPharmacy('1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPharmacy);
      expect(mockApiClient.get).toHaveBeenCalledWith('/pharmacies/1');
    });

    it('should handle pharmacy not found error', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        success: false,
        error: { message: 'Pharmacy not found' },
      });

      const result = await pharmacyService.getPharmacy('invalid-id');

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Pharmacy not found');
    });

    it('should call API with correct pharmacy ID', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        success: true,
        data: {},
      });

      await pharmacyService.getPharmacy('abc-123');

      expect(mockApiClient.get).toHaveBeenCalledWith('/pharmacies/abc-123');
    });
  });

  describe('getPharmacyProducts', () => {
    it('should fetch products for a pharmacy', async () => {
      const mockProducts = [
        { id: 'p1', name: 'Aspirin', price: 500 },
        { id: 'p2', name: 'Paracetamol', price: 300 },
      ];

      mockApiClient.get.mockResolvedValueOnce({
        success: true,
        data: mockProducts,
      });

      const result = await pharmacyService.getPharmacyProducts('pharmacy-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProducts);
      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/pharmacies/pharmacy-1/products'
      );
    });

    it('should return empty products list if pharmacy has no products', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        success: true,
        data: [],
      });

      const result = await pharmacyService.getPharmacyProducts('pharmacy-2');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should handle API errors when fetching products', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        success: false,
        error: { message: 'Failed to fetch products' },
      });

      const result = await pharmacyService.getPharmacyProducts('pharmacy-1');

      expect(result.success).toBe(false);
    });
  });

  describe('searchPharmacies', () => {
    it('should search pharmacies by name', async () => {
      const mockResults = [
        { id: '1', name: 'City Pharmacy' },
        { id: '2', name: 'City Health Center' },
      ];

      mockApiClient.get.mockResolvedValueOnce({
        success: true,
        data: mockResults,
      });

      const result = await pharmacyService.searchPharmacies('City');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResults);
      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/pharmacies/search?q=City'
      );
    });

    it('should URL encode search query', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        success: true,
        data: [],
      });

      await pharmacyService.searchPharmacies('Health & Wellness');

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/pharmacies/search?q=Health%20%26%20Wellness'
      );
    });

    it('should handle special characters in search query', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        success: true,
        data: [],
      });

      await pharmacyService.searchPharmacies('Pharmacy+Store');

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/pharmacies/search?q=Pharmacy%2BStore'
      );
    });

    it('should return empty results if no pharmacies match', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        success: true,
        data: [],
      });

      const result = await pharmacyService.searchPharmacies('NonExistent');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should handle search API errors', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        success: false,
        error: { message: 'Search failed' },
      });

      const result = await pharmacyService.searchPharmacies('Test');

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Search failed');
    });
  });
});
