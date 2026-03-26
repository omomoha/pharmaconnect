# PharmaConnect Hooks Unit Tests

Comprehensive unit tests for all React hooks in the PharmaConnect project.

## Test File Location

`src/__tests__/hooks/hooks.test.ts` (1,602 lines)

## Hooks Tested

### Data Fetching Hooks
1. **useApi** - Generic fetching hook with loading/error states
   - Success data fetching
   - Error handling (API errors and thrown errors)
   - Refetch functionality
   - Dependency-based re-running

2. **useOrders** - Fetch user's orders with pagination
   - Basic order fetching
   - Pagination and filtering
   - Error handling
   - Refetch support

3. **useOrder** - Fetch single order by ID
   - Single order fetch
   - Empty ID handling
   - Error scenarios

4. **useNearbyPharmacies** - Fetch nearby pharmacies
   - Location-based search
   - Missing coordinates handling
   - Error scenarios

5. **usePharmacy** - Fetch single pharmacy
   - Pharmacy details fetch
   - Refetch support
   - Empty ID handling

6. **usePharmacyProducts** - Fetch pharmacy products
   - Product list fetching
   - Empty pharmacy ID handling

### Chat Hooks
7. **useConversations** - Fetch all conversations
   - List conversations
   - Error handling
   - Refetch support

8. **useConversation** - Fetch conversation with messages
   - Conversation details and messages
   - Send message functionality
   - Mark as read functionality
   - Empty conversation ID handling

### Delivery Hooks
9. **useAvailableProviders** - Fetch available delivery providers
   - Provider listing
   - Location requirement validation
   - Refetch support

10. **useDelivery** - Fetch delivery assignments
    - Assignment list fetching
    - Empty state handling
    - Refetch support

11. **useDeliveryAssignment** - Manage single delivery assignment
    - Assignment fetch
    - Status update functionality
    - Security code verification
    - Empty ID handling

### Admin Hooks
12. **useAdminDashboard** - Admin dashboard statistics
    - Stats fetching
    - Error handling
    - Refetch support

13. **usePendingApprovals** - Pending approvals management
    - Fetch pending pharmacies and providers
    - Approve pharmacy
    - Reject pharmacy
    - Approve provider
    - Reject provider

14. **useFlaggedAlerts** - Moderation alerts
    - Fetch flagged alerts
    - Review alerts
    - Error handling

### Payment Hook
15. **usePaystack** - Paystack payment management
    - Initialize payment (returns authorization URL)
    - Verify payment (returns boolean)
    - Start payment flow
    - Error handling

### Real-time Hooks
16. **useSocket** - Socket.IO connection lifecycle
    - Socket initialization on auth
    - Connection state management
    - Disconnect on logout
    - Connect/disconnect event handling

17. **useChatRoom** - Join/leave chat rooms
    - Socket connection requirement
    - Conversation ID requirement
    - Room joining logic

18. **useNotifications** - Real-time Firestore notifications
    - Firestore listener setup
    - Notification fetching
    - Mark single notification as read
    - Mark all notifications as read
    - Unread count calculation

## Test Coverage

### Patterns Covered
- ✅ Initial state (loading, error, data)
- ✅ Successful data fetching
- ✅ Error handling (API errors and thrown errors)
- ✅ Refetch functionality
- ✅ Callback functions (sendMessage, markAsRead, updateStatus, etc.)
- ✅ State updates after actions
- ✅ Missing or invalid parameters
- ✅ Edge cases (empty arrays, null values)
- ✅ Firestore listener lifecycle
- ✅ Socket.IO connection lifecycle
- ✅ Promise-based operations

## Mocking Strategy

### Service Mocks
All service modules are mocked at `@/lib/services`:
```typescript
jest.mock('@/lib/services', () => ({
  orderService: { getMyOrders: jest.fn(), getOrder: jest.fn() },
  pharmacyService: { getNearbyPharmacies: jest.fn(), ... },
  chatService: { getConversations: jest.fn(), ... },
  deliveryService: { getAvailableProviders: jest.fn(), ... },
  adminService: { getDashboard: jest.fn(), ... },
  paymentService: { initializePayment: jest.fn(), ... },
}));
```

### Firebase Mocks
- `@/lib/firebase` - Auth and Firestore instances
- `firebase/firestore` - Firestore functions (collection, query, onSnapshot, updateDoc, etc.)

### Socket.IO Mocks
- `@/lib/socket` - Socket connection functions (getSocket, connectSocket, etc.)

## Running the Tests

### Prerequisites
All testing dependencies are already installed:
- `@testing-library/react@16.3.2`
- `@testing-library/jest-dom@6.9.1`
- `jest@30.3.0`
- `ts-jest@29.4.6`

### Run All Tests
```bash
npm test
```

### Run Hooks Tests Only
```bash
npm test -- src/__tests__/hooks/hooks.test.ts
```

### Watch Mode
```bash
npm test -- --watch
```

### Coverage Report
```bash
npm test -- --coverage
```

## Test Structure

Each hook test suite follows this pattern:
```typescript
describe('useHookName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should do X', async () => {
    // Mock setup
    // Render hook
    // Assert initial state
    // Wait for state update
    // Assert final state
  });

  it('should handle error Y', async () => {
    // Mock error scenario
    // Assert error state
  });
});
```

## Key Testing Utilities

- `renderHook` - Render React hook in test environment
- `waitFor` - Wait for async state updates
- `act` - Wrap state updates for batch processing
- `jest.fn()` - Create mock functions
- `jest.mock()` - Mock entire modules

## Common Test Scenarios

### 1. Successful Data Fetch
```typescript
const mockData = { id: '1', name: 'Test' };
const fetcher = jest.fn().mockResolvedValue({
  success: true,
  data: mockData,
});
const { result } = renderHook(() => useApi(fetcher));
await waitFor(() => expect(result.current.loading).toBe(false));
expect(result.current.data).toEqual(mockData);
```

### 2. Error Handling
```typescript
(service.method as jest.Mock).mockResolvedValue({
  success: false,
  error: { message: 'Error message' },
});
const { result } = renderHook(() => useHook());
await waitFor(() => expect(result.current.loading).toBe(false));
expect(result.current.error).toBe('Error message');
```

### 3. Callback Functions
```typescript
let result_value;
await act(async () => {
  result_value = await result.current.callback(params);
});
expect(result_value).toEqual(expectedValue);
```

### 4. State List Updates
```typescript
expect(result.current.items).toHaveLength(initialLength);
await act(async () => {
  await result.current.action(itemId);
});
expect(result.current.items).toHaveLength(initialLength - 1);
```

## Notes

- Tests are isolated with `beforeEach(() => jest.clearAllMocks())`
- All async operations use `waitFor()` to ensure state updates
- State mutations are wrapped in `act()` to match React guidelines
- Mock implementations mirror the actual service return types
- Tests focus on hook behavior, not component rendering
- Firebase and Socket.IO hooks use real listener/event patterns

## Future Enhancements

- Add snapshot tests for complex state objects
- Add performance tests for listener cleanup
- Add concurrent request handling tests
- Add network error retry logic tests
- Integration tests with actual Firebase emulator
