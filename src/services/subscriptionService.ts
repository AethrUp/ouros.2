import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  PurchasesOffering,
  LOG_LEVEL,
} from 'react-native-purchases';
import {
  SubscriptionState,
  SubscriptionTier,
  SubscriptionStatus,
  SubscriptionPackage,
  ENTITLEMENTS,
  PRODUCT_IDS,
} from '../types/subscription';
import { supabase } from '../utils/supabase';
import { REVENUECAT_APPLE_KEY } from '@env';

// RevenueCat API Key loaded from environment variables
// Make sure to create a .env file with your PUBLIC SDK key (see .env.example)
// The same key works for both sandbox and production testing
const REVENUECAT_APPLE_API_KEY = REVENUECAT_APPLE_KEY;

// Initialization state management
type InitializationState = 'not_started' | 'initializing' | 'initialized' | 'failed';
let initializationState: InitializationState = 'not_started';
let initializationPromise: Promise<void> | null = null;

// Sync state management to prevent concurrent syncs
let isSyncing = false;
let syncPromise: Promise<SubscriptionState> | null = null;

/**
 * Wait for RevenueCat to be initialized
 * Throws if initialization failed
 */
async function waitForInitialization(): Promise<void> {
  if (initializationState === 'initialized') {
    return;
  }

  if (initializationState === 'failed') {
    throw new Error('RevenueCat initialization failed');
  }

  if (initializationState === 'initializing' && initializationPromise) {
    await initializationPromise;
    return;
  }

  throw new Error('RevenueCat not initialized. Call initializeRevenueCat() first.');
}

/**
 * Initialize RevenueCat SDK
 * Must be called before any other RevenueCat operations
 */
export async function initializeRevenueCat(userId: string): Promise<void> {
  // If already initialized, return immediately
  if (initializationState === 'initialized') {
    console.log('⚠️ RevenueCat already initialized');
    return;
  }

  // If currently initializing, wait for the existing promise
  if (initializationState === 'initializing' && initializationPromise) {
    console.log('⏳ RevenueCat initialization in progress, waiting...');
    await initializationPromise;
    return;
  }

  // Start initialization
  initializationState = 'initializing';
  initializationPromise = (async () => {
    try {
      // Validate API key
      if (!REVENUECAT_APPLE_API_KEY || REVENUECAT_APPLE_API_KEY.trim() === '') {
        throw new Error('RevenueCat API key not loaded from environment variables');
      }

      // Configure SDK
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }

      // Configure Purchases
      await Purchases.configure({
        apiKey: REVENUECAT_APPLE_API_KEY,
        appUserID: userId,
      });

      initializationState = 'initialized';
      console.log('✅ RevenueCat initialized for user:', userId);
    } catch (error) {
      initializationState = 'failed';
      console.error('❌ Failed to initialize RevenueCat:', error);
      throw error;
    }
  })();

  await initializationPromise;
}

/**
 * Get the subscription tier from RevenueCat entitlements
 */
function getTierFromEntitlements(customerInfo: CustomerInfo): SubscriptionTier {
  // Check for Pro entitlement first (highest tier)
  if (customerInfo.entitlements.active[ENTITLEMENTS.PRO]) {
    return 'pro';
  }

  // Check for Premium entitlement
  if (customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM]) {
    return 'premium';
  }

  // Default to free
  return 'free';
}

/**
 * Get subscription status from RevenueCat
 */
function getStatusFromCustomerInfo(customerInfo: CustomerInfo): SubscriptionStatus {
  const activeEntitlement =
    customerInfo.entitlements.active[ENTITLEMENTS.PRO] ||
    customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM];

  if (!activeEntitlement) {
    return 'expired';
  }

  // Check if in trial
  if (activeEntitlement.periodType === 'TRIAL') {
    return 'trial';
  }

  // Check if in grace period
  if (activeEntitlement.isInGracePeriod) {
    return 'grace_period';
  }

  // Check if cancelled but still active
  if (activeEntitlement.willRenew === false) {
    return 'cancelled';
  }

  return 'active';
}

