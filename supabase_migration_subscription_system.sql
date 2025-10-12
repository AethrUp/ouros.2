-- Subscription System Migration
-- This migration creates the tables and functions needed for the subscription system

-- =====================================================
-- SUBSCRIPTION STATE TABLE
-- =====================================================
-- This is the source of truth for user subscription status
CREATE TABLE IF NOT EXISTS subscription_state (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'premium', 'pro')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trial', 'expired', 'cancelled', 'grace_period', 'paused')),
  platform TEXT CHECK (platform IN ('ios', 'android', 'manual')),
  revenue_cat_id TEXT,
  expires_at TIMESTAMPTZ,
  is_sandbox BOOLEAN DEFAULT false,
  is_debug_override BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscription_state_user_id ON subscription_state(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_state_tier ON subscription_state(tier);
CREATE INDEX IF NOT EXISTS idx_subscription_state_status ON subscription_state(status);
CREATE INDEX IF NOT EXISTS idx_subscription_state_expires_at ON subscription_state(expires_at);

-- Add RLS policies
ALTER TABLE subscription_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription state"
  ON subscription_state FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscription states"
  ON subscription_state FOR ALL
  USING (auth.role() = 'service_role');

-- =====================================================
-- SUBSCRIPTION HISTORY TABLE
-- =====================================================
-- Tracks all subscription changes for audit trail
CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL,
  status TEXT NOT NULL,
  platform TEXT,
  revenue_cat_id TEXT,
  expires_at TIMESTAMPTZ,
  is_sandbox BOOLEAN DEFAULT false,
  change_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id ON subscription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_created_at ON subscription_history(created_at);

-- Add RLS policies
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription history"
  ON subscription_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscription history"
  ON subscription_history FOR ALL
  USING (auth.role() = 'service_role');

-- =====================================================
-- USAGE TRACKING TABLE
-- =====================================================
-- Tracks feature usage for enforcing limits
CREATE TABLE IF NOT EXISTS usage_tracking (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL CHECK (feature IN ('tarot', 'iching', 'dream', 'synastry', 'journal')),
  count INTEGER NOT NULL DEFAULT 0,
  period TEXT NOT NULL CHECK (period IN ('daily', 'monthly')),
  period_start TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, feature, period, period_start)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_period_start ON usage_tracking(period_start);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_feature ON usage_tracking(feature);

-- Add RLS policies
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage tracking"
  ON usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all usage tracking"
  ON usage_tracking FOR ALL
  USING (auth.role() = 'service_role');

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for subscription_state
DROP TRIGGER IF EXISTS update_subscription_state_updated_at ON subscription_state;
CREATE TRIGGER update_subscription_state_updated_at
  BEFORE UPDATE ON subscription_state
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for usage_tracking
DROP TRIGGER IF EXISTS update_usage_tracking_updated_at ON usage_tracking;
CREATE TRIGGER update_usage_tracking_updated_at
  BEFORE UPDATE ON usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to log subscription changes to history
CREATE OR REPLACE FUNCTION log_subscription_change()
RETURNS TRIGGER AS $$
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

-- Trigger to log subscription changes
DROP TRIGGER IF EXISTS log_subscription_change_trigger ON subscription_state;
CREATE TRIGGER log_subscription_change_trigger
  AFTER INSERT OR UPDATE ON subscription_state
  FOR EACH ROW
  EXECUTE FUNCTION log_subscription_change();

-- Function to get current period start for usage tracking
CREATE OR REPLACE FUNCTION get_period_start(period_type TEXT)
RETURNS TIMESTAMPTZ AS $$
BEGIN
  CASE period_type
    WHEN 'daily' THEN
      RETURN DATE_TRUNC('day', NOW());
    WHEN 'monthly' THEN
      RETURN DATE_TRUNC('month', NOW());
    ELSE
      RAISE EXCEPTION 'Invalid period type: %', period_type;
  END CASE;
END;
$$ language 'plpgsql';

-- Function to increment usage count
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_feature TEXT,
  p_period TEXT DEFAULT 'daily'
)
RETURNS INTEGER AS $$
DECLARE
  v_period_start TIMESTAMPTZ;
  v_new_count INTEGER;
