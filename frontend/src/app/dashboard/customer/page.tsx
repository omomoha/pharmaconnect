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

  // Get user's geolocation (falls back to Lagos defaults)
  const { latitude, longitude, loading: geoLoading, isUsingDefaults } = useGeolocation();

  // Fetch nearby pharmacies based on user location
  const {
    pharmacies: nearbyPharmacies,
    loading: pharmaciesLoading,
    error: pharmaciesError,
  } = useNearbyPharmacies(latitude ?? 6.4541, longitude ?? 3.4218, 10);

  // Show error toast if orders fail to load
  useEffect(() => {
    if (ordersError) {
      toast.error('Failed to load recent orders');
    }
  }, [ordersError]);

  // Fetch AI recommendations
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
      } catch (error: any) {
        setRecommendationsError('Failed to load recommendations');
      } finally {
        setRecommendationsLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  // Handle search with smart search
  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/dashboard/customer/pharmacies?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Sample data fallback for orders
  const sampleRecentOrders = [
    {
      id: '1',
      medication: 'Paracetamol 500mg',
      pharmacy: 'HealthPlus Pharmacy',
      date: '2026-03-24',
      status: 'Delivered',
      total: '₦2,500',
    },
    {
      id: '2',
      medication: 'Vitamin C 1000mg',
      pharmacy: 'MediCare Pharmacy',
      date: '2026-03-22',
      status: 'Processing',
      total: '₦3,200',
    },
  ];

  // Fallback sample pharmacies (used only when API returns empty)
  const sampleNearbyPharmacies = [
    {
      id: '1',
      name: 'HealthPlus Pharmacy',
      distance: '0.5 km away',
      rating: 4.8,
      deliveryTime: '30-45 min',
    },
    {
      id: '2',
      name: 'MediCare Pharmacy',
      distance: '1.2 km away',
      rating: 4.6,
      deliveryTime: '45-60 min',
    },
  ];

  // Format orders for display (use API data if available, fallback to sample)
  const displayOrders = (orders && orders.length > 0 ? orders.slice(0, 2) : sampleRecentOrders) as any[];

  // Map API pharmacies to display format, fall back to sample data
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back, {profile?.name}! Find and order medications below.
        </p>
      </div>

      {/* Quick Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Search for medications, pharmacies, or symptoms..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchDropdown(true);
                }}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => searchQuery && setShowSearchDropdown(true)}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
              />
              <Button variant="primary" size="lg" onClick={handleSearch}>
                Search
              </Button>
            </div>

            {/* Smart Search Dropdown */}
            {showSearchDropdown && searchQuery && (searchSymptoms.length > 0 || searchDrugNames.length > 0 || searchCategories.length > 0) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-3 space-y-2">
                {searchDrugNames.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Medications</p>
                    {searchDrugNames.slice(0, 3).map((drug, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-2 hover:bg-gray-50 cursor-pointer rounded transition-colors"
                        onClick={() => { setSearchQuery(drug); setShowSearchDropdown(false); }}
                      >
                        <p className="text-sm font-medium text-gray-900">{drug}</p>
                      </div>
                    ))}
                  </div>
                )}
                {searchSymptoms.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Symptoms</p>
                    {searchSymptoms.slice(0, 3).map((symptom, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-2 hover:bg-gray-50 cursor-pointer rounded transition-colors"
                        onClick={() => { setSearchQuery(symptom); setShowSearchDropdown(false); }}
                      >
                        <p className="text-sm font-medium text-gray-900">{symptom}</p>
                      </div>
                    ))}
                  </div>
                )}
                {searchLoading && (
                  <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400">
                    <div className="animate-spin w-3 h-3 border-2 border-gray-300 border-t-primary-600 rounded-full" />
                    Searching...
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-4xl font-bold text-primary-600">{orders?.length || 12}</p>
              <p className="text-gray-600">Total Orders</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-4xl font-bold text-primary-600">₦45,600</p>
              <p className="text-gray-600">Total Spent</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-4xl font-bold text-primary-600">{unreadCount > 0 ? unreadCount : 3}</p>
              <p className="text-gray-600">{unreadCount > 0 ? 'Unread Notifications' : 'Saved Pharmacies'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <Link href="/dashboard/customer/drug-interactions">
              <div className="text-center space-y-3 hover:opacity-80 transition-opacity cursor-pointer">
                <div className="text-3xl">💊</div>
                <p className="text-sm font-semibold text-gray-900">Drug Interaction</p>
                <p className="text-xs text-gray-600">Checker</p>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
            <Link href="/dashboard/customer/orders">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          ) : displayOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Medication
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Pharmacy
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4">{order.medication || order.items}</td>
                      <td className="py-4 px-4">{order.pharmacy}</td>
                      <td className="py-4 px-4 text-gray-600">{order.date}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            order.status === 'Delivered'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-semibold">
                        {order.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No orders yet</p>
              <Link href="/dashboard/customer/pharmacies">
                <Button variant="primary" size="sm" className="mt-4">
                  Browse Pharmacies
                </Button>
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
              <h2 className="text-lg font-bold text-gray-900">Nearby Pharmacies</h2>
              {isUsingDefaults && (
                <p className="text-xs text-amber-600 mt-1">
                  Showing pharmacies near Lagos (default). Enable location for personalized results.
                </p>
              )}
            </div>
            <Link href="/dashboard/customer/pharmacies">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingPharmacies ? (
            <div className="grid md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4">
                  <div className="h-5 bg-gray-200 rounded animate-pulse mb-2 w-2/3" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-3 w-1/3" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {displayPharmacies.slice(0, 4).map((pharmacy) => (
                <div
                  key={pharmacy.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">{pharmacy.name}</h3>
                      <p className="text-sm text-gray-600">{pharmacy.distance}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-400">★</span>
                        <span className="font-semibold">{pharmacy.rating}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Delivery: {pharmacy.deliveryTime}
                    </p>
                    <Link href={`/dashboard/customer/pharmacies/${pharmacy.id}`}>
                      <Button variant="primary" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pharmaciesError && !isLoadingPharmacies && displayPharmacies === sampleNearbyPharmacies && (
            <p className="text-xs text-gray-500 mt-3 text-center">
              Could not load pharmacies from server. Showing sample data.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recommended for You */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-bold text-gray-900">Recommended for You</h2>
        </CardHeader>
        <CardContent>
          {recommendationsLoading ? (
            <div className="grid md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4">
                  <div className="h-5 bg-gray-200 rounded animate-pulse mb-3 w-2/3" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-1/3" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-full mb-2" />
                  <div className="h-2 bg-gray-200 rounded animate-pulse w-1/2" />
                </div>
              ))}
            </div>
          ) : recommendationsError ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{recommendationsError}</p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setRecommendationsLoading(true);
                  setRecommendationsError('');
                  aiService
                    .getRecommendations()
                    .then((result) => {
                      setRecommendations(result.recommendations || []);
                      setRecommendationsLoading(false);
                    })
                    .catch((error: any) => {
                      setRecommendationsError(error?.message || 'Failed to load recommendations');
                      setRecommendationsLoading(false);
                    });
                }}
              >
                Retry
              </Button>
            </div>
          ) : recommendations && recommendations.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {recommendations.map((rec: any, idx: number) => (
                <div
                  key={idx}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="mb-3">
                    <h3 className="font-bold text-gray-900">{rec.productName}</h3>
                    <span className="inline-block mt-2 px-2 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
                      {rec.category}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{rec.reason}</p>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs text-gray-600 mb-1">
                      <span>Confidence</span>
                      <span>{Math.round(rec.confidence * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all"
                        style={{ width: `${rec.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Browse pharmacies to get personalized recommendations</p>
              <Link href="/dashboard/customer/pharmacies">
                <Button variant="primary" size="sm">
                  Browse Pharmacies
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
