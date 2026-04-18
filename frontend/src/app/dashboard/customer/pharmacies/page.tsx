'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { useNearbyPharmacies, useGeolocation, useSmartSearch } from '@/hooks';

// Sample pharmacies data (fallback when API returns empty)
const SAMPLE_PHARMACIES = [
  {
    id: '1',
    name: 'HealthPlus Pharmacy',
    location: 'Lekki, Lagos',
    distance: 0.5,
    rating: 4.8,
    reviewCount: 324,
    deliveryTime: '30-45 min',
    deliveryFee: '₦200',
    category: 'General',
    description: 'Full range of OTC medications and healthcare products',
  },
  {
    id: '2',
    name: 'MediCare Pharmacy',
    location: 'Ikoyi, Lagos',
    distance: 1.2,
    rating: 4.6,
    reviewCount: 287,
    deliveryTime: '45-60 min',
    deliveryFee: '₦250',
    category: 'General',
    description: 'Wide selection of vitamins and supplements',
  },
  {
    id: '3',
    name: 'QuickHealth Pharmacy',
    location: 'VI, Lagos',
    distance: 2.1,
    rating: 4.7,
    reviewCount: 198,
    deliveryTime: '40-55 min',
    deliveryFee: '₦300',
    category: 'Premium',
    description: 'Premium healthcare solutions and wellness products',
  },
  {
    id: '4',
    name: 'PharmaCare Plus',
    location: 'Ajah, Lagos',
    distance: 3.8,
    rating: 4.5,
    reviewCount: 156,
    deliveryTime: '50-70 min',
    deliveryFee: '₦350',
    category: 'General',
    description: 'Specialized in pain relief and cold remedies',
  },
  {
    id: '5',
    name: 'WellnessHub Pharmacy',
    location: 'Ikeja, Lagos',
    distance: 4.2,
    rating: 4.9,
    reviewCount: 412,
    deliveryTime: '55-75 min',
    deliveryFee: '₦400',
    category: 'Premium',
    description: 'Comprehensive wellness and preventive care products',
  },
  {
    id: '6',
    name: 'Express Pharmacy',
    location: 'Surulere, Lagos',
    distance: 5.1,
    rating: 4.3,
    reviewCount: 89,
    deliveryTime: '60-90 min',
    deliveryFee: '₦450',
    category: 'General',
    description: 'Fast delivery with competitive prices',
  },
  {
    id: '7',
    name: 'Elite Pharmacy',
    location: 'Banana Island, Lagos',
    distance: 6.0,
    rating: 4.8,
    reviewCount: 267,
    deliveryTime: '45-60 min',
    deliveryFee: '₦500',
    category: 'Premium',
    description: 'Luxury healthcare and cosmetic products',
  },
  {
    id: '8',
    name: 'Community Pharmacy',
    location: 'Yaba, Lagos',
    distance: 2.8,
    rating: 4.4,
    reviewCount: 145,
    deliveryTime: '35-50 min',
    deliveryFee: '₦200',
    category: 'General',
    description: 'Trusted neighborhood pharmacy with great service',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'General', label: 'General' },
  { id: 'Premium', label: 'Premium' },
];

