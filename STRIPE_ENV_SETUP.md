# Stripe Environment Variables Setup

This document explains how to set up the required environment variables for Stripe integration in Ouros2.

## Overview

The Stripe integration requires several environment variables to be set in your `web/.env.local` file. These variables connect your application to your Stripe account and configure pricing.

## Required Environment Variables

Add the following variables to `web/.env.local`:

```bash
# =============================================================================
# STRIPE CONFIGURATION
# =============================================================================

# Stripe API Keys
# Get these from: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_...                           # Test: sk_test_... | Live: sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...         # Test: pk_test_... | Live: pk_live_...

# Stripe Webhook Secret
# Get this from: https://dashboard.stripe.com/webhooks
# After creating a webhook endpoint pointing to: https://yourdomain.com/api/webhooks/stripe
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs
# Create products and prices in Stripe Dashboard first, then copy the price IDs here
# Get these from: https://dashboard.stripe.com/products

# Premium Tier Prices
STRIPE_PRICE_PREMIUM_MONTHLY=price_...                  # e.g., price_1Abc123xyz
STRIPE_PRICE_PREMIUM_YEARLY=price_...                   # e.g., price_1Abc456xyz

# Pro Tier Prices
STRIPE_PRICE_PRO_MONTHLY=price_...                      # e.g., price_1Abc789xyz
STRIPE_PRICE_PRO_YEARLY=price_...                       # e.g., price_1Abc012xyz

# Base URL for Stripe redirects
NEXT_PUBLIC_BASE_URL=http://localhost:3000              # Development | Production: https://yourdomain.com
```

## Step-by-Step Setup Instructions

### 1. Create or Access Your Stripe Account

