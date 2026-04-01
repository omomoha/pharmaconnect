'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-white/90 backdrop-blur-lg border-b border-gray-200/60 shadow-sm'
        : 'bg-white border-b border-gray-100'
    }`}>
      <div className="container-custom">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-bold text-gray-900 hidden sm:inline tracking-tight">
              PharmaConnect
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { label: 'Browse', href: '/browse' },
              { label: 'About', href: '/about' },
              { label: 'Contact', href: '/contact' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-2">
            {user ? (
              <Link href="/dashboard">
                <Button size="sm" variant="primary">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden sm:block">
                  <Button size="sm" variant="ghost">Login</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" variant="primary">Sign Up</Button>
                </Link>
              </>
            )}

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-1 animate-fade-in-down">
            {[
              { label: 'Browse Pharmacies', href: '/browse' },
              { label: 'About', href: '/about' },
              { label: 'Contact', href: '/contact' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {!user && (
              <Link href="/login" className="block px-3 py-2" onClick={() => setIsOpen(false)}>
                <Button variant="outline" size="sm" className="w-full">Login</Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
