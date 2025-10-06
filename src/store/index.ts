import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAppSlice, AppSlice } from './slices/appSlice';
import { createAuthSlice, AuthSlice } from './slices/authSlice';
import { createUserSlice, UserSlice } from './slices/userSlice';
import { createChartSlice, ChartSlice } from './slices/chartSlice';
import { createReadingSlice, ReadingSlice } from './slices/readingSlice';
import { createTarotSlice, TarotSlice } from './slices/tarotSlice';
import { createIChingSlice, IChingSlice } from './slices/ichingSlice';

// Combined store type
export type AppStore = AppSlice & AuthSlice & UserSlice & ChartSlice & ReadingSlice & TarotSlice & IChingSlice;

// Create the store with persistence
export const useAppStore = create<AppStore>()(
  persist(
    (...args) => ({
      ...createAppSlice(...args),
      ...createAuthSlice(...args),
      ...createUserSlice(...args),
      ...createChartSlice(...args),
      ...createReadingSlice(...args),
      ...createTarotSlice(...args),
      ...createIChingSlice(...args),
    }),
    {
      name: 'ouros2-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialPersist: (state) => ({
        // Only persist essential app state
        activeTab: state.activeTab,
        // Persist auth state
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
        user: state.user,
        // Persist user profile and birth data
        profile: state.profile,
        birthData: state.birthData,
        preferences: state.preferences,
        // Persist chart data (charts don't change unless regenerated)
        natalChart: state.natalChart,
        lastCalculated: state.lastCalculated,
        // Persist daily horoscope (24h cache)
        dailyHoroscope: state.dailyHoroscope,
        cosmicWeather: state.cosmicWeather,
        lastHoroscopeDate: state.lastHoroscopeDate,
        // Persist tarot readings history (not session state)
        readings: state.readings,
        // Persist I Ching readings history (not session state)
        ichingReadings: state.ichingReadings,
      }),
    }
  )
);
