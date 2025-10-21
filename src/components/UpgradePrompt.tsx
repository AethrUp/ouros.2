import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
} from 'react-native';
import { Button } from './Button';
import { UsageFeature, SubscriptionTier } from '../types/subscription';
import { getUpgradeMessage, getUpgradeHeadline, getRecommendedTier, getTierBenefits } from '../utils/featureGates';
import { theme } from '../styles/theme';

interface UpgradePromptProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  feature: UsageFeature;
  currentTier: SubscriptionTier;
  currentUsage: number;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  visible,
  onClose,
  onUpgrade,
  feature,
  currentTier,
  currentUsage,
}) => {
  const recommendedTier = getRecommendedTier(feature);
  const headline = getUpgradeHeadline(feature);
  const message = getUpgradeMessage(feature, currentTier, currentUsage);
  const benefits = getTierBenefits(recommendedTier);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{headline}</Text>
          <View style={styles.closeButton}>
            <Text style={styles.closeButtonText} onPress={onClose}>✕</Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Benefits */}
          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitsTitle}>What you'll get:</Text>
            {benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <Text style={styles.benefitBullet}>•</Text>
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <Button
            title="Upgrade Now"
            onPress={onUpgrade}
            variant="primary"
            size="medium"
            fullWidth
          />

          <Button
            title="Maybe Later"
            onPress={onClose}
            variant="text"
            size="medium"
            fullWidth
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '400',
    color: '#F6D99F',
    textTransform: 'capitalize',
    fontFamily: 'PTSerif_400Regular',
  },
  closeButton: {
    padding: theme.spacing.sm,
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: 'PTSerif_400Regular',
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  message: {
    fontSize: theme.fontSize.md,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
    fontFamily: 'Inter',
  },
  benefitsContainer: {
    marginBottom: theme.spacing.xl,
  },
  benefitsTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '400',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1.26,
    fontFamily: 'Inter',
  },
  benefitItem: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  benefitBullet: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    marginRight: theme.spacing.sm,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  benefitText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
    flex: 1,
    fontFamily: 'Inter',
  },
  bottomActions: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background.primary,
  },
});
