# Tarot Implementation Plan - Phase 4

## Overview
Implementation plan for adding Tarot reading functionality to Ouros2, aligned with existing app architecture and patterns.

---

## Architecture Analysis

**Current Stack:**
- **State**: Zustand with persistence (AsyncStorage)
- **Navigation**: React Navigation with tab-based structure
- **Styling**: Custom theme system (colors, spacing, typography)
- **AI**: Anthropic API for personalized interpretations
- **Backend**: Supabase for data storage
- **Patterns**: Screen → Components → Handlers → Utils structure

**Hexagram Data Source:**
- Repository: `adamblvck/iching-wilhelm-dataset`
- License: MIT
- Contains: 64 hexagrams with Wilhelm translation in JSON format
- Fields: hex number, Chinese characters, binary, trigrams, judgment, image, line interpretations

---

## 1. Data Layer (Foundation)

### 1.1 Tarot Card Library
**File:** `src/data/tarot/tarotCards.ts`

```typescript
export const TAROT_DECK: TarotCard[] = [
  // Major Arcana (0-21)
  {
    id: 'fool',
    name: 'The Fool',
    number: 0,
    suit: 'major',
    uprightMeaning: 'New beginnings, innocence, spontaneity, free spirit',
    reversedMeaning: 'Recklessness, taken advantage of, inconsideration',
    keywords: ['beginnings', 'innocence', 'spontaneity', 'free spirit'],
    element: 'Air',
    astrology: 'Uranus',
    imageUri: require('../../assets/tarot/rider-waite/00-fool.png')
  },
  // ... 21 more Major Arcana cards

  // Minor Arcana - Wands (Ace - King) x 14
  // Minor Arcana - Cups (Ace - King) x 14
  // Minor Arcana - Swords (Ace - King) x 14
  // Minor Arcana - Pentacles (Ace - King) x 14
  // Total: 78 cards
];
```

### 1.2 Spread Definitions
**File:** `src/data/tarot/spreads.ts`

```typescript
export const TAROT_SPREADS: SpreadLayout[] = [
  {
    id: 'single-card',
    name: 'Single Card',
    description: 'Quick insight or daily guidance',
    cardCount: 1,
    positions: [
      {
        id: 'card-1',
        name: 'Insight',
        meaning: 'What you need to know right now',
        x: 0.5,
        y: 0.5
      }
    ]
  },
  {
    id: 'three-card',
    name: 'Past, Present, Future',
    description: 'Classic three-card spread for clarity on a situation',
    cardCount: 3,
    positions: [
      { id: 'past', name: 'Past', meaning: 'Influences from the past', x: 0.2, y: 0.5 },
      { id: 'present', name: 'Present', meaning: 'Current situation', x: 0.5, y: 0.5 },
      { id: 'future', name: 'Future', meaning: 'Potential outcome', x: 0.8, y: 0.5 }
    ]
  },
  {
    id: 'celtic-cross',
    name: 'Celtic Cross',
    description: 'Comprehensive 10-card reading for deep insight',
    cardCount: 10,
    positions: [
      { id: 'present', name: 'Present', meaning: 'Current situation', x: 0.5, y: 0.5 },
      { id: 'challenge', name: 'Challenge', meaning: 'Immediate challenge', x: 0.5, y: 0.5 },
      { id: 'past', name: 'Past', meaning: 'Past influences', x: 0.3, y: 0.5 },
      { id: 'future', name: 'Future', meaning: 'Near future', x: 0.7, y: 0.5 },
      { id: 'above', name: 'Above', meaning: 'Conscious goal', x: 0.5, y: 0.3 },
      { id: 'below', name: 'Below', meaning: 'Unconscious influence', x: 0.5, y: 0.7 },
      { id: 'advice', name: 'Advice', meaning: 'Guidance', x: 0.85, y: 0.7 },
      { id: 'external', name: 'External', meaning: 'External influences', x: 0.85, y: 0.5 },
      { id: 'hopes', name: 'Hopes & Fears', meaning: 'Inner desires/fears', x: 0.85, y: 0.3 },
      { id: 'outcome', name: 'Outcome', meaning: 'Potential outcome', x: 0.85, y: 0.1 }
    ]
  }
];
```

