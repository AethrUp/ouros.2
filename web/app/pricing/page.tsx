'use client';

import { useState } from 'react';
import { UpgradeButton } from '@/components/pricing/UpgradeButton';
import { PRICING_INFO, type StripeBillingInterval } from '@/lib/stripe/prices';

export default function PricingPage() {
  const [interval, setInterval] = useState<StripeBillingInterval>('monthly');

  const tiers = [
    {
      name: 'Free',
      tier: null,
      description: 'Perfect for getting started',
      price: {
        monthly: { display: '$0', amount: 0 },
        yearly: { display: '$0', amount: 0 },
      },
      features: [
        '1 tarot reading per day',
        '1 I Ching reading per day',
        'Basic natal chart',
        'Daily horoscope',
        '5 journal entries per month',
      ],
      cta: 'Current Plan',
      disabled: true,
    },
    {
      name: 'Premium',
      tier: 'premium' as const,
      description: 'For dedicated seekers',
      price: PRICING_INFO.premium,
      popular: true,
      features: [
        '✨ Unlimited tarot readings',
        '✨ Unlimited I Ching readings',
        '✨ Dream interpretation',
        '✨ Enhanced horoscope',
        '✨ Cosmic weather insights',
        '✨ Full natal chart',
        '✨ Unlimited journal entries',
        '✨ Synastry compatibility (3 charts)',
        '✨ Daily synastry forecast',
      ],
      cta: 'Upgrade to Premium',
    },
    {
      name: 'Pro',
      tier: 'pro' as const,
      description: 'For professional astrologers',
      price: PRICING_INFO.pro,
      features: [
        '⭐ Everything in Premium',
        '⭐ Unlimited synastry charts',
        '⭐ Transits & progressions',
        '⭐ Priority AI processing',
        '⭐ Export readings',
        '⭐ Advanced chart features',
      ],
      cta: 'Upgrade to Pro',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1625] via-[#2d1b3d] to-[#1a1625] py-16 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Choose Your Path
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Unlock deeper insights with a premium subscription
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-3 bg-white/5 p-1.5 rounded-lg border border-white/10">
            <button
              onClick={() => setInterval('monthly')}
              className={`px-6 py-2 rounded-md transition-all ${
                interval === 'monthly'
                  ? 'bg-white text-black'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval('yearly')}
              className={`px-6 py-2 rounded-md transition-all relative ${
                interval === 'yearly'
                  ? 'bg-white text-black'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 bg-[#F6D99F] text-black text-xs px-2 py-0.5 rounded-full font-semibold">
                SAVE
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier) => {
            const price = tier.price[interval];
            const savings = interval === 'yearly' ? tier.price.yearly.savings : null;

            return (
              <div
                key={tier.name}
                className={`relative bg-white/5 backdrop-blur-sm rounded-2xl p-8 border ${
                  tier.popular
                    ? 'border-[#F6D99F] shadow-lg shadow-[#F6D99F]/20'
                    : 'border-white/10'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#F6D99F] to-[#d4b87c] text-black px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wide">
                    Most Popular
                  </div>
                )}

                {/* Tier Name */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                  <p className="text-gray-400 text-sm">{tier.description}</p>
                </div>

                {/* Price */}
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-white mb-1">
                    {price.display.split('/')[0]}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {tier.tier ? `per ${interval === 'monthly' ? 'month' : 'year'}` : 'forever'}
                  </div>
                  {savings && (
                    <div className="text-[#F6D99F] text-sm font-semibold mt-1">
                      {savings}
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-[#F6D99F] mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                {tier.tier ? (
                  <UpgradeButton
                    tier={tier.tier}
                    interval={interval}
                    variant={tier.popular ? 'secondary' : 'ghost'}
                    size="large"
                    fullWidth
                  >
                    {tier.cta}
                  </UpgradeButton>
                ) : (
                  <button
                    disabled
                    className="w-full px-8 py-4 text-base h-14 rounded-lg bg-white/10 text-gray-400 cursor-not-allowed uppercase tracking-[0.12em]"
                  >
                    {tier.cta}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* FAQ/Additional Info */}
        <div className="mt-16 max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-300">
                Yes! You can cancel your subscription at any time. You'll continue to have access
                until the end of your billing period.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-300">
                We accept all major credit cards (Visa, Mastercard, American Express) through our
                secure payment processor, Stripe.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-2">
                Can I upgrade or downgrade my plan?
              </h3>
              <p className="text-gray-300">
                Yes! You can change your plan at any time through your account settings. Changes
                will be prorated based on your billing cycle.
              </p>
            </div>
          </div>
        </div>

        {/* Trust Signals */}
        <div className="mt-16 text-center">
          <div className="flex justify-center gap-8 items-center text-gray-400">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">Secure payments</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              <span className="text-sm">Email support</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
