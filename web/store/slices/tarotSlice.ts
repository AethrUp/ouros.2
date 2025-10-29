import { StateCreator } from 'zustand';
import { toast } from 'sonner';
import {
  TarotCard,
  TarotReading,
  TarotSession,
  DrawnCard,
  SpreadLayout,
  SessionStep
} from '../../types/tarot';
import { fetchWithTimeout } from '../../lib/fetchWithTimeout';

export interface TarotSlice {
  // Session state
  currentSession: TarotSession | null;
  sessionStep: SessionStep;

  // Session data
  selectedSpread: SpreadLayout | null;
  intention: string;
  drawnCards: DrawnCard[];
  interpretation: string | null;

  // Loading states
  isDrawing: boolean;
  isGeneratingInterpretation: boolean;
  tarotError: string | null;

  // History
  readings: TarotReading[];
  isLoadingHistory: boolean;

  // Actions
  startSession: (spread: SpreadLayout) => void;
  setIntention: (intention: string) => void;
  drawCards: () => Promise<void>;
  generateTarotInterpretation: () => Promise<void>;
  saveReading: () => Promise<void>;
  clearSession: () => void;
  loadHistory: () => Promise<void>;
  deleteReading: (readingId: string) => Promise<void>;
  setSessionStep: (step: SessionStep) => void;
  setDrawnCards: (cards: DrawnCard[]) => void;
  setInterpretation: (interpretation: string) => void;
  setTarotError: (error: string | null) => void;
}

export const createTarotSlice: StateCreator<TarotSlice> = (set, get) => ({
  // Initial state
  currentSession: null,
  sessionStep: 'setup',
  selectedSpread: null,
  intention: '',
  drawnCards: [],
  interpretation: null,
  isDrawing: false,
  isGeneratingInterpretation: false,
  tarotError: null,
  readings: [],
  isLoadingHistory: false,

  // Actions
  startSession: (spread) => {
    const sessionId = `tarot-${Date.now()}`;

    set({
      currentSession: {
        id: sessionId,
        startedAt: Date.now(),
        spreadId: spread.id,
        intention: '',
        drawnCards: []
      },
      selectedSpread: spread,
      sessionStep: 'intention',
      drawnCards: [],
      interpretation: null,
      intention: '',
      tarotError: null
    });
  },

  setIntention: (intention) => {
    set({ intention });

    const currentSession = get().currentSession;
    if (currentSession) {
      set({
        currentSession: {
          ...currentSession,
          intention
        }
      });
    }
  },

  drawCards: async () => {
    const { selectedSpread } = get();
    if (!selectedSpread) {
      set({ tarotError: 'No spread selected' });
      return;
    }

    console.log('🎴 Starting card draw for spread:', selectedSpread.name);
    set({ isDrawing: true, tarotError: null, sessionStep: 'drawing' });

    try {
      // Call API route to draw cards
      const response = await fetchWithTimeout('/api/tarot/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spread: selectedSpread }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to draw cards');
      }

      const drawnCards = data.drawnCards;

      console.log('✅ Cards drawn successfully:', drawnCards.length);

      const currentSession = get().currentSession;

      set({
        drawnCards,
        isDrawing: false,
        sessionStep: 'reveal',
        currentSession: currentSession ? {
          ...currentSession,
          drawnCards
        } : null
      });
    } catch (error) {
      console.error('❌ Failed to draw cards:', error);
      const message = error instanceof Error ? error.message : 'Failed to draw cards';
      set({
        isDrawing: false,
        tarotError: message,
        sessionStep: 'intention', // Go back to intention instead of setup
        drawnCards: [] // Clear any partial draws
      });
      toast.error(message);
    }
  },

  generateTarotInterpretation: async () => {
    console.log('🎯 generateTarotInterpretation STORE METHOD called');
    const { intention, drawnCards } = get();
    console.log('🎯 drawnCards.length:', drawnCards.length);

    if (drawnCards.length === 0) {
      console.log('❌ No cards drawn - returning early');
      set({ tarotError: 'No cards drawn' });
      return;
    }

    console.log('🎯 Setting sessionStep to interpretation...');
    set({ isGeneratingInterpretation: true, sessionStep: 'interpretation', tarotError: null });

    try {
      // Call API route for interpretation
      const response = await fetchWithTimeout('/api/tarot/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intention,
          drawnCards,
          style: 'psychological',
          detailLevel: 'detailed',
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate interpretation');
      }

      set({
        interpretation: data.interpretation,
        isGeneratingInterpretation: false,
        sessionStep: 'complete'
      });
    } catch (error) {
      console.error('Failed to generate interpretation:', error);
      set({
        isGeneratingInterpretation: false,
        tarotError: error instanceof Error ? error.message : 'Failed to generate interpretation'
      });
    }
  },

  saveReading: async () => {
    const { currentSession, selectedSpread, drawnCards, interpretation, intention } = get();

    if (!currentSession || !selectedSpread || !interpretation) {
      console.error('Cannot save reading: missing required data');
      return;
    }

    try {
      // Call API route to save reading
      const response = await fetchWithTimeout('/api/tarot/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intention,
          spread: selectedSpread,
          drawnCards,
          interpretation
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to save reading');
      }

      // Add to readings list
      set({
        readings: [data.reading, ...get().readings]
      });
    } catch (error) {
      console.error('Failed to save reading:', error);
      set({
        tarotError: error instanceof Error ? error.message : 'Failed to save reading'
      });
    }
  },

  clearSession: () => {
    set({
      currentSession: null,
      sessionStep: 'setup',
      selectedSpread: null,
      intention: '',
      drawnCards: [],
      interpretation: null,
      isDrawing: false,
      isGeneratingInterpretation: false,
      tarotError: null
    });
  },

  loadHistory: async () => {
    set({ isLoadingHistory: true });

    try {
      // Import handler dynamically
      const { loadTarotHistory } = await import('../../handlers/tarotReading');
      const readings = await loadTarotHistory();

      set({
        readings,
        isLoadingHistory: false
      });
    } catch (error) {
      console.error('Failed to load history:', error);
      set({
        isLoadingHistory: false,
        tarotError: error instanceof Error ? error.message : 'Failed to load history'
      });
    }
  },

  deleteReading: async (readingId) => {
    try {
      // Import handler dynamically
      const { deleteTarotReading } = await import('../../handlers/tarotReading');
      await deleteTarotReading(readingId);

      set({
        readings: get().readings.filter(r => r.id !== readingId)
      });
    } catch (error) {
      console.error('Failed to delete reading:', error);
      set({
        tarotError: error instanceof Error ? error.message : 'Failed to delete reading'
      });
    }
  },

  // Helper setters for external use
  setSessionStep: (step) => set({ sessionStep: step }),

  setDrawnCards: (cards) => set({ drawnCards: cards }),

  setInterpretation: (interpretation) => set({ interpretation }),

  setTarotError: (error) => set({ tarotError: error })
});
