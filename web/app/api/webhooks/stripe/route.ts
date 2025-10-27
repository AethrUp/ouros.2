import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { SubscriptionTier, SubscriptionStatus } from '@/types/subscription';
import Stripe from 'stripe';

/**
 * POST /api/webhooks/stripe
 * Handles Stripe webhook events
 *
 * Important: This route must receive the RAW body, not parsed JSON
 * Next.js handles this automatically for webhook routes
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    console.error('No stripe-signature header found');
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  // 1. Verify webhook signature
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET not configured');
    }

    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const error = err as Error;
    console.error('Webhook signature verification failed:', error.message);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // 2. Log the event
  console.log(`[Webhook] Received event: ${event.type} (${event.id})`);

  // Use admin client to bypass RLS policies (webhooks have no user session)
  const supabase = createAdminClient();

  // 3. Check for idempotency - have we processed this event before?
  const { data: existingEvent } = await supabase
    .from('stripe_webhook_events')
    .select('processed')
    .eq('stripe_event_id', event.id)
    .single();

  if (existingEvent?.processed) {
    console.log(`[Webhook] Event ${event.id} already processed, skipping`);
    return NextResponse.json({ received: true, skipped: true });
  }

  // 4. Store the webhook event for audit trail
  await supabase.from('stripe_webhook_events').insert({
    stripe_event_id: event.id,
    event_type: event.type,
    payload: event as any,
    processed: false,
  });

  // 5. Handle the event
  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    // 6. Mark event as processed
    await supabase
      .from('stripe_webhook_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('stripe_event_id', event.id);

    console.log(`[Webhook] Successfully processed event: ${event.id}`);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Webhook] Error processing event:', error);

    // Log the error to the webhook events table
    await supabase
      .from('stripe_webhook_events')
      .update({
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('stripe_event_id', event.id);

    // Return 500 so Stripe will retry
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle subscription created or updated
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const supabase = createAdminClient();

  const userId = subscription.metadata.user_id;
  const tier = subscription.metadata.tier as SubscriptionTier;

  if (!userId || !tier) {
    console.error('[Webhook] Missing metadata in subscription:', subscription.id);
    throw new Error('Missing user_id or tier in subscription metadata');
  }

  console.log(`[Webhook] Updating subscription for user ${userId} to ${tier} (status: ${subscription.status})`);

  // Map Stripe status to our status enum
  let status: SubscriptionStatus = 'active';
  switch (subscription.status) {
    case 'active':
      status = 'active';
      break;
    case 'trialing':
      status = 'trial';
      break;
    case 'canceled':
      status = 'cancelled';
      break;
    case 'past_due':
      status = 'grace_period';
      break;
    case 'unpaid':
    case 'incomplete_expired':
      status = 'expired';
      break;
    case 'incomplete':
    case 'paused':
      status = 'paused';
      break;
  }

  // Get the price ID and billing period from the first subscription item
  const firstItem = subscription.items.data[0];
  const priceId = firstItem?.price.id || null;

  // In Stripe API v2025-09-30, billing periods are on subscription items, not subscriptions
  const periodStart = firstItem?.current_period_start
    ? new Date(firstItem.current_period_start * 1000).toISOString()
    : new Date().toISOString();

  const periodEnd = firstItem?.current_period_end
    ? new Date(firstItem.current_period_end * 1000).toISOString()
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // Default to 30 days from now

  // Log if we're using fallback values
  if (!firstItem?.current_period_start || !firstItem?.current_period_end) {
    console.warn(`[Webhook] Using fallback dates for subscription ${subscription.id} - start: ${firstItem?.current_period_start}, end: ${firstItem?.current_period_end}`);
  }

  // Update subscription_state
  const { error: upsertError } = await supabase
    .from('subscription_state')
    .upsert(
      {
        user_id: userId,
        tier: tier,
        status: status,
        platform: 'web',
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer as string,
        stripe_price_id: priceId,
        current_period_start: periodStart,
        current_period_end: periodEnd,
        cancel_at_period_end: subscription.cancel_at_period_end,
        expires_at: periodEnd,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    );

  if (upsertError) {
    console.error('[Webhook] Failed to update subscription_state:', upsertError);
    throw upsertError;
  }

  // Log to subscription_history
  await supabase.from('subscription_history').insert({
    user_id: userId,
    tier: tier,
    status: status,
    platform: 'web',
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer as string,
    event_type: subscription.status === 'active' ? 'subscription_started' : 'subscription_updated',
  });

  console.log(`[Webhook] Successfully updated subscription for user ${userId}`);
}

/**
 * Handle subscription deleted/cancelled
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const supabase = createAdminClient();

  const userId = subscription.metadata.user_id;

  if (!userId) {
    console.error('[Webhook] Missing user_id in cancelled subscription:', subscription.id);
    throw new Error('Missing user_id in subscription metadata');
  }

  console.log(`[Webhook] Cancelling subscription for user ${userId}`);

  // Update subscription_state to cancelled
  const { error: updateError } = await supabase
    .from('subscription_state')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (updateError) {
    console.error('[Webhook] Failed to cancel subscription:', updateError);
    throw updateError;
  }

  // Log to subscription_history
  await supabase.from('subscription_history').insert({
    user_id: userId,
    tier: subscription.metadata.tier as SubscriptionTier || 'free',
    status: 'cancelled',
    platform: 'web',
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer as string,
    event_type: 'subscription_cancelled',
  });

  console.log(`[Webhook] Successfully cancelled subscription for user ${userId}`);
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const supabase = createAdminClient();

  // Get subscription from invoice (in API v2025-09-30, it's in parent.subscription_details)
  const subscriptionId = invoice.parent?.subscription_details?.subscription as string;
  if (!subscriptionId) {
    console.log('[Webhook] Invoice not related to subscription, skipping');
    return;
  }

  // Fetch the subscription to get metadata
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata.user_id;

  if (!userId) {
    console.error('[Webhook] Missing user_id in subscription metadata');
    return;
  }

  console.log(`[Webhook] Payment succeeded for user ${userId}`);

  // Log to subscription_history
  await supabase.from('subscription_history').insert({
    user_id: userId,
    tier: subscription.metadata.tier as SubscriptionTier || 'free',
    status: 'active',
    platform: 'web',
    stripe_subscription_id: subscriptionId,
    stripe_customer_id: subscription.customer as string,
    event_type: 'payment_succeeded',
  });

  // You could send a receipt email here
  console.log(`[Webhook] Logged payment success for user ${userId}`);
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const supabase = createAdminClient();

  // Get subscription from invoice (in API v2025-09-30, it's in parent.subscription_details)
  const subscriptionId = invoice.parent?.subscription_details?.subscription as string;
  if (!subscriptionId) {
    console.log('[Webhook] Invoice not related to subscription, skipping');
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata.user_id;

  if (!userId) {
    console.error('[Webhook] Missing user_id in subscription metadata');
    return;
  }

  console.log(`[Webhook] Payment failed for user ${userId}`);

  // Update to grace period if subscription is past_due
  if (subscription.status === 'past_due') {
    await supabase
      .from('subscription_state')
      .update({
        status: 'grace_period',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
  }

  // Log to subscription_history
  await supabase.from('subscription_history').insert({
    user_id: userId,
    tier: subscription.metadata.tier as SubscriptionTier || 'free',
    status: 'grace_period',
    platform: 'web',
    stripe_subscription_id: subscriptionId,
    stripe_customer_id: subscription.customer as string,
    event_type: 'payment_failed',
  });

  // You could send a payment failure email here
  console.log(`[Webhook] Logged payment failure for user ${userId}`);
}

/**
 * Handle trial ending soon
 */
async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.user_id;

  if (!userId) {
    console.error('[Webhook] Missing user_id in trial subscription');
    return;
  }

  console.log(`[Webhook] Trial will end soon for user ${userId}`);

  // You could send a reminder email here
  // For now, just log it
  console.log(`[Webhook] Trial ends at: ${new Date(subscription.trial_end! * 1000).toISOString()}`);
}
