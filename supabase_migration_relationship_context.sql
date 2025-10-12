-- Migration: Replace focus_area with relationship_context in synastry_readings
-- Description: Change from predefined categories to free-text relationship descriptions

-- Rename focus_area column to relationship_context
ALTER TABLE synastry_readings
  RENAME COLUMN focus_area TO relationship_context;

-- Update column comment to reflect new usage
COMMENT ON COLUMN synastry_readings.relationship_context IS 'Free-text description of relationship (e.g., "girlfriend", "coworker", "mom") instead of predefined categories';
