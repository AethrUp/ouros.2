/**
 * Server-Side Usage Enforcement Utilities
 *
 * This module provides critical usage enforcement for all API routes.
 * NEVER bypass these checks. All interpretation and generation endpoints MUST use these utilities.
 */

import { createClient } from '@/lib/supabase/server';
import { SubscriptionTier, UsageFeature, TIER_LIMITS, TIER_FEATURES } from '@/types/subscription';

export interface EnforcementResult {
  allowed: boolean;
  reason?: string;
  tier?: SubscriptionTier;
  currentUsage?: number;
  limit?: number | 'unlimited';
}

/**
 * Checks if a user has access to a feature based on their subscription tier
 * This is the PRIMARY enforcement function that MUST be called before ANY feature usage
 */
export async function checkFeatureAccess(
  userId: string,
  feature: UsageFeature,
  period: 'daily' | 'monthly' = 'daily'
): Promise<EnforcementResult> {
  const supabase = await createClient();

  // 1. Get user's subscription tier
  const { data: subscription, error: subError } = await supabase
    .from('subscription_state')
    .select('tier, status')
    .eq('user_id', userId)
    .single();

  if (subError || !subscription) {
    console.error('[Usage Enforcement] Failed to get subscription:', subError);
    return {
      allowed: false,
      reason: 'Unable to verify subscription status',
    };
  }

  const tier = subscription.tier as SubscriptionTier;

  // Check if subscription is active
  if (subscription.status !== 'active' && subscription.status !== 'trial') {
    return {
      allowed: false,
      reason: 'Subscription is not active',
      tier,
    };
  }

  // 2. Check if tier has access to this feature at all
  const hasFeatureAccess = checkTierHasFeature(tier, feature);
  if (!hasFeatureAccess) {
    return {
      allowed: false,
      reason: `Feature '${feature}' is not available on ${tier} tier`,
      tier,
    };
  }

  // 3. Call database RPC function to check usage limits
  const { data: canAccess, error: rpcError } = await supabase.rpc('check_feature_access', {
    p_user_id: userId,
    p_feature: feature,
    p_tier: tier,
    p_period: period,
  });

  if (rpcError) {
    console.error('[Usage Enforcement] RPC check_feature_access failed:', rpcError);
    return {
      allowed: false,
      reason: 'Unable to verify usage limits',
      tier,
    };
  }

  if (!canAccess) {
    // Get current usage for error message
    const { data: usageCount } = await supabase.rpc('get_usage_count', {
      p_user_id: userId,
      p_feature: feature,
      p_period: period,
    });

    const limit = TIER_LIMITS[tier][feature];

    return {
      allowed: false,
      reason: `${period.charAt(0).toUpperCase() + period.slice(1)} usage limit exceeded for ${feature}`,
      tier,
      currentUsage: usageCount || 0,
      limit,
    };
  }

  return {
    allowed: true,
    tier,
  };
}

/**
 * Increments usage counter after successful feature use
 * MUST be called after processing the request successfully
 */
export async function incrementUsage(
  userId: string,
  feature: UsageFeature,
  period: 'daily' | 'monthly' = 'daily'
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.rpc('increment_usage', {
    p_user_id: userId,
    p_feature: feature,
    p_period: period,
  });

  if (error) {
    console.error('[Usage Enforcement] Failed to increment usage:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Checks if a tier has access to a specific feature (tier-level check, not usage-based)
 */
function checkTierHasFeature(tier: SubscriptionTier, feature: UsageFeature): boolean {
  const tierFeatures = TIER_FEATURES[tier];

  switch (feature) {
    case 'tarot':
      return tierFeatures.tarotReading;
    case 'iching':
      return tierFeatures.ichingReading;
    case 'dream':
      return tierFeatures.dreamInterpretation;
    case 'synastry':
      return tierFeatures.synastryCompatibility;
    case 'journal':
      return tierFeatures.journalEntries;
    default:
      return false;
  }
}

/**
 * Checks if user can save another chart (for synastry/saved charts)
 * Returns true if under limit, false if limit reached
 */
export async function checkSaveChartLimit(
  userId: string,
  chartType: 'synastry' | 'natal' = 'synastry'
): Promise<EnforcementResult> {
  const supabase = await createClient();

  // 1. Get user's subscription tier
  const { data: subscription, error: subError } = await supabase
    .from('subscription_state')
    .select('tier')
    .eq('user_id', userId)
    .single();

  if (subError || !subscription) {
    return {
      allowed: false,
      reason: 'Unable to verify subscription status',
    };
  }

  const tier = subscription.tier as SubscriptionTier;
  const limit = TIER_LIMITS[tier].savedCharts;

  // Unlimited for pro
  if (limit === 'unlimited') {
    return { allowed: true, tier };
  }

  // Count existing saved charts
  const tableName = chartType === 'synastry' ? 'synastry_readings' : 'saved_charts';
  const { count, error: countError } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (countError) {
    console.error('[Usage Enforcement] Failed to count saved charts:', countError);
    return {
      allowed: false,
      reason: 'Unable to verify saved chart count',
      tier,
    };
  }

  const currentCount = count || 0;

  if (currentCount >= limit) {
    return {
      allowed: false,
      reason: `You have reached the maximum of ${limit} saved ${chartType} charts for ${tier} tier`,
      tier,
      currentUsage: currentCount,
      limit,
    };
  }

  return {
    allowed: true,
    tier,
    currentUsage: currentCount,
    limit,
  };
}

/**
 * Gets current usage count for a feature
 */
export async function getUsageCount(
  userId: string,
  feature: UsageFeature,
  period: 'daily' | 'monthly' = 'daily'
): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_usage_count', {
    p_user_id: userId,
    p_feature: feature,
    p_period: period,
  });

  if (error) {
    console.error('[Usage Enforcement] Failed to get usage count:', error);
    return 0;
  }

  return data || 0;
}

/**
 * Gets user's subscription tier
 */
export async function getUserTier(userId: string): Promise<SubscriptionTier | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('subscription_state')
    .select('tier')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    console.error('[Usage Enforcement] Failed to get user tier:', error);
    return null;
  }

  return data.tier as SubscriptionTier;
}

/**
 * Creates a standardized 429 (Too Many Requests) error response
 */
export function createRateLimitResponse(result: EnforcementResult) {
  return {
    success: false,
    error: result.reason || 'Usage limit exceeded',
    tier: result.tier,
    currentUsage: result.currentUsage,
    limit: result.limit,
    upgradeRequired: result.tier === 'free' || result.tier === 'premium',
  };
}

/**
 * Creates a standardized 403 (Forbidden) error response for tier restrictions
 */
export function createTierRestrictionResponse(result: EnforcementResult) {
  return {
    success: false,
    error: result.reason || 'This feature is not available on your current plan',
    tier: result.tier,
    upgradeRequired: true,
  };
}
