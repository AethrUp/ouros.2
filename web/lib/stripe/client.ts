// Client-side Stripe.js loader
// Use this in React components to load Stripe.js

import { loadStripe, Stripe } from '@stripe/stripe-js';

// Cache the Stripe promise to avoid loading it multiple times
let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Get the Stripe.js instance
 * This will load Stripe.js from the CDN if not already loaded
 */
export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    if (!publishableKey) {
      console.error(
        'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set in environment variables. ' +
        'Please add it to your .env.local file.'
      );
      return Promise.resolve(null);
    }

    stripePromise = loadStripe(publishableKey);
  }

  return stripePromise;
};
