/**
 * I Ching Reading Screen
 * Main coordinator for I Ching consultation flow
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { useAppStore } from '../store';
import { CoinCastingView } from '../components/iching/CoinCastingView';
import { InterpretationView } from '../components/iching/InterpretationView';
import { QuantumLoadingScreen } from '../components/tarot/QuantumLoadingScreen';
import { colors, typography, spacing } from '../styles';
import { HexagramLine, CastingMethod } from '../types/iching';
import { getHexagramByLines } from '../data/iching/hexagrams';
import { NavigationProps } from '../types';

export const IChingScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const {
    currentIChingSession,
    ichingSessionStep,
    castingMethod,
    question,
    primaryHexagram,
    relatingHexagram,
    ichingInterpretation,
    preFetchedCoinTosses,
    isGeneratingIChingInterpretation,
    isLoadingCoinTosses,
    ichingError,
    startIChingSession,
    setQuestion,
    fetchCoinTosses,
    setPrimaryHexagram,
    setRelatingHexagram,
    generateIChingInterpretation,
    saveIChingReading,
    clearIChingSession,
    setIChingSessionStep,
  } = useAppStore();

  // Handle question submitted
  const handleQuestionSubmit = () => {
    if (question.trim().length < 3) {
      return;
    }
    // Call fetchCoinTosses which will move to 'loading' step
    fetchCoinTosses();
  };

  // Handle casting complete
  const handleCastingComplete = useCallback(
    (lines: HexagramLine[]) => {
      console.log('✅ Casting complete, processing hexagram...');

      try {
        // Build hexagram line pattern (true = yang, false = yin)
        const linePattern: [boolean, boolean, boolean, boolean, boolean, boolean] = [
          lines[0].type === 'yang' || lines[0].type === 'changing-yang',
          lines[1].type === 'yang' || lines[1].type === 'changing-yang',
          lines[2].type === 'yang' || lines[2].type === 'changing-yang',
          lines[3].type === 'yang' || lines[3].type === 'changing-yang',
          lines[4].type === 'yang' || lines[4].type === 'changing-yang',
          lines[5].type === 'yang' || lines[5].type === 'changing-yang',
        ];

        // Find the hexagram
        const hexagram = getHexagramByLines(linePattern);

        if (!hexagram) {
          throw new Error('Failed to find hexagram for cast lines');
        }

        // Identify changing lines
        const changingLines = lines.filter((line) => line.isChanging).map((line) => line.position);

        // Set primary hexagram
        const primary = {
          hexagram,
          lines,
          changingLines,
        };
        setPrimaryHexagram(primary);

        console.log(`📖 Primary Hexagram: #${hexagram.number} ${hexagram.englishName}`);

        // Calculate relating hexagram if there are changing lines
        if (changingLines.length > 0) {
          const relatingPattern: [boolean, boolean, boolean, boolean, boolean, boolean] = [
            lines[0].isChanging ? !linePattern[0] : linePattern[0],
            lines[1].isChanging ? !linePattern[1] : linePattern[1],
            lines[2].isChanging ? !linePattern[2] : linePattern[2],
            lines[3].isChanging ? !linePattern[3] : linePattern[3],
            lines[4].isChanging ? !linePattern[4] : linePattern[4],
            lines[5].isChanging ? !linePattern[5] : linePattern[5],
          ];

          const relatingHex = getHexagramByLines(relatingPattern);

          if (relatingHex) {
            const stableLines: HexagramLine[] = relatingPattern.map((isYang, idx) => ({
              position: idx + 1,
              type: isYang ? 'yang' : 'yin',
              isChanging: false,
            }));

            const relating = {
              hexagram: relatingHex,
              lines: stableLines,
              changingLines: [],
            };
            setRelatingHexagram(relating);

            console.log(`🔄 Relating Hexagram: #${relatingHex.number} ${relatingHex.englishName}`);
          }
        } else {
          setRelatingHexagram(null);
        }

        // Move to interpretation step
        setIChingSessionStep('interpretation');

        // Generate interpretation
        generateIChingInterpretation();
      } catch (error) {
        console.error('❌ Failed to process hexagram:', error);
      }
    },
    [
      setPrimaryHexagram,
      setRelatingHexagram,
      setIChingSessionStep,
      generateIChingInterpretation,
    ]
  );

  // Handle save reading
  const handleSaveReading = async () => {
    await saveIChingReading();
    console.log('💾 Reading saved');
  };

  // Handle journal
  const handleJournal = async () => {
    await saveIChingReading();
    navigation.navigate('Journal', {
      linkedReadingId: Date.now().toString(),
      readingType: 'iching',
    });
  };

  // Handle new reading
  const handleNewReading = () => {
    clearIChingSession();
  };

  // Initialize session on mount if needed
  useEffect(() => {
    if (!currentIChingSession && ichingSessionStep === 'question') {
      startIChingSession();
    }
  }, []);

  // Clear session when navigating away from I Ching screen
  useFocusEffect(
    React.useCallback(() => {
      // Cleanup function runs when screen loses focus
      return () => {
        console.log('📱 I Ching screen lost focus - clearing session');
        clearIChingSession();
      };
    }, [clearIChingSession])
  );

  // Clear session when app goes to background or closes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        console.log('📱 App going to background - clearing I Ching session');
        clearIChingSession();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [clearIChingSession]);

  // Render based on session step
  const renderContent = () => {
    switch (ichingSessionStep) {
      case 'question':
        return (
          <QuestionInputView
            question={question}
            onQuestionChange={setQuestion}
            onSubmit={handleQuestionSubmit}
          />
        );

      case 'loading':
        return (
          <View style={{ flex: 1 }}>
            <QuantumLoadingScreen
              message={ichingError || "Drawing coins from the quantum realm..."}
            />
            {ichingError && (
              <TouchableOpacity
                style={styles.errorButton}
                onPress={clearIChingSession}
              >
                <Text style={styles.errorButtonText}>Go Back</Text>
              </TouchableOpacity>
            )}
          </View>
        );

      case 'casting':
        return (
          <CoinCastingView
            question={question}
            preFetchedCoinTosses={preFetchedCoinTosses}
            onComplete={handleCastingComplete}
            onCancel={handleNewReading}
          />
        );

      case 'interpretation':
      case 'complete':
        return primaryHexagram ? (
          <InterpretationView
            question={question}
            primaryHexagram={primaryHexagram}
            relatingHexagram={relatingHexagram}
            interpretation={ichingInterpretation}
            isGenerating={isGeneratingIChingInterpretation}
            onSave={handleSaveReading}
            onNewReading={handleNewReading}
            onJournal={handleJournal}
          />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderContent()}
    </SafeAreaView>
  );
};

/**
 * Question Input View
 */
