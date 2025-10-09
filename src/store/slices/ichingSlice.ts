import { StateCreator } from 'zustand';
import {
  IChingReading,
  IChingSession,
  IChingSessionStep,
  CastedHexagram,
  CastingMethod,
  CoinToss,
  IChingInterpretation,
} from '../../types/iching';

export interface IChingSlice {
  // Session state
  currentIChingSession: IChingSession | null;
  ichingSessionStep: IChingSessionStep;

  // Session data
  castingMethod: CastingMethod;
  question: string;
  primaryHexagram: CastedHexagram | null;
  relatingHexagram: CastedHexagram | null;
  ichingInterpretation: string | IChingInterpretation | null;

  // Pre-fetched coin tosses (for quantum loading)
  preFetchedCoinTosses: CoinToss[] | null;

  // Loading states
  isCastingHexagram: boolean;
  isLoadingCoinTosses: boolean;
  isGeneratingIChingInterpretation: boolean;
  ichingError: string | null;

  // History
  ichingReadings: IChingReading[];
  isLoadingIChingHistory: boolean;

  // Actions
  startIChingSession: (method?: CastingMethod) => void;
  setQuestion: (question: string) => void;
  fetchCoinTosses: () => Promise<void>;
  castHexagram: () => Promise<void>;
  generateIChingInterpretation: () => Promise<void>;
  saveIChingReading: () => Promise<void>;
  clearIChingSession: () => void;
  loadIChingHistory: () => Promise<void>;
  deleteIChingReading: (readingId: string) => Promise<void>;
  setIChingSessionStep: (step: IChingSessionStep) => void;
  setPrimaryHexagram: (hexagram: CastedHexagram) => void;
  setRelatingHexagram: (hexagram: CastedHexagram | null) => void;
  setIChingInterpretation: (interpretation: string | IChingInterpretation) => void;
  setIChingError: (error: string | null) => void;
}

