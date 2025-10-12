import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { NavigationProps } from '../types';
import { HeaderBar } from '../components';
import { DebugSubscriptionPanel } from '../components/DebugSubscriptionPanel';
import { colors, spacing, typography } from '../styles';
import { useAppStore } from '../store';

export const ProfileScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const [isResetting, setIsResetting] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const tapCount = useRef(0);
  const tapTimer = useRef<NodeJS.Timeout | null>(null);

  const resetOnboarding = useAppStore((state) => state.resetOnboarding);
  const clearChart = useAppStore((state) => state.clearChart);
  const birthData = useAppStore((state) => state.birthData);
  const logout = useAppStore((state) => state.logout);

  // Triple-tap to open debug panel (dev only)
  const handleTitlePress = () => {
    if (!__DEV__) return;

    tapCount.current += 1;

    if (tapTimer.current) {
      clearTimeout(tapTimer.current);
    }

    tapTimer.current = setTimeout(() => {
      if (tapCount.current >= 3) {
        setShowDebugPanel(true);
      }
      tapCount.current = 0;
    }, 500);
  };

  const handleResetOnboarding = () => {
    Alert.alert(
      'Reset Onboarding',
      'This will clear your birth data and natal chart. You will need to go through onboarding again. Are you sure?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsResetting(true);
              await resetOnboarding();
              clearChart();
              Alert.alert('Success', 'Onboarding has been reset. Please restart the app.');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to reset onboarding');
            } finally {
              setIsResetting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <HeaderBar
        title="Profile"
        rightActions={[
          {
            icon: 'log-out-outline',
            onPress: () => logout(),
          },
        ]}
      />
      <View style={styles.content}>
        <TouchableOpacity onPress={handleTitlePress} activeOpacity={1}>
          <Text style={styles.text}>Profile Screen</Text>
        </TouchableOpacity>

        {birthData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Birth Information</Text>
            <Text style={styles.infoText}>Date: {birthData.birthDate}</Text>
            <Text style={styles.infoText}>Time: {birthData.birthTime}</Text>
            <Text style={styles.infoText}>Location: {birthData.birthLocation.name}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.resetButton, isResetting && styles.resetButtonDisabled]}
          onPress={handleResetOnboarding}
          disabled={isResetting}
        >
          <Text style={styles.resetButtonText}>
            {isResetting ? 'Resetting...' : 'Reset Onboarding'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Debug Panel (dev only) */}
      <DebugSubscriptionPanel
        visible={showDebugPanel}
        onClose={() => setShowDebugPanel(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  text: {
    ...typography.h2,
    marginBottom: spacing.xl,
  },
  section: {
    backgroundColor: colors.background.card,
    padding: spacing.lg,
    borderRadius: 10,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  infoText: {
    ...typography.body,
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  resetButton: {
    backgroundColor: colors.error,
    padding: spacing.md,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 'auto',
  },
  resetButtonDisabled: {
    opacity: 0.5,
  },
  resetButtonText: {
    ...typography.button,
    color: colors.text.primary,
  },
});
