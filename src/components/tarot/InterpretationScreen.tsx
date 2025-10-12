import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DrawnCard, SpreadLayout } from '../../types/tarot';
import { TarotCard } from './TarotCard';
import { TarotSpread } from './TarotSpread';
import { HeaderBar } from '../HeaderBar';
import { theme } from '../../styles/theme';

interface InterpretationScreenProps {
  drawnCards: DrawnCard[];
  spread: SpreadLayout;
  intention: string;
  interpretation: string;
  onSave: () => void;
  onJournal: () => void;
}

export const InterpretationScreen: React.FC<InterpretationScreenProps> = ({
  drawnCards,
  spread,
  intention,
  interpretation,
  onSave,
  onJournal,
}) => {
  const [selectedCardIndex, setSelectedCardIndex] = useState<number>(0);

  const selectedCard = drawnCards[selectedCardIndex];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tarot Reading</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton} onPress={onSave} activeOpacity={0.7}>
            <Ionicons name="bookmark-outline" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={onJournal} activeOpacity={0.7}>
            <Ionicons name="journal-outline" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Spread Layout - no horizontal padding so it can use full width */}
        <View style={styles.spreadSection}>
          <View style={styles.spreadWrapper}>
            <TarotSpread
              drawnCards={drawnCards}
              spread={spread}
              selectedCardIndex={selectedCardIndex}
              onCardPress={setSelectedCardIndex}
            />
          </View>
        </View>

        {/* Content with padding */}
        <View style={styles.contentContainer}>

        {/* Selected Card Details - Only show for Celtic Cross */}
        {selectedCard && spread.cardCount > 3 && (
          <View style={styles.selectedCardSection}>
            <Text style={styles.selectedCardName}>{selectedCard.card.name}</Text>
            <Text style={styles.selectedCardMeaning}>
              {selectedCard.orientation === 'upright'
                ? selectedCard.card.uprightMeaning
                : selectedCard.card.reversedMeaning}
            </Text>
          </View>
        )}

        {/* Interpretation */}
        <View style={styles.interpretationSection}>
          <Text style={styles.interpretationText}>{interpretation}</Text>
        </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '400',
    color: theme.colors.text.primary,
    fontFamily: 'PTSerif_400Regular',
  },
  headerActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  iconButton: {
    padding: theme.spacing.xs,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  spreadSection: {
    marginBottom: 0,
    paddingBottom: 0,
  },
  spreadWrapper: {
    paddingVertical: theme.spacing.sm,
  },
  selectedCardSection: {
    marginBottom: theme.spacing.xl,
    marginTop: theme.spacing.lg,
  },
  selectedCardName: {
    fontSize: 20,
    fontWeight: '400',
    color: '#F6D99F',
    fontFamily: 'PTSerif_400Regular',
    marginBottom: theme.spacing.sm,
  },
  selectedCardMeaning: {
    fontSize: 12,
    color: theme.colors.text.primary,
    fontFamily: 'Inter',
    lineHeight: 18,
  },
  interpretationSection: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  interpretationTitle: {
    fontSize: 14,
    fontWeight: '400',
    color: theme.colors.text.primary,
    fontFamily: 'Libre Baskerville',
    marginBottom: theme.spacing.md,
  },
  interpretationText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontFamily: 'Inter',
    lineHeight: 22,
  },
});
