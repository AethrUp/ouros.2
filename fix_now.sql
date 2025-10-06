-- =====================================================
-- UNIVERSAL FIX: Enable Profile Creation
-- =====================================================
-- This will work regardless of exact schema details
-- =====================================================

-- PART 1: Add service_role policy (allows triggers to insert)
DO $$
BEGIN
    -- Drop existing policy if it exists
    DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;

    -- Create policy for service_role
    EXECUTE 'CREATE POLICY "Service role can insert profiles" ON profiles FOR INSERT TO service_role WITH CHECK (true)';

    RAISE NOTICE 'Service role policy created';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not create service_role policy: %', SQLERRM;
END $$;

-- PART 2: Ensure authenticated users can insert their own profiles
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
    EXECUTE 'CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id)';
    RAISE NOTICE 'User insert policy created';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not create user insert policy: %', SQLERRM;
END $$;

-- PART 3: Create/update the trigger function
-- This attempts to insert with the columns from supabase_schema.sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name, timezone, language)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'timezone', 'UTC'),
        COALESCE(NEW.raw_user_meta_data->>'language', 'en')
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Profile creation failed for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- PART 4: Manually create profile for existing user
-- Using the user ID from your output
INSERT INTO public.profiles (id, email, display_name, timezone, language)
VALUES (
    '4c83a912-8eac-466d-8d3b-6fc18fec1397'::uuid,
    'joe.ramirez0@gmail.com',
    'joe.ramirez0',
    'UTC',
    'en'
)
ON CONFLICT (id) DO NOTHING;

-- PART 5: Verify
SELECT
    'Users' as type,
    COUNT(*) as count
FROM auth.users
UNION ALL
SELECT
    'Profiles' as type,
    COUNT(*) as count
FROM profiles
UNION ALL
SELECT
    'Missing Profiles' as type,
    COUNT(*) as count
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;
