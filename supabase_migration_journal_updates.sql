-- =====================================================
-- JOURNAL ENTRIES - Schema Updates
-- =====================================================
-- Adds title and entry_type fields to journal_entries table

-- Add title field (optional, defaults to "Journal Entry [date]")
ALTER TABLE journal_entries
ADD COLUMN IF NOT EXISTS title TEXT;

-- Add entry_type field with CHECK constraint
ALTER TABLE journal_entries
ADD COLUMN IF NOT EXISTS entry_type TEXT NOT NULL DEFAULT 'journal'
CHECK (entry_type IN ('iching', 'tarot', 'dream', 'journal', 'horoscope', 'synastry'));

-- Add comment for documentation
COMMENT ON COLUMN journal_entries.title IS 'Optional title for journal entry, defaults to "Journal Entry [date]"';
COMMENT ON COLUMN journal_entries.entry_type IS 'Type of journal entry: iching, tarot, dream, journal, horoscope, or synastry';
