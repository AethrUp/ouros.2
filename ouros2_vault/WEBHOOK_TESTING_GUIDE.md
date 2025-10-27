# Webhook Testing Guide

**Purpose**: Test Stripe webhooks locally using Stripe CLI
**Date**: 2025-10-26
**Phase**: Phase 3 - Webhook Integration

---

## Overview

Webhooks are how Stripe communicates subscription events to your application. When a user subscribes, Stripe sends events like `customer.subscription.created` to your webhook endpoint.

**Problem**: Stripe can't reach `localhost` directly from the internet.

**Solution**: Use Stripe CLI to forward webhook events to your local dev server.

---

## Prerequisites

✅ Phase 2 complete (checkout flow working)
✅ Database migration run (Stripe fields added)
✅ Webhook handler created (`/api/webhooks/stripe`)
✅ Dev server running (`npm run dev` in `web/`)

---

## Step 1: Install Stripe CLI

### Windows

**Option A: Using Scoop**
```bash
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

**Option B: Direct Download**
1. Download from: https://github.com/stripe/stripe-cli/releases/latest
2. Extract `stripe.exe` to a folder
3. Add folder to your PATH

### Mac

```bash
brew install stripe/stripe-cli/stripe
```

### Linux

```bash
# Download latest release
wget https://github.com/stripe/stripe-cli/releases/download/v1.19.4/stripe_1.19.4_linux_x86_64.tar.gz

# Extract
tar -xvf stripe_1.19.4_linux_x86_64.tar.gz

# Move to /usr/local/bin
sudo mv stripe /usr/local/bin/
```

### Verify Installation

```bash
stripe --version
```

Should show: `stripe version X.X.X`

---

## Step 2: Login to Stripe

```bash
stripe login
```

This will:
1. Open your browser
2. Ask you to allow access
3. Generate an API key for the CLI

You should see:
```
✔ Done! The Stripe CLI is configured for [YOUR ACCOUNT]
```

---

## Step 3: Forward Webhooks to Localhost

### Start the Webhook Forwarder

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**Important**: Keep this terminal window open!

You should see:
```
> Ready! You are using Stripe API Version [2024-XX-XX]. Your webhook signing secret is whsec_xxxxx...
```

### Copy the Webhook Secret

The CLI will display a webhook signing secret like:
```
whsec_abc123def456...
```

**Copy this secret!** You need it in your `.env.local`

---

## Step 4: Update Environment Variables

Open `web/.env.local` and update:

```bash
# Replace with the secret from Step 3
STRIPE_WEBHOOK_SECRET=whsec_abc123def456...
```

**Important**: Restart your dev server after updating!

```bash
# In web/ directory
npm run dev
```

---

## Step 5: Test the Webhook Flow

Now you have:
- ✅ Dev server running on `localhost:3000`
- ✅ Stripe CLI forwarding webhooks
- ✅ Webhook secret configured

### Test End-to-End

1. **Visit pricing page**:
   ```
   http://localhost:3000/pricing
   ```

2. **Click "Upgrade to Premium"**

3. **Complete checkout** with test card:
   ```
   Card: 4242 4242 4242 4242
   Expiry: Any future date (e.g., 12/34)
   CVC: Any 3 digits (e.g., 123)
   ```

4. **Watch the Stripe CLI terminal**:
   You should see events streaming in:
   ```
   2025-10-26 12:34:56   --> customer.subscription.created [evt_abc123]
   2025-10-26 12:34:57   <--  [200] POST http://localhost:3000/api/webhooks/stripe [evt_abc123]
   2025-10-26 12:34:58   --> invoice.payment_succeeded [evt_def456]
   2025-10-26 12:34:59   <--  [200] POST http://localhost:3000/api/webhooks/stripe [evt_def456]
   ```

5. **Check your dev server logs**:
   You should see:
   ```
   [Webhook] Received event: customer.subscription.created (evt_abc123)
   [Webhook] Updating subscription for user xxx to premium
   [Webhook] Successfully updated subscription for user xxx
   [Webhook] Successfully processed event: evt_abc123
   ```

6. **Verify database**:
   Go to Supabase and check `subscription_state` table:
   - User's `tier` should be 'premium' (or 'pro')
   - `status` should be 'active'
   - `stripe_subscription_id` should be populated
   - `platform` should be 'web'

---

## Step 6: Test Individual Events

You can trigger specific webhook events without going through checkout:

### Test Subscription Created

```bash
stripe trigger customer.subscription.created
```

**Note**: This creates a test subscription WITHOUT metadata, so it may fail.
For a complete test, use the actual checkout flow.

### Test Payment Succeeded

```bash
stripe trigger invoice.payment_succeeded
```

### Test Payment Failed

```bash
stripe trigger invoice.payment_failed
```

### Test Subscription Deleted

```bash
stripe trigger customer.subscription.deleted
```

---

## Troubleshooting

### Issue: "Webhook signature verification failed"

**Cause**: Webhook secret doesn't match

**Fix**:
1. Check `STRIPE_WEBHOOK_SECRET` in `.env.local`
2. Make sure it matches the secret from `stripe listen`
3. Restart dev server after changing

### Issue: "No stripe-signature header found"

**Cause**: Request isn't coming from Stripe CLI

**Fix**:
- Make sure `stripe listen` is running
- Check that it's forwarding to correct URL
- Try restarting `stripe listen`

### Issue: "Missing user_id in subscription metadata"

**Cause**: Event was triggered manually without metadata

**Fix**:
- Use actual checkout flow for complete testing
- Manual triggers (`stripe trigger`) don't include custom metadata

### Issue: Events not showing in Stripe CLI

**Cause**: CLI not running or connected

**Fix**:
```bash
# Restart Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### Issue: Database not updating

