/**
 * Saved Charts API
 * Handles CRUD operations for saved natal charts (non-user charts)
 */

import { supabase } from '../utils/supabase';
import { SavedChart } from '../types/synastry';
import { BirthData, NatalChartData } from '../types/user';

export const savedChartsAPI = {
  // =====================================================
  // READ OPERATIONS
  // =====================================================

  /**
   * Load all saved charts for the current user
   */
  loadSavedCharts: async (): Promise<SavedChart[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('saved_charts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data?.map(chart => ({
      id: chart.id,
      userId: chart.user_id,
      name: chart.name,
      relationship: chart.relationship,
      birthData: chart.birth_data,
      natalChart: chart.natal_chart_data,
      isPublic: chart.is_public,
      notes: chart.notes,
      createdAt: chart.created_at,
      updatedAt: chart.updated_at,
    })) || [];
  },

  /**
   * Get a specific saved chart by ID
   */
  getSavedChart: async (chartId: string): Promise<SavedChart | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('saved_charts')
      .select('*')
      .eq('id', chartId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    if (!data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      relationship: data.relationship,
      birthData: data.birth_data,
      natalChart: data.natal_chart_data,
      isPublic: data.is_public,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  // =====================================================
  // CREATE OPERATION
  // =====================================================

  /**
   * Create a new saved chart
   */
  createSavedChart: async (
    name: string,
    birthData: BirthData,
    natalChart: NatalChartData,
    options?: {
      relationship?: string;
      notes?: string;
      isPublic?: boolean;
    }
  ): Promise<SavedChart> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('saved_charts')
      .insert({
        user_id: user.id,
        name,
        relationship: options?.relationship,
        birth_data: birthData,
        natal_chart_data: natalChart,
        is_public: options?.isPublic || false,
        notes: options?.notes,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      relationship: data.relationship,
      birthData: data.birth_data,
      natalChart: data.natal_chart_data,
      isPublic: data.is_public,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  // =====================================================
  // UPDATE OPERATION
  // =====================================================

  /**
   * Update an existing saved chart
   */
  updateSavedChart: async (
    chartId: string,
    updates: {
      name?: string;
      relationship?: string;
      birthData?: BirthData;
      natalChart?: NatalChartData;
      notes?: string;
      isPublic?: boolean;
    }
  ): Promise<SavedChart> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.relationship !== undefined) updateData.relationship = updates.relationship;
    if (updates.birthData !== undefined) updateData.birth_data = updates.birthData;
    if (updates.natalChart !== undefined) updateData.natal_chart_data = updates.natalChart;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic;

    const { data, error } = await supabase
      .from('saved_charts')
      .update(updateData)
      .eq('id', chartId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      relationship: data.relationship,
      birthData: data.birth_data,
      natalChart: data.natal_chart_data,
      isPublic: data.is_public,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  // =====================================================
  // DELETE OPERATION
  // =====================================================

  /**
   * Delete a saved chart
   */
  deleteSavedChart: async (chartId: string): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('saved_charts')
      .delete()
      .eq('id', chartId)
      .eq('user_id', user.id);

    if (error) throw error;
  },

  // =====================================================
  // UTILITY FUNCTIONS
  // =====================================================

  /**
   * Search saved charts by name
   */
  searchSavedCharts: async (query: string): Promise<SavedChart[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('saved_charts')
      .select('*')
      .eq('user_id', user.id)
      .ilike('name', `%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data?.map(chart => ({
      id: chart.id,
      userId: chart.user_id,
      name: chart.name,
      relationship: chart.relationship,
      birthData: chart.birth_data,
      natalChart: chart.natal_chart_data,
      isPublic: chart.is_public,
      notes: chart.notes,
      createdAt: chart.created_at,
      updatedAt: chart.updated_at,
    })) || [];
  },

  /**
   * Get count of saved charts for current user
   */
  getSavedChartsCount: async (): Promise<number> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { count, error } = await supabase
      .from('saved_charts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (error) throw error;

    return count || 0;
  },
};
