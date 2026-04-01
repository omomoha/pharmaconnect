'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardRedirect() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    const role = profile?.role;
    switch (role) {
      case 'admin':
        router.replace('/dashboard/admin');
        break;
      case 'pharmacy':
        router.replace('/dashboard/pharmacy');
        break;
      case 'delivery_provider':
        router.replace('/dashboard/delivery');
        break;
      case 'customer':
      default:
        router.replace('/dashboard/customer');
        break;
    }
  }, [user, profile, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
