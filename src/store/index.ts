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
import { createJournalSlice, JournalSlice } from './slices/journalSlice';
import { createSocialSlice, SocialSlice } from './slices/socialSlice';

// Combined store type
export type AppStore = AppSlice & AuthSlice & UserSlice & ChartSlice & ReadingSlice & TarotSlice & IChingSlice & JournalSlice & SocialSlice;

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
      ...createJournalSlice(...args),
      ...createSocialSlice(...args),
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
        // Persist journal entries (not current entry state)
        journalEntries: state.journalEntries,
        // Persist social connections
        connections: state.connections,
        sentInvitations: state.sentInvitations,
        receivedInvitations: state.receivedInvitations,
      }),
    }
  )
);
