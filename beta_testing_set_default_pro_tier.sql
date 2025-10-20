-- TEMPORARY: Set default tier to 'pro' for beta testing
-- TODO: Revert to 'free' before production launch
--
-- To revert after beta testing, run:
-- ALTER TABLE subscription_state ALTER COLUMN tier SET DEFAULT 'free';

ALTER TABLE subscription_state ALTER COLUMN tier SET DEFAULT 'pro';
