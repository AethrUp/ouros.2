// Reading and Horoscope Types

export interface DailyHoroscope {
  date: string; // YYYY-MM-DD

  // Lightweight preview for home screen
  preview: {
    title: string;
    summary: string;
    weather: {
      moon: {
        description: string;
        aspects: {
          emotions: number;
          intuition: number;
          comfort: number;
        };
      };
      venus: {
        description: string;
        aspects: {
          love: number;
          beauty: number;
          pleasure: number;
        };
      };
      mercury: {
        description: string;
        aspects: {
          communication: number;
          thinking: number;
          movement: number;
        };
      };
    };
    categoryAdvice: Record<string, CategoryAdvice>;
  };

  // Full content loaded on demand
  fullContent: {
    fullReading: FullReading;
    transitAnalysis: TransitAnalysisContent;
    timeGuidance: TimeGuidance;
    spiritualGuidance: SpiritualGuidance;
    transitInsights: string[];
    astronomicalData?: any;
    explore: string[];
    limit: string[];
    dailyFocus: string;
    advice: string;
  };

  // Combined for backward compatibility
  content: HoroscopeContent;

  hasFullReading: boolean;
  lastUpdated: string; // ISO timestamp
}

export interface FullReading {
  introduction: string;
  bodyParagraphs: [string, string, string]; // Morning, Afternoon, Evening
  conclusion: string;
}

export interface TransitTimingData {
  peakHour: number; // Hour of day (0-23) when strongest
  effectiveStartHour: number; // Hour when effect begins
  effectiveEndHour: number; // Hour when effect ends
  strengthCurve: number[]; // 24 values (0-100) for each hour 0-23
  planetSpeed: 'fast' | 'slow'; // Speed category of transiting planet
}

export interface TransitAnalysisItem {
  aspect: string;
  planet?: string; // Transiting planet (e.g., "Neptune")
  natalPlanet?: string; // Natal planet (e.g., "Chiron")
  aspectType?: string; // Aspect type (e.g., "conjunction")
  baseStrength?: number; // Base strength from Swiss Ephemeris (0-100)
  interpretation: string;
  timing: string; // Human-readable timing (e.g., "Most active in early afternoon")
  timingData?: TransitTimingData; // Structured data for graphing
  advice: string;
}

export interface TransitAnalysisContent {
  primary: TransitAnalysisItem;
  secondary: TransitAnalysisItem[];
}

export interface TimeGuidance {
  morning: TimeGuidanceEntry;
  afternoon: TimeGuidanceEntry;
  evening: TimeGuidanceEntry;
}

export interface TimeGuidanceEntry {
  energy: string;
  bestFor: string[];
  avoid: string[];
}

export interface SpiritualGuidance {
  meditation: string;
  affirmation: string;
  journalPrompts: string[];
}

export interface CategoryAdvice {
  title: string;
  content: string;
}

export interface HoroscopeContent {
  title: string;
  summary: string;
  fullReading?: FullReading;
  transitAnalysis?: TransitAnalysisContent;
  timeGuidance?: TimeGuidance;
  spiritualGuidance?: SpiritualGuidance;
  transitInsights?: string[];
  dailyFocus?: string;
  advice?: string;
  explore?: string[];
  limit?: string[];
  weather?: {
    moon: {
      description: string;
      aspects: {
        emotions: number;
        intuition: number;
        comfort: number;
      };
    };
    venus: {
      description: string;
      aspects: {
        love: number;
        beauty: number;
        pleasure: number;
      };
    };
    mercury: {
      description: string;
      aspects: {
        communication: number;
        thinking: number;
        movement: number;
      };
    };
  };
  categoryAdvice: Record<string, CategoryAdvice>;
}

export interface CosmicWeather {
  date: string; // YYYY-MM-DD
  moon: {
    title: string;
    description: string;
    symbol: string;
  };
  venus: {
    title: string;
    description: string;
    symbol: string;
  };
  mercury: {
    title: string;
    description: string;
    symbol: string;
  };
  lastUpdated: string; // ISO timestamp
}

export interface HoroscopeGenerationMetadata {
  source: 'anthropic_ai';
  model: string;
  timestamp: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  dataQuality: {
    astrologyApiUsed: boolean;
    transitCount: number;
    significantTransits: number;
    confidence: 'low' | 'medium' | 'high' | 'very_high';
    hasExpandedContent: boolean;
  };
}

// Reading State
export interface ReadingState {
  // Daily horoscope
  dailyHoroscope: DailyHoroscope | null;
  cosmicWeather: CosmicWeather | null;

  // Loading states
  isLoadingDailyReading: boolean;
  isGeneratingHoroscope: boolean;
  dailyReadingError: string | null;

  // Metadata
  lastHoroscopeDate: string | null;
  lastGenerationMetadata: HoroscopeGenerationMetadata | null;
}