### 1.3 Image Organization
```
assets/
└── tarot/
    └── rider-waite/          # Single deck to start
        ├── 00-fool.png
        ├── 01-magician.png
        ├── ...
        ├── 21-world.png
        ├── wands-ace.png
        ├── ...
        ├── pentacles-king.png
        └── card-back.png     # For unrevealed cards
```

**Image Specs:**
- Format: PNG with transparency
- Size: ~300x525px (standard tarot ratio)
- Optimized: ~50-100KB per image
- Total deck size: ~4-8MB

---

## 2. Type Definitions

**File:** `src/types/tarot.ts`

```typescript
export interface TarotCard {
  id: string;
  name: string;
  number: number;
  suit: 'major' | 'wands' | 'cups' | 'swords' | 'pentacles';
  uprightMeaning: string;
  reversedMeaning: string;
  keywords: string[];
  element?: string;
  astrology?: string;
  imageUri: any; // require() result
}

export interface TarotReading {
  id: string;
  userId: string;
  createdAt: string;
  intention: string;
  spread: SpreadLayout;
  cards: DrawnCard[];
  interpretation: string;
  interpretationSource: 'ai' | 'static';
  metadata?: {
    generationTime?: number;
    model?: string;
    tokensUsed?: number;
  };
}

export interface DrawnCard {
  card: TarotCard;
  position: string;
  orientation: 'upright' | 'reversed';
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
}

export interface TarotSession {
  id: string;
  startedAt: number;
  spreadId: string;
  intention: string;
  drawnCards: DrawnCard[];
}
```

**Update:** `src/types/index.ts`
```typescript
export * from './tarot';
```

---

## 3. State Management

**File:** `src/store/slices/tarotSlice.ts`

```typescript
import { StateCreator } from 'zustand';
import { TarotCard, TarotReading, TarotSession, DrawnCard, SpreadLayout } from '../../types/tarot';

export interface TarotSlice {
  // Session state
  currentSession: TarotSession | null;
  sessionStep: 'setup' | 'intention' | 'drawing' | 'interpretation' | 'complete';

  // Session data
  selectedSpread: SpreadLayout | null;
  intention: string;
  drawnCards: DrawnCard[];
  interpretation: string | null;

  // Loading states
  isDrawing: boolean;
  isGeneratingInterpretation: boolean;
  tarotError: string | null;

  // History
  readings: TarotReading[];
  isLoadingHistory: boolean;

  // Actions
  startSession: (spread: SpreadLayout) => void;
  setIntention: (intention: string) => void;
  drawCards: () => Promise<void>;
  generateInterpretation: () => Promise<void>;
  saveReading: () => Promise<void>;
  clearSession: () => void;
  loadHistory: () => Promise<void>;
  deleteReading: (readingId: string) => Promise<void>;
}

export const createTarotSlice: StateCreator<TarotSlice> = (set, get) => ({
  currentSession: null,
  sessionStep: 'setup',
  selectedSpread: null,
  intention: '',
  drawnCards: [],
  interpretation: null,
  isDrawing: false,
  isGeneratingInterpretation: false,
  tarotError: null,
  readings: [],
  isLoadingHistory: false,

  startSession: (spread) => {
    set({
      currentSession: {
        id: Date.now().toString(),
        startedAt: Date.now(),
        spreadId: spread.id,
        intention: '',
        drawnCards: []
      },
      selectedSpread: spread,
      sessionStep: 'intention',
      drawnCards: [],
      interpretation: null,
      intention: '',
      tarotError: null
    });
  },

  setIntention: (intention) => {
    set({ intention });
    if (get().currentSession) {
      set({
        currentSession: {
          ...get().currentSession!,
          intention
        }
      });
    }
  },

  drawCards: async () => {
    const { selectedSpread } = get();
    if (!selectedSpread) return;

    set({ isDrawing: true, tarotError: null, sessionStep: 'drawing' });

    try {
      const { handleDrawCards } = await import('../../handlers/tarotReading');
      const drawnCards = await handleDrawCards(selectedSpread);

      set({
        drawnCards,
        isDrawing: false,
        sessionStep: 'interpretation',
        currentSession: {
          ...get().currentSession!,
          drawnCards
        }
      });
    } catch (error) {
      set({
        isDrawing: false,
        tarotError: error instanceof Error ? error.message : 'Failed to draw cards'
      });
    }
  },

  generateInterpretation: async () => {
    set({ isGeneratingInterpretation: true, tarotError: null });

    try {
      const { generateTarotInterpretation } = await import('../../handlers/tarotReading');
      const { intention, drawnCards } = get();
      const interpretation = await generateTarotInterpretation(intention, drawnCards);

      set({
        interpretation,
        isGeneratingInterpretation: false,
        sessionStep: 'complete'
      });
    } catch (error) {
      set({
        isGeneratingInterpretation: false,
        tarotError: error instanceof Error ? error.message : 'Failed to generate interpretation'
      });
    }
  },

  saveReading: async () => {
    const { currentSession, selectedSpread, drawnCards, interpretation, intention } = get();
    if (!currentSession || !selectedSpread || !interpretation) return;

    try {
      const { saveTarotReading } = await import('../../handlers/tarotReading');
      const reading = await saveTarotReading({
        intention,
        spread: selectedSpread,
        drawnCards,
        interpretation
      });

      set({
        readings: [reading, ...get().readings]
      });
    } catch (error) {
      console.error('Failed to save reading:', error);
    }
  },

  clearSession: () => {
    set({
      currentSession: null,
      sessionStep: 'setup',
      selectedSpread: null,
      intention: '',
      drawnCards: [],
      interpretation: null,
      tarotError: null
    });
  },

  loadHistory: async () => {
    set({ isLoadingHistory: true });

    try {
      const { loadTarotHistory } = await import('../../handlers/tarotReading');
      const readings = await loadTarotHistory();
      set({ readings, isLoadingHistory: false });
    } catch (error) {
      set({ isLoadingHistory: false });
    }
  },

  deleteReading: async (readingId) => {
    try {
      const { deleteTarotReading } = await import('../../handlers/tarotReading');
      await deleteTarotReading(readingId);
      set({
        readings: get().readings.filter(r => r.id !== readingId)
      });
    } catch (error) {
      console.error('Failed to delete reading:', error);
    }
  }
});
```

