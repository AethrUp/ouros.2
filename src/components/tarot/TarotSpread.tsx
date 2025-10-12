import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { DrawnCard, SpreadLayout } from '../../types/tarot';
import { TarotCard } from './TarotCard';
import { theme } from '../../styles/theme';

interface TarotSpreadProps {
  drawnCards: DrawnCard[];
  spread: SpreadLayout;
  selectedCardIndex?: number;
  onCardPress?: (index: number) => void;
}

/**
 * TarotSpread Component
 *
 * Displays tarot cards in their proper spread layout positions.
 * Features:
 * - Responsive card sizing based on spread complexity
 * - Scrollable container for large spreads (Celtic Cross)
 * - Maintains aspect ratio and visual hierarchy
 */
export const TarotSpread: React.FC<TarotSpreadProps> = ({
  drawnCards,
  spread,
  selectedCardIndex,
  onCardPress,
}) => {
  const screenWidth = Dimensions.get('window').width;

  // Calculate card size based on spread
  const getCardSize = (): 'small' | 'medium' | 'large' => {
    if (spread.cardCount === 1) return 'large';
    if (spread.cardCount === 3) return 'small'; // Use small for 3-card to fit screen
    if (spread.cardCount <= 3) return 'medium';
    return 'small';
  };

  // Get dimensions for card size - slightly larger for 3-card spread
  const getCardDimensions = () => {
    const size = getCardSize();
    const dimensions = {
      small: spread.cardCount === 3 ? { width: 90, height: 157 } : { width: 80, height: 140 },
      medium: { width: 120, height: 210 },
      large: { width: 160, height: 280 },
    };
    return dimensions[size];
  };

  const cardSize = getCardSize();
  const cardDimensions = getCardDimensions();

  // Calculate spread container dimensions
  // We need to know the bounds of all card positions to size the container
  const calculateSpreadDimensions = () => {
    if (spread.cardCount === 1) {
      // Single card: just center it in available space
      return {
        width: screenWidth,
        height: 300,
      };
    }

    // For multi-card spreads, calculate based on positions
    // We'll use a fixed aspect ratio container that scales to fit screen
    const availableWidth = screenWidth;

    const baseWidth = availableWidth;
    // For 3-card spread, need height for card (157 for slightly larger small size) + label (~30) + some spacing
    const baseHeight = spread.cardCount === 3 ? 210 : spread.cardCount <= 3 ? 250 : 450;

    return {
      width: baseWidth,
      height: baseHeight,
    };
  };

  const spreadDimensions = calculateSpreadDimensions();

  // Render cards at their positions
  const renderCards = () => {
    const isSimpleSpread = spread.cardCount === 1 || spread.cardCount === 3;

    return drawnCards.map((drawnCard, index) => {
      const position = spread.positions[index];

      let left: number;
      let top: number;

      // For 3-card spread, calculate positions based on actual card dimensions
      if (spread.cardCount === 3) {
        const edgePadding = 16; // Padding on edges to narrow container
        const totalCardsWidth = cardDimensions.width * 3;
        const availableSpace = spreadDimensions.width - totalCardsWidth - (edgePadding * 2);
        const gap = availableSpace / 2; // 2 gaps between the 3 cards

        // Position cards with equal spacing
        left = edgePadding + (index * (cardDimensions.width + gap));
        top = position.y * spreadDimensions.height - cardDimensions.height / 2;
      } else {
        // Calculate absolute position from normalized coordinates (0-1)
        left = position.x * spreadDimensions.width - cardDimensions.width / 2;
        top = position.y * spreadDimensions.height - cardDimensions.height / 2;
      }

      // Apply rotation if specified in position
      const rotation = position.rotation || 0;

      return (
        <TouchableOpacity
          key={index}
          style={[
            styles.cardPosition,
            {
              left,
              top,
              width: cardDimensions.width,
              height: cardDimensions.height + (isSimpleSpread ? 30 : 0),
              transform: [{ rotate: `${rotation}deg` }],
            },
          ]}
          onPress={() => onCardPress?.(index)}
          activeOpacity={isSimpleSpread ? 1 : 0.7}
          disabled={isSimpleSpread}
        >
          <TarotCard
            card={drawnCard.card}
            isRevealed={true}
            orientation={drawnCard.orientation}
            size={cardSize}
            isSelected={!isSimpleSpread && selectedCardIndex === index}
          />
          {isSimpleSpread && (
            <Text style={styles.cardName}>{drawnCard.card.name}</Text>
          )}
        </TouchableOpacity>
      );
    });
  };

  // Render the spread container - no scrolling needed, everything fits
  return (
    <View style={styles.centeredContainer}>
      <View style={[styles.spreadContainer, { width: spreadDimensions.width, height: spreadDimensions.height }]}>
        {renderCards()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  centeredContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spreadContainer: {
    position: 'relative',
  },
  cardPosition: {
    position: 'absolute',
  },
  cardName: {
    fontSize: 20,
    fontWeight: '400',
    color: '#F6D99F',
    fontFamily: 'PTSerif_400Regular',
    textAlign: 'center',
    marginTop: 12,
    width: '100%',
  },
});
