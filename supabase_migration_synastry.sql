-- =====================================================
-- SYNASTRY & SOCIAL FEATURES MIGRATION
-- =====================================================
-- Adds support for:
-- - Friend connections between users
-- - Connection invitations
-- - Synastry chart calculations
-- - Synastry reading storage
-- =====================================================

-- =====================================================
-- CONNECTIONS & FRIENDSHIPS
-- =====================================================

-- Connection invitations
CREATE TABLE connection_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    recipient_email TEXT NOT NULL,
    recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
    message TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),

    -- Prevent duplicate invitations
    UNIQUE(sender_id, recipient_email)
);

-- User connections (bidirectional friendships)
CREATE TABLE connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Privacy settings
    user1_shares_chart BOOLEAN NOT NULL DEFAULT true,
    user2_shares_chart BOOLEAN NOT NULL DEFAULT true,

    -- Relationship metadata
    relationship_label TEXT,  -- e.g., "Partner", "Friend", "Family"
    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure user1_id < user2_id to avoid duplicate connections
    CHECK (user1_id < user2_id),
    UNIQUE(user1_id, user2_id)
);

-- =====================================================
-- SYNASTRY CHARTS & READINGS
-- =====================================================

-- Synastry chart calculations (cached)
CREATE TABLE synastry_charts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Synastry aspects (inter-chart aspects)
    synastry_aspects JSONB NOT NULL,

    -- Composite chart (midpoint chart)
    composite_chart JSONB,

    -- Compatibility scores
    compatibility_score NUMERIC(5, 2),  -- 0-100
    element_compatibility JSONB,
    modality_compatibility JSONB,

    -- Analysis breakdown
    strengths TEXT[],
    challenges TEXT[],
    recommendations TEXT[],

    -- Metadata
    calculation_method TEXT NOT NULL DEFAULT 'standard',
    house_system TEXT NOT NULL DEFAULT 'placidus',
    version TEXT NOT NULL DEFAULT '1.0',

    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure user1_id < user2_id for consistency
    CHECK (user1_id < user2_id),
    UNIQUE(user1_id, user2_id)
);

-- Synastry readings (saved interpretations)
CREATE TABLE synastry_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    synastry_chart_id UUID NOT NULL REFERENCES synastry_charts(id) ON DELETE CASCADE,
    connection_id UUID NOT NULL REFERENCES connections(id) ON DELETE CASCADE,

    -- Reading content
    interpretation TEXT NOT NULL,
    focus_area TEXT,  -- e.g., "romantic", "friendship", "business"

    -- AI generation metadata
    ai_generated BOOLEAN NOT NULL DEFAULT false,
    model TEXT,
    prompt_version TEXT,

    -- Who saved this reading
    saved_by_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Invitations
CREATE INDEX idx_invitations_sender ON connection_invitations(sender_id);
CREATE INDEX idx_invitations_recipient_email ON connection_invitations(recipient_email);
CREATE INDEX idx_invitations_recipient_id ON connection_invitations(recipient_id) WHERE recipient_id IS NOT NULL;
CREATE INDEX idx_invitations_status ON connection_invitations(status);
CREATE INDEX idx_invitations_expires ON connection_invitations(expires_at);

-- Connections
CREATE INDEX idx_connections_user1 ON connections(user1_id);
CREATE INDEX idx_connections_user2 ON connections(user2_id);

-- Synastry charts
CREATE INDEX idx_synastry_charts_users ON synastry_charts(user1_id, user2_id);

-- Synastry readings
CREATE INDEX idx_synastry_readings_chart ON synastry_readings(synastry_chart_id);
CREATE INDEX idx_synastry_readings_connection ON synastry_readings(connection_id);
CREATE INDEX idx_synastry_readings_user ON synastry_readings(saved_by_user_id);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

ALTER TABLE connection_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE synastry_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE synastry_readings ENABLE ROW LEVEL SECURITY;

-- Invitations: Users can view invitations they sent or received
CREATE POLICY "Users can view relevant invitations"
    ON connection_invitations FOR SELECT
    USING (
        auth.uid() = sender_id OR
        auth.uid() = recipient_id OR
        (recipient_id IS NULL AND EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.email = connection_invitations.recipient_email
        ))
    );

-- Invitations: Users can send invitations
CREATE POLICY "Users can send invitations"
    ON connection_invitations FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

-- Invitations: Senders can update/cancel their pending invitations
CREATE POLICY "Senders can update own invitations"
    ON connection_invitations FOR UPDATE
    USING (auth.uid() = sender_id AND status = 'pending');

-- Invitations: Recipients can update invitations sent to them
CREATE POLICY "Recipients can respond to invitations"
    ON connection_invitations FOR UPDATE
    USING (
        auth.uid() = recipient_id OR
        (recipient_id IS NULL AND EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.email = connection_invitations.recipient_email
        ))
    );

-- Connections: Users can view connections they're part of
CREATE POLICY "Users can view own connections"
    ON connections FOR SELECT
    USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Connections: System creates connections (via function)
