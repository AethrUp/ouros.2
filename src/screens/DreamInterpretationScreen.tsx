/**
 * Dream Interpretation Screen
 * Main coordinator for dream interpretation flow
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAppStore } from '../store';
import { Button, HeaderBar, LoadingScreen } from '../components';
import { colors, typography, spacing, theme } from '../styles';
import { NavigationProps } from '../types';

export const DreamInterpretationScreen: React.FC<NavigationProps> = ({
  navigation,
}) => {
  const {
    dreamSessionStep,
    dreamDescription,
    dreamInterpretation,
    isGeneratingDreamInterpretation,
    dreamError,
    startDreamSession,
    setDreamDescription,
    generateDreamInterpretation,
    saveDreamReading,
    clearDreamSession,
  } = useAppStore();

  // Handle submit
  const handleSubmit = () => {
    if (dreamDescription.trim().length < 10) {
      return;
    }
    generateDreamInterpretation();
  };

  // Handle save reading
  const handleSaveReading = async () => {
    await saveDreamReading();
    console.log('💾 Dream reading saved');
  };

  // Handle journal
  const handleJournal = async () => {
    await saveDreamReading();

    // Transform current reading to LinkedReading format
    if (dreamDescription && dreamInterpretation) {
      const linkedReading = {
        id: Date.now().toString(), // Temporary ID
        reading_type: 'dream' as const,
        title: `Dream: ${dreamDescription.substring(0, 50)}${dreamDescription.length > 50 ? '...' : ''}`,
        timestamp: new Date().toISOString(),
        interpretation: dreamInterpretation,
        intention: dreamDescription,
        metadata: {
          dreamDescription,
        },
      };

      // Navigate to journal tab, then to entry screen with linked reading
      navigation.navigate('journal', {
        screen: 'JournalEntry',
        params: {
          linkedReading,
          entryType: 'dream',
        },
      });
    }
  };

  // Handle new reading
  const handleNewReading = () => {
    clearDreamSession();
    navigation.navigate('OracleMain');
  };

  // Initialize session on mount if needed
  useEffect(() => {
    if (dreamSessionStep === 'input' && !dreamDescription) {
      startDreamSession();
    }
  }, []);

  // Clear session when navigating away
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        console.log('📱 Dream screen lost focus - clearing session');
        clearDreamSession();
      };
    }, [clearDreamSession])
  );

  // Render based on session step
  const renderContent = () => {
    switch (dreamSessionStep) {
      case 'input':
        return (
          <DreamInputView
            dreamDescription={dreamDescription}
            onDreamDescriptionChange={setDreamDescription}
            onSubmit={handleSubmit}
          />
        );

      case 'interpreting':
        return (
          <View style={{ flex: 1 }}>
            <LoadingScreen context="dream" />
            {dreamError && (
              <TouchableOpacity
                style={styles.errorButton}
                onPress={() => {
                  clearDreamSession();
                  navigation.navigate('OracleMain');
                }}
              >
                <Text style={styles.errorButtonText}>Go Back</Text>
              </TouchableOpacity>
            )}
          </View>
        );

      case 'complete':
        return dreamInterpretation ? (
          <InterpretationView
            dreamDescription={dreamDescription}
            interpretation={dreamInterpretation}
            onSave={handleSaveReading}
            onNewReading={handleNewReading}
            onJournal={handleJournal}
          />
        ) : null;

      default:
        return null;
    }
  };

  return <View style={styles.container}>{renderContent()}</View>;
};

/**
 * Dream Input View
 */
interface DreamInputViewProps {
  dreamDescription: string;
  onDreamDescriptionChange: (description: string) => void;
  onSubmit: () => void;
}

