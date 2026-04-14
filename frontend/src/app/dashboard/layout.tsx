'use client';

import React, { ReactNode, useState, useRef, useEffect, lazy, Suspense } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks';

// Lazy-load the AI chat widget since it's not needed on initial render
const AIChatWidget = lazy(() => import('@/components/ai/AIChatWidget'));

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, loading } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotificationDropdown(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showNotificationDropdown) {
        setShowNotificationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showNotificationDropdown]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (!loading && user && profile?.role) {
      const roleSegment = pathname?.split('/')[2]; // e.g., 'customer', 'pharmacy', 'delivery', 'admin'
      const roleMap: Record<string, string> = {
        customer: 'customer',
        pharmacy: 'pharmacy',
        delivery: 'delivery_provider',
        admin: 'admin',
      };
      if (roleSegment && roleMap[roleSegment] && roleMap[roleSegment] !== profile.role) {
        router.push(`/dashboard/${profile.role === 'delivery_provider' ? 'delivery' : profile.role}`);
      }
    }
  }, [loading, user, profile, pathname, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center space-y-4">
          <div className="relative w-12 h-12 mx-auto">
            <div className="w-12 h-12 border-4 border-primary-100 rounded-full" />
            <div className="absolute inset-0 w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const roleLabel = profile?.role === 'pharmacy' ? 'Pharmacy' :
    profile?.role === 'delivery_provider' ? 'Delivery' :
    profile?.role === 'admin' ? 'Admin' : 'Customer';

  return (
    <div className="flex h-screen bg-gray-50/80">
      <Sidebar />
      <Suspense fallback={null}>
        <AIChatWidget />
      </Suspense>

      <main id="main-content" className="flex-1 overflow-y-auto">
        {/* Top Bar */}
        <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-30">
          <div className="px-6 py-3 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-base font-semibold text-gray-900">
                  {profile?.name || 'User'}
                </h1>
                <p className="text-xs text-gray-400">{roleLabel} Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Notifications */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                  className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
                  aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                  aria-expanded={showNotificationDropdown}
                  aria-haspopup="true"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold animate-scale-in">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotificationDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-100 rounded-xl shadow-soft-lg z-50 animate-fade-in-down overflow-hidden">
                    <div className="p-3.5 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-semibold text-sm text-gray-900">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="badge-blue text-[10px]">{unreadCount} new</span>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications && notifications.length > 0 ? (
                        notifications.slice(0, 5).map((notif) => (
                          <div
                            key={notif.id}
                            className="p-3.5 border-b border-gray-50 hover:bg-gray-50/80 cursor-pointer transition-colors"
                            onClick={() => { markAsRead(notif.id); setShowNotificationDropdown(false); }}
                          >
                            <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{notif.message}</p>
                            <p className="text-[10px] text-gray-400 mt-1.5">{new Date(notif.createdAt).toLocaleString()}</p>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center">
                          <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-lg">🔔</span>
                          </div>
                          <p className="text-xs text-gray-400">No notifications yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar */}
              <div className="flex items-center gap-2.5 pl-2 ml-1 border-l border-gray-200">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm">
                  {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
