import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useAppStore } from '../store';
import { SubscriptionTier, UsageFeature } from '../types/subscription';
import { colors, typography } from '../styles/theme';

// Only show in development mode
const ENABLE_DEBUG_PANEL = __DEV__;

interface DebugSubscriptionPanelProps {
  visible: boolean;
  onClose: () => void;
}

export const DebugSubscriptionPanel: React.FC<DebugSubscriptionPanelProps> = ({
  visible,
  onClose,
}) => {
  if (!ENABLE_DEBUG_PANEL) return null;

  const {
    subscriptionState,
    usageTracking,
    updateSubscriptionTier,
    resetUsage,
    loadUsageTracking,
    syncWithRevenueCat,
  } = useAppStore();

  const [isUpdating, setIsUpdating] = useState(false);

  const currentTier = subscriptionState?.tier || 'free';

  const handleSetTier = async (tier: SubscriptionTier) => {
    try {
      setIsUpdating(true);
      await updateSubscriptionTier(tier, true); // true = debug override
      Alert.alert('Success', `Subscription tier set to ${tier.toUpperCase()}`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update tier');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetUsage = async (feature: UsageFeature) => {
    try {
      await resetUsage(feature);
      await loadUsageTracking();
      Alert.alert('Success', `Usage reset for ${feature}`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to reset usage');
    }
  };

  const handleSyncRevenueCat = async () => {
    try {
      setIsUpdating(true);
      await syncWithRevenueCat();
      Alert.alert('Success', 'Synced with RevenueCat');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to sync with RevenueCat');
    } finally {
      setIsUpdating(false);
    }
  };

  const features: UsageFeature[] = ['tarot', 'iching', 'dream', 'synastry', 'journal'];

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Debug Subscription Panel</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Current State */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current State</Text>
            <View style={styles.infoCard}>
              <InfoRow label="Tier" value={currentTier.toUpperCase()} />
              <InfoRow label="Status" value={subscriptionState?.status || 'N/A'} />
              <InfoRow label="Platform" value={subscriptionState?.platform || 'N/A'} />
              <InfoRow
                label="Debug Override"
                value={subscriptionState?.isDebugOverride ? 'YES' : 'NO'}
              />
              <InfoRow label="Sandbox" value={subscriptionState?.isSandbox ? 'YES' : 'NO'} />
              <InfoRow
                label="Expires At"
                value={
                  subscriptionState?.expiresAt
                    ? new Date(subscriptionState.expiresAt).toLocaleDateString()
                    : 'N/A'
                }
              />
            </View>
          </View>

          {/* Set Tier */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Set Subscription Tier</Text>
            <Text style={styles.sectionDescription}>
              This will update your subscription tier in Supabase without going through RevenueCat.
              Perfect for testing!
            </Text>

            <View style={styles.tierButtons}>
              <TierButton
                tier="free"
                isActive={currentTier === 'free'}
                onPress={() => handleSetTier('free')}
                disabled={isUpdating}
              />
              <TierButton
                tier="premium"
                isActive={currentTier === 'premium'}
                onPress={() => handleSetTier('premium')}
                disabled={isUpdating}
              />
              <TierButton
                tier="pro"
                isActive={currentTier === 'pro'}
                onPress={() => handleSetTier('pro')}
                disabled={isUpdating}
              />
            </View>
          </View>

          {/* Usage Tracking */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Usage Tracking</Text>
            <View style={styles.infoCard}>
              {features.map((feature) => {
                const usage = usageTracking[feature];
                const count = usage?.count || 0;

                return (
                  <View key={feature} style={styles.usageRow}>
                    <View style={styles.usageInfo}>
                      <Text style={styles.usageLabel}>{feature}</Text>
                      <Text style={styles.usageCount}>Count: {count}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleResetUsage(feature)}
                      style={styles.resetButton}
                    >
                      <Text style={styles.resetButtonText}>Reset</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>

          {/* RevenueCat Sync */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>RevenueCat</Text>
            <Text style={styles.sectionDescription}>
              Sync with RevenueCat to get the latest subscription state from Apple.
            </Text>
            <TouchableOpacity
              onPress={handleSyncRevenueCat}
              style={styles.syncButton}
              disabled={isUpdating}
            >
              <Text style={styles.syncButtonText}>
                {isUpdating ? 'Syncing...' : 'Sync with RevenueCat'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Warning */}
          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>⚠️ Development Only</Text>
            <Text style={styles.warningText}>
              This panel is only available in development builds. It will not appear in production.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

// Helper Components
interface InfoRowProps {
  label: string;
  value: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}:</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

interface TierButtonProps {
  tier: SubscriptionTier;
  isActive: boolean;
  onPress: () => void;
  disabled: boolean;
}

const TierButton: React.FC<TierButtonProps> = ({ tier, isActive, onPress, disabled }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={[styles.tierButton, isActive && styles.tierButtonActive]}
  >
    <Text style={[styles.tierButtonText, isActive && styles.tierButtonTextActive]}>
      {tier.toUpperCase()}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    ...typography.body,
    color: colors.primary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: 8,
  },
  sectionDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  infoValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  tierButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  tierButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  tierButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tierButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  tierButtonTextActive: {
    color: '#FFFFFF',
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  usageInfo: {
    flex: 1,
  },
  usageLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  usageCount: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  resetButton: {
    padding: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.error,
  },
  resetButtonText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  syncButton: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  syncButtonText: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  warningCard: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFE69C',
    marginBottom: 24,
  },
  warningTitle: {
    ...typography.body,
    color: '#856404',
    fontWeight: '700',
    marginBottom: 4,
  },
  warningText: {
    ...typography.caption,
    color: '#856404',
  },
});
