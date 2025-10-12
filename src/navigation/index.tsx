import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { TabNavigator } from './TabNavigator';
import { AuthNavigator } from './AuthNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { useAppStore } from '../store';
import { LoadingSpinner } from '../components';
import { theme } from '../styles/theme';
import { initializeRevenueCat } from '../services/subscriptionService';

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: theme.colors.primary,
    background: theme.colors.background.primary,
    card: theme.colors.surface,
    text: theme.colors.text.primary,
    border: theme.colors.border,
    notification: theme.colors.error,
  },
};

export const AppNavigator: React.FC = () => {
  const {
    isAuthenticated,
    isLoading,
    birthData,
    setLoading,
    user,
    loadSubscriptionState,
    syncWithRevenueCat,
    currentSession,
    currentIChingSession,
    dreamSessionStep,
  } = useAppStore();

  // Temporary fix: reset stuck loading state
  React.useEffect(() => {
    if (isLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, []);

  // Initialize RevenueCat and load subscription when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      const initializeSubscription = async () => {
        try {
          // Check if there's an active oracle session before syncing
          // This prevents re-renders during card reveal or interpretation
          const hasActiveSession = currentSession !== null ||
                                   currentIChingSession !== null ||
                                   dreamSessionStep !== 'input';

          if (hasActiveSession) {
            console.log('⏸️ Skipping subscription sync - active oracle session detected');
            // Still load from Supabase cache, but don't sync with RevenueCat
            await loadSubscriptionState();
            return;
          }

          console.log('🔑 Initializing RevenueCat for user:', user.id);

          // Initialize RevenueCat SDK
          await initializeRevenueCat(user.id);

          // Load subscription state from Supabase
          await loadSubscriptionState();

          // Sync with RevenueCat (will update Supabase if needed)
          await syncWithRevenueCat();

          console.log('✅ Subscription system initialized');
        } catch (error) {
          console.error('❌ Failed to initialize subscription system:', error);
          // Still load from Supabase even if RevenueCat fails
          try {
            await loadSubscriptionState();
          } catch (loadError) {
            console.error('Failed to load subscription from Supabase:', loadError);
          }
        }
      };

      initializeSubscription();
    }
  }, [isAuthenticated, user?.id, loadSubscriptionState, syncWithRevenueCat, currentSession, currentIChingSession, dreamSessionStep]);

  if (isLoading) {
    return <LoadingSpinner size="large" overlay />;
  }

  // Not authenticated: show auth flow
  if (!isAuthenticated) {
    return (
      <NavigationContainer theme={navigationTheme}>
        <AuthNavigator />
      </NavigationContainer>
    );
  }

  // Authenticated but no birth data: show onboarding
  if (!birthData) {
    return (
      <NavigationContainer theme={navigationTheme}>
        <OnboardingNavigator />
      </NavigationContainer>
    );
  }

  // Authenticated with birth data: show main app
  return (
    <NavigationContainer theme={navigationTheme}>
      <TabNavigator />
    </NavigationContainer>
  );
};
