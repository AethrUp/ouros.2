-- =====================================================
-- OUROS2 - Astrology App Database Schema
-- =====================================================
-- This schema supports:
-- - User authentication & profiles
-- - Birth data & natal charts
-- - Daily horoscopes (personalized per user)
-- - Reading history (tarot, I Ching, horoscopes)
-- - Journal entries & mood tracking
-- - AI interpretation caching
-- - Image asset tracking
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS & AUTHENTICATION
-- =====================================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    avatar TEXT,
    timezone TEXT NOT NULL DEFAULT 'UTC',
    language TEXT NOT NULL DEFAULT 'en',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User preferences
CREATE TABLE user_preferences (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,

    -- Reading preferences
    interpretation_style TEXT NOT NULL DEFAULT 'psychological' CHECK (interpretation_style IN ('mystical', 'psychological', 'practical')),
    detail_level TEXT NOT NULL DEFAULT 'detailed' CHECK (detail_level IN ('brief', 'detailed', 'comprehensive')),
    focus_areas TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- UI preferences
    theme TEXT NOT NULL DEFAULT 'auto' CHECK (theme IN ('light', 'dark', 'auto')),
    selected_deck TEXT NOT NULL DEFAULT 'rider-waite',
    house_system TEXT NOT NULL DEFAULT 'placidus' CHECK (house_system IN ('placidus', 'whole-sign', 'equal', 'koch', 'campanus')),

    -- Notification preferences
    daily_horoscope BOOLEAN NOT NULL DEFAULT true,
    reading_reminders BOOLEAN NOT NULL DEFAULT true,
    journal_prompts BOOLEAN NOT NULL DEFAULT true,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- BIRTH DATA & NATAL CHARTS
-- =====================================================

-- Birth data
CREATE TABLE birth_data (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    birth_date DATE NOT NULL,
    birth_time TIME,
    time_unknown BOOLEAN NOT NULL DEFAULT false,

    -- Location data
    location_name TEXT NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    location_timezone TEXT NOT NULL,
    country TEXT NOT NULL,
    region TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Natal charts (cached calculations)
CREATE TABLE natal_charts (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,

    -- Chart data (stored as JSONB for flexibility)
    planets JSONB NOT NULL,
    houses JSONB NOT NULL,
    aspects JSONB NOT NULL,
    angles JSONB NOT NULL,

    -- Metadata
    house_system TEXT NOT NULL,
    calculation_method TEXT NOT NULL,
    precision TEXT NOT NULL,
    data_source TEXT NOT NULL,
    version TEXT NOT NULL DEFAULT '1.0',

    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- DAILY HOROSCOPES
-- =====================================================

-- Daily horoscopes (personalized per user)
CREATE TABLE daily_horoscopes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,

    -- Preview content (lightweight for home screen)
    title TEXT NOT NULL,
    summary TEXT NOT NULL,

    -- Weather indicators
    weather_moon TEXT NOT NULL,
    weather_venus TEXT NOT NULL,
    weather_mercury TEXT NOT NULL,

    -- Category advice (stored as JSONB)
    category_advice JSONB NOT NULL DEFAULT '{}'::JSONB,

    -- Full content (loaded on demand)
    full_reading JSONB,
    transit_analysis JSONB,
    time_guidance JSONB,
    spiritual_guidance JSONB,
    transit_insights TEXT[],
    astronomical_data JSONB,

    -- Additional fields
    explore TEXT[],
    limitations TEXT[],
    daily_focus TEXT,
    advice TEXT,

    has_full_reading BOOLEAN NOT NULL DEFAULT false,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Prevent duplicate horoscopes per user per day
    UNIQUE(user_id, date)
);

-- Index for quick date lookups
CREATE INDEX idx_daily_horoscopes_user_date ON daily_horoscopes(user_id, date DESC);

-- Cosmic weather (can be shared or per-user)
CREATE TABLE cosmic_weather (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,

    moon JSONB NOT NULL,
    venus JSONB NOT NULL,
    mercury JSONB NOT NULL,

    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, date)
);

-- Generation metadata for tracking AI usage
CREATE TABLE horoscope_generation_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    horoscope_id UUID NOT NULL REFERENCES daily_horoscopes(id) ON DELETE CASCADE,

    source TEXT NOT NULL DEFAULT 'anthropic_ai',
    model TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Token usage
    input_tokens INTEGER NOT NULL,
    output_tokens INTEGER NOT NULL,
    total_tokens INTEGER NOT NULL,

    -- Data quality metrics
    astrology_api_used BOOLEAN NOT NULL DEFAULT false,
    transit_count INTEGER NOT NULL DEFAULT 0,
    significant_transits INTEGER NOT NULL DEFAULT 0,
    confidence TEXT NOT NULL CHECK (confidence IN ('low', 'medium', 'high', 'very_high')),
    has_expanded_content BOOLEAN NOT NULL DEFAULT false
);

-- =====================================================
-- READINGS (Tarot, I Ching, etc.)
-- =====================================================

