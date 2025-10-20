# Subscription Tiers & Feature Limits

**Last Updated:** 2025-10-17
**Version:** 1.1 - Proposed Synastry Tiering Changes

## Overview

Ouros uses a three-tier subscription model: **Free**, **Premium**, and **Pro**. This document defines the feature access and usage limits for each tier.

---

## Subscription Tiers

### Free Tier
The free tier provides basic access to core features with daily usage limits. This tier is designed to give users a taste of the app's capabilities while encouraging upgrade to paid tiers for unlimited access.

**Price:** Free
**Target User:** New users, casual users exploring the app

### Premium Tier
The premium tier unlocks unlimited access to oracle features, enhanced horoscopes, full natal chart analysis, and basic synastry features. Ideal for regular users who want daily guidance without limitations.

**Price:** TBD (monthly/yearly options)
**Target User:** Daily users seeking regular spiritual guidance and insights

### Pro Tier
The pro tier provides complete access to all features, including advanced astrological tools, unlimited synastry charts, priority AI processing, and export capabilities. Designed for serious practitioners and astrology enthusiasts.

**Price:** TBD (monthly/yearly options)
**Target User:** Advanced users, professional astrologers, serious practitioners

---

## Usage Limits by Feature

Usage limits control how many times a user can access certain features within a specific time period (daily or monthly).

### Oracle Features

#### Tarot Readings
- **Free:** 1 reading per day
- **Premium:** Unlimited
- **Pro:** Unlimited

**Implementation Status:** ✅ Fully implemented
**Tracking Period:** Daily
**Reset:** Midnight UTC

#### I Ching Readings
- **Free:** 1 reading per day
- **Premium:** Unlimited
- **Pro:** Unlimited

**Implementation Status:** ⚠️ Limits defined, UI gating needed
**Tracking Period:** Daily
**Reset:** Midnight UTC

#### Dream Interpretations
- **Free:** Not available (0 per day)
- **Premium:** Unlimited
- **Pro:** Unlimited

**Implementation Status:** ⚠️ Limits defined, UI gating needed
**Tracking Period:** Daily
**Reset:** Midnight UTC

### Synastry Features

#### Synastry Compatibility Charts
- **Free:** 1 saved chart (gateway feature to try synastry)
- **Premium:** Up to 5 saved charts
- **Pro:** Unlimited saved charts

**Implementation Status:** ⚠️ Limits defined, enforcement needed
**Tracking Period:** Total saved (not time-based)
**Reset:** N/A (persistent storage limit)

**Rationale:** Free tier gets 1 chart to experience synastry value. Premium gets 5 charts for core relationships (partner, family, close friends). Pro gets unlimited for professional use.

#### Daily Synastry Forecasts
- **Free:** Not available
- **Premium:** Not available (static compatibility analysis only)
- **Pro:** Available (unlimited daily forecasts for all saved charts)

**Implementation Status:** ⚠️ Feature access flag exists, needs to be changed to Pro-only
**Tracking Period:** N/A (feature flag)

**Rationale:** Daily forecasts are AI-intensive and high-engagement. Making them Pro-only creates clear value differentiation: Premium = one-time analysis, Pro = ongoing dynamic insights.

### Journal Features

#### Journal Entries
- **Free:** 5 entries per month
- **Premium:** Unlimited
- **Pro:** Unlimited

**Implementation Status:** ⚠️ Limits defined, UI gating needed
**Tracking Period:** Monthly
**Reset:** First day of each month

### Chart Storage

#### Saved Natal/Transit Charts
- **Free:** Not available (0 saved charts)
- **Premium:** Up to 3 saved charts
- **Pro:** Unlimited saved charts

**Implementation Status:** ❌ Limits defined, not enforced
**Tracking Period:** Total saved (not time-based)
**Reset:** N/A (persistent storage limit)

---

## Feature Access by Tier

Feature access flags control whether a user can access specific features or enhanced versions of features.

