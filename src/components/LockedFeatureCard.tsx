import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../styles';
import { Button } from './Button';

interface LockedFeatureCardProps {
  /**
   * Feature name to display
   */
  featureName: string;

  /**
   * Short description of what this feature provides
   */
  featureDescription: string;

  /**
   * Required tier to unlock this feature
   */
  requiredTier: 'premium' | 'pro';

  /**
   * Callback when user taps the upgrade button
   */
  onUpgrade: () => void;

  /**
   * Content to show blurred behind the lock overlay
   */
  children?: React.ReactNode;

  /**
   * Style for the card container
   */
  style?: ViewStyle;

  /**
   * Minimum height for the card
   */
  minHeight?: number;
}

/**
 * Displays a locked feature card with blurred content and upgrade prompt
 * Used to show premium/pro features to lower-tier users
 */
export const LockedFeatureCard: React.FC<LockedFeatureCardProps> = ({
  featureName,
  featureDescription,
  requiredTier,
  onUpgrade,
  children,
  style,
  minHeight = 200,
}) => {
  const tierLabel = requiredTier === 'pro' ? 'PRO' : 'PREMIUM';
  const tierColor = requiredTier === 'pro' ? '#FFD700' : '#9B85AE';

  return (
    <View style={[styles.container, { minHeight }, style]}>
      {/* Blurred content behind */}
      {children && (
        <View style={styles.contentContainer} pointerEvents="none">
          {children}
        </View>
      )}

      {/* Blur overlay */}
      <BlurView intensity={15} style={styles.blurOverlay} tint="dark" />

      {/* Lock overlay */}
      <View style={styles.lockOverlay}>
        {/* Tier badge */}
        <View style={[styles.tierBadge, { backgroundColor: tierColor }]}>
          <Text style={styles.tierBadgeText}>{tierLabel}</Text>
        </View>

        {/* Lock icon */}
        <View style={styles.lockIconContainer}>
          <Ionicons name="lock-closed" size={40} color={colors.text.primary} />
        </View>

        {/* Feature info */}
        <Text style={styles.featureName}>{featureName}</Text>
        <Text style={styles.featureDescription}>{featureDescription}</Text>

        {/* Upgrade button */}
        <Button
          title={`Unlock with ${tierLabel}`}
          onPress={onUpgrade}
          variant="primary"
          size="small"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: colors.background.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  contentContainer: {
    opacity: 0.4,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(20, 20, 30, 0.6)', // Semi-transparent overlay
  },
  tierBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  tierBadgeText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000000',
    letterSpacing: 1,
  },
  lockIconContainer: {
    marginBottom: spacing.md,
  },
  featureName: {
    ...typography.h3,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  featureDescription: {
    ...typography.body,
    fontSize: 14,
    textAlign: 'center',
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
});
