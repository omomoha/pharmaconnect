'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';

interface SubscriptionPlan {
  id: string;
  name: string;
  priceNGN: number;
  maxProducts: number;
  features: string[];
  commissionPercent: number;
  aiChatEnabled: boolean;
  prioritySupport: boolean;
  promotedListing: boolean;
  customStorefront: boolean;
}

interface Subscription {
  id: string;
  pharmacyId: string;
  tier: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

const FEATURE_LABELS: Record<string, string> = {
  basic_listing: 'Product Listings',
  order_management: 'Order Management',
  basic_analytics: 'Basic Analytics',
  advanced_analytics: 'Advanced Analytics',
  ai_chat_assistant: 'AI Chat Assistant',
  priority_support: 'Priority Support',
  promoted_listing: 'Promoted Listings',
  custom_storefront: 'Custom Storefront',
  dedicated_account_manager: 'Dedicated Account Manager',
  bulk_upload: 'Bulk Product Upload',
  api_access: 'API Access',
};

export default function SubscriptionPage() {
  useAuth(); // Ensures user is authenticated
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [changingTier, setChangingTier] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);

      // Fetch plans and current subscription in parallel
      const [plansRes, subRes] = await Promise.allSettled([
        apiClient.get('/subscriptions/plans'),
        apiClient.get('/subscriptions/current'),
      ]);

      if (plansRes.status === 'fulfilled' && plansRes.value?.data) {
        setPlans(plansRes.value.data);
      }

      if (subRes.status === 'fulfilled' && subRes.value?.data) {
        setCurrentSubscription(subRes.value.data.subscription);
        setCurrentPlan(subRes.value.data.plan);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  }

  async function handleChangeTier(tierId: string) {
    try {
      setChangingTier(tierId);
      setError(null);
      setSuccessMessage(null);

      // Downgrading to free tier — direct change, no payment needed
      if (tierId === 'pharma_lite') {
        const res = await apiClient.post('/subscriptions/change-tier', {
          tier: tierId,
        });
        if (res?.data) {
          setCurrentSubscription(res.data.subscription);
          setCurrentPlan(res.data.plan);
          setSuccessMessage(res.message || 'Plan changed successfully!');
        }
        return;
      }

      // Paid tier — redirect to Paystack checkout
      const res = await apiClient.post('/payments/subscription/initialize', {
        tier: tierId,
      });

      if (res?.data?.payment?.authorizationUrl) {
        // Redirect to Paystack hosted checkout page
        window.location.href = res.data.payment.authorizationUrl;
        return;
      }

      setError('Failed to start payment. Please try again.');
    } catch (err: any) {
      setError(err.message || 'Failed to change plan');
    } finally {
      setChangingTier(null);
    }
  }

  async function handleCancelSubscription() {
    if (!confirm('Are you sure you want to cancel? You will be downgraded to PharmaLite (free) at the end of your billing period.')) {
      return;
    }

    try {
      setError(null);
      const res = await apiClient.post('/subscriptions/cancel');
      if (res?.data) {
        setCurrentSubscription(res.data);
        setSuccessMessage('Subscription will cancel at the end of the billing period.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to cancel subscription');
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-gray-100 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
        <p className="text-gray-600 mt-1">
          Choose the plan that fits your pharmacy&apos;s needs
        </p>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
          {successMessage}
        </div>
      )}

      {/* Current Plan Badge */}
      {currentSubscription && currentPlan && (
        <div className="mb-8 p-4 bg-primary-50 border border-primary-200 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-sm text-primary-600 font-medium">Current Plan:</span>
            <span className="ml-2 text-lg font-bold text-primary-800">{currentPlan.name}</span>
            {currentSubscription.cancelAtPeriodEnd && (
              <span className="ml-3 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                Cancels at period end
              </span>
            )}
          </div>
          {currentSubscription.tier !== 'pharma_lite' && !currentSubscription.cancelAtPeriodEnd && (
            <button
              onClick={handleCancelSubscription}
              className="text-sm text-gray-500 hover:text-red-600 transition-colors"
            >
              Cancel Plan
            </button>
          )}
        </div>
      )}

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = currentSubscription?.tier === plan.id;
          const isPopular = plan.id === 'pharma_pro';

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 p-6 flex flex-col transition-all duration-200 ${
                isCurrent
                  ? 'border-primary-500 bg-primary-50/30 shadow-lg shadow-primary-100'
                  : isPopular
                  ? 'border-primary-300 shadow-md hover:shadow-lg'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}
            >
              {/* Popular Badge */}
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-sm">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Current Badge */}
              {isCurrent && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                    Current
                  </span>
                </div>
              )}

              {/* Plan Name & Price */}
              <div className="mb-6 pt-2">
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-3">
                  {plan.priceNGN === 0 ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-gray-900">Free</span>
                      <span className="text-gray-500 text-sm">forever</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg text-gray-500">&#8358;</span>
                      <span className="text-3xl font-extrabold text-gray-900">
                        {plan.priceNGN.toLocaleString()}
                      </span>
                      <span className="text-gray-500 text-sm">/month</span>
                    </div>
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  {plan.maxProducts === -1
                    ? 'Unlimited products'
                    : `Up to ${plan.maxProducts} products`}
                  {' · '}
                  {plan.commissionPercent}% commission
                </p>
              </div>

              {/* Features List */}
              <div className="flex-1 space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2.5">
                    <svg
                      className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-sm text-gray-700">
                      {FEATURE_LABELS[feature] || feature}
                    </span>
                  </div>
                ))}

                {/* Show what's NOT included */}
                {!plan.aiChatEnabled && (
                  <div className="flex items-start gap-2.5 opacity-40">
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-sm text-gray-500">AI Chat Assistant</span>
                  </div>
                )}
                {!plan.prioritySupport && (
                  <div className="flex items-start gap-2.5 opacity-40">
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-sm text-gray-500">Priority Support</span>
                  </div>
                )}
                {!plan.customStorefront && (
                  <div className="flex items-start gap-2.5 opacity-40">
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-sm text-gray-500">Custom Storefront</span>
                  </div>
                )}
              </div>

              {/* CTA Button */}
              <div>
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-gray-100 text-gray-400 cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleChangeTier(plan.id)}
                    disabled={changingTier !== null}
                    className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isPopular
                        ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm hover:shadow-md'
                        : plan.priceNGN === 0
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    } ${changingTier === plan.id ? 'opacity-70' : ''}`}
                  >
                    {changingTier === plan.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Processing...
                      </span>
                    ) : currentSubscription?.tier === 'pharma_elite' && plan.id !== 'pharma_elite' ? (
                      'Downgrade'
                    ) : currentSubscription?.tier === 'pharma_pro' && plan.id === 'pharma_lite' ? (
                      'Downgrade'
                    ) : plan.priceNGN === 0 ? (
                      'Get Started Free'
                    ) : (
                      'Upgrade Now'
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div className="mt-12 bg-gray-50 rounded-2xl p-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">Can I change plans anytime?</h3>
            <p className="text-sm text-gray-600 mt-1">
              Yes! You can upgrade or downgrade your plan at any time. Upgrades take effect immediately, while downgrades apply at the end of your current billing period.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">What happens if I exceed my product limit?</h3>
            <p className="text-sm text-gray-600 mt-1">
              You won&apos;t be able to add new products until you either upgrade your plan or remove existing products to stay within your limit.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">Is there a contract or commitment?</h3>
            <p className="text-sm text-gray-600 mt-1">
              No contracts! All plans are month-to-month. You can cancel anytime and you&apos;ll retain access until the end of your paid period.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
