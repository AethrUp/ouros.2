# Stripe Product Setup Guide

**Purpose**: Create products and prices in Stripe with proper naming conventions to prevent mismatches
**Date**: 2025-10-26
**Status**: Required before Phase 2

---

## Overview

This guide provides **exact** product and price names to use in Stripe Dashboard to ensure everything matches correctly between Stripe and your application code.

---

## Products to Create

You need to create **2 products** in Stripe, each with **2 prices** (monthly and yearly).

### Product 1: Ouros2 Premium

**Product Details**:
- **Name**: `Ouros2 Premium` (exactly as shown)
- **Description**: `Unlimited tarot & I Ching readings, dream interpretation, enhanced horoscope, and limited synastry (up to 3 saved charts)`
- **Statement descriptor**: `OUROS2 PREMIUM` (appears on credit card statements)

**Prices to create**:

1. **Monthly Price**
   - **Price**: `$9.99 USD`
   - **Billing period**: `Monthly`
   - **Recurring**: Yes
   - **Price nickname**: `Premium Monthly` (optional but recommended)
   - **After creation**: Copy the Price ID (starts with `price_...`)
   - **Environment variable**: `STRIPE_PRICE_PREMIUM_MONTHLY`

2. **Yearly Price**
   - **Price**: `$99.00 USD`
   - **Billing period**: `Yearly`
   - **Recurring**: Yes
   - **Price nickname**: `Premium Yearly` (optional but recommended)
   - **After creation**: Copy the Price ID (starts with `price_...`)
   - **Environment variable**: `STRIPE_PRICE_PREMIUM_YEARLY`

---

### Product 2: Ouros2 Pro

**Product Details**:
- **Name**: `Ouros2 Pro` (exactly as shown)
- **Description**: `Everything in Premium plus unlimited synastry, transits & progressions, priority AI processing, and export capabilities`
- **Statement descriptor**: `OUROS2 PRO` (appears on credit card statements)

**Prices to create**:

1. **Monthly Price**
   - **Price**: `$19.99 USD`
   - **Billing period**: `Monthly`
   - **Recurring**: Yes
   - **Price nickname**: `Pro Monthly` (optional but recommended)
   - **After creation**: Copy the Price ID (starts with `price_...`)
   - **Environment variable**: `STRIPE_PRICE_PRO_MONTHLY`

2. **Yearly Price**
   - **Price**: `$199.00 USD`
   - **Billing period**: `Yearly`
   - **Recurring**: Yes
   - **Price nickname**: `Pro Yearly` (optional but recommended)
   - **After creation**: Copy the Price ID (starts with `price_...`)
   - **Environment variable**: `STRIPE_PRICE_PRO_YEARLY`

---

## Naming Convention Rules

### ✅ Critical Naming Rules

1. **Product names MUST match exactly**: `Ouros2 Premium` and `Ouros2 Pro`
   - Case-sensitive
   - Spacing matters
   - No extra characters

2. **Tier names in code**: `'premium'` and `'pro'` (lowercase)
   - These are used in the application code
   - They map to the Stripe products above

3. **Billing intervals**: `'monthly'` and `'yearly'` (lowercase)
   - These are used in the application code
   - They map to the Stripe price billing periods

### How Names Map

```
Application Code          →  Stripe Dashboard
─────────────────────────────────────────────────
tier: 'premium'          →  Product: "Ouros2 Premium"
tier: 'pro'              →  Product: "Ouros2 Pro"
interval: 'monthly'      →  Billing period: Monthly
interval: 'yearly'       →  Billing period: Yearly
```

---

## Environment Variable Mapping

After creating products and prices, you'll have **4 Price IDs** to copy:

| Tier | Interval | Environment Variable | Example Price ID |
|------|----------|---------------------|------------------|
| Premium | Monthly | `STRIPE_PRICE_PREMIUM_MONTHLY` | `price_1ABC123xyz` |
| Premium | Yearly | `STRIPE_PRICE_PREMIUM_YEARLY` | `price_1ABC456xyz` |
| Pro | Monthly | `STRIPE_PRICE_PRO_MONTHLY` | `price_1ABC789xyz` |
| Pro | Yearly | `STRIPE_PRICE_PRO_YEARLY` | `price_1ABC012xyz` |

