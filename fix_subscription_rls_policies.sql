-- Fix RLS Policies for Subscription System
-- This migration adds missing INSERT and UPDATE policies for authenticated users

-- =====================================================
-- FIX SUBSCRIPTION_STATE RLS POLICIES
-- =====================================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own subscription state" ON subscription_state;
DROP POLICY IF EXISTS "Users can update their own subscription state" ON subscription_state;

-- Allow users to insert their own subscription state (for initial creation)
CREATE POLICY "Users can insert their own subscription state"
  ON subscription_state FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own subscription state
CREATE POLICY "Users can update their own subscription state"
  ON subscription_state FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- FIX USAGE_TRACKING RLS POLICIES
-- =====================================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own usage tracking" ON usage_tracking;
DROP POLICY IF EXISTS "Users can update their own usage tracking" ON usage_tracking;

-- Allow users to insert their own usage tracking records
CREATE POLICY "Users can insert their own usage tracking"
  ON usage_tracking FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own usage tracking records
CREATE POLICY "Users can update their own usage tracking"
  ON usage_tracking FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- FIX SUBSCRIPTION_HISTORY RLS POLICIES & TRIGGER
-- =====================================================
-- The trigger function needs to run with elevated privileges
-- to insert into subscription_history, bypassing RLS

DROP FUNCTION IF EXISTS log_subscription_change() CASCADE;

CREATE OR REPLACE FUNCTION log_subscription_change()
RETURNS TRIGGER
SECURITY DEFINER -- This makes the function run with the privileges of the function owner (postgres)
SET search_path = public
AS $$
BEGIN
  INSERT INTO subscription_history (
    user_id,
    tier,
    status,
    platform,
    revenue_cat_id,
    expires_at,
    is_sandbox,
    change_reason
  ) VALUES (
    NEW.user_id,
    NEW.tier,
    NEW.status,
    NEW.platform,
    NEW.revenue_cat_id,
    NEW.expires_at,
    NEW.is_sandbox,
    CASE
      WHEN TG_OP = 'INSERT' THEN 'Initial subscription'
      WHEN OLD.tier != NEW.tier THEN 'Tier changed from ' || OLD.tier || ' to ' || NEW.tier
      WHEN OLD.status != NEW.status THEN 'Status changed from ' || OLD.status || ' to ' || NEW.status
      ELSE 'Subscription updated'
    END
  );
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Recreate the trigger
DROP TRIGGER IF EXISTS log_subscription_change_trigger ON subscription_state;
CREATE TRIGGER log_subscription_change_trigger
  AFTER INSERT OR UPDATE ON subscription_state
  FOR EACH ROW
  EXECUTE FUNCTION log_subscription_change();

-- =====================================================
-- VERIFICATION
-- =====================================================
-- You can verify the policies were created by running:
-- SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN ('subscription_state', 'usage_tracking', 'subscription_history')
-- ORDER BY tablename, policyname;
