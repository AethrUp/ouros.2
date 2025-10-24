import { StateCreator } from 'zustand';
import { UserProfile, BirthData, UserPreferences, NatalChartData } from '../../types/user';

export interface UserSlice {
  // Profile data
  profile: UserProfile | null;
  birthData: BirthData | null;
  preferences: UserPreferences;

  // Loading states
  isLoadingProfile: boolean;
  isSavingProfile: boolean;
  profileError: string | null;

  // Actions
  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  setBirthData: (birthData: BirthData) => void;
  updateBirthData: (birthData: BirthData) => Promise<void>;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  clearProfileError: () => void;
  setProfileLoading: (loading: boolean) => void;
  resetOnboarding: () => Promise<void>;
}

const defaultPreferences: UserPreferences = {
  interpretationStyle: 'psychological',
  detailLevel: 'detailed',
  focusAreas: [],
  theme: 'dark',
  selectedDeck: 'rider-waite',
  houseSystem: 'placidus',
  dailyHoroscope: true,
  readingReminders: true,
  journalPrompts: true,
};

export const createUserSlice: StateCreator<UserSlice> = (set, get) => ({
  // Initial state
  profile: null,
  birthData: null,
  preferences: defaultPreferences,
  isLoadingProfile: false,
  isSavingProfile: false,
  profileError: null,

  // Actions
  setProfile: (profile) => set({ profile }),

  updateProfile: async (updates) => {
    set({ isSavingProfile: true, profileError: null });
    try {
      const { profile } = get();
      if (!profile) {
        throw new Error('No profile to update');
      }

      const updatedProfile = { ...profile, ...updates };

      // Update profile in Supabase
      const { supabase } = await import('../../utils/supabase');

      // Map camelCase to snake_case for database
      const dbUpdates: any = {};
      if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
      if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;
      if (updates.timezone !== undefined) dbUpdates.timezone = updates.timezone;
      if (updates.language !== undefined) dbUpdates.language = updates.language;

      dbUpdates.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', profile.id);

      if (error) {
        throw new Error(error.message);
      }

      set({
        profile: updatedProfile,
        isSavingProfile: false,
      });
    } catch (error: any) {
      set({
        isSavingProfile: false,
        profileError: error.message || 'Failed to update profile',
      });
      throw error;
    }
  },

  setBirthData: (birthData) => {
    const { profile } = get();
    set({
      birthData,
      profile: profile ? { ...profile, birthData } : null,
    });
  },

  updateBirthData: async (birthData) => {
    set({ isSavingProfile: true, profileError: null });
    try {
      const { profile } = get();
      if (!profile) {
        throw new Error('No profile found');
      }

      const { supabase } = await import('../../utils/supabase');

      // Insert or update birth_data table with correct structure
      const { error: birthDataError } = await supabase
        .from('birth_data')
        .upsert({
          user_id: profile.id,
          birth_date: birthData.birthDate,
          birth_time: birthData.birthTime,
          time_unknown: birthData.timeUnknown,
          location_name: birthData.birthLocation.name,
          latitude: birthData.birthLocation.latitude,
          longitude: birthData.birthLocation.longitude,
          location_timezone: birthData.birthLocation.timezone,
          country: birthData.birthLocation.country || '',
          region: birthData.birthLocation.region || '',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (birthDataError) {
        console.error('Failed to save birth data to database:', birthDataError);
        throw new Error(birthDataError.message);
      }

      console.log('✅ Birth data saved to database');

      set({
        birthData,
        profile: profile ? { ...profile, birthData } : null,
        isSavingProfile: false,
      });
    } catch (error: any) {
      console.error('❌ Failed to update birth data:', error);
      set({
        isSavingProfile: false,
        profileError: error.message || 'Failed to update birth data',
      });
      throw error;
    }
  },

  updatePreferences: (prefs) => {
    const { preferences } = get();
    set({ preferences: { ...preferences, ...prefs } });
  },

  clearProfileError: () => set({ profileError: null }),
  setProfileLoading: (loading) => set({ isLoadingProfile: loading }),

  resetOnboarding: async () => {
    set({ isSavingProfile: true, profileError: null });
    try {
      const { profile } = get();

      // Clear birth data and natal chart from Supabase if user exists
      if (profile?.id) {
        const { supabase } = await import('../../utils/supabase');
        await supabase
          .from('profiles')
          .update({ birth_data: null, natal_chart: null })
          .eq('id', profile.id);
      }

      // Clear from local state
      set({
        birthData: null,
        profile: profile ? { ...profile, birthData: undefined, natalChart: undefined } : null,
        isSavingProfile: false,
      });
    } catch (error: any) {
      set({
        isSavingProfile: false,
        profileError: error.message || 'Failed to reset onboarding',
      });
      throw error;
    }
  },
});
