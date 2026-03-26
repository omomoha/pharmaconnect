import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useApi,
  useOrders,
  useOrder,
  useNearbyPharmacies,
  usePharmacy,
  usePharmacyProducts,
  useConversations,
  useConversation,
  useAvailableProviders,
  useDelivery,
  useDeliveryAssignment,
  useAdminDashboard,
  usePendingApprovals,
  useFlaggedAlerts,
  usePaystack,
  useSocket,
  useNotifications,
} from '@/hooks';

// Mock the service modules
jest.mock('@/lib/services', () => ({
  orderService: {
    getMyOrders: jest.fn(),
    getOrder: jest.fn(),
  },
  pharmacyService: {
    getNearbyPharmacies: jest.fn(),
    getPharmacy: jest.fn(),
    getPharmacyProducts: jest.fn(),
  },
  chatService: {
    getConversations: jest.fn(),
    getConversation: jest.fn(),
    sendMessage: jest.fn(),
    markAsRead: jest.fn(),
  },
  deliveryService: {
    getAvailableProviders: jest.fn(),
    getAssignment: jest.fn(),
    updateAssignmentStatus: jest.fn(),
    verifySecurityCode: jest.fn(),
  },
  adminService: {
    getDashboard: jest.fn(),
    getPendingPharmacies: jest.fn(),
    getPendingProviders: jest.fn(),
    approvePharmacy: jest.fn(),
    rejectPharmacy: jest.fn(),
    approveProvider: jest.fn(),
    rejectProvider: jest.fn(),
    getFlaggedAlerts: jest.fn(),
    reviewFlaggedAlert: jest.fn(),
  },
  paymentService: {
    initializePayment: jest.fn(),
    verifyPayment: jest.fn(),
  },
}));

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  auth: {
    onAuthStateChanged: jest.fn(),
    currentUser: null,
  },
  db: {},
}));

// Mock Socket.IO
jest.mock('@/lib/socket', () => ({
  getSocket: jest.fn(),
  connectSocket: jest.fn(),
  disconnectSocket: jest.fn(),
  joinChatRoom: jest.fn(),
}));

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  onSnapshot: jest.fn(),
  updateDoc: jest.fn(),
  doc: jest.fn(),
}));

import {
  orderService,
  pharmacyService,
  chatService,
  deliveryService,
  adminService,
  paymentService,
} from '@/lib/services';
import { auth } from '@/lib/firebase';
import {
  getSocket,
  connectSocket,
  disconnectSocket,
  joinChatRoom,
} from '@/lib/socket';

describe('useApi Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    const fetcher = jest.fn().mockResolvedValue({
      success: true,
      data: { id: '1', name: 'Test' },
    });

    const { result } = renderHook(() => useApi(fetcher));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should fetch data successfully', async () => {
    const mockData = { id: '1', name: 'Test Data' };
    const fetcher = jest.fn().mockResolvedValue({
      success: true,
      data: mockData,
    });

    const { result } = renderHook(() => useApi(fetcher));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('should handle API errors', async () => {
    const errorMsg = 'API Error';
    const fetcher = jest.fn().mockResolvedValue({
      success: false,
      error: { message: errorMsg },
    });

    const { result } = renderHook(() => useApi(fetcher));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(errorMsg);
    expect(result.current.data).toBeNull();
  });

  it('should handle throw errors', async () => {
    const errorMsg = 'Network Error';
    const fetcher = jest.fn().mockRejectedValue(new Error(errorMsg));

    const { result } = renderHook(() => useApi(fetcher));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(errorMsg);
  });

  it('should refetch data', async () => {
    const mockData = { id: '1' };
    const fetcher = jest.fn().mockResolvedValue({
      success: true,
      data: mockData,
    });

    const { result } = renderHook(() => useApi(fetcher));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetcher).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledTimes(2);
    });
  });
});

