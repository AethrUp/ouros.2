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
 * Construct Overview prompt for parallel generation
 */
export const constructOverviewPrompt = (params: {
  intention: string;
  cards: DrawnCard[];
  context: PersonalizationContext;
  style: 'mystical' | 'psychological' | 'practical';
}): string => {
  const { intention, cards, context, style } = params;
  const astroContext = formatAstroProfile(context);
  const styleGuidance = getStyleGuidance(style);
  const cardSummary = cards.map((c, i) =>
    `${i + 1}. ${c.card.name} (${c.orientation}) in "${c.position}"`
  ).join('\n');

  return `You are providing the opening overview for a tarot reading. Look at all the cards as a whole and set the stage.

WRITING STYLE: ${styleGuidance}

CONTEXT:
Question/Intention: "${intention || 'General guidance'}"
Date: ${context.currentDate}
${context.birthData ? `Querent's Astrology: ${astroContext}` : ''}

CARDS IN THIS SPREAD:
${cardSummary}

Create a 3-4 sentence opening overview that sets the stage for this reading. What's the overall energy or story you're picking up from these cards as a whole? Don't interpret individual cards yet - just paint the big picture.

Return ONLY valid JSON with this structure:
{
  "overview": "Your 3-4 sentence opening overview here"
}`;
};

/**
 * Construct individual Card interpretation prompt for parallel generation
 */
export const constructCardPrompt = (params: {
  card: DrawnCard;
  cardIndex: number;
  allCards: DrawnCard[];
  intention: string;
  context: PersonalizationContext;
  style: 'mystical' | 'psychological' | 'practical';
}): string => {
  const { card, cardIndex, allCards, intention, context, style } = params;
  const styleGuidance = getStyleGuidance(style);
  const astroContext = formatAstroProfile(context);

  const otherCards = allCards
    .filter((_, i) => i !== cardIndex)
    .map((c, i) => `${c.card.name} (${c.orientation}) in "${c.position}"`)
    .join('\n');

  const cardDetails = [
    `Card: ${card.card.name} (${card.orientation})`,
    `Keywords: ${card.card.keywords.join(', ')}`,
    `Meaning: ${card.orientation === 'upright' ? card.card.uprightMeaning : card.card.reversedMeaning}`,
  ];

  if (card.card.astrology) cardDetails.push(`Astrology: ${card.card.astrology}`);
  if (card.card.element) cardDetails.push(`Element: ${card.card.element}`);

  return `You are interpreting ONE specific card in a tarot reading. Focus deeply on this card's message.

WRITING STYLE: ${styleGuidance}
Write 3-4 sentences interpreting this card in its position. Be specific, insightful, and grounded.

CONTEXT:
Question/Intention: "${intention || 'General guidance'}"
${context.birthData ? `Querent's Astrology: ${astroContext}` : ''}

THIS CARD (Card ${cardIndex + 1}):
Position: "${card.position}"
Position Meaning: ${card.positionMeaning}
${cardDetails.join('\n')}

OTHER CARDS IN SPREAD (for context):
${otherCards}

Interpret this card in its specific position. Consider:
- What does THIS card mean in THIS position?
- How does it relate to the querent's question?
- ${card.orientation === 'reversed' ? 'This card is reversed - interpret with nuance (internal, blocked, shadow, or alternative expression)' : 'This card is upright - full expression of its energy'}
- Consider the other cards in the spread, but focus on THIS card's unique message

Return ONLY valid JSON with this structure:
{
  "position": "${card.position}",
  "cardName": "${card.card.name} (${card.orientation})",
  "interpretation": "Your 3-4 sentence interpretation here"
}`;
};

/**
 * Construct Meta-Content prompt (synthesis, guidance, timing, etc.) for parallel generation
 */
export const constructMetaPrompt = (params: {
  intention: string;
  cards: DrawnCard[];
  context: PersonalizationContext;
  style: 'mystical' | 'psychological' | 'practical';
}): string => {
  const { intention, cards, context, style } = params;
  const astroContext = formatAstroProfile(context);
  const styleGuidance = getStyleGuidance(style);
  const cardSummary = cards.map((c, i) =>
    `${i + 1}. ${c.card.name} (${c.orientation}) in "${c.position}"`
  ).join('\n');

  return `You are creating the synthesis, guidance, and reflection elements for a tarot reading.

WRITING STYLE: ${styleGuidance}

CONTEXT:
Question/Intention: "${intention || 'General guidance'}"
Date: ${context.currentDate}
${context.birthData ? `Querent's Astrology: ${astroContext}` : ''}

CARDS IN THIS SPREAD:
${cardSummary}

Create the meta-content for this reading. You have the card list but not their individual interpretations yet - focus on the big picture patterns, synthesis, and actionable guidance based on the cards present.

Return ONLY valid JSON with this EXACT structure:
{
  "preview": {
    "title": "Compelling 4-8 word title capturing the reading's essence",
    "summary": "2 sentence overview of what this reading reveals",
    "tone": "Supportive|Challenging|Transformative|Illuminating"
  },
  "synthesis": {
    "narrative": "3-4 sentences showing how the cards work together to tell a cohesive story. What patterns emerge?",
    "mainTheme": "2 sentences identifying the central theme or lesson"
  },
  "guidance": {
    "understanding": "2-3 sentences helping them understand what the cards reveal",
    "actionSteps": [
      "Specific, actionable step 1",
      "Specific, actionable step 2",
      "Specific, actionable step 3"
    ],
    "thingsToEmbrace": [
      "Quality, energy, or perspective to lean into 1",
      "Quality, energy, or perspective to lean into 2"
    ],
    "thingsToRelease": [
      "Pattern, belief, or behavior to let go of 1",
      "Pattern, belief, or behavior to let go of 2"
    ]
  },
  "timing": {
    "immediateAction": "What to focus on right now (1-2 sentences)",
    "nearFuture": "What to watch for or work toward soon (1-2 sentences)",
    "longTerm": "Broader perspective or ongoing lesson (1-2 sentences)"
  },
  "keyInsight": "1-2 sentences capturing the single most important takeaway",
  "reflectionPrompts": [
    "Thoughtful question for self-reflection 1?",
    "Thoughtful question for self-reflection 2?",
    "Thoughtful question for self-reflection 3?"
  ],
  "conclusion": "2 sentences empowering them to work with this reading"
}

CRITICAL:
- preview.tone must be EXACTLY one of: Supportive, Challenging, Transformative, Illuminating
- All arrays must have the specified number of items
- Return ONLY the JSON, no other text`;
};

/**
 * Construct Tarot reading prompt for Claude (V2 - Structured JSON format)
 * LEGACY: Used for single-call generation (small spreads or fallback)
 */
export const constructTarotPrompt = (params: TarotPromptParams): string => {
  const { intention, cards, context, style, detailLevel } = params;

  const astroContext = formatAstroProfile(context);
  const cardDetails = formatCardDetails(cards);
  const styleGuidance = getStyleGuidance(style);
  const detailGuidance = getDetailGuidance(detailLevel);
  const spreadName = cards[0]?.position ? cards.map(c => c.position).join(', ') : 'Custom spread';
  const cardCount = cards.length;

  return `IMPORTANT: Return ONLY valid JSON, no explanatory text before or after.

You are a skilled tarot reader providing an insightful, structured reading for someone seeking genuine guidance.

WRITING STYLE & TONE:
You're giving a tarot reading that feels like having a conversation with an insightful friend who sees patterns clearly.

Tone:
- Warm and authentic, not performatively mystical
- Insightful but grounded - connect symbolism to real life
- Honest and direct - the cards sometimes show uncomfortable truths
- Supportive and empowering - focus on agency and choice
- Conversational - like you're sitting across from them at a café

Language Level:
- Write for someone new to tarot who wants real insights
- Explain symbolism in accessible terms - "The Tower represents sudden change and upheaval" not "The Tower is falling"
- Connect cards to actual situations they might recognize
- Use everyday language, not mystical jargon

Content Approach:
- Be specific to the actual cards drawn and their positions
- Connect cards to real-life situations and choices
- Explain how cards interact and tell a cohesive story
- Give actionable guidance - what can they actually do with this?
- Honor both the traditional meanings and the intuitive reading
- Reversed cards add nuance - internal vs external, blocked vs flowing

What to Avoid:
- Fortune-telling: Don't predict specific events
- Mystical theater: Skip "the spirits speak" and "cosmic forces"
- Doom and gloom: Even challenging cards can guide growth
- Vague platitudes: "Trust yourself" without context is useless
- Ignoring the question: Always tie back to their intention

What to Include:
- Clear interpretation of each card in its specific position
- How the cards relate to and build on each other
- Practical guidance based on the reading
- Timing considerations when relevant
- Questions for reflection and deeper understanding
- Specific next steps or perspectives to consider

READING CONTEXT:
Querent's Question/Intention: "${intention || 'General guidance'}"
Today's Date: ${context.currentDate}
Spread: ${spreadName} (${cardCount} cards)
${context.birthData ? `Querent's Astrological Context: ${astroContext}` : ''}
Reading Style: ${style}
Detail Level: ${detailLevel}

CARDS DRAWN:
${cardDetails}

HOW TO INTERPRET:
1. Consider each card's meaning in the context of its specific position
2. Note whether cards are upright or reversed (reversed = internal, blocked, or shadow aspect)
3. Look for patterns across cards (multiple Major Arcana = significant life themes, suit patterns, number patterns)
4. Read the cards as a story that flows through the positions
5. Always tie back to the querent's question or intention
6. Give both understanding (what the cards show) and guidance (what to do with it)

**Reading Style Guidance:**
${styleGuidance}

**Detail Level (${detailGuidance}):**
${getResponseStructure(detailLevel)}

Create a DETAILED tarot reading with this exact JSON structure. ALL FIELDS ARE REQUIRED:

{
  "preview": {
    "title": "Compelling title that captures the reading's essence (4-8 words)",
    "summary": "2 sentence overview of what this reading reveals",
    "tone": "Supportive|Challenging|Transformative|Illuminating"
  },

  "fullContent": {
    "overview": "Opening paragraph (3-4 sentences) that sets the stage. What energy or story are the cards showing? What's the overall message before diving into details?",

    "cardInsights": [
      {
        "position": "Position name from spread (e.g., 'Present Situation', 'Past Influences')",
        "cardName": "Full card name including upright/reversed",
        "interpretation": "3-4 sentences interpreting this specific card in this specific position. What does it mean HERE? How does it relate to the question?"
      }
    ],

    "synthesis": {
      "narrative": "3-4 sentences showing how the cards work together to tell a cohesive story. What patterns emerge?",
      "mainTheme": "2 sentences identifying the central theme or lesson of this reading"
    },

    "guidance": {
      "understanding": "2-3 sentences helping them understand what the cards are revealing about their situation or path forward",
      "actionSteps": [
        "Specific, actionable step 1 based on the reading",
        "Specific, actionable step 2 based on the reading",
        "Specific, actionable step 3 based on the reading"
      ],
      "thingsToEmbrace": [
        "Quality, energy, or perspective to lean into 1",
        "Quality, energy, or perspective to lean into 2"
      ],
      "thingsToRelease": [
        "Pattern, belief, or behavior to let go of 1",
        "Pattern, belief, or behavior to let go of 2"
      ]
    },

    "timing": {
      "immediateAction": "What to focus on right now (1-2 sentences)",
      "nearFuture": "What to watch for or work toward (1-2 sentences)",
      "longTerm": "Broader perspective or ongoing lesson (1-2 sentences)"
    },

    "keyInsight": "1-2 sentences capturing the single most important takeaway from this reading.",

    "reflectionPrompts": [
      "Thoughtful question for self-reflection 1?",
      "Thoughtful question for self-reflection 2?",
      "Thoughtful question for self-reflection 3?"
    ],

    "conclusion": "Closing paragraph (2 sentences) that empowers them to work with this reading."
  }
}

CRITICAL REQUIREMENTS:
1. Return ONLY the JSON object, no other text before or after
2. ALL fields in both preview and fullContent must be present and filled completely
3. fullContent.cardInsights array must have one entry for each card drawn (${cardCount} total)
4. Each card interpretation must be specific to both the card AND its position
5. Reference the querent's question/intention throughout
6. Synthesize cards into a cohesive narrative, not isolated meanings
7. Guidance must be practical and actionable, not vague platitudes
8. preview.tone must be exactly one of: Supportive, Challenging, Transformative, Illuminating
9. Honor both traditional card meanings and intuitive insights
10. Reversed cards should be interpreted with nuance (internal, blocked, shadow, or alternative expression)
11. Write in second person ("you") to speak directly to the querent
12. Be concise but insightful - quality over quantity

CARD INTERPRETATION GUIDELINES:

Reversed Cards:
- Not automatically negative
- Can indicate: internal experience vs external, blocked energy, shadow work needed, or alternative expression
- Example: The Chariot reversed might mean "internal journey before external action" not "failure"

Major Arcana:
- Significant life themes and soul lessons
- Less about day-to-day, more about bigger patterns
- Multiple Major Arcana = major life chapter or transformation

Court Cards:
- Can represent people, personality aspects, or approaches to take
- Consider maturity level (Page/Knight/Queen/King) and elemental nature

Number Patterns:
- Multiple Aces = new beginnings
- Multiple 5s = change and challenge
- Multiple 10s = completion and transition

Suit Patterns:
- Heavy Wands = action, passion, growth
- Heavy Cups = emotions, relationships, intuition
- Heavy Swords = thoughts, conflict, clarity
- Heavy Pentacles = material world, body, practical matters

EXAMPLES OF GOOD VS BAD:

BAD: "The Lovers card means you'll meet someone special."
GOOD: "The Lovers in the 'present situation' position shows you're at a choice point about values and alignment - not necessarily romantic, but about choosing what truly matters to you versus what you think you should want."

BAD: "Trust the universe."
GOOD: "The cards suggest focusing your energy on what you can control - your daily practices, your boundaries, your next right action - rather than trying to force an outcome."

BAD: "The Tower is a bad card."
GOOD: "The Tower in your 'challenge' position shows that something needs to fall apart for truth to emerge. This disruption, while uncomfortable, is clearing space for something more authentic. Let it crumble rather than trying to hold it together."

BAD: "You have many emotions."
GOOD: "With the Page of Cups in 'advice' position, the cards suggest approaching this situation with curious, open emotional awareness - like a child discovering something new - rather than the heavy seriousness you've been bringing to it."

Create the complete structured reading now:`;
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
 * Validate the AI response (V2 - Structured JSON format)
 */
export const validateTarotResponse = (response: any): { valid: boolean; error?: string } => {
  if (!response || typeof response !== 'object') {
    return { valid: false, error: 'Response is empty or invalid - expected JSON object' };
  }

  const errors: string[] = [];

  // Check required top-level fields
  if (!response.preview) errors.push('Missing preview');
  if (!response.fullContent) errors.push('Missing fullContent');

  // Validate preview structure
  if (response.preview) {
    if (!response.preview.title) errors.push('Missing preview.title');
    if (!response.preview.summary) errors.push('Missing preview.summary');
    if (!response.preview.tone) errors.push('Missing preview.tone');

    // Validate tone
    if (response.preview.tone) {
      const validTones = ['Supportive', 'Challenging', 'Transformative', 'Illuminating'];
      if (!validTones.includes(response.preview.tone)) {
        errors.push(`preview.tone must be one of: ${validTones.join(', ')}`);
      }
    }
  }

  // Validate fullContent structure
  if (response.fullContent) {
    const fc = response.fullContent;

    if (!fc.overview) errors.push('Missing fullContent.overview');
    if (!fc.cardInsights) errors.push('Missing fullContent.cardInsights');
    if (!fc.synthesis) errors.push('Missing fullContent.synthesis');
    if (!fc.guidance) errors.push('Missing fullContent.guidance');
    if (!fc.timing) errors.push('Missing fullContent.timing');
    if (!fc.keyInsight) errors.push('Missing fullContent.keyInsight');
    if (!fc.reflectionPrompts) errors.push('Missing fullContent.reflectionPrompts');
    if (!fc.conclusion) errors.push('Missing fullContent.conclusion');

    // Validate cardInsights array
    if (fc.cardInsights) {
      if (!Array.isArray(fc.cardInsights)) {
        errors.push('fullContent.cardInsights must be an array');
      } else if (fc.cardInsights.length === 0) {
        errors.push('fullContent.cardInsights must have at least one entry');
      } else {
        fc.cardInsights.forEach((card: any, idx: number) => {
          if (!card.position) errors.push(`cardInsights[${idx}].position is missing`);
          if (!card.cardName) errors.push(`cardInsights[${idx}].cardName is missing`);
          if (!card.interpretation) errors.push(`cardInsights[${idx}].interpretation is missing`);
        });
      }
    }

    // Validate synthesis structure
    if (fc.synthesis) {
      if (!fc.synthesis.narrative) errors.push('Missing fullContent.synthesis.narrative');
      if (!fc.synthesis.mainTheme) errors.push('Missing fullContent.synthesis.mainTheme');
    }

    // Validate guidance structure
    if (fc.guidance) {
      if (!fc.guidance.understanding) errors.push('Missing fullContent.guidance.understanding');
      if (!fc.guidance.actionSteps || !Array.isArray(fc.guidance.actionSteps)) {
        errors.push('fullContent.guidance.actionSteps must be an array');
      }
      if (!fc.guidance.thingsToEmbrace || !Array.isArray(fc.guidance.thingsToEmbrace)) {
        errors.push('fullContent.guidance.thingsToEmbrace must be an array');
      }
      if (!fc.guidance.thingsToRelease || !Array.isArray(fc.guidance.thingsToRelease)) {
        errors.push('fullContent.guidance.thingsToRelease must be an array');
      }
    }

    // Validate timing structure
    if (fc.timing) {
      if (!fc.timing.immediateAction) errors.push('Missing fullContent.timing.immediateAction');
      if (!fc.timing.nearFuture) errors.push('Missing fullContent.timing.nearFuture');
      if (!fc.timing.longTerm) errors.push('Missing fullContent.timing.longTerm');
    }

    // Validate reflectionPrompts
    if (fc.reflectionPrompts) {
      if (!Array.isArray(fc.reflectionPrompts)) {
        errors.push('fullContent.reflectionPrompts must be an array');
      } else if (fc.reflectionPrompts.length < 3) {
        errors.push('fullContent.reflectionPrompts must have at least 3 items');
      }
    }

    // Validate content length (reduced minimums for concise format)
    if (fc.overview && fc.overview.length < 50) {
      errors.push('fullContent.overview is too short');
    }
    if (fc.keyInsight && fc.keyInsight.length < 15) {
      errors.push('fullContent.keyInsight is too short');
    }
    if (fc.conclusion && fc.conclusion.length < 30) {
      errors.push('fullContent.conclusion is too short');
    }
  }

  if (errors.length > 0) {
    return { valid: false, error: errors.join('; ') };
  }

  return { valid: true };
};
