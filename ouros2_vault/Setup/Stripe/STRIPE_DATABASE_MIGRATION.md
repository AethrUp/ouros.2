# Stripe Database Migration SQL

**Migration File**: `supabase/migrations/20251026_add_stripe_fields.sql`
**Date**: 2025-10-26
**Status**: Ready to run
**Purpose**: Add Stripe integration fields to support web-based subscriptions

---

## Overview

This migration adds all necessary database schema changes to support Stripe payment integration for the Ouros2 web application. It adds Stripe-specific fields to existing subscription tables and creates a new webhook events logging table.

---

## How to Run This Migration

### Option 1: Supabase SQL Editor (Recommended)

1. Go to: [Supabase SQL Editor](https://supabase.com/dashboard/project/rhchespvbiesrplsdkiz/sql)
2. Copy the SQL below
3. Paste into the SQL Editor
4. Click "Run"

### Option 2: Automated Script

```bash
node run-stripe-migration.js
```
(Requires `SUPABASE_SERVICE_KEY` environment variable)

---

## Migration SQL

```sql
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
```

---

## What This Migration Does

### 1. Updates `subscription_state` Table

Adds the following columns:

| Column | Type | Description |
|--------|------|-------------|
| `stripe_subscription_id` | TEXT (UNIQUE) | Stripe's subscription ID (e.g., `sub_1Abc...`) |
| `stripe_customer_id` | TEXT | Stripe's customer ID (e.g., `cus_1Abc...`) |
| `stripe_price_id` | TEXT | Stripe's price ID (e.g., `price_1Abc...`) |
| `stripe_payment_method_id` | TEXT | Stripe's payment method ID (e.g., `pm_1Abc...`) |
| `current_period_start` | TIMESTAMPTZ | Start of current billing period |
| `current_period_end` | TIMESTAMPTZ | End of current billing period |
| `cancel_at_period_end` | BOOLEAN | Whether subscription will cancel at period end |

**Indexes created**:
- `idx_subscription_state_stripe_subscription_id` - Fast lookup by Stripe subscription ID
- `idx_subscription_state_stripe_customer_id` - Fast lookup by Stripe customer ID

### 2. Updates Platform Constraint

Adds `'web'` to the allowed platform values:
- Before: `'ios' | 'android' | 'manual'`
- After: `'ios' | 'android' | 'manual' | 'web'`

### 3. Updates `subscription_history` Table

Adds columns for audit trail:
- `stripe_subscription_id` - Links history to Stripe subscription
- `stripe_customer_id` - Links history to Stripe customer
- `stripe_event_id` - Links history to specific Stripe webhook event

### 4. Creates `stripe_webhook_events` Table

New table to log all webhook events from Stripe:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `stripe_event_id` | TEXT (UNIQUE) | Stripe's event ID (for idempotency) |
| `event_type` | TEXT | Event type (e.g., `customer.subscription.created`) |
| `payload` | JSONB | Full webhook payload from Stripe |
| `processed` | BOOLEAN | Whether event has been processed |
| `processed_at` | TIMESTAMPTZ | When event was processed |
| `error` | TEXT | Error message if processing failed |
| `created_at` | TIMESTAMPTZ | When event was received |

**Indexes created**:
- `idx_stripe_webhook_events_stripe_event_id` - Fast lookup by event ID
- `idx_stripe_webhook_events_processed` - Fast filtering of unprocessed events
- `idx_stripe_webhook_events_event_type` - Fast filtering by event type

**RLS Policy**:
- Only service role can read/write webhook events (for security)

---

## Safety Features

This migration is safe to run multiple times:

✅ All `ALTER TABLE` statements use `IF NOT EXISTS`
✅ All `CREATE INDEX` statements use `IF NOT EXISTS`
✅ All `CREATE TABLE` statements use `IF NOT EXISTS`
✅ Constraint drop uses `IF EXISTS` before recreating

**Result**: Running this migration multiple times will not cause errors or duplicate data.

---

## Rollback (if needed)

If you need to rollback this migration:

```sql
-- Remove Stripe fields from subscription_state
ALTER TABLE subscription_state DROP COLUMN IF EXISTS stripe_subscription_id;
ALTER TABLE subscription_state DROP COLUMN IF EXISTS stripe_customer_id;
ALTER TABLE subscription_state DROP COLUMN IF EXISTS stripe_price_id;
ALTER TABLE subscription_state DROP COLUMN IF EXISTS stripe_payment_method_id;
ALTER TABLE subscription_state DROP COLUMN IF EXISTS current_period_start;
ALTER TABLE subscription_state DROP COLUMN IF EXISTS current_period_end;
ALTER TABLE subscription_state DROP COLUMN IF EXISTS cancel_at_period_end;

-- Remove Stripe fields from subscription_history
ALTER TABLE subscription_history DROP COLUMN IF EXISTS stripe_subscription_id;
ALTER TABLE subscription_history DROP COLUMN IF EXISTS stripe_customer_id;
ALTER TABLE subscription_history DROP COLUMN IF EXISTS stripe_event_id;

-- Drop webhook events table
DROP TABLE IF EXISTS stripe_webhook_events;

-- Restore old platform constraint
ALTER TABLE subscription_state DROP CONSTRAINT IF EXISTS subscription_state_platform_check;
ALTER TABLE subscription_state ADD CONSTRAINT subscription_state_platform_check
  CHECK (platform IN ('ios', 'android', 'manual'));
```

---

## Verification

After running the migration, verify it worked:

```sql
-- Check that new columns exist in subscription_state
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'subscription_state'
  AND column_name LIKE 'stripe%';

-- Check that webhook events table was created
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'stripe_webhook_events';

-- Check that indexes were created
SELECT indexname
FROM pg_indexes
WHERE tablename IN ('subscription_state', 'stripe_webhook_events');
```

Expected results:
- 4 columns starting with `stripe_` in `subscription_state`
- 1 table named `stripe_webhook_events`
- 5 indexes created (2 on subscription_state, 3 on stripe_webhook_events)

---

## Next Steps After Migration

1. ✅ Migration complete
2. Set up Stripe environment variables (see `STRIPE_ENV_SETUP.md`)
3. Proceed to Phase 2: Checkout Flow implementation
4. Test subscription creation and webhook processing

---

## Related Documentation

- **Setup Guide**: `STRIPE_ENV_SETUP.md` - Environment configuration
- **Implementation Plan**: `STRIPE_IMPLEMENTATION_PLAN.md` - Full architecture
- **Phase 1 Complete**: `PHASE_1_COMPLETE.md` - Foundation summary

---

**Migration Status**: ✅ Ready to run
**Safe to re-run**: Yes (idempotent)
**Breaking changes**: None
**Data loss risk**: None
