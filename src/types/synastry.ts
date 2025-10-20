// Synastry and Social Connection Types

import { NatalChartData, AspectData, UserProfile, BirthData } from './user';

// =====================================================
// SAVED CHARTS (NON-USER CHARTS)
// =====================================================

export interface SavedChart {
  id: string;
  userId: string;          // Owner of this saved chart
  name: string;            // Person's name
  relationship?: string;   // Optional label (e.g., "Partner", "Ex", "Crush")
  birthData: BirthData;
  natalChart: NatalChartData;
  isPublic: boolean;       // Could share with friends later
  notes?: string;          // Optional notes about this person
  createdAt: string;
  updatedAt: string;
}

export interface SynastryPartner {
  type: 'user' | 'saved';
  userId?: string;         // If type is 'user'
  savedChartId?: string;   // If type is 'saved'
  displayName: string;
  natalChart: NatalChartData;
  connectionId?: string;   // If type is 'user'
}

// =====================================================
// CONNECTION & FRIENDSHIP TYPES
// =====================================================

export type ConnectionStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

export interface ConnectionInvitation {
  id: string;
  senderId: string;
  senderProfile?: UserProfile;
  recipientId: string;
  recipientProfile?: UserProfile;
  status: ConnectionStatus;
  message?: string;
  createdAt: string;
  respondedAt?: string;
  expiresAt: string;
}

export interface Connection {
  id: string;
  user1Id: string;
  user2Id: string;
  user1Profile?: UserProfile;
  user2Profile?: UserProfile;

  // Privacy settings
  user1SharesChart: boolean;
  user2SharesChart: boolean;

  // Relationship metadata
  relationshipLabel?: string;  // "Partner", "Friend", "Family", etc.
  notes?: string;

  createdAt: string;
  updatedAt: string;
}

export interface FriendConnection {
  connectionId: string;
  friendId: string;
  friendEmail: string;
  friendDisplayName: string;
  friendAvatar?: string;
  friendCode: string;
  userSharesChart: boolean;
  friendSharesChart: boolean;
  relationshipLabel?: string;
  createdAt: string;

  // Expanded data (loaded separately)
  friendProfile?: UserProfile;
  synastryChart?: SynastryChart;
}

// =====================================================
// SYNASTRY CHART TYPES
// =====================================================

export interface SynastryChart {
  id: string;
  user1Id: string;
  user2Id?: string;         // Null if using saved chart
  savedChartId?: string;    // Reference to saved chart if used

  // Inter-chart aspects (person1's planets to person2's planets)
  synastryAspects: SynastryAspect[];

  // Composite chart (optional - midpoint method)
  compositeChart?: NatalChartData;

  // Compatibility analysis
  compatibilityScore?: number;  // 0-100
  elementCompatibility?: ElementCompatibility;
  modalityCompatibility?: ModalityCompatibility;

  // Analysis
  strengths: string[];
  challenges: string[];
  recommendations: string[];

  // Metadata
  calculationMethod: string;
  houseSystem: string;
  version: string;
  calculatedAt: string;
  updatedAt: string;
}

export interface SynastryAspect extends AspectData {
  person1Planet: string;  // e.g., "user1.sun"
  person2Planet: string;  // e.g., "user2.moon"
  person1Degree: number;
  person2Degree: number;
  isHarmonious: boolean;
  category: 'romantic' | 'communication' | 'conflict' | 'growth' | 'karmic' | 'general';
  description?: string;
}

export interface ElementCompatibility {
  fire: number;      // 0-100
  earth: number;
  air: number;
  water: number;
  overall: number;
  description: string;
}

export interface ModalityCompatibility {
  cardinal: number;  // 0-100
  fixed: number;
  mutable: number;
  overall: number;
  description: string;
}

// =====================================================
// SYNASTRY READING TYPES
// =====================================================

export interface SynastryReading {
  id: string;
  synastryChartId: string;
  connectionId?: string;      // Optional - for user-to-user synastry
  savedChartId?: string;      // Optional - for user-to-saved-chart synastry

  // Reading content
  interpretation: string;
  relationshipContext?: string;  // Free-text description of relationship (e.g., "girlfriend", "coworker", "mom")

  // AI generation metadata
  aiGenerated: boolean;
  model?: string;
  promptVersion?: string;

  // Who saved this reading
  savedByUserId: string;

  createdAt: string;

