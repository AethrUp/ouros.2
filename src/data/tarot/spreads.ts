import { SpreadLayout } from '../../types/tarot';

/**
 * Tarot Spread Definitions
 *
 * Each spread defines:
 * - Layout positions with normalized coordinates (0-1)
 * - Position meanings and context
 * - Visual arrangement for card display
 */

export const TAROT_SPREADS: SpreadLayout[] = [
  {
    id: 'single-card',
    name: 'Single Card',
    description: 'Quick insight or daily guidance',
    cardCount: 1,
    positions: [
      {
        id: 'card-1',
        name: 'Your Message',
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
      {
        id: 'past',
        name: 'Past',
        meaning: 'Past influences and foundations',
        x: 0.2,
        y: 0.5
      },
      {
        id: 'present',
        name: 'Present',
        meaning: 'Current situation and energies',
        x: 0.5,
        y: 0.5
      },
      {
        id: 'future',
        name: 'Future',
        meaning: 'Potential outcome and direction',
        x: 0.8,
        y: 0.5
      }
    ]
  },

  {
    id: 'celtic-cross',
    name: 'Celtic Cross',
    description: 'Comprehensive 10-card reading for deep insight',
    cardCount: 10,
    positions: [
      {
        id: 'present',
        name: 'Present Position',
        meaning: 'Your current situation and state of being',
        x: 0.32,
        y: 0.5
      },
      {
        id: 'challenge',
        name: 'Challenge',
        meaning: 'The immediate challenge or obstacle crossing you',
        x: 0.32,
        y: 0.5, // Overlays present position
        rotation: 90 // Rotated 90 degrees to form the cross
      },
      {
        id: 'past',
        name: 'Foundation',
        meaning: 'Past events and influences that led here',
        x: 0.12,
        y: 0.5
      },
      {
        id: 'recent-past',
        name: 'Recent Past',
        meaning: 'Recent events moving into the past',
        x: 0.32,
        y: 0.73
      },
      {
        id: 'best-outcome',
        name: 'Best Outcome',
        meaning: 'The best possible outcome you can achieve',
        x: 0.32,
        y: 0.18
      },
      {
        id: 'near-future',
        name: 'Near Future',
        meaning: 'What is approaching in the near future',
        x: 0.58,
        y: 0.5
      },
      {
        id: 'self',
        name: 'Your Position',
        meaning: 'How you see yourself in this situation',
        x: 0.88,
        y: 0.82
      },
      {
        id: 'environment',
        name: 'Environment',
        meaning: 'External influences and how others see you',
        x: 0.88,
        y: 0.64
      },
      {
        id: 'hopes-fears',
        name: 'Hopes & Fears',
        meaning: 'Your inner hopes and hidden fears',
        x: 0.88,
        y: 0.46
      },
      {
        id: 'outcome',
        name: 'Final Outcome',
        meaning: 'The culmination and likely outcome',
        x: 0.88,
        y: 0.18
      }
    ]
  }
];

/**
 * Get spread by ID
 */
export const getSpreadById = (spreadId: string): SpreadLayout | undefined => {
  return TAROT_SPREADS.find(spread => spread.id === spreadId);
};

/**
 * Get all available spreads
 */
export const getAllSpreads = (): SpreadLayout[] => {
  return TAROT_SPREADS;
};
