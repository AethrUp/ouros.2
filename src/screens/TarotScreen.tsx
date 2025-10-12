import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAppStore } from '../store';
import { useFeatureUsage } from '../hooks/useFeatureAccess';
import { UpgradePrompt } from '../components/UpgradePrompt';
import { SpreadSelector } from '../components/tarot/SpreadSelector';
import { IntentionInput } from '../components/tarot/IntentionInput';
import { QuantumLoadingScreen } from '../components/tarot/QuantumLoadingScreen';
import { QuantumCardReveal } from '../components/tarot/QuantumCardReveal';
import { InterpretationScreen } from '../components/tarot/InterpretationScreen';
import { PaywallModal } from '../components/PaywallModal';
import { TAROT_SPREADS } from '../data/tarot/spreads';
import { theme } from '../styles';

export const TarotScreen = ({ navigation }: any) => {
  const {
    currentSession,
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
    generateTarotInterpretation,
    saveReading,
    clearSession,
  } = useAppStore();

  // Feature usage tracking
  const { canUse, currentUsage, limit, tier, useFeature } = useFeatureUsage('tarot');
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [hasCheckedUsage, setHasCheckedUsage] = useState(false);

  const handleSpreadSelect = async (spread: any) => {
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

    startSession(spread);
  };

  // Reset usage check flag when session clears
  useEffect(() => {
    if (!currentSession) {
      setHasCheckedUsage(false);
    }
  }, [currentSession]);

  const handleIntentionNext = () => {
    drawCards();
  };

  const handleCardsRevealed = () => {
    console.log('🎯 handleCardsRevealed called');
    generateTarotInterpretation();
  };

  const handleSaveReading = async () => {
    await saveReading();
    // Show success message or navigate
  };

  const handleJournal = async () => {
    await saveReading();

    // Transform current reading to LinkedReading format
    if (selectedSpread && drawnCards.length > 0 && interpretation) {
      const linkedReading = {
        id: Date.now().toString(), // Temporary ID, will be replaced when reading is saved
        reading_type: 'tarot' as const,
        title: `${selectedSpread.name} - ${drawnCards.length} cards`,
        timestamp: new Date().toISOString(),
        interpretation,
        intention,
        metadata: {
          spread: selectedSpread.name,
          cardCount: drawnCards.length,
          cards: drawnCards.map((dc) => ({
            name: dc.card.name,
            position: dc.position,
            orientation: dc.orientation,
          })),
        },
      };

      // Navigate to journal tab, then to entry screen with linked reading
      navigation.navigate('journal', {
        screen: 'JournalEntry',
        params: {
          linkedReading,
          entryType: 'tarot',
        },
      });
    }
  };

  const handleNewReading = () => {
    clearSession();
    navigation.navigate('OracleMain');
  };

  // Clear session when navigating away from Tarot screen
  // Note: Navigation reset is handled at the tab level in TabNavigator
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        console.log('📱 Tarot screen lost focus - clearing session');
        clearSession();
      };
    }, [clearSession])
  );

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
                onPress={() => {
                  clearSession();
                  navigation.navigate('OracleMain');
                }}
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

      {/* Upgrade Prompt */}
      <UpgradePrompt
        visible={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        onUpgrade={() => {
          setShowUpgradePrompt(false);
          setShowPaywall(true);
        }}
        feature="tarot"
        currentTier={tier}
        currentUsage={currentUsage}
      />

      {/* Paywall Modal */}
      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSuccess={() => {
          setShowPaywall(false);
          // Reload the component to refresh feature access
        }}
      />
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