describe('useOrders Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch orders successfully', async () => {
    const mockOrders = [
      { id: '1', status: 'pending', total: 5000 },
      { id: '2', status: 'delivered', total: 3000 },
    ];

    (orderService.getMyOrders as jest.Mock).mockResolvedValue({
      success: true,
      data: mockOrders,
    });

    const { result } = renderHook(() => useOrders());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.orders).toEqual(mockOrders);
    expect(result.current.error).toBeNull();
  });

  it('should handle orders with pagination', async () => {
    const mockOrders = [{ id: '1', status: 'pending' }];

    (orderService.getMyOrders as jest.Mock).mockResolvedValue({
      success: true,
      data: mockOrders,
    });

    const { result } = renderHook(() => useOrders({ page: 2, limit: 10 }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(orderService.getMyOrders).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      status: undefined,
    });
  });

  it('should handle error fetching orders', async () => {
    (orderService.getMyOrders as jest.Mock).mockResolvedValue({
      success: false,
      error: { message: 'Failed to fetch' },
    });

    const { result } = renderHook(() => useOrders());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch');
    expect(result.current.orders).toEqual([]);
  });

  it('should refetch orders', async () => {
    (orderService.getMyOrders as jest.Mock).mockResolvedValue({
      success: true,
      data: [],
    });

    const { result } = renderHook(() => useOrders());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(orderService.getMyOrders).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(orderService.getMyOrders).toHaveBeenCalledTimes(2);
    });
  });
});

describe('useOrder Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch single order by ID', async () => {
    const mockOrder = { id: 'order-1', status: 'pending', total: 5000 };

    (orderService.getOrder as jest.Mock).mockResolvedValue({
      success: true,
      data: mockOrder,
    });

    const { result } = renderHook(() => useOrder('order-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.order).toEqual(mockOrder);
    expect(orderService.getOrder).toHaveBeenCalledWith('order-1');
  });

  it('should handle empty orderId', () => {
    const { result } = renderHook(() => useOrder(''));

    expect(result.current.loading).toBe(false);
    expect(result.current.order).toBeNull();
  });

  it('should handle order fetch error', async () => {
    (orderService.getOrder as jest.Mock).mockResolvedValue({
      success: false,
      error: { message: 'Order not found' },
    });

    const { result } = renderHook(() => useOrder('invalid-id'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Order not found');
  });
});

describe('useNearbyPharmacies Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch nearby pharmacies', async () => {
    const mockPharmacies = [
      { id: '1', name: 'Pharmacy A', latitude: 6.5, longitude: 3.5 },
      { id: '2', name: 'Pharmacy B', latitude: 6.6, longitude: 3.6 },
    ];

    (pharmacyService.getNearbyPharmacies as jest.Mock).mockResolvedValue({
      success: true,
      data: mockPharmacies,
    });

    const { result } = renderHook(() =>
      useNearbyPharmacies(6.5, 3.5, 10)
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.pharmacies).toEqual(mockPharmacies);
    expect(pharmacyService.getNearbyPharmacies).toHaveBeenCalledWith({
      lat: 6.5,
      lng: 3.5,
      radius: 10,
    });
  });

  it('should handle missing coordinates', () => {
    const { result } = renderHook(() => useNearbyPharmacies(undefined, undefined));

    expect(result.current.loading).toBe(false);
    expect(result.current.pharmacies).toEqual([]);
  });

  it('should handle fetch error', async () => {
    (pharmacyService.getNearbyPharmacies as jest.Mock).mockResolvedValue({
      success: false,
      error: { message: 'Location not supported' },
    });

    const { result } = renderHook(() => useNearbyPharmacies(6.5, 3.5));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Location not supported');
  });
});

describe('usePharmacy Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch pharmacy by ID', async () => {
    const mockPharmacy = {
      id: 'pharm-1',
      name: 'Test Pharmacy',
      latitude: 6.5,
      longitude: 3.5,
    };

    (pharmacyService.getPharmacy as jest.Mock).mockResolvedValue({
      success: true,
      data: mockPharmacy,
    });

    const { result } = renderHook(() => usePharmacy('pharm-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.pharmacy).toEqual(mockPharmacy);
  });

  it('should handle empty ID', () => {
    const { result } = renderHook(() => usePharmacy(''));

    expect(result.current.loading).toBe(false);
    expect(result.current.pharmacy).toBeNull();
  });

  it('should support refetch', async () => {
    (pharmacyService.getPharmacy as jest.Mock).mockResolvedValue({
      success: true,
      data: { id: 'pharm-1' },
    });

    const { result } = renderHook(() => usePharmacy('pharm-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(pharmacyService.getPharmacy).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(pharmacyService.getPharmacy).toHaveBeenCalledTimes(2);
    });
  });
});

