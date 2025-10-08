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

  // Handle error states that need cleanup (using useEffect instead of during render)
  useEffect(() => {
    if (sessionStep === 'reveal' && !selectedSpread) {
      console.error('No spread selected in reveal state');
      clearSession();
    }
  }, [sessionStep, selectedSpread, clearSession]);

  useEffect(() => {
    if (sessionStep === 'complete' && (!selectedSpread || !interpretation)) {
      console.error('Missing spread or interpretation in complete state');
      clearSession();
    }
  }, [sessionStep, selectedSpread, interpretation, clearSession]);

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
              message={tarotError || "Drawing cards..."}
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
        if (!selectedSpread) {
          return null; // useEffect will handle cleanup
        }
        return (
          <QuantumCardReveal
            drawnCards={drawnCards}
            spread={selectedSpread}
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
        if (interpretation && selectedSpread) {
          return (
            <InterpretationScreen
              drawnCards={drawnCards}
              spread={selectedSpread}
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
        if (!selectedSpread || !interpretation) {
          return null; // useEffect will handle cleanup
        }
        return (
          <InterpretationScreen
            drawnCards={drawnCards}
            spread={selectedSpread}
            intention={intention}
            interpretation={interpretation}
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