### Template for .env.local

```bash
# Stripe Price IDs
STRIPE_PRICE_PREMIUM_MONTHLY=price_1ABC123xyz    # Replace with your actual ID
STRIPE_PRICE_PREMIUM_YEARLY=price_1ABC456xyz     # Replace with your actual ID
STRIPE_PRICE_PRO_MONTHLY=price_1ABC789xyz        # Replace with your actual ID
STRIPE_PRICE_PRO_YEARLY=price_1ABC012xyz         # Replace with your actual ID
```

---

## Metadata to Add (Important!)

When creating products and prices, add **metadata** to help with tracking and debugging:

### Product Metadata

**For Premium Product**:
```
tier: premium
app: ouros2
```

**For Pro Product**:
```
tier: pro
app: ouros2
```

### Price Metadata

**For Monthly Prices**:
```
interval: monthly
tier: premium (or pro)
app: ouros2
```

**For Yearly Prices**:
```
interval: yearly
tier: premium (or pro)
app: ouros2
```

**Why metadata matters**:
- Helps you identify products/prices in Stripe Dashboard
- Can be used for filtering and reporting
- Useful for debugging webhook events
- Makes it clear which app/tier a product belongs to

---

## How to Prevent Mismatches

### 1. Use Metadata for Validation

The checkout session will include metadata that maps to your database:

```typescript
// When creating checkout session, we add metadata:
metadata: {
  user_id: user.id,
  tier: tier,  // 'premium' or 'pro'
}
```

This ensures the tier is tracked throughout the subscription lifecycle.

### 2. Validate Price IDs at Startup

The application validates price IDs when it starts:

```typescript
// web/lib/stripe/prices.ts
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
```

**Result**: If any price ID is missing, the app will fail to start with a clear error message.

### 3. Store Price ID in Database

When a subscription is created via webhook, we store the `stripe_price_id`:

```typescript
await supabase
  .from('subscription_state')
  .upsert({
    user_id: userId,
    tier: tier,  // From metadata
    stripe_subscription_id: subscription.id,
    stripe_price_id: subscription.items.data[0].price.id,  // Stored!
    // ... other fields
  });
```

**Result**: You can always trace back which exact Stripe price was used.

### 4. Webhook Event Validation

When webhooks arrive, we validate they match expected tiers:

```typescript
// Get tier from subscription metadata
const tier = subscription.metadata.tier as SubscriptionTier;

// Validate it's a known tier
if (!['premium', 'pro'].includes(tier)) {
  throw new Error(`Unknown tier in subscription metadata: ${tier}`);
}
```

**Result**: Invalid tiers are rejected immediately.

---

## Verification Checklist

After creating products and prices, verify everything:

### ✅ In Stripe Dashboard

- [ ] 2 products created: "Ouros2 Premium" and "Ouros2 Pro"
- [ ] Each product has 2 prices: Monthly and Yearly
- [ ] All prices are set to "Recurring"
- [ ] All prices have correct amounts:
  - Premium Monthly: $9.99
  - Premium Yearly: $99.00
  - Pro Monthly: $19.99
  - Pro Yearly: $199.00
- [ ] All products have metadata set (tier, app)
- [ ] All prices have metadata set (interval, tier, app)

### ✅ In web/.env.local

- [ ] All 4 price IDs are set
- [ ] Price IDs start with `price_`
- [ ] Price IDs match the actual IDs from Stripe Dashboard
- [ ] No extra spaces or quotes around IDs
- [ ] File is in `web/.env.local` (not root `.env`)

### ✅ Test the Setup

```bash
# Start development server
cd web
npm run dev
```

- [ ] No errors about missing Stripe configuration
- [ ] No errors about missing price IDs
- [ ] Server starts successfully

---

## Common Mistakes to Avoid

### ❌ Wrong Product Names
```
Bad:  "Premium" or "Ouros Premium" or "ouros2-premium"
Good: "Ouros2 Premium"
```

### ❌ Wrong Price Amounts
```
Bad:  $9.00 or $10.00 for Premium Monthly
Good: $9.99 for Premium Monthly
```

### ❌ One-time Prices Instead of Recurring
```
Bad:  Billing period set to "One time"
Good: Billing period set to "Monthly" or "Yearly"
```

