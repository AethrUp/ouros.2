// I Ching Types

export type LineType = 'yin' | 'yang' | 'changing-yin' | 'changing-yang';
export type CastingMethod = 'three-coins' | 'yarrow-stalks';
export type InterpretationSource = 'ai' | 'static';

/**
 * Represents a single line in a hexagram
 * Lines are counted from bottom to top (1-6)
 */
export interface HexagramLine {
  position: number; // 1-6, bottom to top
  type: LineType;
  isChanging: boolean;
}

/**
 * Represents one of the 64 hexagrams
 */
export interface Hexagram {
  number: number; // 1-64
  chineseName: string;
  pinyinName: string;
  englishName: string;
  lines: [boolean, boolean, boolean, boolean, boolean, boolean]; // true = yang, false = yin, bottom to top
  upperTrigram: Trigram;
  lowerTrigram: Trigram;
  judgment: string;
  image: string;
  meaning: string;
  keywords: string[];
  element?: string;
  relatedHexagrams?: number[]; // Related hexagram numbers
}

/**
 * Represents the 8 trigrams
 */
export interface Trigram {
  id: string;
  chineseName: string;
  englishName: string;
  lines: [boolean, boolean, boolean]; // true = yang, false = yin
  element: string;
  attribute: string;
  family: string;
  direction: string;
  symbol: string;
}

/**
 * Structured interpretation for I Ching readings (Legacy format - V1)
 */
export interface IChingInterpretation {
  interpretation: {
    overview: string;                    // 2-3 sentence summary of the main message
    present_situation: string;           // What this hexagram reveals about their current circumstances
    trigram_dynamics: string;            // How the upper and lower trigrams interact to create meaning
    changing_lines: string | null;       // Analysis of any changing lines and their significance (or null if none)
    transformation: string | null;       // If relating hexagram exists, describe the journey from present to future (or null if no relating hexagram)
    guidance: string;                    // Practical advice and actionable wisdom
    timing: string;                      // Insights about when to act, when to wait, or natural timing
    key_insight: string;                 // The most important takeaway for their situation
  };
  tone: 'warm' | 'wise' | 'encouraging' | 'cautionary';
  confidence: 'high' | 'medium' | 'low';
}

/**
 * New structured interpretation format (V2)
 */
export interface IChingInterpretationV2 {
  preview: {
    title: string;
    summary: string;
    tone: 'Contemplative' | 'Dynamic' | 'Cautionary' | 'Auspicious';
  };

  fullContent: {
    overview: string;

    presentSituation: string;

    trigramDynamics: {
      interaction: string;
      upperMeaning: string;
      lowerMeaning: string;
    };

    changingLines: {
      present: string;
      significance: string;
    };

    transformation: {
      journey: string;
      futureState: string;
    };

    guidance: {
      wisdom: string;
      rightAction: string[];
      toEmbody: string[];
      toAvoid: string[];
    };

    timing: {
      nature: string;
      whenToAct: string;
      whenToWait: string;
    };

    keyInsight: string;

    reflectionPrompts: string[];

    conclusion: string;
  };
}

/**
 * A complete I Ching reading
 */
export interface IChingReading {
  id: string;
  userId: string;
  createdAt: string;
  question: string;
  castingMethod: CastingMethod;
  primaryHexagram: CastedHexagram;
  relatingHexagram?: CastedHexagram; // Present if there are changing lines
  interpretation: string | IChingInterpretation | IChingInterpretationV2; // Support legacy string, V1 structured, and V2 structured formats
  interpretationSource: InterpretationSource;
  metadata?: {
    generationTime?: number;
    model?: string;
    tokensUsed?: number;
    quantumSource?: 'quantum' | 'crypto';
  };
}

/**
 * A hexagram with its cast lines (including changing lines)
 */
export interface CastedHexagram {
  hexagram: Hexagram;
  lines: HexagramLine[];
  changingLines: number[]; // Positions of changing lines (1-6)
  lineInterpretations?: string[]; // Optional individual line interpretations
}

/**
 * Session state for an I Ching reading in progress
 */
export interface IChingSession {
  id: string;
  startedAt: number;
  question: string;
  castingMethod: CastingMethod;
  currentLine: number; // 0-5 during casting (maps to lines 1-6)
  castedLines: HexagramLine[];
  primaryHexagram?: CastedHexagram;
  relatingHexagram?: CastedHexagram;
}

/**
 * Different steps in an I Ching reading flow
 */
export type IChingSessionStep =
  | 'question'        // Entering question
  | 'loading'         // Fetching quantum random numbers
  | 'casting'         // Casting lines
  | 'result'          // Showing hexagrams
  | 'interpretation'  // Showing AI interpretation
  | 'complete';       // Reading saved

/**
 * Coin toss result for three-coin method
 */
export interface CoinToss {
  coins: [boolean, boolean, boolean]; // true = heads (yang), false = tails (yin)
  lineType: LineType;
  value: number; // 6, 7, 8, or 9
}

/**
 * State for I Ching slice in Zustand store
 */
export interface IChingState {
  // Current session
  sessionId: string | null;
  sessionStep: IChingSessionStep;
  question: string;
  castingMethod: CastingMethod;

  // Casting state
  currentLine: number;
  castedLines: HexagramLine[];
  isCasting: boolean;

  // Results
  primaryHexagram: CastedHexagram | null;
  relatingHexagram: CastedHexagram | null;

  // Interpretation
  interpretation: string | IChingInterpretation | IChingInterpretationV2;
  isGeneratingInterpretation: boolean;
  interpretationSource: InterpretationSource;

  // History
  readings: IChingReading[];

  // Error state
  ichingError: string | null;
}
