import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function TermsPage() {
  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 py-16 md:py-24">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              Terms of <span className="text-gradient">Service</span>
            </h1>
            <p className="text-lg text-gray-600">
              Last updated: March 31, 2026
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto prose prose-gray">
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                <p className="text-gray-600 leading-relaxed">
                  By accessing or using the PharmaConnect platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services. PharmaConnect reserves the right to modify these terms at any time, and your continued use of the platform constitutes acceptance of any changes.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
                <p className="text-gray-600 leading-relaxed">
                  PharmaConnect is an online pharmacy marketplace that connects customers with licensed pharmacies and delivery providers in Nigeria. Our platform facilitates the ordering and delivery of over-the-counter (OTC) medications only. We do not sell, distribute, or facilitate the sale of prescription medications.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
                <p className="text-gray-600 leading-relaxed">
                  To use certain features of PharmaConnect, you must create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate, current, and complete information during registration and to update such information as needed.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Pharmacy Partners</h2>
                <p className="text-gray-600 leading-relaxed">
                  All pharmacies listed on PharmaConnect are required to maintain valid licenses and comply with all applicable Nigerian pharmaceutical regulations. PharmaConnect verifies pharmacy credentials during the registration process but does not assume liability for any pharmacy&apos;s operations or product quality.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Orders and Payments</h2>
                <p className="text-gray-600 leading-relaxed">
                  All payments are processed securely through Paystack. By placing an order, you agree to pay the listed price plus any applicable delivery fees. Refund policies are subject to each pharmacy&apos;s individual return policy and applicable consumer protection laws.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Delivery Services</h2>
                <p className="text-gray-600 leading-relaxed">
                  Delivery services are provided by third-party delivery partners registered on our platform. Delivery times are estimates and may vary based on location, availability, and other factors. PharmaConnect is not responsible for delays caused by circumstances beyond our control.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Prohibited Activities</h2>
                <p className="text-gray-600 leading-relaxed">
                  Users are prohibited from using the platform for any unlawful purpose, attempting to purchase prescription medications, providing false information, interfering with the platform&apos;s operation, or engaging in any activity that violates these terms or applicable laws.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Limitation of Liability</h2>
                <p className="text-gray-600 leading-relaxed">
                  PharmaConnect provides the platform &quot;as is&quot; and makes no warranties regarding the availability, accuracy, or reliability of the service. To the maximum extent permitted by law, PharmaConnect shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contact Information</h2>
                <p className="text-gray-600 leading-relaxed">
                  If you have questions about these Terms of Service, please contact us at{' '}
                  <a href="mailto:legal@pharmaconnect.com" className="text-primary-600 hover:text-primary-700">
                    legal@pharmaconnect.com
                  </a>
                  .
                </p>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-200 text-center">
              <Link href="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                Back to Registration
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
