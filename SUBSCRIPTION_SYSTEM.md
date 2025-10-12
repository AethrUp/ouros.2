# Subscription System Documentation

## Overview

This document describes the complete subscription system implementation for Ouros2, including feature limiting based on user subscription tiers for iOS users.

**Key Features:**
- ✅ Three subscription tiers: Free, Premium, Pro
- ✅ RevenueCat integration for iOS in-app purchases
- ✅ Supabase for subscription state management
- ✅ Usage tracking and limits
- ✅ Debug panel for testing without payment
- ✅ StoreKit configuration for local development
- ✅ Feature gates throughout the app

---

## Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                   SUBSCRIPTION FLOW                      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  User Authenticates                                      │
│         │                                                │
│         ▼                                                │
│  Initialize RevenueCat SDK ────────────┐                │
│         │                              │                │
│         ▼                              │                │
│  Load from Supabase ◄──────────────────┤                │
│  (Fast, local-first)                   │                │
│         │                              │                │
│         ▼                              │                │
│  Sync with RevenueCat ─────────────────┘                │
│  (Authoritative source)                                  │
│         │                                                │
│         ▼                                                │
│  Update Supabase if changed                              │
│         │                                                │
│         ▼                                                │
│  Feature Gates Check Access                              │
│         │                                                │
│         ├─► Has Access ──────► Allow Feature            │
│         │                                                │
│         └─► No Access ───────► Show Paywall             │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Source of Truth

- **Supabase**: PRIMARY source (fast, server-controlled)
- **RevenueCat**: AUTHORITATIVE source (validates real purchases)
- Feature gates ONLY read from Supabase

---

## Subscription Tiers

### Free Tier
- 1 tarot reading per day
- 1 I Ching reading per day
- Basic daily horoscope
- View natal chart (basic)
- 5 journal entries per month
- ❌ No dream interpretations
- ❌ No synastry features

### Premium Tier ($9.99/month or $79.99/year)
- ✅ Unlimited tarot readings
- ✅ Unlimited I Ching readings
- ✅ Unlimited dream interpretations
- ✅ Enhanced daily horoscope with cosmic weather
- ✅ Full natal chart with all aspects
- ✅ Unlimited journal entries
- ✅ Synastry compatibility (up to 3 saved charts)
- ✅ Daily synastry forecasts

### Pro Tier ($19.99/month or $159.99/year)
- ✅ Everything in Premium
- ✅ Unlimited synastry charts
- ✅ Priority AI processing
- ✅ Advanced chart features (transits, progressions)
- ✅ Export readings to PDF
- ✅ Unlimited social connections
- ✅ Advanced analytics

---

## Testing Without Payment

You have THREE ways to test subscriptions without paying:

### 1. Debug Panel (Recommended for Quick Testing)

**How to Access:**
1. Launch the app in development mode
2. Navigate to Profile screen
3. **Triple-tap** on the "Profile Screen" title
4. Debug panel opens

**What You Can Do:**
- Switch between Free/Premium/Pro instantly
- Reset usage counters
- View subscription state
- Sync with RevenueCat
- Test all feature gates

**Important:** Only available in `__DEV__` mode. Automatically disabled in production.

### 2. StoreKit Configuration File (Local Simulator Testing)

**Setup:**
1. Open project in Xcode
2. Go to Product > Scheme > Edit Scheme
3. Under Run > Options
4. Set StoreKit Configuration to `Ouros2.storekit`

**Testing:**
1. Run app in Xcode Simulator
2. Navigate to subscription screen
3. Click purchase buttons
4. Purchases are instant and FREE (no Apple servers)
5. Test renewals, cancellations, etc.

**Products Defined:**
- `com.ouros2.premium.monthly` - $9.99/month with 1-week trial
- `com.ouros2.premium.yearly` - $79.99/year with 1-week trial
- `com.ouros2.pro.monthly` - $19.99/month with 1-week trial
- `com.ouros2.pro.yearly` - $159.99/year with 1-week trial

### 3. Apple Sandbox Testing (TestFlight/Device)

**Setup:**
1. Create sandbox test account in App Store Connect
2. Settings > App Store > Sandbox Account
3. Sign in with test account

**Testing:**
1. Install via TestFlight or development build
2. Make purchases (FREE with sandbox account)
3. Tests full purchase flow with Apple servers
4. Validate RevenueCat integration

---

## Database Schema

### `subscription_state` Table