-- Reading history
CREATE TABLE readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    reading_type TEXT NOT NULL CHECK (reading_type IN ('tarot', 'iching', 'horoscope', 'synastry')),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    intention TEXT,
    interpretation TEXT NOT NULL,

    -- Type-specific metadata (stored as JSONB)
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,

    is_favorite BOOLEAN NOT NULL DEFAULT false,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick user reading lookups
CREATE INDEX idx_readings_user_timestamp ON readings(user_id, timestamp DESC);
CREATE INDEX idx_readings_type ON readings(reading_type);
CREATE INDEX idx_readings_favorites ON readings(user_id, is_favorite) WHERE is_favorite = true;

-- =====================================================
-- JOURNAL & MOOD TRACKING
-- =====================================================

-- Journal entries
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    content TEXT NOT NULL,

    mood INTEGER CHECK (mood >= 1 AND mood <= 5),
    energy INTEGER CHECK (energy >= 1 AND energy <= 5),

    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    linked_reading_id UUID REFERENCES readings(id) ON DELETE SET NULL,
    is_private BOOLEAN NOT NULL DEFAULT true,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for journal lookups
CREATE INDEX idx_journal_user_date ON journal_entries(user_id, date DESC);
CREATE INDEX idx_journal_reading ON journal_entries(linked_reading_id) WHERE linked_reading_id IS NOT NULL;

-- Mood logs (lightweight tracking separate from full journal entries)
CREATE TABLE mood_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 5),
    energy INTEGER NOT NULL CHECK (energy >= 1 AND energy <= 5),

    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for mood analytics
CREATE INDEX idx_mood_logs_user_timestamp ON mood_logs(user_id, timestamp DESC);

-- =====================================================
-- AI INTERPRETATION CACHING
-- =====================================================

-- Cache AI-generated interpretations to reduce API costs
CREATE TABLE ai_interpretation_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Cache key (hash of context + content)
    cache_key TEXT NOT NULL UNIQUE,

    reading_type TEXT NOT NULL CHECK (reading_type IN ('tarot', 'iching', 'horoscope', 'synastry')),
    interpretation TEXT NOT NULL,

    -- Context used for generation (for cache validation)
    context_hash TEXT NOT NULL,
    prompt_template_version TEXT NOT NULL DEFAULT '1.0',

    -- AI metadata
    model TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'anthropic_ai',
    input_tokens INTEGER,
    output_tokens INTEGER,

    -- Cache management
    hit_count INTEGER NOT NULL DEFAULT 0,
    last_accessed TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days')
);

-- Index for cache lookups
CREATE INDEX idx_ai_cache_key ON ai_interpretation_cache(cache_key);
CREATE INDEX idx_ai_cache_expires ON ai_interpretation_cache(expires_at);

-- =====================================================
-- CONTENT LIBRARY & VERSIONING
-- =====================================================

-- Content version tracking
CREATE TABLE content_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    version TEXT NOT NULL UNIQUE,
    description TEXT,

    tarot_library_hash TEXT NOT NULL,
    hexagram_library_hash TEXT NOT NULL,
    astrology_content_hash TEXT NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT false,
    released_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User content sync tracking
CREATE TABLE user_content_sync (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,

    current_version TEXT NOT NULL,
    last_synced TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    tarot_library_cached BOOLEAN NOT NULL DEFAULT false,
    hexagram_library_cached BOOLEAN NOT NULL DEFAULT false,
    astrology_content_cached BOOLEAN NOT NULL DEFAULT false
);

-- =====================================================
-- IMAGE ASSET TRACKING (for deck management)
-- =====================================================

-- Tarot deck metadata
CREATE TABLE tarot_decks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    artist TEXT,
    description TEXT,
    style TEXT,
    is_premium BOOLEAN NOT NULL DEFAULT false,
    total_size_mb NUMERIC(10, 2) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User deck downloads
CREATE TABLE user_deck_downloads (
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    deck_id TEXT NOT NULL REFERENCES tarot_decks(id) ON DELETE CASCADE,

    downloaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_cached BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (user_id, deck_id)
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE birth_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE natal_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_horoscopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cosmic_weather ENABLE ROW LEVEL SECURITY;
ALTER TABLE horoscope_generation_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_content_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_deck_downloads ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read/update their own profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- User Preferences: Users can manage their own preferences
CREATE POLICY "Users can manage own preferences"
    ON user_preferences FOR ALL
    USING (auth.uid() = user_id);

-- Birth Data: Users can manage their own birth data
CREATE POLICY "Users can manage own birth data"
    ON birth_data FOR ALL
    USING (auth.uid() = user_id);

-- Natal Charts: Users can manage their own charts
CREATE POLICY "Users can manage own charts"
    ON natal_charts FOR ALL
    USING (auth.uid() = user_id);

-- Daily Horoscopes: Users can manage their own horoscopes
CREATE POLICY "Users can manage own horoscopes"
    ON daily_horoscopes FOR ALL
    USING (auth.uid() = user_id);

-- Cosmic Weather: Users can manage their own cosmic weather
CREATE POLICY "Users can manage own cosmic weather"
    ON cosmic_weather FOR ALL
    USING (auth.uid() = user_id);

-- Horoscope Metadata: Users can view metadata for their horoscopes
CREATE POLICY "Users can view own horoscope metadata"
    ON horoscope_generation_metadata FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM daily_horoscopes
            WHERE daily_horoscopes.id = horoscope_generation_metadata.horoscope_id
            AND daily_horoscopes.user_id = auth.uid()
        )
    );