**Update:** `src/store/index.ts`
```typescript
import { createTarotSlice, TarotSlice } from './slices/tarotSlice';

export type AppStore = AppSlice & AuthSlice & UserSlice & ChartSlice & ReadingSlice & TarotSlice;

export const useAppStore = create<AppStore>()(
  persist(
    (...args) => ({
      ...createAppSlice(...args),
      ...createAuthSlice(...args),
      ...createUserSlice(...args),
      ...createChartSlice(...args),
      ...createReadingSlice(...args),
      ...createTarotSlice(...args), // Add tarot slice
    }),
    {
      name: 'ouros2-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialPersist: (state) => ({
        // ... existing persistence
        // Add tarot readings to persistence
        readings: state.readings, // Will include tarot readings
      }),
    }
  )
);
```

---

## 4. Screen Implementation

**File:** `src/screens/TarotScreen.tsx`

```typescript
import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useAppStore } from '../store';
import { SpreadSelector } from '../components/tarot/SpreadSelector';
import { IntentionInput } from '../components/tarot/IntentionInput';
import { CardDrawAnimation } from '../components/tarot/CardDrawAnimation';
import { InterpretationDisplay } from '../components/tarot/InterpretationDisplay';
import { HeaderBar } from '../components/HeaderBar';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { TAROT_SPREADS } from '../data/tarot/spreads';
import { theme } from '../styles/theme';

export const TarotScreen = ({ navigation }) => {
  const {
    sessionStep,
    selectedSpread,
    intention,
    drawnCards,
    interpretation,
    isDrawing,
    isGeneratingInterpretation,
    startSession,
    setIntention,
    drawCards,
    generateInterpretation,
    saveReading,
    clearSession
  } = useAppStore();

  const handleSpreadSelect = (spread) => {
    startSession(spread);
  };

  const handleIntentionSubmit = () => {
    drawCards();
  };

  const handleDrawComplete = () => {
    generateInterpretation();
  };

  const handleSaveAndJournal = async () => {
    await saveReading();
    navigation.navigate('Journal', {
      linkedReadingId: Date.now().toString(),
      readingType: 'tarot'
    });
  };

  const handleNewReading = () => {
    clearSession();
  };

  return (
    <View style={styles.container}>
      <HeaderBar
        title="Tarot Reading"
        leftAction={
          sessionStep !== 'setup' ? {
            icon: 'close',
            onPress: clearSession
          } : undefined
        }
      />

      <ScrollView contentContainerStyle={styles.content}>
        {sessionStep === 'setup' && (
          <SpreadSelector
            spreads={TAROT_SPREADS}
            onSelect={handleSpreadSelect}
          />
        )}

        {sessionStep === 'intention' && (
          <IntentionInput
            value={intention}
            onChange={setIntention}
            onSubmit={handleIntentionSubmit}
            onSkip={drawCards}
            spreadName={selectedSpread?.name}
          />
        )}

        {sessionStep === 'drawing' && (
          <CardDrawAnimation
            spread={selectedSpread!}
            cards={drawnCards}
            isDrawing={isDrawing}
            onComplete={handleDrawComplete}
          />
        )}

        {sessionStep === 'interpretation' && (
          <>
            {isGeneratingInterpretation ? (
              <LoadingSpinner
                text="The cards are speaking..."
                overlay
              />
            ) : null}
          </>
        )}

        {sessionStep === 'complete' && (
          <InterpretationDisplay
            interpretation={interpretation!}
            cards={drawnCards}
            spread={selectedSpread!}
            intention={intention}
            onSaveAndJournal={handleSaveAndJournal}
            onNewReading={handleNewReading}
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  content: {
    padding: theme.spacing.lg,
    flexGrow: 1
  }
});
```

