import { SubscriptionTier, TIER_FEATURES, TIER_LIMITS, UsageFeature } from '../types/subscription';

/**
 * Feature gate utilities for checking access without React hooks
 * Useful for non-component contexts (services, handlers, etc.)
 */

/**
 * Check if a tier has access to a feature
 */
export function tierHasFeature(
  tier: SubscriptionTier,
  feature: keyof typeof TIER_FEATURES.free
): boolean {
  return TIER_FEATURES[tier][feature] === true;
}

/**
 * Check if a tier has usage limits for a feature
 */
export function getTierLimit(tier: SubscriptionTier, feature: UsageFeature): number | 'unlimited' {
  return TIER_LIMITS[tier][feature];
}

/**
 * Check if usage is within limits
 */
export function isWithinUsageLimit(
  tier: SubscriptionTier,
  feature: UsageFeature,
  currentUsage: number
): boolean {
  const limit = getTierLimit(tier, feature);

  if (limit === 'unlimited') return true;
  if (limit === 0) return false;

  return currentUsage < limit;
}

/**
 * Get remaining usage for a feature
 */
export function getRemainingUsage(
  tier: SubscriptionTier,
  feature: UsageFeature,
  currentUsage: number
): number | 'unlimited' {
  const limit = getTierLimit(tier, feature);

  if (limit === 'unlimited') return 'unlimited';
  if (limit === 0) return 0;

  const remaining = Math.max(0, limit - currentUsage);
  return remaining;
}

/**
 * Get feature description for paywall
 */
export function getFeatureDescription(feature: UsageFeature): string {
  const descriptions: Record<UsageFeature, string> = {
    tarot: 'Tarot Readings',
    iching: 'I Ching Readings',
    dream: 'Dream Interpretations',
    synastry: 'Synastry Compatibility Charts',
    journal: 'Journal Entries',
  };

  return descriptions[feature] || feature;
}

/**
 * Get tier display name
 */
export function getTierDisplayName(tier: SubscriptionTier): string {
  const names: Record<SubscriptionTier, string> = {
    free: 'Free',
    premium: 'Premium',
    pro: 'Pro',
  };

  return names[tier];
}

/**
 * Get tier benefits list
 */
export function getTierBenefits(tier: Exclude<SubscriptionTier, 'free'>): string[] {
  const benefits: Record<Exclude<SubscriptionTier, 'free'>, string[]> = {
    premium: [
      'Unlimited tarot readings',
      'Unlimited I Ching readings',
      'Dream interpretations',
      'Enhanced daily horoscope',
      'Cosmic weather insights',
      'Full natal chart analysis',
      'Up to 3 synastry charts',
      'Daily synastry forecasts',
      'Unlimited journal entries',
    ],
    pro: [
      'Everything in Premium',
      'Unlimited synastry charts',
      'Advanced chart features',
      'Transits & progressions',
      'Priority AI processing',
      'Export readings to PDF',
      'Unlimited social connections',
      'Advanced analytics',
    ],
  };

  return benefits[tier];
}

/**
 * Get upgrade headline for a feature
 */
export function getUpgradeHeadline(feature: UsageFeature): string {
  const featureHeadlines: Record<UsageFeature, string> = {
    dream: "Dreams Hold Your Answers",
    tarot: "Ask As Much As You Want",
    iching: "Ask As Much As You Want",
    synastry: "Understand Your Connections",
    journal: "More Space to Grow",
  };

  // Default general headline
  return featureHeadlines[feature] || "Unlock Full Access";
}

/**
 * Get upgrade message for a feature
 */
export function getUpgradeMessage(
  feature: UsageFeature,
  currentTier: SubscriptionTier,
  currentUsage: number
): string {
  const limit = getTierLimit(currentTier, feature);

  // Feature-specific marketing messages
  const featureMessages: Record<UsageFeature, string> = {
    dream: "Your subconscious is speaking - Premium helps you listen with unlimited dream interpretation and pattern tracking.",
    tarot: "No more rationing your spiritual guidance. Premium gives unlimited tarot and I Ching access whenever you need clarity.",
    iching: "No more rationing your spiritual guidance. Premium gives unlimited tarot and I Ching access whenever you need clarity.",
    synastry: "Why do you click? Where do you clash? Premium reveals the cosmic chemistry in all your relationships.",
    journal: "You've used your 3 free entries. Premium gives unlimited journaling space for deeper reflection and insight tracking.",
  };

  // Default general message
  const defaultMessage = "Ready for unlimited spiritual insights? Premium gives you everything you need for deeper self-understanding and relationship clarity.";

  // If unlimited access, return success message
  if (limit === 'unlimited') {
    const featureDesc = getFeatureDescription(feature);
    return `You have unlimited access to ${featureDesc}.`;
  }

  // Return feature-specific message or default
  return featureMessages[feature] || defaultMessage;
}

/**
 * Check if user should see upgrade prompt
 */
export function shouldShowUpgradePrompt(
  tier: SubscriptionTier,
  feature: UsageFeature,
  currentUsage: number
): boolean {
  // Never show upgrade prompt for Pro users
  if (tier === 'pro') return false;

  const limit = getTierLimit(tier, feature);

  // Show prompt if feature is not available (limit = 0)
  if (limit === 0) return true;

  // Show prompt if at or over limit
  if (limit !== 'unlimited' && currentUsage >= limit) return true;

  // Show prompt if close to limit (80% or higher)
  if (limit !== 'unlimited' && currentUsage >= limit * 0.8) return true;

  return false;
}

/**
 * Get recommended tier for a feature
 */
export function getRecommendedTier(feature: UsageFeature): Exclude<SubscriptionTier, 'free'> {
  // Most features are available in Premium
  // Only recommend Pro for specific advanced features
  const proOnlyFeatures: UsageFeature[] = [];

  if (proOnlyFeatures.includes(feature)) {
    return 'pro';
  }

  return 'premium';
}
