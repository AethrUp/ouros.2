import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { DrawnCard } from '../../types/tarot';
import { TarotCard } from './TarotCard';
import { theme } from '../../styles/theme';

interface CardRevealScreenProps {
  drawnCards: DrawnCard[];
  onComplete: () => void;
}

export const CardRevealScreen: React.FC<CardRevealScreenProps> = ({
  drawnCards,
  onComplete,
}) => {
  const [revealedCards, setRevealedCards] = useState<Set<number>>(new Set());

  const handleReveal = (index: number) => {
    const newRevealed = new Set(revealedCards);
    newRevealed.add(index);
    setRevealedCards(newRevealed);
  };

  const allRevealed = revealedCards.size === drawnCards.length;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tarot</Text>

      <ScrollView
        style={styles.cardsContainer}
        contentContainerStyle={styles.cardsContent}
        showsVerticalScrollIndicator={false}
      >
        {drawnCards.map((drawnCard, index) => {
          const isRevealed = revealedCards.has(index);
          const cardInfo = isRevealed ? drawnCard.card : undefined;

          return (
            <View key={index} style={styles.cardRow}>
              <View style={styles.cardWrapper}>
                <TarotCard
                  card={cardInfo}
                  isRevealed={isRevealed}
                  onReveal={() => handleReveal(index)}
                  orientation={drawnCard.orientation}
                  size="medium"
                />
              </View>

              <View style={styles.cardInfo}>
                {isRevealed ? (
                  <>
                    <Text style={styles.cardName}>{drawnCard.card.name}</Text>
                    <Text style={styles.cardDescription}>
                      {drawnCard.orientation === 'upright'
                        ? drawnCard.card.uprightMeaning
                        : drawnCard.card.reversedMeaning}
                    </Text>
                  </>
                ) : (
                  <View style={styles.revealPrompt}>
                    <Text style={styles.positionLabel}>{drawnCard.position}</Text>
                    <TouchableOpacity
                      style={styles.revealButton}
                      onPress={() => handleReveal(index)}
                    >
                      <Text style={styles.revealButtonText}>REVEAL</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {allRevealed && (
        <TouchableOpacity
          style={styles.nextButton}
          onPress={onComplete}
          activeOpacity={0.7}
        >
          <Text style={styles.nextButtonText}>NEXT</Text>
        </TouchableOpacity>
      )}
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
  cardsContainer: {
    flex: 1,
  },
  cardsContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  cardRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  cardWrapper: {
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  cardName: {
    fontSize: 18,
    fontWeight: '400',
    color: theme.colors.text.primary,
    fontFamily: 'Libre Baskerville',
    marginBottom: theme.spacing.xs,
  },
  cardDescription: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontFamily: 'Inter',
    lineHeight: 20,
  },
  revealPrompt: {
    gap: theme.spacing.md,
  },
  positionLabel: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    fontFamily: 'Inter',
  },
  revealButton: {
    backgroundColor: theme.colors.textInverse || '#FFFFFF',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignSelf: 'flex-start',
  },
  revealButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.background.primary,
    letterSpacing: 1.2,
    fontFamily: 'Inter',
  },
  nextButton: {
    backgroundColor: theme.colors.textInverse || '#FFFFFF',
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.background.primary,
    letterSpacing: 1.2,
    fontFamily: 'Inter',
  },
});