1. Go to [https://stripe.com](https://stripe.com)
2. Sign up for a new account or log in to existing account
3. Navigate to the Dashboard

### 2. Get API Keys

1. Go to **Developers** → **API Keys**: [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
2. You'll see two sets of keys:
   - **Test mode keys** (for development) - Use these first
   - **Live mode keys** (for production) - Use these only when ready to go live

3. Copy the keys:
   - **Secret key** (starts with `sk_test_` or `sk_live_`) → Use for `STRIPE_SECRET_KEY`
   - **Publishable key** (starts with `pk_test_` or `pk_live_`) → Use for `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

⚠️ **Important**: Never commit your secret key to version control or expose it in client-side code!

### 3. Create Products and Prices

1. Go to **Products**: [https://dashboard.stripe.com/products](https://dashboard.stripe.com/products)
2. Click **+ Add product**

#### Create Premium Product

1. **Name**: Ouros2 Premium
2. **Description**: Unlimited tarot & I Ching, dream interpretation, enhanced horoscope, limited synastry
3. Click **Add pricing**
   - **Price 1** (Monthly):
     - Pricing model: Standard pricing
     - Price: $9.99 USD
     - Billing period: Monthly
     - Click **Add price**
     - Copy the Price ID (starts with `price_...`) → Use for `STRIPE_PRICE_PREMIUM_MONTHLY`

   - **Price 2** (Yearly):
     - Click **Add another price**
     - Pricing model: Standard pricing
     - Price: $99.00 USD
     - Billing period: Yearly
     - Click **Add price**
     - Copy the Price ID → Use for `STRIPE_PRICE_PREMIUM_YEARLY`

#### Create Pro Product

1. **Name**: Ouros2 Pro
2. **Description**: Everything in Premium plus unlimited synastry, transits, progressions, priority AI, and export
3. Click **Add pricing**
   - **Price 1** (Monthly):
     - Pricing model: Standard pricing
     - Price: $19.99 USD
     - Billing period: Monthly
     - Click **Add price**
     - Copy the Price ID → Use for `STRIPE_PRICE_PRO_MONTHLY`

   - **Price 2** (Yearly):
     - Click **Add another price**
     - Pricing model: Standard pricing
     - Price: $199.00 USD
     - Billing period: Yearly
     - Click **Add price**
     - Copy the Price ID → Use for `STRIPE_PRICE_PRO_YEARLY`

### 4. Set Up Webhook Endpoint

Webhooks are how Stripe notifies your application about events (subscriptions created, payments succeeded, etc.).

#### For Development (using Stripe CLI)

1. Install Stripe CLI: [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
2. Run: `stripe login`
3. Forward webhooks to local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. Copy the webhook signing secret (starts with `whsec_...`) → Use for `STRIPE_WEBHOOK_SECRET`

#### For Production

1. Go to **Developers** → **Webhooks**: [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. Click **+ Add endpoint**
3. **Endpoint URL**: `https://yourdomain.com/api/webhooks/stripe`
4. **Events to send**: Select the following events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `invoice.upcoming`
   - `payment_method.attached`
   - `payment_method.detached`

   Or simply select **Send all event types** for simplicity
5. Click **Add endpoint**
6. Click on the webhook endpoint you just created
7. Under **Signing secret**, click **Reveal** and copy the secret → Use for `STRIPE_WEBHOOK_SECRET`

### 5. Configure Customer Portal

The Customer Portal allows users to manage their subscriptions, update payment methods, and view billing history.

1. Go to **Settings** → **Billing** → **Customer portal**: [https://dashboard.stripe.com/settings/billing/portal](https://dashboard.stripe.com/settings/billing/portal)
2. **Activate** the customer portal
3. Configure settings:
   - ✅ **Allow customers to update their payment methods**
   - ✅ **Allow customers to cancel subscriptions** (optional - you can set this based on your cancellation policy)
   - ✅ **Show invoice history**
4. **Branding**: Upload your logo and set brand colors to match your app
5. Click **Save changes**

## Example .env.local File

Here's a complete example of what your `web/.env.local` file should look like after setup:

```bash
# Supabase Configuration (existing)
NEXT_PUBLIC_SUPABASE_URL=https://rhchespvbiesrplsdkiz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Anthropic Claude API Configuration (existing)
ANTHROPIC_API_KEY=sk-ant-api03-...

# Swiss Ephemeris API Configuration (existing)
NEXT_PUBLIC_SWISSEPH_API_URL=https://astrologyapp-production.up.railway.app

# Google Places API Configuration (existing)
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=AIzaSyDdmXl36tMW6wRv5uOHeQ8wWyiJhSDNpFY

# App Configuration (existing)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# =============================================================================
# STRIPE CONFIGURATION (NEW)
# =============================================================================

# Stripe API Keys (TEST MODE)
STRIPE_SECRET_KEY=sk_test_51Abc...xyz
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51Abc...xyz

# Stripe Webhook Secret
STRIPE_WEBHOOK_SECRET=whsec_abc123xyz...

# Stripe Price IDs
STRIPE_PRICE_PREMIUM_MONTHLY=price_1Abc123
STRIPE_PRICE_PREMIUM_YEARLY=price_1Abc456
STRIPE_PRICE_PRO_MONTHLY=price_1Abc789
STRIPE_PRICE_PRO_YEARLY=price_1Abc012

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Testing Your Setup

After setting up all environment variables:

1. Restart your Next.js development server:
   ```bash
   cd web
   npm run dev
   ```

2. The Stripe integration will validate that all required environment variables are set
3. If any are missing, you'll see error messages in the console

## Test Mode vs. Live Mode

### Test Mode (Development)
- Use test API keys (`sk_test_...` and `pk_test_...`)
- Use test price IDs
- Payments won't actually charge real cards
- Use test card number: `4242 4242 4242 4242` (any future expiry, any CVC)

### Live Mode (Production)
- Use live API keys (`sk_live_...` and `pk_live_...`)
- Use live price IDs
- Real payments will be processed
- Real credit cards will be charged

⚠️ **Never use live keys in development!**

## Security Best Practices

1. ✅ **Never commit `.env.local` to version control**
   - It's already in `.gitignore`

2. ✅ **Keep secret keys secret**
   - Only use `NEXT_PUBLIC_` prefix for publishable keys
   - Never expose `STRIPE_SECRET_KEY` or `STRIPE_WEBHOOK_SECRET` to client-side code

3. ✅ **Use environment-specific keys**
   - Development: Test mode keys
   - Staging: Test mode keys
   - Production: Live mode keys

4. ✅ **Rotate keys if compromised**
   - Stripe allows you to roll (rotate) your API keys if they're ever exposed

## Troubleshooting

### "STRIPE_SECRET_KEY is not set" Error
- Make sure you've added the variable to `web/.env.local` (not root `.env`)
- Restart your Next.js dev server after adding environment variables

### "No Stripe Price ID configured" Error
- Verify you've created products and prices in Stripe Dashboard
- Copy the exact Price IDs (they start with `price_...`)
- Make sure you've set all 4 price variables

### Webhook Signature Verification Failed
- Make sure `STRIPE_WEBHOOK_SECRET` matches the secret from Stripe Dashboard or Stripe CLI
- For local development, use Stripe CLI to forward webhooks
- For production, create a webhook endpoint in Stripe Dashboard

### Test Card Not Working
- Use `4242 4242 4242 4242` (Visa test card)
- Use any future expiry date (e.g., 12/34)
- Use any 3-digit CVC (e.g., 123)
- Make sure you're in test mode

## Next Steps

Once you've set up all environment variables:

1. ✅ Run the database migration (see `STRIPE_IMPLEMENTATION_PLAN.md`)
2. ✅ Test the checkout flow in development
3. ✅ Test webhook event handling with Stripe CLI
4. ✅ Implement the pricing page UI
5. ✅ Deploy to staging and test end-to-end
6. ✅ Switch to live mode keys for production launch

## Useful Links

- [Stripe Dashboard](https://dashboard.stripe.com)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Stripe Customer Portal](https://stripe.com/docs/billing/subscriptions/customer-portal)

## Support

If you encounter any issues with Stripe setup:
1. Check the [Stripe Documentation](https://stripe.com/docs)
2. Contact Stripe Support through the Dashboard
3. Review this document and the implementation plan
