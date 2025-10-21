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
import { Button } from './Button';
import { useSubscription } from '../hooks/useFeatureAccess';
import { SubscriptionPackage } from '../types/subscription';
import { getTierBenefits } from '../utils/featureGates';
import { theme } from '../styles/theme';

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
          <Button
            title={selectedPackage ? 'Continue' : 'Select a Plan'}
            onPress={handlePurchase}
            variant="primary"
            size="medium"
            fullWidth
            disabled={!selectedPackage || isPurchasing || isLoading}
            loading={isPurchasing}
          />

          <Button
            title={isLoading ? 'Restoring...' : 'Restore Purchases'}
            onPress={handleRestore}
            variant="text"
            size="medium"
            fullWidth
            disabled={isPurchasing || isLoading}
          />
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
    fontSize: 30,
    fontWeight: '400',
    color: '#F6D99F',
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
  tierSection: {
    marginBottom: theme.spacing.xl,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  tierTitle: {
    fontSize: 20,
    fontWeight: '400',
    color: '#F6D99F',
    fontFamily: 'PTSerif_400Regular',
  },
  tierTitlePro: {
    color: '#F6D99F',
  },
  popularBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: theme.spacing.sm,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  tierDescription: {
    fontSize: theme.fontSize.md,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: theme.spacing.lg,
    fontFamily: 'Inter',
  },
  packagesContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  packageCard: {
    flex: 1,
    padding: theme.spacing.lg,
    borderRadius: 12,
    backgroundColor: theme.colors.background.card,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  packageCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  packagePeriod: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontFamily: 'Inter',
  },
  packagePeriodSelected: {
    color: theme.colors.primary,
  },
  savingsBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  savingsText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  packagePrice: {
    fontSize: 20,
    fontWeight: '400',
    color: '#F6D99F',
    marginBottom: 4,
    fontFamily: 'PTSerif_400Regular',
  },
  packagePriceSelected: {
    color: '#F6D99F',
  },
  packagePricePerMonth: {
    fontSize: theme.fontSize.sm,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: 'Inter',
  },
  packagePricePerMonthSelected: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  benefitsList: {
    gap: theme.spacing.sm,
  },
  benefitItem: {
    flexDirection: 'row',
  },
  benefitBullet: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: theme.colors.primary,
    marginRight: theme.spacing.sm,
    fontFamily: 'Inter',
  },
  benefitText: {
    fontSize: theme.fontSize.md,
    fontWeight: '400',
    color: theme.colors.text.primary,
    flex: 1,
    fontFamily: 'Inter',
  },
  moreBenefits: {
    fontSize: theme.fontSize.sm,
    fontWeight: '400',
    color: theme.colors.primary,
    marginTop: theme.spacing.sm,
    fontStyle: 'italic',
    fontFamily: 'Inter',
  },
  featuresSection: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  featuresTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '400',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1.26,
    fontFamily: 'Inter',
  },
  featuresList: {
    gap: theme.spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
  },
  featureBullet: {
    fontSize: theme.fontSize.md,
    fontWeight: '400',
    color: theme.colors.primary,
    marginRight: theme.spacing.sm,
    fontFamily: 'Inter',
  },
  featureText: {
    fontSize: theme.fontSize.md,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: 'Inter',
  },
  legalText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    lineHeight: 18,
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
