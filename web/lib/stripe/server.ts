// Server-side Stripe client initialization
// Only use this on the server-side (API routes, server components)

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error(
    'STRIPE_SECRET_KEY is not set in environment variables. ' +
    'Please add it to your .env.local file.'
  );
}

// Initialize Stripe with secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
  appInfo: {
    name: 'Ouros2',
    version: '1.0.0',
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
