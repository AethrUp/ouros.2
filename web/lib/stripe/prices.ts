// Stripe Price Configuration
// Maps subscription tiers and billing intervals to Stripe Price IDs

export type StripeTier = 'premium' | 'pro';
export type StripeBillingInterval = 'monthly' | 'yearly';

/**
 * Stripe Price IDs from environment variables
 * These should be set in .env.local after creating products in Stripe Dashboard
 */
export const STRIPE_PRICES = {
  premium: {
    monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY || '',
    yearly: process.env.STRIPE_PRICE_PREMIUM_YEARLY || '',
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || '',
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY || '',
  },
} as const;

/**
 * Get the Stripe Price ID for a given tier and billing interval
 * @param tier - Subscription tier (premium or pro)
 * @param interval - Billing interval (monthly or yearly)
 * @returns Stripe Price ID
 * @throws Error if price ID is not configured
 */
export function getPriceId(tier: StripeTier, interval: StripeBillingInterval): string {
  const priceId = STRIPE_PRICES[tier][interval];

  if (!priceId) {
    throw new Error(
      `No Stripe Price ID configured for ${tier} ${interval}. ` +
      `Please set STRIPE_PRICE_${tier.toUpperCase()}_${interval.toUpperCase()} ` +
      `in your environment variables.`
    );
  }

  return priceId;
}

/**
 * Pricing display information
 * Update these values to match your actual pricing strategy
 */
export const PRICING_INFO = {
  premium: {
    monthly: {
      amount: 999, // $9.99 in cents
      currency: 'usd',
      display: '$9.99/month',
    },
    yearly: {
      amount: 9900, // $99/year in cents
      currency: 'usd',
      display: '$99/year',
      savings: '2 months free',
    },
  },
  pro: {
    monthly: {
      amount: 1999, // $19.99 in cents
      currency: 'usd',
      display: '$19.99/month',
    },
    yearly: {
      amount: 19900, // $199/year in cents
      currency: 'usd',
      display: '$199/year',
      savings: '2 months free',
    },
  },
} as const;

/**
 * Get pricing info for a given tier and interval
 */
export function getPricingInfo(tier: StripeTier, interval: StripeBillingInterval) {
  return PRICING_INFO[tier][interval];
}
