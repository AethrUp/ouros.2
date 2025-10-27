# Stripe Checkout Explained

**TL;DR**: Yes, we're using Stripe Checkout (the prebuilt, hosted checkout form). This is the recommended approach.

---

## What is Stripe Checkout?

**Stripe Checkout** is a prebuilt, hosted payment page that Stripe provides. Instead of building your own payment form, you redirect users to a Stripe-hosted URL where they enter their payment information.

### ✅ What We're Using (Recommended)

```
User clicks "Upgrade"
  → Your app creates a Checkout Session
  → User redirects to checkout.stripe.com
  → User enters payment info on Stripe's page (PCI compliant!)
  → Stripe processes payment
  → User redirects back to your app
  → Webhook updates your database
```

### ❌ What We're NOT Using (More Complex)

**Stripe Elements** - Custom payment form you build yourself:
- You embed payment fields in your own page
- More customization, but more work
- Still PCI compliant, but requires more setup
- Better for custom UX needs

**Why we're not using it**: Checkout is faster to implement, fully tested, mobile-optimized, and handles edge cases automatically.

---

## Why Stripe Checkout is the Right Choice

### 1. **PCI Compliance - Automatic** ✅
- Payment data never touches your servers
- No PCI compliance burden on you
- Stripe handles all security
- No need to worry about card data storage

### 2. **Fully Featured Out of the Box** ✅
- Mobile-optimized
- Supports multiple payment methods (card, Apple Pay, Google Pay)
- Built-in validation
- Error handling
- Loading states
- Automatic retries
- 3D Secure / SCA support
- Tax collection (if enabled)
- Coupons/discounts
- Trial periods

### 3. **Faster Implementation** ✅
- Create session → Redirect → Done
- No need to build payment forms
- No need to handle card validation
- No need to style payment fields

### 4. **Proven & Tested** ✅
- Used by thousands of companies
- Handles edge cases you might miss
- Optimized conversion rates
- A/B tested by Stripe

### 5. **Consistent UX** ✅
- Users recognize Stripe's interface
- Trust indicator (users know Stripe)
- Professional appearance
- Multi-language support

---

## How Stripe Checkout Works

### Step 1: User Clicks "Upgrade"

Your pricing page has an upgrade button:

```tsx
<button onClick={() => handleUpgrade('premium', 'monthly')}>
  Upgrade to Premium
</button>
```

### Step 2: Create Checkout Session (Server-Side)

Your app calls your API to create a session:

```typescript
// Client-side: /components/pricing/UpgradeButton.tsx
const handleUpgrade = async (tier, interval) => {
  const response = await fetch('/api/stripe/create-checkout-session', {
    method: 'POST',
    body: JSON.stringify({ tier, interval }),
  });

  const { url } = await response.json();
  window.location.href = url; // Redirect to Stripe
};
```

```typescript
// Server-side: /app/api/stripe/create-checkout-session/route.ts
export async function POST(request: Request) {
  const { tier, interval } = await request.json();

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: getPriceId(tier, interval), quantity: 1 }],
    success_url: 'https://yourapp.com/subscription/success',
    cancel_url: 'https://yourapp.com/subscription/cancel',
    // ... metadata
  });

  return Response.json({ url: session.url });
}
```

### Step 3: User Redirects to Stripe Checkout

- User is redirected to `checkout.stripe.com/...`
- Stripe displays a professional checkout form
- Pre-filled with user's email
- Shows the plan they selected
- Shows the price

### Step 4: User Enters Payment Info

- User enters card number (or uses Apple/Google Pay)
- Stripe validates in real-time
- Stripe handles 3D Secure if needed
- All on Stripe's servers (never touches yours!)

### Step 5: Payment Processed

- Stripe processes the payment
- Creates the subscription in Stripe
- Sends webhook to your server
- Your webhook handler updates the database

### Step 6: User Redirected Back