describe('usePharmacyProducts Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch products for a pharmacy', async () => {
    const mockProducts = [
      { id: 'prod-1', name: 'Paracetamol', price: 500 },
      { id: 'prod-2', name: 'Ibuprofen', price: 800 },
    ];

    (pharmacyService.getPharmacyProducts as jest.Mock).mockResolvedValue({
      success: true,
      data: mockProducts,
    });

    const { result } = renderHook(() => usePharmacyProducts('pharm-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.products).toEqual(mockProducts);
  });

  it('should handle empty pharmacyId', () => {
    const { result } = renderHook(() => usePharmacyProducts(''));

    expect(result.current.loading).toBe(false);
    expect(result.current.products).toEqual([]);
  });
});

describe('useConversations Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch all conversations', async () => {
    const mockConversations = [
      { id: 'conv-1', type: 'customer_pharmacy', lastMessage: 'Hello' },
      { id: 'conv-2', type: 'customer_rider', lastMessage: 'On the way' },
    ];

    (chatService.getConversations as jest.Mock).mockResolvedValue({
      success: true,
      data: mockConversations,
    });

    const { result } = renderHook(() => useConversations());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.conversations).toEqual(mockConversations);
  });

  it('should handle conversation fetch error', async () => {
    (chatService.getConversations as jest.Mock).mockResolvedValue({
      success: false,
      error: { message: 'Failed to fetch' },
    });

    const { result } = renderHook(() => useConversations());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch');
  });

  it('should support refetch', async () => {
    (chatService.getConversations as jest.Mock).mockResolvedValue({
      success: true,
      data: [],
    });

    const { result } = renderHook(() => useConversations());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(chatService.getConversations).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(chatService.getConversations).toHaveBeenCalledTimes(2);
    });
  });
});

describe('useConversation Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch conversation with messages', async () => {
    const mockConversation = {
      conversation: { id: 'conv-1', type: 'customer_pharmacy' },
      messages: [
        { id: 'msg-1', content: 'Hi', senderId: 'user1' },
        { id: 'msg-2', content: 'Hello', senderId: 'user2' },
      ],
    };

    (chatService.getConversation as jest.Mock).mockResolvedValue({
      success: true,
      data: mockConversation,
    });

    const { result } = renderHook(() => useConversation('conv-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.conversation).toEqual(mockConversation.conversation);
    expect(result.current.messages).toEqual(mockConversation.messages);
  });

  it('should send message', async () => {
    const newMessage = { id: 'msg-3', content: 'New message', senderId: 'user1' };

    (chatService.getConversation as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        conversation: { id: 'conv-1' },
        messages: [],
      },
    });

    (chatService.sendMessage as jest.Mock).mockResolvedValue({
      success: true,
      data: newMessage,
    });

    const { result } = renderHook(() => useConversation('conv-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let sentMessage;
    await act(async () => {
      sentMessage = await result.current.sendMessage('New message');
    });

    expect(sentMessage).toEqual(newMessage);
    expect(result.current.messages).toContainEqual(newMessage);
    expect(result.current.sendingMessage).toBe(false);
  });

  it('should mark message as read', async () => {
    const mockMessage = { id: 'msg-1', content: 'Test', readAt: null };

    (chatService.getConversation as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        conversation: { id: 'conv-1' },
        messages: [mockMessage],
      },
    });

    (chatService.markAsRead as jest.Mock).mockResolvedValue({
      success: true,
    });

    const { result } = renderHook(() => useConversation('conv-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let isRead;
    await act(async () => {
      isRead = await result.current.markAsRead('msg-1');
    });

    expect(isRead).toBe(true);
    expect(result.current.messages[0].readAt).not.toBeNull();
  });

  it('should handle empty conversationId', () => {
    const { result } = renderHook(() => useConversation(''));

    expect(result.current.loading).toBe(false);
  });
});

describe('useAvailableProviders Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch available delivery providers', async () => {
    const mockProviders = [
      { id: 'prov-1', name: 'Fast Delivery', distance: 2.5, eta: 15 },
      { id: 'prov-2', name: 'Standard Delivery', distance: 3.0, eta: 25 },
    ];

    (deliveryService.getAvailableProviders as jest.Mock).mockResolvedValue({
      success: true,
      data: mockProviders,
    });

    const { result } = renderHook(() =>
      useAvailableProviders('pharm-1', { lat: 6.5, lng: 3.5 })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.providers).toEqual(mockProviders);
  });

  it('should handle missing location', () => {
    const { result } = renderHook(() => useAvailableProviders('pharm-1'));

    expect(result.current.loading).toBe(false);
    expect(result.current.providers).toEqual([]);
  });

  it('should support refetch', async () => {
    (deliveryService.getAvailableProviders as jest.Mock).mockResolvedValue({
      success: true,
      data: [],
    });

    const { result } = renderHook(() =>
      useAvailableProviders('pharm-1', { lat: 6.5, lng: 3.5 })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(deliveryService.getAvailableProviders).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(deliveryService.getAvailableProviders).toHaveBeenCalledTimes(2);
    });
  });
});

