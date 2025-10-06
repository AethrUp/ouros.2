-- =====================================================
-- Diagnose and Fix Profile Creation RLS Issue
-- =====================================================

-- STEP 1: Check if trigger exists
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- STEP 2: Check if function exists
SELECT
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines
WHERE routine_name = 'handle_new_user';

-- STEP 3: Check existing RLS policies on profiles
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- STEP 4: Check if there are users without profiles
SELECT
    au.id,
    au.email,
    au.created_at as user_created,
    p.id as profile_id,
    p.created_at as profile_created
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- =====================================================
-- FIX: Update the trigger function to bypass RLS
-- =====================================================

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate function with proper RLS bypass
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER -- Runs with function owner privileges
SET search_path = public
AS $$
BEGIN
    -- Insert profile bypassing RLS (function is SECURITY DEFINER)
    INSERT INTO public.profiles (id, email, display_name, timezone, language)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'timezone', 'UTC'),
        COALESCE(NEW.raw_user_meta_data->>'language', 'en')
    )
    ON CONFLICT (id) DO NOTHING; -- Prevent errors if profile already exists

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the user creation
        RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ALTERNATIVE FIX: Add a policy for service role
-- =====================================================

-- This allows the service role (used by triggers) to insert profiles
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;

CREATE POLICY "Service role can insert profiles"
    ON profiles FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Also ensure authenticated users can insert their own profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- =====================================================
-- STEP 5: Manually create profiles for existing users
-- =====================================================

-- This will create profiles for any users that don't have one
INSERT INTO public.profiles (id, email, display_name, timezone, language)
SELECT
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'display_name', SPLIT_PART(au.email, '@', 1)) as display_name,
    COALESCE(au.raw_user_meta_data->>'timezone', 'UTC') as timezone,
    COALESCE(au.raw_user_meta_data->>'language', 'en') as language
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STEP 6: Verify the fix
-- =====================================================

-- Check that all users now have profiles
SELECT
    COUNT(*) as total_users,
    COUNT(p.id) as users_with_profiles,
    COUNT(*) - COUNT(p.id) as users_without_profiles
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id;

-- List any remaining users without profiles
SELECT
    au.id,
    au.email,
    au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- =====================================================
-- END
-- =====================================================