  // Expanded data (loaded separately)
  synastryChart?: SynastryChart;
  connection?: Connection;
}

// =====================================================
// DAILY SYNASTRY FORECAST TYPES
// =====================================================

export interface TransitAspect {
  transitPlanet: string;
  natalPlanet: string;
  aspect: string;
  orb: number;
  strength: number;
  transitInfo: {
    isRetrograde: boolean;
  };
}

export interface TransitData {
  aspects: TransitAspect[];
  summary: {
    totalAspects: number;
    majorAspects: number;
    activeAspects: number;
    strongestAspect: TransitAspect | null;
  };
  metadata?: {
    calculatedAt: string;
    dataSource: string;
    precision: string;
  };
}

export interface TriggeredSynastryAspect {
  synastryAspect: SynastryAspect;
  triggeringTransits: TransitAspect[];
  intensity: number;
  theme: string;
  advice: string;
}

// Legacy format - kept for backwards compatibility
export interface DailySynastryForecast {
  id: string;
  date: string;

  // Relationship reference
  synastryChartId: string;
  connectionId?: string;
  savedChartId?: string;

  // People names
  person1Name: string;
  person2Name: string;

  // Today's transit data
  person1Transits: TransitData;
  person2Transits: TransitData;
  currentPositions: Record<string, {
    position: number;
    sign: string;
    degree: number;
    retrograde: boolean;
    formatted: string;
  }>;
  triggeredAspects: TriggeredSynastryAspect[];

  // Preview (lightweight - for cards)
  preview: {
    topTheme: string;
    summary: string;
    energyRating: 'harmonious' | 'intense' | 'challenging' | 'transformative';
  };

  // Full content - can be legacy format or new structured format
  fullContent: DailySynastryForecastContent | DailySynastryForecastContentV2;

  // Metadata
  hasFullForecast: boolean;
  generatedAt: string;
  model?: string;
  promptVersion?: string;

  // Expanded data
  synastryChart?: SynastryChart;
}

// Legacy content format
export interface DailySynastryForecastContent {
  morningForecast: string;
  afternoonForecast: string;
  eveningForecast: string;
  advice: string[];
  activitiesSuggested: string[];
  activitiesToAvoid: string[];
  transitAnalysis: string;
}

// New structured content format (V2)
export interface DailySynastryForecastContentV2 {
  introduction: string;

  timeBasedForecasts: {
    morning: TimeBasedForecast;
    afternoon: TimeBasedForecast;
    evening: TimeBasedForecast;
  };

  transitAnalysis: {
    primary: TransitAnalysisItem;
    secondary?: TransitAnalysisItem[];
  };

  relationshipInsights: string[]; // 5 insights: connection quality, communication, emotional tone, growth, challenges

  guidance: {
    focusOn: string;
    exploreTogether: string[];
    beMindfulOf: string[];
  };

  connectionPractice: {
    exercise: string;
    affirmation: string;
    reflectionPrompts: string[];
  };

  conclusion: string;
}

export interface TimeBasedForecast {
  energy: string;
  narrative: string;
  bestFor: string[];
  avoid: string[];
}

export interface TransitAnalysisItem {
  aspect: string;
  interpretation: string;
  timing: string;
  advice: string;
  timingData?: {
    peakTime?: string;
    duration?: string;
    strengthCurve?: number[]; // 24-hour strength values for visualization
  };
}

// =====================================================
// COMPATIBILITY ANALYSIS TYPES
// =====================================================

export interface CompatibilityReport {
  overall: CompatibilityCategory;
  romantic: CompatibilityCategory;
  communication: CompatibilityCategory;
  emotional: CompatibilityCategory;
  intellectual: CompatibilityCategory;
  values: CompatibilityCategory;

  topStrengths: string[];
  topChallenges: string[];
  advice: string[];
}

export interface CompatibilityCategory {
  score: number;  // 0-100
  rating: 'excellent' | 'good' | 'fair' | 'challenging';
  description: string;
  keyFactors: string[];
}

export interface SynastryHighlight {
  type: 'strength' | 'challenge' | 'karmic' | 'soulmate';
  title: string;
  description: string;
  aspectIds: string[];  // Related aspects
  importance: 'high' | 'medium' | 'low';
}

// =====================================================
// COMPOSITE CHART TYPES
// =====================================================