interface QuestionInputViewProps {
  question: string;
  onQuestionChange: (q: string) => void;
  onSubmit: () => void;
}

const QuestionInputView: React.FC<QuestionInputViewProps> = ({
  question,
  onQuestionChange,
  onSubmit,
}) => {
  const isValid = question.trim().length >= 3;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.questionContainer}>
        <Animated.View entering={FadeIn} style={styles.questionContent}>
          <Text style={styles.questionTitle}>Your Question</Text>
          <Text style={styles.questionSubtitle}>
            Focus your mind and ask a clear question. The I Ching responds best to specific
            inquiries about your situation.
          </Text>

          <TextInput
            style={styles.questionInput}
            placeholder="What do I need to know about..."
            placeholderTextColor={colors.text.secondary}
            value={question}
            onChangeText={onQuestionChange}
            multiline
            numberOfLines={4}
            maxLength={500}
            autoFocus
          />

          <Text style={styles.characterCount}>{question.length}/500</Text>

          <TouchableOpacity
            style={[styles.submitButton, !isValid && styles.submitButtonDisabled]}
            onPress={onSubmit}
            disabled={!isValid}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>Begin Casting</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  // Question Input
  questionContainer: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  questionContent: {
    flex: 1,
    justifyContent: 'center',
  },
  questionTitle: {
    ...typography.h1,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  questionSubtitle: {
    ...typography.body,
    textAlign: 'center',
    color: colors.text.secondary,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  questionInput: {
    ...typography.body,
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    padding: spacing.md,
    minHeight: 120,
    textAlignVertical: 'top',
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  characterCount: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'right',
    marginTop: spacing.xs,
    fontSize: 11,
  },
  submitButton: {
    backgroundColor: colors.button.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    ...typography.button,
    color: colors.button.text,
    fontSize: 16,
    fontWeight: '600',
  },
  errorButton: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.button.primary,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorButtonText: {
    ...typography.button,
    color: colors.button.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
