import { useCallback, useEffect, useState } from 'react';
import { useAppStore } from '../store';
import {
  UsageFeature,
  TIER_FEATURES,
  TIER_LIMITS,
  SubscriptionTier,
} from '../types/subscription';

/**
 * Hook to check if user has access to a feature
 */
export function useFeatureAccess(feature: keyof typeof TIER_FEATURES.free) {
  const { subscriptionState, loadSubscriptionState } = useAppStore();
  const tier = subscriptionState?.tier || 'free';

  useEffect(() => {
    // Load subscription state if not loaded
    if (!subscriptionState) {
      loadSubscriptionState();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptionState]);

  const hasAccess = TIER_FEATURES[tier][feature] === true;

  return {
    hasAccess,
    tier,
    isLoading: !subscriptionState,
  };
}

/**
 * Hook to check if user can use a feature (considering usage limits)
 */
export function useFeatureUsage(feature: UsageFeature) {
  const {
    subscriptionState,
    usageTracking,
    loadSubscriptionState,
    loadUsageTracking,
    incrementUsage,
    canUseFeature,
  } = useAppStore();

  const [canUse, setCanUse] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const tier = subscriptionState?.tier || 'free';
  const usage = usageTracking[feature];
  const limit = TIER_LIMITS[tier][feature];

  // Check if user can use the feature
  const checkAccess = useCallback(async () => {
    setIsChecking(true);
    try {
      const result = await canUseFeature(feature);
      setCanUse(result);
    } catch (error) {
      console.error('Failed to check feature access:', error);
      setCanUse(false);
    } finally {
      setIsChecking(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feature]);

  useEffect(() => {
    // Load subscription and usage if not loaded
    if (!subscriptionState) {
      loadSubscriptionState();
    }
    if (!usage) {
      loadUsageTracking();
    }

    checkAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptionState, usage]);

  // Function to increment usage (call this when feature is used)
  const useFeature = useCallback(async () => {
    try {
      await incrementUsage(feature);
      await checkAccess(); // Re-check access after incrementing
    } catch (error) {
      console.error('Failed to increment usage:', error);
      throw error;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feature]);

  return {
    canUse,
    currentUsage: usage?.count || 0,
    limit,
    tier,
    isChecking,
    useFeature,
    recheck: checkAccess,
  };
}

/**
 * Hook to check subscription tier
 */
export function useSubscriptionTier() {
  const { subscriptionState, loadSubscriptionState, isLoadingSubscription } = useAppStore();

  useEffect(() => {
    if (!subscriptionState && !isLoadingSubscription) {
      loadSubscriptionState();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptionState, isLoadingSubscription]);

  const tier = subscriptionState?.tier || 'free';
  const status = subscriptionState?.status || 'active';

  const isFree = tier === 'free';
  const isPremium = tier === 'premium';
  const isPro = tier === 'pro';
  const isPaid = isPremium || isPro;

  const isActive = ['active', 'trial', 'grace_period'].includes(status);

  return {
    tier,
    status,
    isFree,
    isPremium,
    isPro,
    isPaid,
    isActive,
    isLoading: isLoadingSubscription,
    subscriptionState,
  };
}

/**
 * Hook for subscription management actions
 */
export function useSubscription() {
  const {
    subscriptionState,
    availablePackages,
    isPurchasing,
    purchaseError,
    loadSubscriptionState,
    syncWithRevenueCat,
    loadAvailablePackages,
    purchasePackage,
    restorePurchases,
    clearPurchaseError,
  } = useAppStore();

  useEffect(() => {
    // Load subscription state on mount
    if (!subscriptionState) {
      loadSubscriptionState();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptionState]);

  // Load packages when needed
  const loadPackages = useCallback(async () => {
    if (availablePackages.length === 0) {
      await loadAvailablePackages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availablePackages.length]);

  return {
    subscriptionState,
    availablePackages,
    isPurchasing,
    purchaseError,
    loadPackages,
    purchasePackage,
    restorePurchases,
    syncWithRevenueCat,
    clearPurchaseError,
  };
}

/**
 * Hook to require a specific tier
 * Returns whether user meets the tier requirement
 */
export function useRequireTier(requiredTier: SubscriptionTier) {
  const { tier } = useSubscriptionTier();

  const tierOrder: SubscriptionTier[] = ['free', 'premium', 'pro'];
  const currentTierIndex = tierOrder.indexOf(tier);
  const requiredTierIndex = tierOrder.indexOf(requiredTier);

  const meetsRequirement = currentTierIndex >= requiredTierIndex;

  return {
    meetsRequirement,
    currentTier: tier,
    requiredTier,
  };
}
