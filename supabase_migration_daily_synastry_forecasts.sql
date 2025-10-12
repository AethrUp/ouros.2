-- Migration: Daily Synastry Forecasts
-- Description: Stores daily relationship forecasts based on transits affecting synastry charts
-- Date: 2025-10-09

-- Create daily_synastry_forecasts table
CREATE TABLE IF NOT EXISTS daily_synastry_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  synastry_chart_id UUID NOT NULL REFERENCES synastry_charts(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Relationship reference
  connection_id UUID REFERENCES connections(id) ON DELETE CASCADE,
  saved_chart_id UUID REFERENCES saved_charts(id) ON DELETE CASCADE,

  -- People names (for quick access)
  person1_name TEXT NOT NULL,
  person2_name TEXT NOT NULL,

  -- Transit data (JSONB for flexibility)
  person1_transits JSONB NOT NULL,
  person2_transits JSONB NOT NULL,
  current_positions JSONB NOT NULL,
  triggered_aspects JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Preview content
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  energy_rating TEXT NOT NULL CHECK (energy_rating IN ('harmonious', 'intense', 'challenging', 'transformative')),
  top_theme TEXT NOT NULL,

  -- Full forecast content
  morning_forecast TEXT NOT NULL,
  afternoon_forecast TEXT NOT NULL,
  evening_forecast TEXT NOT NULL,
  advice JSONB NOT NULL DEFAULT '[]'::jsonb,
  activities_suggested JSONB NOT NULL DEFAULT '[]'::jsonb,
  activities_to_avoid JSONB NOT NULL DEFAULT '[]'::jsonb,
  transit_analysis TEXT,

  -- Metadata
  has_full_forecast BOOLEAN NOT NULL DEFAULT true,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  model TEXT,
  prompt_version TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_synastry_date UNIQUE(synastry_chart_id, date),
  CONSTRAINT check_connection_or_saved CHECK (
    (connection_id IS NOT NULL AND saved_chart_id IS NULL) OR
    (connection_id IS NULL AND saved_chart_id IS NOT NULL)
  )
);

-- Create indexes for efficient queries
CREATE INDEX idx_daily_synastry_forecasts_synastry_chart ON daily_synastry_forecasts(synastry_chart_id);
CREATE INDEX idx_daily_synastry_forecasts_date ON daily_synastry_forecasts(date);
CREATE INDEX idx_daily_synastry_forecasts_connection ON daily_synastry_forecasts(connection_id) WHERE connection_id IS NOT NULL;
CREATE INDEX idx_daily_synastry_forecasts_saved_chart ON daily_synastry_forecasts(saved_chart_id) WHERE saved_chart_id IS NOT NULL;
CREATE INDEX idx_daily_synastry_forecasts_generated_at ON daily_synastry_forecasts(generated_at);

-- Add RLS policies
ALTER TABLE daily_synastry_forecasts ENABLE ROW LEVEL SECURITY;

-- Users can read forecasts for their own synastry charts
CREATE POLICY "Users can read own synastry forecasts"
  ON daily_synastry_forecasts
  FOR SELECT
  USING (
    synastry_chart_id IN (
      SELECT id FROM synastry_charts WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

-- Users can insert/update forecasts for their own synastry charts
CREATE POLICY "Users can insert own synastry forecasts"
  ON daily_synastry_forecasts
  FOR INSERT
  WITH CHECK (
    synastry_chart_id IN (
      SELECT id FROM synastry_charts WHERE user1_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own synastry forecasts"
  ON daily_synastry_forecasts
  FOR UPDATE
  USING (
    synastry_chart_id IN (
      SELECT id FROM synastry_charts WHERE user1_id = auth.uid()
    )
  );

-- Users can delete their own synastry forecasts
CREATE POLICY "Users can delete own synastry forecasts"
  ON daily_synastry_forecasts
  FOR DELETE
  USING (
    synastry_chart_id IN (
      SELECT id FROM synastry_charts WHERE user1_id = auth.uid()
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_daily_synastry_forecasts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_daily_synastry_forecasts_updated_at
  BEFORE UPDATE ON daily_synastry_forecasts
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_synastry_forecasts_updated_at();

-- Add comment to table
COMMENT ON TABLE daily_synastry_forecasts IS 'Daily relationship forecasts based on current transits affecting synastry charts';
