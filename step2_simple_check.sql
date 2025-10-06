-- Run each of these queries ONE AT A TIME and paste results

-- Query 1: What columns does profiles table have?
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Query 2: Does the table even exist?
SELECT EXISTS(SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles');

-- Query 3: What tables DO exist?
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
