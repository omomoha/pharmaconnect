'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import Input from '@/components/ui/Input';

// Sample pharmacies data
const SAMPLE_PHARMACIES = [
  {
    id: '1',
    name: 'HealthPlus Pharmacy',
    location: 'Lekki, Lagos',
    distance: '0.5 km',
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
    distance: '1.2 km',
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
    distance: '2.1 km',
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
    distance: '3.8 km',
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
    distance: '4.2 km',
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
    distance: '5.1 km',
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
    distance: '6.0 km',
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
    distance: '2.8 km',
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

  // Filter and sort pharmacies
  const filteredPharmacies = useMemo(() => {
    let result = SAMPLE_PHARMACIES;

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
        return parseFloat(a.distance) - parseFloat(b.distance);
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
  }, [searchQuery, selectedCategory, sortBy]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Browse Pharmacies"
        description="Find and order medications from nearby pharmacies"
      />

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Search Bar */}
          <Input
            type="text"
            placeholder="Search pharmacies or locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />

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
          Showing {filteredPharmacies.length} pharmacies
          {searchQuery && ` for "${searchQuery}"`}
        </p>
      </div>

      {/* Pharmacy Grid */}
      {filteredPharmacies.length > 0 ? (
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
                      {pharmacy.distance}
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
                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
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
