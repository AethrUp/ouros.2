-- Migration: Add Dream Readings Table
-- Date: 2025-10-28
-- Description: Creates dream_readings table for AI-powered dream interpretation feature

-- Create dream_readings table
CREATE TABLE IF NOT EXISTS dream_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    dream_description TEXT NOT NULL,
    interpretation TEXT NOT NULL,

    -- Optional metadata for future features
    interpretation_style TEXT CHECK (interpretation_style IN ('psychological', 'spiritual', 'practical')),
    detail_level TEXT CHECK (detail_level IN ('brief', 'detailed', 'comprehensive')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for quick user lookups
CREATE INDEX IF NOT EXISTS idx_dream_readings_user_created ON dream_readings(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE dream_readings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can manage their own dream readings
CREATE POLICY "Users can manage own dream readings"
    ON dream_readings FOR ALL
    USING (auth.uid() = user_id);

-- Add updated_at trigger (reusing the existing function from main schema)
CREATE TRIGGER update_dream_readings_updated_at
    BEFORE UPDATE ON dream_readings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE dream_readings IS 'AI-generated dream interpretations for users';
