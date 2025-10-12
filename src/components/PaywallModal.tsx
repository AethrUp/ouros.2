import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSubscription } from '../hooks/useFeatureAccess';
import { SubscriptionPackage } from '../types/subscription';
import { getTierBenefits } from '../utils/featureGates';
import { colors, typography, spacing } from '../styles/theme';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const {
    availablePackages,
    isPurchasing,
    purchaseError,
    loadPackages,
    purchasePackage,
    restorePurchases,
    clearPurchaseError,
  } = useSubscription();

  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadPackages();
    }
  }, [visible, loadPackages]);

  useEffect(() => {
    if (purchaseError) {
      Alert.alert('Purchase Failed', purchaseError);
      clearPurchaseError();
    }
  }, [purchaseError, clearPurchaseError]);

  const handlePurchase = async () => {
    if (!selectedPackage) {
      Alert.alert('Select a Plan', 'Please select a subscription plan');
      return;
    }

    try {
      await purchasePackage(selectedPackage);
      Alert.alert('Success!', 'Your subscription is now active!');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      // Error already handled by subscription hook
    }
  };

  const handleRestore = async () => {
    try {
      setIsLoading(true);
      await restorePurchases();
      Alert.alert('Success', 'Purchases restored successfully');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      Alert.alert('Restore Failed', error.message || 'Failed to restore purchases');
    } finally {
      setIsLoading(false);
    }
  };

  // Group packages by tier
  const premiumPackages = availablePackages.filter(p => p.tier === 'premium');
  const proPackages = availablePackages.filter(p => p.tier === 'pro');

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
          <Text style={styles.title}>Choose Your Plan</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Premium Section */}
          {premiumPackages.length > 0 && (
            <TierSection
              title="Premium"
              description="Perfect for daily insights and guidance"
              packages={premiumPackages}
              benefits={getTierBenefits('premium')}
              selectedPackage={selectedPackage}
              onSelectPackage={setSelectedPackage}
            />
          )}

          {/* Pro Section */}
          {proPackages.length > 0 && (
            <TierSection
              title="Pro"
              description="For advanced astrology enthusiasts"
              packages={proPackages}
              benefits={getTierBenefits('pro')}
              selectedPackage={selectedPackage}
              onSelectPackage={setSelectedPackage}
              isPro={true}
            />
          )}

          {/* Features Comparison */}
          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>All plans include:</Text>
            <View style={styles.featuresList}>
              <FeatureItem text="No ads" />
              <FeatureItem text="Regular updates" />
              <FeatureItem text="Premium support" />
              <FeatureItem text="Cancel anytime" />
            </View>
          </View>

          {/* Legal */}
          <Text style={styles.legalText}>
            Subscriptions automatically renew unless auto-renew is turned off at least 24 hours
            before the end of the current period. Payment will be charged to your Apple ID account.
          </Text>
        </ScrollView>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={[styles.purchaseButton, (!selectedPackage || isPurchasing || isLoading) && styles.purchaseButtonDisabled]}
            onPress={handlePurchase}
            disabled={!selectedPackage || isPurchasing || isLoading}
          >
            {isPurchasing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.purchaseButtonText}>
                {selectedPackage ? 'Continue' : 'Select a Plan'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleRestore}
            style={styles.restoreButton}
            disabled={isPurchasing || isLoading}
          >
            <Text style={styles.restoreButtonText}>
              {isLoading ? 'Restoring...' : 'Restore Purchases'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Helper Components
interface TierSectionProps {
  title: string;
  description: string;
  packages: SubscriptionPackage[];
  benefits: string[];
  selectedPackage: string | null;
  onSelectPackage: (packageId: string) => void;
  isPro?: boolean;
}

const TierSection: React.FC<TierSectionProps> = ({
  title,
  description,
  packages,
  benefits,
  selectedPackage,
  onSelectPackage,
  isPro = false,
}) => (
  <View style={styles.tierSection}>
    <View style={styles.tierHeader}>
      <Text style={[styles.tierTitle, isPro && styles.tierTitlePro]}>{title}</Text>
      {isPro && <View style={styles.popularBadge}><Text style={styles.popularBadgeText}>MOST POPULAR</Text></View>}
    </View>
    <Text style={styles.tierDescription}>{description}</Text>

    {/* Package Options */}
    <View style={styles.packagesContainer}>
      {packages.map((pkg) => (
        <PackageCard
          key={pkg.identifier}
          package={pkg}
          isSelected={selectedPackage === pkg.identifier}
          onSelect={() => onSelectPackage(pkg.identifier)}
        />
      ))}
    </View>

    {/* Benefits */}
    <View style={styles.benefitsList}>
      {benefits.slice(0, 4).map((benefit, index) => (
        <View key={index} style={styles.benefitItem}>
          <Text style={styles.benefitBullet}>✓</Text>
          <Text style={styles.benefitText}>{benefit}</Text>
        </View>
      ))}
      {benefits.length > 4 && (
        <Text style={styles.moreBenefits}>+ {benefits.length - 4} more</Text>
      )}
    </View>
  </View>
);

interface PackageCardProps {
  package: SubscriptionPackage;
  isSelected: boolean;
  onSelect: () => void;
}

const PackageCard: React.FC<PackageCardProps> = ({ package: pkg, isSelected, onSelect }) => (
  <TouchableOpacity
    style={[styles.packageCard, isSelected && styles.packageCardSelected]}
    onPress={onSelect}
  >
    <View style={styles.packageHeader}>
      <Text style={[styles.packagePeriod, isSelected && styles.packagePeriodSelected]}>
        {pkg.period === 'monthly' ? 'Monthly' : 'Yearly'}
      </Text>
      {pkg.savings && (
        <View style={styles.savingsBadge}>
          <Text style={styles.savingsText}>{pkg.savings}</Text>
        </View>
      )}
    </View>
    <Text style={[styles.packagePrice, isSelected && styles.packagePriceSelected]}>
      {pkg.price}
    </Text>
    <Text style={[styles.packagePricePerMonth, isSelected && styles.packagePricePerMonthSelected]}>
      {pkg.pricePerMonth}/month
    </Text>
  </TouchableOpacity>
);

interface FeatureItemProps {
  text: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ text }) => (
  <View style={styles.featureItem}>
    <Text style={styles.featureBullet}>✓</Text>
    <Text style={styles.featureText}>{text}</Text>
  </View>
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
    padding: spacing.lg,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  closeButton: {
    padding: spacing.sm,
  },
  closeButtonText: {
    ...typography.h2,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  tierSection: {
    marginBottom: spacing.xl,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  tierTitle: {
    ...typography.h2,
    color: colors.text,
  },
  tierTitlePro: {
    color: colors.primary,
  },
  popularBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: spacing.sm,
  },
  popularBadgeText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 10,
  },
  tierDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  packagesContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  packageCard: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
  },
  packageCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  packagePeriod: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  packagePeriodSelected: {
    color: colors.primary,
  },
  savingsBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  savingsText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 10,
  },
  packagePrice: {
    ...typography.h2,
    color: colors.text,
    marginBottom: 4,
  },
  packagePriceSelected: {
    color: colors.primary,
  },
  packagePricePerMonth: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  packagePricePerMonthSelected: {
    color: colors.primary,
  },
  benefitsList: {
    gap: spacing.sm,
  },
  benefitItem: {
    flexDirection: 'row',
  },
  benefitBullet: {
    ...typography.body,
    color: colors.success,
    marginRight: spacing.sm,
    fontWeight: '700',
  },
  benefitText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  moreBenefits: {
    ...typography.caption,
    color: colors.primary,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  featuresSection: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  featuresTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  featuresList: {
    gap: spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
  },
  featureBullet: {
    ...typography.body,
    color: colors.primary,
    marginRight: spacing.sm,
  },
  featureText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  legalText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    lineHeight: 18,
  },
  bottomActions: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  purchaseButton: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  purchaseButtonDisabled: {
    opacity: 0.5,
  },
  purchaseButtonText: {
    ...typography.button,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  restoreButton: {
    padding: spacing.md,
    alignItems: 'center',
  },
  restoreButtonText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
