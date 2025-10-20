-- Migration: Daily Synastry Forecasts V2 Format Support
-- Description: Adds V2 structured format support while maintaining V1 backward compatibility
-- Date: 2025-10-16

-- Step 1: Add format_version column
-- Default to 'v1' for all existing rows
ALTER TABLE daily_synastry_forecasts
  ADD COLUMN format_version TEXT NOT NULL DEFAULT 'v1';

-- Step 2: Add full_content_v2 column for structured V2 data
ALTER TABLE daily_synastry_forecasts
  ADD COLUMN full_content_v2 JSONB;

-- Step 3: Make V1-specific fields nullable
-- These will be NULL for V2 forecasts
ALTER TABLE daily_synastry_forecasts
  ALTER COLUMN morning_forecast DROP NOT NULL,
  ALTER COLUMN afternoon_forecast DROP NOT NULL,
  ALTER COLUMN evening_forecast DROP NOT NULL;

-- Step 4: Add constraints
ALTER TABLE daily_synastry_forecasts
  ADD CONSTRAINT check_format_version CHECK (format_version IN ('v1', 'v2'));

-- Step 5: Add indexes for V2 queries
CREATE INDEX idx_daily_synastry_forecasts_format_version
  ON daily_synastry_forecasts(format_version);

-- Step 6: Create index on full_content_v2 JSONB for efficient queries
CREATE INDEX idx_daily_synastry_forecasts_v2_content
  ON daily_synastry_forecasts USING GIN (full_content_v2);

-- Add comments
COMMENT ON COLUMN daily_synastry_forecasts.format_version IS 'Format version: v1 (legacy flat fields) or v2 (structured JSONB)';
COMMENT ON COLUMN daily_synastry_forecasts.full_content_v2 IS 'V2 structured forecast content with timeBasedForecasts, transitAnalysis, relationshipInsights, guidance, connectionPractice, and conclusion';

-- Note: V1 forecasts continue to use:
--   - morning_forecast, afternoon_forecast, evening_forecast (TEXT)
--   - advice, activities_suggested, activities_to_avoid (JSONB arrays)
--   - transit_analysis (TEXT)
--
-- V2 forecasts use:
--   - full_content_v2 (JSONB) containing the entire structured V2 response
--   - V1 fields will be NULL for V2 forecasts
--
-- Preview fields (title, summary, energy_rating, top_theme) are used by both formats
