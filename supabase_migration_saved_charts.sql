-- Migration: Add saved_charts table for non-user charts
-- Description: Allows users to create and save natal charts for people who are not app users
-- for use in synastry readings

-- Create saved_charts table
CREATE TABLE IF NOT EXISTS saved_charts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT,
  birth_data JSONB NOT NULL,
  natal_chart_data JSONB NOT NULL,
  is_public BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_saved_charts_user_id ON saved_charts(user_id);

-- Add index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_saved_charts_created_at ON saved_charts(created_at DESC);

-- Enable Row Level Security
ALTER TABLE saved_charts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved_charts
-- Users can only see their own saved charts
CREATE POLICY "Users can view their own saved charts"
  ON saved_charts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own saved charts
CREATE POLICY "Users can create their own saved charts"
  ON saved_charts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own saved charts
CREATE POLICY "Users can update their own saved charts"
  ON saved_charts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own saved charts
CREATE POLICY "Users can delete their own saved charts"
  ON saved_charts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Update synastry_charts table to support saved charts
-- Add optional reference to saved_charts
ALTER TABLE synastry_charts
  ADD COLUMN IF NOT EXISTS saved_chart_id UUID REFERENCES saved_charts(id) ON DELETE CASCADE;

-- Make user2_id nullable to support saved charts
ALTER TABLE synastry_charts
  ALTER COLUMN user2_id DROP NOT NULL;

-- Add constraint: either user2_id OR saved_chart_id must be set (but not both)
ALTER TABLE synastry_charts
  ADD CONSTRAINT synastry_charts_partner_check
  CHECK (
    (user2_id IS NOT NULL AND saved_chart_id IS NULL) OR
    (user2_id IS NULL AND saved_chart_id IS NOT NULL)
  );

-- Add index on saved_chart_id for joins
CREATE INDEX IF NOT EXISTS idx_synastry_charts_saved_chart_id ON synastry_charts(saved_chart_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_saved_charts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on saved_charts
CREATE TRIGGER update_saved_charts_timestamp
  BEFORE UPDATE ON saved_charts
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_charts_updated_at();

COMMENT ON TABLE saved_charts IS 'Stores natal charts for non-users, allowing synastry readings with people who are not app users';
COMMENT ON COLUMN saved_charts.user_id IS 'The user who created/owns this saved chart';
COMMENT ON COLUMN saved_charts.name IS 'Display name for the person this chart represents';
COMMENT ON COLUMN saved_charts.relationship IS 'Optional relationship label (e.g., Partner, Friend, Ex)';
COMMENT ON COLUMN saved_charts.birth_data IS 'Birth date, time, and location information';
COMMENT ON COLUMN saved_charts.natal_chart_data IS 'Calculated natal chart data (planets, houses, aspects)';
COMMENT ON COLUMN saved_charts.is_public IS 'Whether this chart can be shared with connections (future feature)';
COMMENT ON COLUMN saved_charts.notes IS 'Optional personal notes about this person/chart';
