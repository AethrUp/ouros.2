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
import { HeaderBar } from '../HeaderBar';
import { Button } from '../Button';
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

  // Animate card entrance - start bigger (1.2x scale)
  useEffect(() => {
    setIsFlipped(false);
    setHideInstruction(false);
    setShowContent(false);
    contentOpacity.setValue(0);
    cardTranslateY.setValue(0); // Start at normal position

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
      // Wait 800ms to let user appreciate the revealed card, then shrink to normal size
      setTimeout(() => {
        // Shrink card to normal size
        Animated.timing(cardScale, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start(() => {
          // After card finishes shrinking, show text/button and fade them in
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

    // If this is the last card, call onComplete immediately without updating local state
    // Updating local state would cause a re-render race condition with the store update
    if (isLastCard) {
      console.log('✅ Last card revealed, triggering interpretation');
      onComplete();
      return;
    }

    // For non-last cards, mark this position as revealed
    setRevealedPositions([...revealedPositions, currentCardIndex]);

    // For non-last cards, animate to position in spread
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
      // Move to next card
      setCurrentCardIndex(currentCardIndex + 1);

      // Reset animations for next card
      cardScale.setValue(0);
      cardRotateY.setValue(0);
      cardOpacity.setValue(0);
      cardTranslateY.setValue(0);
      contentOpacity.setValue(0);
      slideAnim.setValue(0);
    });
  };

  return (
    <View style={styles.container}>
      <HeaderBar title="TAROT" />

      {/* Card progress indicators */}
      <View style={styles.cardProgressContainer}>
        {drawnCards.map((_, index) => (
          <View
            key={index}
            style={[
              styles.cardProgressBox,
              {
                opacity: revealedPositions.includes(index) || index === currentCardIndex ? 1 : 0.5,
              },
            ]}
          />
        ))}
      </View>

      {/* Main content area with flex layout */}
      <View style={styles.contentArea}>
        {/* Card and text container - treated as one unit */}
        <View style={styles.cardAndTextContainer}>
          {/* Card container */}
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

          {/* Instruction text - shown below card when not flipped */}
          {!hideInstruction && (
            <Text style={styles.instructionText}>Tap to reveal</Text>
          )}

          {/* Card info - shown below card when flipped */}
          {isFlipped && (
            <Animated.View
              style={[
                styles.cardInfoContainer,
                { opacity: contentOpacity }
              ]}
            >
              <Text style={styles.cardName}>{currentCard.card.name}</Text>
              <Text style={styles.positionName}>{currentCard.position}</Text>
              <Text style={styles.cardMeaning}>
                {currentCard.orientation === 'upright'
                  ? currentCard.card.uprightMeaning
                  : currentCard.card.reversedMeaning}
              </Text>
            </Animated.View>
          )}
        </View>

        {/* Spacer to push button to bottom */}
        <View style={{ flex: 1 }} />

        {/* Button at bottom */}
        {isFlipped && (
          <Animated.View
            style={[
              styles.buttonContainer,
              { opacity: contentOpacity }
            ]}
          >
            <Button
              title={isLastCard ? 'Complete' : 'Next'}
              onPress={handleNext}
              variant="primary"
              size="medium"
              fullWidth
            />
          </Animated.View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  cardProgressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  cardProgressBox: {
    flex: 1,
    maxWidth: 40,
    height: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  contentArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardAndTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: theme.spacing.xl,
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
    marginTop: theme.spacing.xl,
    fontSize: 16,
    color: theme.colors.text.secondary,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  cardInfoContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  cardName: {
    fontSize: 24,
    fontWeight: '400',
    color: '#F6D99F', // Yellow from theme
    fontFamily: 'PTSerif_400Regular',
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  positionName: {
    fontSize: 14,
    color: '#FFFFFF', // White
    fontFamily: 'Inter',
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  cardMeaning: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)', // 50% white
    fontFamily: 'Inter',
    textAlign: 'center',
    lineHeight: 20,
    textTransform: 'uppercase',
  },
  buttonContainer: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
});