-- Readings: Users can manage their own readings
CREATE POLICY "Users can manage own readings"
    ON readings FOR ALL
    USING (auth.uid() = user_id);

-- Journal Entries: Users can manage their own journal
CREATE POLICY "Users can manage own journal"
    ON journal_entries FOR ALL
    USING (auth.uid() = user_id);

-- Mood Logs: Users can manage their own mood logs
CREATE POLICY "Users can manage own mood logs"
    ON mood_logs FOR ALL
    USING (auth.uid() = user_id);

-- Content Sync: Users can manage their own content sync
CREATE POLICY "Users can manage own content sync"
    ON user_content_sync FOR ALL
    USING (auth.uid() = user_id);

-- Deck Downloads: Users can manage their own deck downloads
CREATE POLICY "Users can manage own deck downloads"
    ON user_deck_downloads FOR ALL
    USING (auth.uid() = user_id);

-- AI Cache: Allow all authenticated users to read (for shared caching)
CREATE POLICY "Authenticated users can read AI cache"
    ON ai_interpretation_cache FOR SELECT
    TO authenticated
    USING (true);

-- Tarot Decks: Public read access
CREATE POLICY "Anyone can view tarot decks"
    ON tarot_decks FOR SELECT
    TO authenticated
    USING (true);

-- Content Versions: Public read access
CREATE POLICY "Anyone can view content versions"
    ON content_versions FOR SELECT
    TO authenticated
    USING (true);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_birth_data_updated_at BEFORE UPDATE ON birth_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_natal_charts_updated_at BEFORE UPDATE ON natal_charts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-create profile when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name, timezone, language)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'timezone', 'UTC'),
        COALESCE(NEW.raw_user_meta_data->>'language', 'en')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Function to create default preferences on profile creation
CREATE OR REPLACE FUNCTION create_default_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_preferences (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_user_preferences_on_profile_create
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_default_preferences();

-- Function to increment AI cache hit count
CREATE OR REPLACE FUNCTION increment_cache_hit()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE ai_interpretation_cache
    SET hit_count = hit_count + 1,
        last_accessed = NOW()
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to clean expired AI cache entries
CREATE OR REPLACE FUNCTION clean_expired_ai_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM ai_interpretation_cache
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Already created indexes above, but listing for reference:
-- - idx_daily_horoscopes_user_date
-- - idx_readings_user_timestamp
-- - idx_readings_type
-- - idx_readings_favorites
-- - idx_journal_user_date
-- - idx_journal_reading
-- - idx_mood_logs_user_timestamp
-- - idx_ai_cache_key
-- - idx_ai_cache_expires

-- =====================================================
-- INITIAL DATA (Optional)
-- =====================================================

-- Insert default content version
INSERT INTO content_versions (version, description, tarot_library_hash, hexagram_library_hash, astrology_content_hash, is_active)
VALUES ('1.0.0', 'Initial content library', 'initial_tarot_hash', 'initial_hexagram_hash', 'initial_astrology_hash', true);

-- Insert default tarot deck
INSERT INTO tarot_decks (id, name, artist, description, style, is_premium, total_size_mb)
VALUES ('rider-waite', 'Rider-Waite Classic', 'Pamela Colman Smith', 'The classic tarot deck, beloved by beginners and experts alike.', 'traditional', false, 80.0);

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE profiles IS 'User profiles extending Supabase auth.users';
COMMENT ON TABLE user_preferences IS 'User preferences for app behavior and personalization';
COMMENT ON TABLE birth_data IS 'User birth data for natal chart calculations';
COMMENT ON TABLE natal_charts IS 'Cached natal chart calculations';
COMMENT ON TABLE daily_horoscopes IS 'Personalized daily horoscopes per user';
COMMENT ON TABLE cosmic_weather IS 'Daily cosmic weather indicators';
COMMENT ON TABLE readings IS 'History of all readings (tarot, I Ching, etc.)';
COMMENT ON TABLE journal_entries IS 'User journal entries with mood tracking';
COMMENT ON TABLE mood_logs IS 'Lightweight mood and energy tracking';
COMMENT ON TABLE ai_interpretation_cache IS 'Cache for AI-generated interpretations to reduce API costs';
COMMENT ON TABLE content_versions IS 'Content library versioning for updates';
COMMENT ON TABLE tarot_decks IS 'Available tarot decks metadata';
COMMENT ON TABLE user_deck_downloads IS 'Track which decks users have downloaded';

-- =====================================================
-- END OF SCHEMA
-- =====================================================
