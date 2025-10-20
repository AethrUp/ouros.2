// User Profile Types
export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  friendCode?: string;
  timezone: string;
  language: string;
  createdAt: string;
  birthData?: BirthData;
  natalChart?: NatalChartData;
}

export interface BirthData {
  birthDate: string;           // ISO date string
  birthTime: string;            // HH:MM format
  timeUnknown: boolean;
  birthLocation: LocationData;
  timezone: string;
}

export interface LocationData {
  name: string;                 // "New York, NY, USA"
  latitude: number;
  longitude: number;
  timezone: string;             // "America/New_York"
  timezoneOffset: number;       // UTC offset in seconds (includes DST)
  country: string;
  region: string;
}

export interface UserPreferences {
  // Reading preferences
  interpretationStyle: 'mystical' | 'psychological' | 'practical';
  detailLevel: 'brief' | 'detailed' | 'comprehensive';
  focusAreas: string[];

  // UI preferences
  theme: 'light' | 'dark' | 'auto';
  selectedDeck: string;
  houseSystem: 'placidus' | 'whole-sign' | 'equal';

  // Notification preferences
  dailyHoroscope: boolean;
  readingReminders: boolean;
  journalPrompts: boolean;
}

// Natal Chart Interpretation Types
export interface WholeChartInterpretation {
  coreNature: string;           // Section 1: Your Core Nature (Sun, Moon, Rising)
  loveAndConnection: string;    // Section 2: How You Love & Connect (Venus, Mars, 7th House)
  growthEdge: string;           // Section 3: Your Growth Edge (North Node, Saturn, challenging aspects)
  giftsToWorld: string;         // Section 4: Your Gifts to the World (Midheaven, Jupiter, harmonious aspects)
}

// Natal Chart Types
export interface NatalChartData {
  planets: Record<string, PlanetPosition>;
  houses: HousePosition[];
  aspects: AspectData[];
  angles: Angles;
  metadata: ChartMetadata;
  wholeChartInterpretation?: WholeChartInterpretation;  // AI-generated overall chart synthesis
}

export interface PlanetPosition {
  planet: string;               // "sun", "moon", etc.
  sign: string;                 // "aries", "taurus", etc.
  degree: number;               // 0-359.99
  longitude: number;            // Absolute longitude
  latitude: number;             // Declination
  house: number;                // 1-12
  retrograde: boolean;
  speed: number;
  personalizedDescription?: PersonalizedDescription;
}

export interface HousePosition {
  house: number;                // 1-12
  sign: string;
  degree: number;
  longitude: number;
}

export interface AspectData {
  id: string;
  planet1: string;
  planet2: string;
  type: AspectType;
  angle: number;
  orb: number;
  strength: number;             // 0-1
  applying: boolean;
  element: 'fire' | 'air' | 'water' | 'earth';
}

export interface Angles {
  ascendant: number;
  midheaven: number;
  descendant: number;
  imumCoeli: number;
}

export interface ChartMetadata {
  houseSystem: string;
  precision: string;
  dataSource: string;
  calculationMethod: string;
  generatedAt: string;
  version: string;
}

export interface PersonalizedDescription {
  brief: string;
  detailed: string;
  keywords: string[];
  generatedAt: string;
  version: string;
}

export type AspectType =
  | 'conjunction'
  | 'opposition'
  | 'trine'
  | 'square'
  | 'sextile'
  | 'semi_sextile'
  | 'quintile'
  | 'bi_quintile'
  | 'quincunx';