---

## 5. Core Components

### 5.1 SpreadSelector
**File:** `src/components/tarot/SpreadSelector.tsx`

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SpreadLayout } from '../../types/tarot';
import { theme } from '../../styles/theme';

interface SpreadSelectorProps {
  spreads: SpreadLayout[];
  onSelect: (spread: SpreadLayout) => void;
}

export const SpreadSelector: React.FC<SpreadSelectorProps> = ({ spreads, onSelect }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Your Spread</Text>

      {spreads.map(spread => (
        <TouchableOpacity
          key={spread.id}
          style={styles.spreadCard}
          onPress={() => onSelect(spread)}
        >
          <Text style={styles.spreadName}>{spread.name}</Text>
          <Text style={styles.spreadDescription}>{spread.description}</Text>
          <Text style={styles.cardCount}>{spread.cardCount} card{spread.cardCount > 1 ? 's' : ''}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.md
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg
  },
  spreadCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.md
  },
  spreadName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs
  },
  spreadDescription: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm
  },
  cardCount: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium
  }
});
```

### 5.2 IntentionInput
**File:** `src/components/tarot/IntentionInput.tsx`

### 5.3 CardDrawAnimation
**File:** `src/components/tarot/CardDrawAnimation.tsx`

### 5.4 TarotCard
**File:** `src/components/tarot/TarotCard.tsx`

### 5.5 TarotSpread
**File:** `src/components/tarot/TarotSpread.tsx`

### 5.6 InterpretationDisplay
**File:** `src/components/tarot/InterpretationDisplay.tsx`

### 5.7 ReadingHistory
**File:** `src/components/tarot/ReadingHistory.tsx`

---

## 6. Handlers

**File:** `src/handlers/tarotReading.ts`

```typescript
import { TarotCard, DrawnCard, SpreadLayout, TarotReading } from '../types/tarot';
import { TAROT_DECK } from '../data/tarot/tarotCards';
import { getQuantumRandom } from '../utils/quantumRandom';
import { constructTarotPrompt } from '../utils/tarotPromptTemplate';
import { callAnthropicAPI } from '../utils/anthropicClient';
import { useAppStore } from '../store';
import { supabase } from '../utils/supabase';

/**
 * Draw cards using quantum random number generation
 */
export const handleDrawCards = async (spread: SpreadLayout): Promise<DrawnCard[]> => {
  // Request twice as many random numbers:
  // - First set for card selection
  // - Second set for orientation (upright/reversed)
  const randomNumbers = await getQuantumRandom(spread.cardCount * 2);

  const drawnCards: DrawnCard[] = [];
  const usedIndices = new Set<number>();

  spread.positions.forEach((position, idx) => {
    // Select unique card
    let cardIndex = randomNumbers[idx] % TAROT_DECK.length;

    // Ensure no duplicates
    while (usedIndices.has(cardIndex)) {
      cardIndex = (cardIndex + 1) % TAROT_DECK.length;
    }
    usedIndices.add(cardIndex);

    // Determine orientation
    const orientation = randomNumbers[spread.cardCount + idx] % 2 === 0
      ? 'upright'
      : 'reversed';

    drawnCards.push({
      card: TAROT_DECK[cardIndex],
      position: position.name,
      orientation,
      positionMeaning: position.meaning
    });
  });

  return drawnCards;
};

