-- Check the profile data for your user
SELECT
    id,
    email,
    display_name,
    timezone,
    language,
    created_at,
    updated_at
FROM profiles
WHERE email = 'joe.ramirez0@gmail.com';

-- Check if there's birth data
SELECT *
FROM birth_data
WHERE user_id = '4c83a912-8eac-466d-8d3b-6fc18fec1397';

-- Check if there's a natal chart
SELECT
    user_id,
    house_system,
    calculated_at,
    planets IS NOT NULL as has_planets,
    houses IS NOT NULL as has_houses,
    aspects IS NOT NULL as has_aspects
FROM natal_charts
WHERE user_id = '4c83a912-8eac-466d-8d3b-6fc18fec1397';

-- Check if there are any daily horoscopes
SELECT
    date,
    title,
    has_full_reading,
    last_updated
FROM daily_horoscopes
WHERE user_id = '4c83a912-8eac-466d-8d3b-6fc18fec1397'
ORDER BY date DESC
LIMIT 5;

-- Check what tables actually exist for readings
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE '%reading%'
OR tablename LIKE '%horoscope%';