export default function PharmaciesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'delivery'>('distance');
  const [showSmartResults, setShowSmartResults] = useState(false);

  // AI smart search
  const { results: smartResults, loading: aiLoading, symptoms, drugNames, categories: aiCategories, confidence } = useSmartSearch(searchQuery);

  // Get user's geolocation
  const { latitude, longitude, loading: geoLoading, isUsingDefaults } = useGeolocation();

  // Fetch pharmacies from API sorted by proximity
  const {
    pharmacies: apiPharmacies,
    loading: apiLoading,
    error: _apiError,
  } = useNearbyPharmacies(latitude ?? 6.4541, longitude ?? 3.4218, 50);

  const isLoading = geoLoading || apiLoading;

  // Map API pharmacies to display format
  const pharmacies = useMemo(() => {
    if (apiPharmacies.length > 0) {
      return apiPharmacies.map((p: any) => ({
        id: p.id,
        name: p.businessName || p.name || 'Pharmacy',
        location: p.address || p.location || '',
        distance: p.distance ?? 0,
        rating: p.rating ?? 4.5,
        reviewCount: p.reviewCount ?? 0,
        deliveryTime: p.deliveryTime || '30-60 min',
        deliveryFee: p.deliveryFee ? `₦${p.deliveryFee}` : '₦300',
        category: p.category || 'General',
        description: p.description || 'Quality pharmacy products and services',
      }));
    }
    return SAMPLE_PHARMACIES;
  }, [apiPharmacies]);

  // Filter and sort pharmacies
  const filteredPharmacies = useMemo(() => {
    let result = [...pharmacies];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.location.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'distance') {
        return a.distance - b.distance;
      }
      if (sortBy === 'rating') {
        return b.rating - a.rating;
      }
      if (sortBy === 'delivery') {
        return parseInt(a.deliveryTime) - parseInt(b.deliveryTime);
      }
      return 0;
    });

    return result;
  }, [pharmacies, searchQuery, selectedCategory, sortBy]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Browse Pharmacies"
        description="Find and order medications from nearby pharmacies"
      />

      {/* Location notice */}
      {isUsingDefaults && !isLoading && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          Showing pharmacies near Lagos (default location). Enable browser location for personalized results sorted by your proximity.
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Search Bar with Smart Results */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Search pharmacies or locations..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSmartResults(e.target.value.trim().length > 0);
              }}
              onFocus={() => setShowSmartResults(searchQuery.trim().length > 0)}
              onBlur={() => setTimeout(() => setShowSmartResults(false), 200)}
              className="w-full"
            />

            {/* Smart Search Results Dropdown */}
            {showSmartResults && searchQuery.trim() && (smartResults || symptoms.length > 0 || drugNames.length > 0) && (
              <div className="absolute top-full mt-2 left-0 right-0 bg-white border-2 border-primary-300 rounded-lg shadow-lg z-10 p-4 space-y-4">
                {/* Confidence Indicator */}
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-grow bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-green-500 transition-all"
                      style={{ width: `${Math.min(confidence * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-600">
                    {Math.round(confidence * 100)}% match
                  </span>
                </div>

                {/* Symptoms */}
                {symptoms.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2">Detected Symptoms</p>
                    <div className="flex flex-wrap gap-2">
                      {symptoms.map((symptom) => (
                        <button
                          key={symptom}
                          onClick={() => setSearchQuery(symptom)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full hover:bg-blue-200 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          {symptom}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Drug Names */}
                {drugNames.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2">Matching Products</p>
                    <div className="flex flex-wrap gap-2">
                      {drugNames.map((drug) => (
                        <button
                          key={drug}
                          onClick={() => setSearchQuery(drug)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full hover:bg-green-200 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          {drug}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Categories */}
                {aiCategories.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2">Categories</p>
                    <div className="flex flex-wrap gap-2">
                      {aiCategories.map((category) => (
                        <button
                          key={category}
                          onClick={() => setSearchQuery(category)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full hover:bg-purple-200 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {aiLoading && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="animate-spin w-3 h-3 border-2 border-gray-300 border-t-primary-600 rounded-full" />
                    Analyzing search...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Filters Row */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <div className="flex gap-2 flex-wrap">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as 'distance' | 'rating' | 'delivery')
                }
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
              >
                <option value="distance">Nearest First</option>
                <option value="rating">Highest Rating</option>
                <option value="delivery">Fastest Delivery</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {isLoading
            ? 'Loading pharmacies...'
            : `Showing ${filteredPharmacies.length} pharmacies${searchQuery ? ` for "${searchQuery}"` : ''}`}
        </p>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-2/3" />
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-8 bg-gray-200 rounded w-full mt-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredPharmacies.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPharmacies.map((pharmacy) => (
            <Card key={pharmacy.id} className="flex flex-col">
              <CardContent className="pt-6 flex flex-col h-full">
                {/* Header */}
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">
                        {pharmacy.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {pharmacy.location}
                      </p>
                    </div>
                    <span className="bg-primary-100 text-primary-700 text-xs font-bold px-2 py-1 rounded">
                      {pharmacy.distance.toFixed(1)} km
                    </span>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(pharmacy.rating)
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="font-semibold text-gray-900">
                    {pharmacy.rating}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({pharmacy.reviewCount})
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4 flex-grow">
                  {pharmacy.description}
                </p>

                {/* Info Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-sm">
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-gray-600 text-xs">Delivery</p>
                    <p className="font-semibold text-gray-900">
                      {pharmacy.deliveryTime}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-gray-600 text-xs">Fee</p>
                    <p className="font-semibold text-gray-900">
                      {pharmacy.deliveryFee}
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                <Link href={`/dashboard/customer/pharmacies/${pharmacy.id}`}>
                  <Button variant="primary" size="md" className="w-full">
                    View Pharmacy
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <svg
              className="w-16 h-16 text-gray-300 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19.5 13a7.5 7.5 0 11-15 0m15 0a7.5 7.5 0 1-15 0m15 0h-15m12 0a2.25 2.25 0 01-4.5 0m0 0a2.25 2.25 0 00-4.5 0"
              />
            </svg>
            <p className="text-lg font-semibold text-gray-900 mb-2">
              No pharmacies found
            </p>
            <p className="text-gray-600 mb-4">
              Try adjusting your search or filters
            </p>
            <Button
              variant="ghost"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
