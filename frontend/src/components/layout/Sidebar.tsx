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
    { label: 'Messages', href: '/dashboard/customer/messages', icon: '💬' },
    { label: 'Profile', href: '/dashboard/customer/profile', icon: '👤' },
  ],
  pharmacy: [
    { label: 'Dashboard', href: '/dashboard/pharmacy', icon: '📊' },
    { label: 'Orders', href: '/dashboard/pharmacy/orders', icon: '📦' },
    { label: 'Products', href: '/dashboard/pharmacy/products', icon: '💊' },
    { label: 'Inventory', href: '/dashboard/pharmacy/inventory', icon: '📦' },
    { label: 'Analytics', href: '/dashboard/pharmacy/analytics', icon: '📈' },
    { label: 'Messages', href: '/dashboard/pharmacy/messages', icon: '💬' },
    { label: 'Settings', href: '/dashboard/pharmacy/settings', icon: '⚙️' },
  ],
  delivery_provider: [
    { label: 'Dashboard', href: '/dashboard/delivery', icon: '📊' },
    { label: 'Active Deliveries', href: '/dashboard/delivery/active', icon: '🚚' },
    { label: 'Available Orders', href: '/dashboard/delivery/available', icon: '📋' },
    { label: 'Earnings', href: '/dashboard/delivery/earnings', icon: '💰' },
    { label: 'Messages', href: '/dashboard/delivery/messages', icon: '💬' },
    { label: 'Profile', href: '/dashboard/delivery/profile', icon: '👤' },
  ],
  admin: [
    { label: 'Dashboard', href: '/dashboard/admin', icon: '📊' },
    { label: 'Users', href: '/dashboard/admin/users', icon: '👥' },
    { label: 'Approvals', href: '/dashboard/admin/approvals', icon: '✅' },
    { label: 'Orders', href: '/dashboard/admin/orders', icon: '📦' },
    { label: 'Flags & Moderation', href: '/dashboard/admin/flags', icon: '🚩' },
    { label: 'Analytics', href: '/dashboard/admin/analytics', icon: '📈' },
    { label: 'Settings', href: '/dashboard/admin/settings', icon: '⚙️' },
  ],
};

export default function Sidebar() {
  const { profile, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();

  if (!profile) {
    return null;
  }

  const items = navItems[profile.role] || [];

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 md:hidden bg-primary-600 text-white p-3 rounded-full shadow-lg z-40"
      >
        {isOpen ? '✕' : '☰'}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed md:relative left-0 top-0 md:top-auto h-screen md:h-auto w-64 bg-gray-900 text-white z-40 md:z-auto transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="px-6 py-8 border-b border-gray-700">
          <h2 className="text-lg font-bold capitalize">{profile.role.replace('_', ' ')}</h2>
          <p className="text-sm text-gray-400 mt-1">{profile.name}</p>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-6">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white border-r-4 border-primary-400'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-gray-700 p-6 space-y-3">
          <Link
            href={`/dashboard/${profile.role}/settings`}
            className="block text-gray-300 hover:text-white py-2"
          >
            Settings
          </Link>
          <button
            onClick={() => {
              signOut();
              setIsOpen(false);
            }}
            className="w-full text-left text-gray-300 hover:text-white py-2 px-0"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed md:hidden inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