**Check**:
1. Webhook logs in terminal (dev server)
2. Webhook events in Supabase (`stripe_webhook_events` table)
3. Subscription state in Supabase (`subscription_state` table)

---

## Verification Checklist

After completing a test checkout:

### ✅ Stripe CLI Shows Events
- [ ] `customer.subscription.created` received
- [ ] `invoice.payment_succeeded` received
- [ ] Both returned `200` status

### ✅ Server Logs Show Processing
- [ ] "Webhook received" messages
- [ ] "Updating subscription" messages
- [ ] "Successfully processed" messages
- [ ] No error messages

### ✅ Database Updated
- [ ] Check `subscription_state`:
  - [ ] `tier` = 'premium' or 'pro'
  - [ ] `status` = 'active'
  - [ ] `stripe_subscription_id` populated
  - [ ] `stripe_customer_id` populated
  - [ ] `current_period_end` has future date
  - [ ] `platform` = 'web'

- [ ] Check `subscription_history`:
  - [ ] New row with 'subscription_started' event
  - [ ] New row with 'payment_succeeded' event

- [ ] Check `stripe_webhook_events`:
  - [ ] Events logged with correct type
  - [ ] `processed` = true
  - [ ] `processed_at` has timestamp
  - [ ] No `error` field

### ✅ User Experience
- [ ] After checkout, user redirects to success page
- [ ] Success page shows confirmation
- [ ] User can access premium features (test in Phase 4)

---

## Common Webhook Events Flow

### Successful Subscription

```
1. customer.subscription.created
   ↓ Webhook creates subscription_state

2. invoice.payment_succeeded
   ↓ Webhook logs payment success

3. User has active subscription! ✅
```

### Failed Payment

```
1. invoice.payment_failed
   ↓ Webhook sets status to 'grace_period'

2. customer.subscription.updated (status: past_due)
   ↓ Webhook keeps status as 'grace_period'

3. invoice.payment_failed (retry)
   ↓ Still in grace period

4. customer.subscription.deleted (if all retries fail)
   ↓ Webhook sets status to 'cancelled'
```