describe('useDelivery Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch delivery assignments', async () => {
    const mockAssignments = [
      { id: 'assign-1', status: 'pending', orderId: 'order-1' },
      { id: 'assign-2', status: 'in_transit', orderId: 'order-2' },
    ];

    (deliveryService.getAssignment as jest.Mock).mockResolvedValue({
      success: true,
      data: mockAssignments,
    });

    const { result } = renderHook(() => useDelivery());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.assignments).toEqual(mockAssignments);
  });

  it('should handle no assignments', async () => {
    (deliveryService.getAssignment as jest.Mock).mockResolvedValue({
      success: false,
    });

    const { result } = renderHook(() => useDelivery());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.assignments).toEqual([]);
  });

  it('should support refetch', async () => {
    (deliveryService.getAssignment as jest.Mock).mockResolvedValue({
      success: true,
      data: [],
    });

    const { result } = renderHook(() => useDelivery());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(deliveryService.getAssignment).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(deliveryService.getAssignment).toHaveBeenCalledTimes(2);
    });
  });
});

describe('useDeliveryAssignment Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch delivery assignment', async () => {
    const mockAssignment = {
      id: 'assign-1',
      status: 'pending',
      orderId: 'order-1',
    };

    (deliveryService.getAssignment as jest.Mock).mockResolvedValue({
      success: true,
      data: mockAssignment,
    });

    const { result } = renderHook(() => useDeliveryAssignment('assign-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.assignment).toEqual(mockAssignment);
  });

  it('should update assignment status', async () => {
    const initialAssignment = { id: 'assign-1', status: 'pending' };
    const updatedAssignment = { id: 'assign-1', status: 'accepted' };

    (deliveryService.getAssignment as jest.Mock).mockResolvedValue({
      success: true,
      data: initialAssignment,
    });

    (deliveryService.updateAssignmentStatus as jest.Mock).mockResolvedValue({
      success: true,
      data: updatedAssignment,
    });

    const { result } = renderHook(() => useDeliveryAssignment('assign-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let isUpdated;
    await act(async () => {
      isUpdated = await result.current.updateStatus('accepted');
    });

    expect(isUpdated).toBe(true);
    expect(result.current.assignment).toEqual(updatedAssignment);
  });

  it('should verify security code', async () => {
    const mockVerification = { verified: true, timestamp: new Date() };

    (deliveryService.getAssignment as jest.Mock).mockResolvedValue({
      success: true,
      data: { id: 'assign-1' },
    });

    (deliveryService.verifySecurityCode as jest.Mock).mockResolvedValue({
      success: true,
      data: mockVerification,
    });

    const { result } = renderHook(() => useDeliveryAssignment('assign-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let verified;
    await act(async () => {
      verified = await result.current.verifyCode('1234');
    });

    expect(verified).toEqual(mockVerification);
  });

  it('should handle empty assignmentId', () => {
    const { result } = renderHook(() => useDeliveryAssignment(''));

    expect(result.current.loading).toBe(false);
    expect(result.current.assignment).toBeNull();
  });
});

describe('useAdminDashboard Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch dashboard stats', async () => {
    const mockStats = {
      totalOrders: 1000,
      totalRevenue: 500000,
      activePharmacies: 50,
      activeDeliveryProviders: 30,
    };

    (adminService.getDashboard as jest.Mock).mockResolvedValue({
      success: true,
      data: mockStats,
    });

    const { result } = renderHook(() => useAdminDashboard());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats).toEqual(mockStats);
  });

  it('should handle dashboard fetch error', async () => {
    (adminService.getDashboard as jest.Mock).mockResolvedValue({
      success: false,
      error: { message: 'Permission denied' },
    });

    const { result } = renderHook(() => useAdminDashboard());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Permission denied');
  });

  it('should support refetch', async () => {
    (adminService.getDashboard as jest.Mock).mockResolvedValue({
      success: true,
      data: {},
    });

    const { result } = renderHook(() => useAdminDashboard());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(adminService.getDashboard).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(adminService.getDashboard).toHaveBeenCalledTimes(2);
    });
  });
});

