'use client';

import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Button from '@/components/ui/Button';

export default function AboutPage() {
  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 py-20 md:py-32">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900">
              About <span className="text-gradient">PharmaConnect</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Transforming how Nigerians access medications through a trusted, transparent, and efficient online pharmacy marketplace.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 md:py-32 bg-white">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Our Mission
              </h2>
              <p className="text-lg text-gray-600">
                To connect customers with trusted, licensed pharmacies and enable fast, reliable delivery of quality medications while ensuring safety and affordability.
              </p>
            </div>

            {/* Mission Details */}
            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🤝</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Connecting</h3>
                <p className="text-gray-600">
                  Bringing customers and trusted pharmacies together through a seamless digital platform.
                </p>
              </div>

              <div className="space-y-3">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Enabling</h3>
                <p className="text-gray-600">
                  Making quality medication access fast, reliable, and available to everyone.
                </p>
              </div>

              <div className="space-y-3">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">✓</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Ensuring</h3>
                <p className="text-gray-600">
                  Maintaining the highest standards of safety, quality, and affordability.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 md:py-32 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-16">
            How PharmaConnect Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Step 1 */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto text-white font-bold text-xl">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900">Search</h3>
              <p className="text-gray-600">
                Browse medications or locate nearby pharmacies using filters like location and category.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto text-white font-bold text-xl">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900">Order</h3>
              <p className="text-gray-600">
                Add medications to your cart, verify quantities, and complete secure payment via Paystack.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto text-white font-bold text-xl">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900">Deliver</h3>
              <p className="text-gray-600">
                Track your order in real-time and receive your medications at your doorstep.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 md:py-32 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-16">
            Our Values
          </h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Trust */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <span className="text-2xl">🔒</span> Trust
              </h3>
              <p className="text-gray-600">
                All pharmacies and delivery partners are verified and licensed. Your data is secure.
              </p>
            </div>

            {/* Speed */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <span className="text-2xl">⚡</span> Speed
              </h3>
              <p className="text-gray-600">
                Same-day delivery available in select areas. Track orders in real-time.
              </p>
            </div>

            {/* Safety */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <span className="text-2xl">❤️</span> Safety
              </h3>
              <p className="text-gray-600">
                OTC medications only. We protect customers from counterfeit or prescription drugs.
              </p>
            </div>

            {/* Accessibility */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <span className="text-2xl">🌍</span> Accessibility
              </h3>
              <p className="text-gray-600">
                Affordable prices, competitive options, and available to everyone in Nigeria.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary-600 text-white">
        <div className="container-custom text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            Join the PharmaConnect Community
          </h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            Whether you're a customer looking for reliable medication delivery or a pharmacy wanting to expand your reach, we're here to help.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            <Link href="/register?role=customer">
              <Button size="lg" variant="primary" className="bg-white text-primary-600 hover:bg-gray-100 w-full sm:w-auto">
                Get Started as Customer
              </Button>
            </Link>
            <Link href="/register?role=pharmacy">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-primary-700 w-full sm:w-auto">
                Register Your Pharmacy
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
