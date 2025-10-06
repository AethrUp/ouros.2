/**
 * Tarot Reading AI Prompt Templates
 * Uses Anthropic Claude API for personalized interpretations
 */

import { DrawnCard } from '../types/tarot';
import { BirthData, UserPreferences } from '../types/user';

interface PersonalizationContext {
  birthData?: BirthData;
  preferences?: UserPreferences;
  currentDate: string;
}

interface TarotPromptParams {
  intention: string;
  cards: DrawnCard[];
  context: PersonalizationContext;
  style: 'mystical' | 'psychological' | 'practical';
  detailLevel: 'brief' | 'detailed' | 'comprehensive';
}

/**
 * Format astrological context for prompt
 */
const formatAstroProfile = (context: PersonalizationContext): string => {
  if (!context.birthData) {
    return 'Astrological data not provided';
  }

  const { birthData } = context;
  const parts: string[] = [];

  if (birthData.sunSign) parts.push(`Sun in ${birthData.sunSign}`);
  if (birthData.moonSign) parts.push(`Moon in ${birthData.moonSign}`);
  if (birthData.risingSign) parts.push(`Rising ${birthData.risingSign}`);

  return parts.length > 0 ? parts.join(', ') : 'Astrological data not fully available';
};

/**
 * Get style-specific guidance for the AI
 */
const getStyleGuidance = (style: 'mystical' | 'psychological' | 'practical'): string => {
  const guidance = {
    mystical: 'Connect to bigger themes and life lessons, but keep it relatable. Think wisdom traditions and personal meaning-making rather than esoteric symbolism.',
    psychological: 'Think of the cards as a mirror for what\'s happening in their inner world. Explore patterns, motivations, and personal growth opportunities. Use accessible psychology concepts.',
    practical: 'Talk like you\'re giving advice to a friend. Focus on practical patterns, real-world situations, and concrete next steps. Skip the mystical language.'
  };

  return guidance[style];
};

/**
 * Get detail level guidance for the AI
 */
const getDetailGuidance = (detailLevel: 'brief' | 'detailed' | 'comprehensive'): string => {
  const guidance = {
    brief: '2-3 paragraphs total.',
    detailed: '4-5 paragraphs.',
    comprehensive: '6-8 paragraphs.'
  };

  return guidance[detailLevel];
};

/**
 * Format card details for the prompt
 */
const formatCardDetails = (cards: DrawnCard[]): string => {
  return cards.map((dc, idx) => {
    const parts = [
      `${idx + 1}. **Position: ${dc.position}** (${dc.positionMeaning})`,
      `   - **Card:** ${dc.card.name} (${dc.orientation})`,
      `   - **Keywords:** ${dc.card.keywords.join(', ')}`,
      `   - **Meaning:** ${dc.orientation === 'upright' ? dc.card.uprightMeaning : dc.card.reversedMeaning}`
    ];

    if (dc.card.astrology) {
      parts.push(`   - **Astrology:** ${dc.card.astrology}`);
    }

    if (dc.card.element) {
      parts.push(`   - **Element:** ${dc.card.element}`);
    }

    return parts.join('\n');
  }).join('\n\n');
};

/**
 * Get response structure based on detail level
 */
const getResponseStructure = (detailLevel: 'brief' | 'detailed' | 'comprehensive'): string => {
  const structures = {
    brief: `
- What's the main message here?
- How do the cards connect to tell a story?
- What's one key thing to focus on?`,

    detailed: `
- Set the scene - what energy are you picking up?
- Walk through each card and what it means in context
- How do they work together?
- What are some practical next steps?`,

    comprehensive: `
- Paint the full picture of what's happening
- Dive into each card's role in the story
- Explore the deeper patterns and themes
- Look at potential challenges and opportunities
- Give specific, actionable guidance
- End with an empowering takeaway`
  };

  return structures[detailLevel];
};

/**
 * Construct Tarot reading prompt for Claude
 */
export const constructTarotPrompt = (params: TarotPromptParams): string => {
  const { intention, cards, context, style, detailLevel } = params;

  const astroContext = formatAstroProfile(context);
  const cardDetails = formatCardDetails(cards);
  const styleGuidance = getStyleGuidance(style);
  const detailGuidance = getDetailGuidance(detailLevel);
  const responseStructure = getResponseStructure(detailLevel);

  return `You're giving a tarot reading to someone who's looking for genuine insight and guidance.

**READING INFO:**
- What they're asking about: ${intention || 'General guidance'}
- Today's date: ${new Date().toLocaleDateString()}
- Their astro info: ${astroContext}
- Reading style: ${style}
- How much detail: ${detailLevel}

**THE CARDS:**
${cardDetails}

**HOW TO READ:**
Give them a reading that feels like you're having a real conversation. Be insightful but not mystical for the sake of it. Help them understand what's going on in their life right now and what they might want to consider moving forward.

**Reading Style:**
${styleGuidance}

**Length (${detailGuidance}):**
${responseStructure}

**Writing Style:**
- Write like you're talking to them directly
- Be warm but honest - don't sugarcoat difficult truths
- Make it about THEIR specific cards and situation
- Focus on what they can actually do with this information
- Skip the flowery mystical language unless it genuinely adds meaning
- If a card traditionally means something tough, acknowledge it but frame it constructively
- Help them feel empowered to make their own choices

**Key Points:**
- This person came to you for real guidance, not mystical theater
- Connect the cards to actual life situations they might recognize
- Be specific to what was actually drawn
- Reversed cards add nuance - they're not just "bad versions"
- End with something they can actually use
- Trust that genuine insight doesn't need fancy packaging
- No markdown formatting in the response (plain text only)

Begin your interpretation:`;
};

/**
 * Construct a static fallback interpretation when AI is unavailable
 */
export const constructStaticInterpretation = (
  intention: string,
  cards: DrawnCard[]
): string => {
  const cardSummaries = cards.map((dc, idx) => {
    const meaning = dc.orientation === 'upright'
      ? dc.card.uprightMeaning
      : dc.card.reversedMeaning;

    return `**${dc.position}: ${dc.card.name} (${dc.orientation})**
${dc.positionMeaning}

${meaning}`;
  }).join('\n\n');

  const openingText = intention
    ? `You asked about: "${intention}"\n\nHere's what the cards reveal:`
    : `The cards offer this guidance:`;

  return `${openingText}

${cardSummaries}

**Synthesis**
The cards suggest a journey through ${cards.map(c => c.card.keywords[0]).join(', ')}. Consider how these energies relate to your current situation. Each card's position offers specific insight into different aspects of your question.

**Guidance**
Reflect on how these card meanings resonate with your experience. Trust your intuition as you integrate this wisdom into your path forward.`;
};

/**
 * Validate the AI response
 */
export const validateTarotResponse = (response: string): { valid: boolean; error?: string } => {
  if (!response || typeof response !== 'string') {
    return { valid: false, error: 'Response is empty or invalid' };
  }

  if (response.length < 100) {
    return { valid: false, error: 'Response is too short' };
  }

  if (response.length > 10000) {
    return { valid: false, error: 'Response is too long' };
  }

  // Check for common AI refusal patterns
  const refusalPatterns = [
    'I cannot',
    'I\'m not able to',
    'I don\'t have the ability',
    'As an AI'
  ];

  const hasRefusal = refusalPatterns.some(pattern =>
    response.toLowerCase().includes(pattern.toLowerCase())
  );

  if (hasRefusal) {
    return { valid: false, error: 'AI declined to provide interpretation' };
  }

  return { valid: true };
};
