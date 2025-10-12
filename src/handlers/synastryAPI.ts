/**
 * Synastry & Social Connection API - Friend Code System
 * Handles all Supabase queries for connections, invitations, and synastry charts
 */

import { supabase } from '../utils/supabase';
import {
  ConnectionInvitation,
  Connection,
  FriendConnection,
  SynastryChart,
  SynastryReading,
  SendInvitationRequest,
  SendInvitationResponse,
  RespondToInvitationResponse,
  CalculateSynastryResponse,
  SynastryPartner,
} from '../types/synastry';
import { calculateSynastry } from './synastryCalculation';
import { generateSynastryReading } from './synastryReading';
import { NatalChartData } from '../types/user';
import { savedChartsAPI } from './savedChartsAPI';

export const synastryAPI = {
  // =====================================================
  // USER PROFILE & FRIEND CODE
  // =====================================================

  /**
   * Get current user's friend code
   */
  getMyFriendCode: async (): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .select('friend_code')
      .eq('id', user.id)
      .single();

    if (error) throw error;

    return data?.friend_code || null;
  },

  // =====================================================
  // CONNECTION INVITATIONS
  // =====================================================

  /**
   * Load invitations sent by current user
   */
  loadSentInvitations: async (): Promise<ConnectionInvitation[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('connection_invitations')
      .select(`
        *,
        senderProfile:sender_id(id, email, display_name, avatar, friend_code),
        recipientProfile:recipient_id(id, email, display_name, avatar, friend_code)
      `)
      .eq('sender_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(mapInvitation);
  },

  /**
   * Load invitations received by current user
   */
  loadReceivedInvitations: async (): Promise<ConnectionInvitation[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('connection_invitations')
      .select(`
        *,
        senderProfile:sender_id(id, email, display_name, avatar, friend_code),
        recipientProfile:recipient_id(id, email, display_name, avatar, friend_code)
      `)
      .eq('recipient_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(mapInvitation);
  },

  /**
   * Send connection invitation using friend code
   */
  sendInvitation: async (
    request: SendInvitationRequest
  ): Promise<SendInvitationResponse> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    try {
      // Call the database function to send invitation
      const { data, error } = await supabase.rpc('send_connection_invitation', {
        friend_code: request.friendCode.toUpperCase(),
        message: request.message || null,
      });

      if (error) {
        // Parse error message for user-friendly responses
        let message = error.message;
        if (message.includes('Friend code not found')) {
          message = 'Friend code not found. Please check the code and try again.';
        } else if (message.includes('Cannot send invitation to yourself')) {
          message = 'You cannot add yourself as a friend.';
        } else if (message.includes('Already connected')) {
          message = 'You are already connected with this user.';
        } else if (message.includes('Invitation already sent')) {
          message = 'You have already sent an invitation to this user.';
        }

        return {
          success: false,
          message,
        };
      }

      // Fetch the created invitation
      const { data: invitation, error: fetchError } = await supabase
        .from('connection_invitations')
        .select(`
          *,
          senderProfile:sender_id(id, email, display_name, avatar, friend_code),
          recipientProfile:recipient_id(id, email, display_name, avatar, friend_code)
        `)
        .eq('id', data)
        .single();

      if (fetchError) {
        return {
          success: true,
          message: 'Invitation sent successfully',
        };
      }

      return {
        success: true,
        invitation: mapInvitation(invitation),
        message: 'Invitation sent successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to send invitation',
      };
    }
  },

  /**
   * Accept connection invitation
   */
  acceptInvitation: async (invitationId: string): Promise<RespondToInvitationResponse> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Call the database function to accept invitation
    const { data, error } = await supabase.rpc('accept_connection_invitation', {
      invitation_id: invitationId,
    });

    if (error) {
      return {
        success: false,
        message: error.message || 'Failed to accept invitation',
      };
    }

    return {
      success: true,
      message: 'Invitation accepted successfully',
    };
  },

  /**
   * Decline connection invitation
   */
  declineInvitation: async (invitationId: string): Promise<void> => {
    const { error } = await supabase
      .from('connection_invitations')
      .update({
        status: 'declined',
        responded_at: new Date().toISOString(),
      })
      .eq('id', invitationId);

    if (error) throw error;
  },

  /**
   * Cancel sent invitation
   */
  cancelInvitation: async (invitationId: string): Promise<void> => {
    const { error } = await supabase
      .from('connection_invitations')
      .update({
        status: 'cancelled',
      })
      .eq('id', invitationId);

    if (error) throw error;
  },

  // =====================================================
  // CONNECTIONS
  // =====================================================

  /**
   * Load user's connections
   */
  loadConnections: async (): Promise<FriendConnection[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Use the database function to get connections with friend profiles
    const { data, error } = await supabase.rpc('get_user_connections', {
      target_user_id: user.id,
    });

    if (error) throw error;

    return (data || []).map((row: any) => ({
      connectionId: row.connection_id,
      friendId: row.friend_id,
      friendEmail: row.friend_email,
      friendDisplayName: row.friend_display_name,
      friendAvatar: row.friend_avatar,
      friendCode: row.friend_code,
      userSharesChart: row.user_shares_chart,
      friendSharesChart: row.friend_shares_chart,
      relationshipLabel: row.relationship_label,
      createdAt: row.created_at,
    }));
  },

  /**
   * Remove connection
   */
  removeConnection: async (connectionId: string): Promise<void> => {
    const { error } = await supabase
      .from('connections')
      .delete()
      .eq('id', connectionId);

    if (error) throw error;
  },

  /**
   * Update connection settings
   */
  updateConnection: async (
    connectionId: string,
    updates: {
      relationshipLabel?: string;
      sharesChart?: boolean;
    }
  ): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get connection to determine which fields to update
    const { data: connection, error: fetchError } = await supabase
      .from('connections')
      .select('user1_id, user2_id')
      .eq('id', connectionId)
      .single();

    if (fetchError) throw fetchError;

    const isUser1 = connection.user1_id === user.id;
    const updateData: any = {};

    if (updates.relationshipLabel !== undefined) {
      updateData.relationship_label = updates.relationshipLabel;
    }

    if (updates.sharesChart !== undefined) {
      if (isUser1) {
        updateData.user1_shares_chart = updates.sharesChart;
      } else {
        updateData.user2_shares_chart = updates.sharesChart;
      }
    }

    const { error } = await supabase
      .from('connections')
      .update(updateData)
      .eq('id', connectionId);

    if (error) throw error;
  },

  // =====================================================
  // SYNASTRY CHARTS
  // =====================================================

  /**
   * Load or calculate synastry chart
   */
  loadSynastryChart: async (
    user1Id: string,
    user2Id: string,
    user1Chart: NatalChartData,
    user2Chart: NatalChartData,
    forceRegenerate = false
  ): Promise<SynastryChart | null> => {
    // Normalize user IDs
    const [normalizedUser1Id, normalizedUser2Id] =
      user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];

    // Check for existing chart (unless forcing regeneration)
    if (!forceRegenerate) {
      const { data, error } = await supabase
        .from('synastry_charts')
        .select('*')
        .eq('user1_id', normalizedUser1Id)
        .eq('user2_id', normalizedUser2Id)
        .is('saved_chart_id', null)
        .single();

      if (!error && data) {
        return mapSynastryChart(data);
      }
    }

    // Calculate new synastry chart
    const result = await calculateSynastry(user1Chart, user2Chart, user1Id, user2Id);

    if (!result.success || !result.synastryChart) {
      return null;
    }

    // Save to database
    const { data: savedChart, error: saveError } = await supabase
      .from('synastry_charts')
      .upsert({
        user1_id: normalizedUser1Id,
        user2_id: normalizedUser2Id,
        saved_chart_id: null,
        synastry_aspects: result.synastryChart.synastryAspects,
        composite_chart: result.synastryChart.compositeChart || null,
        compatibility_score: result.synastryChart.compatibilityScore,
        element_compatibility: result.synastryChart.elementCompatibility,
        modality_compatibility: result.synastryChart.modalityCompatibility,
        strengths: result.synastryChart.strengths,
        challenges: result.synastryChart.challenges,
        recommendations: result.synastryChart.recommendations,
        calculation_method: result.synastryChart.calculationMethod,
        house_system: result.synastryChart.houseSystem,
        version: result.synastryChart.version,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save synastry chart:', saveError);
      return result.synastryChart;
    }

    return mapSynastryChart(savedChart);
  },

  /**
   * Load or calculate synastry chart with saved chart
   */
  loadSynastryChartWithSaved: async (
    userId: string,
    savedChartId: string,
    userChart: NatalChartData,
    savedChart: NatalChartData,
    forceRegenerate = false
  ): Promise<SynastryChart | null> => {
    // Check for existing chart (unless forcing regeneration)
    if (!forceRegenerate) {
      const { data, error } = await supabase
        .from('synastry_charts')
        .select('*')
        .eq('user1_id', userId)
        .eq('saved_chart_id', savedChartId)
        .single();

      if (!error && data) {
        return mapSynastryChart(data);
      }
    }

    // Calculate new synastry chart
    const result = await calculateSynastry(userChart, savedChart, userId, savedChartId);

    if (!result.success || !result.synastryChart) {
      return null;
    }

    // Save to database
    const { data: savedChartData, error: saveError } = await supabase
      .from('synastry_charts')
      .upsert({
        user1_id: userId,
        user2_id: null,
        saved_chart_id: savedChartId,
        synastry_aspects: result.synastryChart.synastryAspects,
        composite_chart: result.synastryChart.compositeChart || null,
        compatibility_score: result.synastryChart.compatibilityScore,
        element_compatibility: result.synastryChart.elementCompatibility,
        modality_compatibility: result.synastryChart.modalityCompatibility,
        strengths: result.synastryChart.strengths,
        challenges: result.synastryChart.challenges,
        recommendations: result.synastryChart.recommendations,
        calculation_method: result.synastryChart.calculationMethod,
        house_system: result.synastryChart.houseSystem,
        version: result.synastryChart.version,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save synastry chart:', saveError);
      return result.synastryChart;
    }

    return mapSynastryChart(savedChartData);
  },

  /**
   * Load synastry chart with partner (user or saved chart)
   */
  loadSynastryChartWithPartner: async (
    user1Id: string,
    user1Chart: NatalChartData,
    partner: SynastryPartner,
    forceRegenerate = false
  ): Promise<SynastryChart | null> => {
    if (partner.type === 'user' && partner.userId) {
      return synastryAPI.loadSynastryChart(
        user1Id,
        partner.userId,
        user1Chart,
        partner.natalChart,
        forceRegenerate
      );
    } else if (partner.type === 'saved' && partner.savedChartId) {
      return synastryAPI.loadSynastryChartWithSaved(
        user1Id,
        partner.savedChartId,
        user1Chart,
        partner.natalChart,
        forceRegenerate
      );
    }

    throw new Error('Invalid partner configuration');
  },

  // =====================================================
  // SYNASTRY READINGS
  // =====================================================

  /**
   * Load synastry readings for a connection
   */
  loadSynastryReadings: async (connectionId: string): Promise<SynastryReading[]> => {
    const { data, error } = await supabase
      .from('synastry_readings')
      .select('*')
      .eq('connection_id', connectionId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(mapSynastryReading);
  },

  /**
   * Load synastry readings for a saved chart
   */
  loadSynastryReadingsForSavedChart: async (savedChartId: string): Promise<SynastryReading[]> => {
    const { data, error } = await supabase
      .from('synastry_readings')
      .select('*')
      .eq('saved_chart_id', savedChartId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(mapSynastryReading);
  },

  /**
   * Save synastry reading
   */
  saveSynastryReading: async (reading: SynastryReading): Promise<SynastryReading> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('synastry_readings')
      .insert({
        synastry_chart_id: reading.synastryChartId,
        connection_id: reading.connectionId || null,
        saved_chart_id: reading.savedChartId || null,
        interpretation: reading.interpretation,
        relationship_context: reading.relationshipContext,
        ai_generated: reading.aiGenerated,
        model: reading.model,
        prompt_version: reading.promptVersion,
        saved_by_user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return mapSynastryReading(data);
  },

  /**
   * Delete synastry reading
   */
  deleteSynastryReading: async (readingId: string): Promise<void> => {
    const { error } = await supabase
      .from('synastry_readings')
      .delete()
      .eq('id', readingId);

    if (error) throw error;
  },
};

// =====================================================
// MAPPING FUNCTIONS
// =====================================================

function mapInvitation(data: any): ConnectionInvitation {
  return {
    id: data.id,
    senderId: data.sender_id,
    senderProfile: data.senderProfile ? {
      id: data.senderProfile.id,
      email: data.senderProfile.email,
      displayName: data.senderProfile.display_name,
      avatar: data.senderProfile.avatar,
      friendCode: data.senderProfile.friend_code,
    } : undefined,
    recipientId: data.recipient_id,
    recipientProfile: data.recipientProfile ? {
      id: data.recipientProfile.id,
      email: data.recipientProfile.email,
      displayName: data.recipientProfile.display_name,
      avatar: data.recipientProfile.avatar,
      friendCode: data.recipientProfile.friend_code,
    } : undefined,
    status: data.status,
    message: data.message,
    createdAt: data.created_at,
    respondedAt: data.responded_at,
    expiresAt: data.expires_at,
  };
}

function mapSynastryChart(data: any): SynastryChart {
  return {
    id: data.id,
    user1Id: data.user1_id,
    user2Id: data.user2_id,
    savedChartId: data.saved_chart_id,
    synastryAspects: data.synastry_aspects,
    compositeChart: data.composite_chart,
    compatibilityScore: data.compatibility_score,
    elementCompatibility: data.element_compatibility,
    modalityCompatibility: data.modality_compatibility,
    strengths: data.strengths,
    challenges: data.challenges,
    recommendations: data.recommendations,
    calculationMethod: data.calculation_method,
    houseSystem: data.house_system,
    version: data.version,
    calculatedAt: data.calculated_at,
    updatedAt: data.updated_at,
  };
}

function mapSynastryReading(data: any): SynastryReading {
  return {
    id: data.id,
    synastryChartId: data.synastry_chart_id,
    connectionId: data.connection_id,
    savedChartId: data.saved_chart_id,
    interpretation: data.interpretation,
    relationshipContext: data.relationship_context,
    aiGenerated: data.ai_generated,
    model: data.model,
    promptVersion: data.prompt_version,
    savedByUserId: data.saved_by_user_id,
    createdAt: data.created_at,
  };
}
