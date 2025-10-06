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

interface Category {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

const CATEGORIES: Category[] = [
  { id: 'love', name: 'Love', emoji: '💕', description: 'Romance, relationships, attraction, and emotional connections' },
  { id: 'career', name: 'Career', emoji: '💼', description: 'Professional growth, ambition, success, and work dynamics' },
  { id: 'health', name: 'Health', emoji: '🌱', description: 'Physical wellness, mental health, vitality, and healing' },
  { id: 'family', name: 'Family', emoji: '👨‍👩‍👧‍👦', description: 'Family bonds, home life, ancestry, and domestic harmony' },
  { id: 'friendship', name: 'Friendship', emoji: '🤝', description: 'Social connections, community, networking, and platonic relationships' },
  { id: 'travel', name: 'Travel', emoji: '✈️', description: 'Adventures, exploration, new experiences, and cultural expansion' },
  { id: 'creativity', name: 'Creativity', emoji: '🎨', description: 'Artistic expression, innovation, imagination, and creative projects' },
  { id: 'spirituality', name: 'Spirituality', emoji: '🔮', description: 'Spiritual growth, intuition, higher consciousness, and inner wisdom' },
  { id: 'education', name: 'Education', emoji: '📚', description: 'Learning, skill development, knowledge acquisition, and intellectual growth' },
];

export const OnboardingScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const { updatePreferences } = useAppStore();

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter((id) => id !== categoryId));
    } else if (selectedCategories.length < 3) {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  const handleContinue = async () => {
    if (selectedCategories.length !== 3) {
      return;
    }

    // Save selected categories to preferences
    await updatePreferences({ focusAreas: selectedCategories });

    // Navigate to birth data collection
    navigation.navigate('birthData');
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
          <Text style={styles.counter}>
            {selectedCategories.length} of 3 selected
          </Text>
        </View>

        <View style={styles.categoriesGrid}>
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
                <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                <Text style={[styles.categoryName, selected && styles.categoryNameSelected]}>
                  {category.name}
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
  counter: {
    ...typography.body,
    color: colors.primary,
    textAlign: 'center',
    fontWeight: '600',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  categoryCard: {
    width: '48%',
    aspectRatio: 1.2,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  categoryCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.background.card,
  },
  categoryEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  categoryName: {
    ...typography.h4,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  categoryNameSelected: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  selectedIndicator: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIndicatorText: {
    color: colors.text.primary,
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
