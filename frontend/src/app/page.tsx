import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Button from '@/components/ui/Button';
import Footer from '@/components/layout/Footer';

export default function HomePage() {
  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 py-20 md:py-32">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900">
              Find Your Pharmacy, <span className="text-gradient">Order Instantly</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Fast, reliable access to medications from trusted pharmacies near you.
              Same-day delivery available in select areas.
            </p>

            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mt-8">
              <input
                type="text"
                placeholder="Search for medications or pharmacies..."
                className="flex-1 px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-primary-500 focus:outline-none"
              />
              <Button size="lg" variant="primary">
                Search
              </Button>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-12">
              <Link href="/register?role=customer">
                <Button size="lg" variant="primary">
                  Get Started as Customer
                </Button>
              </Link>
              <Link href="/register?role=pharmacy">
                <Button size="lg" variant="outline">
                  Join as Pharmacy
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 md:py-32 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-16">
            How It Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-3xl">🔍</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Search Pharmacies</h3>
              <p className="text-gray-600">
                Browse nearby pharmacies and check their available medications and prices.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-3xl">🛒</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Place Your Order</h3>
              <p className="text-gray-600">
                Add medications to your cart and place an order with secure payment.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-3xl">🚚</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Fast Delivery</h3>
              <p className="text-gray-600">
                Get your medications delivered to your doorstep with real-time tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-16">
            Why Choose PharmaConnect
          </h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">✓</span>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Verified Pharmacies</h3>
                <p className="text-gray-600">
                  All pharmacies are licensed and verified for your safety.
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
                <h3 className="font-bold text-gray-900 mb-2">Secure Payments</h3>
                <p className="text-gray-600">
                  Your transactions are secure with Paystack.
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
                <h3 className="font-bold text-gray-900 mb-2">OTC Only</h3>
                <p className="text-gray-600">
                  We only provide over-the-counter medications for your safety.
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
                <h3 className="font-bold text-gray-900 mb-2">24/7 Support</h3>
                <p className="text-gray-600">
                  Chat with pharmacies and delivery partners anytime.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary-600 text-white">
        <div className="container-custom text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            Ready to Get Started?
          </h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            Join thousands of customers who trust PharmaConnect for their medication needs.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            <Link href="/register?role=customer">
              <Button size="lg" variant="primary" className="bg-white text-primary-600 hover:bg-gray-100 w-full sm:w-auto">
                Sign Up as Customer
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

      <Footer />
    </>
  );
}