/**
 * Sync subscription state with RevenueCat
 * This fetches the latest customer info from RevenueCat and updates Supabase
 */
export async function syncSubscriptionWithRevenueCat(): Promise<SubscriptionState> {
  // Wait for initialization
  await waitForInitialization();

  // If already syncing, return the existing promise
  if (isSyncing && syncPromise) {
    console.log('⏳ Sync already in progress, waiting...');
    return syncPromise;
  }

  // Start sync
  isSyncing = true;
  syncPromise = (async () => {
    try {
      // Get customer info from RevenueCat
      const customerInfo = await Purchases.getCustomerInfo();

    const tier = getTierFromEntitlements(customerInfo);
    const status = getStatusFromCustomerInfo(customerInfo);

    const activeEntitlement =
      customerInfo.entitlements.active[ENTITLEMENTS.PRO] ||
      customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM];

    const expiresAt = activeEntitlement?.expirationDate || null;
    const isSandbox = customerInfo.entitlements.active[ENTITLEMENTS.PRO]?.isSandbox ||
                      customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM]?.isSandbox ||
                      false;

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('No authenticated user');
    }

    // Update Supabase with the latest data from RevenueCat
    const { data, error } = await supabase
      .from('subscription_state')
      .upsert({
        user_id: user.id,
        tier,
        status,
        platform: 'ios',
        revenue_cat_id: customerInfo.originalAppUserId,
        expires_at: expiresAt,
        is_sandbox: isSandbox,
        is_debug_override: false, // This came from RevenueCat, not debug
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to update subscription in Supabase:', error);
      throw error;
    }

      console.log(`✅ Synced subscription from RevenueCat: ${tier} (${status})`);

      return {
        userId: data.user_id,
        tier: data.tier,
        status: data.status,
        platform: data.platform,
        revenueCatId: data.revenue_cat_id,
        expiresAt: data.expires_at,
        isSandbox: data.is_sandbox,
        isDebugOverride: data.is_debug_override,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Failed to sync with RevenueCat:', error);
      throw error;
    } finally {
      isSyncing = false;
      syncPromise = null;
    }
  })();

  return syncPromise;
}

/**
 * Get available subscription packages
 */
export async function getAvailablePackages(): Promise<SubscriptionPackage[]> {
  await waitForInitialization();

  try {
    const offerings = await Purchases.getOfferings();

    if (!offerings.current) {
      console.warn('No current offering available');
      return [];
    }

    const currentOffering = offerings.current;
    const packages: SubscriptionPackage[] = [];

    // Map RevenueCat packages to our SubscriptionPackage type
    currentOffering.availablePackages.forEach((pkg: PurchasesPackage) => {
      const productId = pkg.product.identifier;
      let tier: 'premium' | 'pro' = 'premium';
      let period: 'monthly' | 'yearly' = 'monthly';

      // Determine tier and period from product ID
      if (productId === PRODUCT_IDS.PREMIUM_MONTHLY) {
        tier = 'premium';
        period = 'monthly';
      } else if (productId === PRODUCT_IDS.PREMIUM_YEARLY) {
        tier = 'premium';
        period = 'yearly';
      } else if (productId === PRODUCT_IDS.PRO_MONTHLY) {
        tier = 'pro';
        period = 'monthly';
      } else if (productId === PRODUCT_IDS.PRO_YEARLY) {
        tier = 'pro';
        period = 'yearly';
      }

      // Calculate price per month
      const price = pkg.product.price;
      const pricePerMonth = period === 'yearly' ? price / 12 : price;

      // Calculate savings for yearly plans
      let savings: string | undefined;
      if (period === 'yearly') {
        const monthlyCost = pricePerMonth * 12;
        const yearlyCost = price;
        const savingsPercent = Math.round(((monthlyCost - yearlyCost) / monthlyCost) * 100);
        savings = `Save ${savingsPercent}%`;
      }

      packages.push({
        identifier: pkg.identifier,
        productId: pkg.product.identifier,
        title: pkg.product.title,
        description: pkg.product.description,
        price: pkg.product.priceString,
        pricePerMonth: `$${pricePerMonth.toFixed(2)}`,
        period,
        tier,
        savings,
      });
    });

    console.log(`✅ Loaded ${packages.length} subscription packages`);
    return packages;
  } catch (error) {
    console.error('Failed to load packages:', error);
    throw error;
  }
}

