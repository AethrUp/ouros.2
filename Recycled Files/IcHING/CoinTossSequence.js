/**
 * Coin Toss Sequence Component
 * Manages the complete 6-line coin toss sequence with quantum results
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  FadeIn,
  FadeOut,
  SlideInDown
} from 'react-native-reanimated';
import { colors, typography, spacing } from '../../styles/theme';
import { ThreeCoinToss } from './CoinFlipAnimation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Coin Toss Sequence with Quantum Results
 * @param {Object} props - Component props
 * @param {Array} props.quantumLines - Array of 6 line objects from quantum conversion
 * @param {Function} props.onSequenceComplete - Callback when all 6 tosses complete
 * @param {boolean} props.autoStart - Whether to start automatically
 */
export const CoinTossSequence = ({ 
  quantumLines = [], 
  onSequenceComplete,
  autoStart = false 
}) => {
  const [currentLine, setCurrentLine] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [completedLines, setCompletedLines] = useState([]);
  const [showTossButton, setShowTossButton] = useState(true);
  
  // Use ref to track current state for callbacks
  const completedLinesRef = useRef([]);

  // Get current line's coin results
  const getCurrentCoinResults = useCallback(() => {
    if (!quantumLines[currentLine]) return [true, true, true];
    
    const line = quantumLines[currentLine];
    // Convert coin tosses to boolean array (true = heads, false = tails)
    return line.coins.map(coin => coin === 'heads');
  }, [quantumLines, currentLine]);

  // Handle single toss completion
  const handleTossComplete = useCallback(() => {
    const line = quantumLines[currentLine];
    
    // Create new completed line
    const newCompletedLine = {
      position: line.position,
      lineType: line.lineType,
      changing: line.changing,
      description: line.description,
      totalValue: line.totalValue
    };

    // Update both state and ref with fresh data
    const updatedLines = [...completedLinesRef.current, newCompletedLine];
    completedLinesRef.current = updatedLines;
    setCompletedLines(updatedLines);

    // Move to next line or complete sequence
    if (currentLine < 5) {
      setTimeout(() => {
        setCurrentLine(prev => prev + 1);
        setIsAnimating(false);
        setShowTossButton(true);
      }, 800); // Reduced delay for better flow
    } else {
      // All 6 tosses complete - use fresh state from ref
      setTimeout(() => {
        if (onSequenceComplete) {
          onSequenceComplete(updatedLines);
        }
      }, 1200);
    }
  }, [currentLine, quantumLines, onSequenceComplete]);

  // Handle toss button press
  const handleTossPress = useCallback(() => {
    setShowTossButton(false);
    setIsAnimating(true);
  }, []);

  // Reset completed lines ref when starting new sequence
  useEffect(() => {
    completedLinesRef.current = [];
    setCompletedLines([]);
  }, [quantumLines]);

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart && currentLine === 0 && !isAnimating) {
      handleTossPress();
    }
  }, [autoStart]);

  return (
    <View style={styles.container}>
      {/* Building Hexagram Display */}
      <BuildingHexagram lines={completedLines} />

      {/* Coin Toss Area - Isolated from other elements */}
      <View style={styles.tossArea} pointerEvents={isAnimating ? 'none' : 'auto'}>
        <View style={styles.coinContainer}>
          <ThreeCoinToss
            results={getCurrentCoinResults()}
            onTossComplete={handleTossComplete}
            animate={isAnimating}
          />
        </View>
      </View>

      {/* Line Progress and Toss Button */}
      {showTossButton && currentLine < 6 && (
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          style={styles.buttonSection}
        >
          <Text style={styles.lineProgressText}>
            Line {currentLine + 1}
          </Text>
          <TouchableOpacity
            style={styles.tossButton}
            onPress={handleTossPress}
            activeOpacity={0.8}
          >
            <Text style={styles.tossButtonText}>
              CAST
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

/**
 * Building Hexagram Display Component
 * Shows hexagram lines as they're built from bottom to top
 */
const BuildingHexagram = ({ lines = [] }) => {
  return (
    <View style={styles.hexagramContainer}>
      <View style={styles.hexagramLines}>
        {/* Show placeholder for all 6 lines */}
        {[...Array(6)].map((_, index) => {
          const lineIndex = 5 - index; // Build from bottom (5) to top (0)
          const line = lines.find(l => l.position === lineIndex + 1);
          
          return (
            <HexagramLine
              key={`line-${lineIndex}`}
              line={line}
              position={lineIndex + 1}
            />
          );
        })}
      </View>
    </View>
  );
};

/**
 * Individual Hexagram Line Component
 */
const HexagramLine = ({ line, position }) => {
  const isYang = line?.lineType === 'yang';
  const isChanging = line?.changing;
  const hasLine = !!line;

  return (
    <View style={[styles.hexagramLine, { opacity: hasLine ? 1 : 0.2 }]}>
      <View style={styles.lineContent}>
        {/* Line Number */}
        <Text style={styles.lineNumber}>{position}</Text>
        
        {/* Line Visual */}
        <View style={styles.lineVisual}>
          {isYang ? (
            // Yang line (solid)
            <View style={[
              styles.yangLine,
              isChanging && styles.changingLine
            ]} />
          ) : (
            // Yin line (broken)
            <View style={styles.yinLine}>
              <View style={[
                styles.yinSegment,
                isChanging && styles.changingLine
              ]} />
              <View style={styles.yinGap} />
              <View style={[
                styles.yinSegment,
                isChanging && styles.changingLine
              ]} />
            </View>
          )}
        </View>
        
        {/* Changing Line Star */}
        {isChanging && (
          <View style={styles.changingStarContainer}>
            <Text style={styles.changingStar}>✦</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingVertical: spacing.lg
  },
  tossArea: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    isolation: 'isolate'
  },
  coinContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  buttonSection: {
    alignItems: 'center',
    marginVertical: spacing.lg
  },
  lineProgressText: {
    ...typography.body,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: spacing.sm
  },
  tossButton: {
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4
  },
  tossButtonText: {
    ...typography.button,
    color: '#4B0082',
    fontSize: 14,
    fontWeight: '500'
  },
  hexagramContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    marginBottom: spacing.lg
  },
  hexagramLines: {
    alignItems: 'center'
  },
  hexagramLine: {
    marginVertical: 6,
    alignItems: 'center',
    justifyContent: 'center'
  },
  lineContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 200
  },
  lineNumber: {
    position: 'absolute',
    left: -35,
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.7)',
    width: 20,
    textAlign: 'center'
  },
  lineVisual: {
    width: 180
  },
  yangLine: {
    height: 10,
    backgroundColor: colors.textPrimary,
    borderRadius: 2
  },
  yinLine: {
    flexDirection: 'row',
    height: 10
  },
  yinSegment: {
    flex: 1,
    backgroundColor: colors.textPrimary,
    borderRadius: 2
  },
  yinGap: {
    width: 20
  },
  changingLine: {
    backgroundColor: '#F6D99F'
  },
  changingStarContainer: {
    position: 'absolute',
    right: -30,
    justifyContent: 'center',
    alignItems: 'center'
  },
  changingStar: {
    color: '#F6D99F',
    fontSize: 16,
    fontWeight: 'bold'
  }
});

export default CoinTossSequence;