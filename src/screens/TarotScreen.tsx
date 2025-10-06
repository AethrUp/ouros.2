import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAppStore } from '../store';
import { SpreadSelector } from '../components/tarot/SpreadSelector';
import { IntentionInput } from '../components/tarot/IntentionInput';
import { QuantumLoadingScreen } from '../components/tarot/QuantumLoadingScreen';
import { QuantumCardReveal } from '../components/tarot/QuantumCardReveal';
import { InterpretationScreen } from '../components/tarot/InterpretationScreen';
import { TAROT_SPREADS } from '../data/tarot/spreads';
import { theme } from '../styles';

export const TarotScreen = ({ navigation }: any) => {
  const {
    sessionStep,
    selectedSpread,
    intention,
    drawnCards,
    interpretation,
    isDrawing,
    isGeneratingInterpretation,
    tarotError,
    startSession,
    setIntention,
    drawCards,
    generateInterpretation,
    saveReading,
    clearSession,
  } = useAppStore();

  const handleSpreadSelect = (spread: any) => {
    startSession(spread);
  };

  const handleIntentionNext = () => {
    drawCards();
  };

  const handleCardsRevealed = () => {
    generateInterpretation();
  };

  const handleSaveReading = async () => {
    await saveReading();
    // Show success message or navigate
  };

  const handleJournal = async () => {
    await saveReading();
    navigation.navigate('Journal', {
      linkedReadingId: Date.now().toString(),
      readingType: 'tarot',
    });
  };

  const handleNewReading = () => {
    clearSession();
  };

  // Clear any stuck session state on mount
  useEffect(() => {
    // If stuck in drawing state but not actually drawing, reset
    if (sessionStep === 'drawing' && !isDrawing) {
      console.log('⚠️ Detected stuck drawing state, resetting...');
      clearSession();
    }
  }, []);

  // Safety timeout for drawing state - if stuck for more than 10 seconds, reset
  useEffect(() => {
    if (sessionStep === 'drawing' && isDrawing) {
      const timeout = setTimeout(() => {
        console.error('⏱️ Drawing timeout - resetting session');
        clearSession();
      }, 10000);

      return () => clearTimeout(timeout);
    }
  }, [sessionStep, isDrawing, clearSession]);

  // Debug: Log session state changes (excluding intention updates)
  useEffect(() => {
    console.log('🎴 Tarot Session State:', {
      sessionStep,
      isDrawing,
      drawnCardsCount: drawnCards.length,
      hasInterpretation: !!interpretation,
    });
  }, [sessionStep, isDrawing, drawnCards.length, interpretation]);

  // Clear session when navigating away from Tarot screen
  useFocusEffect(
    React.useCallback(() => {
      // Cleanup function runs when screen loses focus
      return () => {
        console.log('📱 Tarot screen lost focus - clearing session');
        clearSession();
      };
    }, [clearSession])
  );

  // Clear session when app goes to background or closes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        console.log('📱 App going to background - clearing tarot session');
        clearSession();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [clearSession]);

  // Render based on session step
  const renderStep = () => {
    switch (sessionStep) {
      case 'setup':
        return (
          <SpreadSelector
            spreads={TAROT_SPREADS}
            onSelect={handleSpreadSelect}
          />
        );

      case 'intention':
        return (
          <IntentionInput
            value={intention}
            onChange={setIntention}
            onNext={handleIntentionNext}
            spreadName={selectedSpread?.name}
          />
        );

      case 'drawing':
        return (
          <View style={{ flex: 1 }}>
            <QuantumLoadingScreen
              message={tarotError || "Drawing cards from the quantum realm..."}
            />
            {tarotError && (
              <TouchableOpacity
                style={styles.errorButton}
                onPress={clearSession}
              >
                <Text style={styles.errorButtonText}>Go Back</Text>
              </TouchableOpacity>
            )}
          </View>
        );

      case 'reveal':
        return (
          <QuantumCardReveal
            drawnCards={drawnCards}
            spread={selectedSpread!}
            onComplete={handleCardsRevealed}
          />
        );

      case 'interpretation':
        if (isGeneratingInterpretation) {
          return (
            <QuantumLoadingScreen
              message="The cards are speaking..."
            />
          );
        }
        // Fall through to complete if interpretation is ready
        if (interpretation) {
          return (
            <InterpretationScreen
              drawnCards={drawnCards}
              spread={selectedSpread!}
              intention={intention}
              interpretation={interpretation}
              onSave={handleSaveReading}
              onJournal={handleJournal}
            />
          );
        }
        return (
          <QuantumLoadingScreen
            message="Generating interpretation..."
          />
        );

      case 'complete':
        return (
          <InterpretationScreen
            drawnCards={drawnCards}
            spread={selectedSpread!}
            intention={intention}
            interpretation={interpretation!}
            onSave={handleSaveReading}
            onJournal={handleJournal}
          />
        );

      default:
        return (
          <SpreadSelector
            spreads={TAROT_SPREADS}
            onSelect={handleSpreadSelect}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      {renderStep()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  errorButton: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    backgroundColor: theme.colors.textInverse || '#FFFFFF',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  errorButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.background.primary,
    letterSpacing: 1.2,
    fontFamily: 'Inter',
  },
});
