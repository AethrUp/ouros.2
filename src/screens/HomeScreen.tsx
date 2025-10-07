import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { NavigationProps } from '../types';
import { HeaderBar } from '../components';
import { colors, spacing, typography } from '../styles';
import { useAppStore } from '../store';
import { getDailyHoroscope } from '../handlers/horoscopeGeneration';
import { Ionicons } from '@expo/vector-icons';

// Category icon mappings
const categoryIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  love: 'heart',
  career: 'briefcase',
  health: 'fitness',
  family: 'home',
  friendship: 'people',
  travel: 'airplane',
  creativity: 'color-palette',
  spirituality: 'flower',
  education: 'library',
  finance: 'cash',
  personal: 'person',
  social: 'people-circle',
};

export const HomeScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const isMountedRef = useRef(true);

  const {
    profile,
    birthData,
    natalChart,
    dailyHoroscope,
    isLoadingDailyReading,
    isGeneratingHoroscope,
    dailyReadingError,
    setDailyHoroscope,
    setLoadingDailyReading,
    setDailyReadingError,
    setGenerationMetadata,
    setGeneratingHoroscope,
  } = useAppStore();

  // Reset flag on mount and cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    // Reset any stuck flag from previous session
    if (isGeneratingHoroscope) {
      console.log('🔄 Resetting stuck isGeneratingHoroscope flag');
      setGeneratingHoroscope(false);
    }

    return () => {
      isMountedRef.current = false;
      // Cleanup: reset flag on unmount to prevent stuck state
      setGeneratingHoroscope(false);
      setLoadingDailyReading(false);
    };
  }, []);

  // Load horoscope on mount
  useEffect(() => {
    loadHoroscope();
  }, []);

  const loadHoroscope = async (forceRegenerate = false) => {
    if (!natalChart || !profile || !birthData) {
      console.log('⏸️ Waiting for natal chart and profile data...');
      return;
    }

    // Guard against concurrent generation
    if (isGeneratingHoroscope) {
      console.log('⏸️ Horoscope generation already in progress...');
      return;
    }

    try {
      setLoadingDailyReading(true);
      setGeneratingHoroscope(true);

      const userProfile = {
        ...profile,
        birthDate: birthData.birthDate,
        birthTime: birthData.birthTime,
        birthLocation: birthData.birthLocation,
        selectedCategories: profile.selectedCategories || [],
      };

      const result = await getDailyHoroscope(natalChart, userProfile, dailyHoroscope, { forceRegenerate });

      if (result.success && result.horoscope) {
        if (isMountedRef.current) {
          setDailyHoroscope(result.horoscope);

          if (result.metadata) {
            setGenerationMetadata(result.metadata);
          }
        }
      } else {
        if (isMountedRef.current) {
          setDailyReadingError(result.error || 'Failed to generate horoscope');
        }
      }
    } catch (error: any) {
      console.error('Error loading horoscope:', error);
      if (isMountedRef.current) {
        setDailyReadingError(error.message);
      }
    } finally {
      // Always reset flags, even if unmounted, to prevent stuck state
      setLoadingDailyReading(false);
      setGeneratingHoroscope(false);
    }
  };

  // Get current date
  const getCurrentDate = () => {
    const today = new Date();
    return today
      .toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
      .toUpperCase();
  };

  // Navigate to full horoscope
  const viewFullHoroscope = () => {
    navigation.navigate('DailyHoroscope');
  };

  // Render category previews
  const renderCategoryPreviews = () => {
    const selectedCategories = profile?.selectedCategories || [];
    if (selectedCategories.length === 0) return null;

    const categoryAdvice = dailyHoroscope?.preview?.categoryAdvice || {};

    return (
      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>YOUR CATEGORIES</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {selectedCategories.map((category) => {
            const advice = categoryAdvice[category];
            if (!advice) return null;

            const iconName = categoryIcons[category];

            return (
              <TouchableOpacity
                key={category}
                style={styles.categoryCard}
                onPress={viewFullHoroscope}
              >
                <Ionicons name={iconName} size={24} color={colors.text.primary} />
                <Text style={styles.categoryName}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
                <Text style={styles.categoryPreview} numberOfLines={3}>
                  {advice.content}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <HeaderBar
        title="OUROS"
        rightActions={[
          {
            icon: 'person-circle-outline',
            onPress: () => navigation.navigate('Profile'),
          },
        ]}
      />

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Date Header */}
        <View style={styles.dateHeader}>
          <Text style={styles.dateText}>{getCurrentDate()}</Text>
        </View>

        {/* Loading State */}
        {isLoadingDailyReading && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.text.primary} />
            <Text style={styles.loadingText}>Generating your daily horoscope...</Text>
            <Text style={styles.loadingSubtext}>Calculating transits & AI interpretation</Text>
          </View>
        )}

        {/* Error State */}
        {dailyReadingError && !isLoadingDailyReading && (
          <View style={styles.errorCard}>
            <Ionicons name="warning-outline" size={32} color={colors.text.secondary} />
            <Text style={styles.errorText}>{dailyReadingError}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => loadHoroscope(true)}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Horoscope Preview */}
        {!isLoadingDailyReading && !dailyReadingError && dailyHoroscope && (
          <>
            {/* Main Horoscope Card */}
            <TouchableOpacity style={styles.horoscopeCard} onPress={viewFullHoroscope}>
              <Text style={styles.horoscopeTitle}>{dailyHoroscope.preview?.title}</Text>
              <Text style={styles.horoscopeSummary} numberOfLines={4}>
                {dailyHoroscope.preview?.summary}
              </Text>

              <View style={styles.readMoreContainer}>
                <Text style={styles.readMoreText}>READ FULL HOROSCOPE</Text>
              </View>
            </TouchableOpacity>

            {/* Category Previews */}
            {renderCategoryPreviews()}
          </>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>EXPLORE</Text>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('journal', { screen: 'chart' })}
          >
            <Ionicons name="planet-outline" size={24} color={colors.text.primary} />
            <Text style={styles.actionTitle}>Natal Chart</Text>
            <Text style={styles.actionSubtitle}>View your birth chart</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('journal')}
          >
            <Ionicons name="book-outline" size={24} color={colors.text.primary} />
            <Text style={styles.actionTitle}>Journal</Text>
            <Text style={styles.actionSubtitle}>Reflect on your journey</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContainer: {
    flex: 1,
  },
  dateHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  dateText: {
    ...typography.caption,
    letterSpacing: 1,
    color: colors.text.secondary,
  },
  loadingCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.xl,
    backgroundColor: colors.background.card,
    borderRadius: 12,
    alignItems: 'center',
  },
  loadingText: {
    ...typography.h3,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  loadingSubtext: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  errorCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.xl,
    backgroundColor: colors.background.card,
    borderRadius: 12,
    alignItems: 'center',
  },
  errorText: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.text.primary + '20',
    borderRadius: 8,
  },
  retryButtonText: {
    ...typography.body,
    color: colors.text.primary,
  },
  horoscopeCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.background.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  horoscopeTitle: {
    ...typography.h2,
    marginBottom: spacing.md,
  },
  horoscopeSummary: {
    ...typography.body,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  readMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.md,
  },
  readMoreText: {
    ...typography.caption,
    letterSpacing: 1,
    backgroundColor: colors.text.primary,
    color: colors.background.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  categoriesSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.caption,
    letterSpacing: 1,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  categoryScroll: {
    paddingLeft: spacing.lg,
  },
  categoryCard: {
    width: 160,
    marginRight: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.background.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryName: {
    ...typography.h3,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  categoryPreview: {
    ...typography.body,
    lineHeight: 16,
    color: colors.text.secondary,
  },
  quickActions: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  actionCard: {
    padding: spacing.lg,
    backgroundColor: colors.background.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  actionTitle: {
    ...typography.h3,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  actionSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
  bottomSpacer: {
    height: spacing.xl * 2,
  },
});
