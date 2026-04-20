'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const navItems: Record<string, NavItem[]> = {
  customer: [
    { label: 'Dashboard', href: '/dashboard/customer', icon: '📊' },
    { label: 'My Orders', href: '/dashboard/customer/orders', icon: '📦' },
    { label: 'Browse Pharmacies', href: '/dashboard/customer/pharmacies', icon: '🏥' },
    { label: 'Drug Checker', href: '/dashboard/customer/drug-interactions', icon: '💊' },
    { label: 'Messages', href: '/dashboard/customer/messages', icon: '💬' },
    { label: 'Support', href: '/dashboard/customer/support', icon: '🎧' },
    { label: 'Profile', href: '/dashboard/customer/profile', icon: '👤' },
    { label: 'Settings', href: '/dashboard/customer/settings', icon: '⚙️' },
  ],
  pharmacy: [
    { label: 'Dashboard', href: '/dashboard/pharmacy', icon: '📊' },
    { label: 'Orders', href: '/dashboard/pharmacy/orders', icon: '📦' },
    { label: 'Products', href: '/dashboard/pharmacy/products', icon: '💊' },
    { label: 'Inventory', href: '/dashboard/pharmacy/inventory', icon: '📦' },
    { label: 'Analytics', href: '/dashboard/pharmacy/analytics', icon: '📈' },
    { label: 'Messages', href: '/dashboard/pharmacy/messages', icon: '💬' },
    { label: 'Support', href: '/dashboard/pharmacy/support', icon: '🎧' },
    { label: 'Earnings', href: '/dashboard/pharmacy/earnings', icon: '💰' },
    { label: 'Subscription', href: '/dashboard/pharmacy/subscription', icon: '💎' },
    { label: 'Settings', href: '/dashboard/pharmacy/settings', icon: '⚙️' },
  ],
  delivery_provider: [
    { label: 'Dashboard', href: '/dashboard/delivery', icon: '📊' },
    { label: 'Active Deliveries', href: '/dashboard/delivery/active', icon: '🚚' },
    { label: 'Available Orders', href: '/dashboard/delivery/available', icon: '📋' },
    { label: 'Earnings', href: '/dashboard/delivery/earnings', icon: '💰' },
    { label: 'Messages', href: '/dashboard/delivery/messages', icon: '💬' },
    { label: 'Support', href: '/dashboard/delivery/support', icon: '🎧' },
    { label: 'Profile', href: '/dashboard/delivery/profile', icon: '👤' },
    { label: 'Settings', href: '/dashboard/delivery/settings', icon: '⚙️' },
  ],
  admin: [
    { label: 'Dashboard', href: '/dashboard/admin', icon: '📊' },
    { label: 'Users', href: '/dashboard/admin/users', icon: '👥' },
    { label: 'Approvals', href: '/dashboard/admin/approvals', icon: '✅' },
    { label: 'Orders', href: '/dashboard/admin/orders', icon: '📦' },
    { label: 'Flags & Moderation', href: '/dashboard/admin/flags', icon: '🚩' },
    { label: 'Analytics', href: '/dashboard/admin/analytics', icon: '📈' },
    { label: 'Support Tickets', href: '/dashboard/admin/support', icon: '🎧' },
    { label: 'Settings', href: '/dashboard/admin/settings', icon: '⚙️' },
  ],
};

function getRoleFromPath(pathname: string): string | null {
  if (pathname.startsWith('/dashboard/admin')) return 'admin';
  if (pathname.startsWith('/dashboard/pharmacy')) return 'pharmacy';
  if (pathname.startsWith('/dashboard/delivery')) return 'delivery_provider';
  if (pathname.startsWith('/dashboard/customer')) return 'customer';
  return null;
}

export default function Sidebar() {
  const { profile, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  if (!profile) return null;

  const pathRole = getRoleFromPath(pathname);
  const activeRole = pathRole || profile.role;
  const items = navItems[activeRole] || navItems[profile.role] || [];

  const roleLabel = activeRole === 'delivery_provider' ? 'Delivery' :
    activeRole.charAt(0).toUpperCase() + activeRole.slice(1);

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 md:hidden bg-white text-gray-700 p-2 rounded-xl shadow-lg z-50 border border-gray-200"
      >
        {isOpen ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed md:relative left-0 top-0 h-screen w-64 bg-gray-900 text-white z-40 md:z-auto transition-transform duration-300 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Logo / Brand */}
        <div className="px-5 py-5 border-b border-gray-800">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">P</span>
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight">PharmaConnect</h1>
              <p className="text-[10px] text-gray-500">{roleLabel} Portal</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          <div className="space-y-0.5">
            {items.map((item) => {
              const isExactMatch = pathname === item.href;
              const isChildMatch = pathname.startsWith(item.href + '/');
              const isActive = isExactMatch || (isChildMatch && item.href !== '/dashboard/customer' && item.href !== '/dashboard/pharmacy' && item.href !== '/dashboard/delivery' && item.href !== '/dashboard/admin');
              const isDashboardActive = (item.href === '/dashboard/customer' || item.href === '/dashboard/pharmacy' || item.href === '/dashboard/delivery' || item.href === '/dashboard/admin') && isExactMatch;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                    isActive || isDashboardActive
                      ? 'bg-primary-600/90 text-white shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                  }`}
                >
                  <span className="text-base w-6 text-center">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User / Sign Out */}
        <div className="border-t border-gray-800 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm">
              {profile.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile.name}</p>
              <p className="text-[10px] text-gray-500 truncate">{profile.email}</p>
            </div>
          </div>
          <button
            onClick={() => { signOut(); setIsOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800/60 rounded-lg transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed md:hidden inset-0 bg-black/50 backdrop-blur-sm z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