```sql
CREATE TABLE subscription_state (
  user_id UUID PRIMARY KEY,
  tier TEXT NOT NULL,  -- 'free', 'premium', 'pro'
  status TEXT NOT NULL,  -- 'active', 'trial', 'expired', 'cancelled', etc.
  platform TEXT,  -- 'ios', 'android', 'manual'
  revenue_cat_id TEXT,
  expires_at TIMESTAMPTZ,
  is_sandbox BOOLEAN,
  is_debug_override BOOLEAN,  -- TRUE if manually set via debug panel
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### `subscription_history` Table

Tracks all subscription changes for audit trail.

### `usage_tracking` Table

```sql
CREATE TABLE usage_tracking (
  user_id UUID,
  feature TEXT,  -- 'tarot', 'iching', 'dream', 'synastry', 'journal'
  count INTEGER,
  period TEXT,  -- 'daily', 'monthly'
  period_start TIMESTAMPTZ,
  PRIMARY KEY (user_id, feature, period, period_start)
);
```

### Supabase Functions

- `get_usage_count(user_id, feature, period)` - Get current usage
- `increment_usage(user_id, feature, period)` - Increment usage
- `check_feature_access(user_id, feature, tier, period)` - Check if can use feature
- `reset_expired_usage()` - Cleanup old usage (called by cron)

---

## Implementation Guide

### 1. Run Supabase Migration

```bash
# From your Supabase dashboard or CLI:
psql -f supabase_migration_subscription_system.sql
```

Or run via Supabase Dashboard:
1. Go to SQL Editor
2. Paste contents of `supabase_migration_subscription_system.sql`
3. Run

### 2. Configure RevenueCat

1. Sign up at [https://www.revenuecat.com/](https://www.revenuecat.com/)
2. Create a new iOS app project
3. Add your Bundle ID
4. Configure App Store Connect API key
5. Copy your API keys

**Update `src/services/subscriptionService.ts`:**

```typescript
const REVENUECAT_APPLE_API_KEY = __DEV__
  ? 'appl_YOUR_SANDBOX_API_KEY_HERE'  // Replace with your sandbox key
  : 'appl_YOUR_PRODUCTION_API_KEY_HERE'; // Replace with your production key
```

### 3. Configure Products in App Store Connect

1. Go to App Store Connect
2. My Apps > Your App > Subscriptions
3. Create subscription group: "Ouros Premium"
4. Create 4 subscriptions with these IDs:
   - `com.ouros2.premium.monthly`
   - `com.ouros2.premium.yearly`
   - `com.ouros2.pro.monthly`
   - `com.ouros2.pro.yearly`

### 4. Link Products in RevenueCat

1. Go to RevenueCat Dashboard
2. Products > Add Product
3. Add all 4 product IDs
4. Create Offerings:
   - **Premium**: Include monthly and yearly premium products
   - **Pro**: Include monthly and yearly pro products
5. Create Entitlements:
   - `premium` - Attached to premium products
   - `pro` - Attached to pro products

### 5. Test the Integration

**Using Debug Panel:**
```
1. Run app in dev mode
2. Profile screen → Triple-tap title
3. Set tier to "Premium"
4. Test all features
5. Reset usage counters
6. Set tier to "Free"
7. Verify limits work
```

**Using StoreKit Configuration:**
```
1. Configure Xcode scheme (see above)
2. Run in simulator
3. Navigate to Subscription screen
4. Test purchase flow
5. Verify subscription activates
6. Test cancellation
```

---

## Adding Feature Gates to Screens

Example from `TarotScreen.tsx`:

```typescript
import { useFeatureUsage } from '../hooks/useFeatureAccess';
import { UpgradePrompt } from '../components/UpgradePrompt';
import { PaywallModal } from '../components/PaywallModal';

