'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Button from '@/components/ui/Button';

interface Pharmacy {
  id: string;
  name: string;
  location: string;
  rating: number;
  reviews: number;
  category: string;
  image: string;
}

// Dummy pharmacy data
const dummyPharmacies: Pharmacy[] = [
  {
    id: '1',
    name: 'HealthCare Plus Pharmacy',
    location: 'Lekki, Lagos',
    rating: 4.8,
    reviews: 342,
    category: 'Full-Service',
    image: '💊',
  },
  {
    id: '2',
    name: 'MediCare Solutions',
    location: 'Victoria Island, Lagos',
    rating: 4.6,
    reviews: 218,
    category: 'Premium',
    image: '⚕️',
  },
  {
    id: '3',
    name: 'WellnessHub Pharmacy',
    location: 'Ikoyi, Lagos',
    rating: 4.7,
    reviews: 295,
    category: 'Full-Service',
    image: '🏥',
  },
  {
    id: '4',
    name: 'Quick Meds Pharmacy',
    location: 'Yaba, Lagos',
    rating: 4.5,
    reviews: 156,
    category: 'Express',
    image: '🚀',
  },
  {
    id: '5',
    name: 'Family Care Pharmacy',
    location: 'Surulere, Lagos',
    rating: 4.9,
    reviews: 421,
    category: 'Full-Service',
    image: '❤️',
  },
  {
    id: '6',
    name: 'ProHealth Pharmacy',
    location: 'Ikeja, Lagos',
    rating: 4.4,
    reviews: 189,
    category: 'Budget-Friendly',
    image: '💚',
  },
];

export default function BrowsePharmaciesPage() {
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [pharmacies, setPharmacies] = useState(dummyPharmacies);

  const handleFilter = () => {
    let filtered = dummyPharmacies;

    if (location) {
      filtered = filtered.filter((p) =>
        p.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    if (category) {
      filtered = filtered.filter((p) => p.category === category);
    }

    setPharmacies(filtered);
  };

  const handleReset = () => {
    setLocation('');
    setCategory('');
    setPharmacies(dummyPharmacies);
  };

  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 py-20 md:py-32">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900">
              Browse <span className="text-gradient">Pharmacies</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Discover trusted pharmacies near you and find the medications you need.
            </p>
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="py-8 md:py-12 bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="container-custom">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">
              Filter Pharmacies
            </h2>

            <div className="grid md:grid-cols-3 gap-4">
              {/* Location Filter */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Lekki, VI, Yaba..."
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-primary-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Category Filter */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-primary-500 focus:outline-none transition-colors"
                >
                  <option value="">All Categories</option>
                  <option value="Full-Service">Full-Service</option>
                  <option value="Premium">Premium</option>
                  <option value="Express">Express</option>
                  <option value="Budget-Friendly">Budget-Friendly</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-end gap-2">
                <button
                  onClick={handleFilter}
                  className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  Filter
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Results Count */}
            <div className="text-sm text-gray-600">
              Showing {pharmacies.length} pharmacies
            </div>
          </div>
        </div>
      </section>

      {/* Pharmacy Grid Section */}
      <section className="py-20 md:py-32 bg-gray-50">
        <div className="container-custom">
          {pharmacies.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pharmacies.map((pharmacy) => (
                <div
                  key={pharmacy.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  {/* Pharmacy Image/Icon */}
                  <div className="h-40 bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
                    <span className="text-6xl">{pharmacy.image}</span>
                  </div>

                  {/* Pharmacy Info */}
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 line-clamp-2">
                        {pharmacy.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-2 text-sm">
                        <span className="text-yellow-500">★</span>
                        <span className="font-medium text-gray-900">
                          {pharmacy.rating}
                        </span>
                        <span className="text-gray-600">
                          ({pharmacy.reviews} reviews)
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start gap-2 text-sm">
                        <span className="text-primary-600 mt-0.5">📍</span>
                        <span className="text-gray-600">{pharmacy.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-block px-3 py-1 text-xs font-medium text-primary-600 bg-primary-50 rounded-full">
                          {pharmacy.category}
                        </span>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <Link href={`/pharmacy/${pharmacy.id}`} className="block">
                      <Button
                        variant="primary"
                        size="md"
                        className="w-full"
                      >
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 space-y-4">
              <p className="text-xl text-gray-600">
                No pharmacies found matching your filters.
              </p>
              <Button
                variant="outline"
                size="md"
                onClick={handleReset}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Info Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-12">
              Why Choose Our Listed Pharmacies?
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">✓</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Verified & Licensed</h3>
                  <p className="text-gray-600 text-sm">
                    All pharmacies are verified and hold valid licenses.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">✓</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Quality Assured</h3>
                  <p className="text-gray-600 text-sm">
                    Genuine medications from trusted suppliers only.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">✓</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Real-Time Tracking</h3>
                  <p className="text-gray-600 text-sm">
                    Track your orders from pharmacy to your doorstep.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">✓</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Competitive Pricing</h3>
                  <p className="text-gray-600 text-sm">
                    Compare prices across pharmacies and save money.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary-600 text-white">
        <div className="container-custom text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            Ready to Order?
          </h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            Create an account or log in to start browsing medications and place your order.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            <Link href="/register?role=customer">
              <Button size="lg" variant="primary" className="bg-white text-primary-600 hover:bg-gray-100 w-full sm:w-auto">
                Create Account
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-primary-700 w-full sm:w-auto">
                Log In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container-custom">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-white mb-4">PharmaConnect</h4>
              <p className="text-sm">Your trusted online pharmacy marketplace.</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/browse" className="hover:text-white">Browse Pharmacies</Link></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8 text-center text-sm">
            <p>&copy; 2026 PharmaConnect. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