### Oracle Features

| Feature | Free | Premium | Pro | Notes |
|---------|------|---------|-----|-------|
| Tarot Reading | ✅ | ✅ | ✅ | Daily limit applies for Free |
| I Ching Reading | ✅ | ✅ | ✅ | Daily limit applies for Free |
| Dream Interpretation | ❌ | ✅ | ✅ | Premium+ only |

### Horoscope Features

| Feature | Free | Premium | Pro | Notes |
|---------|------|---------|-----|-------|
| Daily Horoscope | ✅ | ✅ | ✅ | Basic version for all users |
| Enhanced Horoscope | ❌ | ✅ | ✅ | Deeper insights, more detail |
| Cosmic Weather | ❌ | ✅ | ✅ | Planetary movements & aspects |

**Implementation Status:** ⚠️ Enhanced features defined but not differentiated in UI

### Natal Chart Features

| Feature | Free | Premium | Pro | Notes |
|---------|------|---------|-----|-------|
| Basic Natal Chart | ✅ | ✅ | ✅ | Essential planets & houses |
| Full Natal Chart | ❌ | ✅ | ✅ | Complete analysis with all points |
| Transits | ❌ | ❌ | ✅ | Current planetary transits |
| Progressions | ❌ | ❌ | ✅ | Secondary progressions |

**Implementation Status:** ⚠️ Basic vs. Full chart not differentiated; Transits/Progressions not implemented

### Social/Relationship Features

| Feature | Free | Premium | Pro | Notes |
|---------|------|---------|-----|-------|
| Synastry Compatibility | ✅ | ✅ | ✅ | 1 chart for Free, 5 for Premium |
| Daily Synastry Forecast | ❌ | ❌ | ✅ | **Pro only** - Daily AI-powered insights |
| Unlimited Charts | ❌ | ❌ | ✅ | Storage limit of 5 for Premium |

### Journal Features

| Feature | Free | Premium | Pro | Notes |
|---------|------|---------|-----|-------|
| Journal Entries | ✅ | ✅ | ✅ | 5/month for Free |
| Unlimited Journal | ❌ | ✅ | ✅ | No monthly limit |

### Premium Perks

| Feature | Free | Premium | Pro | Notes |
|---------|------|---------|-----|-------|
| Priority AI | ❌ | ❌ | ✅ | Faster AI processing queue |
| Export Readings | ❌ | ❌ | ✅ | PDF/share functionality |
| No Ads | ✅ | ✅ | ✅ | Currently no ads in any tier |

**Implementation Status:** ❌ Priority AI and Export not implemented

---

## Technical Implementation

### Database Tables

#### subscription_state
Stores the user's current subscription tier and status.

**Fields:**
- `user_id` (UUID, PK)
- `tier` (enum: 'free', 'premium', 'pro')
- `status` (enum: 'active', 'trial', 'expired', 'cancelled', 'grace_period', 'paused')
- `platform` ('ios', 'android', 'manual')
- `revenue_cat_id` (string, nullable)
- `expires_at` (timestamp, nullable)
- `is_sandbox` (boolean)
- `is_debug_override` (boolean)
- `updated_at` (timestamp)

#### usage_tracking
Tracks feature usage counts per user per period.

**Fields:**
- `user_id` (UUID)
- `feature` (enum: 'tarot', 'iching', 'dream', 'synastry', 'journal')
- `count` (integer)
- `period` (enum: 'daily', 'monthly')
- `period_start` (timestamp)

**Auto-reset:** Supabase function `get_usage_count` handles period-based resets

### Feature Limit Constants

Defined in `src/types/subscription.ts`:

```typescript
export const TIER_LIMITS: Record<SubscriptionTier, FeatureLimits> = {
  free: {
    tarot: 1,        // 1 per day
    iching: 1,       // 1 per day
    dream: 0,        // Not available
    synastry: 1,     // 1 saved chart (PROPOSED - gateway feature)
    journal: 5,      // 5 per month
    savedCharts: 0,  // Not available
  },
  premium: {
    tarot: 'unlimited',
    iching: 'unlimited',
    dream: 'unlimited',
    synastry: 5,     // Up to 5 saved charts (PROPOSED - increased from 3)
    journal: 'unlimited',
    savedCharts: 3,
  },
  pro: {
    tarot: 'unlimited',
    iching: 'unlimited',
    dream: 'unlimited',
    synastry: 'unlimited',
    journal: 'unlimited',
    savedCharts: 'unlimited',
  },
};

// PROPOSED CHANGE: Daily Synastry Forecasts
// Free tier: synastryCompatibility: true, dailySynastryForecast: false
// Premium tier: synastryCompatibility: true, dailySynastryForecast: false (CHANGE FROM true)
// Pro tier: synastryCompatibility: true, dailySynastryForecast: true
```

### React Hooks

#### useFeatureAccess(feature)
Checks if user has boolean access to a feature (e.g., dream interpretation).

**Returns:**
- `hasAccess` (boolean)
- `tier` (SubscriptionTier)
- `isLoading` (boolean)

#### useFeatureUsage(feature)
Checks usage limits and provides increment functionality.

**Returns:**
- `canUse` (boolean) - Can user use feature now?
- `currentUsage` (number) - Current usage count for period
- `limit` (number | 'unlimited') - Usage limit for current tier
- `tier` (SubscriptionTier)
- `isChecking` (boolean)
- `useFeature()` (function) - Call to increment usage
- `recheck()` (function) - Re-check access

#### useSubscriptionTier()
Gets current subscription tier and status.

**Returns:**
- `tier` (SubscriptionTier)
- `status` (SubscriptionStatus)
- `isFree`, `isPremium`, `isPro`, `isPaid` (booleans)
- `isActive` (boolean)
- `isLoading` (boolean)

#### useSubscription()
Manages subscription purchases and restoration.

**Returns:**
- `subscriptionState` (SubscriptionState)
- `availablePackages` (SubscriptionPackage[])
- `isPurchasing` (boolean)
- `purchaseError` (string | null)
- `loadPackages()`, `purchasePackage()`, `restorePurchases()`, etc.

### UI Components

#### PaywallModal
Full-screen modal for subscription purchase flow.

**Props:**
- `visible` (boolean)
- `onClose` (function)
- `onSuccess?` (function)

**Features:**
- Displays available packages (Premium/Pro, Monthly/Yearly)
- Shows tier benefits
- Handles purchase flow via RevenueCat
- Restore purchases button

#### UpgradePrompt
Focused upgrade prompt shown when hitting feature limits.

**Props:**
- `visible` (boolean)
- `onClose` (function)
- `onUpgrade` (function)
- `feature` (UsageFeature)
- `currentTier` (SubscriptionTier)
- `currentUsage` (number)

**Features:**
- Contextual message based on feature
- Shows recommended tier benefits
- "Upgrade Now" or "Maybe Later" actions

---

## RevenueCat Product IDs

### Apple App Store

```typescript
export const PRODUCT_IDS = {
  PREMIUM_MONTHLY: 'com.ouros2.premium.monthly',
  PREMIUM_YEARLY: 'com.ouros2.premium.yearly',
  PRO_MONTHLY: 'com.ouros2.pro.monthly',
  PRO_YEARLY: 'com.ouros2.pro.yearly',
} as const;
```

### Entitlements

```typescript
export const ENTITLEMENTS = {
  PREMIUM: 'premium',
  PRO: 'pro',
} as const;
```

---

## Proposed Changes: Synastry Tiering Strategy

### Current vs. Proposed

**Current (In Code):**
- Free: 0 charts, no access
- Premium: 3 charts, daily forecasts available
- Pro: Unlimited charts, daily forecasts available