describe('usePendingApprovals Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch pending approvals', async () => {
    const mockPharmacies = [{ id: 'pharm-1', status: 'pending' }];
    const mockProviders = [{ id: 'prov-1', status: 'pending' }];

    (adminService.getPendingPharmacies as jest.Mock).mockResolvedValue({
      success: true,
      data: mockPharmacies,
    });

    (adminService.getPendingProviders as jest.Mock).mockResolvedValue({
      success: true,
      data: mockProviders,
    });

    const { result } = renderHook(() => usePendingApprovals());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.pharmacies).toEqual(mockPharmacies);
    expect(result.current.providers).toEqual(mockProviders);
  });

  it('should approve pharmacy', async () => {
    const mockPharmacies = [{ id: 'pharm-1', name: 'Test' }];

    (adminService.getPendingPharmacies as jest.Mock).mockResolvedValue({
      success: true,
      data: mockPharmacies,
    });

    (adminService.getPendingProviders as jest.Mock).mockResolvedValue({
      success: true,
      data: [],
    });

    (adminService.approvePharmacy as jest.Mock).mockResolvedValue({
      success: true,
    });

    const { result } = renderHook(() => usePendingApprovals());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.pharmacies).toHaveLength(1);

    let approved;
    await act(async () => {
      approved = await result.current.approvePharmacy('pharm-1');
    });

    expect(approved).toBe(true);
    expect(result.current.pharmacies).toHaveLength(0);
  });

  it('should reject pharmacy', async () => {
    const mockPharmacies = [{ id: 'pharm-1', name: 'Test' }];

    (adminService.getPendingPharmacies as jest.Mock).mockResolvedValue({
      success: true,
      data: mockPharmacies,
    });

    (adminService.getPendingProviders as jest.Mock).mockResolvedValue({
      success: true,
      data: [],
    });

    (adminService.rejectPharmacy as jest.Mock).mockResolvedValue({
      success: true,
    });

    const { result } = renderHook(() => usePendingApprovals());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let rejected;
    await act(async () => {
      rejected = await result.current.rejectPharmacy('pharm-1', 'Invalid documents');
    });

    expect(rejected).toBe(true);
  });

  it('should approve provider', async () => {
    (adminService.getPendingPharmacies as jest.Mock).mockResolvedValue({
      success: true,
      data: [],
    });

    const mockProviders = [{ id: 'prov-1', name: 'Test Provider' }];

    (adminService.getPendingProviders as jest.Mock).mockResolvedValue({
      success: true,
      data: mockProviders,
    });

    (adminService.approveProvider as jest.Mock).mockResolvedValue({
      success: true,
    });

    const { result } = renderHook(() => usePendingApprovals());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let approved;
    await act(async () => {
      approved = await result.current.approveProvider('prov-1');
    });

    expect(approved).toBe(true);
    expect(result.current.providers).toHaveLength(0);
  });

  it('should reject provider', async () => {
    (adminService.getPendingPharmacies as jest.Mock).mockResolvedValue({
      success: true,
      data: [],
    });

    const mockProviders = [{ id: 'prov-1', name: 'Test Provider' }];

    (adminService.getPendingProviders as jest.Mock).mockResolvedValue({
      success: true,
      data: mockProviders,
    });

    (adminService.rejectProvider as jest.Mock).mockResolvedValue({
      success: true,
    });

    const { result } = renderHook(() => usePendingApprovals());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let rejected;
    await act(async () => {
      rejected = await result.current.rejectProvider('prov-1', 'Vehicle documents invalid');
    });

    expect(rejected).toBe(true);
  });
});

