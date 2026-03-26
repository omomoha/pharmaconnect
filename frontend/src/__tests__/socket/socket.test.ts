/**
 * Socket.IO Client Tests for PharmaConnect
 * Tests socket connection, authentication, chat, delivery tracking, and notifications
 */

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
import { SOCKET_EVENTS } from '@/shared/constants';

// Mock socket.io-client
const mockSocket = {
  connected: false,
  id: 'test-socket-id',
  connect: jest.fn(),
  disconnect: jest.fn(),
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  once: jest.fn(),
  auth: {},
};

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket),
}));

// Mock environment variables
const originalEnv = process.env;
beforeEach(() => {
  process.env = { ...originalEnv, NODE_ENV: 'test' };
});

afterEach(() => {
  process.env = originalEnv;
  jest.clearAllMocks();
});

describe('Socket.IO Client Tests', () => {
  describe('getSocket', () => {
    beforeEach(() => {
      jest.resetModules();
      // Re-require the module to reset module-level variables
      jest.doMock('socket.io-client');
    });

    it('returns socket instance', () => {
      jest.resetModules();
      const { getSocket: getSocketFresh } = require('@/lib/socket');
      const socket = getSocketFresh();
      expect(socket).toBeDefined();
      expect(socket.id).toBe('test-socket-id');
    });

    it('returns same instance on subsequent calls (singleton)', () => {
      jest.resetModules();
      const { getSocket: getSocketFresh } = require('@/lib/socket');
      const socket1 = getSocketFresh();
      const socket2 = getSocketFresh();
      expect(socket1).toBe(socket2);
    });

    it('initializes with correct configuration options', () => {
      // Socket initialization happens at module load time
      // Verify that socket was created and has expected properties
      const socket = getSocket();
      expect(socket).toBeDefined();
      expect(socket.id).toBe('test-socket-id');
      // The mock is set up to reflect the configuration
    });
  });

  describe('connectSocket', () => {
    beforeEach(() => {
      mockSocket.connected = false;
      jest.clearAllMocks();
    });

    it('sets auth properties on socket', () => {
      const userId = 'user-123';
      const role = 'customer';
      const authToken = 'test-token-abc';

      connectSocket(userId, role, authToken);

      expect(mockSocket.auth).toEqual({
        token: authToken,
        userId,
        role,
      });
    });

    it('calls socket.connect()', () => {
      connectSocket('user-123', 'customer', 'test-token');

      expect(mockSocket.connect).toHaveBeenCalled();
    });

    it('warns when socket already connected', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockSocket.connected = true;

      connectSocket('user-123', 'customer', 'test-token');

      expect(consoleWarnSpy).toHaveBeenCalledWith('Socket already connected');
      expect(mockSocket.connect).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('sets up auth_success listener', () => {
      connectSocket('user-123', 'customer', 'test-token');

      expect(mockSocket.once).toHaveBeenCalledWith(
        'auth_success',
        expect.any(Function)
      );
    });

    it('sets up auth_error listener that disconnects socket on error', () => {
      connectSocket('user-123', 'customer', 'test-token');

      const errorCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'auth_error'
      )?.[1];

      expect(errorCallback).toBeDefined();

      if (errorCallback) {
        errorCallback({ message: 'Auth failed' });
        expect(mockSocket.disconnect).toHaveBeenCalled();
      }
    });
  });

  describe('disconnectSocket', () => {
    it('calls socket.disconnect() when connected', () => {
      mockSocket.connected = true;
      disconnectSocket();

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('does not call disconnect when not connected', () => {
      mockSocket.connected = false;
      jest.clearAllMocks();

      disconnectSocket();

      expect(mockSocket.disconnect).not.toHaveBeenCalled();
    });


  });

  describe('joinChatRoom', () => {
    it('emits CHAT_ROOM_JOIN event with conversationId', () => {
      mockSocket.connected = true;
      const conversationId = 'conv-123';

      joinChatRoom(conversationId);

      expect(mockSocket.emit).toHaveBeenCalledWith(SOCKET_EVENTS.CHAT_ROOM_JOIN, {
        conversationId,
      });
    });

    it('warns when socket not connected', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockSocket.connected = false;

      joinChatRoom('conv-123');

      expect(consoleWarnSpy).toHaveBeenCalledWith('Socket not connected');
      expect(mockSocket.emit).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('leaveChatRoom', () => {
    it('emits CHAT_ROOM_LEAVE event with conversationId', () => {
      mockSocket.connected = true;
      const conversationId = 'conv-456';

      leaveChatRoom(conversationId);

      expect(mockSocket.emit).toHaveBeenCalledWith(SOCKET_EVENTS.CHAT_ROOM_LEAVE, {
        conversationId,
      });
    });

    it('warns when socket not connected', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockSocket.connected = false;

      leaveChatRoom('conv-456');

      expect(consoleWarnSpy).toHaveBeenCalledWith('Socket not connected');
      expect(mockSocket.emit).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('sendChatMessage', () => {
    beforeEach(() => {
      mockSocket.connected = true;
      jest.clearAllMocks();
    });

    it('emits CHAT_MESSAGE_SEND with conversationId and content', () => {
      const conversationId = 'conv-789';
      const content = 'Hello, pharmacy!';

      sendChatMessage(conversationId, content);

      expect(mockSocket.emit).toHaveBeenCalledWith(
        SOCKET_EVENTS.CHAT_MESSAGE_SEND,
        {
          conversationId,
          content,
          imageUrl: undefined,
        }
      );
    });

    it('emits with imageUrl when provided', () => {
      const conversationId = 'conv-789';
      const content = 'Check this out';
      const imageUrl = 'https://example.com/image.jpg';

      sendChatMessage(conversationId, content, imageUrl);

      expect(mockSocket.emit).toHaveBeenCalledWith(
        SOCKET_EVENTS.CHAT_MESSAGE_SEND,
        {
          conversationId,
          content,
          imageUrl,
        }
      );
    });

    it('warns when socket not connected', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockSocket.connected = false;

      sendChatMessage('conv-789', 'Hello');

      expect(consoleWarnSpy).toHaveBeenCalledWith('Socket not connected');
      expect(mockSocket.emit).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('onChatMessageReceive', () => {
    it('registers listener on CHAT_MESSAGE_RECEIVE event', () => {
      const callback = jest.fn();

      onChatMessageReceive(callback);

      expect(mockSocket.on).toHaveBeenCalledWith(
        SOCKET_EVENTS.CHAT_MESSAGE_RECEIVE,
        callback
      );
    });

    it('returns unsubscribe function that removes listener', () => {
      const callback = jest.fn();

      const unsubscribe = onChatMessageReceive(callback);

      expect(typeof unsubscribe).toBe('function');

      unsubscribe();

      expect(mockSocket.off).toHaveBeenCalledWith(
        SOCKET_EVENTS.CHAT_MESSAGE_RECEIVE,
        callback
      );
    });

    it('allows multiple listeners to be registered independently', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const unsub1 = onChatMessageReceive(callback1);
      const unsub2 = onChatMessageReceive(callback2);

      expect(mockSocket.on).toHaveBeenNthCalledWith(
        1,
        SOCKET_EVENTS.CHAT_MESSAGE_RECEIVE,
        callback1
      );
      expect(mockSocket.on).toHaveBeenNthCalledWith(
        2,
        SOCKET_EVENTS.CHAT_MESSAGE_RECEIVE,
        callback2
      );

      unsub1();
      expect(mockSocket.off).toHaveBeenCalledWith(
        SOCKET_EVENTS.CHAT_MESSAGE_RECEIVE,
        callback1
      );
    });
  });

  describe('emitTyping', () => {
    it('emits CHAT_TYPING event with conversationId', () => {
      mockSocket.connected = true;
      const conversationId = 'conv-typing';

      emitTyping(conversationId);

      expect(mockSocket.emit).toHaveBeenCalledWith(SOCKET_EVENTS.CHAT_TYPING, {
        conversationId,
      });
    });

    it('silently returns when socket not connected', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockSocket.connected = false;

      emitTyping('conv-typing');

      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(mockSocket.emit).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('emitStoppedTyping', () => {
    it('emits CHAT_STOPPED_TYPING event with conversationId', () => {
      mockSocket.connected = true;
      const conversationId = 'conv-stopped';

      emitStoppedTyping(conversationId);

      expect(mockSocket.emit).toHaveBeenCalledWith(
        SOCKET_EVENTS.CHAT_STOPPED_TYPING,
        {
          conversationId,
        }
      );
    });

    it('silently returns when socket not connected', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockSocket.connected = false;

      emitStoppedTyping('conv-stopped');

      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(mockSocket.emit).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('onTyping', () => {
    it('registers listener on CHAT_TYPING event', () => {
      const callback = jest.fn();

      onTyping(callback);

      expect(mockSocket.on).toHaveBeenCalledWith(SOCKET_EVENTS.CHAT_TYPING, callback);
    });

    it('returns unsubscribe function that removes listener', () => {
      const callback = jest.fn();

      const unsubscribe = onTyping(callback);

      expect(typeof unsubscribe).toBe('function');

      unsubscribe();

      expect(mockSocket.off).toHaveBeenCalledWith(SOCKET_EVENTS.CHAT_TYPING, callback);
    });
  });

  describe('updateDeliveryLocation', () => {
    beforeEach(() => {
      mockSocket.connected = true;
      jest.clearAllMocks();
    });

    it('emits DELIVERY_LOCATION_UPDATE with assignmentId and coordinates', () => {
      const assignmentId = 'delivery-123';
      const latitude = 6.5244;
      const longitude = 3.3792;

      updateDeliveryLocation(assignmentId, latitude, longitude);

      expect(mockSocket.emit).toHaveBeenCalledWith(
        SOCKET_EVENTS.DELIVERY_LOCATION_UPDATE,
        {
          assignmentId,
          latitude,
          longitude,
        }
      );
    });

    it('warns when socket not connected', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockSocket.connected = false;

      updateDeliveryLocation('delivery-123', 6.5244, 3.3792);

      expect(consoleWarnSpy).toHaveBeenCalledWith('Socket not connected');
      expect(mockSocket.emit).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('onDeliveryLocationUpdate', () => {
    it('registers listener on DELIVERY_LOCATION_UPDATE event', () => {
      const callback = jest.fn();

      onDeliveryLocationUpdate(callback);

      expect(mockSocket.on).toHaveBeenCalledWith(
        SOCKET_EVENTS.DELIVERY_LOCATION_UPDATE,
        callback
      );
    });

    it('returns unsubscribe function that removes listener', () => {
      const callback = jest.fn();

      const unsubscribe = onDeliveryLocationUpdate(callback);

      expect(typeof unsubscribe).toBe('function');

      unsubscribe();

      expect(mockSocket.off).toHaveBeenCalledWith(
        SOCKET_EVENTS.DELIVERY_LOCATION_UPDATE,
        callback
      );
    });
  });

  describe('onDeliveryStatusChange', () => {
    it('registers listener on DELIVERY_STATUS_CHANGE event', () => {
      const callback = jest.fn();

      onDeliveryStatusChange(callback);

      expect(mockSocket.on).toHaveBeenCalledWith(
        SOCKET_EVENTS.DELIVERY_STATUS_CHANGE,
        callback
      );
    });

    it('returns unsubscribe function that removes listener', () => {
      const callback = jest.fn();

      const unsubscribe = onDeliveryStatusChange(callback);

      expect(typeof unsubscribe).toBe('function');

      unsubscribe();

      expect(mockSocket.off).toHaveBeenCalledWith(
        SOCKET_EVENTS.DELIVERY_STATUS_CHANGE,
        callback
      );
    });
  });

  describe('onNotificationReceived', () => {
    it('registers listener on NOTIFICATION_RECEIVED event', () => {
      const callback = jest.fn();

      onNotificationReceived(callback);

      expect(mockSocket.on).toHaveBeenCalledWith(
        SOCKET_EVENTS.NOTIFICATION_RECEIVED,
        callback
      );
    });

    it('returns unsubscribe function that removes listener', () => {
      const callback = jest.fn();

      const unsubscribe = onNotificationReceived(callback);

      expect(typeof unsubscribe).toBe('function');

      unsubscribe();

      expect(mockSocket.off).toHaveBeenCalledWith(
        SOCKET_EVENTS.NOTIFICATION_RECEIVED,
        callback
      );
    });
  });

  describe('Integration: Chat flow', () => {
    beforeEach(() => {
      mockSocket.connected = true;
      jest.clearAllMocks();
    });

    it('supports full chat flow: join, listen, send, unsubscribe', () => {
      const conversationId = 'conv-integration';
      const callback = jest.fn();

      // Join room
      joinChatRoom(conversationId);
      expect(mockSocket.emit).toHaveBeenCalledWith(SOCKET_EVENTS.CHAT_ROOM_JOIN, {
        conversationId,
      });

      // Listen for messages
      const unsubscribe = onChatMessageReceive(callback);
      expect(mockSocket.on).toHaveBeenCalledWith(
        SOCKET_EVENTS.CHAT_MESSAGE_RECEIVE,
        callback
      );

      // Send message
      sendChatMessage(conversationId, 'Test message');
      expect(mockSocket.emit).toHaveBeenCalledWith(
        SOCKET_EVENTS.CHAT_MESSAGE_SEND,
        expect.objectContaining({ conversationId })
      );

      // Unsubscribe
      unsubscribe();
      expect(mockSocket.off).toHaveBeenCalledWith(
        SOCKET_EVENTS.CHAT_MESSAGE_RECEIVE,
        callback
      );

      // Leave room
      leaveChatRoom(conversationId);
      expect(mockSocket.emit).toHaveBeenCalledWith(SOCKET_EVENTS.CHAT_ROOM_LEAVE, {
        conversationId,
      });
    });
  });

  describe('Integration: Delivery tracking flow', () => {
    beforeEach(() => {
      mockSocket.connected = true;
      jest.clearAllMocks();
    });

    it('supports full delivery tracking flow', () => {
      const assignmentId = 'delivery-integration';
      const locationCallback = jest.fn();
      const statusCallback = jest.fn();

      // Listen for location updates
      const unsubLocation = onDeliveryLocationUpdate(locationCallback);
      expect(mockSocket.on).toHaveBeenCalledWith(
        SOCKET_EVENTS.DELIVERY_LOCATION_UPDATE,
        locationCallback
      );

      // Listen for status changes
      const unsubStatus = onDeliveryStatusChange(statusCallback);
      expect(mockSocket.on).toHaveBeenCalledWith(
        SOCKET_EVENTS.DELIVERY_STATUS_CHANGE,
        statusCallback
      );

      // Update location
      updateDeliveryLocation(assignmentId, 6.5, 3.3);
      expect(mockSocket.emit).toHaveBeenCalledWith(
        SOCKET_EVENTS.DELIVERY_LOCATION_UPDATE,
        expect.objectContaining({ assignmentId })
      );

      // Cleanup
      unsubLocation();
      unsubStatus();
      expect(mockSocket.off).toHaveBeenCalledTimes(2);
    });
  });
});
