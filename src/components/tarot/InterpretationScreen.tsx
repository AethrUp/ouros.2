import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
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
      <HeaderBar title="TAROT" />

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.saveButton]}
          onPress={onSave}
          activeOpacity={0.7}
        >
          <Text style={styles.saveButtonText}>SAVE READING</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.journalButton]}
          onPress={onJournal}
          activeOpacity={0.7}
        >
          <Text style={styles.journalButtonText}>JOURNAL</Text>
        </TouchableOpacity>
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
  },
  selectedCardName: {
    fontSize: 16,
    fontWeight: '400',
    color: theme.colors.text.primary,
    fontFamily: 'Libre Baskerville',
    marginBottom: theme.spacing.sm,
  },
  selectedCardMeaning: {
    fontSize: 12,
    color: theme.colors.text.primary,
    fontFamily: 'Inter',
    lineHeight: 18,
  },
  interpretationSection: {
    marginTop: theme.spacing.sm,
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
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: theme.colors.textInverse || '#FFFFFF',
  },
  saveButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    letterSpacing: 1.2,
    fontFamily: 'Inter',
  },
  journalButton: {
    backgroundColor: theme.colors.textInverse || '#FFFFFF',
  },
  journalButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.background.primary,
    letterSpacing: 1.2,
    fontFamily: 'Inter',
  },
});