describe('useFlaggedAlerts Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch flagged alerts', async () => {
    const mockAlerts = [
      { id: 'alert-1', reason: 'prescription_mentioned', severity: 'high' },
      { id: 'alert-2', reason: 'inappropriate_language', severity: 'medium' },
    ];

    (adminService.getFlaggedAlerts as jest.Mock).mockResolvedValue({
      success: true,
      data: mockAlerts,
    });

    const { result } = renderHook(() => useFlaggedAlerts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.alerts).toEqual(mockAlerts);
  });

  it('should review flagged alert', async () => {
    const mockAlerts = [{ id: 'alert-1', reason: 'prescription_mentioned' }];

    (adminService.getFlaggedAlerts as jest.Mock).mockResolvedValue({
      success: true,
      data: mockAlerts,
    });

    (adminService.reviewFlaggedAlert as jest.Mock).mockResolvedValue({
      success: true,
    });

    const { result } = renderHook(() => useFlaggedAlerts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.alerts).toHaveLength(1);

    let reviewed;
    await act(async () => {
      reviewed = await result.current.review('alert-1', 'dismissed', 'False positive');
    });

    expect(reviewed).toBe(true);
    expect(result.current.alerts).toHaveLength(0);
  });

  it('should handle review error', async () => {
    const mockAlerts = [{ id: 'alert-1' }];

    (adminService.getFlaggedAlerts as jest.Mock).mockResolvedValue({
      success: true,
      data: mockAlerts,
    });

    (adminService.reviewFlaggedAlert as jest.Mock).mockResolvedValue({
      success: false,
      error: { message: 'Permission denied' },
    });

    const { result } = renderHook(() => useFlaggedAlerts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let reviewed;
    await act(async () => {
      reviewed = await result.current.review('alert-1', 'dismissed');
    });

    expect(reviewed).toBe(false);
    expect(result.current.error).toBe('Permission denied');
  });
});

describe('usePaystack Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize payment', async () => {
    const mockAuthUrl = 'https://checkout.paystack.com/auth123';

    (paymentService.initializePayment as jest.Mock).mockResolvedValue({
      success: true,
      data: { authorizationUrl: mockAuthUrl },
    });

    const { result } = renderHook(() => usePaystack());

    let authUrl;
    await act(async () => {
      authUrl = await result.current.initializePayment(
        'order-1',
        'customer@example.com',
        5000
      );
    });

    expect(authUrl).toBe(mockAuthUrl);
    expect(paymentService.initializePayment).toHaveBeenCalledWith(
      'order-1',
      'customer@example.com',
      5000
    );
  });

  it('should verify payment successfully', async () => {
    (paymentService.verifyPayment as jest.Mock).mockResolvedValue({
      success: true,
      data: { status: 'success' },
    });

    const { result } = renderHook(() => usePaystack());

    let isVerified;
    await act(async () => {
      isVerified = await result.current.verifyPayment('ref123');
    });

    expect(isVerified).toBe(true);
  });

  it('should verify payment as paid', async () => {
    (paymentService.verifyPayment as jest.Mock).mockResolvedValue({
      success: true,
      data: { status: 'paid' },
    });

    const { result } = renderHook(() => usePaystack());

    let isVerified;
    await act(async () => {
      isVerified = await result.current.verifyPayment('ref123');
    });

    expect(isVerified).toBe(true);
  });

  it('should handle payment verification failure', async () => {
    (paymentService.verifyPayment as jest.Mock).mockResolvedValue({
      success: true,
      data: { status: 'failed' },
    });

    const { result } = renderHook(() => usePaystack());

    let isVerified;
    await act(async () => {
      isVerified = await result.current.verifyPayment('ref123');
    });

    expect(isVerified).toBe(false);
  });

  it('should handle payment initialization error', async () => {
    (paymentService.initializePayment as jest.Mock).mockResolvedValue({
      success: false,
      error: { message: 'Invalid amount' },
    });

    const { result } = renderHook(() => usePaystack());

    let authUrl;
    await act(async () => {
      authUrl = await result.current.initializePayment('order-1', 'test@test.com', 0);
    });

    expect(authUrl).toBeNull();
    expect(result.current.error).toBe('Invalid amount');
  });
});

