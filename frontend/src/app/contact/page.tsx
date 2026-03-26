'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Button from '@/components/ui/Button';
import Footer from '@/components/layout/Footer';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Placeholder for form submission logic
    console.log('Form submitted:', formData);
    // Reset form
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 py-20 md:py-32">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900">
              Get in <span className="text-gradient">Touch</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Have a question or feedback? We'd love to hear from you. Contact our support team anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 md:py-32 bg-white">
        <div className="container-custom">
          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            {/* Contact Form */}
            <div className="md:col-span-2">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
                Send us a Message
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Field */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-primary-500 focus:outline-none transition-colors"
                    required
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-primary-500 focus:outline-none transition-colors"
                    required
                  />
                </div>

                {/* Subject Field */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="How can we help?"
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-primary-500 focus:outline-none transition-colors"
                    required
                  />
                </div>

                {/* Message Field */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us more about your inquiry..."
                    rows={6}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-primary-500 focus:outline-none transition-colors resize-none"
                    required
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  variant="primary"
                  className="w-full"
                >
                  Send Message
                </Button>
              </form>
            </div>

            {/* Contact Information Sidebar */}
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-6">
                  Contact Information
                </h3>

                {/* Email */}
                <div className="space-y-3 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">📧</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Email</h4>
                      <a
                        href="mailto:support@pharmaconnect.com"
                        className="text-primary-600 hover:text-primary-700 break-all"
                      >
                        support@pharmaconnect.com
                      </a>
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-3">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">📱</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Phone</h4>
                      <a
                        href="tel:+234800000000"
                        className="text-primary-600 hover:text-primary-700"
                      >
                        +234 800 000 0000
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Response Time */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h4 className="font-bold text-gray-900 mb-2">
                  Average Response Time
                </h4>
                <p className="text-gray-600 text-sm">
                  We typically respond to inquiries within 24 hours during business days.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 md:py-32 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-16">
            Frequently Asked Questions
          </h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div className="space-y-3">
              <h3 className="font-bold text-gray-900">
                How do I place an order?
              </h3>
              <p className="text-gray-600 text-sm">
                Create an account, browse pharmacies, select your medications, and proceed to checkout with secure Paystack payment.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-gray-900">
                What are delivery times?
              </h3>
              <p className="text-gray-600 text-sm">
                Same-day delivery is available in select areas. Delivery times vary based on your location and the pharmacy.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-gray-900">
                Is my payment secure?
              </h3>
              <p className="text-gray-600 text-sm">
                Yes, we use Paystack for secure payment processing. Your financial information is protected.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-gray-900">
                How do I track my order?
              </h3>
              <p className="text-gray-600 text-sm">
                After placing your order, you can track it in real-time through your account dashboard.
              </p>
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
            Join PharmaConnect today and experience convenient, fast access to quality medications.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            <Link href="/register?role=customer">
              <Button size="lg" variant="primary" className="bg-white text-primary-600 hover:bg-gray-100 w-full sm:w-auto">
                Sign Up Now
              </Button>
            </Link>
            <Link href="/browse">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-primary-700 w-full sm:w-auto">
                Browse Pharmacies
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
