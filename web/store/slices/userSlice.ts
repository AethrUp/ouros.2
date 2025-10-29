import { StateCreator } from 'zustand';
import { toast } from 'sonner';
import { UserProfile, BirthData, UserPreferences, NatalChartData } from '../../types/user';
import type { BirthDataModificationStatus } from '../../types/subscription';
import { fetchWithTimeout } from '../../lib/fetchWithTimeout';

export interface UserSlice {
  // Profile data
  profile: UserProfile | null;
  birthData: BirthData | null;
  preferences: UserPreferences;

  // Loading states
  isLoadingProfile: boolean;
  isSavingProfile: boolean;
  profileError: string | null;

  // Birth data modification status
  birthDataModificationStatus: BirthDataModificationStatus | null;
  isLoadingModificationStatus: boolean;

  // Actions
  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  setBirthData: (birthData: BirthData) => void;
  updateBirthData: (birthData: BirthData) => Promise<void>;
  updateBirthDataWithValidation: (birthData: BirthData, confirmations: { deletesHoroscopes: boolean; dataCorrect: boolean }) => Promise<void>;
  loadBirthData: (userId: string) => Promise<void>;
  checkBirthDataModificationStatus: () => Promise<BirthDataModificationStatus>;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  loadPreferences: (userId: string) => Promise<void>;
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
  birthDataModificationStatus: null,
  isLoadingModificationStatus: false,

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

  updateBirthDataWithValidation: async (birthData, confirmations) => {
    set({ isSavingProfile: true, profileError: null });
    try {
      const { profile } = get();
      if (!profile) {
        throw new Error('No profile found');
      }

      // Call the new API endpoint with rate limiting
      const response = await fetchWithTimeout('/api/birth-data/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthDate: birthData.birthDate,
          birthTime: birthData.birthTime,
          birthLocation: birthData.birthLocation,
          confirmations,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle rate limiting errors
        if (response.status === 429) {
          throw new Error(result.error || 'Rate limit exceeded. Please try again later.');
        }
        throw new Error(result.error || 'Failed to update birth data');
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to update birth data');
      }

      console.log('✅ Birth data updated successfully with validation');

      // Update local state with new birth data
      set({
        birthData,
        profile: profile ? { ...profile, birthData } : null,
        isSavingProfile: false,
        profileError: null,
      });

      // Refresh modification status
      const state = get();
      await state.checkBirthDataModificationStatus();

      toast.success('Birth data updated');

    } catch (error: any) {
      console.error('❌ Failed to update birth data with validation:', error);
      const message = error.message || 'Failed to update birth data';
      set({
        isSavingProfile: false,
        profileError: message,
      });
      toast.error(message);
      throw error;
    }
  },

