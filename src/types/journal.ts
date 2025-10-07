// Journal Entry Types

export type JournalEntryType = 'iching' | 'tarot' | 'dream' | 'journal' | 'horoscope' | 'synastry';

export interface LinkedReading {
  id: string;
  reading_type: 'tarot' | 'iching' | 'horoscope' | 'synastry';
  title?: string;
  timestamp: string; // ISO timestamp
  interpretation: string;
  intention?: string;
  metadata?: any;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  title?: string; // Optional, defaults to "Journal Entry [date]"
  date: string; // ISO timestamp
  entry_type: JournalEntryType;
  content: string;

  // Optional fields
  mood?: number; // 1-5 scale
  energy?: number; // 1-5 scale
  tags?: string[];

  // Linked reading
  linked_reading_id?: string;
  linked_reading?: LinkedReading; // Populated when fetching with join

  is_private: boolean;

  created_at: string;
  updated_at: string;
}

export interface CreateJournalEntryInput {
  title?: string;
  date?: string; // Optional, defaults to now
  entry_type: JournalEntryType;
  content: string;
  mood?: number;
  energy?: number;
  tags?: string[];
  linked_reading_id?: string;
  is_private?: boolean;
}

export interface UpdateJournalEntryInput {
  title?: string;
  date?: string;
  entry_type?: JournalEntryType;
  content?: string;
  mood?: number;
  energy?: number;
  tags?: string[];
  linked_reading_id?: string;
  is_private?: boolean;
}

export interface JournalEntryFilters {
  entry_type?: JournalEntryType;
  start_date?: string;
  end_date?: string;
  tags?: string[];
  has_linked_reading?: boolean;
}
