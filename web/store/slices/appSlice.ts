import { StateCreator } from 'zustand';

export interface AppSlice {
  // App state
  isInitialized: boolean;
  isAppLoading: boolean;
  error: string | null;
  activeTab: string;

  // Actions
  setInitialized: (initialized: boolean) => void;
  setAppLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setActiveTab: (tab: string) => void;
}

export const createAppSlice: StateCreator<AppSlice> = (set) => ({
  // Initial state
  isInitialized: false,
  isAppLoading: false,
  error: null,
  activeTab: 'home',

  // Actions
  setInitialized: (initialized) => set({ isInitialized: initialized }),
  setAppLoading: (loading) => set({ isAppLoading: loading }),
  setError: (error) => set({ error }),
  setActiveTab: (tab) => set({ activeTab: tab }),
});
