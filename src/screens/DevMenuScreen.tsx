import React from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProps } from '../types';
import { HeaderBar } from '../components';
import { colors, spacing, typography } from '../styles';
import { useAppStore } from '../store';
import { SubscriptionTier } from '../types/subscription';

export default function DevMenuScreen({ navigation }: NavigationProps) {
  const {
    subscriptionState,
    updateSubscriptionTier,
    resetUsage,
  } = useAppStore();

  const handleSetTier = async (tier: SubscriptionTier) => {
    try {
      await updateSubscriptionTier(tier, true);
      Alert.alert('Success', `Tier set to ${tier} (debug mode)`);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleResetUsage = async () => {
    try {
      await Promise.all([
        resetUsage('tarot'),
        resetUsage('iching'),
        resetUsage('dream'),
        resetUsage('synastry'),
        resetUsage('journal'),
      ]);
      Alert.alert('Success', 'All usage counts reset');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleResetTours = async () => {
    try {
      // Get all keys from AsyncStorage
      const allKeys = await AsyncStorage.getAllKeys();
      // Filter for tour-related keys
      const tourKeys = allKeys.filter(key => key.startsWith('tour_'));
      // Remove all tour keys
      if (tourKeys.length > 0) {
        await AsyncStorage.multiRemove(tourKeys);
        Alert.alert('Success', `Reset ${tourKeys.length} tour(s). Restart the app to see tours again.`);
      } else {
        Alert.alert('Info', 'No tours found to reset');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBar title="Developer Menu" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Subscription */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Subscription</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tier:</Text>
              <Text style={styles.infoValue}>{subscriptionState?.tier || 'unknown'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status:</Text>
              <Text style={styles.infoValue}>{subscriptionState?.status || 'unknown'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Debug Override:</Text>
              <Text style={styles.infoValue}>
                {subscriptionState?.isDebugOverride ? 'YES' : 'NO'}
              </Text>
            </View>
          </View>
        </View>

        {/* Set Tier */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Set Subscription Tier (Debug)</Text>
          <Text style={styles.description}>
            This will set your tier in debug mode for testing
          </Text>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.tierButton}
              onPress={() => handleSetTier('free')}
            >
              <Text style={styles.tierButtonText}>Free</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tierButton, { backgroundColor: colors.primary }]}
              onPress={() => handleSetTier('premium')}
            >
              <Text style={styles.tierButtonText}>Premium</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tierButton, { backgroundColor: colors.accent }]}
              onPress={() => handleSetTier('pro')}
            >
              <Text style={styles.tierButtonText}>Pro</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Usage Tracking */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Usage Tracking</Text>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleResetUsage}
          >
            <Text style={styles.resetButtonText}>Reset All Usage Counts</Text>
          </TouchableOpacity>
        </View>

        {/* Tours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Tours</Text>
          <Text style={styles.description}>
            Reset tours to see them again on next app launch
          </Text>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleResetTours}
          >
            <Text style={styles.resetButtonText}>Reset All Tours</Text>
          </TouchableOpacity>
        </View>

        {/* Warning */}
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            ⚠️ This menu is for development/testing only.{'\n'}
            Debug overrides will be cleared when you sync with RevenueCat.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    fontSize: 14,
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    ...typography.body,
    color: colors.text.secondary,
  },
  infoValue: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tierButton: {
    flex: 1,
    backgroundColor: colors.background.card,
    padding: spacing.md,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tierButtonText: {
    ...typography.button,
    color: colors.text.primary,
  },
  resetButton: {
    backgroundColor: colors.background.card,
    padding: spacing.md,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  resetButtonText: {
    ...typography.button,
    color: colors.text.primary,
  },
  warningContainer: {
    backgroundColor: colors.background.card,
    padding: spacing.lg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ff9800',
    marginTop: spacing.lg,
  },
  warningText: {
    ...typography.body,
    color: '#ff9800',
    textAlign: 'center',
    fontSize: 14,
  },
});
