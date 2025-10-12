import { StateCreator } from 'zustand';
import {
  SubscriptionState,
  SubscriptionTier,
  SubscriptionStatus,
  UsageTracking,
  UsageFeature,
  SubscriptionPackage,
} from '../../types/subscription';
import { supabase } from '../../utils/supabase';
import {
  syncSubscriptionWithRevenueCat,
  getAvailablePackages,
  purchasePackage as purchasePackageFromService,
  restorePurchases as restorePurchasesFromService,
} from '../../services/subscriptionService';

export interface SubscriptionSlice {
  // Subscription state
  subscriptionState: SubscriptionState | null;
  isLoadingSubscription: boolean;
  subscriptionError: string | null;

  // Usage tracking (local cache)
  usageTracking: Record<UsageFeature, UsageTracking | null>;
  isLoadingUsage: boolean;

  // Available packages (from RevenueCat)
  availablePackages: SubscriptionPackage[];
  isLoadingPackages: boolean;

  // Purchase state
  isPurchasing: boolean;
  purchaseError: string | null;

  // Actions - Subscription State
  setSubscriptionState: (state: SubscriptionState) => void;
  loadSubscriptionState: () => Promise<void>;
  syncWithRevenueCat: () => Promise<void>;
  updateSubscriptionTier: (tier: SubscriptionTier, isDebug?: boolean) => Promise<void>;

  // Actions - Usage Tracking
  getUsageCount: (feature: UsageFeature) => Promise<number>;
  incrementUsage: (feature: UsageFeature) => Promise<void>;
  resetUsage: (feature: UsageFeature) => Promise<void>;
  loadUsageTracking: () => Promise<void>;

  // Actions - Packages & Purchase
  loadAvailablePackages: () => Promise<void>;
  purchasePackage: (packageId: string) => Promise<void>;
  restorePurchases: () => Promise<void>;

  // Actions - Error handling
  clearSubscriptionError: () => void;
  clearPurchaseError: () => void;

  // Getters (computed)
  getCurrentTier: () => SubscriptionTier;
  isActive: () => boolean;
  hasFeatureAccess: (feature: string) => boolean;
  canUseFeature: (feature: UsageFeature) => Promise<boolean>;
}

const defaultUsageTracking: Record<UsageFeature, UsageTracking | null> = {
  tarot: null,
  iching: null,
  dream: null,
  synastry: null,
  journal: null,
};

