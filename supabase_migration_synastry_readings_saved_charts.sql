-- Migration: Update synastry_readings to support saved charts
-- Description: Allows synastry readings for both user connections and saved charts

-- Make connection_id nullable (saved charts don't have connections)
ALTER TABLE synastry_readings
  ALTER COLUMN connection_id DROP NOT NULL;

-- Add saved_chart_id reference for synastry with saved charts
ALTER TABLE synastry_readings
  ADD COLUMN IF NOT EXISTS saved_chart_id UUID REFERENCES saved_charts(id) ON DELETE CASCADE;

-- Add constraint: either connection_id OR saved_chart_id must be set (but not both, not neither)
ALTER TABLE synastry_readings
  DROP CONSTRAINT IF EXISTS synastry_readings_reference_check;

ALTER TABLE synastry_readings
  ADD CONSTRAINT synastry_readings_reference_check
  CHECK (
    (connection_id IS NOT NULL AND saved_chart_id IS NULL) OR
    (connection_id IS NULL AND saved_chart_id IS NOT NULL)
  );

-- Add index on saved_chart_id for queries
CREATE INDEX IF NOT EXISTS idx_synastry_readings_saved_chart ON synastry_readings(saved_chart_id);

-- Update RLS policy to allow viewing readings for saved charts
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
  );

-- Update insert policy to support saved charts
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
    )
  );

COMMENT ON COLUMN synastry_readings.connection_id IS 'Connection ID for user-to-user synastry readings (null for saved chart synastry)';
COMMENT ON COLUMN synastry_readings.saved_chart_id IS 'Saved chart ID for user-to-saved-chart synastry readings (null for connection synastry)';
