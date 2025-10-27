import { StateCreator } from 'zustand';
import { LoginCredentials, RegisterData, User } from '../../types/auth';
import { UserProfile, BirthData, NatalChartData } from '../../types/user';

export interface AuthSlice {
  // Authentication status
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // User session
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  user: User | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

/**
 * Check if horoscope is up to date (today's date)
 */
const isHoroscopeCurrent = (lastHoroscopeDate: string | null): boolean => {
  if (!lastHoroscopeDate) return false;

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  return lastHoroscopeDate === todayStr;
};

/**
 * Fetch user profile and related data from Supabase
 */
const fetchUserData = async (userId: string): Promise<{
  profile: UserProfile | null;
  birthData: BirthData | null;
  natalChart: NatalChartData | null;
}> => {
  try {
    const { supabase } = await import('../../utils/supabase');

    // Fetch profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      throw profileError;
    }

    // Fetch birth data
    const { data: birthDataRaw, error: birthError } = await supabase
      .from('birth_data')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // Fetch natal chart
    const { data: chartDataRaw, error: chartError } = await supabase
      .from('natal_charts')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // Profile must exist - throw if not found
    if (!profileData) {
      throw new Error('Profile not found for user. This should not happen - check database triggers.');
    }

    // Transform profile data
    const profile: UserProfile = {
      id: profileData.id,
      email: profileData.email,
      displayName: profileData.display_name,
      avatar: profileData.avatar,
      timezone: profileData.timezone,
      language: profileData.language,
      createdAt: profileData.created_at,
    };

    // Transform birth data if exists
    let birthData: BirthData | null = null;
    if (birthDataRaw && !birthError) {
      birthData = {
        birthDate: birthDataRaw.birth_date,
        birthTime: birthDataRaw.birth_time || '00:00',
        timeUnknown: birthDataRaw.time_unknown,
        birthLocation: {
          name: birthDataRaw.location_name,
          latitude: parseFloat(birthDataRaw.latitude),
          longitude: parseFloat(birthDataRaw.longitude),
          timezone: birthDataRaw.location_timezone,
          timezoneOffset: 0, // This will need to be calculated if needed
          country: birthDataRaw.country,
          region: birthDataRaw.region,
        },
        timezone: birthDataRaw.location_timezone,
      };
    }

    // Transform natal chart if exists
    let natalChart: NatalChartData | null = null;
    if (chartDataRaw && !chartError) {
      natalChart = {
        planets: chartDataRaw.planets,
        houses: chartDataRaw.houses,
        aspects: chartDataRaw.aspects,
        angles: chartDataRaw.angles,
        metadata: {
          houseSystem: chartDataRaw.house_system,
          precision: chartDataRaw.precision,
          dataSource: chartDataRaw.data_source,
          calculationMethod: chartDataRaw.calculation_method,
          generatedAt: chartDataRaw.calculated_at,
          version: chartDataRaw.version,
        },
      };
    }

    console.log('✅ User data fetched from Supabase:', {
      hasProfile: !!profile,
      hasBirthData: !!birthData,
      hasNatalChart: !!natalChart,
    });

    return { profile, birthData, natalChart };
  } catch (error: any) {
    console.error('❌ Error fetching user data from Supabase:', error);
    return { profile: null, birthData: null, natalChart: null };
  }
};