export const createSubscriptionSlice: StateCreator<SubscriptionSlice> = (set, get) => ({
  // Initial state
  subscriptionState: null,
  isLoadingSubscription: false,
  subscriptionError: null,

  usageTracking: defaultUsageTracking,
  isLoadingUsage: false,

  availablePackages: [],
  isLoadingPackages: false,

  isPurchasing: false,
  purchaseError: null,

  // Actions - Subscription State
  setSubscriptionState: (state) => set({ subscriptionState: state }),

  loadSubscriptionState: async () => {
    set({ isLoadingSubscription: true, subscriptionError: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('No authenticated user');
      }

      // Load from Supabase
      const { data, error } = await supabase
        .from('subscription_state')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        throw error;
      }

      if (data) {
        set({
          subscriptionState: {
            userId: data.user_id,
            tier: data.tier,
            status: data.status,
            platform: data.platform,
            revenueCatId: data.revenue_cat_id,
            expiresAt: data.expires_at,
            isSandbox: data.is_sandbox,
            isDebugOverride: data.is_debug_override,
            updatedAt: data.updated_at,
          },
          isLoadingSubscription: false,
        });
      } else {
        // Create default free tier
        const { error: insertError } = await supabase
          .from('subscription_state')
          .insert({
            user_id: user.id,
            tier: 'free',
            status: 'active',
          });

        if (insertError) throw insertError;

        set({
          subscriptionState: {
            userId: user.id,
            tier: 'free',
            status: 'active',
            platform: null,
            revenueCatId: null,
            expiresAt: null,
            isSandbox: false,
            isDebugOverride: false,
            updatedAt: new Date().toISOString(),
          },
          isLoadingSubscription: false,
        });
      }
    } catch (error: any) {
      console.error('Failed to load subscription state:', error);
      set({
        isLoadingSubscription: false,
        subscriptionError: error.message || 'Failed to load subscription',
      });
    }
  },

  syncWithRevenueCat: async () => {
    set({ isLoadingSubscription: true, subscriptionError: null });
    try {
      const state = await syncSubscriptionWithRevenueCat();
      set({
        subscriptionState: state,
        isLoadingSubscription: false,
      });
    } catch (error: any) {
      console.error('Failed to sync with RevenueCat:', error);
      set({
        isLoadingSubscription: false,
        subscriptionError: error.message || 'Failed to sync subscription',
      });
    }
  },

  updateSubscriptionTier: async (tier, isDebug = false) => {
    set({ isLoadingSubscription: true, subscriptionError: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('No authenticated user');
      }

      // Update in Supabase
      const { data, error } = await supabase
        .from('subscription_state')
        .update({
          tier,
          status: 'active',
          is_debug_override: isDebug,
          platform: isDebug ? 'manual' : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      set({
        subscriptionState: {
          userId: data.user_id,
          tier: data.tier,
          status: data.status,
          platform: data.platform,
          revenueCatId: data.revenue_cat_id,
          expiresAt: data.expires_at,
          isSandbox: data.is_sandbox,
          isDebugOverride: data.is_debug_override,
          updatedAt: data.updated_at,
        },
        isLoadingSubscription: false,
      });

      console.log(`✅ Subscription tier updated to: ${tier} (debug: ${isDebug})`);
    } catch (error: any) {
      console.error('Failed to update subscription tier:', error);
      set({
        isLoadingSubscription: false,
        subscriptionError: error.message || 'Failed to update subscription',
      });
      throw error;
    }
  },

  // Actions - Usage Tracking
  getUsageCount: async (feature) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('No authenticated user');
      }

      // Call the Supabase function
      const { data, error } = await supabase.rpc('get_usage_count', {
        p_user_id: user.id,
        p_feature: feature,
        p_period: 'daily',
      });

      if (error) throw error;

      return data || 0;
    } catch (error: any) {
      console.error('Failed to get usage count:', error);
      return 0;
    }
  },

  incrementUsage: async (feature) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('No authenticated user');
      }

      // Call the Supabase function
      const { data, error } = await supabase.rpc('increment_usage', {
        p_user_id: user.id,
        p_feature: feature,
        p_period: 'daily',
      });

      if (error) throw error;

      console.log(`✅ Usage incremented for ${feature}: ${data}`);

      // Reload usage tracking
      await get().loadUsageTracking();
    } catch (error: any) {
      console.error('Failed to increment usage:', error);
      throw error;
    }
  },

  resetUsage: async (feature) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('No authenticated user');
      }

      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Delete the usage record for today
      const { error } = await supabase
        .from('usage_tracking')
        .delete()
        .eq('user_id', user.id)
        .eq('feature', feature)
        .eq('period', 'daily')
        .gte('period_start', periodStart.toISOString());

      if (error) throw error;

      console.log(`✅ Usage reset for ${feature}`);

      // Reload usage tracking
      await get().loadUsageTracking();
    } catch (error: any) {
      console.error('Failed to reset usage:', error);
      throw error;
    }
  },

  loadUsageTracking: async () => {
    set({ isLoadingUsage: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('No authenticated user');
      }

      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Load today's usage
      const { data, error } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', user.id)
        .eq('period', 'daily')
        .gte('period_start', periodStart.toISOString());

      if (error) throw error;

      const usageMap: Record<UsageFeature, UsageTracking | null> = { ...defaultUsageTracking };

      data?.forEach((item: any) => {
        usageMap[item.feature as UsageFeature] = {
          userId: item.user_id,
          feature: item.feature,
          count: item.count,
          period: item.period,
          periodStart: item.period_start,
        };
      });

      set({
        usageTracking: usageMap,
        isLoadingUsage: false,
      });
    } catch (error: any) {
      console.error('Failed to load usage tracking:', error);
      set({ isLoadingUsage: false });
    }
  },

  // Actions - Packages & Purchase
  loadAvailablePackages: async () => {
    set({ isLoadingPackages: true });
    try {
      const packages = await getAvailablePackages();
      set({
        availablePackages: packages,
        isLoadingPackages: false,
      });
    } catch (error: any) {
      console.error('Failed to load packages:', error);
      set({ isLoadingPackages: false });
    }
  },

  purchasePackage: async (packageId) => {
    set({ isPurchasing: true, purchaseError: null });
    try {
      await purchasePackageFromService(packageId);

      // Sync with RevenueCat after purchase
      await get().syncWithRevenueCat();

      set({ isPurchasing: false });
      console.log('✅ Purchase successful');
    } catch (error: any) {
      console.error('Purchase failed:', error);
      set({
        isPurchasing: false,
        purchaseError: error.message || 'Purchase failed',
      });
      throw error;
    }
  },

  restorePurchases: async () => {
    set({ isPurchasing: true, purchaseError: null });
    try {
      await restorePurchasesFromService();

      // Sync with RevenueCat after restore
      await get().syncWithRevenueCat();

      set({ isPurchasing: false });
      console.log('✅ Purchases restored');
    } catch (error: any) {
      console.error('Restore failed:', error);
      set({
        isPurchasing: false,
        purchaseError: error.message || 'Restore failed',
      });
      throw error;
    }
  },

  // Actions - Error handling
  clearSubscriptionError: () => set({ subscriptionError: null }),
  clearPurchaseError: () => set({ purchaseError: null }),

  // Getters
  getCurrentTier: () => {
    const { subscriptionState } = get();
    return subscriptionState?.tier || 'free';
  },

  isActive: () => {
    const { subscriptionState } = get();
    if (!subscriptionState) return false;

    const activeStatuses: SubscriptionStatus[] = ['active', 'trial', 'grace_period'];
    return activeStatuses.includes(subscriptionState.status);
  },

  hasFeatureAccess: (feature) => {
    const { subscriptionState } = get();
    const tier = subscriptionState?.tier || 'free';

    const { TIER_FEATURES } = require('../../types/subscription');
    return TIER_FEATURES[tier][feature] === true;
  },

  canUseFeature: async (feature) => {
    const { subscriptionState, getUsageCount } = get();
    const tier = subscriptionState?.tier || 'free';

    const { TIER_LIMITS } = require('../../types/subscription');
    const limit = TIER_LIMITS[tier][feature];

    // If unlimited, always allow
    if (limit === 'unlimited') return true;

    // If 0, never allow
    if (limit === 0) return false;

    // Check usage count
    const usage = await getUsageCount(feature);
    return usage < limit;
  },
});
