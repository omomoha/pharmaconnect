import { SOCKET_EVENTS } from '@/shared/constants';

// Create mock socket before importing the module
const mockSocket = {
  connected: false,
  id: 'socket-123',
  auth: undefined,
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  once: jest.fn(),
};

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket),
  Socket: jest.fn(),
}));

// Import after mocking
import {
  getSocket,
  connectSocket,
  disconnectSocket,
  joinChatRoom,
  leaveChatRoom,
  sendChatMessage,
  onChatMessageReceive,
  emitTyping,
  emitStoppedTyping,
  onTyping,
  updateDeliveryLocation,
  onDeliveryLocationUpdate,
  onDeliveryStatusChange,
  onNotificationReceived,
} from '@/lib/socket';

describe('Socket.IO Chat Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSocket.connected = false;
    mockSocket.id = 'socket-123';
    mockSocket.auth = undefined;
  });

  describe('getSocket', () => {
    it('should initialize socket with correct config', () => {
      const socket = getSocket();
      expect(socket).toBeDefined();
    });

    it('should return the mock socket instance', () => {
      const socket = getSocket();
      expect(socket).toBe(mockSocket);
    });
  });

  describe('connectSocket', () => {
    it('should set auth credentials and connect', () => {
      mockSocket.connected = false;

      connectSocket('user123', 'customer', 'token-abc');

      expect(mockSocket.connect).toHaveBeenCalled();
    });

    it('should set socket auth with user data', () => {
      mockSocket.connected = false;

      connectSocket('user456', 'pharmacy', 'token-xyz');

      expect(mockSocket.auth).toEqual({
        token: 'token-xyz',
        userId: 'user456',
        role: 'pharmacy',
      });
    });

    it('should not connect if already connected', () => {
      mockSocket.connected = true;
      mockSocket.connect.mockClear();

      connectSocket('user789', 'delivery_provider', 'token-123');

      expect(mockSocket.connect).not.toHaveBeenCalled();
    });

    it('should handle different user roles', () => {
      mockSocket.connected = false;

      const roles = ['customer', 'pharmacy', 'delivery_provider', 'admin'] as const;

      roles.forEach((role) => {
        mockSocket.connected = false;
        mockSocket.emit.mockClear();
        connectSocket('user-' + role, role, 'token-' + role);

        expect(mockSocket.auth.role).toBe(role);
      });
    });

    it('should listen for auth success event', () => {
      mockSocket.connected = false;

      connectSocket('user123', 'customer', 'token-abc');

      expect(mockSocket.once).toHaveBeenCalledWith('auth_success', expect.any(Function));
    });

    it('should listen for auth error event', () => {
      mockSocket.connected = false;

      connectSocket('user123', 'customer', 'token-abc');

      expect(mockSocket.on).toHaveBeenCalledWith('auth_error', expect.any(Function));
    });
  });

  describe('disconnectSocket', () => {
    it('should disconnect socket when connected', () => {
      mockSocket.connected = true;

      disconnectSocket();

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should not call disconnect if already disconnected', () => {
      mockSocket.connected = false;
      mockSocket.disconnect.mockClear();

      disconnectSocket();

      expect(mockSocket.disconnect).not.toHaveBeenCalled();
    });
  });

  describe('joinChatRoom', () => {
    it('should emit join room event with conversation id', () => {
      mockSocket.connected = true;
      mockSocket.emit.mockClear();

      joinChatRoom('conv-123');

      expect(mockSocket.emit).toHaveBeenCalledWith(
        SOCKET_EVENTS.CHAT_ROOM_JOIN,
        { conversationId: 'conv-123' }
      );
    });

    it('should not emit if socket not connected', () => {
      mockSocket.connected = false;
      mockSocket.emit.mockClear();

      joinChatRoom('conv-456');

      expect(mockSocket.emit).not.toHaveBeenCalled();
    });

    it('should handle multiple room joins', () => {
      mockSocket.connected = true;
      mockSocket.emit.mockClear();

      joinChatRoom('conv-1');
      joinChatRoom('conv-2');
      joinChatRoom('conv-3');

      expect(mockSocket.emit).toHaveBeenCalledTimes(3);
    });
  });

  describe('leaveChatRoom', () => {
    it('should emit leave room event with conversation id', () => {
      mockSocket.connected = true;
      mockSocket.emit.mockClear();

      leaveChatRoom('conv-123');

      expect(mockSocket.emit).toHaveBeenCalledWith(
        SOCKET_EVENTS.CHAT_ROOM_LEAVE,
        { conversationId: 'conv-123' }
      );
    });

    it('should not emit if socket not connected', () => {
      mockSocket.connected = false;
      mockSocket.emit.mockClear();

      leaveChatRoom('conv-456');

      expect(mockSocket.emit).not.toHaveBeenCalled();
    });

    it('should handle multiple room leaves', () => {
      mockSocket.connected = true;
      mockSocket.emit.mockClear();

      leaveChatRoom('conv-1');
      leaveChatRoom('conv-2');

      expect(mockSocket.emit).toHaveBeenCalledTimes(2);
    });
  });

  describe('sendChatMessage', () => {
    it('should send chat message with content', () => {
      mockSocket.connected = true;
      mockSocket.emit.mockClear();

      sendChatMessage('conv-123', 'Hello there');

      expect(mockSocket.emit).toHaveBeenCalledWith(
        SOCKET_EVENTS.CHAT_MESSAGE_SEND,
        {
          conversationId: 'conv-123',
          content: 'Hello there',
          imageUrl: undefined,
        }
      );
    });

    it('should send chat message with image URL', () => {
      mockSocket.connected = true;
      mockSocket.emit.mockClear();

      sendChatMessage('conv-123', 'Check this out', 'https://example.com/image.jpg');

      expect(mockSocket.emit).toHaveBeenCalledWith(
        SOCKET_EVENTS.CHAT_MESSAGE_SEND,
        {
          conversationId: 'conv-123',
          content: 'Check this out',
          imageUrl: 'https://example.com/image.jpg',
        }
      );
    });

    it('should not send if socket not connected', () => {
      mockSocket.connected = false;
      mockSocket.emit.mockClear();

      sendChatMessage('conv-123', 'Hello');

      expect(mockSocket.emit).not.toHaveBeenCalled();
    });

    it('should handle messages with special characters', () => {
      mockSocket.connected = true;
      mockSocket.emit.mockClear();

      sendChatMessage('conv-123', 'Hello! @#$%^&*()');

      expect(mockSocket.emit).toHaveBeenCalledWith(
        SOCKET_EVENTS.CHAT_MESSAGE_SEND,
        expect.objectContaining({
          content: 'Hello! @#$%^&*()',
        })
      );
    });

    it('should handle long messages', () => {
      mockSocket.connected = true;
      mockSocket.emit.mockClear();

      const longMessage = 'a'.repeat(1000);

      sendChatMessage('conv-123', longMessage);

      expect(mockSocket.emit).toHaveBeenCalledWith(
        SOCKET_EVENTS.CHAT_MESSAGE_SEND,
        expect.objectContaining({
          content: longMessage,
        })
      );
    });

    it('should handle empty messages', () => {
      mockSocket.connected = true;
      mockSocket.emit.mockClear();

      sendChatMessage('conv-123', '');

      expect(mockSocket.emit).toHaveBeenCalledWith(
        SOCKET_EVENTS.CHAT_MESSAGE_SEND,
        expect.objectContaining({
          content: '',
        })
      );
    });
  });

  describe('onChatMessageReceive', () => {
    it('should register listener for incoming messages', () => {
      mockSocket.on.mockClear();
      const callback = jest.fn();

      onChatMessageReceive(callback);

      expect(mockSocket.on).toHaveBeenCalledWith(
        SOCKET_EVENTS.CHAT_MESSAGE_RECEIVE,
        callback
      );
    });

    it('should return unsubscribe function', () => {
      mockSocket.off.mockClear();
      const callback = jest.fn();

      const unsubscribe = onChatMessageReceive(callback);

      expect(typeof unsubscribe).toBe('function');

      unsubscribe();

      expect(mockSocket.off).toHaveBeenCalledWith(
        SOCKET_EVENTS.CHAT_MESSAGE_RECEIVE,
        callback
      );
    });

    it('should handle multiple message listeners', () => {
      mockSocket.on.mockClear();
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      onChatMessageReceive(callback1);
      onChatMessageReceive(callback2);

      expect(mockSocket.on).toHaveBeenCalledTimes(2);
    });
  });

  describe('emitTyping', () => {
    it('should emit typing event', () => {
      mockSocket.connected = true;
      mockSocket.emit.mockClear();

      emitTyping('conv-123');

      expect(mockSocket.emit).toHaveBeenCalledWith(
        SOCKET_EVENTS.CHAT_TYPING,
        { conversationId: 'conv-123' }
      );
    });

    it('should not emit if socket not connected', () => {
      mockSocket.connected = false;
      mockSocket.emit.mockClear();

      emitTyping('conv-123');

      expect(mockSocket.emit).not.toHaveBeenCalled();
    });

    it('should emit typing for multiple conversations', () => {
      mockSocket.connected = true;
      mockSocket.emit.mockClear();

      emitTyping('conv-1');
      emitTyping('conv-2');

      expect(mockSocket.emit).toHaveBeenCalledTimes(2);
    });
  });

  describe('emitStoppedTyping', () => {
    it('should emit stopped typing event', () => {
      mockSocket.connected = true;
      mockSocket.emit.mockClear();

      emitStoppedTyping('conv-123');

      expect(mockSocket.emit).toHaveBeenCalledWith(
        SOCKET_EVENTS.CHAT_STOPPED_TYPING,
        { conversationId: 'conv-123' }
      );
    });

    it('should not emit if socket not connected', () => {
      mockSocket.connected = false;
      mockSocket.emit.mockClear();

      emitStoppedTyping('conv-123');

      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });

  describe('onTyping', () => {
    it('should register listener for typing events', () => {
      mockSocket.on.mockClear();
      const callback = jest.fn();

      onTyping(callback);

      expect(mockSocket.on).toHaveBeenCalledWith(SOCKET_EVENTS.CHAT_TYPING, callback);
    });

    it('should return unsubscribe function', () => {
      mockSocket.off.mockClear();
      const callback = jest.fn();

      const unsubscribe = onTyping(callback);

      expect(typeof unsubscribe).toBe('function');

      unsubscribe();

      expect(mockSocket.off).toHaveBeenCalledWith(
        SOCKET_EVENTS.CHAT_TYPING,
        callback
      );
    });

    it('should handle multiple typing listeners', () => {
      mockSocket.on.mockClear();
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      onTyping(callback1);
      onTyping(callback2);

      expect(mockSocket.on).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateDeliveryLocation', () => {
    it('should emit location update with coordinates', () => {
      mockSocket.connected = true;
      mockSocket.emit.mockClear();

      updateDeliveryLocation('assign-123', 6.5244, 3.3792);

      expect(mockSocket.emit).toHaveBeenCalledWith(
        SOCKET_EVENTS.DELIVERY_LOCATION_UPDATE,
        {
          assignmentId: 'assign-123',
          latitude: 6.5244,
          longitude: 3.3792,
        }
      );
    });

    it('should not emit if socket not connected', () => {
      mockSocket.connected = false;
      mockSocket.emit.mockClear();

      updateDeliveryLocation('assign-123', 6.5244, 3.3792);

      expect(mockSocket.emit).not.toHaveBeenCalled();
    });

    it('should handle multiple location updates', () => {
      mockSocket.connected = true;
      mockSocket.emit.mockClear();

      updateDeliveryLocation('assign-1', 6.5, 3.3);
      updateDeliveryLocation('assign-2', 6.6, 3.4);

      expect(mockSocket.emit).toHaveBeenCalledTimes(2);
    });

    it('should handle precise decimal coordinates', () => {
      mockSocket.connected = true;
      mockSocket.emit.mockClear();

      updateDeliveryLocation('assign-123', 6.524405, 3.379206);

      expect(mockSocket.emit).toHaveBeenCalledWith(
        SOCKET_EVENTS.DELIVERY_LOCATION_UPDATE,
        expect.objectContaining({
          latitude: 6.524405,
          longitude: 3.379206,
        })
      );
    });

    it('should handle negative coordinates', () => {
      mockSocket.connected = true;
      mockSocket.emit.mockClear();

      updateDeliveryLocation('assign-123', -33.8688, 151.2093);

      expect(mockSocket.emit).toHaveBeenCalledWith(
        SOCKET_EVENTS.DELIVERY_LOCATION_UPDATE,
        expect.objectContaining({
          latitude: -33.8688,
          longitude: 151.2093,
        })
      );
    });
  });

  describe('onDeliveryLocationUpdate', () => {
    it('should register listener for location updates', () => {
      mockSocket.on.mockClear();
      const callback = jest.fn();

      onDeliveryLocationUpdate(callback);

      expect(mockSocket.on).toHaveBeenCalledWith(
        SOCKET_EVENTS.DELIVERY_LOCATION_UPDATE,
        callback
      );
    });

    it('should return unsubscribe function', () => {
      mockSocket.off.mockClear();
      const callback = jest.fn();

      const unsubscribe = onDeliveryLocationUpdate(callback);

      unsubscribe();

      expect(mockSocket.off).toHaveBeenCalledWith(
        SOCKET_EVENTS.DELIVERY_LOCATION_UPDATE,
        callback
      );
    });
  });

  describe('onDeliveryStatusChange', () => {
    it('should register listener for status changes', () => {
      mockSocket.on.mockClear();
      const callback = jest.fn();

      onDeliveryStatusChange(callback);

      expect(mockSocket.on).toHaveBeenCalledWith(
        SOCKET_EVENTS.DELIVERY_STATUS_CHANGE,
        callback
      );
    });

    it('should return unsubscribe function', () => {
      mockSocket.off.mockClear();
      const callback = jest.fn();

      const unsubscribe = onDeliveryStatusChange(callback);

      unsubscribe();

      expect(mockSocket.off).toHaveBeenCalledWith(
        SOCKET_EVENTS.DELIVERY_STATUS_CHANGE,
        callback
      );
    });
  });

  describe('onNotificationReceived', () => {
    it('should register listener for notifications', () => {
      mockSocket.on.mockClear();
      const callback = jest.fn();

      onNotificationReceived(callback);

      expect(mockSocket.on).toHaveBeenCalledWith(
        SOCKET_EVENTS.NOTIFICATION_RECEIVED,
        callback
      );
    });

    it('should return unsubscribe function', () => {
      mockSocket.off.mockClear();
      const callback = jest.fn();

      const unsubscribe = onNotificationReceived(callback);

      unsubscribe();

      expect(mockSocket.off).toHaveBeenCalledWith(
        SOCKET_EVENTS.NOTIFICATION_RECEIVED,
        callback
      );
    });

    it('should handle multiple notification listeners', () => {
      mockSocket.on.mockClear();
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      onNotificationReceived(callback1);
      onNotificationReceived(callback2);

      expect(mockSocket.on).toHaveBeenCalledTimes(2);
    });
  });

  describe('event flow scenarios', () => {
    it('should handle complete chat flow: join -> type -> send -> receive', () => {
      mockSocket.connected = true;
      mockSocket.emit.mockClear();

      joinChatRoom('conv-123');
      emitTyping('conv-123');
      sendChatMessage('conv-123', 'Hello');
      emitStoppedTyping('conv-123');
      leaveChatRoom('conv-123');

      expect(mockSocket.emit).toHaveBeenCalledTimes(5);
    });

    it('should handle delivery tracking flow', () => {
      mockSocket.connected = true;
      mockSocket.emit.mockClear();
      mockSocket.on.mockClear();

      updateDeliveryLocation('assign-123', 6.5, 3.3);
      const statusCallback = jest.fn();
      onDeliveryStatusChange(statusCallback);

      updateDeliveryLocation('assign-123', 6.55, 3.35);

      expect(mockSocket.emit).toHaveBeenCalledTimes(2);
      expect(mockSocket.on).toHaveBeenCalledTimes(1);
    });

    it('should handle reconnection with chat listeners', () => {
      mockSocket.connected = true;
      mockSocket.disconnect.mockClear();
      mockSocket.on.mockClear();

      const messageCallback = jest.fn();
      const typingCallback = jest.fn();

      onChatMessageReceive(messageCallback);
      onTyping(typingCallback);

      expect(mockSocket.on).toHaveBeenCalledTimes(2);

      mockSocket.connected = true;
      disconnectSocket();

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });
});
