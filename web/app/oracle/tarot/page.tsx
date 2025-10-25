'use client';

import { useEffect } from 'react';
import { MainLayout } from '@/components/layout';
import { LoadingScreen } from '@/components/ui';
import { SpreadSelector, IntentionInput, CardReveal, InterpretationDisplay } from '@/components/tarot';
import { useAppStore } from '@/store';
import { TAROT_SPREADS } from '@/data/tarot/spreads';

export default function TarotPage() {
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
    generateTarotInterpretation,
    saveReading,
    clearSession,
  } = useAppStore();

  // Clear session when leaving page
  useEffect(() => {
    return () => {
      clearSession();
    };
  }, [clearSession]);

  // Render based on session step
  const renderContent = () => {
    switch (sessionStep) {
      case 'setup':
        return (
          <SpreadSelector
            spreads={TAROT_SPREADS}
            onSelect={(spread) => startSession(spread)}
          />
        );

      case 'intention':
        return (
          <IntentionInput
            value={intention}
            onChange={setIntention}
            onNext={drawCards}
            spreadName={selectedSpread?.name}
          />
        );

      case 'drawing':
        return <LoadingScreen message="Drawing your cards..." />;

      case 'reveal':
        if (drawnCards.length > 0) {
          return (
            <CardReveal
              drawnCards={drawnCards}
              onComplete={generateTarotInterpretation}
            />
          );
        }
        return <LoadingScreen message="Preparing cards..." />;

      case 'interpretation':
        if (isGeneratingInterpretation) {
          return <LoadingScreen message="Generating your reading..." />;
        }
        // Fall through to complete if ready
        if (interpretation && selectedSpread) {
          return (
            <InterpretationDisplay
              drawnCards={drawnCards}
              spread={selectedSpread}
              intention={intention}
              interpretation={interpretation}
              onSave={saveReading}
            />
          );
        }
        return <LoadingScreen message="Preparing interpretation..." />;

      case 'complete':
        if (!selectedSpread || !interpretation) {
          // Reset if invalid state
          clearSession();
          return null;
        }
        return (
          <InterpretationDisplay
            drawnCards={drawnCards}
            spread={selectedSpread}
            intention={intention}
            interpretation={interpretation}
            onSave={saveReading}
          />
        );

      default:
        return (
          <SpreadSelector
            spreads={TAROT_SPREADS}
            onSelect={(spread) => startSession(spread)}
          />
        );
    }
  };

  return (
    <MainLayout headerTitle="Tarot" showBack>
      <div className="min-h-screen bg-background pb-20 lg:pb-8">
        {tarotError && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded mx-4 mt-4">
            <p className="text-sm">{tarotError}</p>
          </div>
        )}
        {renderContent()}
      </div>
    </MainLayout>
  );
}
