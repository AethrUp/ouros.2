/**
 * NatalChartService
 * Handles storing and retrieving natal charts from Supabase
 * Ensures both users and friends have accessible chart data for synastry
 */

import { supabase } from '../supabase';
import ErrorRecovery from '../errors/ErrorRecovery';
import { saveNatalChart as saveLocalChart, getNatalChart as getLocalChart } from '../../utils/storage';

class NatalChartService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 60 * 60 * 1000; // 1 hour for natal charts (they don't change)
  }

  /**
   * Save or update user's natal chart in Supabase
   * @param {Object} chartData - The calculated chart data from SwissEphAPIService
   * @param {Object} metadata - Additional metadata about the chart
   * @returns {Promise<Object>} Saved chart record
   */
  async saveUserNatalChart(chartData, metadata = {}) {
    return ErrorRecovery.withRetry(async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('Authentication required to save natal chart');
      }

      console.log('💾 Saving natal chart to Supabase for user:', user.id);

      // Prepare the chart data for storage
      const chartPayload = {
        user_id: user.id,
        chart_data: chartData,
        metadata: {
          ...metadata,
          saved_at: new Date().toISOString(),
          version: '1.0'
        }
      };

      // Use upsert function to insert or update
      const { data: chartId, error } = await supabase
        .rpc('upsert_natal_chart', {
          p_user_id: user.id,
          p_chart_data: chartData,
          p_metadata: chartPayload.metadata
        });

      if (error) {
        console.error('Error saving natal chart:', error);
        throw new Error(`Failed to save natal chart: ${error.message}`);
      }

      // Clear cache for this user
      this.clearUserCache(user.id);

      console.log('✅ Natal chart saved successfully with ID:', chartId);

      // Also save locally for offline access
      try {
        await saveLocalChart({
          id: chartId,
          type: 'natal_chart',
          timestamp: new Date().toISOString(),
          chartData: chartData,
          metadata: chartPayload.metadata
        });
        console.log('✅ Chart also saved locally for offline access');
      } catch (localError) {
        console.warn('⚠️ Failed to save chart locally:', localError.message);
      }

      return { id: chartId, ...chartPayload };
    });
  }

  /**
   * Get current user's natal chart from Supabase
   * @param {boolean} useCache - Whether to use cached data
   * @returns {Promise<Object|null>} User's natal chart or null
   */
  async getCurrentUserNatalChart(useCache = true) {
    return ErrorRecovery.withRetry(async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('Authentication required');
      }

      return this.getUserNatalChart(user.id, useCache);
    });
  }

  /**
   * Get a specific user's natal chart from Supabase
   * @param {string} userId - User ID to get chart for
   * @param {boolean} useCache - Whether to use cached data
   * @returns {Promise<Object|null>} User's natal chart or null
   */
  async getUserNatalChart(userId, useCache = true) {
    return ErrorRecovery.withRetry(async () => {
      const cacheKey = `natal_chart_${userId}`;

      if (useCache) {
        const cached = this.getCache(cacheKey);
        if (cached) {
          console.log('📦 Returning cached natal chart for user:', userId);
          return cached;
        }
      }

      console.log('🔍 Fetching natal chart from Supabase for user:', userId);

      const { data: chart, error } = await supabase
        .from('natal_charts')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No chart found - this is normal for users who haven't completed onboarding
          console.log('ℹ️ No natal chart found for user:', userId);

          // Try to get from local storage as fallback
          const localChart = await getLocalChart();
          if (localChart) {
            console.log('📱 Found chart in local storage, will use as fallback');
            return localChart;
          }

          return null;
        }
        console.error('Error fetching natal chart:', error);
        throw new Error(`Failed to fetch natal chart: ${error.message}`);
      }

      // Cache the result
      if (useCache && chart) {
        this.setCache(cacheKey, chart);
      }

      console.log('✅ Natal chart retrieved successfully');
      return chart;
    });
  }

  /**
   * Get a friend's natal chart for synastry calculations
   * @param {string} friendUserId - Friend's user ID
   * @param {boolean} useCache - Whether to use cached data
   * @returns {Promise<Object|null>} Friend's natal chart or null
   */
  async getFriendNatalChart(friendUserId, useCache = true) {
    return ErrorRecovery.withRetry(async () => {
      const cacheKey = `friend_natal_chart_${friendUserId}`;

      if (useCache) {
        const cached = this.getCache(cacheKey);
        if (cached) {
          console.log('📦 Returning cached friend natal chart:', friendUserId);
          return cached;
        }
      }

      console.log('🔍 Fetching friend natal chart from Supabase:', friendUserId);

      // Use the RPC function that checks friend relationship
      const { data: chart, error } = await supabase
        .rpc('get_friend_natal_chart', { friend_user_id: friendUserId });

      if (error) {
        console.error('Error fetching friend natal chart:', error);

        if (error.message.includes('not connected')) {
          throw new Error('You must be connected with this user to view their chart');
        }

        throw new Error(`Failed to fetch friend's natal chart: ${error.message}`);
      }

      if (!chart || chart.length === 0) {
        console.log('ℹ️ Friend has not yet generated their natal chart');
        return null;
      }

      const friendChart = chart[0]; // RPC returns array

      // Cache the result
      if (useCache && friendChart) {
        this.setCache(cacheKey, friendChart);
      }

      console.log('✅ Friend natal chart retrieved successfully');
      return friendChart;
    });
  }

  /**
   * Check if a user has a natal chart
   * @param {string} userId - User ID to check
   * @returns {Promise<boolean>} Whether user has a natal chart
   */
  async userHasNatalChart(userId) {
    try {
      const { data, error } = await supabase
        .from('natal_charts')
        .select('id')
        .eq('user_id', userId)
        .single();

      return !error && !!data;
    } catch (error) {
      console.error('Error checking natal chart existence:', error);
      return false;
    }
  }

  /**
   * Delete current user's natal chart
   * @returns {Promise<boolean>} Success status
   */
  async deleteCurrentUserNatalChart() {
    return ErrorRecovery.withRetry(async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('Authentication required');
      }

      const { error } = await supabase
        .from('natal_charts')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting natal chart:', error);
        throw new Error(`Failed to delete natal chart: ${error.message}`);
      }

      // Clear cache
      this.clearUserCache(user.id);

      console.log('✅ Natal chart deleted successfully');
      return true;
    });
  }

  /**
   * Migrate local natal chart to Supabase (for existing users)
   * @returns {Promise<Object|null>} Migrated chart or null if no local chart
   */
  async migrateLocalChartToSupabase() {
    try {
      console.log('🔄 Checking for local natal chart to migrate...');

      // Get local chart
      const localChart = await getLocalChart();
      if (!localChart || !localChart.chartData) {
        console.log('ℹ️ No local chart to migrate');
        return null;
      }

      // Check if already migrated
      const existingChart = await this.getCurrentUserNatalChart(false);
      if (existingChart) {
        console.log('ℹ️ Chart already exists in Supabase, skipping migration');
        return existingChart;
      }

      // Migrate to Supabase
      const migrated = await this.saveUserNatalChart(localChart.chartData, {
        ...localChart.metadata,
        migrated_from: 'local_storage',
        migration_date: new Date().toISOString()
      });

      console.log('✅ Successfully migrated local chart to Supabase');
      return migrated;

    } catch (error) {
      console.error('Failed to migrate local chart:', error);
      return null;
    }
  }

  // ============================================================================
  // CACHE UTILITIES
  // ============================================================================

  setCache(key, data) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.cacheExpiry
    });
  }

  getCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  clearUserCache(userId) {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.includes(userId)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  clearCache() {
    this.cache.clear();
    console.log('🧹 NatalChartService cache cleared');
  }
}

// Export singleton instance
export const natalChartService = new NatalChartService();

// Export class for testing
export default NatalChartService;