BEGIN
  v_period_start := get_period_start(p_period);

  INSERT INTO usage_tracking (user_id, feature, count, period, period_start)
  VALUES (p_user_id, p_feature, 1, p_period, v_period_start)
  ON CONFLICT (user_id, feature, period, period_start)
  DO UPDATE SET
    count = usage_tracking.count + 1,
    updated_at = NOW()
  RETURNING count INTO v_new_count;

  RETURN v_new_count;
END;
$$ language 'plpgsql';

-- Function to get usage count for a feature
CREATE OR REPLACE FUNCTION get_usage_count(
  p_user_id UUID,
  p_feature TEXT,
  p_period TEXT DEFAULT 'daily'
)
RETURNS INTEGER AS $$
DECLARE
  v_period_start TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  v_period_start := get_period_start(p_period);

  SELECT count INTO v_count
  FROM usage_tracking
  WHERE user_id = p_user_id
    AND feature = p_feature
    AND period = p_period
    AND period_start = v_period_start;

  RETURN COALESCE(v_count, 0);
END;
$$ language 'plpgsql';

-- Function to reset usage for all users (called by cron job)
CREATE OR REPLACE FUNCTION reset_expired_usage()
RETURNS void AS $$
BEGIN
  -- Delete daily usage older than 2 days
  DELETE FROM usage_tracking
  WHERE period = 'daily'
    AND period_start < DATE_TRUNC('day', NOW() - INTERVAL '2 days');

  -- Delete monthly usage older than 2 months
  DELETE FROM usage_tracking
  WHERE period = 'monthly'
    AND period_start < DATE_TRUNC('month', NOW() - INTERVAL '2 months');
END;
$$ language 'plpgsql';

-- Function to check if user has access to a feature
CREATE OR REPLACE FUNCTION check_feature_access(
  p_user_id UUID,
  p_feature TEXT,
  p_tier TEXT,
  p_period TEXT DEFAULT 'daily'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_usage_count INTEGER;
  v_limit INTEGER;
BEGIN
  -- Get current usage count
  v_usage_count := get_usage_count(p_user_id, p_feature, p_period);

  -- Determine limit based on tier and feature
  CASE p_tier
    WHEN 'free' THEN
      CASE p_feature
        WHEN 'tarot', 'iching' THEN v_limit := 1;
        WHEN 'dream', 'synastry' THEN RETURN false; -- Not available
        WHEN 'journal' THEN
          IF p_period = 'monthly' THEN
            v_limit := 5;
          ELSE
            RETURN true; -- No daily limit on journal for free
          END IF;
        ELSE
          RETURN false;
      END CASE;
    WHEN 'premium' THEN
      CASE p_feature
        WHEN 'synastry' THEN
          -- Premium has limit of 3 saved charts (not enforced here)
          RETURN true;
        ELSE
          RETURN true; -- Unlimited for other features
      END CASE;
    WHEN 'pro' THEN
      RETURN true; -- Unlimited for everything
    ELSE
      RETURN false;
  END CASE;

  -- Check if under limit
  RETURN v_usage_count < v_limit;
END;
$$ language 'plpgsql';

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Create default subscription state for existing users
INSERT INTO subscription_state (user_id, tier, status)
SELECT id, 'free', 'active'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM subscription_state)
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE subscription_state IS 'Current subscription state for each user. This is the source of truth.';
COMMENT ON TABLE subscription_history IS 'Audit log of all subscription changes.';
COMMENT ON TABLE usage_tracking IS 'Tracks feature usage for enforcing limits on free tier.';
COMMENT ON FUNCTION increment_usage IS 'Increments usage count for a feature. Returns new count.';
COMMENT ON FUNCTION get_usage_count IS 'Gets current usage count for a feature in the current period.';
COMMENT ON FUNCTION check_feature_access IS 'Checks if user has access to a feature based on tier and usage.';
COMMENT ON FUNCTION reset_expired_usage IS 'Cleans up old usage tracking data. Should be called daily by cron.';
