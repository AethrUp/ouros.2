import { useAppStore } from '@/store';

/**
 * Hook to check email verification status and provide helper functions
 */
export function useEmailVerification() {
  const { user } = useAppStore();

  const isVerified = user?.emailVerified ?? false;
  const needsVerification = user && !user.emailVerified;

  /**
   * Check if a feature requires email verification
   * Returns true if user can access the feature, false if verification is needed
   */
  const canAccessFeature = (featureName?: string): boolean => {
    if (!user) return false;

    // Features that require email verification
    const restrictedFeatures = [
      'save-chart',
      'share-chart',
      'journal',
      'friends',
      'premium',
    ];

    // If no feature specified, just check if verified
    if (!featureName) return isVerified;

    // If feature is restricted, check verification
    if (restrictedFeatures.includes(featureName)) {
      return isVerified;
    }

    // Feature is not restricted
    return true;
  };

  /**
   * Get a user-friendly message for why verification is needed
   */
  const getVerificationMessage = (featureName?: string): string => {
    const featureMessages: Record<string, string> = {
      'save-chart': 'Please verify your email to save charts',
      'share-chart': 'Please verify your email to share charts',
      'journal': 'Please verify your email to use the journal',
      'friends': 'Please verify your email to add friends',
      'premium': 'Please verify your email to upgrade to premium',
    };

    return featureMessages[featureName || ''] || 'Please verify your email to access this feature';
  };

  return {
    isVerified,
    needsVerification,
    canAccessFeature,
    getVerificationMessage,
  };
}
