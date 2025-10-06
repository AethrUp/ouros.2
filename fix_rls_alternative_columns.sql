-- =====================================================
-- Fix Profile Creation RLS Issue
-- (Works with different possible column names)
-- =====================================================

-- FIX 1: Add service role policy for INSERT
-- This is the key fix - allows triggers to insert profiles
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;

CREATE POLICY "Service role can insert profiles"
    ON profiles FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Ensure authenticated users can still insert their own profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- =====================================================
-- FIX 2: Update the trigger function
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Try version 1: with display_name (underscore)
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
    WHEN undefined_column THEN
        -- If display_name doesn't exist, try displayname (no underscore)
        BEGIN
            INSERT INTO public.profiles (id, email, displayname, timezone, language)
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
            WHEN undefined_column THEN
                -- If that doesn't work either, try with just required columns
                BEGIN
                    INSERT INTO public.profiles (id, email)
                    VALUES (NEW.id, NEW.email)
                    ON CONFLICT (id) DO NOTHING;
                    RETURN NEW;
                EXCEPTION
                    WHEN OTHERS THEN
                        RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
                        RETURN NEW;
                END;
        END;
    WHEN OTHERS THEN
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
-- Manually create profiles for existing users
-- (Run this AFTER you know the correct column names)
-- =====================================================

-- OPTION A: If columns are: id, email, display_name, timezone, language
-- INSERT INTO public.profiles (id, email, display_name, timezone, language)
-- SELECT
--     au.id,
--     au.email,
--     COALESCE(au.raw_user_meta_data->>'display_name', SPLIT_PART(au.email, '@', 1)),
--     COALESCE(au.raw_user_meta_data->>'timezone', 'UTC'),
--     COALESCE(au.raw_user_meta_data->>'language', 'en')
-- FROM auth.users au
-- LEFT JOIN public.profiles p ON au.id = p.id
-- WHERE p.id IS NULL
-- ON CONFLICT (id) DO NOTHING;

-- OPTION B: If minimal columns (id, email only)
-- INSERT INTO public.profiles (id, email)
-- SELECT au.id, au.email
-- FROM auth.users au
-- LEFT JOIN public.profiles p ON au.id = p.id
-- WHERE p.id IS NULL
-- ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- Verify
-- =====================================================

SELECT
    COUNT(*) as total_users,
    COUNT(p.id) as users_with_profiles
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id;
