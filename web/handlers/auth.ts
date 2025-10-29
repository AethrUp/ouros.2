import { supabase } from '../utils/supabase';
import { LoginCredentials, RegisterData, AuthResponse, AuthError } from '../types/auth';

/**
 * Authentication API handlers
 * Integrates with Supabase for user authentication
 */

export const authAPI = {
  /**
   * Login with email and password
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        throw {
          code: error.name || 'AUTH_ERROR',
          message: error.message,
        } as AuthError;
      }

      if (!data.session || !data.user) {
        throw {
          code: 'NO_SESSION',
          message: 'No session returned from login',
        } as AuthError;
      }

      return {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at ? data.session.expires_at * 1000 : Date.now() + 3600000,
        user: {
          id: data.user.id,
          email: data.user.email || '',
          emailVerified: data.user.email_confirmed_at ? true : false,
          displayName: data.user.user_metadata?.display_name || data.user.email?.split('@')[0] || 'User',
          avatar: data.user.user_metadata?.avatar_url,
          createdAt: data.user.created_at,
        },
      };
    } catch (error: any) {
      if (error.code && error.message) {
        throw error;
      }
      throw {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'An unknown error occurred',
      } as AuthError;
    }
  },

  /**
   * Register a new user
   */
  register: async (userData: RegisterData): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            display_name: userData.displayName,
          },
          emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/confirm`,
        },
      });

      if (error) {
        throw {
          code: error.name || 'AUTH_ERROR',
          message: error.message,
        } as AuthError;
      }

      if (!data.user) {
        throw {
          code: 'NO_USER',
          message: 'No user returned from registration',
        } as AuthError;
      }

      // Supabase may return a session even if email confirmation is pending
      // Allow user to proceed with unverified email
      const session = data.session;
      const user = data.user;

      // Create profile in Supabase (upsert to handle trigger race condition)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email || '',
          display_name: userData.displayName,
          avatar: user.user_metadata?.avatar_url,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          language: 'en',
        }, {
          onConflict: 'id',
        });

      if (profileError) {
        console.warn('Profile creation warning:', profileError);
        // Don't throw - profile might have been created by trigger
      }

      // If no session, create a partial response indicating verification needed
      if (!session) {
        return {
          accessToken: '',
          refreshToken: '',
          expiresAt: 0,
          user: {
            id: user.id,
            email: user.email || '',
            emailVerified: false,
            displayName: userData.displayName,
            avatar: user.user_metadata?.avatar_url,
            createdAt: user.created_at,
          },
        };
      }

      return {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresAt: session.expires_at ? session.expires_at * 1000 : Date.now() + 3600000,
        user: {
          id: user.id,
          email: user.email || '',
          emailVerified: user.email_confirmed_at ? true : false,
          displayName: userData.displayName,
          avatar: user.user_metadata?.avatar_url,
          createdAt: user.created_at,
        },
      };
    } catch (error: any) {
      if (error.code && error.message) {
        throw error;
      }
      throw {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'An unknown error occurred',
      } as AuthError;
    }
  },

  /**
   * Refresh the current session
   */
  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error) {
        throw {
          code: error.name || 'AUTH_ERROR',
          message: error.message,
        } as AuthError;
      }

      if (!data.session || !data.user) {
        throw {
          code: 'NO_SESSION',
          message: 'Failed to refresh session',
        } as AuthError;
      }

      return {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at ? data.session.expires_at * 1000 : Date.now() + 3600000,
        user: {
          id: data.user.id,
          email: data.user.email || '',
          emailVerified: data.user.email_confirmed_at ? true : false,
          displayName: data.user.user_metadata?.display_name || data.user.email?.split('@')[0] || 'User',
          avatar: data.user.user_metadata?.avatar_url,
          createdAt: data.user.created_at,
        },
      };
    } catch (error: any) {
      if (error.code && error.message) {
        throw error;
      }
      throw {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'An unknown error occurred',
      } as AuthError;
    }
  },

  /**
   * Resend verification email
   */
  resendVerificationEmail: async (email: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      });

      if (error) {
        throw {
          code: error.name || 'AUTH_ERROR',
          message: error.message,
        } as AuthError;
      }
    } catch (error: any) {
      if (error.code && error.message) {
        throw error;
      }
      throw {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'An unknown error occurred',
      } as AuthError;
    }
  },

  /**
   * Sign out the current user
   */
  logout: async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw {
          code: error.name || 'AUTH_ERROR',
          message: error.message,
        } as AuthError;
      }
    } catch (error: any) {
      if (error.code && error.message) {
        throw error;
      }
      throw {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'An unknown error occurred',
      } as AuthError;
    }
  },

  /**
   * Sign in with OAuth provider (Apple, Google)
   */
  signInWithProvider: async (provider: 'apple' | 'google'): Promise<void> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        throw {
          code: error.name || 'AUTH_ERROR',
          message: error.message,
        } as AuthError;
      }
    } catch (error: any) {
      if (error.code && error.message) {
        throw error;
      }
      throw {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'An unknown error occurred',
      } as AuthError;
    }
  },

  /**
   * Send password reset email
   */
  resetPassword: async (email: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw {
          code: error.name || 'AUTH_ERROR',
          message: error.message,
        } as AuthError;
      }
    } catch (error: any) {
      if (error.code && error.message) {
        throw error;
      }
      throw {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'An unknown error occurred',
      } as AuthError;
    }
  },

  /**
   * Update user password (for password reset flow)
   */
  updatePassword: async (newPassword: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw {
          code: error.name || 'AUTH_ERROR',
          message: error.message,
        } as AuthError;
      }
    } catch (error: any) {
      if (error.code && error.message) {
        throw error;
      }
      throw {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'An unknown error occurred',
      } as AuthError;
    }
  },
};
