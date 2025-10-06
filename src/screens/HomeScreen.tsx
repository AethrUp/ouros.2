import React, { useEffect } from 'react';
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
  const {
    profile,
    birthData,
    natalChart,
    dailyHoroscope,
    isLoadingDailyReading,
    dailyReadingError,
    setDailyHoroscope,
    setLoadingDailyReading,
    setDailyReadingError,
    setGenerationMetadata,
  } = useAppStore();

  // Load horoscope on mount
  useEffect(() => {
    loadHoroscope();
  }, []);

  const loadHoroscope = async () => {
    if (!natalChart || !profile || !birthData) {
      console.log('⏸️ Waiting for natal chart and profile data...');
      return;
    }

    try {
      setLoadingDailyReading(true);

      const userProfile = {
        ...profile,
        birthDate: birthData.birthDate,
        birthTime: birthData.birthTime,
        birthLocation: birthData.birthLocation,
        selectedCategories: profile.selectedCategories || [],
      };

      const result = await getDailyHoroscope(natalChart, userProfile, dailyHoroscope);

      if (result.success && result.horoscope) {
        setDailyHoroscope(result.horoscope);

        if (result.metadata) {
          setGenerationMetadata(result.metadata);
        }
      } else {
        setDailyReadingError(result.error || 'Failed to generate horoscope');
      }
    } catch (error: any) {
      console.error('Error loading horoscope:', error);
      setDailyReadingError(error.message);
    } finally {
      setLoadingDailyReading(false);
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
            icon: 'settings-outline',
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
            <TouchableOpacity style={styles.retryButton} onPress={loadHoroscope}>
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

              {/* Cosmic Weather Preview */}
              {dailyHoroscope.preview?.weather && (
                <View style={styles.weatherPreview}>
                  <View style={styles.weatherItem}>
                    <Text style={styles.weatherSymbol}>☽</Text>
                    <Text style={styles.weatherText} numberOfLines={1}>
                      {typeof dailyHoroscope.preview.weather.moon === 'string'
                        ? dailyHoroscope.preview.weather.moon
                        : 'Moon influence'}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.readMoreContainer}>
                <Text style={styles.readMoreText}>READ FULL HOROSCOPE</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.text.primary} />
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
            onPress={() => navigation.navigate('NatalChart')}
          >
            <Ionicons name="planet-outline" size={24} color={colors.text.primary} />
            <Text style={styles.actionTitle}>Natal Chart</Text>
            <Text style={styles.actionSubtitle}>View your birth chart</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Journal')}
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
  weatherPreview: {
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border + '30',
  },
  weatherItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  weatherSymbol: {
    marginRight: spacing.sm,
    color: colors.text.primary,
  },
  weatherText: {
    ...typography.body,
    color: colors.text.secondary,
    flex: 1,
  },
  readMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border + '30',
  },
  readMoreText: {
    ...typography.caption,
    letterSpacing: 1,
    marginRight: spacing.xs,
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
