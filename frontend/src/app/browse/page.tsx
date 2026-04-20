'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Button from '@/components/ui/Button';
import Footer from '@/components/layout/Footer';
import { useSmartSearch } from '@/hooks/useSmartSearch';
import { useDropdownKeyboard } from '@/hooks/useDropdownKeyboard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface Pharmacy {
  id: string;
  name: string;
  address: string;
  rating: number;
  totalReviews: number;
  approvalStatus: string;
  isActive: boolean;
  operatingHours?: Record<string, { open: string; close: string; closed: boolean }>;
}

export default function BrowsePharmaciesPage() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('q') || '');
  const [locationFilter, setLocationFilter] = useState('');
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const browseSearchRef = useRef<HTMLInputElement>(null);
  const { symptoms, drugNames, categories: aiCategories, loading: searchLoading } = useSmartSearch(searchQuery);

  const browseDropdownItems = useMemo(
    () => [...drugNames.slice(0, 3), ...symptoms.slice(0, 3), ...aiCategories.slice(0, 5)],
    [drugNames, symptoms, aiCategories]
  );

  const { handleKeyDown: handleBrowseKeyDown, resetIndex: resetBrowseIdx } = useDropdownKeyboard(
    showSearchDropdown ? browseDropdownItems : [],
    (item) => { setSearchQuery(item); setShowSearchDropdown(false); },
    () => setShowSearchDropdown(false),
    browseSearchRef
  );

  // Fetch pharmacies from API
  const fetchPharmacies = useCallback(async (query: string, location: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());

      const res = await fetch(`${API_URL}/pharmacies/search?${params.toString()}`);
      const result = await res.json();

      if (result.success && result.data?.pharmacies) {
        let filtered = result.data.pharmacies as Pharmacy[];

        // Client-side location filter (API searches name/address, this adds user-typed location)
        if (location.trim()) {
          filtered = filtered.filter((p) =>
            p.address.toLowerCase().includes(location.toLowerCase())
          );
        }

        setPharmacies(filtered);
      } else {
        setPharmacies([]);
      }
    } catch {
      setError('Unable to load pharmacies. Please try again.');
      setPharmacies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load and URL param handling
  useEffect(() => {
    const q = searchParams?.get('q') || '';
    if (q) setSearchQuery(q);
    fetchPharmacies(q, '');
  }, [searchParams, fetchPharmacies]);

  const handleSearch = () => {
    fetchPharmacies(searchQuery, locationFilter);
  };

  const handleReset = () => {
    setLocationFilter('');
    setSearchQuery('');
    fetchPharmacies('', '');
  };

  // Derive a display emoji from pharmacy name (deterministic based on first char)
  const getPharmacyEmoji = (name: string): string => {
    const emojis = ['💊', '⚕️', '🏥', '🚀', '❤️', '💚', '🩺', '🧪'];
    const charCode = name.charCodeAt(0) || 0;
    return emojis[charCode % emojis.length];
  };

  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-16 md:py-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary-100/40 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
        <div className="container-custom relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">
              Browse <span className="heading-gradient">Pharmacies</span>
            </h1>
            <p className="text-gray-500 max-w-xl mx-auto">
              Discover trusted pharmacies near you. Use AI-powered search to find exactly what you need.
            </p>

            {/* AI Search Bar */}
            <div className="relative max-w-xl mx-auto mt-6">
              <div className="flex gap-2 items-center bg-white rounded-xl shadow-soft border border-gray-100 p-1.5">
                <div className="flex-1 relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    ref={browseSearchRef}
                    type="text"
                    placeholder="Try: 'headache medicine' or 'vitamin supplements'..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setShowSearchDropdown(true); resetBrowseIdx(); }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setShowSearchDropdown(false);
                        handleSearch();
                        return;
                      }
                      if (showSearchDropdown && browseDropdownItems.length > 0) {
                        handleBrowseKeyDown(e);
                      }
                    }}
                    onFocus={() => searchQuery && setShowSearchDropdown(true)}
                    onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                    className="w-full pl-10 pr-4 py-2.5 bg-transparent text-sm focus:outline-none placeholder:text-gray-400"
                    role="combobox"
                    aria-expanded={showSearchDropdown && browseDropdownItems.length > 0}
                    aria-haspopup="listbox"
                    aria-label="Search medications, symptoms, or pharmacies"
                    autoComplete="off"
                  />
                </div>
                {searchLoading && (
                  <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-primary-600 rounded-full mr-1" />
                )}
                <Button size="sm" variant="primary" onClick={handleSearch}>
                  Search
                </Button>
              </div>

              {/* AI Search Dropdown */}
              {showSearchDropdown && searchQuery && (drugNames.length > 0 || symptoms.length > 0 || aiCategories.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-soft-lg z-20 p-2 animate-fade-in-down">
                  {drugNames.length > 0 && (
                    <div className="mb-1">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-1">Medications</p>
                      {drugNames.slice(0, 3).map((drug, idx) => (
                        <button key={idx} className="w-full text-left px-3 py-2 hover:bg-primary-50 rounded-lg transition-colors text-sm text-gray-800 flex items-center gap-2"
                          onMouseDown={() => { setSearchQuery(drug); setShowSearchDropdown(false); }}>
                          <span className="text-primary-500">💊</span> {drug}
                        </button>
                      ))}
                    </div>
                  )}
                  {symptoms.length > 0 && (
                    <div className="mb-1">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-1">Symptoms</p>
                      {symptoms.slice(0, 3).map((s, idx) => (
                        <button key={idx} className="w-full text-left px-3 py-2 hover:bg-blue-50 rounded-lg transition-colors text-sm text-gray-800 flex items-center gap-2"
                          onMouseDown={() => { setSearchQuery(s); setShowSearchDropdown(false); }}>
                          <span className="text-secondary-500">🔍</span> {s}
                        </button>
                      ))}
                    </div>
                  )}
                  {aiCategories.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-1">Categories</p>
                      <div className="flex flex-wrap gap-1.5 px-3 py-1">
                        {aiCategories.slice(0, 5).map((cat, idx) => (
                          <button key={idx} className="px-2.5 py-1 bg-green-50 hover:bg-green-100 text-green-700 text-xs rounded-full transition-colors"
                            onMouseDown={() => { setSearchQuery(cat); setShowSearchDropdown(false); }}>
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="py-4 bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="container-custom">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              placeholder="Filter by location..."
              className="input-modern w-full sm:max-w-[200px] !py-2"
              aria-label="Filter by location"
            />
            <Button size="sm" variant="primary" onClick={handleSearch}>Filter</Button>
            <Button size="sm" variant="ghost" onClick={handleReset}>Reset</Button>
            <span className="text-xs text-gray-400 ml-auto">
              {loading ? 'Loading...' : `${pharmacies.length} pharmacies`}
            </span>
          </div>
        </div>
      </section>

      {/* Pharmacy Grid */}
      <section className="py-12 md:py-16 bg-gray-50/50">
        <div className="container-custom">
          {/* Loading State */}
          {loading && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
                  <div className="h-32 bg-gray-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                    <div className="h-4 bg-gray-100 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="text-center py-16 space-y-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl">⚠️</span>
              </div>
              <p className="text-gray-600">{error}</p>
              <Button variant="primary" size="sm" onClick={() => fetchPharmacies(searchQuery, locationFilter)}>
                Retry
              </Button>
            </div>
          )}

          {/* Results */}
          {!loading && !error && pharmacies.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pharmacies.map((pharmacy) => (
                <div key={pharmacy.id} className="card-hover overflow-hidden group">
                  <div className="h-32 bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center group-hover:from-primary-100 group-hover:to-secondary-100 transition-all duration-300">
                    <span className="text-5xl group-hover:scale-110 transition-transform duration-300">
                      {getPharmacyEmoji(pharmacy.name)}
                    </span>
                  </div>
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="font-bold text-gray-900">{pharmacy.name}</h3>
                      <div className="flex items-center gap-2 mt-1.5 text-sm">
                        <span className="text-yellow-500">★</span>
                        <span className="font-semibold text-gray-900">
                          {pharmacy.rating?.toFixed(1) || '0.0'}
                        </span>
                        <span className="text-gray-400">
                          ({pharmacy.totalReviews || 0})
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {pharmacy.address}
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      {pharmacy.approvalStatus === 'approved' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Verified
                        </span>
                      )}
                      <Link href={`/pharmacy/${pharmacy.id}`}>
                        <Button variant="primary" size="xs">View Details</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && pharmacies.length === 0 && (
            <div className="text-center py-16 space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl">🔍</span>
              </div>
              <p className="text-gray-600">No pharmacies found matching your search.</p>
              <Button variant="outline" size="sm" onClick={handleReset}>Clear Filters</Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container-custom text-center space-y-5">
          <h2 className="text-2xl md:text-3xl font-bold">Ready to Order?</h2>
          <p className="text-sm opacity-90 max-w-lg mx-auto">
            Create an account to start browsing medications and place your order.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
            <Link href="/register?role=customer">
              <Button size="sm" variant="ghost" className="bg-white !text-primary-600 hover:bg-gray-100 w-full sm:w-auto">
                Create Account
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm" variant="outline" className="border-white text-white hover:bg-primary-500 w-full sm:w-auto">
                Log In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
