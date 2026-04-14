'use client';

import { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Button from '@/components/ui/Button';
import Footer from '@/components/layout/Footer';
import { useSmartSearch } from '@/hooks/useSmartSearch';
import { useDropdownKeyboard } from '@/hooks/useDropdownKeyboard';

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { symptoms, drugNames, categories, loading: searchLoading } = useSmartSearch(searchQuery);

  const allDropdownItems = useMemo(
    () => [...drugNames.slice(0, 3), ...symptoms.slice(0, 3), ...categories.slice(0, 3)],
    [drugNames, symptoms, categories]
  );

  const { activeIndex, handleKeyDown: handleDropdownKeyDown, resetIndex } = useDropdownKeyboard(
    showDropdown ? allDropdownItems : [],
    (item) => { setSearchQuery(item); setShowDropdown(false); },
    () => setShowDropdown(false),
    searchInputRef
  );

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/browse?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const stats = [
    { value: '500+', label: 'Verified Pharmacies' },
    { value: '50K+', label: 'Happy Customers' },
    { value: '100K+', label: 'Orders Delivered' },
    { value: '24/7', label: 'Customer Support' },
  ];

  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-20 md:py-32">
        {/* Decorative blobs */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-primary-200/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary-200/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

        <div className="container-custom relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-50 border border-primary-200 rounded-full text-sm text-primary-700 font-medium mb-2">
              <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
              AI-Powered Pharmacy Marketplace
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
              Find Your Pharmacy,{' '}
              <span className="heading-gradient">Order Instantly</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Fast, reliable access to OTC medications from trusted pharmacies near you.
              AI-powered search and same-day delivery available.
            </p>

            {/* AI-Powered Search Bar */}
            <div className="relative max-w-xl mx-auto mt-8">
              <div className="flex gap-2 items-center bg-white rounded-xl shadow-soft border border-gray-100 p-1.5">
                <div className="flex-1 relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search medications, symptoms, or pharmacies..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); resetIndex(); }}
                    onKeyDown={(e) => {
                      if (showDropdown && allDropdownItems.length > 0) {
                        handleDropdownKeyDown(e);
                      }
                      if (e.key === 'Enter' && activeIndex < 0) handleSearch();
                    }}
                    onFocus={() => searchQuery && setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    className="w-full pl-10 pr-4 py-2.5 bg-transparent text-sm focus:outline-none placeholder:text-gray-400"
                    role="combobox"
                    aria-expanded={showDropdown && allDropdownItems.length > 0}
                    aria-haspopup="listbox"
                    aria-controls="search-dropdown"
                    aria-activedescendant={activeIndex >= 0 ? `search-item-${activeIndex}` : undefined}
                    aria-label="Search medications, symptoms, or pharmacies"
                    autoComplete="off"
                  />
                </div>
                <Button size="sm" variant="primary" onClick={handleSearch}>
                  Search
                </Button>
              </div>

              {/* Smart Search Dropdown */}
              {showDropdown && searchQuery && (drugNames.length > 0 || symptoms.length > 0 || categories.length > 0 || searchLoading) && (
                <div id="search-dropdown" role="listbox" aria-label="Search suggestions" className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-soft-lg z-20 p-2 animate-fade-in-down">
                  {searchLoading && (
                    <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400">
                      <div className="animate-spin w-3 h-3 border-2 border-gray-300 border-t-primary-600 rounded-full" />
                      AI is searching...
                    </div>
                  )}
                  {drugNames.length > 0 && (
                    <div className="mb-1">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-1">Medications</p>
                      {drugNames.slice(0, 3).map((drug, idx) => {
                        const globalIdx = idx;
                        return (
                          <button
                            key={idx}
                            id={`search-item-${globalIdx}`}
                            role="option"
                            aria-selected={activeIndex === globalIdx}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm text-gray-800 flex items-center gap-2 ${activeIndex === globalIdx ? 'bg-primary-50' : 'hover:bg-primary-50'}`}
                            onMouseDown={() => { setSearchQuery(drug); setShowDropdown(false); }}
                          >
                            <span className="text-primary-500" aria-hidden="true">💊</span> {drug}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {symptoms.length > 0 && (
                    <div className="mb-1">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-1">Symptoms</p>
                      {symptoms.slice(0, 3).map((symptom, idx) => {
                        const globalIdx = drugNames.slice(0, 3).length + idx;
                        return (
                          <button
                            key={idx}
                            id={`search-item-${globalIdx}`}
                            role="option"
                            aria-selected={activeIndex === globalIdx}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm text-gray-800 flex items-center gap-2 ${activeIndex === globalIdx ? 'bg-blue-50' : 'hover:bg-blue-50'}`}
                            onMouseDown={() => { setSearchQuery(symptom); setShowDropdown(false); }}
                          >
                            <span className="text-secondary-500" aria-hidden="true">🔍</span> {symptom}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {categories.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-1">Categories</p>
                      {categories.slice(0, 3).map((cat, idx) => {
                        const globalIdx = drugNames.slice(0, 3).length + symptoms.slice(0, 3).length + idx;
                        return (
                          <button
                            key={idx}
                            id={`search-item-${globalIdx}`}
                            role="option"
                            aria-selected={activeIndex === globalIdx}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm text-gray-800 flex items-center gap-2 ${activeIndex === globalIdx ? 'bg-green-50' : 'hover:bg-green-50'}`}
                            onMouseDown={() => { setSearchQuery(cat); setShowDropdown(false); }}
                          >
                            <span className="text-green-500" aria-hidden="true">📂</span> {cat}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-3 mt-10">
              <Link href="/register?role=customer">
                <Button size="md" variant="primary">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/register?role=pharmacy">
                <Button size="md" variant="outline">
                  Register Your Pharmacy
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-y border-gray-100 py-8">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-primary-600">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 md:py-28 bg-white">
        <div className="container-custom">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-3">Simple Process</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              How It Works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { icon: '🔍', step: '01', title: 'Search Pharmacies', desc: 'Browse nearby pharmacies and check their available medications and prices.' },
              { icon: '🛒', step: '02', title: 'Place Your Order', desc: 'Add medications to your cart and pay securely with Paystack.' },
              { icon: '🚚', step: '03', title: 'Fast Delivery', desc: 'Get medications delivered to your doorstep with real-time tracking.' },
            ].map((item, idx) => (
              <div key={idx} className="relative text-center group">
                <div className="w-16 h-16 bg-primary-50 group-hover:bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-all duration-300 group-hover:scale-110 group-hover:shadow-glow-green">
                  <span className="text-2xl">{item.icon}</span>
                </div>
                <span className="text-xs font-bold text-primary-400 uppercase tracking-widest">Step {item.step}</span>
                <h3 className="text-lg font-bold text-gray-900 mt-2 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section className="py-20 md:py-28 section-gradient">
        <div className="container-custom">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-secondary-600 uppercase tracking-wider mb-3">Smart Features</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Powered by AI
            </h2>
            <p className="text-gray-500 mt-4 max-w-xl mx-auto">
              Our AI assistant helps you find the right medications, check for interactions, and get personalized recommendations.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                icon: '🤖',
                title: 'Smart Search',
                desc: 'Describe your symptoms in plain language and our AI finds the right OTC medications.',
                color: 'primary',
              },
              {
                icon: '⚠️',
                title: 'Drug Interaction Checker',
                desc: 'Check for potential interactions between your medications before you buy.',
                color: 'amber',
              },
              {
                icon: '💡',
                title: 'Personalized Recommendations',
                desc: 'Get AI-powered product suggestions based on your purchase history and needs.',
                color: 'secondary',
              },
            ].map((feature, idx) => (
              <div key={idx} className="card-hover p-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  feature.color === 'primary' ? 'bg-primary-50' :
                  feature.color === 'amber' ? 'bg-amber-50' : 'bg-secondary-50'
                }`}>
                  <span className="text-xl">{feature.icon}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 md:py-28 bg-white">
        <div className="container-custom">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-3">Our Promise</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Why Choose PharmaConnect
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {[
              { icon: '✓', title: 'Verified Pharmacies', desc: 'All pharmacies are licensed and verified for your safety.' },
              { icon: '🔒', title: 'Secure Payments', desc: 'Your transactions are protected with bank-grade security via Paystack.' },
              { icon: '💊', title: 'OTC Only', desc: 'We only provide over-the-counter medications, ensuring safe access.' },
              { icon: '💬', title: 'Live Chat Support', desc: 'Chat directly with pharmacies and delivery partners anytime.' },
            ].map((item, idx) => (
              <div key={idx} className="flex gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                    <span className="text-base">{item.icon}</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-primary-600 to-primary-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMGg2MHY2MEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjEuNSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA3KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNnKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-50" />
        <div className="container-custom text-center space-y-6 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold">
            Ready to Get Started?
          </h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            Join thousands of customers who trust PharmaConnect for their medication needs.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 mt-8">
            <Link href="/register?role=customer">
              <Button size="md" variant="ghost" className="bg-white !text-primary-600 hover:bg-gray-100 shadow-sm w-full sm:w-auto">
                Sign Up as Customer
              </Button>
            </Link>
            <Link href="/register?role=pharmacy">
              <Button size="md" variant="outline" className="border-white text-white hover:bg-primary-500 w-full sm:w-auto">
                Register Your Pharmacy
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
