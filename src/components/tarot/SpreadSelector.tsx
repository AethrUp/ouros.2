import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SpreadLayout } from '../../types/tarot';
import { theme } from '../../styles/theme';

interface SpreadSelectorProps {
  spreads: SpreadLayout[];
  onSelect: (spread: SpreadLayout) => void;
}

const SPREAD_ICONS: Record<string, any> = {
  'single-card': 'radio-button-on-outline',
  'three-card': 'triangle-outline',
  'five-elements': 'star-outline',
  'celtic-cross': 'ellipse-outline',
};

export const SpreadSelector: React.FC<SpreadSelectorProps> = ({ spreads, onSelect }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tarot</Text>

      <ScrollView
        style={styles.spreadList}
        contentContainerStyle={styles.spreadListContent}
        showsVerticalScrollIndicator={false}
      >
        {spreads.map((spread) => (
          <TouchableOpacity
            key={spread.id}
            style={styles.spreadCard}
            onPress={() => onSelect(spread)}
            activeOpacity={0.7}
          >
            <View style={styles.spreadIcon}>
              <Ionicons
                name={SPREAD_ICONS[spread.id] || 'apps-outline'}
                size={24}
                color={theme.colors.text.primary}
              />
            </View>

            <View style={styles.spreadInfo}>
              <Text style={styles.spreadName}>{spread.name}</Text>
              <Text style={styles.spreadDescription}>{spread.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.getReadingButton}>
        <Text style={styles.getReadingButtonText}>GET READING</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  title: {
    fontSize: 32,
    fontWeight: '400',
    color: theme.colors.text.primary,
    fontFamily: 'Libre Baskerville',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },
  spreadList: {
    flex: 1,
  },
  spreadListContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  spreadCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  spreadIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spreadInfo: {
    flex: 1,
  },
  spreadName: {
    fontSize: 18,
    fontWeight: '400',
    color: '#D4AF37', // Gold color as seen in screenshot
    fontFamily: 'Libre Baskerville',
    marginBottom: theme.spacing.xs,
  },
  spreadDescription: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontFamily: 'Inter',
    lineHeight: 20,
  },
  getReadingButton: {
    backgroundColor: theme.colors.textInverse || '#FFFFFF',
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  getReadingButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.background.primary,
    letterSpacing: 1.2,
    fontFamily: 'Inter',
  },
});
