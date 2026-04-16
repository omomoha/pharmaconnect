import { Socket, Server } from "socket.io";
import logger from "../../utils/logger.js";
import { ChatService } from "./chat.service.js";
import { SOCKET_EVENTS, FIRESTORE_COLLECTIONS } from "@pharmaconnect/shared/dist/constants/index.js";
import { UserRole } from "@pharmaconnect/shared/dist/types/index.js";
import { getAuth, getFirestore } from "../../config/firebase.js";

interface SocketUser {
  uid: string;
  role?: UserRole;
  email?: string;
}

// Rate limiting for socket message events
// Track message count per socket to prevent spam
const socketMessageTracker = new Map<string, { count: number; resetAt: number }>();
const MESSAGE_RATE_LIMIT = 30; // messages per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

/**
 * Check if socket has exceeded message rate limit
 */
function isRateLimited(socketId: string): boolean {
  const now = Date.now();
  const tracker = socketMessageTracker.get(socketId);

  if (!tracker || now >= tracker.resetAt) {
    // Reset window
    socketMessageTracker.set(socketId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return false;
  }

  tracker.count++;
  return tracker.count > MESSAGE_RATE_LIMIT;
}

/**
 * Clean up rate limiter entry when socket disconnects
 */
function cleanupRateLimiter(socketId: string): void {
  socketMessageTracker.delete(socketId);
}

/**
 * Socket.IO handlers for real-time chat
 */
export const initializeChatSocket = (io: Server): void => {
  // Socket.IO Authentication Middleware
  // Verifies Firebase ID token before allowing connection
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        logger.warn("Socket auth error: no token provided");
        socket.emit('auth_error', {
          message: "Authorization token is required",
          code: "NO_TOKEN",
        });
        socket.disconnect(true); // Force disconnect
        return next(new Error("Authorization token is required"));
      }

      const auth = getAuth();
      const decodedToken = await auth.verifyIdToken(token);

      // Get user record to extract custom claims (role)
      const userRecord = await auth.getUser(decodedToken.uid);
      const customClaims = userRecord.customClaims || {};

      // Attach user info to socket data
      socket.data.user = {
        uid: decodedToken.uid,
        email: decodedToken.email || "",
        role: customClaims.role as UserRole,
      };

      logger.info(`Socket authenticated: ${socket.id} (user: ${decodedToken.uid})`);
      next();
    } catch (error) {
      logger.warn("Socket authentication error:", error);
      socket.emit('auth_error', {
        message: "Authentication failed",
        code: "AUTH_FAILED",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      socket.disconnect(true); // Force disconnect on auth failure
      return next(new Error("Authentication failed"));
    }
  });

  io.on(SOCKET_EVENTS.CONNECT, (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Emit auth success event to client
    socket.emit('auth_success', {
      userId: socket.data.user.uid,
      role: socket.data.user.role,
    });

    // Join chat room
    socket.on(SOCKET_EVENTS.CHAT_ROOM_JOIN, async (data: { conversationId: string }) => {
      try {
        const { conversationId } = data;
        const user = socket.data.user as SocketUser;
        const roomName = `chat:${conversationId}`;

        socket.join(roomName);
        logger.info(`User ${user.uid} joined chat room: ${conversationId}`);

        // Notify others in room
        socket.to(roomName).emit(SOCKET_EVENTS.NOTIFICATION_RECEIVED, {
          type: "user_joined",
          userId: user.uid,
          timestamp: new Date(),
        });
      } catch (error) {
        logger.error("Chat room join error:", error);
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: "Failed to join chat room",
          code: "ROOM_JOIN_ERROR",
        });
      }
    });

    // Leave chat room
    socket.on(SOCKET_EVENTS.CHAT_ROOM_LEAVE, async (data: { conversationId: string }) => {
      try {
        const { conversationId } = data;
        const user = socket.data.user as SocketUser;
        const roomName = `chat:${conversationId}`;

        socket.leave(roomName);
        logger.info(`User ${user.uid} left chat room: ${conversationId}`);

        socket.to(roomName).emit(SOCKET_EVENTS.NOTIFICATION_RECEIVED, {
          type: "user_left",
          userId: user.uid,
          timestamp: new Date(),
        });
      } catch (error) {
        logger.error("Chat room leave error:", error);
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: "Failed to leave chat room",
          code: "ROOM_LEAVE_ERROR",
        });
      }
    });

    // Send message
    socket.on(
      SOCKET_EVENTS.CHAT_MESSAGE_SEND,
      async (data: {
        conversationId: string;
        content: string;
      }) => {
        try {
          // Rate limiting check
          if (isRateLimited(socket.id)) {
            logger.warn(`Rate limit exceeded for socket ${socket.id}`);
            socket.emit(SOCKET_EVENTS.ERROR, {
              message: "Too many messages, please slow down",
              code: "RATE_LIMIT_EXCEEDED",
            });
            // Disconnect socket that exceeded limit
            socket.disconnect(true);
            return;
          }

          const { conversationId, content } = data;
          const user = socket.data.user as SocketUser;
          const roomName = `chat:${conversationId}`;

          // Save message to Firestore using authenticated user info
          const result = await ChatService.sendMessage({
            conversationId,
            senderId: user.uid,
            senderRole: user.role || UserRole.CUSTOMER,
            content,
          });

          // Broadcast message to room
          io.to(roomName).emit(SOCKET_EVENTS.CHAT_MESSAGE_RECEIVE, {
            message: result.message,
            flagged: result.flagged,
            timestamp: new Date(),
          });

          // If flagged, notify admins
          if (result.flagged && result.alert) {
            io.emit(SOCKET_EVENTS.NOTIFICATION_RECEIVED, {
              type: "message_flagged",
              alert: result.alert,
              conversationId,
            });
          }
        } catch (error) {
          logger.error("Message send error:", error);
          socket.emit(SOCKET_EVENTS.ERROR, {
            message: "Failed to send message",
            code: "MESSAGE_SEND_ERROR",
          });
        }
      }
    );

    // Mark message as read
    socket.on(
      SOCKET_EVENTS.CHAT_MESSAGE_READ,
      async (data: { conversationId: string; messageId: string }) => {
        try {
          const { conversationId, messageId } = data;
          const roomName = `chat:${conversationId}`;

          await ChatService.markMessageAsRead(messageId);

          io.to(roomName).emit(SOCKET_EVENTS.CHAT_MESSAGE_READ, {
            messageId,
            timestamp: new Date(),
          });
        } catch (error) {
          logger.error("Mark read error:", error);
        }
      }
    );

    // Typing indicator
    socket.on(
      SOCKET_EVENTS.CHAT_TYPING,
      async (data: { conversationId: string }) => {
        try {
          const { conversationId } = data;
          const user = socket.data.user as SocketUser;
          const roomName = `chat:${conversationId}`;

          socket.to(roomName).emit(SOCKET_EVENTS.CHAT_TYPING, {
            userId: user.uid,
            timestamp: new Date(),
          });
        } catch (error) {
          logger.error("Typing indicator error:", error);
        }
      }
    );

    // Stopped typing
    socket.on(
      SOCKET_EVENTS.CHAT_STOPPED_TYPING,
      async (data: { conversationId: string }) => {
        try {
          const { conversationId } = data;
          const user = socket.data.user as SocketUser;
          const roomName = `chat:${conversationId}`;

          socket.to(roomName).emit(SOCKET_EVENTS.CHAT_STOPPED_TYPING, {
            userId: user.uid,
            timestamp: new Date(),
          });
        } catch (error) {
          logger.error("Stopped typing indicator error:", error);
        }
      }
    );

    // Delivery location update — broadcast AND persist to Firestore for dispute resolution
    socket.on(
      SOCKET_EVENTS.DELIVERY_LOCATION_UPDATE,
      async (data: {
        assignmentId: string;
        latitude: number;
        longitude: number;
        riderId: string;
      }) => {
        const { assignmentId } = data;
        const roomName = `delivery:${assignmentId}`;
        const now = new Date();

        // Broadcast to connected clients in real-time
        io.to(roomName).emit(SOCKET_EVENTS.DELIVERY_LOCATION_UPDATE, {
          latitude: data.latitude,
          longitude: data.longitude,
          timestamp: now,
        });

        // Persist to Firestore for location history / dispute evidence
        try {
          const db = getFirestore();
          await db
            .collection(FIRESTORE_COLLECTIONS.DELIVERY_LOCATION_HISTORY)
            .add({
              assignmentId: data.assignmentId,
              riderId: data.riderId,
              latitude: data.latitude,
              longitude: data.longitude,
              timestamp: now,
            });
        } catch (err) {
          // Don't fail the broadcast if persistence fails
          logger.error(`Failed to persist GPS location for ${assignmentId}:`, err);
        }

        logger.info(`Location updated for delivery ${assignmentId}`);
      }
    );

    // Delivery status change
    socket.on(
      SOCKET_EVENTS.DELIVERY_STATUS_CHANGE,
      async (data: { assignmentId: string; status: string }) => {
        try {
          const { assignmentId, status } = data;
          const roomName = `delivery:${assignmentId}`;

          io.to(roomName).emit(SOCKET_EVENTS.DELIVERY_STATUS_CHANGE, {
            status,
            timestamp: new Date(),
          });

          logger.info(`Delivery status changed: ${assignmentId} -> ${status}`);
        } catch (error) {
          logger.error("Delivery status change error:", error);
        }
      }
    );

    // Disconnect
    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      cleanupRateLimiter(socket.id);
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
};

/**
 * Emit notification to specific user
 */
export const notifyUser = (
  io: Server,
  userId: string,
  notification: {
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }
): void => {
  const roomName = `notifications:${userId}`;
  io.to(roomName).emit(SOCKET_EVENTS.NOTIFICATION_RECEIVED, notification);
};

/**
 * Emit notification to all admins
 */
export const notifyAdmins = (
  io: Server,
  notification: {
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }
): void => {
  io.to("admins").emit(SOCKET_EVENTS.NOTIFICATION_RECEIVED, notification);
};