export interface CompositeChart extends NatalChartData {
  method: 'midpoint' | 'davison';
  relationshipThemes: RelationshipTheme[];
}

export interface RelationshipTheme {
  area: string;  // "Communication", "Emotional Bond", etc.
  description: string;
  indicators: string[];  // Planetary placements/aspects that contribute
  strength: number;  // 0-100
}

// =====================================================
// STATE TYPES
// =====================================================

export interface SocialState {
  // Connections
  connections: FriendConnection[];
  selectedConnection: FriendConnection | null;
  isLoadingConnections: boolean;
  connectionsError: string | null;

  // Invitations
  sentInvitations: ConnectionInvitation[];
  receivedInvitations: ConnectionInvitation[];
  isLoadingInvitations: boolean;
  invitationsError: string | null;

  // Saved Charts
  savedCharts: SavedChart[];
  selectedSavedChart: SavedChart | null;
  isLoadingSavedCharts: boolean;
  savedChartsError: string | null;

  // Synastry
  currentSynastryChart: SynastryChart | null;
  currentPartner: SynastryPartner | null;
  synastryReadings: SynastryReading[];
  isCalculatingSynastry: boolean;
  isGeneratingReading: boolean;
  synastryError: string | null;

  // Daily Synastry Forecasts
  dailySynastryForecasts: Record<string, DailySynastryForecast>; // Keyed by synastryChartId
  isLoadingForecast: boolean;
  isGeneratingForecast: boolean;
  forecastError: string | null;

  // UI state
  showInviteModal: boolean;
  inviteFriendCode: string;
  inviteMessage: string;
  myFriendCode: string | null;
}

// =====================================================
// API REQUEST/RESPONSE TYPES
// =====================================================

export interface SendInvitationRequest {
  friendCode: string;
  message?: string;
}

export interface SendInvitationResponse {
  success: boolean;
  invitation?: ConnectionInvitation;
  message: string;
}

export interface RespondToInvitationRequest {
  invitationId: string;
  accept: boolean;
}

export interface RespondToInvitationResponse {
  success: boolean;
  connection?: Connection;
  message: string;
}

export interface CalculateSynastryRequest {
  user1Id: string;
  user2Id: string;
  includeComposite?: boolean;
}

export interface CalculateSynastryResponse {
  success: boolean;
  synastryChart?: SynastryChart;
  message: string;
  errors?: string[];
}

export interface GenerateSynastryReadingRequest {
  synastryChartId: string;
  connectionId: string;
  relationshipContext?: string;
  detailLevel?: 'brief' | 'detailed' | 'comprehensive';
}

export interface GenerateSynastryReadingResponse {
  success: boolean;
  reading?: SynastryReading;
  message: string;
  fromCache?: boolean;
}

// =====================================================
// UTILITY TYPES
// =====================================================

export type SynastryAspectCategory =
  | 'romantic'
  | 'communication'
  | 'conflict'
  | 'growth'
  | 'karmic'
  | 'general';

export type RelationshipType =
  | 'romantic'
  | 'friendship'
  | 'business'
  | 'family'
  | 'general';

export type CompatibilityRating =
  | 'excellent'
  | 'good'
  | 'fair'
  | 'challenging';

// Export helper type guards
export function isHarmoniousAspect(aspectType: string): boolean {
  return ['trine', 'sextile', 'conjunction'].includes(aspectType);
}

export function isChallengingAspect(aspectType: string): boolean {
  return ['square', 'opposition', 'quincunx'].includes(aspectType);
}

export function getAspectCategory(planet1: string, planet2: string, aspectType: string): SynastryAspectCategory {
  // Venus-Mars aspects are romantic
  if ((planet1 === 'venus' && planet2 === 'mars') || (planet1 === 'mars' && planet2 === 'venus')) {
    return 'romantic';
  }

  // Mercury aspects are about communication
  if (planet1 === 'mercury' || planet2 === 'mercury') {
    return 'communication';
  }

  // Saturn, Pluto, Uranus can be challenging or karmic
  if (['saturn', 'pluto', 'uranus'].includes(planet1) || ['saturn', 'pluto', 'uranus'].includes(planet2)) {
    return isChallengingAspect(aspectType) ? 'conflict' : 'karmic';
  }

  // Jupiter, Neptune aspects often indicate growth
  if (planet1 === 'jupiter' || planet2 === 'jupiter') {
    return 'growth';
  }

  return 'general';
}
