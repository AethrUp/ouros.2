import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';
import { getPriceId, type StripeTier, type StripeBillingInterval } from '@/lib/stripe/prices';

/**
 * POST /api/stripe/create-checkout-session
 * Creates a Stripe Checkout Session for subscription purchase
 *
 * Request body:
 * {
 *   tier: 'premium' | 'pro',
 *   interval: 'monthly' | 'yearly'
 * }
 *
 * Returns:
 * {
 *   url: string // Stripe Checkout URL to redirect to
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to upgrade your subscription.' },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const { tier, interval } = body;

    // Validate tier
    if (!tier || !['premium', 'pro'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be "premium" or "pro".' },
        { status: 400 }
      );
    }

    // Validate interval
    if (!interval || !['monthly', 'yearly'].includes(interval)) {
      return NextResponse.json(
        { error: 'Invalid interval. Must be "monthly" or "yearly".' },
        { status: 400 }
      );
    }

    // 3. Get the Stripe Price ID for this tier/interval combination
    let priceId: string;
    try {
      priceId = getPriceId(tier as StripeTier, interval as StripeBillingInterval);
    } catch (error) {
      console.error('Failed to get price ID:', error);
      return NextResponse.json(
        { error: 'Price configuration error. Please contact support.' },
        { status: 500 }
      );
    }

    // 4. Check if user already has an active subscription
    const { data: existingSubscription } = await supabase
      .from('subscription_state')
      .select('tier, status, stripe_subscription_id')
      .eq('user_id', user.id)
      .single();

    if (existingSubscription?.status === 'active' && existingSubscription.stripe_subscription_id) {
      // User already has an active Stripe subscription
      // We could handle upgrades/downgrades here in the future
      // For now, direct them to the customer portal
      return NextResponse.json(
        {
          error: 'You already have an active subscription. Use the billing portal to manage it.',
          redirectToPortal: true,
        },
        { status: 400 }
      );
    }

    // 5. Create Stripe Checkout Session
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: user.email,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/subscription/cancel`,
      metadata: {
        user_id: user.id,
        tier: tier,
        interval: interval,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          tier: tier,
          interval: interval,
        },
      },
      allow_promotion_codes: true, // Allow users to enter coupon codes
      billing_address_collection: 'auto',
    });

    // 6. Return the checkout URL
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session. Please try again.' },
      { status: 500 }
    );
  }
}
