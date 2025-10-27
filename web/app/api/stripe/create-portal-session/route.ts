import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';

/**
 * POST /api/stripe/create-portal-session
 * Creates a Stripe Customer Portal session for subscription management
 *
 * The Customer Portal allows users to:
 * - View subscription details
 * - Update payment method
 * - View billing history and invoices
 * - Cancel or reactivate subscription
 * - Update billing information
 *
 * Returns:
 * {
 *   url: string // Stripe Customer Portal URL to redirect to
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
        { error: 'Unauthorized. Please log in to manage your subscription.' },
        { status: 401 }
      );
    }

    // 2. Get Stripe customer ID from subscription_state
    const { data: subState, error: subError } = await supabase
      .from('subscription_state')
      .select('stripe_customer_id, tier, status')
      .eq('user_id', user.id)
      .single();

    if (subError || !subState) {
      return NextResponse.json(
        { error: 'No subscription found. Please subscribe to a plan first.' },
        { status: 404 }
      );
    }

    if (!subState.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No Stripe customer found. Please contact support.' },
        { status: 404 }
      );
    }

    // 3. Create Stripe Customer Portal session
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const session = await stripe.billingPortal.sessions.create({
      customer: subState.stripe_customer_id,
      return_url: `${baseUrl}/profile`, // Where to return after managing subscription
    });

    // 4. Return the portal URL
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session. Please try again.' },
      { status: 500 }
    );
  }
}