const DreamInputView: React.FC<DreamInputViewProps> = ({
  dreamDescription,
  onDreamDescriptionChange,
  onSubmit,
}) => {
  const isValid = dreamDescription.trim().length >= 10;
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const handleInputFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  return (
    <View style={styles.container}>
      <HeaderBar title="DREAM INTERPRETATION" />

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
              <Text style={styles.inputTitle}>Describe Your Dream</Text>
              <Text style={styles.inputSubtitle}>
                Share the details of your dream, including symbols, emotions, people, and
                events. The more detail you provide, the richer the interpretation.
              </Text>

              <TextInput
                ref={inputRef}
                style={styles.dreamInput}
                placeholder="I dreamed that..."
                placeholderTextColor={theme.colors.text.secondary}
                value={dreamDescription}
                onChangeText={onDreamDescriptionChange}
                onFocus={handleInputFocus}
                multiline
                numberOfLines={8}
                maxLength={2000}
                textAlignVertical="top"
                returnKeyType="done"
                blurOnSubmit={true}
              />

              <Text style={styles.characterCount}>{dreamDescription.length}/2000</Text>

              {dreamDescription.length > 0 && !isValid && (
                <Text style={styles.warningText}>
                  At least 10 characters required ({10 - dreamDescription.length} more needed)
                </Text>
              )}
            </ScrollView>

            <View style={styles.buttonContainer}>
              <Button
                title="Interpret Dream"
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

/**
 * Interpretation View
 */
interface InterpretationViewProps {
  dreamDescription: string;
  interpretation: string;
  onSave: () => void;
  onNewReading: () => void;
  onJournal: () => void;
}

const InterpretationView: React.FC<InterpretationViewProps> = ({
  dreamDescription,
  interpretation,
  onSave,
  onNewReading,
  onJournal,
}) => {
  return (
    <View style={styles.container}>
      <HeaderBar title="DREAM INTERPRETATION" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.interpretationContent}
      >
        <View style={styles.dreamCard}>
          <Text style={styles.dreamLabel}>Your Dream</Text>
          <Text style={styles.dreamText}>{dreamDescription}</Text>
        </View>

        <View style={styles.interpretationCard}>
          <Text style={styles.interpretationLabel}>Interpretation</Text>
          <Text style={styles.interpretationText}>{interpretation}</Text>
        </View>
      </ScrollView>

      <View style={styles.actionButtonContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={onSave}>
          <Text style={styles.actionButtonText}>Save</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onJournal}>
          <Text style={styles.actionButtonText}>Add to Journal</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.newReadingButton]}
          onPress={onNewReading}
        >
          <Text style={[styles.actionButtonText, styles.newReadingButtonText]}>
            New Reading
          </Text>
        </TouchableOpacity>
      </View>
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
  inputTitle: {
    fontSize: 20,
    fontWeight: '400',
    color: '#F6D99F',
    fontFamily: 'PTSerif_400Regular',
    marginBottom: spacing.sm,
  },
  inputSubtitle: {
    fontSize: 14,
    color: colors.text.primary,
    fontFamily: 'Inter',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  dreamInput: {
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    padding: spacing.lg,
    color: colors.text.primary,
    fontSize: 14,
    fontFamily: 'Inter',
    minHeight: 200,
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
  warningText: {
    fontSize: 12,
    color: '#E8A87C',
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
  interpretationContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  dreamCard: {
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dreamLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F6D99F',
    fontFamily: 'Inter',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
  },
  dreamText: {
    fontSize: 14,
    color: colors.text.primary,
    fontFamily: 'Inter',
    lineHeight: 20,
  },
  interpretationCard: {
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  interpretationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F6D99F',
    fontFamily: 'Inter',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: spacing.md,
  },
  interpretationText: {
    fontSize: 14,
    color: colors.text.primary,
    fontFamily: 'Inter',
    lineHeight: 22,
  },
  actionButtonContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  actionButton: {
    backgroundColor: colors.button.primary,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    ...typography.button,
    color: colors.button.text,
    fontSize: 16,
    fontWeight: '600',
  },
  newReadingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  newReadingButtonText: {
    color: colors.text.primary,
  },
});
