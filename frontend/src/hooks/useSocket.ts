'use client';

import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { auth } from '@/lib/firebase';
import {
  getSocket,
  connectSocket,
  disconnectSocket,
  joinChatRoom,
} from '@/lib/socket';
import type { UserRole } from '@/shared/types';

/**
 * Hook that manages Socket.IO connection lifecycle
 * Automatically connects when user is authenticated and disconnects on logout
 * @returns Object with socket instance and connection status
 */
export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          // Get ID token for authentication
          const idToken = await user.getIdToken();

          // Get user role from custom claims
          const claims = (await user.getIdTokenResult()).claims;
          const role = (claims.role as UserRole) || 'customer';

          // Initialize and connect socket
          const socketInstance = getSocket();
          connectSocket(user.uid, role, idToken);

          setSocket(socketInstance);

          // Listen for connection events
          const handleConnect = () => {
            setConnected(true);
            console.log('Socket connected');
          };

          const handleDisconnect = () => {
            setConnected(false);
            console.log('Socket disconnected');
          };

          socketInstance.on('connect', handleConnect);
          socketInstance.on('disconnect', handleDisconnect);

          // Set initial connected state
          if (socketInstance.connected) {
            setConnected(true);
          }

          // Cleanup listeners on unmount
          return () => {
            socketInstance.off('connect', handleConnect);
            socketInstance.off('disconnect', handleDisconnect);
          };
        } catch (error) {
          console.error('Failed to initialize socket:', error);
        }
      } else {
        // Disconnect socket when user logs out
        disconnectSocket();
        setSocket(null);
        setConnected(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    socket,
    connected,
  };
}

/**
 * Hook for joining/leaving a chat room
 * @param conversationId - The conversation ID to join
 */
export function useChatRoom(conversationId: string) {
  const { socket, connected } = useSocket();

  useEffect(() => {
    if (!socket || !connected || !conversationId) {
      return;
    }

    // Join the chat room
    joinChatRoom(conversationId);

    return () => {
      // Note: You might want to emit a leave_room event on unmount
      // depending on your backend implementation
    };
  }, [socket, connected, conversationId]);

  return { socket, connected };
}