/**
 * Generate AI-powered interpretation
 */
export const generateTarotInterpretation = async (
  intention: string,
  drawnCards: DrawnCard[]
): Promise<string> => {
  const store = useAppStore.getState();
  const { profile, birthData, preferences } = store;

  // Build personalization context
  const context = {
    birthData,
    preferences,
    currentDate: new Date().toISOString()
  };

  // Construct prompt
  const prompt = constructTarotPrompt({
    intention,
    cards: drawnCards,
    context,
    style: preferences?.interpretationStyle || 'psychological',
    detailLevel: preferences?.detailLevel || 'detailed'
  });

  // Call Anthropic API
  const interpretation = await callAnthropicAPI(prompt);

  return interpretation;
};

/**
 * Save reading to database
 */
export const saveTarotReading = async (data: {
  intention: string;
  spread: SpreadLayout;
  drawnCards: DrawnCard[];
  interpretation: string;
}): Promise<TarotReading> => {
  const store = useAppStore.getState();
  const userId = store.user?.id;

  if (!userId) throw new Error('User not authenticated');

  const reading: TarotReading = {
    id: Date.now().toString(),
    userId,
    createdAt: new Date().toISOString(),
    intention: data.intention,
    spread: data.spread,
    cards: data.drawnCards,
    interpretation: data.interpretation,
    interpretationSource: 'ai'
  };

  // Save to Supabase
  const { error } = await supabase
    .from('tarot_readings')
    .insert({
      id: reading.id,
      user_id: reading.userId,
      created_at: reading.createdAt,
      intention: reading.intention,
      spread_id: reading.spread.id,
      cards: reading.cards,
      interpretation: reading.interpretation,
      interpretation_source: reading.interpretationSource
    });

  if (error) throw error;

  return reading;
};

/**
 * Load user's tarot reading history
 */
export const loadTarotHistory = async (): Promise<TarotReading[]> => {
  const store = useAppStore.getState();
  const userId = store.user?.id;

  if (!userId) return [];

  const { data, error } = await supabase
    .from('tarot_readings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;

  return data as TarotReading[];
};

/**
 * Delete a reading
 */
export const deleteTarotReading = async (readingId: string): Promise<void> => {
  const { error } = await supabase
    .from('tarot_readings')
    .delete()
    .eq('id', readingId);

  if (error) throw error;
};
```

---

## 7. Utils & Helpers

### 7.1 Quantum Random Generator
**File:** `src/utils/quantumRandom.ts`

```typescript
/**
 * Get quantum random numbers from ANU Quantum Random Number Generator
 * Falls back to cryptographically secure random if API unavailable
 */
export const getQuantumRandom = async (count: number): Promise<number[]> => {
  try {
    // ANU Quantum Random Number Generator API
    const response = await fetch(
      `https://qrng.anu.edu.au/API/jsonI.php?length=${count}&type=uint8`,
      { timeout: 5000 }
    );

    if (!response.ok) throw new Error('Quantum API request failed');

    const data = await response.json();

    if (data.success && Array.isArray(data.data)) {
      console.log('✨ Using quantum random numbers');
      return data.data;
    }

    throw new Error('Invalid quantum API response');
  } catch (error) {
    console.warn('Quantum API unavailable, using crypto fallback:', error);
    return getCryptoRandom(count);
  }
};

/**
 * Cryptographically secure fallback random number generator
 */
const getCryptoRandom = (count: number): number[] => {
  const array = new Uint8Array(count);

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < count; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }

  return Array.from(array);
};
```

### 7.2 Tarot Prompt Template
**File:** `src/utils/tarotPromptTemplate.ts`

```typescript
import { DrawnCard } from '../types/tarot';

interface TarotPromptParams {
  intention: string;
  cards: DrawnCard[];
  context: any;
  style: 'mystical' | 'psychological' | 'practical';
  detailLevel: 'brief' | 'detailed' | 'comprehensive';
}

