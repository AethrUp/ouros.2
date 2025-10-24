import { StateCreator } from 'zustand';
import {
  SocialState,
  FriendConnection,
  ConnectionInvitation,
  SynastryChart,
  SynastryReading,
  SavedChart,
  SynastryPartner,
  DailySynastryForecast,
} from '../../types/synastry';
import { synastryAPI } from '../../handlers/synastryAPI';
import { savedChartsAPI } from '../../handlers/savedChartsAPI';
import { NatalChartData, BirthData } from '../../types/user';

// Initial state
const initialState: SocialState = {
  // Connections
  connections: [],
  selectedConnection: null,
  isLoadingConnections: false,
  connectionsError: null,

  // Invitations
  sentInvitations: [],
  receivedInvitations: [],
  isLoadingInvitations: false,
  invitationsError: null,

  // Saved Charts
  savedCharts: [],
  selectedSavedChart: null,
  isLoadingSavedCharts: false,
  savedChartsError: null,

  // Synastry
  currentSynastryChart: null,
  currentPartner: null,
  synastryReadings: [],
  isCalculatingSynastry: false,
  isGeneratingReading: false,
  synastryError: null,

  // Daily Synastry Forecasts
  dailySynastryForecasts: {},
  isLoadingForecast: false,
  isGeneratingForecast: false,
  forecastError: null,

  // UI state
  showInviteModal: false,
  inviteFriendCode: '',
  inviteMessage: '',
  myFriendCode: null,
};

// Social slice with actions
export interface SocialSlice extends SocialState {
  // Connection actions
  loadConnections: () => Promise<void>;
  selectConnection: (connection: FriendConnection | null) => void;
  removeConnection: (connectionId: string) => Promise<void>;
  updateConnectionSettings: (connectionId: string, settings: {
    relationshipLabel?: string;
    sharesChart?: boolean;
  }) => Promise<void>;

  // Invitation actions
  loadInvitations: () => Promise<void>;
  sendInvitation: (friendCode: string, message?: string) => Promise<void>;
  acceptInvitation: (invitationId: string) => Promise<void>;
  declineInvitation: (invitationId: string) => Promise<void>;
  cancelInvitation: (invitationId: string) => Promise<void>;

  // Saved Charts actions
  loadSavedCharts: () => Promise<void>;
  createSavedChart: (
    name: string,
    birthData: BirthData,
    natalChart: NatalChartData,
    options?: { relationship?: string; notes?: string; isPublic?: boolean }
  ) => Promise<SavedChart>;
  updateSavedChart: (chartId: string, updates: {
    name?: string;
    relationship?: string;
    notes?: string;
  }) => Promise<void>;
  deleteSavedChart: (chartId: string) => Promise<void>;
  selectSavedChart: (chart: SavedChart | null) => void;

  // Synastry actions
  calculateSynastry: (connectionId: string) => Promise<void>;
  loadSynastryChart: (user1Id: string, user2Id: string) => Promise<void>;
  loadSynastryReadings: (connectionId: string) => Promise<void>;
  generateSynastryReading: (
    synastryChartId: string,
    connectionId: string,
    relationshipContext?: string
  ) => Promise<void>;
  deleteSynastryReading: (readingId: string) => Promise<void>;
  setCurrentPartner: (partner: SynastryPartner | null) => void;

  // Daily Synastry Forecast actions
  loadDailySynastryForecast: (
    synastryChart: SynastryChart,
    person1Chart: NatalChartData,
    person2Chart: NatalChartData,
    person1Profile: any,
    person2Profile: any,
    person1Name: string,
    person2Name: string,
    connectionId?: string,
    savedChartId?: string,
    options?: { forceRegenerate?: boolean; focusArea?: string }
  ) => Promise<void>;
  setDailySynastryForecast: (forecast: DailySynastryForecast) => void;
  clearDailySynastryForecast: (synastryChartId: string) => void;

  // UI actions
  loadMyFriendCode: () => Promise<void>;
  setShowInviteModal: (show: boolean) => void;
  setInviteFriendCode: (code: string) => void;
  setInviteMessage: (message: string) => void;
  clearInviteForm: () => void;

  // Error handling
  clearSocialError: () => void;

