'use client';

import { useCallback, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import {
  collection,
  onSnapshot,
  query,
  where,
  updateDoc,
  doc,
  QuerySnapshot,
} from 'firebase/firestore';
import type { Notification } from '@/shared/types';
import { FIRESTORE_COLLECTIONS } from '@/shared/constants';

/**
 * Hook for real-time notifications using Firestore listener
 * Automatically listens to user's notifications subcollection
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to notifications on mount
  useEffect(() => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Query notifications for current user, ordered by creation time
      const notificationsRef = collection(
        db,
        FIRESTORE_COLLECTIONS.NOTIFICATIONS
      );
      const q = query(
        notificationsRef,
        where('userId', '==', currentUser.uid)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot: QuerySnapshot) => {
          try {
            const docs = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate?.() || new Date(),
              updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
              readAt: doc.data().readAt?.toDate?.(),
            } as Notification));

            // Sort by creation time, newest first
            docs.sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            );

            setNotifications(docs);

            // Count unread
            const unread = docs.filter((n) => !n.isRead).length;
            setUnreadCount(unread);

            setError(null);
          } catch (err) {
            console.error('Error processing notifications:', err);
            setError('Failed to process notifications');
          } finally {
            setLoading(false);
          }
        },
        (err) => {
          console.error('Firestore listener error:', err);
          setError('Failed to load notifications');
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load notifications';
      setError(message);
      console.error('useNotifications setup error:', err);
      setLoading(false);
    }
  }, []);

  /**
   * Mark a notification as read
   */
  const markAsRead = useCallback(
    async (notificationId: string): Promise<boolean> => {
      try {
        const notificationRef = doc(
          db,
          FIRESTORE_COLLECTIONS.NOTIFICATIONS,
          notificationId
        );
        await updateDoc(notificationRef, {
          isRead: true,
          readAt: new Date(),
        });

        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId
              ? {
                  ...n,
                  isRead: true,
                  readAt: new Date(),
                }
              : n
          )
        );

        setUnreadCount((prev) => Math.max(0, prev - 1));
        return true;
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
        return false;
      }
    },
    []
  );

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.isRead);

      await Promise.all(
        unreadNotifications.map((n) => {
          const notificationRef = doc(
            db,
            FIRESTORE_COLLECTIONS.NOTIFICATIONS,
            n.id
          );
          return updateDoc(notificationRef, {
            isRead: true,
            readAt: new Date(),
          });
        })
      );

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          isRead: true,
          readAt: n.readAt || new Date(),
        }))
      );

      setUnreadCount(0);
      return true;
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      return false;
    }
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
  };
}
