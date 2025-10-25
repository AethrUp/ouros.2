import { StateCreator } from 'zustand';
import {
  ReadingState,
  DailyHoroscope,
  CosmicWeather,
  HoroscopeGenerationMetadata,
} from '../../types/reading';

export interface ReadingSlice extends ReadingState {
  // Actions
  generateHoroscope: (natalChart: any, userProfile: any, options?: any) => Promise<DailyHoroscope>;
  setDailyHoroscope: (horoscope: DailyHoroscope) => void;
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
      console.log('🔮 Generating daily horoscope...');

      const response = await fetch('/api/horoscope/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          natalChart,
          userProfile,
          options,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate horoscope');
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

      console.log(fromCache ? '✅ Horoscope loaded from cache' : '✅ Horoscope generated successfully');
      return horoscope;
    } catch (error: any) {
      console.error('❌ Failed to generate horoscope:', error);
      set({
        dailyReadingError: error.message || 'Failed to generate horoscope',
        isGeneratingHoroscope: false,
      });
      throw error;
    }
  },

  setDailyHoroscope: (horoscope) =>
    set({
      dailyHoroscope: horoscope,
      lastHoroscopeDate: horoscope.date,
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
