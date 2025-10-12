import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { NavigationProps } from '../types';
import { Button } from '../components';
import { useAppStore } from '../store';
import { colors, spacing, typography } from '../styles';
import { handleChartGeneration } from '../handlers/chartGeneration';

interface Category {
  id: string;
  name: string;
  description: string;
}

const CATEGORIES: Category[] = [
  { id: 'love', name: 'Love', description: 'Romance, relationships, attraction, and emotional connections' },
  { id: 'career', name: 'Career', description: 'Professional growth, ambition, success, and work dynamics' },
  { id: 'health', name: 'Health', description: 'Physical wellness, mental health, vitality, and healing' },
  { id: 'family', name: 'Family', description: 'Family bonds, home life, ancestry, and domestic harmony' },
  { id: 'friendship', name: 'Friendship', description: 'Social connections, community, networking, and platonic relationships' },
  { id: 'travel', name: 'Travel', description: 'Adventures, exploration, new experiences, and cultural expansion' },
  { id: 'creativity', name: 'Creativity', description: 'Artistic expression, innovation, imagination, and creative projects' },
  { id: 'spirituality', name: 'Spirituality', description: 'Spiritual growth, intuition, higher consciousness, and inner wisdom' },
  { id: 'education', name: 'Education', description: 'Learning, skill development, knowledge acquisition, and intellectual growth' },
];

export const OnboardingScreen: React.FC<NavigationProps> = ({ navigation, route }) => {
  const { date, time, location } = route.params as any;
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const { updatePreferences, updateBirthData, saveNatalChart, setAppLoading, user } = useAppStore();

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter((id) => id !== categoryId));
    } else if (selectedCategories.length < 3) {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  const handleContinue = async () => {
    if (selectedCategories.length !== 3 || !date || !time || !location || !user) {
      return;
    }

    setAppLoading(true);
    try {
      // Step 1: Save selected categories to preferences
      await updatePreferences({ focusAreas: selectedCategories });

      // Step 2: Format and save birth data
      const birthData = {
        birthDate: date.toISOString().split('T')[0], // YYYY-MM-DD
        birthTime: `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`,
        timeUnknown: false,
        birthLocation: location,
        timezone: location.timezone,
      };

      console.log('💾 Saving birth data to database...');
      await updateBirthData(birthData);

      // Step 3: Generate natal chart
      console.log('🌟 Generating natal chart...');
      const result = await handleChartGeneration(birthData, {
        houseSystem: 'placidus',
        precision: 'professional',
        includeReports: true,
        includeAspects: true,
        includeMinorAspects: false,
        includeMidpoints: false,
        forceRegenerate: true,
      });

      if (result.success && result.data?.chartData) {
        // Step 4: Save natal chart to database
        console.log('💾 Saving natal chart to database...');
        await saveNatalChart(user.id, result.data.chartData, 'placidus');

        // Birth data is now saved - AppNavigator will automatically switch to TabNavigator
        console.log('✅ Onboarding complete!');
      } else {
        console.error('Chart generation failed:', result.message);
        alert('Failed to generate chart. Please try again.');
      }
    } catch (error: any) {
      console.error('Chart generation/save error:', error);
      alert(`An error occurred: ${error.message || 'Please try again.'}`);
    } finally {
      setAppLoading(false);
    }
  };

  const isSelected = (categoryId: string) => selectedCategories.includes(categoryId);
  const canContinue = selectedCategories.length === 3;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>What brings you here?</Text>
          <Text style={styles.subtitle}>
            Select 3 areas you'd like to focus on
          </Text>
          <View style={styles.progressContainer}>
            {[0, 1, 2].map((index) => (
              <View
                key={index}
                style={[
                  styles.progressBar,
                  {
                    opacity: index < selectedCategories.length ? 1 : 0.3,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.categoriesList}>
          {CATEGORIES.map((category) => {
            const selected = isSelected(category.id);
            return (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  selected && styles.categoryCardSelected,
                ]}
                onPress={() => toggleCategory(category.id)}
                activeOpacity={0.7}
                disabled={!selected && selectedCategories.length >= 3}
              >
                <Text style={styles.categoryName}>
                  {category.name}
                </Text>
                <Text style={styles.categoryDescription}>
                  {category.description}
                </Text>
                {selected && (
                  <View style={styles.selectedIndicator}>
                    <Text style={styles.selectedIndicatorText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={!canContinue}
          fullWidth
          variant="primary"
          testId="onboarding-continue-button"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: 100,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    fontSize: 32,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.h4,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.md,
  },
  progressBar: {
    width: 40,
    height: 8,
    backgroundColor: colors.text.primary,
    borderRadius: 2,
  },
  categoriesList: {
    gap: spacing.md,
  },
  categoryCard: {
    padding: spacing.lg,
    backgroundColor: colors.background.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    position: 'relative',
  },
  categoryCardSelected: {
    borderColor: '#F6D99F',
    borderWidth: 2,
  },
  categoryName: {
    ...typography.h3,
    fontSize: 20,
    color: '#F6D99F',
    fontFamily: 'PTSerif_400Regular',
    letterSpacing: 0,
    marginBottom: spacing.xs,
  },
  categoryDescription: {
    ...typography.body,
    color: colors.text.primary,
  },
  selectedIndicator: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F6D99F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIndicatorText: {
    color: colors.background.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
