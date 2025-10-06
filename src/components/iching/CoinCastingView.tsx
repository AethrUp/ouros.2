/**
 * Coin Casting View Component
 * Manages line-by-line coin casting with animation and hexagram building
 */

import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { HexagramDisplay } from './HexagramDisplay';
import { ThreeCoinToss } from './CoinFlipAnimation';
import { HexagramLine, CoinToss } from '../../types/iching';
import { castLineWithCoins } from '../../utils/ichingCasting';
import { colors, typography, spacing } from '../../styles';

interface CoinCastingViewProps {
  question: string;
  preFetchedCoinTosses: CoinToss[] | null;
  onComplete: (lines: HexagramLine[]) => void;
  onCancel?: () => void;
}

/**
 * Coin Casting View - Manages 6-line sequential casting
 */
export const CoinCastingView: React.FC<CoinCastingViewProps> = ({
  question,
  preFetchedCoinTosses,
  onComplete,
  onCancel,
}) => {
  const [currentLinePosition, setCurrentLinePosition] = useState(1); // 1-6
  const [completedLines, setCompletedLines] = useState<HexagramLine[]>([]);
  const [currentCoinToss, setCurrentCoinToss] = useState<CoinToss | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showCastButton, setShowCastButton] = useState(true);
  const [showContinueButton, setShowContinueButton] = useState(false);

  // Handle cast button press
  const handleCast = useCallback(async () => {
    try {
      setShowCastButton(false);
      setIsAnimating(true);

      let coinToss: CoinToss;

      // Use pre-fetched coin toss if available, otherwise fetch individually
      if (preFetchedCoinTosses && preFetchedCoinTosses[currentLinePosition - 1]) {
        coinToss = preFetchedCoinTosses[currentLinePosition - 1];
        console.log(`🎲 Using pre-fetched coin toss for line ${currentLinePosition}`);
      } else {
        // Fallback to individual casting (shouldn't happen in normal flow)
        coinToss = await castLineWithCoins();
        console.log(`⚠️ Fetching individual coin toss for line ${currentLinePosition} (fallback)`);
      }

      setCurrentCoinToss(coinToss);

      console.log(
        `🎲 Cast line ${currentLinePosition}:`,
        coinToss.lineType,
        `(value: ${coinToss.value})`,
        `coins: [${coinToss.coins.map(c => c ? 'H' : 'T').join(', ')}]`
      );
    } catch (error) {
      console.error('Failed to cast line:', error);
      Alert.alert('Error', 'Failed to cast line. Please try again.');
      setIsAnimating(false);
      setShowCastButton(true);
    }
  }, [currentLinePosition, preFetchedCoinTosses]);

  // Handle coin toss animation complete
  const handleTossComplete = useCallback(() => {
    if (!currentCoinToss) return;

    // Create the hexagram line from the coin toss
    const newLine: HexagramLine = {
      position: currentLinePosition,
      type: currentCoinToss.lineType,
      isChanging:
        currentCoinToss.lineType === 'changing-yang' ||
        currentCoinToss.lineType === 'changing-yin',
    };

    // Add to completed lines
    const updatedLines = [...completedLines, newLine];
    setCompletedLines(updatedLines);

    console.log(`✅ Line ${currentLinePosition} completed:`, newLine.type);

    // Check if we're done with all 6 lines
    if (currentLinePosition >= 6) {
      console.log('🎉 All 6 lines cast, completing sequence');
      setIsAnimating(false);
      setTimeout(() => {
        onComplete(updatedLines);
      }, 1000);
    } else {
      // Show continue button
      setTimeout(() => {
        setIsAnimating(false);
        setShowContinueButton(true);
      }, 800);
    }
  }, [currentCoinToss, currentLinePosition, completedLines, onComplete]);

  // Handle continue to next line
  const handleContinue = useCallback(() => {
    setShowContinueButton(false);
    setCurrentLinePosition((prev) => prev + 1);
    setCurrentCoinToss(null);
    setShowCastButton(true);
  }, []);

  // Handle cancel with confirmation
  const handleCancel = useCallback(() => {
    if (completedLines.length === 0 && onCancel) {
      onCancel();
      return;
    }

    Alert.alert(
      'Leave Reading?',
      `You have cast ${completedLines.length} of 6 lines. Are you sure you want to cancel?`,
      [
        { text: 'Continue Casting', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: onCancel,
        },
      ]
    );
  }, [completedLines.length, onCancel]);

  return (
    <View style={styles.container}>
      {/* Header with Question */}
      <View style={styles.header}>
        <Text style={styles.title}>Cast Your Hexagram</Text>
        {question.trim() && (
          <View style={styles.questionContainer}>
            <Text style={styles.questionLabel}>Your Question:</Text>
            <Text style={styles.questionText} numberOfLines={2}>
              {question.trim()}
            </Text>
          </View>
        )}
      </View>

      {/* Hexagram Display */}
      <View style={styles.hexagramSection}>
        <HexagramDisplay lines={completedLines} maxLines={6} />
      </View>

      {/* Coin Toss Area */}
      <View style={styles.tossArea}>
        {currentCoinToss && (
          <ThreeCoinToss
            key={`toss-${currentLinePosition}`}
            results={currentCoinToss.coins}
            onTossComplete={handleTossComplete}
            animate={isAnimating}
          />
        )}
      </View>

      {/* Cast Button */}
      {showCastButton && currentLinePosition <= 6 && (
        <View style={styles.buttonSection}>
          <Text style={styles.lineProgressText}>Line {currentLinePosition} of 6</Text>
          <TouchableOpacity style={styles.castButton} onPress={handleCast} activeOpacity={0.8}>
            <Text style={styles.castButtonText}>CAST COINS</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Continue Button */}
      {showContinueButton && (
        <View style={styles.buttonSection}>
          <Text style={styles.lineResultText}>Line {currentLinePosition} Complete</Text>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue} activeOpacity={0.8}>
            <Text style={styles.continueButtonText}>CONTINUE</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Cancel Button */}
      {onCancel && currentLinePosition < 6 && (
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} activeOpacity={0.7}>
          <Text style={styles.cancelButtonText}>×</Text>
        </TouchableOpacity>
      )}

      {/* Completion Message */}
      {currentLinePosition > 6 && (
        <View style={styles.completionContainer}>
          <Text style={styles.completionTitle}>Hexagram Complete</Text>
          <Text style={styles.completionMessage}>Calculating your reading...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  title: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  questionContainer: {
    marginTop: spacing.sm,
    backgroundColor: 'rgba(129, 184, 181, 0.08)',
    borderRadius: 8,
    padding: spacing.sm,
  },
  questionLabel: {
    ...typography.caption,
    color: colors.text.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
    fontSize: 11,
  },
  questionText: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.primary,
  },
  hexagramSection: {
    paddingTop: spacing.md,
  },
  tossArea: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: spacing.md,
    overflow: 'hidden',
  },
  buttonSection: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  lineProgressText: {
    ...typography.body,
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  lineResultText: {
    ...typography.body,
    fontSize: 14,
    color: colors.text.accent,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  castButton: {
    backgroundColor: colors.button.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  castButtonText: {
    ...typography.button,
    color: colors.button.text,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1.2,
  },
  continueButton: {
    backgroundColor: colors.button.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  continueButtonText: {
    ...typography.button,
    color: colors.button.text,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1.2,
  },
  cancelButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.lg,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.text.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: '300',
    lineHeight: 20,
  },
  completionContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  completionTitle: {
    ...typography.h2,
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  completionMessage: {
    ...typography.body,
    fontSize: 14,
    color: colors.text.secondary,
  },
});
