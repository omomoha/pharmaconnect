'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useOrders, useNearbyPharmacies, useGeolocation, useSmartSearch } from '@/hooks';
import { useNotifications } from '@/hooks';
import toast from 'react-hot-toast';
import { aiService } from '@/lib/services';

export default function CustomerDashboard() {
  const { profile } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const { orders, loading: ordersLoading, error: ordersError } = useOrders({ limit: 2 });
  const { unreadCount } = useNotifications();
  const { symptoms: searchSymptoms, drugNames: searchDrugNames, categories: searchCategories, loading: searchLoading } = useSmartSearch(searchQuery);
  const { latitude, longitude, loading: geoLoading, isUsingDefaults } = useGeolocation();
  const { pharmacies: nearbyPharmacies, loading: pharmaciesLoading } = useNearbyPharmacies(latitude ?? 6.4541, longitude ?? 3.4218, 10);

  useEffect(() => {
    if (ordersError) toast.error('Failed to load recent orders');
  }, [ordersError]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setRecommendationsLoading(true);
      setRecommendationsError('');
      try {
        const result = await aiService.getRecommendations();
        if (result.success && result.data) {
          setRecommendations(result.data.recommendations || []);
        } else {
          setRecommendationsError(result.error?.message || 'Failed to load');
        }
      } catch {
        setRecommendationsError('Failed to load recommendations');
      } finally {
        setRecommendationsLoading(false);
      }
    };
    fetchRecommendations();
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/dashboard/customer/pharmacies?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const sampleRecentOrders = [
    { id: '1', medication: 'Paracetamol 500mg', pharmacy: 'HealthPlus Pharmacy', date: '2026-03-24', status: 'Delivered', total: '₦2,500' },
    { id: '2', medication: 'Vitamin C 1000mg', pharmacy: 'MediCare Pharmacy', date: '2026-03-22', status: 'Processing', total: '₦3,200' },
  ];

  const sampleNearbyPharmacies = [
    { id: '1', name: 'HealthPlus Pharmacy', distance: '0.5 km away', rating: 4.8, deliveryTime: '30-45 min' },
    { id: '2', name: 'MediCare Pharmacy', distance: '1.2 km away', rating: 4.6, deliveryTime: '45-60 min' },
  ];

  const displayOrders = (orders && orders.length > 0 ? orders.slice(0, 2) : sampleRecentOrders) as any[];
  const displayPharmacies = nearbyPharmacies.length > 0
    ? nearbyPharmacies.map((p: any) => ({
        id: p.id,
        name: p.businessName || p.name || 'Pharmacy',
        distance: p.distance ? `${p.distance.toFixed(1)} km away` : 'Nearby',
        rating: p.rating ?? 4.5,
        deliveryTime: p.deliveryTime || '30-60 min',
      }))
    : sampleNearbyPharmacies;

  const isLoadingPharmacies = geoLoading || pharmaciesLoading;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back, {profile?.name}! Find and order medications below.
        </p>
      </div>

      {/* AI-Powered Search */}
      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="relative">
            <div className="flex gap-2 items-center">
              <div className="flex-1 relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search medications, pharmacies, or describe symptoms..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowSearchDropdown(true); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  onFocus={() => searchQuery && setShowSearchDropdown(true)}
                  onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all"
                />
              </div>
              <Button variant="primary" size="sm" onClick={handleSearch}>
                Search
              </Button>
            </div>

            {/* Smart Search Dropdown */}
            {showSearchDropdown && searchQuery && (searchSymptoms.length > 0 || searchDrugNames.length > 0 || searchCategories.length > 0 || searchLoading) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-soft-lg z-20 p-2 animate-fade-in-down">
                {searchLoading && (
                  <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400">
                    <div className="animate-spin w-3 h-3 border-2 border-gray-300 border-t-primary-600 rounded-full" />
                    AI is searching...
                  </div>
                )}
                {searchDrugNames.length > 0 && (
                  <div className="mb-1">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-1">Medications</p>
                    {searchDrugNames.slice(0, 3).map((drug, idx) => (
                      <button key={idx} className="w-full text-left px-3 py-2 hover:bg-primary-50 rounded-lg transition-colors text-sm text-gray-800 flex items-center gap-2"
                        onMouseDown={() => { setSearchQuery(drug); setShowSearchDropdown(false); }}>
                        <span className="text-primary-500">💊</span> {drug}
                      </button>
                    ))}
                  </div>
                )}
                {searchSymptoms.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-1">Symptoms</p>
                    {searchSymptoms.slice(0, 3).map((symptom, idx) => (
                      <button key={idx} className="w-full text-left px-3 py-2 hover:bg-blue-50 rounded-lg transition-colors text-sm text-gray-800 flex items-center gap-2"
                        onMouseDown={() => { setSearchQuery(symptom); setShowSearchDropdown(false); }}>
                        <span className="text-blue-500">🔍</span> {symptom}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { value: orders?.length || 12, label: 'Total Orders', icon: '📦', color: 'primary' },
          { value: '₦45,600', label: 'Total Spent', icon: '💰', color: 'green' },
          { value: unreadCount > 0 ? unreadCount : 3, label: unreadCount > 0 ? 'Notifications' : 'Saved Pharmacies', icon: unreadCount > 0 ? '🔔' : '❤️', color: 'blue' },
        ].map((stat, idx) => (
          <Card key={idx}>
            <CardContent className="py-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="stat-number text-primary-600">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                </div>
                <span className="text-2xl opacity-60">{stat.icon}</span>
              </div>
            </CardContent>
          </Card>
        ))}
        <Link href="/dashboard/customer/drug-interactions">
          <Card hover>
            <CardContent className="py-5 h-full">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-900">Drug Checker</p>
                  <p className="text-xs text-gray-500 mt-1">AI-Powered</p>
                </div>
                <span className="text-2xl">💊</span>
              </div>
              <p className="text-[10px] text-primary-600 mt-2 font-medium">Check interactions →</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-gray-900">Recent Orders</h2>
            <Link href="/dashboard/customer/orders">
              <Button variant="ghost" size="xs">View All →</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (<div key={i} className="h-12 shimmer rounded-lg" />))}
            </div>
          ) : displayOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Medication</th>
                    <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Pharmacy</th>
                    <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="text-right py-2.5 px-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {displayOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-3 font-medium text-gray-900">{order.medication || order.items}</td>
                      <td className="py-3 px-3 text-gray-600">{order.pharmacy}</td>
                      <td className="py-3 px-3 text-gray-500">{order.date}</td>
                      <td className="py-3 px-3">
                        <span className={`badge ${order.status === 'Delivered' ? 'badge-green' : 'badge-blue'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-gray-900">{order.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">📦</span>
              </div>
              <p className="text-sm text-gray-500 mb-3">No orders yet</p>
              <Link href="/dashboard/customer/pharmacies">
                <Button variant="primary" size="xs">Browse Pharmacies</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Nearby Pharmacies */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-gray-900">Nearby Pharmacies</h2>
              {isUsingDefaults && (
                <p className="text-[10px] text-amber-600 mt-0.5">
                  Showing near Lagos (default). Enable location for better results.
                </p>
              )}
            </div>
            <Link href="/dashboard/customer/pharmacies">
              <Button variant="ghost" size="xs">View All →</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingPharmacies ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4">
                  <div className="h-4 shimmer rounded mb-2 w-2/3" />
                  <div className="h-3 shimmer rounded mb-3 w-1/3" />
                  <div className="h-3 shimmer rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {displayPharmacies.slice(0, 4).map((pharmacy) => (
                <div key={pharmacy.id} className="border border-gray-100 rounded-xl p-4 hover:border-primary-200 hover:shadow-sm transition-all duration-200 group">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm group-hover:text-primary-700 transition-colors">{pharmacy.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{pharmacy.distance}</p>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <span className="text-yellow-400 text-xs">★</span>
                      <span className="font-semibold text-xs">{pharmacy.rating}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-gray-500">
                      Delivery: {pharmacy.deliveryTime}
                    </p>
                    <Link href={`/dashboard/customer/pharmacies/${pharmacy.id}`}>
                      <Button variant="primary" size="xs">View</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900">Recommended for You</h2>
              <span className="badge-blue text-[10px]">AI</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {recommendationsLoading ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4">
                  <div className="h-4 shimmer rounded mb-3 w-2/3" />
                  <div className="h-3 shimmer rounded mb-2 w-1/3" />
                  <div className="h-2 shimmer rounded w-full" />
                </div>
              ))}
            </div>
          ) : recommendationsError ? (
            <div className="text-center py-8">
              <p className="text-xs text-gray-400 mb-3">{recommendationsError}</p>
              <Button variant="outline" size="xs" onClick={() => {
                setRecommendationsLoading(true);
                setRecommendationsError('');
                aiService.getRecommendations()
                  .then((result) => {
                    if (result.success && result.data) setRecommendations(result.data.recommendations || []);
                    else setRecommendationsError(result.error?.message || 'Failed');
                    setRecommendationsLoading(false);
                  })
                  .catch(() => { setRecommendationsError('Failed'); setRecommendationsLoading(false); });
              }}>
                Retry
              </Button>
            </div>
          ) : recommendations && recommendations.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {recommendations.map((rec: any, idx: number) => (
                <div key={idx} className="border border-gray-100 rounded-xl p-4 hover:border-primary-200 hover:shadow-sm transition-all duration-200">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-sm text-gray-900">{rec.productName}</h3>
                      <span className="badge-green text-[10px] mt-1">{rec.category}</span>
                    </div>
                    <span className="text-[10px] font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                      {Math.round(rec.confidence * 100)}% match
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed mt-2">{rec.reason}</p>
                  <div className="mt-3">
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-primary-500 h-1.5 rounded-full transition-all" style={{ width: `${rec.confidence * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">💡</span>
              </div>
              <p className="text-sm text-gray-500 mb-3">Browse pharmacies to get personalized recommendations</p>
              <Link href="/dashboard/customer/pharmacies">
                <Button variant="primary" size="xs">Browse Pharmacies</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
