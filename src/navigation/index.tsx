import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { TabNavigator } from './TabNavigator';
import { AuthNavigator } from './AuthNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { useAppStore } from '../store';
import { LoadingSpinner } from '../components';
import { theme } from '../styles/theme';

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
  const { isAuthenticated, isLoading, birthData, setLoading } = useAppStore();

  // Temporary fix: reset stuck loading state
  React.useEffect(() => {
    if (isLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, []);

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
