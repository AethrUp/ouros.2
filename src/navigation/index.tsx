import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { TabNavigator } from './TabNavigator';
import { AuthNavigator } from './AuthNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { useAppStore } from '../store';
import { LoadingScreen } from '../components';
import { theme } from '../styles/theme';
// RevenueCat disabled for web-only deployment
// import { initializeRevenueCat } from '../services/subscriptionService';

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

  // Initialize subscription when user is authenticated
  // RevenueCat disabled - using Supabase-only subscription management
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      return;
    }

    const initializeSubscription = async () => {
      try {
        console.log('🔑 Loading subscription state for user:', user.id);

        // Load subscription state from Supabase
        await loadSubscriptionState();

        console.log('✅ Subscription system initialized');
      } catch (error) {
        console.error('❌ Failed to initialize subscription system:', error);
        // Don't throw - allow app to continue even if subscription load fails
      }
    };

    initializeSubscription();
  }, [isAuthenticated, user?.id]);

  if (isLoading) {
    return <LoadingScreen context="general" />;
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