export const createAuthSlice: StateCreator<AuthSlice> = (set, get) => ({
  // Initial state
  isAuthenticated: false,
  isLoading: false,
  error: null,
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
  user: null,

  // Actions
  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const { authAPI } = await import('../../handlers/auth');
      const response = await authAPI.login(credentials);

      set({
        isAuthenticated: true,
        isLoading: false,
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresAt: response.expiresAt,
      });

      // Fetch user data from Supabase
      const userData = await fetchUserData(response.user.id);

      // Update user slice with fetched data
      const state = get() as any;
      if (userData.profile) {
        state.setProfile?.(userData.profile);
      }
      if (userData.birthData) {
        state.setBirthData?.(userData.birthData);
      }
      if (userData.natalChart) {
        state.setNatalChart?.(userData.natalChart);
      }

      // Check if horoscope needs to be generated
      if (userData.natalChart && userData.birthData) {
        const lastHoroscopeDate = state.lastHoroscopeDate;
        if (!isHoroscopeCurrent(lastHoroscopeDate)) {
          console.log('🌟 Horoscope is not current, generating new horoscope...');
          try {
            // Generate horoscope in the background (don't block login)
            state.generateHoroscope?.(userData.natalChart, userData.profile).catch((error: any) => {
              console.error('Failed to auto-generate horoscope on login:', error);
            });
          } catch (error) {
            console.error('Error initiating horoscope generation:', error);
          }
        } else {
          console.log('✅ Horoscope is current, no need to regenerate');
        }
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Login failed',
      });
      throw error;
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const { authAPI } = await import('../../handlers/auth');
      const response = await authAPI.register(userData);

      set({
        isAuthenticated: true,
        isLoading: false,
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresAt: response.expiresAt,
      });

      // Fetch user data from Supabase (profile should be auto-created by trigger)
      const userDataFromDb = await fetchUserData(response.user.id);

      // Update user slice with fetched data
      const state = get() as any;
      if (userDataFromDb.profile) {
        state.setProfile?.(userDataFromDb.profile);
      }
      if (userDataFromDb.birthData) {
        state.setBirthData?.(userDataFromDb.birthData);
      }
      if (userDataFromDb.natalChart) {
        state.setNatalChart?.(userDataFromDb.natalChart);
      }

      // Check if horoscope needs to be generated (same as login)
      if (userDataFromDb.natalChart && userDataFromDb.birthData) {
        const lastHoroscopeDate = state.lastHoroscopeDate;
        if (!isHoroscopeCurrent(lastHoroscopeDate)) {
          console.log('🌟 Horoscope is not current, generating new horoscope...');
          try {
            // Generate horoscope in the background (don't block registration)
            state.generateHoroscope?.(userDataFromDb.natalChart, userDataFromDb.profile).catch((error: any) => {
              console.error('Failed to auto-generate horoscope on registration:', error);
            });
          } catch (error) {
            console.error('Error initiating horoscope generation:', error);
          }
        } else {
          console.log('✅ Horoscope is current, no need to regenerate');
        }
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Registration failed',
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      const { authAPI } = await import('../../handlers/auth');
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear auth state
      set({
        isAuthenticated: false,
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
        user: null,
        error: null,
      });

      // Clear user data from other slices
      const state = get() as any;
      state.setProfile?.(null);
      state.setBirthData?.(null);
      state.setNatalChart?.(null);
      state.setDailyHoroscope?.(null);
    }
  },

  refreshSession: async () => {
    const { refreshToken } = get();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const { authAPI } = await import('../../handlers/auth');
      const response = await authAPI.refreshToken(refreshToken);

      set({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresAt: response.expiresAt,
        user: response.user,
      });

      // Fetch user data from Supabase if not already in state
      const state = get() as any;
      if (!state.profile) {
        const userData = await fetchUserData(response.user.id);
        if (userData.profile) {
          state.setProfile?.(userData.profile);
        }
        if (userData.birthData) {
          state.setBirthData?.(userData.birthData);
        }
        if (userData.natalChart) {
          state.setNatalChart?.(userData.natalChart);
        }

        // Check if horoscope needs to be generated (same as login)
        if (userData.natalChart && userData.birthData) {
          const lastHoroscopeDate = state.lastHoroscopeDate;
          if (!isHoroscopeCurrent(lastHoroscopeDate)) {
            console.log('🌟 Horoscope is not current, generating new horoscope...');
            try {
              // Generate horoscope in the background (don't block session refresh)
              state.generateHoroscope?.(userData.natalChart, userData.profile).catch((error: any) => {
                console.error('Failed to auto-generate horoscope on session refresh:', error);
              });
            } catch (error) {
              console.error('Error initiating horoscope generation:', error);
            }
          } else {
            console.log('✅ Horoscope is current, no need to regenerate');
          }
        }
      } else {
        // Profile already exists in state, check horoscope anyway
        if (state.natalChart && state.birthData) {
          const lastHoroscopeDate = state.lastHoroscopeDate;
          if (!isHoroscopeCurrent(lastHoroscopeDate)) {
            console.log('🌟 Horoscope is not current, generating new horoscope...');
            try {
              // Generate horoscope in the background (don't block session refresh)
              state.generateHoroscope?.(state.natalChart, state.profile).catch((error: any) => {
                console.error('Failed to auto-generate horoscope on session refresh:', error);
              });
            } catch (error) {
              console.error('Error initiating horoscope generation:', error);
            }
          } else {
            console.log('✅ Horoscope is current, no need to regenerate');
          }
        }
      }
    } catch (error: any) {
      set({
        isAuthenticated: false,
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
        user: null,
        error: error.message || 'Session refresh failed',
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
  setLoading: (loading) => set({ isLoading: loading }),
});
