import { useState, useEffect, useCallback } from 'react';
import {
  JournalEntry,
  CreateJournalEntryInput,
  UpdateJournalEntryInput,
  JournalEntryFilters,
} from '@/types/journal';

interface UseJournalReturn {
  entries: JournalEntry[];
  loading: boolean;
  error: string | null;
  createEntry: (input: CreateJournalEntryInput) => Promise<JournalEntry>;
  updateEntry: (id: string, updates: UpdateJournalEntryInput) => Promise<JournalEntry>;
  deleteEntry: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook for managing journal entries
 */
export function useJournal(filters?: JournalEntryFilters): UseJournalReturn {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query string
      const params = new URLSearchParams();
      if (filters?.entry_type) params.append('entry_type', filters.entry_type);
      if (filters?.start_date) params.append('start_date', filters.start_date);
      if (filters?.end_date) params.append('end_date', filters.end_date);
      if (filters?.has_linked_reading !== undefined) {
        params.append('has_linked_reading', String(filters.has_linked_reading));
      }

      const queryString = params.toString();
      const url = `/api/journal${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch journal entries');
      }

      const data = await response.json();
      setEntries(data.entries || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching journal entries:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const createEntry = async (input: CreateJournalEntryInput): Promise<JournalEntry> => {
    try {
      const response = await fetch('/api/journal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create journal entry');
      }

      const data = await response.json();

      // Add the new entry to the local state
      setEntries((prev) => [data.entry, ...prev]);

      return data.entry;
    } catch (err) {
      console.error('Error creating journal entry:', err);
      throw err;
    }
  };

  const updateEntry = async (
    id: string,
    updates: UpdateJournalEntryInput
  ): Promise<JournalEntry> => {
    try {
      const response = await fetch(`/api/journal/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update journal entry');
      }

      const data = await response.json();

      // Update the entry in local state
      setEntries((prev) =>
        prev.map((entry) => (entry.id === id ? data.entry : entry))
      );

      return data.entry;
    } catch (err) {
      console.error('Error updating journal entry:', err);
      throw err;
    }
  };

  const deleteEntry = async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/journal/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete journal entry');
      }

      // Remove the entry from local state
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
    } catch (err) {
      console.error('Error deleting journal entry:', err);
      throw err;
    }
  };

  return {
    entries,
    loading,
    error,
    createEntry,
    updateEntry,
    deleteEntry,
    refetch: fetchEntries,
  };
}

interface UseJournalEntryReturn {
  entry: JournalEntry | null;
  loading: boolean;
  error: string | null;
  updateEntry: (updates: UpdateJournalEntryInput) => Promise<JournalEntry>;
  deleteEntry: () => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook for managing a single journal entry
 */
export function useJournalEntry(id: string): UseJournalEntryReturn {
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntry = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/journal/${id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch journal entry');
      }

      const data = await response.json();
      setEntry(data.entry);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching journal entry:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchEntry();
    }
  }, [id, fetchEntry]);

  const updateEntry = async (updates: UpdateJournalEntryInput): Promise<JournalEntry> => {
    try {
      const response = await fetch(`/api/journal/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update journal entry');
      }

      const data = await response.json();
      setEntry(data.entry);
      return data.entry;
    } catch (err) {
      console.error('Error updating journal entry:', err);
      throw err;
    }
  };

  const deleteEntry = async (): Promise<void> => {
    try {
      const response = await fetch(`/api/journal/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete journal entry');
      }

      setEntry(null);
    } catch (err) {
      console.error('Error deleting journal entry:', err);
      throw err;
    }
  };

  return {
    entry,
    loading,
    error,
    updateEntry,
    deleteEntry,
    refetch: fetchEntry,
  };
}
