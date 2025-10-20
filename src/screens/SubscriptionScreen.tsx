import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NavigationProps } from '../types';
import { HeaderBar, LoadingScreen } from '../components';
import { PaywallModal } from '../components/PaywallModal';
import { useSubscriptionTier } from '../hooks/useFeatureAccess';
import { useAppStore } from '../store';
import { getTierDisplayName, getTierBenefits } from '../utils/featureGates';
import { TIER_LIMITS } from '../types/subscription';
import { colors, spacing, typography } from '../styles/theme';

export const SubscriptionScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const { tier, status, isActive, subscriptionState, isLoading } = useSubscriptionTier();
  const { usageTracking, loadUsageTracking, syncWithRevenueCat } = useAppStore();
  const [showPaywall, setShowPaywall] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadUsageTracking();
  }, [loadUsageTracking]);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      await syncWithRevenueCat();
      Alert.alert('Success', 'Subscription synced successfully');
    } catch (error: any) {
      Alert.alert('Sync Failed', error.message || 'Failed to sync subscription');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManageSubscription = () => {
    // This opens the iOS subscription management in Settings
    Alert.alert(
      'Manage Subscription',
      'To manage your subscription, go to Settings > Apple ID > Subscriptions',
      [
        { text: 'OK', style: 'default' },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <HeaderBar title="Subscription" />
        <View style={styles.loadingContainer}>
          <LoadingScreen context="general" />
        </View>
      </View>
    );
  }

  const tierName = getTierDisplayName(tier);
  const expiresAt = subscriptionState?.expiresAt
    ? new Date(subscriptionState.expiresAt).toLocaleDateString()
    : null;

  return (
    <View style={styles.container}>
      <HeaderBar title="Subscription" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Plan */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Plan</Text>
          <View style={[styles.planCard, tier !== 'free' && styles.planCardActive]}>
            <View style={styles.planHeader}>
              <Text style={[styles.planName, tier !== 'free' && styles.planNameActive]}>
                {tierName}
              </Text>
              {tier !== 'free' && (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>ACTIVE</Text>
                </View>
              )}
            </View>

            {tier !== 'free' && (
              <View style={styles.planDetails}>
                <DetailRow label="Status" value={status.toUpperCase()} />
                {expiresAt && <DetailRow label="Renews" value={expiresAt} />}
                {subscriptionState?.platform && (
                  <DetailRow label="Platform" value={subscriptionState.platform.toUpperCase()} />
                )}
              </View>
            )}

            {tier === 'free' && (
              <Text style={styles.planDescription}>
                Upgrade to unlock unlimited readings and advanced features
              </Text>
            )}
          </View>

          {tier !== 'free' && (
            <TouchableOpacity
              style={styles.manageButton}
              onPress={handleManageSubscription}
            >
              <Text style={styles.manageButtonText}>Manage Subscription</Text>
            </TouchableOpacity>
          )}

          {tier === 'free' && (
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => setShowPaywall(true)}
            >
              <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Usage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Usage</Text>
          <View style={styles.usageCard}>
            <UsageRow
              feature="Tarot"
              current={usageTracking.tarot?.count || 0}
              limit={TIER_LIMITS[tier].tarot}
            />
            <UsageRow
              feature="I Ching"
              current={usageTracking.iching?.count || 0}
              limit={TIER_LIMITS[tier].iching}
            />
            <UsageRow
              feature="Dream"
              current={usageTracking.dream?.count || 0}
              limit={TIER_LIMITS[tier].dream}
            />
            <UsageRow
              feature="Synastry"
              current={usageTracking.synastry?.count || 0}
              limit={TIER_LIMITS[tier].synastry}
            />
            <UsageRow
              feature="Journal"
              current={usageTracking.journal?.count || 0}
              limit={TIER_LIMITS[tier].journal}
            />
          </View>
          <Text style={styles.usageNote}>
            {tier === 'free' ? 'Daily limits reset every 24 hours' : 'Unlimited usage with your current plan'}
          </Text>
        </View>

        {/* Features */}
        {tier !== 'pro' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {tier === 'free' ? 'Premium Features' : 'Upgrade to Pro'}
            </Text>
            <View style={styles.featuresCard}>
              {getTierBenefits(tier === 'free' ? 'premium' : 'pro').map((benefit, index) => (
                <View key={index} style={styles.featureItem}>
                  <Text style={styles.featureBullet}>✓</Text>
                  <Text style={styles.featureText}>{benefit}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => setShowPaywall(true)}
            >
              <Text style={styles.upgradeButtonText}>
                Upgrade to {tier === 'free' ? 'Premium' : 'Pro'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Sync Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.syncButton}
            onPress={handleSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={styles.syncButtonText}>Sync Subscription</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Paywall Modal */}
      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSuccess={() => {
          setShowPaywall(false);
          loadUsageTracking();
        }}
      />
    </View>
  );
};

// Helper Components
interface DetailRowProps {
  label: string;
  value: string;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}:</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

interface UsageRowProps {
  feature: string;
  current: number;
  limit: number | 'unlimited';
}

const UsageRow: React.FC<UsageRowProps> = ({ feature, current, limit }) => {
  const limitText = limit === 'unlimited' ? '∞' : limit === 0 ? 'N/A' : limit.toString();
  const percentage =
    limit === 'unlimited' || limit === 0 ? 0 : (current / Number(limit)) * 100;

  return (
    <View style={styles.usageRow}>
      <View style={styles.usageInfo}>
        <Text style={styles.usageFeature}>{feature}</Text>
        <Text style={styles.usageCount}>
          {current} / {limitText}
        </Text>
      </View>
      {limit !== 'unlimited' && limit !== 0 && (
        <View style={styles.usageBar}>
          <View style={[styles.usageBarFill, { width: `${Math.min(percentage, 100)}%` }]} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    color: colors.text,
    marginBottom: spacing.md,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.border,
  },
  planCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  planName: {
    ...typography.h2,
    color: colors.text,
  },
  planNameActive: {
    color: colors.primary,
  },
  activeBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
  },
  activeBadgeText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 10,
  },
  planDetails: {
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  detailValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  planDescription: {
    ...typography.body,
    color: colors.textSecondary,
  },
  manageButton: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  manageButtonText: {
    ...typography.body,
    color: colors.text,
  },
  upgradeButton: {
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  upgradeButtonText: {
    ...typography.button,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  usageCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  usageRow: {
    gap: spacing.sm,
  },
  usageInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  usageFeature: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  usageCount: {
    ...typography.body,
    color: colors.textSecondary,
  },
  usageBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  usageBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  usageNote: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  featuresCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
  },
  featureBullet: {
    ...typography.body,
    color: colors.success,
    marginRight: spacing.sm,
    fontWeight: '700',
  },
  featureText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  syncButton: {
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  syncButtonText: {
    ...typography.body,
    color: colors.primary,
  },
});
