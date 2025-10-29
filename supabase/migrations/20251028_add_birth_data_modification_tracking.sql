-- =====================================================
-- Birth Data Modification Tracking
-- =====================================================
-- Purpose: Prevent abuse of birth data changes which trigger
-- expensive AI regeneration of natal charts and horoscopes
--
-- Strategy:
-- - Track number of modifications per user
-- - Enforce cooldown period between changes
-- - Tier-based limits (enforced in application logic)
-- =====================================================

-- Add modification tracking columns to birth_data table
ALTER TABLE birth_data
ADD COLUMN IF NOT EXISTS modification_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_modified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS can_modify_at TIMESTAMPTZ;

-- Create index for efficient rate limit checking
CREATE INDEX IF NOT EXISTS idx_birth_data_modification_tracking
ON birth_data(user_id, modification_count, can_modify_at);

-- Add helpful comments for documentation
COMMENT ON COLUMN birth_data.modification_count IS
'Total number of times birth data has been modified. Used for analytics and tier limit enforcement.';

COMMENT ON COLUMN birth_data.last_modified_at IS
'Timestamp of the last modification. Used for audit trail and user display.';

COMMENT ON COLUMN birth_data.can_modify_at IS
'Earliest timestamp when the next modification is allowed. NULL means can modify anytime. Used for rate limiting enforcement.';

-- =====================================================
-- Update existing records to have valid initial state
-- =====================================================

-- Set modification_count to 0 for existing records (they were created, not modified)
UPDATE birth_data
SET modification_count = 0
WHERE modification_count IS NULL;

-- Set last_modified_at to created_at for existing records
UPDATE birth_data
SET last_modified_at = created_at
WHERE last_modified_at IS NULL;

-- Leave can_modify_at as NULL for existing records (they can modify anytime)
-- This gives existing users a grace period

-- =====================================================
-- Function to update modification tracking
-- =====================================================

-- Create a function to handle modification tracking updates
-- This ensures consistent behavior and can be called from triggers or app code
CREATE OR REPLACE FUNCTION update_birth_data_modification_tracking(
    p_user_id UUID,
    p_cooldown_days INTEGER
) RETURNS void AS $$
BEGIN
    UPDATE birth_data
    SET
        modification_count = modification_count + 1,
        last_modified_at = NOW(),
        can_modify_at = NOW() + (p_cooldown_days || ' days')::INTERVAL,
        updated_at = NOW()
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION update_birth_data_modification_tracking IS
'Updates modification tracking fields when birth data is changed. Called by application after successful update.';

-- =====================================================
-- Function to check if modification is allowed
-- =====================================================

-- Create a function to check if user can modify birth data
-- Returns a record with allowed (boolean) and reason (text)
CREATE OR REPLACE FUNCTION check_birth_data_modification_allowed(
    p_user_id UUID
) RETURNS TABLE(allowed BOOLEAN, reason TEXT, days_remaining INTEGER) AS $$
DECLARE
    v_can_modify_at TIMESTAMPTZ;
    v_days_remaining INTEGER;
BEGIN
    -- Get the can_modify_at timestamp
    SELECT bd.can_modify_at INTO v_can_modify_at
    FROM birth_data bd
    WHERE bd.user_id = p_user_id;

    -- If no birth data exists, return not allowed
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'No birth data found'::TEXT, 0;
        RETURN;
    END IF;

    -- If can_modify_at is NULL, user can modify
    IF v_can_modify_at IS NULL THEN
        RETURN QUERY SELECT true, 'Modification allowed'::TEXT, 0;
        RETURN;
    END IF;

    -- Check if cooldown period has passed
    IF NOW() >= v_can_modify_at THEN
        RETURN QUERY SELECT true, 'Modification allowed'::TEXT, 0;
        RETURN;
    ELSE
        -- Calculate days remaining
        v_days_remaining := CEIL(EXTRACT(EPOCH FROM (v_can_modify_at - NOW())) / 86400)::INTEGER;
        RETURN QUERY SELECT
            false,
            'Cooldown period not expired'::TEXT,
            v_days_remaining;
        RETURN;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION check_birth_data_modification_allowed IS
'Checks if a user is allowed to modify their birth data based on cooldown period. Returns allowed status, reason, and days remaining.';

-- =====================================================
-- Grant permissions
-- =====================================================

-- Grant execute permission on functions to authenticated users
GRANT EXECUTE ON FUNCTION update_birth_data_modification_tracking(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION check_birth_data_modification_allowed(UUID) TO authenticated;