- If successful: Redirected to your success URL
- If cancelled: Redirected to your cancel URL
- Your app shows appropriate message

### Step 7: Webhook Updates Database

While user is being redirected, your webhook handler:

```typescript
// Webhook receives 'customer.subscription.created' event
await supabase
  .from('subscription_state')
  .upsert({
    user_id: metadata.user_id,
    tier: metadata.tier,
    stripe_subscription_id: subscription.id,
    status: 'active',
    // ... other fields
  });
```

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     YOUR WEB APP                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Pricing Page                                        │   │
│  │  [ Free ] [ Premium ] [ Pro ]                        │   │
│  │              ↓ User clicks                           │   │
│  │         [Upgrade Button]                             │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │                                        │
│                     ↓                                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  API: /api/stripe/create-checkout-session           │   │
│  │  - Authenticate user                                 │   │
│  │  - Get price ID                                      │   │
│  │  - Create Stripe session                             │   │
│  │  - Return session URL                                │   │
│  └──────────────────┬───────────────────────────────────┘   │
└────────────────────┬┼───────────────────────────────────────┘
                     ││
                     ↓│
┌────────────────────────────────────────────────────────────┐
│              STRIPE CHECKOUT (Hosted)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  checkout.stripe.com                                 │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │ Pay Ouros2                                     │  │  │
│  │  │                                                │  │  │
│  │  │ Premium Plan - $9.99/month                     │  │  │
│  │  │                                                │  │  │
│  │  │ Email: user@example.com                        │  │  │
│  │  │                                                │  │  │
│  │  │ Card number: [________________]                │  │  │
│  │  │ Expiry: [____]  CVC: [___]                     │  │  │
│  │  │                                                │  │  │
│  │  │          [ Pay $9.99 ]                         │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────┬───────────────────────────────────┘  │
└────────────────────┬┼───────────────────────────────────────┘
                     ││
                     ││ Payment processed
                     ││ Subscription created
                     ││
                     ↓│
┌────────────────────────────────────────────────────────────┐
│                  STRIPE WEBHOOKS                           │
│  Sends event to: /api/webhooks/stripe                     │
│  Event: customer.subscription.created                      │
└────────────────────┬───────────────────────────────────────┘
                     │
                     ↓
┌────────────────────────────────────────────────────────────┐
│              YOUR WEB APP (Webhook Handler)                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  /api/webhooks/stripe                                │  │
│  │  - Verify signature                                  │  │
│  │  - Update subscription_state in Supabase             │  │
│  │  - Set tier to 'premium'                             │  │
│  │  - Set status to 'active'                            │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
                     ↑│
                     │↓ User redirected
┌────────────────────────────────────────────────────────────┐
│              YOUR WEB APP (Success Page)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  /subscription/success                               │  │
│  │                                                       │  │
│  │  ✅ Welcome to Premium!                              │  │
│  │  Your subscription is now active.                    │  │
│  │                                                       │  │
│  │  [Continue to Dashboard]                             │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

## What You Build vs What Stripe Provides

### You Build (Simple!)

1. **Upgrade Button** - Just a button that calls your API
2. **API Endpoint** - Creates checkout session, returns URL
3. **Success Page** - "Thank you" page after payment
4. **Cancel Page** - "Maybe next time" page if user cancels
5. **Webhook Handler** - Updates database when subscription created

### Stripe Provides (Complex!)

1. **Payment Form** - Fully styled, validated, secure
2. **Card Validation** - Real-time validation as user types
3. **Error Handling** - Clear error messages
4. **3D Secure** - Automatic handling of SCA requirements
5. **Mobile Optimization** - Touch-optimized, responsive
6. **Apple Pay / Google Pay** - Automatic detection and display
7. **Multiple Languages** - Auto-detects user's language
8. **Loading States** - Shows spinners during processing
9. **Retry Logic** - Handles temporary failures
10. **Security** - PCI DSS compliant infrastructure

---

## Code Example (Minimal Implementation)

