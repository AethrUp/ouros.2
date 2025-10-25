// Tarot Types

export type TarotSuit = 'major' | 'wands' | 'cups' | 'swords' | 'pentacles';
export type CardOrientation = 'upright' | 'reversed';
export type InterpretationSource = 'ai' | 'static';

export interface TarotCard {
  id: string;
  name: string;
  number: number;
  suit: TarotSuit;
  uprightMeaning: string;
  reversedMeaning: string;
  keywords: string[];
  element?: string;
  astrology?: string;
  imageUri?: string; // Web uses string paths for images
}

export interface TarotReading {
  id: string;
  userId: string;
  createdAt: string;
  intention: string;
  spread: SpreadLayout;
  cards: DrawnCard[];
  interpretation: string | TarotInterpretation; // Support both legacy string and new structured format
  interpretationSource: InterpretationSource;
  metadata?: {
    generationTime?: number;
    model?: string;
    tokensUsed?: number;
    quantumSource?: 'quantum' | 'crypto';
  };
}

// New structured interpretation format (V2)
export interface TarotInterpretation {
  preview: {
    title: string;
    summary: string;
    tone: 'Supportive' | 'Challenging' | 'Transformative' | 'Illuminating';
  };

  fullContent: {
    overview: string;

    cardInsights: CardInsight[];

    synthesis: {
      narrative: string;
      mainTheme: string;
    };

    guidance: {
      understanding: string;
      actionSteps: string[];
      thingsToEmbrace: string[];
      thingsToRelease: string[];
    };

    timing: {
      immediateAction: string;
      nearFuture: string;
      longTerm: string;
    };

    keyInsight: string;

    reflectionPrompts: string[];

    conclusion: string;
  };
}

export interface CardInsight {
  position: string;
  cardName: string;
  interpretation: string;
}

export interface DrawnCard {
  card: TarotCard;
  position: string;
  orientation: CardOrientation;
  positionMeaning: string;
}

export interface SpreadLayout {
  id: string;
  name: string;
  description: string;
  cardCount: number;
  positions: SpreadPosition[];
}

export interface SpreadPosition {
  id: string;
  name: string;
  meaning: string;
  x: number; // 0-1 normalized for layout
  y: number; // 0-1 normalized for layout
  rotation?: number; // Optional rotation in degrees (0, 90, 180, 270)
}

export interface TarotSession {
  id: string;
  startedAt: number;
  spreadId: string;
  intention: string;
  drawnCards: DrawnCard[];
}

export type SessionStep = 'setup' | 'intention' | 'drawing' | 'reveal' | 'interpretation' | 'complete';
