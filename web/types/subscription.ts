// Subscription Types

export type SubscriptionTier = 'free' | 'premium' | 'pro';

export type SubscriptionStatus =
  | 'active'           // Currently active subscription
  | 'trial'            // In trial period
  | 'expired'          // Subscription expired
  | 'cancelled'        // User cancelled, but may still be active until period end
  | 'grace_period'     // In grace period (payment issue)
  | 'paused';          // Subscription paused

export type SubscriptionPlatform = 'ios' | 'android' | 'manual' | 'web';

export interface SubscriptionState {
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  platform: SubscriptionPlatform | null;
  revenueCatId: string | null;
  expiresAt: string | null;
  isSandbox: boolean;
  isDebugOverride: boolean;
  updatedAt: string;
  // Stripe-specific fields
  stripeSubscriptionId?: string | null;
  stripeCustomerId?: string | null;
  stripePriceId?: string | null;
  stripePaymentMethodId?: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
}

export interface UsageTracking {
  userId: string;
  feature: UsageFeature;
  count: number;
  period: UsagePeriod;
  periodStart: string;
}

export type UsageFeature =
  | 'tarot'
  | 'iching'
  | 'dream'
  | 'synastry'
  | 'journal';

export type UsagePeriod = 'daily' | 'monthly';

// Feature limits per tier
export interface FeatureLimits {
  tarot: number | 'unlimited';
  iching: number | 'unlimited';
  dream: number | 'unlimited';
  synastry: number | 'unlimited';
  journal: number | 'unlimited';
  savedCharts: number | 'unlimited';
}

export const TIER_LIMITS: Record<SubscriptionTier, FeatureLimits> = {
  free: {
    tarot: 1,        // 1 per day
    iching: 1,       // 1 per day
    dream: 0,        // Not available
    synastry: 0,     // Not available
    journal: 5,      // 5 per month
    savedCharts: 0,  // Not available
  },
  premium: {
    tarot: 'unlimited',
    iching: 'unlimited',
    dream: 'unlimited',
    synastry: 3,     // Up to 3 saved charts
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

// Features that each tier has access to
export interface TierFeatures {
  // Oracle features
  tarotReading: boolean;
  ichingReading: boolean;
  dreamInterpretation: boolean;

  // Horoscope features
  dailyHoroscope: boolean;
  enhancedHoroscope: boolean;
  cosmicWeather: boolean;

  // Chart features
  basicNatalChart: boolean;
  fullNatalChart: boolean;
  transits: boolean;
  progressions: boolean;

  // Journal features
  journalEntries: boolean;
  unlimitedJournal: boolean;

  // Social/Synastry features
  synastryCompatibility: boolean;
  dailySynastryForecast: boolean;
  unlimitedCharts: boolean;

  // Premium features
  priorityAI: boolean;
  exportReadings: boolean;
  noAds: boolean;
}

export const TIER_FEATURES: Record<SubscriptionTier, TierFeatures> = {
  free: {
    tarotReading: true,
    ichingReading: true,
    dreamInterpretation: false,
    dailyHoroscope: true,
    enhancedHoroscope: false,
    cosmicWeather: false,
    basicNatalChart: true,
    fullNatalChart: false,
    transits: false,
    progressions: false,
    journalEntries: true,
    unlimitedJournal: false,
    synastryCompatibility: false,
    dailySynastryForecast: false,
    unlimitedCharts: false,
    priorityAI: false,
    exportReadings: false,
    noAds: true, // No ads for now
  },
  premium: {
    tarotReading: true,
    ichingReading: true,
    dreamInterpretation: true,
    dailyHoroscope: true,
    enhancedHoroscope: true,
    cosmicWeather: true,
    basicNatalChart: true,
    fullNatalChart: true,
    transits: false,
    progressions: false,
    journalEntries: true,
    unlimitedJournal: true,
    synastryCompatibility: true,
    dailySynastryForecast: true,
    unlimitedCharts: false,
    priorityAI: false,
    exportReadings: false,
    noAds: true,
  },
  pro: {
    tarotReading: true,
    ichingReading: true,
    dreamInterpretation: true,
    dailyHoroscope: true,
    enhancedHoroscope: true,
    cosmicWeather: true,
    basicNatalChart: true,
    fullNatalChart: true,
    transits: true,
    progressions: true,
    journalEntries: true,
    unlimitedJournal: true,
    synastryCompatibility: true,
    dailySynastryForecast: true,
    unlimitedCharts: true,
    priorityAI: true,
    exportReadings: true,
    noAds: true,
  },
};

// RevenueCat product identifiers
export const PRODUCT_IDS = {
  PREMIUM_MONTHLY: 'com.ouros2.premium.monthly',
  PREMIUM_YEARLY: 'com.ouros2.premium.yearly',
  PRO_MONTHLY: 'com.ouros2.pro.monthly',
  PRO_YEARLY: 'com.ouros2.pro.yearly',
} as const;

// RevenueCat entitlement identifiers
export const ENTITLEMENTS = {
  PREMIUM: 'premium',
  PRO: 'pro',
} as const;

export interface SubscriptionPackage {
  identifier: string;
  productId: string;
  title: string;
  description: string;
  price: string;
  pricePerMonth: string;
  period: 'monthly' | 'yearly';
  tier: Exclude<SubscriptionTier, 'free'>;
  savings?: string;
}

// Stripe-specific types

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
