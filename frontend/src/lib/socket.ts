import { io, Socket } from 'socket.io-client';
import type { UserRole } from '@/shared/types';
import { SOCKET_EVENTS } from '@/shared/constants';

let socket: Socket | null = null;

/**
 * Get or initialize the Socket.IO instance
 * @returns Socket.IO client instance
 */
export function getSocket(): Socket {
  if (!socket) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    socket = io(apiUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // Log connection events in development
    if (process.env.NODE_ENV === 'development') {
      socket.on(SOCKET_EVENTS.CONNECT, () => {
        console.log('Socket.IO connected:', socket?.id);
      });

      socket.on(SOCKET_EVENTS.DISCONNECT, () => {
        console.log('Socket.IO disconnected');
      });

      socket.on(SOCKET_EVENTS.ERROR, (error) => {
        console.error('Socket.IO error:', error);
      });
    }
  }

  return socket;
}

/**
 * Connect the socket and authenticate with user context
 * @param userId - Current user's ID
 * @param role - Current user's role
 * @param authToken - Firebase ID token for authentication
 */
export function connectSocket(
  userId: string,
  role: UserRole,
  authToken: string
): void {
  const socketInstance = getSocket();

  if (socketInstance.connected) {
    console.warn('Socket already connected');
    return;
  }

  // Authenticate on connect
  socketInstance.auth = {
    token: authToken,
    userId,
    role,
  };

  socketInstance.connect();

  // Log successful authentication
  socketInstance.once('auth_success', () => {
    console.log('Socket.IO authentication successful');
  });

  socketInstance.on('auth_error', (error) => {
    console.error('Socket.IO authentication error:', error);
    socketInstance.disconnect();
  });
}

/**
 * Disconnect the socket
 */
export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Join a chat room
 * @param conversationId - Conversation ID
 */
export function joinChatRoom(conversationId: string): void {
  const socketInstance = getSocket();

  if (!socketInstance.connected) {
    console.warn('Socket not connected');
    return;
  }

  socketInstance.emit(SOCKET_EVENTS.CHAT_ROOM_JOIN, { conversationId });
}

/**
 * Leave a chat room
 * @param conversationId - Conversation ID
 */
export function leaveChatRoom(conversationId: string): void {
  const socketInstance = getSocket();

  if (!socketInstance.connected) {
    console.warn('Socket not connected');
    return;
  }

  socketInstance.emit(SOCKET_EVENTS.CHAT_ROOM_LEAVE, { conversationId });
}

/**
 * Send a chat message through socket (real-time)
 * @param conversationId - Conversation ID
 * @param content - Message content
 * @param imageUrl - Optional image URL
 */
export function sendChatMessage(
  conversationId: string,
  content: string,
  imageUrl?: string
): void {
  const socketInstance = getSocket();

  if (!socketInstance.connected) {
    console.warn('Socket not connected');
    return;
  }

  socketInstance.emit(SOCKET_EVENTS.CHAT_MESSAGE_SEND, {
    conversationId,
    content,
    imageUrl,
  });
}

/**
 * Listen for incoming messages
 * @param callback - Function to call when message is received
 */
export function onChatMessageReceive(
  callback: (data: any) => void
): () => void {
  const socketInstance = getSocket();
  socketInstance.on(SOCKET_EVENTS.CHAT_MESSAGE_RECEIVE, callback);

  // Return unsubscribe function
  return () => socketInstance.off(SOCKET_EVENTS.CHAT_MESSAGE_RECEIVE, callback);
}

/**
 * Emit typing indicator
 * @param conversationId - Conversation ID
 */
export function emitTyping(conversationId: string): void {
  const socketInstance = getSocket();

  if (!socketInstance.connected) return;

  socketInstance.emit(SOCKET_EVENTS.CHAT_TYPING, { conversationId });
}

/**
 * Emit stopped typing indicator
 * @param conversationId - Conversation ID
 */
export function emitStoppedTyping(conversationId: string): void {
  const socketInstance = getSocket();

  if (!socketInstance.connected) return;

  socketInstance.emit(SOCKET_EVENTS.CHAT_STOPPED_TYPING, { conversationId });
}

/**
 * Listen for typing indicators
 * @param callback - Function to call when someone is typing
 */
export function onTyping(callback: (data: any) => void): () => void {
  const socketInstance = getSocket();
  socketInstance.on(SOCKET_EVENTS.CHAT_TYPING, callback);

  return () => socketInstance.off(SOCKET_EVENTS.CHAT_TYPING, callback);
}

/**
 * Update delivery location (for riders)
 * @param assignmentId - Delivery assignment ID
 * @param latitude - Current latitude
 * @param longitude - Current longitude
 */
export function updateDeliveryLocation(
  assignmentId: string,
  latitude: number,
  longitude: number
): void {
  const socketInstance = getSocket();

  if (!socketInstance.connected) {
    console.warn('Socket not connected');
    return;
  }

  socketInstance.emit(SOCKET_EVENTS.DELIVERY_LOCATION_UPDATE, {
    assignmentId,
    latitude,
    longitude,
  });
}

/**
 * Listen for delivery location updates
 * @param callback - Function to call when location is updated
 */
export function onDeliveryLocationUpdate(
  callback: (data: any) => void
): () => void {
  const socketInstance = getSocket();
  socketInstance.on(SOCKET_EVENTS.DELIVERY_LOCATION_UPDATE, callback);

  return () =>
    socketInstance.off(SOCKET_EVENTS.DELIVERY_LOCATION_UPDATE, callback);
}

/**
 * Listen for delivery status changes
 * @param callback - Function to call when delivery status changes
 */
export function onDeliveryStatusChange(
  callback: (data: any) => void
): () => void {
  const socketInstance = getSocket();
  socketInstance.on(SOCKET_EVENTS.DELIVERY_STATUS_CHANGE, callback);

  return () =>
    socketInstance.off(SOCKET_EVENTS.DELIVERY_STATUS_CHANGE, callback);
}

/**
 * Listen for notifications
 * @param callback - Function to call when notification is received
 */
export function onNotificationReceived(
  callback: (data: any) => void
): () => void {
  const socketInstance = getSocket();
  socketInstance.on(SOCKET_EVENTS.NOTIFICATION_RECEIVED, callback);

  return () =>
    socketInstance.off(SOCKET_EVENTS.NOTIFICATION_RECEIVED, callback);
}
