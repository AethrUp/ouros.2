# Stripe Integration Implementation Plan

**Project:** Ouros2 Web Application
**Purpose:** Implement Stripe for subscription management, billing, usage tracking, and feature access control
**Date:** 2025-10-26
**Status:** Planning Phase

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Architecture Overview](#architecture-overview)
4. [Implementation Phases](#implementation-phases)
5. [Technical Specifications](#technical-specifications)
6. [Security & Compliance](#security--compliance)
7. [Testing Strategy](#testing-strategy)
8. [Deployment Plan](#deployment-plan)
9. [Monitoring & Analytics](#monitoring--analytics)
10. [Risk Assessment](#risk-assessment)

---

## Executive Summary

### Goals

1. **Enable Web Monetization**: Implement Stripe as the payment processor for web-based subscriptions
2. **Server-Side Enforcement**: Add robust API-level feature gating and usage tracking
3. **Seamless User Experience**: Create intuitive upgrade flows and subscription management
4. **Production Readiness**: Replace beta "pro for all" with real subscription tiers
5. **Revenue Operations**: Establish billing, invoicing, and payment failure handling

### Success Metrics

- **Technical**: 99.9% uptime for payment processing, <2s checkout completion
- **Business**: <5% payment failure rate, >80% subscription renewal rate
- **User Experience**: <3 clicks to upgrade, clear feature visibility
- **Compliance**: PCI DSS compliant (via Stripe), GDPR/CCPA ready

### Timeline Estimate

- **Phase 1 (Foundation)**: 2-3 weeks
- **Phase 2 (Checkout)**: 1-2 weeks
- **Phase 3 (Enforcement)**: 2-3 weeks
- **Phase 4 (Management)**: 1-2 weeks
- **Phase 5 (Testing & Launch)**: 2-3 weeks
- **Total**: 8-13 weeks (can be parallelized)

---

## Current State Analysis

### What's Already Built

#### ✅ **Subscription Data Model** (Complete)
- `subscription_state` table with tier/status tracking
- `subscription_history` audit trail
- `usage_tracking` table with daily/monthly periods
- SQL functions: `increment_usage()`, `get_usage_count()`, `check_feature_access()`

#### ✅ **Tier & Feature Definitions** (Complete)
- 3 tiers: Free, Premium, Pro
- Feature limits clearly defined in `TIER_LIMITS`
- Feature flags in `TIER_FEATURES`
- Product IDs defined (currently for RevenueCat)

#### ✅ **Client-Side Feature Gating** (Complete)
- `useFeatureAccess()` hook for access checks
- `useFeatureUsage()` hook for usage tracking
- `useSubscriptionTier()` hook for tier info
- Utility functions for UX messaging

#### ✅ **Authentication System** (Complete)
- Supabase Auth with email/password
- Session management and token refresh
- Row-level security policies
- User profile system

#### ✅ **State Management** (Complete)
- Zustand store with subscription slice
- Auth slice with user data
- Hydration and persistence patterns

### What's Missing

#### ❌ **Payment Processing** (Critical)
- No Stripe integration
- No checkout flow
- No payment method storage
- No subscription lifecycle handling

#### ❌ **Server-Side Enforcement** (Critical)
- APIs don't validate subscription tier
- APIs don't increment usage counts
- No rate limiting
- No server-side access control

#### ❌ **Subscription Management UI** (Critical)
- No upgrade/downgrade flow
- No payment method management
- No billing history
- No cancel/pause functionality

#### ❌ **Webhooks & Events** (Critical)
- No Stripe webhook handler
- No subscription event processing
- No payment failure handling
- No dunning management

#### ❌ **Production Configuration** (Critical)
- Default tier still set to 'pro' for beta
- No price definitions
- No environment configuration for Stripe

### Critical Gaps to Address

1. **Security**: Payment data must never touch our servers (use Stripe.js)
2. **Reliability**: Webhooks must be idempotent and handle retries
3. **Data Consistency**: Stripe must be source of truth, synced to Supabase
4. **User Experience**: Clear upgrade prompts, transparent pricing, easy management
5. **Compliance**: Tax handling, invoicing, payment method security

---

## Architecture Overview

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                      │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │  React UI       │  │ Stripe.js    │  │ Zustand Store  │ │
│  │  Components     │◄─┤ (PCI Secure) │◄─┤ Subscription   │ │
│  └─────────────────┘  └──────────────┘  └────────────────┘ │
└────────────┬────────────────────────────────────────────────┘
             │ HTTPS Only
┌────────────▼────────────────────────────────────────────────┐
│                    NEXT.JS API ROUTES                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ /api/stripe/ │  │ /api/        │  │ Middleware       │  │
│  │ checkout     │  │ webhooks     │  │ Auth + Tier      │  │
│  │ portal       │  │              │  │ Validation       │  │
│  │ subscription │  │              │  │                  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└────────┬────────────────────┬──────────────────────────────┘
         │                    │
    ┌────▼────┐         ┌────▼────┐
    │ Stripe  │◄────────┤Webhooks │
    │   API   │  Events │         │
    └────┬────┘         └─────────┘
         │
┌────────▼──────────────────────────────────────────────────┐
│                      SUPABASE                              │
│  ┌──────────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ subscription_    │  │ usage_       │  │ Auth       │  │
│  │ state            │  │ tracking     │  │ Users      │  │
│  └──────────────────┘  └──────────────┘  └────────────┘  │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  RLS Policies + Database Functions                   │ │
│  └──────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────┘
```

### Data Flow Patterns

#### **Subscription Creation Flow**
```
User clicks "Upgrade"
  → Client: Create Stripe Checkout Session (API call)
  → Server: Create session with Stripe API
  → Stripe: Returns session URL
  → Client: Redirect to Stripe Checkout
  → User: Enters payment info on Stripe (PCI compliant)
  → Stripe: Processes payment
  → Stripe: Sends webhook to our server
  → Server: Validates webhook signature
  → Server: Updates subscription_state in Supabase
  → Server: Logs to subscription_history
  → Stripe: Redirects user back to success page
  → Client: Refreshes subscription state
```

#### **Feature Access Flow**
```
User attempts to use feature
  → Client: Check tier with useFeatureAccess()
  → Client: Check usage with useFeatureUsage()
  → Client: If allowed, make API call
  → Server: Validate JWT token
  → Server: Check subscription_state tier
  → Server: Check usage_tracking count
  → Server: If allowed, process request
  → Server: Increment usage_tracking
  → Server: Return result
  → Client: Update local usage cache
```

#### **Webhook Processing Flow**
```
Stripe event occurs (payment success, subscription cancelled, etc.)
  → Stripe: Sends webhook POST to /api/webhooks/stripe
  → Server: Validate signature with webhook secret
  → Server: Parse event type
  → Server: Begin database transaction
  → Server: Update subscription_state
  → Server: Log to subscription_history
  → Server: Emit app events (email, notifications)
  → Server: Commit transaction
  → Server: Return 200 OK to Stripe
  → Stripe: Marks event as delivered
```

---

## Implementation Phases

### Phase 1: Stripe Foundation (Weeks 1-3)

**Goal**: Set up Stripe account, create products/prices, establish API connection

#### Tasks

1. **Stripe Account Setup**
   - Create Stripe account (or use existing)
   - Enable test mode and production mode
   - Configure company/business details
   - Set up tax settings and compliance

2. **Product & Price Configuration**
   ```
   Products to Create:
   - "Ouros2 Premium" (monthly & yearly)
   - "Ouros2 Pro" (monthly & yearly)

   Pricing Strategy (example):
   - Premium Monthly: $9.99/month
   - Premium Yearly: $99/year (2 months free)
   - Pro Monthly: $19.99/month
   - Pro Yearly: $199/year (2 months free)
   ```

3. **Environment Configuration**
   - Add Stripe keys to environment variables
   - Separate test/production keys
   - Configure webhook secrets

4. **Install Stripe SDK**
   ```bash
   npm install stripe @stripe/stripe-js
   npm install --save-dev @types/stripe
   ```

5. **Create Stripe Client Utils**
   - Server-side Stripe client initialization
   - Client-side Stripe.js loader
   - Type definitions for Stripe objects

#### Deliverables
- [ ] Stripe account configured
- [ ] Products and prices created in Stripe Dashboard
- [ ] Environment variables documented
- [ ] Stripe SDK installed
- [ ] Basic Stripe utilities created

---

### Phase 2: Checkout Flow (Weeks 2-4)

**Goal**: Implement subscription purchase flow with Stripe Checkout

#### Tasks

1. **Create Checkout Session API**
   - `POST /api/stripe/create-checkout-session`
   - Accept tier parameter (premium/pro) and billing period (monthly/yearly)
   - Create Stripe Checkout Session
   - Include customer email pre-filled from auth
   - Set success/cancel URLs
   - Add metadata (user_id, tier)

2. **Upgrade UI Components**
   - Pricing table component
   - "Upgrade" button with tier selection
   - Feature comparison modal
   - Testimonials/social proof (optional)

3. **Checkout Redirect Flow**
   - Trigger checkout from client
   - Redirect to Stripe Checkout
   - Handle success callback
   - Handle cancel/error states

4. **Success/Cancel Pages**
   - `/subscription/success` - Thank you page
   - `/subscription/cancel` - "Come back" page
   - Loading states while webhooks process

#### Implementation Details

**API Route: `/api/stripe/create-checkout-session`**
```typescript
import Stripe from 'stripe';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  // 1. Authenticate user
  const supabase = createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  // 2. Parse request body
  const { tier, interval } = await request.json(); // 'premium' | 'pro', 'month' | 'year'

  // 3. Get price ID from environment or mapping
  const priceId = getPriceId(tier, interval);

  // 4. Create Stripe Checkout Session
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const session = await stripe.checkout.sessions.create({
    customer_email: user.email,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
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

  // 5. Return session URL
  return Response.json({ url: session.url });
}
```

**Client Component: Upgrade Button**
```typescript
'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export function UpgradeButton({ tier, interval }: { tier: string; interval: string }) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);

    // Call our API to create checkout session
    const response = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier, interval }),
    });

    const { url } = await response.json();

    // Redirect to Stripe Checkout
    window.location.href = url;
  };

  return (
    <button onClick={handleUpgrade} disabled={loading}>
      {loading ? 'Loading...' : `Upgrade to ${tier}`}
    </button>
  );
}
```

#### Deliverables
- [ ] Checkout session API route
- [ ] Pricing page UI
- [ ] Upgrade button component
- [ ] Success/cancel pages
- [ ] Error handling

---

### Phase 3: Webhook Integration & Server-Side Enforcement (Weeks 3-6)

**Goal**: Handle Stripe events and enforce subscriptions at API level

#### Tasks

1. **Webhook Handler API**
   - `POST /api/webhooks/stripe`
   - Verify webhook signature
   - Parse event types
   - Update subscription_state
   - Handle idempotency

2. **Event Handlers**
   ```
   Events to Handle:
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.payment_succeeded
   - invoice.payment_failed
   - customer.subscription.trial_will_end
   ```

3. **Subscription State Sync**
   - Map Stripe status to our status enum
   - Update tier, status, expires_at
   - Store Stripe subscription ID
   - Log to subscription_history

4. **API Middleware for Feature Gating**
   - Create reusable middleware
   - Check authentication
   - Load subscription_state
   - Validate tier for requested feature
   - Check usage limits
   - Return 403 if unauthorized

5. **API-Level Usage Tracking**
   - Increment usage on successful requests
   - Handle daily/monthly period resets
   - Rate limiting per tier

6. **Update Existing API Routes**
   - Add middleware to all protected routes
   - `/api/tarot/*` - check tarot limits
   - `/api/iching/*` - check iching limits
   - `/api/dream/*` - check dream access
   - `/api/synastry/*` - check synastry access
   - `/api/journal/*` - check journal limits

#### Implementation Details

**Webhook Handler: `/api/webhooks/stripe`**
```typescript
import Stripe from 'stripe';
import { createServerClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  // 1. Verify webhook signature
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }

  // 2. Handle event
  const supabase = createServerClient();

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription, supabase);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabase);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice, supabase);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice, supabase);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return new Response('Webhook handler failed', { status: 500 });
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription, supabase: any) {
  const userId = subscription.metadata.user_id;
  const tier = subscription.metadata.tier as SubscriptionTier;

  // Map Stripe status to our status
  let status: SubscriptionStatus = 'active';
  if (subscription.status === 'trialing') status = 'trial';
  if (subscription.status === 'canceled') status = 'cancelled';
  if (subscription.status === 'past_due') status = 'grace_period';
  if (subscription.status === 'unpaid') status = 'expired';

  // Update subscription_state
  await supabase
    .from('subscription_state')
    .upsert({
      user_id: userId,
      tier: tier,
      status: status,
      platform: 'web',
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    });
}
```

**API Middleware: Feature Gating**
```typescript
// web/lib/middleware/featureGate.ts

import { createServerClient } from '@/lib/supabase/server';
import { SubscriptionTier, TIER_FEATURES } from '@/types/subscription';

export async function requireFeature(feature: keyof TierFeatures) {
  return async (request: Request) => {
    // 1. Authenticate
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // 2. Get subscription state
    const { data: subState, error: subError } = await supabase
      .from('subscription_state')
      .select('tier, status')
      .eq('user_id', user.id)
      .single();

    if (subError || !subState) {
      return new Response('Subscription not found', { status: 403 });
    }

    // 3. Check feature access
    const tier = subState.tier as SubscriptionTier;
    const hasAccess = TIER_FEATURES[tier][feature];

    if (!hasAccess) {
      return new Response(
        JSON.stringify({
          error: 'Feature not available in your plan',
          tier: tier,
          feature: feature
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 4. Return user and tier for use in handler
    return { user, tier, status: subState.status };
  };
}

// Usage in API routes:
export async function POST(request: Request) {
  const authResult = await requireFeature('dreamInterpretation')(request);
  if (authResult instanceof Response) return authResult; // Error response

  const { user, tier } = authResult;

  // Proceed with feature logic...
}
```

**Usage Tracking Middleware**
```typescript
// web/lib/middleware/usageTracking.ts

export async function trackUsage(userId: string, feature: UsageFeature) {
  const supabase = createServerClient();

  // Call increment_usage SQL function
  const { data, error } = await supabase.rpc('increment_usage', {
    p_user_id: userId,
    p_feature: feature,
    p_period: 'daily',
  });

  if (error) {
    console.error('Failed to track usage:', error);
  }

  return data; // Returns new count
}

export async function checkUsageLimit(userId: string, feature: UsageFeature, tier: SubscriptionTier) {
  const supabase = createServerClient();

  // Get current usage
  const { data: count } = await supabase.rpc('get_usage_count', {
    p_user_id: userId,
    p_feature: feature,
    p_period: 'daily',
  });

  // Get limit for tier
  const limit = TIER_LIMITS[tier][feature];

  if (limit === 'unlimited') return { allowed: true, count, limit: 'unlimited' };
  if (limit === 0) return { allowed: false, count, limit: 0 };

  return {
    allowed: count < limit,
    count,
    limit,
    remaining: limit - count
  };
}
```

#### Deliverables
- [ ] Webhook handler API route
- [ ] Event handlers for all subscription events
- [ ] Feature gating middleware
- [ ] Usage tracking middleware
- [ ] Updated API routes with enforcement
- [ ] Stripe webhook configured in dashboard

---

### Phase 4: Subscription Management (Weeks 5-7)

**Goal**: Allow users to manage their subscriptions

#### Tasks

1. **Customer Portal Integration**
   - Use Stripe Customer Portal (easiest option)
   - Create portal session API
   - Link from settings page

2. **Subscription Management UI**
   - Current plan display
   - Billing cycle and renewal date
   - Payment method on file
   - Billing history
   - Upgrade/downgrade options
   - Cancel subscription

3. **Billing History API**
   - Fetch invoices from Stripe
   - Display payment history
   - Download invoice PDFs

4. **Plan Change Logic**
   - Upgrade: Prorate and charge immediately
   - Downgrade: Prorate and credit, change at period end
   - Handle edge cases (trial, cancelled, etc.)

5. **Cancel/Pause Flow**
   - Cancel immediately vs. at period end
   - Retention prompts
   - Feedback collection
   - Reactivation flow

#### Implementation Details

**Customer Portal API** (Simplest approach)
```typescript
// POST /api/stripe/create-portal-session

export async function POST(request: Request) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  // Get Stripe customer ID from subscription_state
  const { data: subState } = await supabase
    .from('subscription_state')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single();

  if (!subState?.stripe_customer_id) {
    return new Response('No subscription found', { status: 404 });
  }

  // Create portal session
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const session = await stripe.billingPortal.sessions.create({
    customer: subState.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/settings`,
  });

  return Response.json({ url: session.url });
}
```

**Subscription Settings Component**
```typescript
'use client';

import { useSubscriptionTier } from '@/hooks/useFeatureAccess';

export function SubscriptionSettings() {
  const { tier, status } = useSubscriptionTier();

  const openCustomerPortal = async () => {
    const response = await fetch('/api/stripe/create-portal-session', {
      method: 'POST',
    });
    const { url } = await response.json();
    window.location.href = url;
  };

  return (
    <div>
      <h2>Your Subscription</h2>
      <p>Current Plan: {tier}</p>
      <p>Status: {status}</p>
      <button onClick={openCustomerPortal}>
        Manage Subscription
      </button>
    </div>
  );
}
```

#### Deliverables
- [ ] Customer portal API
- [ ] Subscription settings UI
- [ ] Billing history display
- [ ] Cancel/reactivate flows
- [ ] Edge case handling

---

### Phase 5: Production Preparation (Weeks 6-8)

**Goal**: Prepare for production launch, testing, and rollout

#### Tasks

1. **Change Default Tier to Free**
   - Update `subscriptionSlice.ts` line 133
   - Change from `tier: 'pro'` to `tier: 'free'`
   - Update all existing beta users if needed

2. **Database Migration for Stripe Fields**
   ```sql
   -- Add Stripe-specific fields to subscription_state
   ALTER TABLE subscription_state ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
   ALTER TABLE subscription_state ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
   ALTER TABLE subscription_state ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

   CREATE INDEX IF NOT EXISTS idx_subscription_state_stripe_subscription_id
     ON subscription_state(stripe_subscription_id);
   CREATE INDEX IF NOT EXISTS idx_subscription_state_stripe_customer_id
     ON subscription_state(stripe_customer_id);
   ```

3. **Environment Variables Documentation**
   ```
   # Stripe Configuration
   STRIPE_SECRET_KEY=sk_live_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...

   # Stripe Test Mode (for staging)
   STRIPE_SECRET_KEY_TEST=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST=pk_test_...
   STRIPE_WEBHOOK_SECRET_TEST=whsec_...

   # App Configuration
   NEXT_PUBLIC_BASE_URL=https://yourdomain.com
   ```

4. **Comprehensive Testing**
   - End-to-end checkout flow
   - Webhook event handling (use Stripe CLI)
   - Feature gating on all APIs
   - Usage limit enforcement
   - Payment failure scenarios
   - Cancellation flow
   - Upgrade/downgrade
   - Edge cases (expired cards, disputes, etc.)

5. **Stripe Dashboard Configuration**
   - Set up webhook endpoints (prod & test)
   - Configure email receipts
   - Set up tax collection (if applicable)
   - Configure billing portal settings
   - Add company branding

6. **Error Handling & Logging**
   - Comprehensive error logging
   - Stripe event monitoring
   - Payment failure alerts
   - Usage anomaly detection
   - Sentry/monitoring integration

7. **User Communication**
   - Email templates for:
     - Payment succeeded
     - Payment failed
     - Subscription cancelled
     - Trial ending soon
     - Subscription renewed
   - In-app notifications

8. **Documentation**
   - API documentation
   - Webhook event handling
   - Runbook for common issues
   - Customer support scripts

#### Deliverables
- [ ] Default tier changed to 'free'
- [ ] Database migration completed
- [ ] All environment variables configured
- [ ] Testing checklist completed
- [ ] Stripe dashboard configured
- [ ] Error handling implemented
- [ ] Email templates created
- [ ] Documentation written

---

## Technical Specifications

### Database Schema Updates

```sql
-- Add Stripe fields to subscription_state
ALTER TABLE subscription_state ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE;
ALTER TABLE subscription_state ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE subscription_state ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;
ALTER TABLE subscription_state ADD COLUMN IF NOT EXISTS stripe_payment_method_id TEXT;
ALTER TABLE subscription_state ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ;
ALTER TABLE subscription_state ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
ALTER TABLE subscription_state ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;

-- Add platform 'web' to platform enum
ALTER TABLE subscription_state DROP CONSTRAINT IF EXISTS subscription_state_platform_check;
ALTER TABLE subscription_state ADD CONSTRAINT subscription_state_platform_check
  CHECK (platform IN ('ios', 'android', 'manual', 'web'));

-- Indexes for Stripe lookups
CREATE INDEX IF NOT EXISTS idx_subscription_state_stripe_subscription_id
  ON subscription_state(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_state_stripe_customer_id
  ON subscription_state(stripe_customer_id);

-- Update subscription_history to include Stripe fields
ALTER TABLE subscription_history ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE subscription_history ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE subscription_history ADD COLUMN IF NOT EXISTS stripe_event_id TEXT;

-- Create webhook events log table
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_stripe_event_id
  ON stripe_webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_processed
  ON stripe_webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_event_type
  ON stripe_webhook_events(event_type);

-- Add RLS policies
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage webhook events"
  ON stripe_webhook_events FOR ALL
  USING (auth.role() = 'service_role');
```

### Type Definitions

```typescript
// Add to src/types/subscription.ts

export interface StripeSubscriptionData {
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  stripePriceId: string;
  stripePaymentMethodId?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface SubscriptionStateWithStripe extends SubscriptionState {
  stripeData?: StripeSubscriptionData;
}

export type WebhookEventType =
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'customer.subscription.trial_will_end'
  | 'invoice.payment_succeeded'
  | 'invoice.payment_failed'
  | 'invoice.upcoming'
  | 'payment_method.attached'
  | 'payment_method.detached';

export interface WebhookEvent {
  id: string;
  stripeEventId: string;
  eventType: WebhookEventType;
  payload: any;
  processed: boolean;
  processedAt?: string;
  error?: string;
  createdAt: string;
}
```

### API Routes Structure

```
web/app/api/
├── stripe/
│   ├── create-checkout-session/
│   │   └── route.ts          # POST: Create Stripe Checkout Session
│   ├── create-portal-session/
│   │   └── route.ts          # POST: Create Customer Portal Session
│   ├── subscription/
│   │   ├── route.ts          # GET: Get current subscription
│   │   └── cancel/
│   │       └── route.ts      # POST: Cancel subscription
│   └── invoices/
│       └── route.ts          # GET: List customer invoices
├── webhooks/
│   └── stripe/
│       └── route.ts          # POST: Handle Stripe webhooks
└── [existing routes with added middleware]
    ├── tarot/
    ├── iching/
    ├── dream/
    ├── synastry/
    └── journal/
```

### Environment Variables

```bash
# Production
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Test/Staging
STRIPE_SECRET_KEY_TEST=sk_test_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST=pk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET_TEST=whsec_xxxxxxxxxxxxx

# Base URL for redirects
NEXT_PUBLIC_BASE_URL=https://app.ouros2.com

# Stripe Price IDs (from Stripe Dashboard)
STRIPE_PRICE_PREMIUM_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_PREMIUM_YEARLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_PRO_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_PRO_YEARLY=price_xxxxxxxxxxxxx
```

### Price Configuration Helper

```typescript
// web/lib/stripe/prices.ts

export const STRIPE_PRICES = {
  premium: {
    monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY!,
    yearly: process.env.STRIPE_PRICE_PREMIUM_YEARLY!,
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY!,
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY!,
  },
} as const;

export function getPriceId(tier: 'premium' | 'pro', interval: 'monthly' | 'yearly'): string {
  const priceId = STRIPE_PRICES[tier][interval];
  if (!priceId) {
    throw new Error(`No price ID configured for ${tier} ${interval}`);
  }
  return priceId;
}
```

---

## Security & Compliance

### PCI Compliance

✅ **No card data touches our servers**
- Use Stripe.js for payment form
- Use Stripe Checkout for hosted payment page
- Never log or store card numbers

✅ **Use Stripe Customer Portal**
- Pre-built, PCI-compliant UI
- Handles payment method updates
- Managed by Stripe

### Webhook Security

✅ **Verify signatures**
```typescript
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  webhookSecret
);
```

✅ **Idempotency**
```typescript
// Check if event already processed
const { data: existing } = await supabase
  .from('stripe_webhook_events')
  .select('processed')
  .eq('stripe_event_id', event.id)
  .single();

if (existing?.processed) {
  return new Response('Already processed', { status: 200 });
}
```

✅ **Rate limiting**
- Use Vercel rate limiting
- Or implement custom rate limiter

### Data Protection

✅ **GDPR Compliance**
- Allow users to export data
- Allow users to delete account
- Delete Stripe customer on account deletion

✅ **Audit Trail**
- Log all subscription changes to subscription_history
- Log all webhook events to stripe_webhook_events
- Log all feature access attempts (optional)

### API Security

✅ **Authentication**
- Require valid JWT on all API routes
- Use Supabase RLS policies

✅ **Authorization**
- Check subscription tier before processing
- Validate feature access server-side
- Never trust client-side checks

✅ **Input Validation**
- Validate all user inputs
- Sanitize data before database queries
- Use TypeScript for type safety

---

## Testing Strategy

### Unit Tests

```typescript
// Example: Feature gate middleware test
describe('requireFeature', () => {
  it('should allow access for premium user', async () => {
    // Mock user with premium tier
    // Call middleware
    // Assert no error response
  });

  it('should deny access for free user', async () => {
    // Mock user with free tier
    // Call middleware for premium feature
    // Assert 403 response
  });
});
```

### Integration Tests

```typescript
// Example: Checkout flow test
describe('Checkout flow', () => {
  it('should create checkout session', async () => {
    // Authenticate test user
    // Call create-checkout-session API
    // Assert session URL returned
  });

  it('should update subscription on webhook', async () => {
    // Create test subscription in Stripe
    // Trigger webhook
    // Assert subscription_state updated
  });
});
```

### End-to-End Tests

**Manual Testing Checklist:**
- [ ] Sign up as new user (should be free tier)
- [ ] Click upgrade button
- [ ] Complete checkout with test card (4242 4242 4242 4242)
- [ ] Verify subscription updated after redirect
- [ ] Test premium feature (should work)
- [ ] Test pro-only feature (should be blocked for premium)
- [ ] Open customer portal
- [ ] Update payment method
- [ ] Cancel subscription
- [ ] Verify subscription marked as cancelled
- [ ] Reactivate subscription
- [ ] Test usage limits (daily tarot readings)

**Stripe Test Cards:**
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Auth Required: 4000 0025 0000 3155
Expired: 4000 0000 0000 0069
```

### Load Testing

- Simulate 100 concurrent users upgrading
- Simulate 1000 webhook events per minute
- Test API rate limits
- Test database connection pool

---

## Deployment Plan

### Pre-Deployment Checklist

**Code:**
- [ ] All tests passing
- [ ] No console.errors or warnings
- [ ] TypeScript strict mode enabled
- [ ] ESLint passing

**Configuration:**
- [ ] Stripe products & prices created
- [ ] Environment variables set in production
- [ ] Webhook endpoint configured in Stripe
- [ ] Customer Portal configured

**Database:**
- [ ] Migration script tested
- [ ] Backup created
- [ ] RLS policies verified

**Monitoring:**
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Analytics configured (PostHog, Mixpanel, etc.)
- [ ] Logging configured (Datadog, CloudWatch, etc.)

### Deployment Steps

1. **Deploy to Staging**
   - Run database migrations
   - Deploy code changes
   - Test with Stripe test mode
   - Verify webhook handling

2. **Smoke Test Staging**
   - Complete checkout flow
   - Trigger webhooks manually
   - Verify all features work

3. **Deploy to Production**
   - Enable maintenance mode (optional)
   - Run database migrations
   - Deploy code changes
   - Switch to Stripe live mode
   - Configure production webhook

4. **Post-Deployment**
   - Monitor error logs
   - Monitor Stripe events
   - Test production checkout (small amount)
   - Notify team of successful deployment

### Rollback Plan

**If critical issues found:**
1. Revert code deployment
2. Pause Stripe webhook (temporarily)
3. Investigate issue
4. Fix and redeploy

**Data rollback:**
- Keep subscription_history for audit
- Restore subscription_state from backup if needed
- Sync with Stripe as source of truth

---

## Monitoring & Analytics

### Key Metrics to Track

**Business Metrics:**
- Monthly Recurring Revenue (MRR)
- Churn rate
- Conversion rate (free → paid)
- Average revenue per user (ARPU)
- Customer lifetime value (LTV)

**Technical Metrics:**
- Checkout completion rate
- Webhook processing time
- API response times
- Error rates per endpoint
- Payment success/failure rate

**User Metrics:**
- Feature usage by tier
- Upgrade prompt impressions
- Cancellation reasons
- Support tickets related to billing

### Monitoring Setup

**Stripe Dashboard:**
- Monitor subscription events
- Track MRR and revenue
- View failed payments
- Check webhook delivery

**Application Monitoring:**
```typescript
// Example: Track checkout events
analytics.track('checkout_started', {
  tier: tier,
  interval: interval,
  user_id: user.id,
});

analytics.track('checkout_completed', {
  tier: tier,
  amount: amount,
  user_id: user.id,
});
```

**Alerts to Configure:**
- Payment failure rate > 5%
- Webhook delivery failure
- API error rate > 1%
- Subscription churn spike
- Unusual usage patterns

---

## Risk Assessment

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Webhook failures | Medium | High | Implement retry logic, idempotency, monitoring |
| Payment failures | High | Medium | Clear UX, email notifications, grace period |
| API downtime | Low | High | Redundancy, caching, graceful degradation |
| Data sync issues | Medium | High | Stripe as source of truth, reconciliation jobs |
| Security breach | Low | Critical | PCI compliance, regular audits, encryption |

### Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Low conversion | Medium | High | Clear value prop, competitive pricing, free trial |
| High churn | Medium | High | Feature improvements, customer feedback, retention campaigns |
| Tax compliance | Low | Medium | Use Stripe Tax or TaxJar integration |
| Fraud | Low | Medium | Stripe Radar, manual review for large amounts |
| Refund requests | Medium | Low | Clear refund policy, prorated refunds |

### Operational Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Support overload | Medium | Medium | Comprehensive docs, FAQ, chatbot |
| Manual intervention | Medium | Low | Automate as much as possible, admin tools |
| Stripe account issues | Low | Critical | Maintain good standing, responsive to Stripe |

---

## Appendix

### Useful Resources

**Stripe Documentation:**
- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Customer Portal](https://stripe.com/docs/billing/subscriptions/customer-portal)
- [Stripe Testing](https://stripe.com/docs/testing)

**Next.js Integration:**
- [Stripe Next.js Example](https://github.com/vercel/next.js/tree/canary/examples/with-stripe-typescript)
- [Stripe React Integration](https://stripe.com/docs/stripe-js/react)

**Supabase Integration:**
- [Supabase Auth with Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)

### Pricing Strategy Considerations

**Factors to Consider:**
- Competitor pricing (astrology apps, oracle apps)
- AI processing costs (Anthropic API costs)
- Target market willingness to pay
- Value perception
- Churn vs. revenue optimization

**Suggested Starting Prices:**
```
Free Tier: $0
- 1 tarot/iching per day
- Basic natal chart
- Daily horoscope

Premium: $9.99/month or $99/year
- Unlimited tarot/iching
- Dream interpretation
- Enhanced horoscope
- Limited synastry (3 charts)

Pro: $19.99/month or $199/year
- Everything in Premium
- Unlimited synastry
- Transits & progressions
- Priority AI processing
- Export readings
```

**A/B Testing Ideas:**
- Test different price points
- Test annual discount (e.g., 2 months free vs. 20% off)
- Test free trial length (7 days vs. 14 days)
- Test upgrade prompts (soft vs. hard paywalls)

### Migration Plan for Beta Users

**Current State:**
- All beta users have 'pro' tier

**Options:**

**Option 1: Grandfather Beta Users**
- Keep beta users on free 'pro' tier indefinitely
- Mark with `is_beta_user: true` flag
- Marketing: "Thank you for being an early supporter"

**Option 2: Trial Period**
- Give beta users 3-6 months of free 'pro'
- After trial, revert to 'free' or prompt to subscribe
- Send email 2 weeks before trial ends

**Option 3: Lifetime Discount**
- Offer beta users 50% off lifetime
- Create special discount codes in Stripe
- Marketing: "Early bird special"

**Recommendation:** Option 2 with 6-month trial
- Gives beta users time to see value
- Creates urgency before trial ends
- Smoothest transition to paid model

---

## Next Steps

### Immediate Actions (This Week)

1. **Decision Making**
   - Choose pricing strategy
   - Decide beta user migration plan
   - Set launch timeline

2. **Stripe Setup**
   - Create Stripe account (if not exists)
   - Create products and prices
   - Configure webhook endpoints

3. **Development Kickoff**
   - Review this plan with team
   - Create tickets/issues for each phase
   - Assign owners to each phase
   - Set up development/staging environments

### Phase 1 Kickoff (Next Week)

1. Install Stripe SDK
2. Create Stripe client utilities
3. Add environment variables
4. Create basic checkout session API (stub)
5. Create first integration test

---

## Questions to Resolve

1. **Pricing:**
   - What should the actual prices be?
   - Monthly only, or offer yearly?
   - Free trial period?

2. **Beta Users:**
   - How to handle existing pro users?
   - Migration timeline?
   - Communication plan?

3. **Tax:**
   - Do we need to collect sales tax?
   - Use Stripe Tax?
   - Which countries/regions?

4. **Features:**
   - Are current tier limits correct?
   - Any features missing?
   - Any features to add to paywall?

5. **Support:**
   - How to handle billing support?
   - Refund policy?
   - Cancellation policy?

---

**End of Implementation Plan**

*This document should be treated as a living document and updated as implementation progresses and requirements change.*