**Proposed (In This Document):**
- Free: 1 chart, no daily forecasts (gateway feature)
- Premium: 5 charts, no daily forecasts (static analysis only)
- Pro: Unlimited charts, daily forecasts available (dynamic insights)

### Strategic Rationale

#### 1. Free Tier Gets 1 Chart (Gateway Feature)
**Why:**
- Allows users to experience synastry value with one important relationship
- Creates upgrade desire when they want to add more relationships
- Low risk since it's just static analysis (one-time AI call)
- Follows successful "freemium" model: give taste, charge for scale

**Upgrade Messaging:**
"Want to understand more of your relationships? Upgrade to Premium for 5 charts!"

#### 2. Premium Gets 5 Charts (Not 3)
**Why:**
- 5 covers core relationships: partner, 2-3 family members, 1-2 close friends
- More generous limit feels premium
- Clear differentiation from Free (5x more)
- Still creates upgrade path to Pro for power users

**Upgrade Messaging:**
"Track all your important relationships with unlimited charts in Pro!"

#### 3. Daily Forecasts = Pro Only (Not Premium)
**Why:**
- Daily forecasts are AI-intensive (multiple Claude API calls per day per chart)
- Creates strong differentiation between Premium and Pro
- Premium = "understand your relationships" (static)
- Pro = "navigate your relationships daily" (dynamic)
- Justifies higher Pro pricing with ongoing high-value content
- Increases stickiness (daily engagement)

**Upgrade Messaging:**
"See how today's cosmic energy affects your relationships! Upgrade to Pro for daily synastry forecasts."

### Product Positioning

| Tier | Synastry Value Proposition | Use Case |
|------|---------------------------|----------|
| **Free** | "Try synastry with one relationship" | Singles exploring compatibility with a partner |
| **Premium** | "Understand your core relationships" | People tracking 3-5 important relationships |
| **Pro** | "Navigate all relationships daily" | Relationship coaches, astrologers, power users |

### Implementation Impact

**Code Changes Required:**
1. Update `TIER_LIMITS.synastry`: `free: 1, premium: 5` (currently `free: 0, premium: 3`)
2. Update `TIER_FEATURES.free.synastryCompatibility`: `true` (currently `false`)
3. Update `TIER_FEATURES.premium.dailySynastryForecast`: `false` (currently `true`)

**Database Changes:** None (usage tracking already supports this)

**UI Changes:**
- Add feature gating to Synastry screen with chart storage enforcement
- Add "Pro" badge to Daily Forecast button in synastry chart view
- Show upgrade prompt when Free user tries to save 2nd chart
- Show upgrade prompt when Premium user tries to save 6th chart
- Show Pro upgrade prompt when Free/Premium user tries to access daily forecasts

---

## Implementation Checklist

### ✅ Completed
- [x] Subscription type definitions
- [x] RevenueCat integration
- [x] Supabase database tables
- [x] State management (Zustand)
- [x] React hooks for feature access
- [x] UI components (PaywallModal, UpgradePrompt)
- [x] Tarot screen feature gating (REFERENCE IMPLEMENTATION)
- [x] Usage tracking backend functions

### ⚠️ Partially Implemented
- [ ] I Ching screen feature gating (backend ready, UI gating needed)
- [ ] Dream interpretation feature gating (backend ready, UI gating needed)
- [ ] Synastry screen feature gating (backend ready, enforcement needed)
- [ ] Journal screen usage limits (backend ready, UI gating needed)
- [ ] Saved charts enforcement (limits defined, storage limits not enforced)

### ❌ Not Implemented
- [ ] Enhanced horoscope differentiation (basic vs. enhanced)
- [ ] Full natal chart differentiation (basic vs. full)
- [ ] Transits feature (Pro only)
- [ ] Progressions feature (Pro only)
- [ ] Priority AI processing
- [ ] Export readings to PDF
- [ ] Usage remaining indicators in UI
- [ ] Proactive upgrade nudges
- [ ] Feature comparison table in subscription screen

