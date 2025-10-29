import { StateCreator } from 'zustand';
import { toast } from 'sonner';
import {
  ReadingState,
  DailyHoroscope,
  CosmicWeather,
  HoroscopeGenerationMetadata,
} from '../../types/reading';
import { fetchWithTimeout } from '../../lib/fetchWithTimeout';

export interface ReadingSlice extends ReadingState {
  // Actions
  generateHoroscope: (natalChart: any, userProfile: any, options?: any) => Promise<DailyHoroscope>;
  setDailyHoroscope: (horoscope: DailyHoroscope | null) => void;
  setCosmicWeather: (weather: CosmicWeather) => void;
  setLoadingDailyReading: (loading: boolean) => void;
  setDailyReadingError: (error: string | null) => void;
  setGenerationMetadata: (metadata: HoroscopeGenerationMetadata) => void;
  clearDailyReading: () => void;
  setGeneratingHoroscope: (generating: boolean) => void;
}

export const createReadingSlice: StateCreator<ReadingSlice> = (set, get) => ({
  // Initial state
  dailyHoroscope: null,
  cosmicWeather: null,
  isLoadingDailyReading: false,
  isGeneratingHoroscope: false,
  dailyReadingError: null,
  lastHoroscopeDate: null,
  lastGenerationMetadata: null,

  // Actions
  generateHoroscope: async (natalChart, userProfile, options = {}) => {
    set({ isGeneratingHoroscope: true, dailyReadingError: null });

    try {
      const state = get();
      console.log('🔮 Loading daily horoscope (checks cache, DB, then generates if needed)...');

      const response = await fetchWithTimeout('/api/horoscope/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          natalChart,
          userProfile,
          cachedHoroscope: state.dailyHoroscope,
          options,
        }),
      }, 60000);

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to load horoscope');
      }

      const { horoscope, metadata, fromCache } = result;

      // Update store
      set({
        dailyHoroscope: horoscope,
        lastHoroscopeDate: horoscope.date,
        lastGenerationMetadata: metadata,
        isGeneratingHoroscope: false,
        dailyReadingError: null,
      });

      console.log(fromCache ? '✅ Horoscope loaded from cache/database' : '✅ Horoscope generated successfully');
      return horoscope;
    } catch (error: any) {
      console.error('❌ Failed to load horoscope:', error);
      const message = error.message || 'Failed to load horoscope';
      set({
        dailyReadingError: message,
        isGeneratingHoroscope: false,
      });
      toast.error(message);
      throw error;
    }
  },

  setDailyHoroscope: (horoscope) =>
    set({
      dailyHoroscope: horoscope,
      lastHoroscopeDate: horoscope?.date ?? null,
      dailyReadingError: null,
    }),

  setCosmicWeather: (weather) =>
    set({
      cosmicWeather: weather,
    }),

  setLoadingDailyReading: (loading) =>
    set({
      isLoadingDailyReading: loading,
    }),

  setDailyReadingError: (error) =>
    set({
      dailyReadingError: error,
      isLoadingDailyReading: false,
    }),

  setGenerationMetadata: (metadata) =>
    set({
      lastGenerationMetadata: metadata,
    }),

  setGeneratingHoroscope: (generating) =>
    set({
      isGeneratingHoroscope: generating,
    }),

  clearDailyReading: () =>
    set({
      dailyHoroscope: null,
      cosmicWeather: null,
      dailyReadingError: null,
      lastHoroscopeDate: null,
      lastGenerationMetadata: null,
    }),
});
