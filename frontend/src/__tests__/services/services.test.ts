import {
  getProfile,
  updateProfile,
} from '@/lib/services/auth.service';
import {
  getNearbyPharmacies,
  searchPharmacies,
  getPharmacy,
  getPharmacyProducts,
  registerPharmacy,
  addProduct,
} from '@/lib/services/pharmacy.service';
import {
  createOrder,
  getMyOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
} from '@/lib/services/order.service';
import {
  registerProvider,
  getAvailableProviders,
  createAssignment,
  getAssignment,
  updateAssignmentStatus,
  verifySecurityCode,
} from '@/lib/services/delivery.service';
import {
  initializePayment,
  verifyPayment,
  requestRefund,
} from '@/lib/services/payment.service';
import {
  createConversation,
  getConversations,
  getConversation,
  sendMessage,
  markAsRead,
  closeConversation,
} from '@/lib/services/chat.service';
import {
  getPendingPharmacies,
  approvePharmacy,
  rejectPharmacy,
  getPendingProviders,
  approveProvider,
  rejectProvider,
  getFlaggedAlerts,
  reviewFlaggedAlert,
  getDashboard,
  getTransactions,
} from '@/lib/services/admin.service';

jest.mock('@/lib/api');

// Import mock after mocking
import { apiClient } from '@/lib/api';

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('API Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Auth Service', () => {
    describe('getProfile', () => {
      it('should fetch user profile successfully', async () => {
        const mockUser = {
          id: 'user-123',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'customer' as const,
        };

        mockApiClient.get.mockResolvedValueOnce({
          success: true,
          data: mockUser,
        });

        const result = await getProfile();

        expect(mockApiClient.get).toHaveBeenCalledWith('/auth/me');
        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockUser);
      });

      it('should return error when profile fetch fails', async () => {
        mockApiClient.get.mockRejectedValueOnce(new Error('Network error'));

        const result = await getProfile();

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('FETCH_PROFILE_ERROR');
        expect(result.error?.message).toBe('Failed to fetch user profile');
      });
    });

    describe('updateProfile', () => {
      it('should update user profile successfully', async () => {
        const updateData = { firstName: 'Jane', lastName: 'Smith' };
        const mockUpdatedUser = {
          id: 'user-123',
          email: 'test@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          role: 'customer' as const,
        };

        mockApiClient.put.mockResolvedValueOnce({
          success: true,
          data: mockUpdatedUser,
        });

        const result = await updateProfile(updateData);

        expect(mockApiClient.put).toHaveBeenCalledWith('/auth/me', updateData);
        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockUpdatedUser);
      });

      it('should use PUT method for profile update', async () => {
        mockApiClient.put.mockResolvedValueOnce({
          success: true,
          data: {},
        });

        await updateProfile({ firstName: 'John' });

        expect(mockApiClient.put).toHaveBeenCalled();
        expect(mockApiClient.post).not.toHaveBeenCalled();
      });

      it('should return error when profile update fails', async () => {
        mockApiClient.put.mockRejectedValueOnce(new Error('Validation error'));

        const result = await updateProfile({ firstName: 'Jane' });

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('UPDATE_PROFILE_ERROR');
        expect(result.error?.message).toBe('Failed to update user profile');
      });
    });
  });

  describe('Pharmacy Service', () => {
    describe('getNearbyPharmacies', () => {
      it('should fetch nearby pharmacies with correct params', async () => {
        const mockPharmacies = [
          { id: 'pharm-1', name: 'Central Pharmacy' },
          { id: 'pharm-2', name: 'Local Pharmacy' },
        ];
        const params = { lat: 6.5244, lng: 3.3792, radius: 10 };

        mockApiClient.get.mockResolvedValueOnce({
          success: true,
          data: mockPharmacies,
        });

        const result = await getNearbyPharmacies(params);

        expect(mockApiClient.get).toHaveBeenCalledWith('/pharmacies/nearby', {
          params: {
            lat: '6.5244',
            lng: '3.3792',
            radius: '10',
          },
        });
        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockPharmacies);
      });

      it('should use default radius when not provided', async () => {
        mockApiClient.get.mockResolvedValueOnce({
          success: true,
          data: [],
        });

        await getNearbyPharmacies({ lat: 6.5244, lng: 3.3792 });

        expect(mockApiClient.get).toHaveBeenCalledWith('/pharmacies/nearby', {
          params: {
            lat: '6.5244',
            lng: '3.3792',
            radius: '10',
          },
        });
      });

      it('should return error when nearby pharmacies fetch fails', async () => {
        mockApiClient.get.mockRejectedValueOnce(new Error('API error'));

        const result = await getNearbyPharmacies({
          lat: 6.5244,
          lng: 3.3792,
        });

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('FETCH_NEARBY_PHARMACIES_ERROR');
      });
    });

    describe('searchPharmacies', () => {
      it('should search pharmacies with query only', async () => {
        const mockPharmacies = [{ id: 'pharm-1', name: 'Central Pharmacy' }];
        const params = { query: 'Central' };

        mockApiClient.get.mockResolvedValueOnce({
          success: true,
          data: mockPharmacies,
        });

        const result = await searchPharmacies(params);

        expect(mockApiClient.get).toHaveBeenCalledWith('/pharmacies/search', {
          params: { query: 'Central' },
        });
        expect(result.success).toBe(true);
      });

      it('should include optional params when provided', async () => {
        mockApiClient.get.mockResolvedValueOnce({
          success: true,
          data: [],
        });

        await searchPharmacies({
          query: 'Central',
          lat: 6.5244,
          lng: 3.3792,
          radius: 15,
          limit: 10,
          offset: 0,
        });

        expect(mockApiClient.get).toHaveBeenCalledWith('/pharmacies/search', {
          params: {
            query: 'Central',
            lat: '6.5244',
            lng: '3.3792',
            radius: '15',
            limit: '10',
            offset: '0',
          },
        });
      });

      it('should return error when search fails', async () => {
        mockApiClient.get.mockRejectedValueOnce(new Error('Search error'));

        const result = await searchPharmacies({ query: 'test' });

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('SEARCH_PHARMACIES_ERROR');
      });
    });

    describe('getPharmacy', () => {
      it('should fetch pharmacy by ID successfully', async () => {
        const mockPharmacy = {
          id: 'pharm-1',
          name: 'Central Pharmacy',
          address: '123 Main St',
        };

        mockApiClient.get.mockResolvedValueOnce({
          success: true,
          data: mockPharmacy,
        });

        const result = await getPharmacy('pharm-1');

        expect(mockApiClient.get).toHaveBeenCalledWith('/pharmacies/pharm-1');
        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockPharmacy);
      });

      it('should return error when pharmacy not found', async () => {
        mockApiClient.get.mockRejectedValueOnce(
          new Error('Pharmacy not found')
        );

        const result = await getPharmacy('pharm-invalid');

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('FETCH_PHARMACY_ERROR');
      });
    });

    describe('getPharmacyProducts', () => {
      it('should fetch pharmacy products successfully', async () => {
        const mockProducts = [
          {
            id: 'prod-1',
            name: 'Aspirin',
            price: 5000,
          },
        ];

        mockApiClient.get.mockResolvedValueOnce({
          success: true,
          data: mockProducts,
        });

        const result = await getPharmacyProducts('pharm-1');

        expect(mockApiClient.get).toHaveBeenCalledWith(
          '/pharmacies/pharm-1/products'
        );
        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockProducts);
      });

      it('should return error when fetching products fails', async () => {
        mockApiClient.get.mockRejectedValueOnce(new Error('API error'));

        const result = await getPharmacyProducts('pharm-1');

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('FETCH_PHARMACY_PRODUCTS_ERROR');
      });
    });

    describe('registerPharmacy', () => {
      it('should register pharmacy successfully', async () => {
        const registerData = {
          name: 'New Pharmacy',
          email: 'pharm@example.com',
          phoneNumber: '08012345678',
          address: '123 Main St',
          latitude: 6.5244,
          longitude: 3.3792,
          licenseNumber: 'LIC-123',
          licenseDocUrl: 'https://example.com/license.pdf',
          cacNumber: 'CAC-123',
          cacDocUrl: 'https://example.com/cac.pdf',
          ownerName: 'John Doe',
          ownerIdDocUrl: 'https://example.com/id.pdf',
          operatingHours: {},
        };

        const mockPharmacy = { id: 'pharm-new', ...registerData };

        mockApiClient.post.mockResolvedValueOnce({
          success: true,
          data: mockPharmacy,
        });

        const result = await registerPharmacy(registerData);

        expect(mockApiClient.post).toHaveBeenCalledWith(
          '/pharmacies/register',
          registerData
        );
        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockPharmacy);
      });

      it('should use POST method for pharmacy registration', async () => {
        mockApiClient.post.mockResolvedValueOnce({
          success: true,
          data: {},
        });

        const registerData = {
          name: 'Test Pharmacy',
          email: 'test@pharmacy.com',
          phoneNumber: '08012345678',
          address: 'Test Address',
          latitude: 0,
          longitude: 0,
          licenseNumber: 'LIC-001',
          licenseDocUrl: 'url',
          cacNumber: 'CAC-001',
          cacDocUrl: 'url',
          ownerName: 'Test Owner',
          ownerIdDocUrl: 'url',
          operatingHours: {},
        };

        await registerPharmacy(registerData);

        expect(mockApiClient.post).toHaveBeenCalled();
        expect(mockApiClient.put).not.toHaveBeenCalled();
      });

      it('should return error when pharmacy registration fails', async () => {
        mockApiClient.post.mockRejectedValueOnce(
          new Error('Invalid data')
        );

        const result = await registerPharmacy({
          name: 'Test',
          email: 'test@example.com',
          phoneNumber: '080',
          address: 'Test',
          latitude: 0,
          longitude: 0,
          licenseNumber: 'LIC',
          licenseDocUrl: 'url',
          cacNumber: 'CAC',
          cacDocUrl: 'url',
          ownerName: 'Owner',
          ownerIdDocUrl: 'url',
          operatingHours: {},
        });

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('REGISTER_PHARMACY_ERROR');
      });
    });

    describe('addProduct', () => {
      it('should add product to pharmacy successfully', async () => {
        const productData = {
          drugCatalogItemId: 'drug-1',
          sku: 'SKU-001',
          quantity: 100,
          price: 5000,
          expiryDate: '2025-12-31',
          batchNumber: 'BATCH-001',
        };

        const mockProduct = { id: 'prod-1', ...productData };

        mockApiClient.post.mockResolvedValueOnce({
          success: true,
          data: mockProduct,
        });

        const result = await addProduct('pharm-1', productData);

        expect(mockApiClient.post).toHaveBeenCalledWith(
          '/pharmacies/pharm-1/products',
          productData
        );
        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockProduct);
      });

      it('should return error when adding product fails', async () => {
        mockApiClient.post.mockRejectedValueOnce(new Error('Product error'));

        const result = await addProduct('pharm-1', {
          drugCatalogItemId: 'drug-1',
          sku: 'SKU-001',
          quantity: 100,
          price: 5000,
          expiryDate: '2025-12-31',
          batchNumber: 'BATCH-001',
        });

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('ADD_PRODUCT_ERROR');
      });
    });
  });

  describe('Order Service', () => {
    describe('createOrder', () => {
      it('should create order successfully', async () => {
        const orderData = {
          pharmacyId: 'pharm-1',
          items: [{ pharmacyProductId: 'prod-1', quantity: 2 }],
          deliveryProviderId: 'prov-1',
          deliveryAddress: '456 Oak Ave',
          deliveryLatitude: 6.5244,
          deliveryLongitude: 3.3792,
          notes: 'Handle with care',
        };

        const mockOrder = { id: 'order-1', ...orderData, status: 'pending' };

        mockApiClient.post.mockResolvedValueOnce({
          success: true,
          data: mockOrder,
        });

        const result = await createOrder(orderData);

        expect(mockApiClient.post).toHaveBeenCalledWith('/orders', orderData);
        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockOrder);
      });

      it('should use POST method for order creation', async () => {
        mockApiClient.post.mockResolvedValueOnce({
          success: true,
          data: {},
        });

        const orderData = {
          pharmacyId: 'pharm-1',
          items: [{ pharmacyProductId: 'prod-1', quantity: 2 }],
          deliveryProviderId: 'prov-1',
          deliveryAddress: 'Address',
          deliveryLatitude: 0,
          deliveryLongitude: 0,
        };

        await createOrder(orderData);

        expect(mockApiClient.post).toHaveBeenCalled();
      });

      it('should return error when order creation fails', async () => {
        mockApiClient.post.mockRejectedValueOnce(new Error('Order error'));

        const result = await createOrder({
          pharmacyId: 'pharm-1',
          items: [],
          deliveryProviderId: 'prov-1',
          deliveryAddress: 'Address',
          deliveryLatitude: 0,
          deliveryLongitude: 0,
        });

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('CREATE_ORDER_ERROR');
      });
    });

    describe('getMyOrders', () => {
      it('should fetch user orders without params', async () => {
        const mockOrders = {
          orders: [{ id: 'order-1', status: 'pending' }],
        };

        mockApiClient.get.mockResolvedValueOnce({
          success: true,
          data: mockOrders,
        });

        const result = await getMyOrders();

        expect(mockApiClient.get).toHaveBeenCalledWith(
          '/orders/user/my-orders',
          { params: {} }
        );
        expect(result.success).toBe(true);
      });

      it('should include pagination params when provided', async () => {
        mockApiClient.get.mockResolvedValueOnce({
          success: true,
          data: { orders: [] },
        });

        await getMyOrders({ page: 1, limit: 10, status: 'pending' });

        expect(mockApiClient.get).toHaveBeenCalledWith(
          '/orders/user/my-orders',
          {
            params: {
              page: '1',
              limit: '10',
              status: 'pending',
            },
          }
        );
      });

      it('should return error when fetching orders fails', async () => {
        mockApiClient.get.mockRejectedValueOnce(new Error('Fetch error'));

        const result = await getMyOrders();

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('FETCH_ORDERS_ERROR');
      });
    });

    describe('getOrder', () => {
      it('should fetch specific order by ID', async () => {
        const mockOrder = {
          id: 'order-1',
          status: 'pending',
          total: 50000,
        };

        mockApiClient.get.mockResolvedValueOnce({
          success: true,
          data: mockOrder,
        });

        const result = await getOrder('order-1');

        expect(mockApiClient.get).toHaveBeenCalledWith('/orders/order-1');
        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockOrder);
      });

      it('should return error when order not found', async () => {
        mockApiClient.get.mockRejectedValueOnce(
          new Error('Order not found')
        );

        const result = await getOrder('invalid-id');

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('FETCH_ORDER_ERROR');
      });
    });

    describe('updateOrderStatus', () => {
      it('should update order status successfully', async () => {
        const mockUpdatedOrder = {
          id: 'order-1',
          status: 'confirmed',
        };

        mockApiClient.patch.mockResolvedValueOnce({
          success: true,
          data: mockUpdatedOrder,
        });

        const result = await updateOrderStatus('order-1', 'confirmed');

        expect(mockApiClient.patch).toHaveBeenCalledWith(
          '/orders/order-1/status',
          { status: 'confirmed' }
        );
        expect(result.success).toBe(true);
      });

      it('should use PATCH method for status update', async () => {
        mockApiClient.patch.mockResolvedValueOnce({
          success: true,
          data: {},
        });

        await updateOrderStatus('order-1', 'confirmed');

        expect(mockApiClient.patch).toHaveBeenCalled();
        expect(mockApiClient.post).not.toHaveBeenCalled();
        expect(mockApiClient.put).not.toHaveBeenCalled();
      });

      it('should return error when status update fails', async () => {
        mockApiClient.patch.mockRejectedValueOnce(
          new Error('Update error')
        );

        const result = await updateOrderStatus('order-1', 'confirmed');

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('UPDATE_ORDER_STATUS_ERROR');
      });
    });

    describe('cancelOrder', () => {
      it('should cancel order successfully', async () => {
        const mockCancelledOrder = {
          id: 'order-1',
          status: 'cancelled',
        };

        mockApiClient.post.mockResolvedValueOnce({
          success: true,
          data: mockCancelledOrder,
        });

        const result = await cancelOrder('order-1');

        expect(mockApiClient.post).toHaveBeenCalledWith(
          '/orders/order-1/cancel',
          {}
        );
        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockCancelledOrder);
      });

      it('should return error when cancel fails', async () => {
        mockApiClient.post.mockRejectedValueOnce(new Error('Cancel error'));

        const result = await cancelOrder('order-1');

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('CANCEL_ORDER_ERROR');
      });
    });
  });

  describe('Delivery Service', () => {
    describe('registerProvider', () => {
      it('should register delivery provider successfully', async () => {
        const providerData = {
          businessName: 'Quick Delivery',
          email: 'delivery@example.com',
          phoneNumber: '08012345678',
          address: '789 Fast Lane',
          cacNumber: 'CAC-456',
          cacDocUrl: 'https://example.com/cac.pdf',
          ownerName: 'Delivery Owner',
          ownerIdDocUrl: 'https://example.com/id.pdf',
          vehicleDocUrl: 'https://example.com/vehicle.pdf',
          baseFee: 2000,
          perKmFee: 500,
        };

        const mockProvider = { id: 'prov-1', ...providerData };

        mockApiClient.post.mockResolvedValueOnce({
          success: true,
          data: mockProvider,
        });

        const result = await registerProvider(providerData);

        expect(mockApiClient.post).toHaveBeenCalledWith(
          '/delivery/providers/register',
          providerData
        );
        expect(result.success).toBe(true);
      });

      it('should return error when provider registration fails', async () => {
        mockApiClient.post.mockRejectedValueOnce(
          new Error('Registration error')
        );

        const result = await registerProvider({
          businessName: 'Test',
          email: 'test@example.com',
          phoneNumber: '080',
          address: 'Test',
          cacNumber: 'CAC',
          cacDocUrl: 'url',
          ownerName: 'Owner',
          ownerIdDocUrl: 'url',
          vehicleDocUrl: 'url',
          baseFee: 0,
          perKmFee: 0,
        });

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('REGISTER_PROVIDER_ERROR');
      });
    });

    describe('getAvailableProviders', () => {
      it('should fetch available providers with correct params', async () => {
        const mockProviders = [
          { id: 'prov-1', businessName: 'Quick Delivery' },
        ];
        const params = {
          pharmacyId: 'pharm-1',
          customerLatitude: 6.5244,
          customerLongitude: 3.3792,
        };

        mockApiClient.get.mockResolvedValueOnce({
          success: true,
          data: mockProviders,
        });

        const result = await getAvailableProviders(params);

        expect(mockApiClient.get).toHaveBeenCalledWith('/delivery/available', {
          params: {
            pharmacyId: 'pharm-1',
            customerLatitude: '6.5244',
            customerLongitude: '3.3792',
          },
        });
        expect(result.success).toBe(true);
      });

      it('should return error when fetching providers fails', async () => {
        mockApiClient.get.mockRejectedValueOnce(new Error('Fetch error'));

        const result = await getAvailableProviders({
          pharmacyId: 'pharm-1',
          customerLatitude: 6.5244,
          customerLongitude: 3.3792,
        });

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('FETCH_PROVIDERS_ERROR');
      });
    });

    describe('createAssignment', () => {
      it('should create delivery assignment successfully', async () => {
        const assignmentData = {
          orderId: 'order-1',
          deliveryProviderId: 'prov-1',
          pickupLatitude: 6.5244,
          pickupLongitude: 3.3792,
          deliveryLatitude: 6.5250,
          deliveryLongitude: 3.3800,
        };

        const mockAssignment = { id: 'assign-1', ...assignmentData };

        mockApiClient.post.mockResolvedValueOnce({
          success: true,
          data: mockAssignment,
        });

        const result = await createAssignment(assignmentData);

        expect(mockApiClient.post).toHaveBeenCalledWith(
          '/delivery/assignments',
          assignmentData
        );
        expect(result.success).toBe(true);
      });

      it('should return error when creating assignment fails', async () => {
        mockApiClient.post.mockRejectedValueOnce(new Error('Assignment error'));

        const result = await createAssignment({
          orderId: 'order-1',
          deliveryProviderId: 'prov-1',
          pickupLatitude: 0,
          pickupLongitude: 0,
          deliveryLatitude: 0,
          deliveryLongitude: 0,
        });

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('CREATE_ASSIGNMENT_ERROR');
      });
    });

    describe('getAssignment', () => {
      it('should fetch assignment by ID', async () => {
        const mockAssignment = {
          id: 'assign-1',
          status: 'pending',
        };

        mockApiClient.get.mockResolvedValueOnce({
          success: true,
          data: mockAssignment,
        });

        const result = await getAssignment('assign-1');

        expect(mockApiClient.get).toHaveBeenCalledWith(
          '/delivery/assignments/assign-1'
        );
        expect(result.success).toBe(true);
      });

      it('should return error when assignment not found', async () => {
        mockApiClient.get.mockRejectedValueOnce(
          new Error('Assignment not found')
        );

        const result = await getAssignment('invalid-id');

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('FETCH_ASSIGNMENT_ERROR');
      });
    });

    describe('updateAssignmentStatus', () => {
      it('should update assignment status successfully', async () => {
        mockApiClient.patch.mockResolvedValueOnce({
          success: true,
          data: { id: 'assign-1', status: 'in_transit' },
        });

        const result = await updateAssignmentStatus('assign-1', 'in_transit');

        expect(mockApiClient.patch).toHaveBeenCalledWith(
          '/delivery/assignments/assign-1/status',
          { status: 'in_transit' }
        );
        expect(result.success).toBe(true);
      });

      it('should use PATCH method for status update', async () => {
        mockApiClient.patch.mockResolvedValueOnce({
          success: true,
          data: {},
        });

        await updateAssignmentStatus('assign-1', 'in_transit');

        expect(mockApiClient.patch).toHaveBeenCalled();
        expect(mockApiClient.post).not.toHaveBeenCalled();
      });

      it('should return error when status update fails', async () => {
        mockApiClient.patch.mockRejectedValueOnce(new Error('Update error'));

        const result = await updateAssignmentStatus('assign-1', 'in_transit');

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('UPDATE_ASSIGNMENT_STATUS_ERROR');
      });
    });

    describe('verifySecurityCode', () => {
      it('should verify security code successfully', async () => {
        const mockVerification = {
          verified: true,
          code: '123456',
        };

        mockApiClient.post.mockResolvedValueOnce({
          success: true,
          data: mockVerification,
        });

        const result = await verifySecurityCode('assign-1', '123456');

        expect(mockApiClient.post).toHaveBeenCalledWith(
          '/delivery/assignments/assign-1/verify-code',
          { code: '123456' }
        );
        expect(result.success).toBe(true);
      });

      it('should return error when verification fails', async () => {
        mockApiClient.post.mockRejectedValueOnce(
          new Error('Code verification failed')
        );

        const result = await verifySecurityCode('assign-1', 'wrong-code');

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('VERIFY_CODE_ERROR');
      });
    });
  });

  describe('Payment Service', () => {
    describe('initializePayment', () => {
      it('should initialize payment successfully', async () => {
        const mockResponse = {
          authorizationUrl: 'https://checkout.paystack.com/abc123',
          accessCode: 'abc123',
          reference: 'ref-123',
        };

        mockApiClient.post.mockResolvedValueOnce({
          success: true,
          data: mockResponse,
        });

        const result = await initializePayment(
          'order-1',
          'user@example.com',
          50000
        );

        expect(mockApiClient.post).toHaveBeenCalledWith(
          '/payments/initialize',
          {
            orderId: 'order-1',
            email: 'user@example.com',
            amount: 50000,
          }
        );
        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockResponse);
      });

      it('should use POST method for payment initialization', async () => {
        mockApiClient.post.mockResolvedValueOnce({
          success: true,
          data: {},
        });

        await initializePayment('order-1', 'user@example.com', 50000);

        expect(mockApiClient.post).toHaveBeenCalled();
      });

      it('should return error when initialization fails', async () => {
        mockApiClient.post.mockRejectedValueOnce(
          new Error('Payment error')
        );

        const result = await initializePayment(
          'order-1',
          'user@example.com',
          50000
        );

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('INITIALIZE_PAYMENT_ERROR');
      });
    });

    describe('verifyPayment', () => {
      it('should verify payment successfully', async () => {
        const mockResponse = {
          status: 'success',
          amount: 50000,
          reference: 'ref-123',
        };

        mockApiClient.get.mockResolvedValueOnce({
          success: true,
          data: mockResponse,
        });

        const result = await verifyPayment('ref-123');

        expect(mockApiClient.get).toHaveBeenCalledWith(
          '/payments/verify/ref-123'
        );
        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockResponse);
      });

      it('should use GET method for payment verification', async () => {
        mockApiClient.get.mockResolvedValueOnce({
          success: true,
          data: {},
        });

        await verifyPayment('ref-123');

        expect(mockApiClient.get).toHaveBeenCalled();
        expect(mockApiClient.post).not.toHaveBeenCalled();
      });

      it('should return error when verification fails', async () => {
        mockApiClient.get.mockRejectedValueOnce(
          new Error('Verification error')
        );

        const result = await verifyPayment('invalid-ref');

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('VERIFY_PAYMENT_ERROR');
      });
    });

    describe('requestRefund', () => {
      it('should request refund successfully', async () => {
        const mockResponse = {
          status: 'pending',
          refundId: 'refund-123',
        };

        mockApiClient.post.mockResolvedValueOnce({
          success: true,
          data: mockResponse,
        });

        const result = await requestRefund('order-1');

        expect(mockApiClient.post).toHaveBeenCalledWith(
          '/payments/refund',
          { orderId: 'order-1' }
        );
        expect(result.success).toBe(true);
      });

      it('should return error when refund request fails', async () => {
        mockApiClient.post.mockRejectedValueOnce(new Error('Refund error'));

        const result = await requestRefund('order-1');

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('REQUEST_REFUND_ERROR');
      });
    });
  });

  describe('Chat Service', () => {
    describe('createConversation', () => {
      it('should create conversation successfully', async () => {
        const conversationData = {
          type: 'customer_pharmacy' as const,
          pharmacyId: 'pharm-1',
        };

        const mockConversation = {
          id: 'conv-1',
          ...conversationData,
        };

        mockApiClient.post.mockResolvedValueOnce({
          success: true,
          data: mockConversation,
        });

        const result = await createConversation(conversationData);

        expect(mockApiClient.post).toHaveBeenCalledWith(
          '/chat/conversations',
          conversationData
        );
        expect(result.success).toBe(true);
      });

      it('should return error when conversation creation fails', async () => {
        mockApiClient.post.mockRejectedValueOnce(
          new Error('Creation error')
        );

        const result = await createConversation({
          type: 'customer_pharmacy' as const,
        });

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('CREATE_CONVERSATION_ERROR');
      });
    });

    describe('getConversations', () => {
      it('should fetch all conversations', async () => {
        const mockConversations = [
          { id: 'conv-1', type: 'customer_pharmacy' as const },
        ];

        mockApiClient.get.mockResolvedValueOnce({
          success: true,
          data: mockConversations,
        });

        const result = await getConversations();

        expect(mockApiClient.get).toHaveBeenCalledWith('/chat/conversations');
        expect(result.success).toBe(true);
      });

      it('should return error when fetching conversations fails', async () => {
        mockApiClient.get.mockRejectedValueOnce(new Error('Fetch error'));

        const result = await getConversations();

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('FETCH_CONVERSATIONS_ERROR');
      });
    });

    describe('getConversation', () => {
      it('should fetch specific conversation with messages', async () => {
        const mockResponse = {
          conversation: { id: 'conv-1' },
          messages: [{ id: 'msg-1', content: 'Hello' }],
        };

        mockApiClient.get.mockResolvedValueOnce({
          success: true,
          data: mockResponse,
        });

        const result = await getConversation('conv-1');

        expect(mockApiClient.get).toHaveBeenCalledWith(
          '/chat/conversations/conv-1'
        );
        expect(result.success).toBe(true);
      });

      it('should return error when fetching conversation fails', async () => {
        mockApiClient.get.mockRejectedValueOnce(
          new Error('Fetch error')
        );

        const result = await getConversation('conv-1');

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('FETCH_CONVERSATION_ERROR');
      });
    });

    describe('sendMessage', () => {
      it('should send message successfully', async () => {
        const messageData = { content: 'Hello, how are you?' };
        const mockMessage = { id: 'msg-1', ...messageData };

        mockApiClient.post.mockResolvedValueOnce({
          success: true,
          data: mockMessage,
        });

        const result = await sendMessage('conv-1', messageData);

        expect(mockApiClient.post).toHaveBeenCalledWith(
          '/chat/conversations/conv-1/messages',
          messageData
        );
        expect(result.success).toBe(true);
      });

      it('should include image URL when provided', async () => {
        mockApiClient.post.mockResolvedValueOnce({
          success: true,
          data: {},
        });

        const messageData = {
          content: 'Check this image',
          imageUrl: 'https://example.com/image.jpg',
        };

        await sendMessage('conv-1', messageData);

        expect(mockApiClient.post).toHaveBeenCalledWith(
          '/chat/conversations/conv-1/messages',
          messageData
        );
      });

      it('should return error when sending message fails', async () => {
        mockApiClient.post.mockRejectedValueOnce(new Error('Send error'));

        const result = await sendMessage('conv-1', { content: 'Hello' });

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('SEND_MESSAGE_ERROR');
      });
    });

    describe('markAsRead', () => {
      it('should mark message as read successfully', async () => {
        mockApiClient.patch.mockResolvedValueOnce({
          success: true,
          data: null,
        });

        const result = await markAsRead('conv-1', 'msg-1');

        expect(mockApiClient.patch).toHaveBeenCalledWith(
          '/chat/conversations/conv-1/messages/msg-1/read',
          {}
        );
        expect(result.success).toBe(true);
      });

      it('should use PATCH method for marking as read', async () => {
        mockApiClient.patch.mockResolvedValueOnce({
          success: true,
          data: null,
        });

        await markAsRead('conv-1', 'msg-1');

        expect(mockApiClient.patch).toHaveBeenCalled();
        expect(mockApiClient.post).not.toHaveBeenCalled();
      });

      it('should return error when marking as read fails', async () => {
        mockApiClient.patch.mockRejectedValueOnce(new Error('Update error'));

        const result = await markAsRead('conv-1', 'msg-1');

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('MARK_READ_ERROR');
      });
    });

    describe('closeConversation', () => {
      it('should close conversation successfully', async () => {
        const mockConversation = {
          id: 'conv-1',
          status: 'closed',
        };

        mockApiClient.post.mockResolvedValueOnce({
          success: true,
          data: mockConversation,
        });

        const result = await closeConversation('conv-1');

        expect(mockApiClient.post).toHaveBeenCalledWith(
          '/chat/conversations/conv-1/close',
          {}
        );
        expect(result.success).toBe(true);
      });

      it('should return error when closing conversation fails', async () => {
        mockApiClient.post.mockRejectedValueOnce(new Error('Close error'));

        const result = await closeConversation('conv-1');

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('CLOSE_CONVERSATION_ERROR');
      });
    });
  });

  describe('Admin Service', () => {
    describe('getPendingPharmacies', () => {
      it('should fetch pending pharmacies successfully', async () => {
        const mockPharmacies = [
          { id: 'pharm-1', name: 'Pending Pharmacy', status: 'pending' },
        ];

        mockApiClient.get.mockResolvedValueOnce({
          success: true,
          data: mockPharmacies,
        });

        const result = await getPendingPharmacies();

        expect(mockApiClient.get).toHaveBeenCalledWith(
          '/admin/pending-pharmacies'
        );
        expect(result.success).toBe(true);
      });

      it('should return error when fetching fails', async () => {
        mockApiClient.get.mockRejectedValueOnce(new Error('Fetch error'));

        const result = await getPendingPharmacies();

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('FETCH_PENDING_PHARMACIES_ERROR');
      });
    });

    describe('approvePharmacy', () => {
      it('should approve pharmacy successfully', async () => {
        const mockPharmacy = {
          id: 'pharm-1',
          status: 'approved',
        };

        mockApiClient.post.mockResolvedValueOnce({
          success: true,
          data: mockPharmacy,
        });

        const result = await approvePharmacy('pharm-1');

        expect(mockApiClient.post).toHaveBeenCalledWith(
          '/admin/pharmacies/pharm-1/approve',
          {}
        );
        expect(result.success).toBe(true);
      });

      it('should return error when approval fails', async () => {
        mockApiClient.post.mockRejectedValueOnce(new Error('Approval error'));

        const result = await approvePharmacy('pharm-1');

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('APPROVE_PHARMACY_ERROR');
      });
    });

    describe('rejectPharmacy', () => {
      it('should reject pharmacy with reason', async () => {
        const mockPharmacy = {
          id: 'pharm-1',
          status: 'rejected',
        };

        mockApiClient.post.mockResolvedValueOnce({
          success: true,
          data: mockPharmacy,
        });

        const result = await rejectPharmacy('pharm-1', 'Invalid license');

        expect(mockApiClient.post).toHaveBeenCalledWith(
          '/admin/pharmacies/pharm-1/reject',
          { reason: 'Invalid license' }
        );
        expect(result.success).toBe(true);
      });

      it('should return error when rejection fails', async () => {
        mockApiClient.post.mockRejectedValueOnce(new Error('Rejection error'));

        const result = await rejectPharmacy('pharm-1', 'Invalid data');

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('REJECT_PHARMACY_ERROR');
      });
    });

    describe('getPendingProviders', () => {
      it('should fetch pending delivery providers', async () => {
        const mockProviders = [
          { id: 'prov-1', businessName: 'Pending Provider' },
        ];

        mockApiClient.get.mockResolvedValueOnce({
          success: true,
          data: mockProviders,
        });

        const result = await getPendingProviders();

        expect(mockApiClient.get).toHaveBeenCalledWith(
          '/admin/pending-providers'
        );
        expect(result.success).toBe(true);
      });

      it('should return error when fetching fails', async () => {
        mockApiClient.get.mockRejectedValueOnce(new Error('Fetch error'));

        const result = await getPendingProviders();

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('FETCH_PENDING_PROVIDERS_ERROR');
      });
    });

    describe('approveProvider', () => {
      it('should approve delivery provider successfully', async () => {
        const mockProvider = {
          id: 'prov-1',
          status: 'approved',
        };

        mockApiClient.post.mockResolvedValueOnce({
          success: true,
          data: mockProvider,
        });

        const result = await approveProvider('prov-1');

        expect(mockApiClient.post).toHaveBeenCalledWith(
          '/admin/providers/prov-1/approve',
          {}
        );
        expect(result.success).toBe(true);
      });

      it('should return error when approval fails', async () => {
        mockApiClient.post.mockRejectedValueOnce(new Error('Approval error'));

        const result = await approveProvider('prov-1');

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('APPROVE_PROVIDER_ERROR');
      });
    });

    describe('rejectProvider', () => {
      it('should reject delivery provider with reason', async () => {
        const mockProvider = {
          id: 'prov-1',
          status: 'rejected',
        };

        mockApiClient.post.mockResolvedValueOnce({
          success: true,
          data: mockProvider,
        });

        const result = await rejectProvider('prov-1', 'Invalid documents');

        expect(mockApiClient.post).toHaveBeenCalledWith(
          '/admin/providers/prov-1/reject',
          { reason: 'Invalid documents' }
        );
        expect(result.success).toBe(true);
      });

      it('should return error when rejection fails', async () => {
        mockApiClient.post.mockRejectedValueOnce(new Error('Rejection error'));

        const result = await rejectProvider('prov-1', 'Invalid data');

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('REJECT_PROVIDER_ERROR');
      });
    });

    describe('getFlaggedAlerts', () => {
      it('should fetch flagged alerts successfully', async () => {
        const mockAlerts = [
          { id: 'alert-1', type: 'prescription_detected' },
        ];

        mockApiClient.get.mockResolvedValueOnce({
          success: true,
          data: mockAlerts,
        });

        const result = await getFlaggedAlerts();

        expect(mockApiClient.get).toHaveBeenCalledWith(
          '/admin/flagged-alerts'
        );
        expect(result.success).toBe(true);
      });

      it('should return error when fetching fails', async () => {
        mockApiClient.get.mockRejectedValueOnce(new Error('Fetch error'));

        const result = await getFlaggedAlerts();

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('FETCH_FLAGGED_ALERTS_ERROR');
      });
    });

    describe('reviewFlaggedAlert', () => {
      it('should review flagged alert successfully', async () => {
        const reviewData = {
          action: 'dismiss' as const,
          notes: 'False positive',
        };

        const mockAlert = {
          id: 'alert-1',
          status: 'reviewed',
        };

        mockApiClient.post.mockResolvedValueOnce({
          success: true,
          data: mockAlert,
        });

        const result = await reviewFlaggedAlert('alert-1', reviewData);

        expect(mockApiClient.post).toHaveBeenCalledWith(
          '/admin/flagged-alerts/alert-1/review',
          reviewData
        );
        expect(result.success).toBe(true);
      });

      it('should return error when review fails', async () => {
        mockApiClient.post.mockRejectedValueOnce(new Error('Review error'));

        const result = await reviewFlaggedAlert('alert-1', {
          action: 'dismiss' as const,
        });

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('REVIEW_ALERT_ERROR');
      });
    });

    describe('getDashboard', () => {
      it('should fetch dashboard statistics', async () => {
        const mockDashboard = {
          totalOrders: 100,
          totalRevenue: 5000000,
        };

        mockApiClient.get.mockResolvedValueOnce({
          success: true,
          data: mockDashboard,
        });

        const result = await getDashboard();

        expect(mockApiClient.get).toHaveBeenCalledWith('/admin/dashboard');
        expect(result.success).toBe(true);
      });

      it('should return error when fetching dashboard fails', async () => {
        mockApiClient.get.mockRejectedValueOnce(new Error('Fetch error'));

        const result = await getDashboard();

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('FETCH_DASHBOARD_ERROR');
      });
    });

    describe('getTransactions', () => {
      it('should fetch transactions without params', async () => {
        const mockTransactions = [
          { id: 'trans-1', amount: 50000 },
        ];

        mockApiClient.get.mockResolvedValueOnce({
          success: true,
          data: mockTransactions,
        });

        const result = await getTransactions();

        expect(mockApiClient.get).toHaveBeenCalledWith('/admin/transactions', {
          params: {},
        });
        expect(result.success).toBe(true);
      });

      it('should include filter params when provided', async () => {
        mockApiClient.get.mockResolvedValueOnce({
          success: true,
          data: [],
        });

        await getTransactions({
          page: 1,
          limit: 20,
          startDate: '2025-01-01',
          endDate: '2025-12-31',
        });

        expect(mockApiClient.get).toHaveBeenCalledWith('/admin/transactions', {
          params: {
            page: '1',
            limit: '20',
            startDate: '2025-01-01',
            endDate: '2025-12-31',
          },
        });
      });

      it('should return error when fetching transactions fails', async () => {
        mockApiClient.get.mockRejectedValueOnce(new Error('Fetch error'));

        const result = await getTransactions();

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('FETCH_TRANSACTIONS_ERROR');
      });
    });
  });
});