export const constructTarotPrompt = (params: TarotPromptParams): string => {
  const { intention, cards, context, style, detailLevel } = params;

  // Format astrological context if available
  const astroContext = context.birthData
    ? `Sun in ${context.birthData.sunSign}, Moon in ${context.birthData.moonSign}, Rising ${context.birthData.risingSign}`
    : 'Astrological data not available';

  // Build card details
  const cardDetails = cards.map((dc, idx) => `
${idx + 1}. **Position: ${dc.position}** (${dc.positionMeaning})
   - **Card:** ${dc.card.name} (${dc.orientation})
   - **Keywords:** ${dc.card.keywords.join(', ')}
   - **Meaning:** ${dc.orientation === 'upright' ? dc.card.uprightMeaning : dc.card.reversedMeaning}
   ${dc.card.astrology ? `- **Astrology:** ${dc.card.astrology}` : ''}
   ${dc.card.element ? `- **Element:** ${dc.card.element}` : ''}
`).join('\n');

  // Style-specific guidance
  const styleGuidance = {
    mystical: 'Use symbolic, archetypal language. Connect to universal spiritual themes and esoteric wisdom.',
    psychological: 'Focus on personal growth, shadow work, and inner psychology. Use Jung-inspired interpretations.',
    practical: 'Provide concrete, actionable advice. Focus on real-world applications and next steps.'
  };

  // Detail level guidance
  const detailGuidance = {
    brief: '2-3 paragraphs total. Concise and direct.',
    detailed: '4-6 paragraphs. Thorough card analysis with synthesis.',
    comprehensive: '7-10 paragraphs. Deep dive into each card, connections, and guidance.'
  };

  return `You are an experienced and insightful tarot reader providing a deeply personalized interpretation.

**CONTEXT:**
- User's Intention: ${intention || 'General guidance and insight'}
- Reading Date: ${new Date().toLocaleDateString()}
- User's Astrological Profile: ${astroContext}
- Interpretation Style: ${style}
- Detail Level: ${detailLevel}

**CARDS DRAWN:**
${cardDetails}

**YOUR TASK:**
Provide a ${detailLevel} interpretation that:

1. **Addresses the Intention:** Directly speak to their question or intention
2. **Weaves Cards Together:** Create a cohesive narrative connecting all cards
3. **Considers Position Meanings:** Each card's meaning is influenced by its position
4. **Honors Orientation:** Reversed cards offer nuanced or shadow perspectives
5. **Incorporates Astrological Context:** When relevant, connect to their birth chart
6. **Matches Style:** ${styleGuidance[style]}
7. **Provides Guidance:** Offer practical wisdom for moving forward

**STRUCTURE YOUR RESPONSE:**

${detailLevel === 'brief' ? `
- **Opening:** 1-2 sentences summarizing the overall message
- **Card Synthesis:** Brief interpretation weaving cards together
- **Guidance:** Actionable advice (2-3 sentences)
` : detailLevel === 'detailed' ? `
- **Opening:** Paragraph setting context and overall energy
- **Card Analysis:** 1 paragraph per card in context of spread
- **Synthesis:** How cards interact and create a larger message
- **Practical Guidance:** Concrete next steps and advice
` : `
- **Opening:** Rich introduction to reading's energy and themes
- **Individual Cards:** Deep dive into each card's position and meaning
- **Card Interactions:** How cards relate, support, or challenge each other
- **Synthesis:** The complete story the cards are telling
- **Spiritual Wisdom:** Deeper esoteric or psychological insights
- **Practical Application:** Actionable steps and advice
- **Closing:** Empowering conclusion
`}

**IMPORTANT:**
- Be warm, insightful, and empowering
- Avoid generic platitudes; be specific to their cards and situation
- Balance honesty with compassion (especially for challenging cards)
- Focus on growth and possibility
- Write in second person ("you")
- No markdown formatting in the response

Begin your interpretation:`;
};
```

---

## 8. Navigation Integration

**Update:** `src/navigation/TabNavigator.tsx`

```typescript
import { TarotScreen } from '../screens/TarotScreen';

// Add to tab navigator
<Tab.Screen
  name="Tarot"
  component={TarotScreen}
  options={{
    tabBarIcon: ({ color, size }) => (
      <Icon name="cards-outline" size={size} color={color} />
    ),
    tabBarLabel: 'Tarot',
    headerShown: false
  }}
/>
```

**Update:** `src/screens/HomeScreen.tsx`
```typescript
// Add quick action for daily card
const handleDailyCard = () => {
  navigation.navigate('Tarot');
  // Auto-start single card spread
};