export const createIChingSlice: StateCreator<IChingSlice> = (set, get) => ({
  // Initial state
  currentIChingSession: null,
  ichingSessionStep: 'question',
  castingMethod: 'three-coins',
  question: '',
  primaryHexagram: null,
  relatingHexagram: null,
  ichingInterpretation: null,
  preFetchedCoinTosses: null,
  isCastingHexagram: false,
  isLoadingCoinTosses: false,
  isGeneratingIChingInterpretation: false,
  ichingError: null,
  ichingReadings: [],
  isLoadingIChingHistory: false,

  // Actions
  startIChingSession: (method = 'three-coins') => {
    const sessionId = `iching-${Date.now()}`;

    set({
      currentIChingSession: {
        id: sessionId,
        startedAt: Date.now(),
        question: '',
        castingMethod: method,
        currentLine: 0,
        castedLines: [],
      },
      castingMethod: method,
      ichingSessionStep: 'question',
      primaryHexagram: null,
      relatingHexagram: null,
      ichingInterpretation: null,
      question: '',
      ichingError: null,
    });
  },

  setQuestion: (question) => {
    set({ question });

    const currentSession = get().currentIChingSession;
    if (currentSession) {
      set({
        currentIChingSession: {
          ...currentSession,
          question,
        },
      });
    }
  },

  fetchCoinTosses: async () => {
    console.log('🎲 Fetching all coin tosses from quantum random API...');
    set({ isLoadingCoinTosses: true, ichingError: null, ichingSessionStep: 'loading' });

    try {
      // Import preFetchAllCoinTosses from ichingCasting
      const { preFetchAllCoinTosses } = await import('../../utils/ichingCasting');
      const coinTosses = await preFetchAllCoinTosses();

      console.log('✅ All coin tosses fetched successfully');

      set({
        preFetchedCoinTosses: coinTosses,
        isLoadingCoinTosses: false,
        ichingSessionStep: 'casting',
      });
    } catch (error) {
      console.error('❌ Failed to fetch coin tosses:', error);
      set({
        isLoadingCoinTosses: false,
        ichingError: error instanceof Error ? error.message : 'Failed to fetch coin tosses',
        ichingSessionStep: 'loading', // Stay on loading to show error
        preFetchedCoinTosses: null,
      });
    }
  },

  castHexagram: async () => {
    const { castingMethod } = get();

    console.log(`☯️ Starting hexagram casting with ${castingMethod}...`);
    set({ isCastingHexagram: true, ichingError: null, ichingSessionStep: 'casting' });

    try {
      // Import handler dynamically to avoid circular dependencies
      const { handleCastHexagram } = await import('../../handlers/ichingReading');
      const { primaryHexagram, relatingHexagram } = await handleCastHexagram(castingMethod);

      console.log('✅ Hexagram cast successfully');

      const currentSession = get().currentIChingSession;

      set({
        primaryHexagram,
        relatingHexagram: relatingHexagram || null,
        isCastingHexagram: false,
        ichingSessionStep: 'result',
        currentIChingSession: currentSession
          ? {
              ...currentSession,
              primaryHexagram,
              relatingHexagram,
            }
          : null,
      });
    } catch (error) {
      console.error('❌ Failed to cast hexagram:', error);
      set({
        isCastingHexagram: false,
        ichingError: error instanceof Error ? error.message : 'Failed to cast hexagram',
        ichingSessionStep: 'question', // Go back to question
        primaryHexagram: null,
        relatingHexagram: null,
      });
    }
  },

  generateIChingInterpretation: async () => {
    const { question, primaryHexagram, relatingHexagram } = get();

    if (!primaryHexagram) {
      set({ ichingError: 'No hexagram cast' });
      return;
    }

    set({ isGeneratingIChingInterpretation: true, ichingError: null, ichingSessionStep: 'interpretation' });

    try {
      // Import handler dynamically
      const { generateIChingInterpretation } = await import('../../handlers/ichingReading');
      const interpretation = await generateIChingInterpretation(
        question,
        primaryHexagram,
        relatingHexagram || undefined
      );

      set({
        ichingInterpretation: interpretation,
        isGeneratingIChingInterpretation: false,
        ichingSessionStep: 'complete',
      });
    } catch (error) {
      console.error('Failed to generate I Ching interpretation:', error);
      set({
        isGeneratingIChingInterpretation: false,
        ichingError:
          error instanceof Error ? error.message : 'Failed to generate interpretation',
      });
    }
  },

  saveIChingReading: async () => {
    const {
      currentIChingSession,
      castingMethod,
      primaryHexagram,
      relatingHexagram,
      ichingInterpretation,
      question,
    } = get();

    if (!currentIChingSession || !primaryHexagram || !ichingInterpretation) {
      console.error('Cannot save reading: missing required data');
      return;
    }

    try {
      // Import handler dynamically
      const { saveIChingReading } = await import('../../handlers/ichingReading');
      const reading = await saveIChingReading({
        question,
        castingMethod,
        primaryHexagram,
        relatingHexagram: relatingHexagram || undefined,
        interpretation: ichingInterpretation,
      });

      // Add to readings list
      set({
        ichingReadings: [reading, ...get().ichingReadings],
      });

      console.log('✅ I Ching reading saved successfully');
    } catch (error) {
      console.error('Failed to save I Ching reading:', error);
      set({
        ichingError: error instanceof Error ? error.message : 'Failed to save reading',
      });
    }
  },

  clearIChingSession: () => {
    set({
      currentIChingSession: null,
      ichingSessionStep: 'question',
      castingMethod: 'three-coins',
      question: '',
      primaryHexagram: null,
      relatingHexagram: null,
      ichingInterpretation: null,
      preFetchedCoinTosses: null,
      isCastingHexagram: false,
      isLoadingCoinTosses: false,
      isGeneratingIChingInterpretation: false,
      ichingError: null,
    });
  },

  loadIChingHistory: async () => {
    set({ isLoadingIChingHistory: true });

    try {
      // Import handler dynamically
      const { loadIChingHistory } = await import('../../handlers/ichingReading');
      const readings = await loadIChingHistory();

      set({
        ichingReadings: readings,
        isLoadingIChingHistory: false,
      });

      console.log(`✅ Loaded ${readings.length} I Ching readings`);
    } catch (error) {
      console.error('Failed to load I Ching history:', error);
      set({
        isLoadingIChingHistory: false,
        ichingError: error instanceof Error ? error.message : 'Failed to load history',
      });
    }
  },

  deleteIChingReading: async (readingId) => {
    try {
      // Import handler dynamically
      const { deleteIChingReading } = await import('../../handlers/ichingReading');
      await deleteIChingReading(readingId);

      set({
        ichingReadings: get().ichingReadings.filter((r) => r.id !== readingId),
      });

      console.log('✅ I Ching reading deleted successfully');
    } catch (error) {
      console.error('Failed to delete I Ching reading:', error);
      set({
        ichingError: error instanceof Error ? error.message : 'Failed to delete reading',
      });
    }
  },

  // Helper setters for external use
  setIChingSessionStep: (step) => set({ ichingSessionStep: step }),

  setPrimaryHexagram: (hexagram) => set({ primaryHexagram: hexagram }),

  setRelatingHexagram: (hexagram) => set({ relatingHexagram: hexagram }),

  setIChingInterpretation: (interpretation) => set({ ichingInterpretation: interpretation }),

  setIChingError: (error) => set({ ichingError: error }),
});
