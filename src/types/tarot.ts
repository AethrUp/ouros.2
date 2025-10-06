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
  imageUri: any; // SVG component or require() result for images
}

export interface TarotReading {
  id: string;
  userId: string;
  createdAt: string;
  intention: string;
  spread: SpreadLayout;
  cards: DrawnCard[];
  interpretation: string;
  interpretationSource: InterpretationSource;
  metadata?: {
    generationTime?: number;
    model?: string;
    tokensUsed?: number;
    quantumSource?: 'quantum' | 'crypto';
  };
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
