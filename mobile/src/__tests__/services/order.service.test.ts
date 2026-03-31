import { orderService } from '../../services/order.service';
import { apiClient } from '../../lib/api';

jest.mock('../../lib/api');

describe('OrderService', () => {
  const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrders', () => {
    it('should fetch all orders without filters', async () => {
      const mockOrders = [
        { id: 'o1', status: 'delivered' },
        { id: 'o2', status: 'pending' },
      ];

      mockApiClient.get.mockResolvedValueOnce({
        success: true,
        data: mockOrders,
      });

      const result = await orderService.getOrders();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockOrders);
      expect(mockApiClient.get).toHaveBeenCalledWith('/orders');
    });

    it('should fetch orders filtered by status', async () => {
      const mockOrders = [
        { id: 'o1', status: 'pending' },
        { id: 'o2', status: 'pending' },
      ];

      mockApiClient.get.mockResolvedValueOnce({
        success: true,
        data: mockOrders,
      });

      const result = await orderService.getOrders({ status: 'pending' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockOrders);
      expect(mockApiClient.get).toHaveBeenCalledWith('/orders?status=pending');
    });

    it('should fetch orders with limit parameter', async () => {
      const mockOrders = [{ id: 'o1', status: 'delivered' }];

      mockApiClient.get.mockResolvedValueOnce({
        success: true,
        data: mockOrders,
      });

      const result = await orderService.getOrders({ limit: 10 });

      expect(result.success).toBe(true);
      expect(mockApiClient.get).toHaveBeenCalledWith('/orders?limit=10');
    });

    it('should fetch orders with both status and limit filters', async () => {
      const mockOrders = [{ id: 'o1', status: 'delivered' }];

      mockApiClient.get.mockResolvedValueOnce({
        success: true,
        data: mockOrders,
      });

      const result = await orderService.getOrders({
        status: 'delivered',
        limit: 5,
      });

      expect(result.success).toBe(true);
      expect(mockApiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('status=delivered')
      );
      expect(mockApiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('limit=5')
      );
    });

    it('should handle API errors when fetching orders', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        success: false,
        error: { message: 'Failed to fetch orders' },
      });

      const result = await orderService.getOrders();

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Failed to fetch orders');
    });

    it('should return empty orders list if no orders exist', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        success: true,
        data: [],
      });

      const result = await orderService.getOrders();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('getOrder', () => {
    it('should fetch a single order by ID', async () => {
      const mockOrder = {
        id: 'o1',
        status: 'pending',
        totalAmount: 5000,
      };

      mockApiClient.get.mockResolvedValueOnce({
        success: true,
        data: mockOrder,
      });

      const result = await orderService.getOrder('o1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockOrder);
      expect(mockApiClient.get).toHaveBeenCalledWith('/orders/o1');
    });

    it('should handle order not found error', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        success: false,
        error: { message: 'Order not found' },
      });

      const result = await orderService.getOrder('invalid-id');

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Order not found');
    });

    it('should call API with correct order ID', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        success: true,
        data: {},
      });

      await orderService.getOrder('order-abc-123');

      expect(mockApiClient.get).toHaveBeenCalledWith('/orders/order-abc-123');
    });
  });

  describe('createOrder', () => {
    it('should create a new order with required fields', async () => {
      const orderData = {
        pharmacyId: 'p1',
        items: [
          { productId: 'prod1', quantity: 2 },
          { productId: 'prod2', quantity: 1 },
        ],
        deliveryAddress: {
          lat: 6.4541,
          lng: 3.4218,
          address: '123 Main St',
        },
      };

      const mockResponse = {
        id: 'o1',
        ...orderData,
        status: 'pending',
      };

      mockApiClient.post.mockResolvedValueOnce({
        success: true,
        data: mockResponse,
      });

      const result = await orderService.createOrder(orderData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
      expect(mockApiClient.post).toHaveBeenCalledWith('/orders', orderData);
    });

    it('should create order with optional delivery provider ID', async () => {
      const orderData = {
        pharmacyId: 'p1',
        items: [{ productId: 'prod1', quantity: 1 }],
        deliveryAddress: {
          lat: 6.4541,
          lng: 3.4218,
          address: '123 Main St',
        },
        deliveryProviderId: 'dp1',
      };

      mockApiClient.post.mockResolvedValueOnce({
        success: true,
        data: { id: 'o1', ...orderData },
      });

      const result = await orderService.createOrder(orderData);

      expect(result.success).toBe(true);
      expect(mockApiClient.post).toHaveBeenCalledWith('/orders', orderData);
    });

    it('should handle validation errors during order creation', async () => {
      const orderData = {
        pharmacyId: 'p1',
        items: [],
        deliveryAddress: {
          lat: 6.4541,
          lng: 3.4218,
          address: '123 Main St',
        },
      };

      mockApiClient.post.mockResolvedValueOnce({
        success: false,
        error: { message: 'Order must contain at least one item' },
      });

      const result = await orderService.createOrder(orderData);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('at least one item');
    });

    it('should handle API errors during order creation', async () => {
      const orderData = {
        pharmacyId: 'p1',
        items: [{ productId: 'prod1', quantity: 1 }],
        deliveryAddress: {
          lat: 6.4541,
          lng: 3.4218,
          address: '123 Main St',
        },
      };

      mockApiClient.post.mockResolvedValueOnce({
        success: false,
        error: { message: 'Internal server error' },
      });

      const result = await orderService.createOrder(orderData);

      expect(result.success).toBe(false);
    });
  });

  describe('cancelOrder', () => {
    it('should cancel an order successfully', async () => {
      const mockResponse = {
        id: 'o1',
        status: 'cancelled',
      };

      mockApiClient.patch.mockResolvedValueOnce({
        success: true,
        data: mockResponse,
      });

      const result = await orderService.cancelOrder('o1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
      expect(mockApiClient.patch).toHaveBeenCalledWith('/orders/o1/cancel');
    });

    it('should handle error when cancelling non-existent order', async () => {
      mockApiClient.patch.mockResolvedValueOnce({
        success: false,
        error: { message: 'Order not found' },
      });

      const result = await orderService.cancelOrder('invalid-id');

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Order not found');
    });

    it('should handle error when order cannot be cancelled', async () => {
      mockApiClient.patch.mockResolvedValueOnce({
        success: false,
        error: { message: 'Cannot cancel delivered order' },
      });

      const result = await orderService.cancelOrder('o1');

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Cannot cancel');
    });

    it('should call API with correct order ID', async () => {
      mockApiClient.patch.mockResolvedValueOnce({
        success: true,
        data: {},
      });

      await orderService.cancelOrder('order-xyz-789');

      expect(mockApiClient.patch).toHaveBeenCalledWith(
        '/orders/order-xyz-789/cancel'
      );
    });
  });
});