---

## Feature Implementation Status Summary

| Feature Category | Limits Defined | Backend Tracking | UI Gating | Overall Status |
|-----------------|---------------|------------------|-----------|----------------|
| **Tarot Readings** | ✅ | ✅ | ✅ | **✅ COMPLETE** |
| **I Ching Readings** | ✅ | ✅ | ❌ | **⚠️ NEEDS UI GATING** |
| **Dream Interpretation** | ✅ | ✅ | ❌ | **⚠️ NEEDS UI GATING** |
| **Synastry Charts** | ✅ | ✅ | ❌ | **⚠️ NEEDS ENFORCEMENT** |
| **Journal Entries** | ✅ | ✅ | ❌ | **⚠️ NEEDS UI GATING** |
| **Saved Charts Limit** | ✅ | ❌ | ❌ | **❌ NOT ENFORCED** |
| **Enhanced Horoscope** | ✅ | ❌ | ❌ | **❌ NOT DIFFERENTIATED** |
| **Full Natal Chart** | ✅ | ❌ | ❌ | **❌ NOT DIFFERENTIATED** |
| **Transits** | ✅ | ❌ | ❌ | **❌ NOT IMPLEMENTED** |
| **Progressions** | ✅ | ❌ | ❌ | **❌ NOT IMPLEMENTED** |
| **Priority AI** | ✅ | ❌ | ❌ | **❌ NOT IMPLEMENTED** |
| **Export Readings** | ✅ | ❌ | ❌ | **❌ NOT IMPLEMENTED** |

---

## Next Steps

### Priority 1: Complete Core Feature Gating
1. Add feature gating to I Ching screen (follow Tarot pattern)
2. Add feature gating to Dream Interpretation screen (block free tier)
3. Add feature gating to Synastry screen (enforce saved chart limits)
4. Add feature gating to Journal screens (enforce monthly limits)

### Priority 2: Enhanced UX
1. Add usage remaining indicators (e.g., "2 readings left today")
2. Add proactive upgrade nudges before limits
3. Create feature comparison table in subscription screen
4. Add tier badges/indicators throughout app

### Priority 3: Advanced Features
1. Differentiate basic vs. full natal chart
2. Differentiate basic vs. enhanced horoscope
3. Implement transits feature (Pro only)
4. Implement progressions feature (Pro only)
5. Implement export to PDF functionality
6. Implement priority AI queue

### Priority 4: Storage Limits
1. Enforce saved natal chart limits
2. Enforce saved synastry chart limits
3. Add UI for managing saved charts
4. Add "upgrade to save more" prompts

---

## Reference Implementation: Tarot Screen

The Tarot screen (`src/screens/TarotScreen.tsx:36`) provides the reference pattern for implementing feature gating:

```typescript
// 1. Import hooks and components
import { useFeatureUsage } from '../hooks/useFeatureAccess';
import { UpgradePrompt } from '../components/UpgradePrompt';
import { PaywallModal } from '../components/PaywallModal';

// 2. Setup feature usage tracking
const { canUse, currentUsage, limit, tier, useFeature } = useFeatureUsage('tarot');
const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
const [showPaywall, setShowPaywall] = useState(false);
const [hasCheckedUsage, setHasCheckedUsage] = useState(false);

// 3. Check access before allowing feature use
const handleSpreadSelect = async (spread: any) => {
  if (!hasCheckedUsage) {
    if (!canUse) {
      setShowUpgradePrompt(true);
      return;
    }
    await useFeature(); // Increment usage
    setHasCheckedUsage(true);
  }
  startSession(spread);
};

// 4. Render upgrade prompts
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
  onSuccess={() => setShowPaywall(false)}
/>
```

This pattern should be replicated for I Ching, Dream, Synastry, and Journal features.

---

**Document Version:** 1.0
**Author:** Development Team
**Status:** Living Document - Update as features are implemented