// In render:
<QuickAction
  icon="cards"
  title="Daily Card"
  onPress={handleDailyCard}
/>
```

---

## 9. Styling

**File:** `src/styles/components/tarotStyles.js`

```javascript
import { theme } from '../theme';

export const tarotStyles = {
  // Card dimensions (standard tarot ratio ~1:1.75)
  card: {
    width: 120,
    height: 210,
    borderRadius: theme.borderRadius.md,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    backgroundColor: theme.colors.card
  },

  cardReversed: {
    transform: [{ rotate: '180deg' }]
  },

  cardBack: {
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: theme.colors.primaryLight
  },

  // Spread layouts
  spreadContainer: {
    flex: 1,
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center'
  },

  singleCardLayout: {
    alignItems: 'center',
    justifyContent: 'center'
  },

  threeCardLayout: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'center'
  },

  celticCrossLayout: {
    width: '100%',
    height: '100%',
    position: 'relative'
  },

  // Position markers
  positionLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs
  },

  // Interpretation styling
  interpretation: {
    fontSize: theme.fontSize.md,
    lineHeight: 24,
    color: theme.colors.text,
    marginBottom: theme.spacing.md
  },

  interpretationSection: {
    marginBottom: theme.spacing.lg
  },

  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm
  }
};
```

---

## 10. Database Schema

**Supabase Migration:** `tarot_readings` table

```sql
-- Create tarot_readings table
CREATE TABLE tarot_readings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Reading data
  intention TEXT,
  spread_id TEXT NOT NULL,
  cards JSONB NOT NULL, -- Array of DrawnCard objects
  interpretation TEXT NOT NULL,
  interpretation_source TEXT DEFAULT 'ai' CHECK (interpretation_source IN ('ai', 'static')),

  -- Metadata
  metadata JSONB,

  -- Indexes
  CONSTRAINT tarot_readings_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_tarot_readings_user_created
  ON tarot_readings(user_id, created_at DESC);

CREATE INDEX idx_tarot_readings_spread
  ON tarot_readings(spread_id);

-- Enable Row Level Security
ALTER TABLE tarot_readings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own readings"
  ON tarot_readings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own readings"
  ON tarot_readings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own readings"
  ON tarot_readings FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 11. Implementation Timeline

### **Week 1: Foundation**
**Days 1-2: Data Setup**
- [ ] Create `tarotCards.ts` with all 78 cards
- [ ] Create `spreads.ts` with 3 spread layouts
- [ ] Create tarot type definitions
- [ ] Organize image assets

**Days 3-5: State & Utils**
- [ ] Create `tarotSlice.ts` in store
- [ ] Implement quantum random util
- [ ] Create tarot prompt template
- [ ] Update store index to include tarot

**Days 6-7: Handlers**
- [ ] Implement `handleDrawCards`
- [ ] Implement `generateTarotInterpretation`
- [ ] Implement database save/load handlers

---

### **Week 2: Core Components**
**Days 1-2: Card Components**
- [ ] Build `TarotCard` component with image display
- [ ] Build `TarotSpread` layout component
- [ ] Add card flip animations

**Days 3-4: Input Components**
- [ ] Build `SpreadSelector` component
- [ ] Build `IntentionInput` component
- [ ] Add validation and guidance

**Days 5-7: Display Components**
- [ ] Build `InterpretationDisplay` component
- [ ] Build `ReadingHistory` component
- [ ] Add styling and polish

---

### **Week 3: Screen & Integration**
**Days 1-3: Main Screen**
- [ ] Create `TarotScreen` with step flow
- [ ] Implement state transitions
- [ ] Add error handling

**Days 4-5: Animation**
- [ ] Build `CardDrawAnimation` component
- [ ] Add quantum generation visual feedback
- [ ] Polish transitions and timing

**Days 6-7: Integration**
- [ ] Add to tab navigation
- [ ] Integrate with HomeScreen
- [ ] Add journal linking

---

### **Week 4: Database & Polish**
**Days 1-2: Database**
- [ ] Create Supabase migration
- [ ] Test save/load functionality
- [ ] Implement offline queue

**Days 3-4: Testing**
- [ ] Test all spread types
- [ ] Test quantum vs crypto fallback
- [ ] Test AI interpretation generation
- [ ] Test offline mode