CREATE POLICY "System can create connections"
    ON connections FOR INSERT
    WITH CHECK (true);  -- Controlled by function

-- Connections: Users can update their privacy settings
CREATE POLICY "Users can update connection settings"
    ON connections FOR UPDATE
    USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Connections: Users can delete connections they're part of
CREATE POLICY "Users can delete own connections"
    ON connections FOR DELETE
    USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Synastry Charts: Users can view charts they're part of
CREATE POLICY "Users can view own synastry charts"
    ON synastry_charts FOR SELECT
    USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Synastry Charts: System creates charts (via function)
CREATE POLICY "System can create synastry charts"
    ON synastry_charts FOR ALL
    WITH CHECK (true);  -- Controlled by function

-- Synastry Readings: Users can view readings for their connections
CREATE POLICY "Users can view relevant synastry readings"
    ON synastry_readings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM connections
            WHERE connections.id = synastry_readings.connection_id
            AND (connections.user1_id = auth.uid() OR connections.user2_id = auth.uid())
        )
    );

-- Synastry Readings: Users can create readings for their connections
CREATE POLICY "Users can create synastry readings"
    ON synastry_readings FOR INSERT
    WITH CHECK (
        auth.uid() = saved_by_user_id AND
        EXISTS (
            SELECT 1 FROM connections
            WHERE connections.id = connection_id
            AND (connections.user1_id = auth.uid() OR connections.user2_id = auth.uid())
        )
    );

-- Synastry Readings: Users can delete readings they created
CREATE POLICY "Users can delete own synastry readings"
    ON synastry_readings FOR DELETE
    USING (auth.uid() = saved_by_user_id);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to accept connection invitation
CREATE OR REPLACE FUNCTION accept_connection_invitation(invitation_id UUID)
RETURNS UUID AS $$
DECLARE
    invitation_record RECORD;
    connection_id UUID;
    normalized_user1_id UUID;
    normalized_user2_id UUID;
BEGIN
    -- Get invitation details
    SELECT * INTO invitation_record
    FROM connection_invitations
    WHERE id = invitation_id
    AND status = 'pending'
    AND recipient_id = auth.uid();

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invitation not found or already processed';
    END IF;

    -- Normalize user IDs (user1_id < user2_id)
    IF invitation_record.sender_id < invitation_record.recipient_id THEN
        normalized_user1_id := invitation_record.sender_id;
        normalized_user2_id := invitation_record.recipient_id;
    ELSE
        normalized_user1_id := invitation_record.recipient_id;
        normalized_user2_id := invitation_record.sender_id;
    END IF;

    -- Create connection
    INSERT INTO connections (user1_id, user2_id)
    VALUES (normalized_user1_id, normalized_user2_id)
    ON CONFLICT (user1_id, user2_id) DO NOTHING
    RETURNING id INTO connection_id;

    -- Update invitation status
    UPDATE connection_invitations
    SET status = 'accepted',
        responded_at = NOW()
    WHERE id = invitation_id;

    RETURN connection_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's connections with profiles
CREATE OR REPLACE FUNCTION get_user_connections(target_user_id UUID)
RETURNS TABLE (
    connection_id UUID,
    friend_id UUID,
    friend_email TEXT,
    friend_display_name TEXT,
    friend_avatar TEXT,
    user_shares_chart BOOLEAN,
    friend_shares_chart BOOLEAN,
    relationship_label TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id as connection_id,
        CASE
            WHEN c.user1_id = target_user_id THEN c.user2_id
            ELSE c.user1_id
        END as friend_id,
        p.email as friend_email,
        p.display_name as friend_display_name,
        p.avatar as friend_avatar,
        CASE
            WHEN c.user1_id = target_user_id THEN c.user1_shares_chart
            ELSE c.user2_shares_chart
        END as user_shares_chart,
        CASE
            WHEN c.user1_id = target_user_id THEN c.user2_shares_chart
            ELSE c.user1_shares_chart
        END as friend_shares_chart,
        c.relationship_label,
        c.created_at
    FROM connections c
    JOIN profiles p ON (
        p.id = CASE
            WHEN c.user1_id = target_user_id THEN c.user2_id
            ELSE c.user1_id
        END
    )
    WHERE c.user1_id = target_user_id OR c.user2_id = target_user_id
    ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update connections updated_at
CREATE TRIGGER update_connections_updated_at BEFORE UPDATE ON connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_synastry_charts_updated_at BEFORE UPDATE ON synastry_charts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean expired invitations
CREATE OR REPLACE FUNCTION clean_expired_invitations()
RETURNS void AS $$
BEGIN
    UPDATE connection_invitations
    SET status = 'cancelled'
    WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE connection_invitations IS 'Invitations to connect with other users';
COMMENT ON TABLE connections IS 'Bidirectional friendships between users for synastry';
COMMENT ON TABLE synastry_charts IS 'Cached synastry chart calculations between users';
COMMENT ON TABLE synastry_readings IS 'Saved synastry interpretations and readings';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
