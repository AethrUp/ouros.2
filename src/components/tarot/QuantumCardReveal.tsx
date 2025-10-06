import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { DrawnCard, SpreadLayout } from '../../types/tarot';
import { TarotCard as TarotCardComponent } from './TarotCard';
import { theme } from '../../styles/theme';

const { width, height } = Dimensions.get('window');

interface QuantumCardRevealProps {
  drawnCards: DrawnCard[];
  spread: SpreadLayout;
  onComplete: () => void;
}

export const QuantumCardReveal: React.FC<QuantumCardRevealProps> = ({
  drawnCards,
  spread,
  onComplete,
}) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [hideInstruction, setHideInstruction] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [revealedPositions, setRevealedPositions] = useState<number[]>([]);

  // Animations
  const cardScale = useRef(new Animated.Value(0)).current;
  const cardRotateY = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const currentCard = drawnCards[currentCardIndex];
  const isLastCard = currentCardIndex === drawnCards.length - 1;

  // Animate card entrance - start bigger (1.2x scale) and slightly higher
  useEffect(() => {
    setIsFlipped(false);
    setHideInstruction(false);
    setShowContent(false);
    contentOpacity.setValue(0);
    cardTranslateY.setValue(-40); // Start 40px higher

    Animated.parallel([
      Animated.spring(cardScale, {
        toValue: 1.2, // Start bigger
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentCardIndex]);

  // Handle card tap - flip animation
  const handleCardTap = () => {
    if (isFlipped) return;

    // Hide instruction text immediately when tapping
    setHideInstruction(true);

    // 3D flip animation
    Animated.timing(cardRotateY, {
      toValue: 180,
      duration: 600,
      useNativeDriver: true,
    }).start(() => {
      // Wait 800ms to let user appreciate the revealed card, then shrink and move into position
      setTimeout(() => {
        Animated.parallel([
          // Shrink card to normal size
          Animated.timing(cardScale, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          // Move card down to final position
          Animated.timing(cardTranslateY, {
            toValue: 0, // Move to normal position (from -40)
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // After card finishes moving, show text/button and fade them in
          setIsFlipped(true);

          Animated.timing(contentOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start(() => {
            setShowContent(true);
          });
        });
      }, 800);
    });
  };

  // Handle next card
  const handleNext = () => {
    if (!isFlipped) return;

    // Slide card to its position in spread
    const position = spread.positions[currentCardIndex];
    const targetX = (position.x - 0.5) * width;
    const targetY = (position.y - 0.5) * height;

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(cardScale, {
        toValue: 0.5, // Scale down for spread
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Mark this position as revealed
      setRevealedPositions([...revealedPositions, currentCardIndex]);

      if (isLastCard) {
        // All cards revealed
        onComplete();
      } else {
        // Move to next card
        setCurrentCardIndex(currentCardIndex + 1);

        // Reset animations for next card
        cardScale.setValue(0);
        cardRotateY.setValue(0);
        cardOpacity.setValue(0);
        cardTranslateY.setValue(-40);
        contentOpacity.setValue(0);
        slideAnim.setValue(0);
      }
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tarot</Text>

      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Card {currentCardIndex + 1} of {drawnCards.length}
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentCardIndex + 1) / drawnCards.length) * 100}%` },
            ]}
          />
        </View>
      </View>

      {/* Main card area */}
      <View style={styles.cardArea}>
        <TouchableOpacity
          onPress={handleCardTap}
          activeOpacity={1}
          disabled={isFlipped}
          style={styles.cardTouchable}
        >
          <Animated.View
            style={[
              styles.cardContainer,
              {
                transform: [
                  { scale: cardScale },
                  { translateY: cardTranslateY },
                  { perspective: 1000 },
                ],
                opacity: cardOpacity,
              },
            ]}
          >
            {/* Card back - visible when rotateY = 0 */}
            <Animated.View
              style={[
                styles.cardSide,
                {
                  transform: [{ rotateY: cardRotateY.interpolate({
                    inputRange: [0, 180],
                    outputRange: ['0deg', '180deg'],
                  }) }],
                  backfaceVisibility: 'hidden',
                },
              ]}
            >
              <TarotCardComponent
                isRevealed={false}
                orientation={currentCard.orientation}
                size="large"
              />
            </Animated.View>

            {/* Card front - visible when rotateY = 180 */}
            <Animated.View
              style={[
                styles.cardSide,
                styles.cardFront,
                {
                  transform: [{ rotateY: cardRotateY.interpolate({
                    inputRange: [0, 180],
                    outputRange: ['180deg', '360deg'],
                  }) }],
                  backfaceVisibility: 'hidden',
                },
              ]}
            >
              <TarotCardComponent
                card={currentCard.card}
                isRevealed={true}
                orientation={currentCard.orientation}
                size="large"
              />
            </Animated.View>
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Instruction text - positioned relative to screen */}
      {!hideInstruction && (
        <Text style={styles.instructionText}>Tap to reveal</Text>
      )}

      {/* Card info and button - absolutely positioned at bottom */}
      {isFlipped && (
        <Animated.View
          style={[
            styles.bottomContent,
            { opacity: contentOpacity }
          ]}
          pointerEvents="box-none"
        >
          <View style={styles.cardInfoContainer}>
            <Text style={styles.cardName}>{currentCard.card.name}</Text>
            <Text style={styles.positionName}>{currentCard.position}</Text>
            <Text style={styles.cardMeaning}>
              {currentCard.orientation === 'upright'
                ? currentCard.card.uprightMeaning
                : currentCard.card.reversedMeaning}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.7}
          >
            <Text style={styles.nextButtonText}>
              {isLastCard ? 'COMPLETE' : 'NEXT'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
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
    paddingBottom: theme.spacing.md,
  },
  progressContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  progressText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontFamily: 'Inter',
    marginBottom: theme.spacing.sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#D4AF37', // Gold
  },
  cardArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  cardTouchable: {
    // Touchable area for the card
  },
  cardContainer: {
    // Container for 3D flip animation
  },
  cardSide: {
    // Individual card side (back or front)
  },
  cardFront: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  instructionText: {
    position: 'absolute',
    top: '68%', // Position in the lower half of the screen
    alignSelf: 'center',
    fontSize: 16,
    color: theme.colors.text.secondary,
    fontFamily: 'Inter',
    textAlign: 'center',
    zIndex: 10,
  },
  cardInfoContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  cardName: {
    fontSize: 24,
    fontWeight: '400',
    color: theme.colors.text.primary,
    fontFamily: 'Libre Baskerville',
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  positionName: {
    fontSize: 14,
    color: '#D4AF37', // Gold
    fontFamily: 'Inter',
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  cardMeaning: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontFamily: 'Inter',
    textAlign: 'center',
    lineHeight: 20,
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
