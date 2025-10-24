/**
 * Dream Interpretation Types
 */

export interface DreamReading {
  id: string;
  userId: string;
  createdAt: string;
  dreamDescription: string;
  interpretation: string;
  interpretationSource: 'ai' | 'static';
}

export interface DreamState {
  // Current session state
  currentDreamSession: string | null; // Session ID
  dreamSessionStep: 'input' | 'interpreting' | 'complete';
  dreamDescription: string;
  dreamInterpretation: string | null;

  // State flags
  isGeneratingDreamInterpretation: boolean;
  dreamError: string | null;

  // Reading history
  dreamReadings: DreamReading[];
}
