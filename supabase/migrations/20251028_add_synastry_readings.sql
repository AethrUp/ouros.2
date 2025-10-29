-- Migration: Create synastry_readings table for caching AI-generated synastry interpretations
-- Description: Stores synastry readings for both user connections and saved charts with RLS policies

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create synastry_readings table
CREATE TABLE IF NOT EXISTS synastry_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    synastry_chart_id UUID NOT NULL,

    -- Either connection_id OR saved_chart_id must be set (but not both)
    connection_id UUID,
    saved_chart_id UUID,

    -- Reading content
    interpretation TEXT NOT NULL,
    relationship_context TEXT,

    -- AI generation metadata
    ai_generated BOOLEAN NOT NULL DEFAULT false,
    model TEXT,
    prompt_version TEXT,

    -- Who saved this reading
    saved_by_user_id UUID NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT synastry_readings_reference_check
    CHECK (
        (connection_id IS NOT NULL AND saved_chart_id IS NULL) OR
        (connection_id IS NULL AND saved_chart_id IS NOT NULL)
    )
);

-- Add foreign key constraints if the referenced tables exist
-- Note: Checks for both table existence AND constraint existence
DO $$
BEGIN
    -- Add connection_id FK if connections table exists and constraint doesn't
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'connections')
       AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'synastry_readings_connection_id_fkey') THEN
        ALTER TABLE synastry_readings
        ADD CONSTRAINT synastry_readings_connection_id_fkey
        FOREIGN KEY (connection_id) REFERENCES connections(id) ON DELETE CASCADE;
    END IF;

    -- Add saved_chart_id FK if saved_charts table exists and constraint doesn't
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'saved_charts')
       AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'synastry_readings_saved_chart_id_fkey') THEN
        ALTER TABLE synastry_readings
        ADD CONSTRAINT synastry_readings_saved_chart_id_fkey
        FOREIGN KEY (saved_chart_id) REFERENCES saved_charts(id) ON DELETE CASCADE;
    END IF;

    -- Add saved_by_user_id FK if profiles table exists and constraint doesn't
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles')
       AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'synastry_readings_saved_by_user_id_fkey') THEN
        ALTER TABLE synastry_readings
        ADD CONSTRAINT synastry_readings_saved_by_user_id_fkey
        FOREIGN KEY (saved_by_user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    ELSIF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users')
          AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'synastry_readings_saved_by_user_id_fkey') THEN
        ALTER TABLE synastry_readings
        ADD CONSTRAINT synastry_readings_saved_by_user_id_fkey
        FOREIGN KEY (saved_by_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_synastry_readings_chart
ON synastry_readings(synastry_chart_id);

CREATE INDEX IF NOT EXISTS idx_synastry_readings_connection
ON synastry_readings(connection_id)
WHERE connection_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_synastry_readings_saved_chart
ON synastry_readings(saved_chart_id)
WHERE saved_chart_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_synastry_readings_user
ON synastry_readings(saved_by_user_id);

CREATE INDEX IF NOT EXISTS idx_synastry_readings_created_at
ON synastry_readings(created_at DESC);

-- Composite index for cache lookups
CREATE INDEX IF NOT EXISTS idx_synastry_readings_cache_lookup
ON synastry_readings(synastry_chart_id, relationship_context, created_at DESC);

-- Enable Row Level Security
ALTER TABLE synastry_readings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view synastry readings for their connections or saved charts
DROP POLICY IF EXISTS "Users can view relevant synastry readings" ON synastry_readings;

CREATE POLICY "Users can view relevant synastry readings"
  ON synastry_readings FOR SELECT
  USING (
    -- Can view readings for connections they're part of
    (connection_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM connections
      WHERE connections.id = synastry_readings.connection_id
      AND (connections.user1_id = auth.uid() OR connections.user2_id = auth.uid())
    ))
    OR
    -- Can view readings for their own saved charts
    (saved_chart_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM saved_charts
      WHERE saved_charts.id = synastry_readings.saved_chart_id
      AND saved_charts.user_id = auth.uid()
    ))
    OR
    -- Can view their own readings
    saved_by_user_id = auth.uid()
  );

-- RLS Policy: Users can create synastry readings
DROP POLICY IF EXISTS "Users can create synastry readings" ON synastry_readings;

CREATE POLICY "Users can create synastry readings"
  ON synastry_readings FOR INSERT
  WITH CHECK (
    auth.uid() = saved_by_user_id AND
    (
      -- For connection readings: must be part of the connection
      (connection_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM connections
        WHERE connections.id = connection_id
        AND (connections.user1_id = auth.uid() OR connections.user2_id = auth.uid())
      ))
      OR
      -- For saved chart readings: must own the saved chart
      (saved_chart_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM saved_charts
        WHERE saved_charts.id = saved_chart_id
        AND saved_charts.user_id = auth.uid()
      ))
      OR
      -- Allow if no FK constraints exist yet (for initial setup)
      NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name IN ('connections', 'saved_charts'))
    )
  );

-- RLS Policy: Users can delete their own synastry readings
DROP POLICY IF EXISTS "Users can delete own synastry readings" ON synastry_readings;

CREATE POLICY "Users can delete own synastry readings"
  ON synastry_readings FOR DELETE
  USING (auth.uid() = saved_by_user_id);

-- Add comments for documentation
COMMENT ON TABLE synastry_readings IS 'Saved synastry interpretations and readings generated by AI';
COMMENT ON COLUMN synastry_readings.synastry_chart_id IS 'Reference to the synastry chart this reading is for (stored as JSON or in separate table)';
COMMENT ON COLUMN synastry_readings.connection_id IS 'Connection ID for user-to-user synastry readings (null for saved chart synastry)';
COMMENT ON COLUMN synastry_readings.saved_chart_id IS 'Saved chart ID for user-to-saved-chart synastry readings (null for connection synastry)';
COMMENT ON COLUMN synastry_readings.relationship_context IS 'Free-text description of relationship (e.g., "girlfriend", "coworker", "mom")';
COMMENT ON COLUMN synastry_readings.interpretation IS 'The AI-generated synastry reading text';
COMMENT ON COLUMN synastry_readings.ai_generated IS 'Whether this reading was generated by AI';
COMMENT ON COLUMN synastry_readings.model IS 'AI model used (e.g., "claude-sonnet-4-20250514")';
COMMENT ON COLUMN synastry_readings.prompt_version IS 'Version of the prompt template used';
