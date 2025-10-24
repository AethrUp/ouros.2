/**
 * Journal Entry Handlers
 * Handles CRUD operations for journal entries
 */

import { supabase } from '../utils/supabase';
import {
  JournalEntry,
  CreateJournalEntryInput,
  UpdateJournalEntryInput,
  JournalEntryFilters,
  LinkedReading,
} from '../types/journal';

/**
 * Create a new journal entry
 */
export const createJournalEntry = async (
  input: CreateJournalEntryInput
): Promise<JournalEntry> => {
  console.log('📝 Creating journal entry...');

  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Generate default title if not provided
    const date = input.date ? new Date(input.date) : new Date();
    const defaultTitle = `Journal Entry ${date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}`;

    const entryData = {
      user_id: user.id,
      title: input.title || defaultTitle,
      date: input.date || new Date().toISOString(),
      entry_type: input.entry_type,
      content: input.content,
      mood: input.mood,
      energy: input.energy,
      tags: input.tags || [],
      linked_reading_id: input.linked_reading_id,
      is_private: input.is_private ?? true,
    };

    const { data, error } = await supabase
      .from('journal_entries')
      .insert(entryData)
      .select()
      .single();

    if (error) {
      console.error('Failed to create journal entry:', error);
      throw new Error(`Failed to create journal entry: ${error.message}`);
    }

    console.log('✅ Journal entry created successfully');
    return data as JournalEntry;
  } catch (error) {
    console.error('Error creating journal entry:', error);
    throw error;
  }
};

/**
 * Get a single journal entry by ID
 */
export const getJournalEntry = async (
  entryId: string
): Promise<JournalEntry> => {
  console.log(`📖 Fetching journal entry ${entryId}...`);

  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .select(`
        *,
        linked_reading:readings(
          id,
          reading_type,
          timestamp,
          interpretation,
          intention,
          metadata
        )
      `)
      .eq('id', entryId)
      .single();

    if (error) {
      console.error('Failed to fetch journal entry:', error);
      throw new Error(`Failed to fetch journal entry: ${error.message}`);
    }

    if (!data) {
      throw new Error('Journal entry not found');
    }

    // Transform the data to match our type
    const entry: JournalEntry = {
      ...data,
      linked_reading: data.linked_reading ? {
        id: data.linked_reading.id,
        reading_type: data.linked_reading.reading_type,
        title: data.linked_reading.metadata?.title,
        timestamp: data.linked_reading.timestamp,
        interpretation: data.linked_reading.interpretation,
        intention: data.linked_reading.intention,
        metadata: data.linked_reading.metadata,
      } : undefined,
    };

    console.log('✅ Journal entry fetched successfully');
    return entry;
  } catch (error) {
    console.error('Error fetching journal entry:', error);
    throw error;
  }
};

/**
 * Get all journal entries for the current user
 */
export const getJournalEntries = async (
  filters?: JournalEntryFilters
): Promise<JournalEntry[]> => {
  console.log('📚 Fetching journal entries...');

  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    let query = supabase
      .from('journal_entries')
      .select(`
        *,
        linked_reading:readings(
          id,
          reading_type,
          timestamp,
          interpretation,
          intention,
          metadata
        )
      `)
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    // Apply filters
    if (filters?.entry_type) {
      query = query.eq('entry_type', filters.entry_type);
    }

    if (filters?.start_date) {
      query = query.gte('date', filters.start_date);
    }

    if (filters?.end_date) {
      query = query.lte('date', filters.end_date);
    }

    if (filters?.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    if (filters?.has_linked_reading !== undefined) {
      if (filters.has_linked_reading) {
        query = query.not('linked_reading_id', 'is', null);
      } else {
        query = query.is('linked_reading_id', null);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch journal entries:', error);
      throw new Error(`Failed to fetch journal entries: ${error.message}`);
    }

    // Transform the data to match our type
    const entries: JournalEntry[] = (data || []).map((entry: any) => ({
      ...entry,
      linked_reading: entry.linked_reading ? {
        id: entry.linked_reading.id,
        reading_type: entry.linked_reading.reading_type,
        title: entry.linked_reading.metadata?.title,
        timestamp: entry.linked_reading.timestamp,
        interpretation: entry.linked_reading.interpretation,
        intention: entry.linked_reading.intention,
        metadata: entry.linked_reading.metadata,
      } : undefined,
    }));

    console.log(`✅ Fetched ${entries.length} journal entries`);
    return entries;
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    throw error;
  }
};

/**
 * Update a journal entry
 */
export const updateJournalEntry = async (
  entryId: string,
  updates: UpdateJournalEntryInput
): Promise<JournalEntry> => {
  console.log(`✏️ Updating journal entry ${entryId}...`);

  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .update(updates)
      .eq('id', entryId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update journal entry:', error);
      throw new Error(`Failed to update journal entry: ${error.message}`);
    }

    console.log('✅ Journal entry updated successfully');
    return data as JournalEntry;
  } catch (error) {
    console.error('Error updating journal entry:', error);
    throw error;
  }
};

/**
 * Delete a journal entry
 */
export const deleteJournalEntry = async (entryId: string): Promise<void> => {
  console.log(`🗑️ Deleting journal entry ${entryId}...`);

  try {
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', entryId);

    if (error) {
      console.error('Failed to delete journal entry:', error);
      throw new Error(`Failed to delete journal entry: ${error.message}`);
    }

    console.log('✅ Journal entry deleted successfully');
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    throw error;
  }
};

/**
 * Get journal entries linked to a specific reading
 */
export const getEntriesForReading = async (
  readingId: string
): Promise<JournalEntry[]> => {
  console.log(`📖 Fetching journal entries for reading ${readingId}...`);

  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('linked_reading_id', readingId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Failed to fetch entries for reading:', error);
      throw new Error(`Failed to fetch entries for reading: ${error.message}`);
    }

    console.log(`✅ Fetched ${data?.length || 0} entries for reading`);
    return (data || []) as JournalEntry[];
  } catch (error) {
    console.error('Error fetching entries for reading:', error);
    throw error;
  }
};