### Subscription Cancelled

```
1. customer.subscription.updated (cancel_at_period_end: true)
   ↓ Webhook updates cancel_at_period_end flag
   ↓ Subscription stays active until period end

2. customer.subscription.deleted (at period end)
   ↓ Webhook sets status to 'cancelled'
```

---

## Advanced: Testing Specific Scenarios

### Test Subscription Upgrade

1. Create a Premium subscription
2. In Stripe Dashboard, upgrade to Pro
3. Watch for `customer.subscription.updated` event
4. Verify tier changes in database

### Test Subscription Cancellation

1. Create a subscription via checkout
2. In Stripe Dashboard, cancel the subscription
3. Watch for `customer.subscription.deleted` event
4. Verify status changes to 'cancelled'

### Test Payment Failure

1. Create subscription with test card
2. In Stripe Dashboard, simulate payment failure
3. Watch for `invoice.payment_failed` event
4. Verify status changes to 'grace_period'

---

## Production Webhook Setup

When you're ready to deploy to production:

### 1. Create Production Webhook Endpoint

1. Go to: https://dashboard.stripe.com/webhooks
2. Switch to **Live mode**
3. Click **+ Add endpoint**
4. URL: `https://yourdomain.com/api/webhooks/stripe`
5. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.trial_will_end`

6. Click **Add endpoint**

### 2. Get Production Webhook Secret

1. Click on the endpoint you just created
2. Click **Reveal** under "Signing secret"
3. Copy the secret (starts with `whsec_...`)

### 3. Update Production Environment

Add to your production `.env`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_[PRODUCTION_SECRET]
```

**Important**: Different from local development secret!

---

## Webhook Event Reference

### Events We Handle

| Event | What It Means | What We Do |
|-------|---------------|------------|
| `customer.subscription.created` | New subscription created | Create/update `subscription_state`, set tier to premium/pro, status to active |
| `customer.subscription.updated` | Subscription changed | Update tier, status, or period end date |
| `customer.subscription.deleted` | Subscription cancelled | Set status to 'cancelled' |
| `invoice.payment_succeeded` | Payment succeeded | Log to history, ensure status is active |
| `invoice.payment_failed` | Payment failed | Set status to 'grace_period', log failure |
| `customer.subscription.trial_will_end` | Trial ending soon | Log warning (could send email) |

### Events We Don't Handle (Yet)

- `payment_method.attached` - New payment method added
- `payment_method.detached` - Payment method removed
- `invoice.upcoming` - Invoice will be sent soon (good for reminders)
- `charge.refunded` - Payment refunded

These can be added later if needed.

---

## Debugging Tips

### Enable Verbose Logging

In your webhook handler, all events are already logged to console.

Watch your dev server terminal for:
```
[Webhook] Received event: customer.subscription.created (evt_123)
[Webhook] Updating subscription for user abc123 to premium
[Webhook] Successfully updated subscription for user abc123
```

### Check Webhook Events Table

Query Supabase:
```sql
SELECT * FROM stripe_webhook_events
ORDER BY created_at DESC
LIMIT 10;
```

Look for:
- `processed = false` (events that failed)
- `error IS NOT NULL` (events with errors)

### Replay Failed Events

If an event failed, you can replay it:

```bash
stripe events resend evt_123456
```

---

## Summary

### Quick Start

```bash
# Terminal 1: Start dev server
cd web
npm run dev

# Terminal 2: Start Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Copy the webhook secret to web/.env.local
# Restart dev server

# Test: Complete a checkout at localhost:3000/pricing
# Watch events in Terminal 2
# Check database in Supabase
```

### What Success Looks Like

✅ Stripe CLI shows events being forwarded
✅ Dev server logs show "Successfully processed"
✅ Database has new subscription record
✅ User's tier is updated
✅ No errors in logs

---

**Status**: ✅ Ready to test webhooks
**Next**: Test end-to-end checkout + webhook flow
