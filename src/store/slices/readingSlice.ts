import { StateCreator } from 'zustand';
import {
  ReadingState,
  DailyHoroscope,
  CosmicWeather,
  HoroscopeGenerationMetadata,
} from '../../types/reading';

export interface ReadingSlice extends ReadingState {
  // Actions
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
