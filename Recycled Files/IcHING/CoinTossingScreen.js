/**
 * Coin Tossing Screen
 * Step 3 of I-Ching consultation - Interactive 6-line coin tossing with quantum results
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, SlideInDown } from 'react-native-reanimated';
import { colors, typography, spacing } from '../../styles/theme';
import { CoinTossSequence } from '../../components/animations/CoinTossSequence';
import {
  setLoadingState,
  setLoadingPhase,
  LOADING_STATES,
  LOADING_PHASES
} from '../../services/quantumRNG/loadingStateManager';

/**
 * Coin Tossing Screen Component
 * @param {Object} props - Screen props
 */
export const CoinTossingScreen = ({ navigation, route }) => {
  const [quantumLines, setQuantumLines] = useState([]);
  const [isSequenceComplete, setIsSequenceComplete] = useState(false);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);
  
  const { intention = '', quantumNumbers = [] } = route.params || {};
  
  // Initialize quantum lines from quantum numbers
  useEffect(() => {
    const initializeLines = async () => {
      try {
      console.log('🎯 Initializing coin toss sequence with', quantumNumbers.length, 'quantum numbers');
      
      if (!quantumNumbers || quantumNumbers.length !== 18) {
        throw new Error(`Expected 18 quantum numbers, received ${quantumNumbers?.length || 0}`);
      }
      
      // Dynamically load quantum client directly to avoid circular imports
      console.log('🔮 Loading quantum services for line conversion...');
      const { quantumClient } = await import('../../services/quantumRNG/client');
      const lines = quantumClient.convertToIChing(quantumNumbers);
      console.log('✅ Converted to', lines.length, 'I-Ching lines');
      
      setQuantumLines(lines);
      setIsReady(true);
      
      // Set loading phase
      setLoadingPhase(LOADING_PHASES.COIN_TOSSING);
      setLoadingState(LOADING_STATES.COIN_ANIMATION);
      
    } catch (err) {
      console.error('❌ Failed to initialize coin toss sequence:', err);
      setError(err.message);
      
      Alert.alert(
        'Initialization Error',
        'Failed to prepare coin toss sequence. Please try again.',
        [
          { text: 'Go Back', onPress: () => navigation.goBack() },
          { text: 'Retry', onPress: () => navigation.replace('QuantumLoading', { intention }) }
        ]
        );
        
        setLoadingState(LOADING_STATES.ERROR);
      }
    };

    initializeLines();
  }, [quantumNumbers, navigation, intention]);
  
  // Handle sequence completion
  const handleSequenceComplete = useCallback(async (completedLines) => {
    try {
      console.log('🎉 Coin toss sequence completed with', completedLines.length, 'lines');
      
      setIsSequenceComplete(true);
      setLoadingState(LOADING_STATES.HEXAGRAM_CALCULATION);
      
      // Import conversion utilities
      const { convertLinesToHexagram, createTransformationHexagram } = await import('../../utils/iching/hexagramConversion');
      const { getHexagram } = await import('../../data/ichingDatabase');
      
      // Convert lines to hexagram
      const hexagramNumber = convertLinesToHexagram(quantumLines);
      const hexagramData = getHexagram(hexagramNumber);
      
      if (!hexagramData) {
        throw new Error(`Hexagram ${hexagramNumber} not found in database`);
      }
      
      // Handle changing lines
      const changingLinePositions = quantumLines
        .filter(line => line.changing)
        .map(line => line.position);
      
      let transformedHexagram = null;
      if (changingLinePositions.length > 0) {
        const transformedNumber = createTransformationHexagram(hexagramNumber, changingLinePositions);
        transformedHexagram = getHexagram(transformedNumber);
      }
      
      // Prepare reading data
      const readingData = {
        intention,
        lines: quantumLines,
        hexagram: hexagramData,
        transformedHexagram,
        changingLines: changingLinePositions,
        quantumNumbers,
        timestamp: Date.now(),
        readingId: `reading_${Date.now()}`
      };
      
      console.log('📊 Generated reading:', {
        hexagram: hexagramNumber,
        changingLines: changingLinePositions,
        transformed: transformedHexagram?.number
      });
      
      setLoadingState(LOADING_STATES.COMPLETE);
      
      // Navigate to results after brief delay
      setTimeout(() => {
        navigation.navigate('Results', { reading: readingData });
      }, 1500);
      
    } catch (err) {
      console.error('❌ Failed to complete reading:', err);
      setError(err.message);
      
      Alert.alert(
        'Reading Generation Error',
        'Failed to generate I-Ching reading. Please try again.',
        [
          { text: 'Go Back', onPress: () => navigation.goBack() },
          { text: 'Retry', onPress: () => navigation.replace('QuantumLoading', { intention }) }
        ]
      );
    }
  }, [quantumLines, intention, quantumNumbers, navigation]);
  
  // Handle back navigation (with confirmation)
  const handleBack = useCallback(() => {
    Alert.alert(
      'Leave Reading?',
      'Your quantum numbers will be lost. Are you sure you want to go back?',
      [
        { text: 'Continue Reading', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => navigation.goBack() }
      ]
    );
  }, [navigation]);
  
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Animated.View 
          entering={FadeIn}
          style={styles.errorContainer}
        >
          <Text style={styles.errorTitle}>Sequence Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.errorButtonText}>GO BACK</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }
  
  if (!isReady) {
    return (
      <SafeAreaView style={styles.container}>
        <Animated.View 
          entering={FadeIn}
          style={styles.loadingContainer}
        >
          <Text style={styles.loadingText}>Preparing Coin Toss...</Text>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View 
        entering={FadeIn.duration(500)}
        style={styles.header}
      >
        <Text style={styles.title}>Cast Your Coins</Text>
        {intention.trim() && (
          <Animated.View 
            entering={SlideInDown.delay(200)}
            style={styles.intentionContainer}
          >
            <Text style={styles.intentionLabel}>Your Intention:</Text>
            <Text style={styles.intentionText} numberOfLines={2}>
              {intention.trim()}
            </Text>
          </Animated.View>
        )}
      </Animated.View>
      
      {/* Coin Toss Sequence */}
      {!isSequenceComplete ? (
        <Animated.View 
          entering={FadeIn.delay(400)}
          style={styles.sequenceContainer}
        >
          <CoinTossSequence
            quantumLines={quantumLines}
            onSequenceComplete={handleSequenceComplete}
            autoStart={false}
          />
        </Animated.View>
      ) : (
        <Animated.View 
          entering={FadeIn}
          style={styles.completionContainer}
        >
          <Text style={styles.completionTitle}>Hexagram Complete</Text>
          <Text style={styles.completionMessage}>
            Calculating your I-Ching reading...
          </Text>
          
          {/* Loading indicator */}
          <View style={styles.completionLoader}>
            <Animated.View 
              entering={FadeIn.delay(500)}
              style={styles.loaderDot}
            />
            <Animated.View 
              entering={FadeIn.delay(700)}
              style={styles.loaderDot}
            />
            <Animated.View 
              entering={FadeIn.delay(900)}
              style={styles.loaderDot}
            />
          </View>
        </Animated.View>
      )}
      
      {/* Back Button */}
      {!isSequenceComplete && (
        <Animated.View 
          entering={FadeIn.delay(600)}
          style={styles.backButtonContainer}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>×</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background
  },
  title: {
    ...typography.h1,
    textAlign: 'center'
  },
  intentionContainer: {
    marginTop: spacing.md,
    backgroundColor: 'rgba(129, 184, 181, 0.08)',
    borderRadius: 8,
    padding: spacing.sm
  },
  intentionLabel: {
    ...typography.caption,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4
  },
  intentionText: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary
  },
  sequenceContainer: {
    flex: 1
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl
  },
  completionTitle: {
    ...typography.h1,
    fontSize: 24,
    marginBottom: spacing.sm
  },
  completionMessage: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xl
  },
  completionLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loaderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginHorizontal: 4
  },
  backButtonContainer: {
    position: 'absolute',
    top: 60,
    right: spacing.lg
  },
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.textPrimary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },
  backButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }]
  },
  backButtonText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '300',
    lineHeight: 18
  },
  // Error states
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl
  },
  errorTitle: {
    ...typography.h1,
    fontSize: 20,
    color: colors.accent,
    marginBottom: spacing.sm
  },
  errorMessage: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xl
  },
  errorButton: {
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4
  },
  errorButtonText: {
    ...typography.button,
    color: '#4B0082',
    fontSize: 14,
    fontWeight: '500'
  },
  // Loading states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    ...typography.h2,
    color: colors.textPrimary
  }
});

export default CoinTossingScreen;