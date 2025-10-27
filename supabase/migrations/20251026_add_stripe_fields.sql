-- Migration: Add Stripe Integration Fields
-- Date: 2025-10-26
-- Description: Adds Stripe-specific fields to subscription_state and creates webhook events table

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
