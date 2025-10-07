import { StateCreator } from 'zustand';
import {
  JournalEntry,
  CreateJournalEntryInput,
  UpdateJournalEntryInput,
  JournalEntryFilters,
} from '../../types/journal';

export interface JournalSlice {
  // Current state
  currentEntry: JournalEntry | null;
  journalEntries: JournalEntry[];

  // Loading states
  isLoadingEntry: boolean;
  isLoadingEntries: boolean;
  isSavingEntry: boolean;
  isDeletingEntry: boolean;

  // Error state
  journalError: string | null;

  // Actions
  createEntry: (input: CreateJournalEntryInput) => Promise<JournalEntry>;
  getEntry: (entryId: string) => Promise<void>;
  getEntries: (filters?: JournalEntryFilters) => Promise<void>;
  updateEntry: (entryId: string, updates: UpdateJournalEntryInput) => Promise<void>;
  deleteEntry: (entryId: string) => Promise<void>;
  clearCurrentEntry: () => void;
  setJournalError: (error: string | null) => void;
}

export const createJournalSlice: StateCreator<JournalSlice> = (set, get) => ({
  // Initial state
  currentEntry: null,
  journalEntries: [],
  isLoadingEntry: false,
  isLoadingEntries: false,
  isSavingEntry: false,
  isDeletingEntry: false,
  journalError: null,

  // Actions
  createEntry: async (input) => {
    console.log('📝 Creating journal entry...');
    set({ isSavingEntry: true, journalError: null });

    try {
      const { createJournalEntry } = await import('../../handlers/journal');
      const entry = await createJournalEntry(input);

      set({
        currentEntry: entry,
        journalEntries: [entry, ...get().journalEntries],
        isSavingEntry: false,
      });

      console.log('✅ Journal entry created successfully');
      return entry;
    } catch (error) {
      console.error('Failed to create journal entry:', error);
      set({
        isSavingEntry: false,
        journalError: error instanceof Error ? error.message : 'Failed to create journal entry',
      });
      throw error;
    }
  },

  getEntry: async (entryId) => {
    console.log(`📖 Fetching journal entry ${entryId}...`);
    set({ isLoadingEntry: true, journalError: null });

    try {
      const { getJournalEntry } = await import('../../handlers/journal');
      const entry = await getJournalEntry(entryId);

      set({
        currentEntry: entry,
        isLoadingEntry: false,
      });

      console.log('✅ Journal entry fetched successfully');
    } catch (error) {
      console.error('Failed to fetch journal entry:', error);
      set({
        isLoadingEntry: false,
        journalError: error instanceof Error ? error.message : 'Failed to fetch journal entry',
      });
    }
  },

  getEntries: async (filters?) => {
    console.log('📚 Fetching journal entries...');
    set({ isLoadingEntries: true, journalError: null });

    try {
      const { getJournalEntries } = await import('../../handlers/journal');
      const entries = await getJournalEntries(filters);

      set({
        journalEntries: entries,
        isLoadingEntries: false,
      });

      console.log(`✅ Fetched ${entries.length} journal entries`);
    } catch (error) {
      console.error('Failed to fetch journal entries:', error);
      set({
        isLoadingEntries: false,
        journalError: error instanceof Error ? error.message : 'Failed to fetch journal entries',
      });
    }
  },

  updateEntry: async (entryId, updates) => {
    console.log(`✏️ Updating journal entry ${entryId}...`);
    set({ isSavingEntry: true, journalError: null });

    try {
      const { updateJournalEntry } = await import('../../handlers/journal');
      const updatedEntry = await updateJournalEntry(entryId, updates);

      // Update in the list
      const updatedEntries = get().journalEntries.map((entry) =>
        entry.id === entryId ? updatedEntry : entry
      );

      set({
        currentEntry: updatedEntry,
        journalEntries: updatedEntries,
        isSavingEntry: false,
      });

      console.log('✅ Journal entry updated successfully');
    } catch (error) {
      console.error('Failed to update journal entry:', error);
      set({
        isSavingEntry: false,
        journalError: error instanceof Error ? error.message : 'Failed to update journal entry',
      });
    }
  },

  deleteEntry: async (entryId) => {
    console.log(`🗑️ Deleting journal entry ${entryId}...`);
    set({ isDeletingEntry: true, journalError: null });

    try {
      const { deleteJournalEntry } = await import('../../handlers/journal');
      await deleteJournalEntry(entryId);

      // Remove from the list
      const filteredEntries = get().journalEntries.filter((entry) => entry.id !== entryId);

      set({
        journalEntries: filteredEntries,
        currentEntry: get().currentEntry?.id === entryId ? null : get().currentEntry,
        isDeletingEntry: false,
      });

      console.log('✅ Journal entry deleted successfully');
    } catch (error) {
      console.error('Failed to delete journal entry:', error);
      set({
        isDeletingEntry: false,
        journalError: error instanceof Error ? error.message : 'Failed to delete journal entry',
      });
    }
  },

  clearCurrentEntry: () => {
    set({ currentEntry: null });
  },

  setJournalError: (error) => {
    set({ journalError: error });
  },
});
