/**
 * I Ching Reading Screen
 * Main coordinator for I Ching consultation flow
 */

import React, { useEffect, useCallback, useRef, useState } from 'react';
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
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { useAppStore } from '../store';
import { useFeatureUsage } from '../hooks/useFeatureAccess';
import { UpgradePrompt } from '../components/UpgradePrompt';
import { PaywallModal } from '../components/PaywallModal';
import { CoinCastingView } from '../components/iching/CoinCastingView';
import { InterpretationView } from '../components/iching/InterpretationView';
import { Button, HeaderBar, LoadingScreen } from '../components';
import { colors, typography, spacing, theme } from '../styles';
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

  // Feature usage tracking
  const { canUse, currentUsage, limit, tier, useFeature } = useFeatureUsage('iching');
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [hasCheckedUsage, setHasCheckedUsage] = useState(false);

  // Handle question submitted
  const handleQuestionSubmit = async () => {
    if (question.trim().length < 3) {
      return;
    }

    // Only check usage once at session start to prevent repeated checks
    // and re-renders during the active session
    if (!hasCheckedUsage) {
      // Check if user can use this feature
      if (!canUse) {
        setShowUpgradePrompt(true);
        return;
      }

      // Increment usage counter
      try {
        await useFeature();
        setHasCheckedUsage(true);
      } catch (error) {
        console.error('Failed to track usage:', error);
      }
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
  const handleJournal = async (prompt?: string, promptIndex?: number) => {
    await saveIChingReading();

    // Transform current reading to LinkedReading format
    if (primaryHexagram && ichingInterpretation) {
      const linkedReading = {
        id: Date.now().toString(), // Temporary ID
        reading_type: 'iching' as const,
        title: `Hexagram ${primaryHexagram.hexagram.number}: ${primaryHexagram.hexagram.englishName}`,
        timestamp: new Date().toISOString(),
        interpretation: typeof ichingInterpretation === 'string'
          ? ichingInterpretation
          : JSON.stringify(ichingInterpretation),
        intention: prompt || question, // Use prompt if provided
        metadata: {
          primaryHexagram: primaryHexagram.hexagram.number,
          changingLines: primaryHexagram.changingLines,
          relatingHexagram: relatingHexagram?.hexagram.number,
          ...(prompt && { prompt, promptIndex }),
        },
      };

      // Navigate to journal tab, then to entry screen with linked reading
      navigation.navigate('journal', {
        screen: 'JournalEntry',
        params: {
          linkedReading,
          entryType: 'iching',
        },
      });
    }
  };

  // Handle new reading
  const handleNewReading = () => {
    clearIChingSession();
    navigation.navigate('OracleMain');
  };

  // Reset usage check flag when session clears
  useEffect(() => {
    if (!currentIChingSession) {
      setHasCheckedUsage(false);
    }
  }, [currentIChingSession]);

  // Initialize session on mount if needed
  useEffect(() => {
    if (!currentIChingSession && ichingSessionStep === 'question') {
      startIChingSession();
    }
  }, []);

  // Clear session when navigating away from I Ching screen
  // Note: Navigation reset is handled at the tab level in TabNavigator
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
            <LoadingScreen context="iching" />
            {ichingError && (
              <TouchableOpacity
                style={styles.errorButton}
                onPress={() => {
                  clearIChingSession();
                  navigation.navigate('OracleMain');
                }}
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
        return (
          <View style={{ flex: 1 }}>
            <LoadingScreen context="iching" />
          </View>
        );

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
    <View style={styles.container}>
      {renderContent()}

      {/* Upgrade Prompts */}
      <UpgradePrompt
        visible={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        onUpgrade={() => {
          setShowUpgradePrompt(false);
          setShowPaywall(true);
        }}
        feature="iching"
        currentTier={tier}
        currentUsage={currentUsage}
      />

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSuccess={() => {
          setShowPaywall(false);
          // Recheck access after successful upgrade
          setHasCheckedUsage(false);
        }}
      />
    </View>
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
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const handleInputFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  return (
    <View style={styles.container}>
      <HeaderBar title="I CHING" />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.innerContainer}>
            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.questionTitle}>Your Question</Text>
              <Text style={styles.questionSubtitle}>
                Focus your mind and ask a clear question. The I Ching responds best to specific
                inquiries about your situation.
              </Text>

              <TextInput
                ref={inputRef}
                style={styles.questionInput}
                placeholder="Provide guidance on..."
                placeholderTextColor={theme.colors.text.secondary}
                value={question}
                onChangeText={onQuestionChange}
                onFocus={handleInputFocus}
                multiline
                numberOfLines={4}
                maxLength={500}
                textAlignVertical="top"
                returnKeyType="done"
                blurOnSubmit={true}
              />

              <Text style={styles.characterCount}>{question.length}/500</Text>
            </ScrollView>

            <View style={styles.buttonContainer}>
              <Button
                title="Begin Casting"
                onPress={onSubmit}
                variant="primary"
                size="medium"
                disabled={!isValid}
                fullWidth
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  questionTitle: {
    fontSize: 20,
    fontWeight: '400',
    color: '#F6D99F',
    fontFamily: 'PTSerif_400Regular',
    marginBottom: spacing.sm,
  },
  questionSubtitle: {
    fontSize: 14,
    color: colors.text.primary,
    fontFamily: 'Inter',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  questionInput: {
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    padding: spacing.lg,
    color: colors.text.primary,
    fontSize: 14,
    fontFamily: 'Inter',
    minHeight: 120,
    borderWidth: 0,
    marginBottom: spacing.xs,
  },
  characterCount: {
    fontSize: 11,
    color: colors.text.secondary,
    fontFamily: 'Inter',
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  buttonContainer: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
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