export const TarotScreen = ({ navigation }: any) => {
  // Feature usage tracking
  const { canUse, currentUsage, limit, tier, useFeature } = useFeatureUsage('tarot');
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const handleStartReading = async () => {
    // Check if user can use this feature
    if (!canUse) {
      setShowUpgradePrompt(true);
      return;
    }

    // Increment usage counter
    try {
      await useFeature();
    } catch (error) {
      console.error('Failed to track usage:', error);
    }

    // Continue with feature...
  };

  return (
    <View>
      {/* Your screen content */}

      <UpgradePrompt
        visible={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        onUpgrade={() => {
          setShowUpgradePrompt(false);
          setShowPaywall(true);
        }}
        feature="tarot"
        currentTier={tier}
        currentUsage={currentUsage}
      />

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
      />
    </View>
  );
};
```

---

## Hooks Reference

### `useFeatureUsage(feature)`

Track and check usage limits for a feature.

```typescript
const {
  canUse,         // boolean - Can user use feature now?
  currentUsage,   // number - Current usage count
  limit,          // number | 'unlimited' - Usage limit
  tier,           // SubscriptionTier - Current tier
  isChecking,     // boolean - Loading state
  useFeature,     // function - Increment usage
  recheck,        // function - Recheck access
} = useFeatureUsage('tarot');
```

### `useSubscriptionTier()`

Get current subscription tier information.

```typescript
const {
  tier,           // 'free' | 'premium' | 'pro'
  status,         // 'active' | 'trial' | 'expired' | etc.
  isFree,         // boolean
  isPremium,      // boolean
  isPro,          // boolean
  isPaid,         // boolean (premium or pro)
  isActive,       // boolean
  isLoading,      // boolean
  subscriptionState,  // Full subscription state object
} = useSubscriptionTier();
```

### `useSubscription()`

Manage subscription actions (purchase, restore, etc.).

```typescript
const {
  subscriptionState,
  availablePackages,
  isPurchasing,
  purchaseError,
  loadPackages,
  purchasePackage,
  restorePurchases,
  syncWithRevenueCat,
  clearPurchaseError,
} = useSubscription();
```

### `useFeatureAccess(feature)`

Simple boolean check if user has access to a feature.

```typescript
const {
  hasAccess,      // boolean
  tier,           // SubscriptionTier
  isLoading,      // boolean
} = useFeatureAccess('dreamInterpretation');
```

---

## Utility Functions

### Feature Gates (`src/utils/featureGates.ts`)

```typescript
import { tierHasFeature, getTierLimit, isWithinUsageLimit } from '../utils/featureGates';

// Check if tier has feature
tierHasFeature('free', 'dreamInterpretation'); // false
tierHasFeature('premium', 'dreamInterpretation'); // true

// Get tier limit
getTierLimit('free', 'tarot'); // 1
getTierLimit('premium', 'tarot'); // 'unlimited'

// Check usage
isWithinUsageLimit('free', 'tarot', 0); // true
isWithinUsageLimit('free', 'tarot', 1); // false
```

---

## Navigation

### Subscription Screen

Navigate to subscription management:

```typescript
navigation.navigate('home', {
  screen: 'Subscription',
});
```

---

## Troubleshooting

### RevenueCat Not Initializing

**Problem:** RevenueCat fails to initialize.

**Solution:**
1. Check API key is correct
2. Verify Bundle ID matches RevenueCat project
3. Check console for error messages
4. Try sandbox API key first

### Purchases Not Working in Simulator

**Problem:** Can't test purchases in simulator.

**Solution:**
- Use StoreKit configuration file (see above)
- OR use debug panel to set tier manually
- Real purchases only work on physical devices with sandbox accounts

### Subscription State Not Syncing

**Problem:** Subscription state doesn't update after purchase.

**Solution:**
1. Check `syncWithRevenueCat()` is called after purchase
2. Verify Supabase RLS policies allow updates
3. Check Supabase service role key is configured
4. Use "Sync Subscription" button on Subscription screen

### Usage Counter Not Resetting

**Problem:** Daily usage counter doesn't reset.

**Solution:**
1. Check `reset_expired_usage()` function exists
2. Set up Supabase cron job to call it daily
3. OR use debug panel to reset manually

### Debug Panel Not Showing

**Problem:** Triple-tap doesn't open debug panel.

**Solution:**
- Only works in `__DEV__` mode
- Make sure running development build
- Try tapping slightly slower
- Check console for errors

---

## Production Checklist

Before releasing to production:

- [ ] Replace RevenueCat API keys with production keys
- [ ] Test all subscription flows on TestFlight
- [ ] Verify products are approved in App Store Connect
- [ ] Test restore purchases functionality
- [ ] Set up Supabase webhooks for RevenueCat
- [ ] Configure cron job for usage resets
- [ ] Test subscription expiration/renewal
- [ ] Verify RLS policies in Supabase
- [ ] Remove any test/debug code
- [ ] Test on multiple iOS versions
- [ ] Document customer support procedures

---

## Support & Maintenance

### Monitoring

Monitor these metrics:
- Active subscriptions by tier
- Conversion rates (free → premium → pro)
- Churn rate
- Feature usage by tier
- Purchase completion rate

### Customer Support

Common issues:
1. **"I paid but don't have access"** → Use "Restore Purchases"
2. **"How do I cancel?"** → Settings > Apple ID > Subscriptions
3. **"Can I get a refund?"** → Contact Apple Support (App Store policy)
4. **"Usage limit not updating"** → Check date/time settings, may need to wait 24h

### Webhook Setup (Optional but Recommended)

RevenueCat can send webhooks to update Supabase when:
- Purchase completed
- Subscription renewed
- Subscription cancelled
- Trial started/ended

Set up endpoint to receive and process these events.

---

## File Reference

### Core Files

- `src/types/subscription.ts` - Type definitions and tier limits
- `src/services/subscriptionService.ts` - RevenueCat integration
- `src/store/slices/subscriptionSlice.ts` - Zustand state management
- `src/hooks/useFeatureAccess.ts` - React hooks
- `src/utils/featureGates.ts` - Utility functions

### UI Components

- `src/components/PaywallModal.tsx` - Subscription purchase screen
- `src/components/UpgradePrompt.tsx` - Upgrade modal
- `src/components/DebugSubscriptionPanel.tsx` - Debug panel
- `src/screens/SubscriptionScreen.tsx` - Subscription management

### Configuration

- `Ouros2.storekit` - StoreKit configuration for local testing
- `supabase_migration_subscription_system.sql` - Database schema

---

## Next Steps

1. **Add more screens:** Apply feature gates to IChingScreen, DreamScreen, etc.
2. **Analytics:** Track conversion funnel
3. **A/B Testing:** Test different pricing/messaging
4. **Referral System:** Give rewards for referrals
5. **Lifetime Access:** One-time purchase option
6. **Family Sharing:** Enable iOS family sharing

---

## Questions?

For implementation questions or issues:
1. Check console logs (detailed logging included)
2. Use debug panel to inspect state
3. Review this documentation
4. Check RevenueCat dashboard for purchase data
5. Check Supabase logs for database issues