describe('useSocket Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize socket on auth state change', async () => {
    const mockSocket = {
      on: jest.fn(),
      off: jest.fn(),
      connected: true,
    };

    (getSocket as jest.Mock).mockReturnValue(mockSocket);

    const mockUser = {
      uid: 'user-123',
      getIdToken: jest.fn().mockResolvedValue('token123'),
      getIdTokenResult: jest
        .fn()
        .mockResolvedValue({ claims: { role: 'customer' } }),
    };

    (auth.onAuthStateChanged as jest.Mock).mockImplementation((callback) => {
      callback(mockUser);
      return jest.fn();
    });

    const { result } = renderHook(() => useSocket());

    await waitFor(() => {
      expect(result.current.socket).not.toBeNull();
    });

    expect(connectSocket).toHaveBeenCalledWith('user-123', 'customer', 'token123');
  });

  it('should disconnect socket on logout', () => {
    (auth.onAuthStateChanged as jest.Mock).mockImplementation((callback) => {
      callback(null);
      return jest.fn();
    });

    const { result } = renderHook(() => useSocket());

    expect(result.current.socket).toBeNull();
    expect(disconnectSocket).toHaveBeenCalled();
  });

  it('should set connected state when socket connects', async () => {
    const mockSocket = {
      on: jest.fn((event, handler) => {
        if (event === 'connect') {
          handler();
        }
      }),
      off: jest.fn(),
      connected: true,
    };

    (getSocket as jest.Mock).mockReturnValue(mockSocket);

    const mockUser = {
      uid: 'user-123',
      getIdToken: jest.fn().mockResolvedValue('token123'),
      getIdTokenResult: jest
        .fn()
        .mockResolvedValue({ claims: { role: 'customer' } }),
    };

    (auth.onAuthStateChanged as jest.Mock).mockImplementation((callback) => {
      callback(mockUser);
      return jest.fn();
    });

    const { result } = renderHook(() => useSocket());

    await waitFor(() => {
      expect(result.current.connected).toBe(true);
    });
  });
});


describe('useNotifications Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with no current user', () => {
    (auth.currentUser as any) = null;

    const { result } = renderHook(() => useNotifications());

    expect(result.current.loading).toBe(false);
    expect(result.current.notifications).toEqual([]);
  });

  it('should handle Firestore listener setup error', async () => {
    (auth.currentUser as any) = { uid: 'user-123' };

    const { onSnapshot } = require('firebase/firestore');
    onSnapshot.mockImplementation((_query, _success, error) => {
      error(new Error('Firestore error'));
      return jest.fn();
    });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load notifications');
  });

  it('should mark notification as read', async () => {
    (auth.currentUser as any) = { uid: 'user-123' };

    const mockNotifications = [
      {
        id: 'notif-1',
        content: 'Test',
        isRead: false,
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const { onSnapshot } = require('firebase/firestore');
    const { updateDoc } = require('firebase/firestore');

    onSnapshot.mockImplementation((query, success) => {
      success({
        docs: mockNotifications.map((n) => ({
          id: n.id,
          data: () => n,
        })),
      });
      return jest.fn();
    });

    updateDoc.mockResolvedValue(undefined);

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(1);
    });

    let marked;
    await act(async () => {
      marked = await result.current.markAsRead('notif-1');
    });

    expect(marked).toBe(true);
    expect(result.current.notifications[0].isRead).toBe(true);
  });

  it('should mark all notifications as read', async () => {
    (auth.currentUser as any) = { uid: 'user-123' };

    const mockNotifications = [
      {
        id: 'notif-1',
        content: 'Test 1',
        isRead: false,
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'notif-2',
        content: 'Test 2',
        isRead: false,
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const { onSnapshot } = require('firebase/firestore');
    const { updateDoc } = require('firebase/firestore');

    onSnapshot.mockImplementation((query, success) => {
      success({
        docs: mockNotifications.map((n) => ({
          id: n.id,
          data: () => n,
        })),
      });
      return jest.fn();
    });

    updateDoc.mockResolvedValue(undefined);

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(2);
      expect(result.current.unreadCount).toBe(2);
    });

    let allMarked;
    await act(async () => {
      allMarked = await result.current.markAllAsRead();
    });

    expect(allMarked).toBe(true);
    expect(result.current.unreadCount).toBe(0);
  });

  it('should calculate unread count correctly', async () => {
    (auth.currentUser as any) = { uid: 'user-123' };

    const mockNotifications = [
      {
        id: 'notif-1',
        content: 'Read',
        isRead: true,
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'notif-2',
        content: 'Unread',
        isRead: false,
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'notif-3',
        content: 'Unread',
        isRead: false,
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const { onSnapshot } = require('firebase/firestore');

    onSnapshot.mockImplementation((query, success) => {
      success({
        docs: mockNotifications.map((n) => ({
          id: n.id,
          data: () => n,
        })),
      });
      return jest.fn();
    });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.unreadCount).toBe(2);
    });
  });
});