/**
 * Purchase a subscription package
 */
export async function purchasePackage(packageIdentifier: string): Promise<void> {
  await waitForInitialization();

  try {
    const offerings = await Purchases.getOfferings();

    if (!offerings.current) {
      throw new Error('No offerings available');
    }

    const pkg = offerings.current.availablePackages.find(
      (p) => p.identifier === packageIdentifier
    );

    if (!pkg) {
      throw new Error(`Package not found: ${packageIdentifier}`);
    }

    console.log(`🛒 Purchasing package: ${packageIdentifier}`);

    const { customerInfo } = await Purchases.purchasePackage(pkg);

    console.log('✅ Purchase successful');

    // Sync the new subscription state
    await syncSubscriptionWithRevenueCat();
  } catch (error: any) {
    // Check if user cancelled
    if (error.userCancelled) {
      console.log('User cancelled purchase');
      throw new Error('Purchase cancelled');
    }

    console.error('Purchase failed:', error);
    throw error;
  }
}

/**
 * Restore previous purchases
 */
export async function restorePurchases(): Promise<void> {
  await waitForInitialization();

  try {
    console.log('🔄 Restoring purchases...');

    const customerInfo = await Purchases.restorePurchases();

    console.log('✅ Purchases restored');

    // Sync the restored subscription state
    await syncSubscriptionWithRevenueCat();
  } catch (error) {
    console.error('Failed to restore purchases:', error);
    throw error;
  }
}

/**
 * Check if user has an active subscription
 */
export async function hasActiveSubscription(): Promise<boolean> {
  await waitForInitialization();

  try {
    const customerInfo = await Purchases.getCustomerInfo();

    return (
      Object.keys(customerInfo.entitlements.active).length > 0
    );
  } catch (error) {
    console.error('Failed to check subscription status:', error);
    return false;
  }
}

/**
 * Get subscription expiration date
 */
export async function getSubscriptionExpirationDate(): Promise<Date | null> {
  await waitForInitialization();

  try {
    const customerInfo = await Purchases.getCustomerInfo();

    const activeEntitlement =
      customerInfo.entitlements.active[ENTITLEMENTS.PRO] ||
      customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM];

    if (!activeEntitlement) {
      return null;
    }

    return activeEntitlement.expirationDate ? new Date(activeEntitlement.expirationDate) : null;
  } catch (error) {
    console.error('Failed to get expiration date:', error);
    return null;
  }
}

/**
 * Check if user is in a trial period
 */
export async function isInTrialPeriod(): Promise<boolean> {
  await waitForInitialization();

  try {
    const customerInfo = await Purchases.getCustomerInfo();

    const activeEntitlement =
      customerInfo.entitlements.active[ENTITLEMENTS.PRO] ||
      customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM];

    return activeEntitlement?.periodType === 'TRIAL';
  } catch (error) {
    console.error('Failed to check trial status:', error);
    return false;
  }
}

/**
 * Invalidate customer info cache
 * Useful when you want to force a fresh fetch from RevenueCat servers
 */
export async function invalidateCustomerInfoCache(): Promise<void> {
  await waitForInitialization();

  try {
    await Purchases.invalidateCustomerInfoCache();
    console.log('✅ Customer info cache invalidated');
  } catch (error) {
    console.error('Failed to invalidate cache:', error);
  }
}
