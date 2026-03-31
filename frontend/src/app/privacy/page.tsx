import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function PrivacyPage() {
  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 py-16 md:py-24">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              Privacy <span className="text-gradient">Policy</span>
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
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
                <p className="text-gray-600 leading-relaxed">
                  PharmaConnect collects information you provide directly, such as your name, email address, phone number, delivery address, and payment information. We also collect usage data, device information, and location data (with your permission) to improve our services and provide location-based pharmacy recommendations.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
                <p className="text-gray-600 leading-relaxed">
                  We use your personal information to process orders, facilitate deliveries, communicate with you about your account and orders, improve our platform, ensure platform safety, and comply with legal obligations. We may also use your information to send you marketing communications, which you can opt out of at any time.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Information Sharing</h2>
                <p className="text-gray-600 leading-relaxed">
                  We share your information with pharmacy partners to fulfill orders, delivery providers to complete deliveries, and payment processors (Paystack) to process transactions. We do not sell your personal information to third parties. We may disclose information when required by law or to protect our rights and safety.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Security</h2>
                <p className="text-gray-600 leading-relaxed">
                  We implement industry-standard security measures to protect your personal information, including encryption, secure data storage, and access controls. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Your Rights</h2>
                <p className="text-gray-600 leading-relaxed">
                  You have the right to access, update, or delete your personal information at any time through your account settings. You may also request a copy of your data or ask us to restrict processing. To exercise these rights, contact us at the email address provided below.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookies and Tracking</h2>
                <p className="text-gray-600 leading-relaxed">
                  PharmaConnect uses cookies and similar technologies to enhance your experience, analyze usage patterns, and deliver personalized content. You can manage cookie preferences through your browser settings. Disabling cookies may affect some platform functionality.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Retention</h2>
                <p className="text-gray-600 leading-relaxed">
                  We retain your personal information for as long as your account is active or as needed to provide services. We may retain certain information for legal compliance, dispute resolution, or enforcement of our agreements. You may request deletion of your account and associated data at any time.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Children&apos;s Privacy</h2>
                <p className="text-gray-600 leading-relaxed">
                  PharmaConnect is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that a child has provided us with personal information, we will take steps to delete such information.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Changes to This Policy</h2>
                <p className="text-gray-600 leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the &quot;Last updated&quot; date. Your continued use of the platform after changes constitutes acceptance of the updated policy.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact Us</h2>
                <p className="text-gray-600 leading-relaxed">
                  If you have questions about this Privacy Policy, please contact us at{' '}
                  <a href="mailto:privacy@pharmaconnect.com" className="text-primary-600 hover:text-primary-700">
                    privacy@pharmaconnect.com
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
