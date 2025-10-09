/**
 * Coin Casting View Component
 * Manages line-by-line coin casting with animation and hexagram building
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { HexagramDisplay } from './HexagramDisplay';
import { ThreeCoinToss } from './CoinFlipAnimation';
import { HexagramLine, CoinToss } from '../../types/iching';
import { castLineWithCoins } from '../../utils/ichingCasting';
import { colors, typography, spacing } from '../../styles';
import { HeaderBar } from '../HeaderBar';

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

  // Handle cast button press
  const handleCast = useCallback(async () => {
    try {
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
      }, 1800);
    } else {
      // Prepare for next cast
      setTimeout(() => {
        setIsAnimating(false);
        setCurrentLinePosition((prev) => prev + 1);
      }, 800);
    }
  }, [currentCoinToss, currentLinePosition, completedLines, onComplete]);

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
      <HeaderBar title="I CHING" />

      {/* Hexagram Display */}
      <View style={styles.hexagramSection}>
        <HexagramDisplay lines={completedLines} maxLines={6} />
      </View>

      {/* Coin Toss Area */}
      <View style={styles.tossArea}>
        {currentCoinToss && (
          <ThreeCoinToss
            results={currentCoinToss.coins}
            onTossComplete={handleTossComplete}
            animate={isAnimating}
          />
        )}
      </View>

      {/* Cast Button */}
      {completedLines.length < 6 && (
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={[
              styles.castButton,
              isAnimating && styles.castButtonDisabled,
            ]}
            onPress={handleCast}
            activeOpacity={0.8}
            disabled={isAnimating}
          >
            <Text style={styles.castButtonText}>
              {completedLines.length > 0 ? 'CAST AGAIN' : 'CAST COINS'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Completion Message */}
      {completedLines.length === 6 && (
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
  castButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  castButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  castButtonText: {
    ...typography.button,
    color: colors.background.primary,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1.2,
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