  checkBirthDataModificationStatus: async () => {
    set({ isLoadingModificationStatus: true });
    try {
      const { profile } = get();
      if (!profile) {
        throw new Error('No profile found');
      }

      const { supabase } = await import('../../utils/supabase');

      // Get subscription tier
      const state = get() as any;
      const tier: 'free' | 'premium' | 'pro' = state.subscriptionState?.tier || 'free';

      // Get birth data modification tracking info
      const { data: birthDataRecord, error: fetchError } = await supabase
        .from('birth_data')
        .select('modification_count, last_modified_at, can_modify_at')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error(fetchError.message);
      }

      // Check if modification is allowed using database function
      const { data: checkResult, error: checkError } = await supabase
        .rpc('check_birth_data_modification_allowed', { p_user_id: profile.id });

      if (checkError) {
        throw new Error(checkError.message);
      }

      const permissionCheck = checkResult?.[0];

      // Import limits
      const { BIRTH_DATA_MODIFICATION_LIMITS } = await import('../../types/subscription');
      const limits = BIRTH_DATA_MODIFICATION_LIMITS[tier as 'free' | 'premium' | 'pro'];

      const modificationCount = birthDataRecord?.modification_count || 0;
      const remainingChanges = limits.totalChanges === 'unlimited'
        ? 'unlimited'
        : Math.max(0, limits.totalChanges - modificationCount);

      const status: BirthDataModificationStatus = {
        allowed: permissionCheck?.allowed || false,
        reason: permissionCheck?.reason || 'Unknown',
        daysRemaining: permissionCheck?.days_remaining || 0,
        modificationCount,
        lastModifiedAt: birthDataRecord?.last_modified_at || null,
        canModifyAt: birthDataRecord?.can_modify_at || null,
        totalAllowed: limits.totalChanges,
        remainingChanges,
        cooldownDays: limits.cooldownDays,
      };

      set({
        birthDataModificationStatus: status,
        isLoadingModificationStatus: false,
      });

      console.log('✅ Birth data modification status loaded:', status);
      return status;

    } catch (error: any) {
      console.error('❌ Failed to check birth data modification status:', error);
      set({
        isLoadingModificationStatus: false,
      });
      throw error;
    }
  },

  loadBirthData: async (userId) => {
    set({ isLoadingProfile: true, profileError: null });
    try {
      const { supabase } = await import('../../utils/supabase');

      const { data, error } = await supabase
        .from('birth_data')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No birth data found - this is ok for new users
          console.log('No birth data found for user');
          set({ birthData: null, isLoadingProfile: false });
          return;
        }
        throw new Error(error.message);
      }

      if (data) {
        // Map snake_case to camelCase
        const birthData: BirthData = {
          birthDate: data.birth_date,
          birthTime: data.birth_time,
          timeUnknown: data.time_unknown,
          birthLocation: {
            name: data.location_name,
            latitude: data.latitude,
            longitude: data.longitude,
            timezone: data.location_timezone,
            timezoneOffset: 0, // This can be calculated from timezone if needed
            country: data.country,
            region: data.region,
          },
          timezone: data.location_timezone,
        };

        set({ birthData, isLoadingProfile: false });
        console.log('✅ Birth data loaded from database');
      }
    } catch (error: any) {
      console.error('❌ Failed to load birth data:', error);
      set({
        profileError: error.message || 'Failed to load birth data',
        isLoadingProfile: false,
      });
    }
  },

  updatePreferences: async (prefs) => {
    const { preferences, profile } = get();
    const updatedPreferences = { ...preferences, ...prefs };

    // Update local state first
    set({ preferences: updatedPreferences });

    // Save to Supabase if user is logged in
    if (profile?.id) {
      try {
        const { supabase } = await import('../../utils/supabase');

        // Map camelCase to snake_case for database
        const dbPrefs: any = {};
        if (prefs.interpretationStyle !== undefined) dbPrefs.interpretation_style = prefs.interpretationStyle;
        if (prefs.detailLevel !== undefined) dbPrefs.detail_level = prefs.detailLevel;
        if (prefs.focusAreas !== undefined) dbPrefs.focus_areas = prefs.focusAreas;
        if (prefs.theme !== undefined) dbPrefs.theme = prefs.theme;
        if (prefs.selectedDeck !== undefined) dbPrefs.selected_deck = prefs.selectedDeck;
        if (prefs.houseSystem !== undefined) dbPrefs.house_system = prefs.houseSystem;
        if (prefs.dailyHoroscope !== undefined) dbPrefs.daily_horoscope = prefs.dailyHoroscope;
        if (prefs.readingReminders !== undefined) dbPrefs.reading_reminders = prefs.readingReminders;
        if (prefs.journalPrompts !== undefined) dbPrefs.journal_prompts = prefs.journalPrompts;

        dbPrefs.updated_at = new Date().toISOString();

        const { error } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: profile.id,
            ...dbPrefs,
          }, {
            onConflict: 'user_id',
          });

        if (error) {
          console.error('Failed to save preferences to database:', error);
          throw new Error(error.message);
        }

        console.log('✅ Preferences saved to database');
      } catch (error: any) {
        console.error('❌ Failed to update preferences:', error);
        // Don't throw - preferences are already updated locally
      }
    }
  },

  loadPreferences: async (userId) => {
    try {
      const { supabase } = await import('../../utils/supabase');

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No preferences found - use defaults
          console.log('No preferences found, using defaults');
          return;
        }
        throw new Error(error.message);
      }

      if (data) {
        // Map snake_case to camelCase
        const preferences: UserPreferences = {
          interpretationStyle: data.interpretation_style,
          detailLevel: data.detail_level,
          focusAreas: data.focus_areas || [],
          theme: data.theme,
          selectedDeck: data.selected_deck,
          houseSystem: data.house_system,
          dailyHoroscope: data.daily_horoscope,
          readingReminders: data.reading_reminders,
          journalPrompts: data.journal_prompts,
        };

        set({ preferences });
        console.log('✅ Preferences loaded from database');
      }
    } catch (error: any) {
      console.error('❌ Failed to load preferences:', error);
      // Don't throw - just use default preferences
    }
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
