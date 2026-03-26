import { Socket, Server } from "socket.io";
import logger from "../../utils/logger.js";
import { ChatService } from "./chat.service.js";
import { SOCKET_EVENTS } from "@pharmaconnect/shared/dist/constants/index.js";
import { UserRole } from "@pharmaconnect/shared/dist/types/index.js";

interface SocketUser {
  uid: string;
  role?: UserRole;
  email?: string;
}

/**
 * Socket.IO handlers for real-time chat
 */
export const initializeChatSocket = (io: Server): void => {
  io.on(SOCKET_EVENTS.CONNECT, (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Join chat room
    socket.on(SOCKET_EVENTS.CHAT_ROOM_JOIN, (data: { conversationId: string; user: SocketUser }) => {
      const { conversationId, user } = data;
      const roomName = `chat:${conversationId}`;

      socket.join(roomName);
      logger.info(`User ${user.uid} joined chat room: ${conversationId}`);

      // Notify others in room
      socket.to(roomName).emit(SOCKET_EVENTS.NOTIFICATION_RECEIVED, {
        type: "user_joined",
        userId: user.uid,
        timestamp: new Date(),
      });
    });

    // Leave chat room
    socket.on(SOCKET_EVENTS.CHAT_ROOM_LEAVE, (data: { conversationId: string; user: SocketUser }) => {
      const { conversationId, user } = data;
      const roomName = `chat:${conversationId}`;

      socket.leave(roomName);
      logger.info(`User ${user.uid} left chat room: ${conversationId}`);

      socket.to(roomName).emit(SOCKET_EVENTS.NOTIFICATION_RECEIVED, {
        type: "user_left",
        userId: user.uid,
        timestamp: new Date(),
      });
    });

    // Send message
    socket.on(
      SOCKET_EVENTS.CHAT_MESSAGE_SEND,
      async (data: {
        conversationId: string;
        senderId: string;
        senderRole: UserRole;
        content: string;
      }) => {
        try {
          const { conversationId, senderId, senderRole, content } = data;
          const roomName = `chat:${conversationId}`;

          // Save message to Firestore
          const result = await ChatService.sendMessage({
            conversationId,
            senderId,
            senderRole,
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
      (data: { conversationId: string; userId: string }) => {
        const { conversationId, userId } = data;
        const roomName = `chat:${conversationId}`;

        socket.to(roomName).emit(SOCKET_EVENTS.CHAT_TYPING, {
          userId,
          timestamp: new Date(),
        });
      }
    );

    // Stopped typing
    socket.on(
      SOCKET_EVENTS.CHAT_STOPPED_TYPING,
      (data: { conversationId: string; userId: string }) => {
        const { conversationId, userId } = data;
        const roomName = `chat:${conversationId}`;

        socket.to(roomName).emit(SOCKET_EVENTS.CHAT_STOPPED_TYPING, {
          userId,
          timestamp: new Date(),
        });
      }
    );

    // Delivery location update
    socket.on(
      SOCKET_EVENTS.DELIVERY_LOCATION_UPDATE,
      (data: {
        assignmentId: string;
        latitude: number;
        longitude: number;
        riderId: string;
      }) => {
        const { assignmentId } = data;
        const roomName = `delivery:${assignmentId}`;

        io.to(roomName).emit(SOCKET_EVENTS.DELIVERY_LOCATION_UPDATE, {
          latitude: data.latitude,
          longitude: data.longitude,
          timestamp: new Date(),
        });

        logger.info(`Location updated for delivery ${assignmentId}`);
      }
    );

    // Delivery status change
    socket.on(
      SOCKET_EVENTS.DELIVERY_STATUS_CHANGE,
      (data: { assignmentId: string; status: string }) => {
        const { assignmentId, status } = data;
        const roomName = `delivery:${assignmentId}`;

        io.to(roomName).emit(SOCKET_EVENTS.DELIVERY_STATUS_CHANGE, {
          status,
          timestamp: new Date(),
        });

        logger.info(`Delivery status changed: ${assignmentId} -> ${status}`);
      }
    );

    // Disconnect
    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
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
