import { NatalChartData, AspectData, PlanetPosition } from './user';

// Chart State Types
export interface ChartState {
  // Current chart data
  natalChart: NatalChartData | null;
  currentTransits: TransitData | null;

  // Chart calculation state
  isCalculating: boolean;
  calculationError: string | null;
  lastCalculated: number | null;

  // Chart display preferences
  selectedPlanet: string | null;
  selectedHouse: number | null;
  selectedAspect: string | null;
  aspectFilter: AspectType[];
  showTransits: boolean;
}

export interface TransitData {
  planets: Record<string, PlanetPosition>;
  aspects: AspectData[];
  timestamp: string;
}

export interface ChartGenerationOptions {
  houseSystem: 'placidus' | 'whole-sign' | 'equal' | 'koch' | 'campanus';
  precision: 'standard' | 'professional';
  includeReports: boolean;
  includeAspects: boolean;
  includeMinorAspects: boolean;
  includeMidpoints: boolean;
  forceRegenerate?: boolean;
  maxAgeHours?: number;
}

export interface ChartGenerationResult {
  success: boolean;
  data?: any;
  message: string;
  fromCache?: boolean;
  errors?: string[];
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

// Swiss Ephemeris API Types
export interface SwissEphRequest {
  birthDate: string;
  birthTime: string;
  birthLocation: {
    latitude: number;
    longitude: number;
    name: string;
  };
  timezone: string;
}

export interface SwissEphOptions {
  houseSystem: string;
  includeReports: boolean;
  includeAspects: boolean;
}

export interface SwissEphResponse {
  planets: Record<string, PlanetPosition>;
  houses: any[];
  aspects: AspectData[];
  angles: {
    ascendant: number;
    midheaven: number;
    descendant: number;
    imumCoeli: number;
  };
  metadata: {
    calculationMethod: string;
    houseSystem: string;
    precision: string;
    timestamp: string;
  };
}
