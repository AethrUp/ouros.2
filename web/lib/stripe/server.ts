// Server-side Stripe client initialization
// Only use this on the server-side (API routes, server components)

import Stripe from 'stripe';

// Lazy-load Stripe client to avoid build-time errors when env vars are not set
let stripeInstance: Stripe | null = null;

export const getStripe = (): Stripe => {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error(
        'STRIPE_SECRET_KEY is not set in environment variables. ' +
        'Please add it to your .env.local file.'
      );
    }

    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover',
      typescript: true,
      appInfo: {
        name: 'Ouros2',
        version: '1.0.0',
      },
    });
  }

  return stripeInstance;
};

// For backwards compatibility
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripe()[prop as keyof Stripe];
  },
});

// Get webhook secret
export const getWebhookSecret = (): string => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error(
      'STRIPE_WEBHOOK_SECRET is not set in environment variables. ' +
      'Please add it to your .env.local file.'
    );
  }
  return secret;
};
