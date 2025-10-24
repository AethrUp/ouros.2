/**
 * Dream Interpretation Slice
 * Manages dream interpretation state
 */

import { StateCreator } from 'zustand';
import { DreamState, DreamReading } from '../../types/dream';
import {
  generateDreamInterpretation,
  saveDreamReading,
  loadDreamHistory,
} from '../../handlers/dreamReading';

export interface DreamSlice extends DreamState {
  // Session actions
  startDreamSession: () => void;
  setDreamDescription: (description: string) => void;
  generateDreamInterpretation: () => Promise<void>;
  saveDreamReading: () => Promise<void>;
  clearDreamSession: () => void;

  // History actions
  loadDreamHistory: () => Promise<void>;
  deleteDreamReading: (id: string) => Promise<void>;
}

const initialDreamState: DreamState = {
  currentDreamSession: null,
  dreamSessionStep: 'input',
  dreamDescription: '',
  dreamInterpretation: null,
  isGeneratingDreamInterpretation: false,
  dreamError: null,
  dreamReadings: [],
};

export const createDreamSlice: StateCreator<
  DreamSlice,
  [],
  [],
  DreamSlice
> = (set, get) => ({
  ...initialDreamState,

  // Start a new dream interpretation session
  startDreamSession: () => {
    const sessionId = `dream-${Date.now()}`;
    console.log('💭 Starting dream interpretation session:', sessionId);

    set({
      currentDreamSession: sessionId,
      dreamSessionStep: 'input',
      dreamDescription: '',
      dreamInterpretation: null,
      isGeneratingDreamInterpretation: false,
      dreamError: null,
    });
  },

  // Set dream description
  setDreamDescription: (description: string) => {
    set({ dreamDescription: description });
  },

  // Generate dream interpretation
  generateDreamInterpretation: async () => {
    const { dreamDescription } = get();

    if (!dreamDescription.trim()) {
      set({ dreamError: 'Please describe your dream' });
      return;
    }

    console.log('💭 Generating dream interpretation...');

    set({
      dreamSessionStep: 'interpreting',
      isGeneratingDreamInterpretation: true,
      dreamError: null,
    });

    try {
      const interpretation = await generateDreamInterpretation(dreamDescription);

      set({
        dreamInterpretation: interpretation,
        dreamSessionStep: 'complete',
        isGeneratingDreamInterpretation: false,
      });

      console.log('✅ Dream interpretation generated');
    } catch (error: any) {
      console.error('Failed to generate dream interpretation:', error);

      set({
        dreamError:
          error?.message || 'Failed to generate interpretation. Please try again.',
        isGeneratingDreamInterpretation: false,
        dreamSessionStep: 'input',
      });
    }
  },

  // Save the current dream reading
  saveDreamReading: async () => {
    const { dreamDescription, dreamInterpretation, dreamReadings } = get();

    if (!dreamDescription || !dreamInterpretation) {
      console.warn('Cannot save: missing dream description or interpretation');
      return;
    }

    console.log('💾 Saving dream reading...');

    try {
      const reading = await saveDreamReading({
        dreamDescription,
        interpretation: dreamInterpretation,
      });

      // Add to readings history
      set({
        dreamReadings: [reading, ...dreamReadings],
      });

      console.log('✅ Dream reading saved');
    } catch (error) {
      console.error('Failed to save dream reading:', error);
      // Don't throw - reading is still available in current session
    }
  },

  // Clear the current session
  clearDreamSession: () => {
    console.log('🧹 Clearing dream session');

    set({
      currentDreamSession: null,
      dreamSessionStep: 'input',
      dreamDescription: '',
      dreamInterpretation: null,
      isGeneratingDreamInterpretation: false,
      dreamError: null,
    });
  },

  // Load dream reading history
  loadDreamHistory: async () => {
    console.log('📚 Loading dream reading history...');

    try {
      const readings = await loadDreamHistory();

      set({
        dreamReadings: readings,
      });

      console.log(`✅ Loaded ${readings.length} dream readings`);
    } catch (error) {
      console.error('Failed to load dream history:', error);
    }
  },

  // Delete a dream reading
  deleteDreamReading: async (id: string) => {
    const { dreamReadings } = get();

    console.log('🗑️ Deleting dream reading:', id);

    try {
      // Remove from Supabase
      const { deleteDreamReading: deleteFromDB } = await import(
        '../../handlers/dreamReading'
      );
      await deleteFromDB(id);

      // Remove from local state
      set({
        dreamReadings: dreamReadings.filter((r) => r.id !== id),
      });

      console.log('✅ Dream reading deleted');
    } catch (error) {
      console.error('Failed to delete dream reading:', error);
      throw error;
    }
  },
});