**Days 5-7: Polish & Deploy**
- [ ] Fix bugs and edge cases
- [ ] Performance optimization
- [ ] Final UI polish
- [ ] User testing and feedback

---

## 12. Key Technical Considerations

### Quantum Random
- **API:** ANU Quantum Random Number Generator (free, no auth required)
- **Rate Limit:** ~100 requests/minute
- **Fallback:** `crypto.getRandomValues()` when offline or rate limited
- **Caching:** Consider pre-fetching some quantum numbers for offline use

### Image Management
- **Storage:** Local assets (single deck ~4-8MB)
- **Loading:** Lazy load with placeholders
- **Optimization:** Pre-optimized images, compressed PNGs
- **Future:** Support for downloadable deck packs

### AI Integration
- **Pattern:** Reuse existing Anthropic integration from horoscope
- **Caching:** Consider caching interpretations (low priority - spreads rarely identical)
- **Fallback:** Static interpretations when AI unavailable
- **Cost:** Monitor token usage, implement user limits if needed

### Offline Support
- **Card Data:** All stored locally ✅
- **Images:** All stored locally ✅
- **Quantum Random:** Crypto fallback ✅
- **AI Interpretation:** Queue for when online, show static meanings offline
- **Saving:** Queue writes, sync when online

### Performance
- **Card Animations:** Use React Native Animated API, not re-renders
- **Large Spreads:** Celtic Cross with 10 cards - optimize rendering
- **Image Loading:** Preload spread images before animation
- **State Updates:** Batch where possible to avoid unnecessary renders

---

## 13. Future Enhancements (Post-MVP)

### Additional Spreads
- Horseshoe spread (7 cards)
- Relationship spread (7 cards)
- Year ahead (12 cards - one per month)
- Custom spread builder

### Multiple Decks
- Thoth Tarot
- Marseille Tarot
- Modern/artistic decks
- Deck download system with preview

### Advanced Features
- Card of the day notifications
- Spread recommendations based on intention
- Learning mode (card meanings reference)
- Reading notes and annotations
- Share readings (privacy-aware)

### Analytics
- Track which cards appear frequently
- Identify patterns over time
- Suggest focus areas based on history

---

## 14. Testing Checklist

### Functional Tests
- [ ] All three spreads work correctly
- [ ] No duplicate cards in a spread
- [ ] Reversed cards display properly
- [ ] Intention optional but saved
- [ ] AI interpretation generates successfully
- [ ] Static fallback works offline
- [ ] Readings save to database
- [ ] Reading history loads correctly
- [ ] Delete readings works
- [ ] Navigation flows correctly

### Edge Cases
- [ ] Quantum API timeout/failure → crypto fallback
- [ ] AI API failure → static interpretation
- [ ] Offline mode → all features work except AI
- [ ] Rapid session start/stop
- [ ] Large reading history (100+ readings)
- [ ] Very long intentions (>500 chars)

### UI/UX Tests
- [ ] Animations smooth on device
- [ ] Images load properly
- [ ] Cards readable on small screens
- [ ] Interpretation text formatted well
- [ ] Loading states clear
- [ ] Error messages helpful
- [ ] Back navigation preserves state

### Performance Tests
- [ ] Card drawing animation fps
- [ ] Large spread (10 cards) renders smoothly
- [ ] Image loading doesn't block UI
- [ ] State updates don't cause lag
- [ ] Memory usage acceptable

---

## Resources

### Tarot Card Meanings
- Biddy Tarot (comprehensive meanings)
- Labyrinthos Academy (modern interpretations)
- Wikipedia (historical context)

### I Ching Data
- Repository: `https://github.com/adamblvck/iching-wilhelm-dataset`
- License: MIT (Wilhelm translation is public domain)
- Contains: All 64 hexagrams with judgment, image, line interpretations

### Quantum Random
- API: `https://qrng.anu.edu.au/`
- Docs: `https://qrng.anu.edu.au/API/api-demo.php`
- Free tier: 100 requests/minute

### Design Inspiration
- Labyrinthos Tarot App
- Golden Thread Tarot
- Mystic Mondays

---

**Implementation Status:** Ready to begin
**Estimated Effort:** 3-4 weeks (1 developer)
**Dependencies:**
- Tarot card images (user-provided ✅)
- Existing Anthropic AI integration ✅
- Existing Supabase setup ✅
- Existing state management pattern ✅