### API Route: Create Checkout Session

```typescript
// web/app/api/stripe/create-checkout-session/route.ts
import { stripe } from '@/lib/stripe/server';
import { getPriceId } from '@/lib/stripe/prices';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  // 1. Authenticate
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  // 2. Get tier and interval from request
  const { tier, interval } = await request.json();

  // 3. Create Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: user.email,
    line_items: [
      { price: getPriceId(tier, interval), quantity: 1 }
    ],
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/subscription/cancel`,
    metadata: {
      user_id: user.id,
      tier: tier,
    },
    subscription_data: {
      metadata: {
        user_id: user.id,
        tier: tier,
      },
    },
  });

  // 4. Return the checkout URL
  return Response.json({ url: session.url });
}
```

### Client Component: Upgrade Button

```typescript
// web/components/pricing/UpgradeButton.tsx
'use client';

import { useState } from 'react';

export function UpgradeButton({ tier, interval }) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);

    try {
      // Call your API
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, interval }),
      });

      const { url } = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  return (
    <button onClick={handleUpgrade} disabled={loading}>
      {loading ? 'Loading...' : `Upgrade to ${tier}`}
    </button>
  );
}
```

That's it! The rest is handled by Stripe.

---

## Customization Options

Even though it's prebuilt, you can still customize:

### Basic Customization (Supported)

- ✅ Logo (add your logo to the checkout page)
- ✅ Colors (primary color to match your brand)
- ✅ Product images
- ✅ Billing address collection
- ✅ Phone number collection
- ✅ Shipping address collection (if needed)
- ✅ Coupon/promotion codes
- ✅ Success/cancel URLs
- ✅ Customer email pre-filling

### Configuration in Stripe Dashboard

1. Go to **Settings** → **Branding**
2. Upload your logo
3. Set your brand color
4. Save

Now all checkout sessions will use your branding!

---

## Alternative: Stripe Elements (Why We're Not Using It)

**Stripe Elements** lets you build a custom payment form embedded in your app.

### When to Use Elements Instead

- You need a fully custom checkout UX
- You want the payment form on your own page (no redirect)
- You need specific styling that Checkout doesn't support
- You want to collect additional custom data during payment

### Why We're Using Checkout Instead

For Ouros2, Stripe Checkout is better because:

1. **Faster to implement** - Phase 2 takes 1-2 weeks instead of 3-4 weeks
2. **Lower maintenance** - Stripe updates the UI, not you
3. **Better conversion** - Stripe optimizes the checkout flow
4. **Mobile-optimized** - Works perfectly on all devices
5. **Security** - Zero risk of card data touching your servers
6. **Features included** - Apple Pay, Google Pay, etc. work automatically

---

## Summary

### ✅ What We're Doing

**Using Stripe Checkout (Prebuilt, Hosted Form)**

**The flow**:
1. User clicks "Upgrade" → Call your API
2. Your API creates checkout session → Returns URL
3. Redirect user to `checkout.stripe.com`
4. User enters payment info (on Stripe's page)
5. Stripe processes payment
6. Stripe sends webhook to your server
7. Your webhook updates database
8. User redirected back to your app

**What you build**:
- Upgrade button
- API endpoint (creates session)
- Success/cancel pages
- Webhook handler

**What Stripe provides**:
- Entire payment form
- Security & PCI compliance
- Validation & error handling
- Mobile optimization
- Apple Pay / Google Pay
- 3D Secure handling

### 🎯 Benefits for Ouros2

- ✅ Fast to implement (1-2 weeks for Phase 2)
- ✅ No security concerns (PCI compliant by default)
- ✅ Professional appearance
- ✅ Mobile-optimized
- ✅ Tested by thousands of companies
- ✅ Easy to maintain
- ✅ Good conversion rates

---

**Decision**: ✅ Yes, use Stripe Checkout (prebuilt form)
**Next**: Implement Phase 2 checkout flow with session creation