### ❌ Missing Environment Variables
```
Bad:  Only setting 2 out of 4 price IDs
Good: All 4 price IDs must be set
```

### ❌ Wrong Environment Variable Names
```
Bad:  STRIPE_PREMIUM_MONTHLY or PREMIUM_MONTHLY_PRICE
Good: STRIPE_PRICE_PREMIUM_MONTHLY
```

### ❌ Mixing Test and Live Price IDs
```
Bad:  STRIPE_PRICE_PREMIUM_MONTHLY=price_live_123 in development
Good: Use test mode prices (price_test_...) in development
```

---

## Mapping Reference

### Application Tier → Stripe Product

| App Code | Stripe Product Name | Environment Variable Prefix |
|----------|--------------------|-----------------------------|
| `'premium'` | `Ouros2 Premium` | `STRIPE_PRICE_PREMIUM_` |
| `'pro'` | `Ouros2 Pro` | `STRIPE_PRICE_PRO_` |

### Application Interval → Stripe Billing Period

| App Code | Stripe Billing Period | Environment Variable Suffix |
|----------|-----------------------|----------------------------|
| `'monthly'` | `Monthly` | `_MONTHLY` |
| `'yearly'` | `Yearly` | `_YEARLY` |

### Complete Mapping Table

| Tier | Interval | Env Var | Stripe Product | Stripe Price |
|------|----------|---------|----------------|--------------|
| premium | monthly | `STRIPE_PRICE_PREMIUM_MONTHLY` | Ouros2 Premium | $9.99/month |
| premium | yearly | `STRIPE_PRICE_PREMIUM_YEARLY` | Ouros2 Premium | $99/year |
| pro | monthly | `STRIPE_PRICE_PRO_MONTHLY` | Ouros2 Pro | $19.99/month |
| pro | yearly | `STRIPE_PRICE_PRO_YEARLY` | Ouros2 Pro | $199/year |

---

## Feature Comparison (for reference)

### Free Tier (No Stripe product needed)
- 1 tarot reading per day
- 1 I Ching reading per day
- Basic natal chart
- Daily horoscope
- 5 journal entries per month

### Premium Tier → "Ouros2 Premium" Product
- ✅ Unlimited tarot readings
- ✅ Unlimited I Ching readings
- ✅ Dream interpretation
- ✅ Enhanced horoscope
- ✅ Cosmic weather
- ✅ Full natal chart
- ✅ Unlimited journal entries
- ✅ Synastry compatibility (up to 3 saved charts)
- ✅ Daily synastry forecast
- ❌ Transits & progressions
- ❌ Priority AI processing
- ❌ Export readings

### Pro Tier → "Ouros2 Pro" Product
- ✅ Everything in Premium
- ✅ Unlimited synastry charts
- ✅ Transits & progressions
- ✅ Priority AI processing
- ✅ Export readings

---

## Quick Setup Steps

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com/products
2. **Switch to Test Mode** (toggle in top right)
3. **Create Product 1**: Click "+ Add product"
   - Name: `Ouros2 Premium`
   - Add metadata: `tier=premium`, `app=ouros2`
   - Add monthly price: $9.99
   - Add yearly price: $99.00
   - Copy both Price IDs
4. **Create Product 2**: Click "+ Add product"
   - Name: `Ouros2 Pro`
   - Add metadata: `tier=pro`, `app=ouros2`
   - Add monthly price: $19.99
   - Add yearly price: $199.00
   - Copy both Price IDs
5. **Add to .env.local**:
   ```bash
   STRIPE_PRICE_PREMIUM_MONTHLY=price_...
   STRIPE_PRICE_PREMIUM_YEARLY=price_...
   STRIPE_PRICE_PRO_MONTHLY=price_...
   STRIPE_PRICE_PRO_YEARLY=price_...
   ```
6. **Verify**: Restart dev server, check for errors

---

## Support

If you encounter issues:
- Check that product names match exactly (case-sensitive)
- Verify all 4 price IDs are set
- Ensure prices are set to "Recurring" not "One time"
- Confirm you're using Test Mode prices for development
- Review `STRIPE_ENV_SETUP.md` for detailed instructions

---

**Status**: ✅ Ready to create products
**Next**: Copy Price IDs to `web/.env.local`
