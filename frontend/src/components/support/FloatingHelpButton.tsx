'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

export default function FloatingHelpButton() {
  const { profile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);

  if (!profile) return null;
  // Don't show on support pages (already there)
  if (pathname.includes('/support')) return null;

  const getSupportPath = () => {
    if (pathname.startsWith('/dashboard/admin')) return '/dashboard/admin/support';
    if (pathname.startsWith('/dashboard/pharmacy')) return '/dashboard/pharmacy/support';
    if (pathname.startsWith('/dashboard/delivery')) return '/dashboard/delivery/support';
    return '/dashboard/customer/support';
  };

  return (
    <button
      onClick={() => router.push(getSupportPath())}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed bottom-6 right-6 z-50 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 px-4 py-3"
      aria-label="Get help"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.065 2.386-1.772 3.772-1.772 1.928 0 3.5 1.343 3.5 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {isHovered && <span className="text-sm font-medium whitespace-nowrap">Need Help?</span>}
    </button>
  );
}