  // Reset state
  resetSocialState: () => void;
}

export const createSocialSlice: StateCreator<
  SocialSlice,
  [],
  [],
  SocialSlice
> = (set, get) => ({
  ...initialState,

  // =====================================================
  // CONNECTION ACTIONS
  // =====================================================

  loadConnections: async () => {
    set({ isLoadingConnections: true, connectionsError: null });

    try {
      const connections = await synastryAPI.loadConnections();
      set({
        connections,
        isLoadingConnections: false,
      });
    } catch (error) {
      console.error('Error loading connections:', error);
      set({
        connectionsError: error instanceof Error ? error.message : 'Failed to load connections',
        isLoadingConnections: false,
      });
    }
  },

  selectConnection: (connection) => {
    set({ selectedConnection: connection });
  },

  removeConnection: async (connectionId: string) => {
    try {
      await synastryAPI.removeConnection(connectionId);

      // Update state
      set((state) => ({
        connections: state.connections.filter((c) => c.connectionId !== connectionId),
        selectedConnection: state.selectedConnection?.connectionId === connectionId
          ? null
          : state.selectedConnection,
      }));
    } catch (error) {
      console.error('Error removing connection:', error);
      set({
        connectionsError: error instanceof Error ? error.message : 'Failed to remove connection',
      });
    }
  },

  updateConnectionSettings: async (connectionId, settings) => {
    try {
      await synastryAPI.updateConnection(connectionId, settings);

      // Update optimistically
      set((state) => ({
        connections: state.connections.map((c) =>
          c.connectionId === connectionId
            ? {
                ...c,
                ...(settings.relationshipLabel && { relationshipLabel: settings.relationshipLabel }),
                ...(settings.sharesChart !== undefined && { userSharesChart: settings.sharesChart }),
              }
            : c
        ),
      }));
    } catch (error) {
      console.error('Error updating connection settings:', error);
      set({
        connectionsError: error instanceof Error ? error.message : 'Failed to update settings',
      });
    }
  },

  // =====================================================
  // INVITATION ACTIONS
  // =====================================================

  loadInvitations: async () => {
    set({ isLoadingInvitations: true, invitationsError: null });

    try {
      const [sent, received] = await Promise.all([
        synastryAPI.loadSentInvitations(),
        synastryAPI.loadReceivedInvitations(),
      ]);

      set({
        sentInvitations: sent,
        receivedInvitations: received,
        isLoadingInvitations: false,
      });
    } catch (error) {
      console.error('Error loading invitations:', error);
      set({
        invitationsError: error instanceof Error ? error.message : 'Failed to load invitations',
        isLoadingInvitations: false,
      });
    }
  },

  sendInvitation: async (friendCode: string, message?: string) => {
    try {
      const result = await synastryAPI.sendInvitation({ friendCode, message });

      if (!result.success) {
        throw new Error(result.message);
      }

      // Reload invitations after sending
      await get().loadInvitations();

      // Clear form
      get().clearInviteForm();
    } catch (error) {
      console.error('Error sending invitation:', error);
      set({
        invitationsError: error instanceof Error ? error.message : 'Failed to send invitation',
      });
      throw error;
    }
  },

  acceptInvitation: async (invitationId: string) => {
    try {
      const result = await synastryAPI.acceptInvitation(invitationId);

      if (!result.success) {
        throw new Error(result.message);
      }

      // Reload both invitations and connections
      await Promise.all([
        get().loadInvitations(),
        get().loadConnections(),
      ]);
    } catch (error) {
      console.error('Error accepting invitation:', error);
      set({
        invitationsError: error instanceof Error ? error.message : 'Failed to accept invitation',
      });
      throw error;
    }
  },

  declineInvitation: async (invitationId: string) => {
    try {
      await synastryAPI.declineInvitation(invitationId);

      // Reload invitations
      await get().loadInvitations();
    } catch (error) {
      console.error('Error declining invitation:', error);
      set({
        invitationsError: error instanceof Error ? error.message : 'Failed to decline invitation',
      });
      throw error;
    }
  },

  cancelInvitation: async (invitationId: string) => {
    try {
      await synastryAPI.cancelInvitation(invitationId);

      // Reload invitations
      await get().loadInvitations();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      set({
        invitationsError: error instanceof Error ? error.message : 'Failed to cancel invitation',
      });
      throw error;
    }
  },

  // =====================================================
  // SAVED CHARTS ACTIONS
  // =====================================================

  loadSavedCharts: async () => {
    set({ isLoadingSavedCharts: true, savedChartsError: null });

    try {
      const savedCharts = await savedChartsAPI.loadSavedCharts();
      set({
        savedCharts,
        isLoadingSavedCharts: false,
      });
    } catch (error) {
      console.error('Error loading saved charts:', error);
      set({
        savedChartsError: error instanceof Error ? error.message : 'Failed to load saved charts',
        isLoadingSavedCharts: false,
      });
    }
  },

  createSavedChart: async (name, birthData, natalChart, options) => {
    try {
      const newChart = await savedChartsAPI.createSavedChart(name, birthData, natalChart, options);

      // Add to state
      set((state) => ({
        savedCharts: [newChart, ...state.savedCharts],
      }));

      return newChart;
    } catch (error) {
      console.error('Error creating saved chart:', error);
      set({
        savedChartsError: error instanceof Error ? error.message : 'Failed to create saved chart',
      });
      throw error;
    }
  },

  updateSavedChart: async (chartId, updates) => {
    try {
      const updatedChart = await savedChartsAPI.updateSavedChart(chartId, updates);

      // Update in state
      set((state) => ({
        savedCharts: state.savedCharts.map((c) =>
          c.id === chartId ? updatedChart : c
        ),
      }));
    } catch (error) {
      console.error('Error updating saved chart:', error);
      set({
        savedChartsError: error instanceof Error ? error.message : 'Failed to update saved chart',
      });
      throw error;
    }
  },

  deleteSavedChart: async (chartId) => {
    try {
      await savedChartsAPI.deleteSavedChart(chartId);

      // Remove from state
      set((state) => ({
        savedCharts: state.savedCharts.filter((c) => c.id !== chartId),
        selectedSavedChart: state.selectedSavedChart?.id === chartId
          ? null
          : state.selectedSavedChart,
      }));
    } catch (error) {
      console.error('Error deleting saved chart:', error);
      set({
        savedChartsError: error instanceof Error ? error.message : 'Failed to delete saved chart',
      });
      throw error;
    }
  },

  selectSavedChart: (chart) => {
    set({ selectedSavedChart: chart });
  },

  // =====================================================
  // SYNASTRY ACTIONS
  // =====================================================

  setCurrentPartner: (partner) => {
    set({ currentPartner: partner });
  },

  calculateSynastry: async (connectionId: string) => {
    set({ isCalculatingSynastry: true, synastryError: null });

    try {
      const connection = get().connections.find((c) => c.connectionId === connectionId);
      if (!connection) {
        throw new Error('Connection not found');
      }

      // TODO: Get both users' natal charts
      // For now, this will need to be called from the screen with the charts
      console.log('calculateSynastry needs to be called with natal charts');

      set({ isCalculatingSynastry: false });
    } catch (error) {
      console.error('Error calculating synastry:', error);
      set({
        synastryError: error instanceof Error ? error.message : 'Failed to calculate synastry',
        isCalculatingSynastry: false,
      });
    }
  },

  loadSynastryChart: async (user1Id: string, user2Id: string) => {
    set({ isCalculatingSynastry: true, synastryError: null });

    try {
      // TODO: Get both users' natal charts
      // This is a placeholder - in real implementation, you'd fetch both charts
      // For now, just set loading to false
      console.warn('loadSynastryChart: Natal charts need to be passed in');

      set({
        currentSynastryChart: null,
        isCalculatingSynastry: false,
      });
    } catch (error) {
      console.error('Error loading synastry chart:', error);
      set({
        synastryError: error instanceof Error ? error.message : 'Failed to load synastry chart',
        isCalculatingSynastry: false,
      });
    }
  },

  loadSynastryReadings: async (connectionId: string) => {
    try {
      const readings = await synastryAPI.loadSynastryReadings(connectionId);
      set({ synastryReadings: readings });
    } catch (error) {
      console.error('Error loading synastry readings:', error);
      set({
        synastryError: error instanceof Error ? error.message : 'Failed to load readings',
      });
    }
  },

  generateSynastryReading: async (synastryChartId, connectionId, relationshipContext) => {
    set({ isGeneratingReading: true, synastryError: null });

    try {
      const chart = get().currentSynastryChart;
      if (!chart) {
        throw new Error('No synastry chart loaded');
      }

      // TODO: Get both users' natal charts and names
      // This is a placeholder - real implementation needs actual chart data
      console.warn('generateSynastryReading: User charts and names need to be passed in');

      set({ isGeneratingReading: false });
    } catch (error) {
      console.error('Error generating synastry reading:', error);
      set({
        synastryError: error instanceof Error ? error.message : 'Failed to generate reading',
        isGeneratingReading: false,
      });
    }
  },

  deleteSynastryReading: async (readingId: string) => {
    try {
      await synastryAPI.deleteSynastryReading(readingId);

      // Remove from state optimistically
      set((state) => ({
        synastryReadings: state.synastryReadings.filter((r) => r.id !== readingId),
      }));
    } catch (error) {
      console.error('Error deleting synastry reading:', error);
      set({
        synastryError: error instanceof Error ? error.message : 'Failed to delete reading',
      });
    }
  },

  // =====================================================
  // DAILY SYNASTRY FORECAST ACTIONS
  // =====================================================

  loadDailySynastryForecast: async (
    synastryChart,
    person1Chart,
    person2Chart,
    person1Profile,
    person2Profile,
    person1Name,
    person2Name,
    connectionId,
    savedChartId,
    options
  ) => {
    set({ isLoadingForecast: true, isGeneratingForecast: true, forecastError: null });

    try {
      // Call API route instead of handler
      const response = await fetch('/api/synastry/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          synastryChartId: synastryChart.id,
          synastryChart,
          person1Chart,
          person2Chart,
          person1Name,
          person2Name,
          connectionId,
          savedChartId,
          forceRegenerate: options?.forceRegenerate,
          focusArea: options?.focusArea || 'general',
        }),
      });

      const result = await response.json();

      if (!result.success || !result.forecast) {
        throw new Error(result.error || 'Failed to generate forecast');
      }

      // Store the forecast keyed by synastry chart ID
      set((state) => ({
        dailySynastryForecasts: {
          ...state.dailySynastryForecasts,
          [synastryChart.id]: result.forecast!,
        },
        isLoadingForecast: false,
        isGeneratingForecast: false,
      }));
    } catch (error) {
      console.error('Error loading daily synastry forecast:', error);
      set({
        forecastError: error instanceof Error ? error.message : 'Failed to load forecast',
        isLoadingForecast: false,
        isGeneratingForecast: false,
      });
    }
  },

  setDailySynastryForecast: (forecast) => {
    set((state) => ({
      dailySynastryForecasts: {
        ...state.dailySynastryForecasts,
        [forecast.synastryChartId]: forecast,
      },
    }));
  },

  clearDailySynastryForecast: (synastryChartId) => {
    set((state) => {
      const { [synastryChartId]: removed, ...rest } = state.dailySynastryForecasts;
      return { dailySynastryForecasts: rest };
    });
  },

  // =====================================================
  // UI ACTIONS
  // =====================================================

  loadMyFriendCode: async () => {
    try {
      const friendCode = await synastryAPI.getMyFriendCode();
      set({ myFriendCode: friendCode });
    } catch (error) {
      console.error('Error loading friend code:', error);
    }
  },

  setShowInviteModal: (show: boolean) => {
    set({ showInviteModal: show });
  },

  setInviteFriendCode: (code: string) => {
    set({ inviteFriendCode: code });
  },

  setInviteMessage: (message: string) => {
    set({ inviteMessage: message });
  },

  clearInviteForm: () => {
    set({
      inviteFriendCode: '',
      inviteMessage: '',
      showInviteModal: false,
    });
  },

  // =====================================================
  // ERROR HANDLING
  // =====================================================

  clearSocialError: () => {
    set({
      connectionsError: null,
      invitationsError: null,
      savedChartsError: null,
      synastryError: null,
      forecastError: null,
    });
  },

  resetSocialState: () => {
    set(initialState);
  },
});
