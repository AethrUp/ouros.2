import React from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { DrawnCard, SpreadLayout } from '../../types/tarot';
import { TarotCard } from './TarotCard';

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
    if (spread.cardCount <= 3) return 'medium';
    return 'small';
  };

  // Get dimensions for card size
  const getCardDimensions = () => {
    const size = getCardSize();
    const dimensions = {
      small: { width: 52, height: 91 },
      medium: { width: 90, height: 157 },
      large: { width: 120, height: 210 },
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
    const padding = 32; // Account for padding
    const availableWidth = screenWidth - padding;

    const baseWidth = spread.cardCount <= 3 ? availableWidth : availableWidth;
    const baseHeight = spread.cardCount <= 3 ? 250 : 450;

    return {
      width: baseWidth,
      height: baseHeight,
    };
  };

  const spreadDimensions = calculateSpreadDimensions();

  // Render cards at their positions
  const renderCards = () => {
    return drawnCards.map((drawnCard, index) => {
      const position = spread.positions[index];

      // Calculate absolute position from normalized coordinates (0-1)
      const left = position.x * spreadDimensions.width - cardDimensions.width / 2;
      const top = position.y * spreadDimensions.height - cardDimensions.height / 2;

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
              height: cardDimensions.height,
              transform: [{ rotate: `${rotation}deg` }],
            },
          ]}
          onPress={() => onCardPress?.(index)}
          activeOpacity={0.7}
        >
          <TarotCard
            card={drawnCard.card}
            isRevealed={true}
            orientation={drawnCard.orientation}
            size={cardSize}
            isSelected={selectedCardIndex === index}
          />
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
});
