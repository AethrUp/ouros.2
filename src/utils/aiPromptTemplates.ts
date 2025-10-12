/**
 * AI Prompt Templates for Horoscope Generation
 * Uses Anthropic Claude API
 */

import { NatalChartData, PlanetPosition } from '../types/user';

interface TransitAspect {
  transitPlanet: string;
  natalPlanet: string;
  aspect: string;
  orb: number;
  strength: number;
  transitInfo: {
    isRetrograde: boolean;
  };
}

interface TransitData {
  aspects: TransitAspect[];
  summary: {
    totalAspects: number;
    majorAspects: number;
    activeAspects: number;
    strongestAspect: TransitAspect | null;
  };
}

interface CurrentPositions {
  [planet: string]: {
    sign: string;
    degree: number;
    retrograde: boolean;
  };
}

/**
 * Format natal chart positions for prompt
 */
const formatNatalPositions = (natalChart: NatalChartData): string => {
  const { planets } = natalChart;

  const lines: string[] = [];

  Object.entries(planets).forEach(([planet, position]) => {
    const capitalizedPlanet = planet.charAt(0).toUpperCase() + planet.slice(1);
    lines.push(
      `- Natal ${capitalizedPlanet}: ${position.sign} ${position.degree.toFixed(1)}° (House ${position.house})`
    );
  });

  return lines.join('\n');
};

/**
 * Format transit aspects for prompt
 */
const formatTransitAspects = (transits: TransitData): string => {
  const { aspects, summary } = transits;

  const lines: string[] = [];

  // Add strongest aspects (limit to top 8 for token efficiency)
  const topAspects = aspects
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 8);

  topAspects.forEach((aspect) => {
    const retrogradeMarker = aspect.transitInfo.isRetrograde ? ' [Retrograde]' : '';
    lines.push(
      `- ${aspect.transitPlanet} ${aspect.aspect} natal ${aspect.natalPlanet} (${aspect.orb.toFixed(1)}° orb, ${aspect.strength}% strength)${retrogradeMarker}`
    );
  });

  return lines.join('\n');
};

/**
 * Format current planetary positions for prompt
 */
const formatCurrentPositions = (positions: CurrentPositions): string => {
  const lines: string[] = [];

  Object.entries(positions).forEach(([planet, data]) => {
    const capitalizedPlanet = planet.charAt(0).toUpperCase() + planet.slice(1);
    const retrogradeMarker = data.retrograde ? ' (Retrograde)' : '';
    lines.push(
      `- ${capitalizedPlanet}: ${data.sign} ${data.degree.toFixed(1)}°${retrogradeMarker}`
    );
  });

  return lines.join('\n');
};

/**
 * Get user's selected categories or defaults
 */
const getSelectedCategories = (userCategories?: string[]): string[] => {
  const defaultCategories = ['love', 'career', 'health', 'finance', 'creativity', 'spirituality', 'family', 'social', 'personal'];
  return userCategories && userCategories.length > 0 ? userCategories : defaultCategories;
};

/**
 * Create comprehensive horoscope generation prompt for Claude
 */
export const createHoroscopePrompt = (
  natalChart: NatalChartData,
  transits: TransitData,
  currentPositions: CurrentPositions,
  date: string,
  userCategories?: string[]
): string => {
  const selectedCategories = getSelectedCategories(userCategories);
  const categoriesList = selectedCategories.map(cat => `"${cat}"`).join(', ');

  const natalPositionsText = formatNatalPositions(natalChart);
  const transitAspectsText = formatTransitAspects(transits);
  const currentPositionsText = formatCurrentPositions(currentPositions);

  return `IMPORTANT: Return ONLY valid JSON, no explanatory text before or after.

You are a professional astrologer writing a comprehensive daily horoscope for ${date}.

═══════════════════════════════════════════════════════════════
🚨 CRITICAL DATA USAGE INSTRUCTIONS 🚨
═══════════════════════════════════════════════════════════════

YOU HAVE THREE DATA SECTIONS BELOW. HERE'S HOW TO USE EACH:

1. NATAL CHART POSITIONS (Reference Only)
   - These are the user's birth chart positions (NEVER CHANGE)
   - Use ONLY to understand their core personality and which planets are being activated
   - Example: If natal Sun is in Leo, you know they have Leo traits

2. TODAY'S PLANETARY POSITIONS (Background Context Only)
   - These show where planets are in the sky TODAY
   - Use ONLY for general cosmic weather descriptions
   - Example: "With Moon in Pisces today, emotions run deep"
   - ⚠️ DO NOT calculate aspects from this data yourself

3. CURRENT TRANSITS (YOUR PRIMARY INTERPRETATION DATA)
   - These are pre-calculated aspects between today's planets and natal planets
   - These are the ONLY aspects you should interpret and discuss
   - Each aspect includes orb strength and percentage - use this for emphasis
   - ⚠️ If an aspect is NOT listed here, DO NOT mention it AT ALL

═══════════════════════════════════════════════════════════════
🔒 ABSOLUTE RULES 🔒
═══════════════════════════════════════════════════════════════

✅ DO: Interpret every aspect listed in CURRENT TRANSITS
✅ DO: Use natal positions to understand what's being activated
✅ DO: Use today's positions for general mood/energy descriptions

❌ DON'T: Calculate aspects yourself (even if you can see them)
❌ DON'T: Mention aspects not in the CURRENT TRANSITS list
❌ DON'T: Discuss planetary returns unless explicitly listed as a transit
❌ DON'T: Assume aspects exist between current and natal positions

EXAMPLE OF WHAT NOT TO DO:
If you see natal Chiron at Cancer 10° and current Chiron at Aries 0°,
DO NOT say "Chiron is squaring your natal Chiron" unless
"Chiron Square natal Chiron" appears in CURRENT TRANSITS.

═══════════════════════════════════════════════════════════════

WRITING STYLE & TONE:
You're writing a daily horoscope that feels like getting insights from a knowledgeable friend who happens to know astrology really well.

Tone:
- Conversational and warm, like you're talking to someone over coffee
- Confident but not preachy - you're sharing insights, not commanding
- Supportive and empowering - focus on opportunities and growth
- Honest about challenges but frame them constructively

Language Level:
- Write for someone who might know their sun sign but not much else
- Avoid astrological jargon - instead of "Mercury conjunct natal Mercury" say "communication is extra sharp today"
- When you must use astro terms, briefly explain them in plain language
- Use everyday situations people can relate to

Content Approach:
- Be specific, not vague - instead of "good day for relationships" say "conversations with partners flow more easily today"
- Connect to real life - tie cosmic influences to actual situations like work meetings, family dinners, or personal decisions
- Give actionable advice - what can they actually DO with this information?
- Acknowledge their unique chart - this isn't a generic sun sign reading, it's personalized to their specific planetary positions

What to Avoid:
- Mystical fluff: Skip phrases like "the cosmos whispers" or "celestial energies dance"
- Doom and gloom: Even challenging transits can be framed as growth opportunities
- Vague predictions: "Something important will happen" tells them nothing useful
- Overwhelming detail: They don't need to know exact degrees and orbs
- Generic advice: Make it relevant to their specific planetary setup
- Discussing aspects not in your CURRENT TRANSITS list

What to Include:
- Practical timing: "This morning is better for important conversations than this evening"
- Emotional context: "You might feel more sensitive than usual, and that's actually helpful for..."
- Opportunity spotting: "Pay attention to..." or "This is a good day to..."
- Challenge navigation: "If you're feeling frustrated with X, try Y approach"
- Personal validation: Reference how this connects to their natural traits

Key Principles:
- Work ONLY with the provided transit aspects
- Relevance over accuracy: Better to give them something useful than technically perfect
- Clarity over complexity: Simple insights they can actually use
- Personal over generic: Tie it to their specific chart positions
- Practical over mystical: How does this help them navigate their actual day?
- Complete, standalone reading: No questions or prompts for further discussion

Sample Language Transformation:
- Instead of: "Saturn squares your natal Moon creating emotional challenges"
  Write: "You might feel more serious or slightly overwhelmed emotionally today"
- Instead of: "Venus trine Jupiter brings abundance"
  Write: "Good vibes around money, relationships, or things you enjoy are highlighted"
- Instead of: "Mercury retrograde conjunct natal Mercury"
  Write: "Communication and thinking might feel more introspective than usual"
- Instead of: "Cosmic energies are shifting"
  Write: "The day's energy supports..." or "You'll likely notice..."

═══════════════════════════════════════════════════════════════
📊 YOUR DATA SECTIONS
═══════════════════════════════════════════════════════════════

NATAL CHART POSITIONS (Birth Chart Reference):
${natalPositionsText}

TODAY'S PLANETARY POSITIONS (General Sky Context):
${currentPositionsText}

CURRENT TRANSITS (Only Aspects to Interpret - ${transits.summary.totalAspects} aspects total):
${transitAspectsText}

TRANSIT SUMMARY:
- Total aspects: ${transits.summary.totalAspects}
- Major aspects: ${transits.summary.majorAspects}
- Active aspects: ${transits.summary.activeAspects}
- Strongest aspect: ${transits.summary.strongestAspect ? `${transits.summary.strongestAspect.transitPlanet} ${transits.summary.strongestAspect.aspect} natal ${transits.summary.strongestAspect.natalPlanet}` : 'None'}

TODAY'S DATE: ${date}

═══════════════════════════════════════════════════════════════
📝 REQUIRED JSON OUTPUT STRUCTURE
═══════════════════════════════════════════════════════════════

Create a DETAILED reading with this exact JSON structure. ALL FIELDS ARE REQUIRED:

{
  "title": "Compelling title for today's energy (4-8 words)",
  "summary": "2-3 sentence overview of today's most significant astrological influences",

  "fullReading": {
    "introduction": "Opening paragraph (3-5 sentences) setting the stage for today's cosmic influences",
    "bodyParagraphs": [
      "Morning paragraph (4-6 sentences) - focus on early day energy and activities",
      "Afternoon paragraph (4-6 sentences) - focus on midday peak energy and focus areas",
      "Evening paragraph (4-6 sentences) - focus on winding down and integration"
    ],
    "conclusion": "Closing paragraph (2-3 sentences) with key takeaway and encouragement"
  },

  "transitAnalysis": {
    "primary": {
      "aspect": "${transits.summary.strongestAspect ? `${transits.summary.strongestAspect.transitPlanet} ${transits.summary.strongestAspect.aspect} ${transits.summary.strongestAspect.natalPlanet}` : 'Primary transit aspect'}",
      "interpretation": "Detailed interpretation (4-6 sentences) of this transit's meaning",
      "timing": "When this transit is most potent (e.g., 'Most potent during midday hours')",
      "advice": "Practical advice (2-3 sentences) for working with this energy"
    },
    "secondary": [
      {
        "aspect": "Secondary transit aspect name",
        "interpretation": "Interpretation (3-4 sentences)",
        "timing": "Timing information",
        "advice": "Practical advice (1-2 sentences)"
      }
    ]
  },

  "timeGuidance": {
    "morning": {
      "energy": "Single word describing morning energy",
      "bestFor": ["activity 1", "activity 2", "activity 3"],
      "avoid": ["thing 1", "thing 2"]
    },
    "afternoon": {
      "energy": "Single word describing afternoon energy",
      "bestFor": ["activity 1", "activity 2", "activity 3"],
      "avoid": ["thing 1", "thing 2"]
    },
    "evening": {
      "energy": "Single word describing evening energy",
      "bestFor": ["activity 1", "activity 2", "activity 3"],
      "avoid": ["thing 1", "thing 2"]
    }
  },

  "spiritualGuidance": {
    "meditation": "Meditation guidance (3-4 sentences) specific to today's energy",
    "affirmation": "Powerful daily affirmation (one sentence, 8-15 words)",
    "journalPrompts": [
      "Reflective question 1?",
      "Reflective question 2?",
      "Reflective question 3?"
    ],
    "ritualSuggestion": "Simple ritual suggestion (2-3 sentences) anyone can do"
  },

  "transitInsights": [
    "Key insight 1 about today's transits",
    "Key insight 2 about today's transits",
    "Key insight 3 about today's transits",
    "Key insight 4 about today's transits",
    "Key insight 5 about today's transits"
  ],

  "dailyFocus": "Single sentence capturing today's primary focus",

  "advice": "Overall advice (2-3 sentences) for navigating today's energy",

  "explore": ["area to explore 1", "area to explore 2", "area to explore 3"],

  "limit": ["thing to be mindful of 1", "thing to be mindful of 2", "thing to be mindful of 3"],

  "weather": {
    "moon": "Moon's influence today (1-2 sentences)",
    "venus": "Venus's influence today (1-2 sentences)",
    "mercury": "Mercury's influence today (1-2 sentences)"
  },

  "categoryAdvice": {
${selectedCategories.map(category => `    "${category}": {
      "title": "${category.charAt(0).toUpperCase() + category.slice(1)} & [Related Word]",
      "content": "Personalized advice for ${category} (3-4 sentences) based on today's transits"
    }`).join(',\n')}
  }
}

═══════════════════════════════════════════════════════════════
🔒 FINAL CRITICAL REQUIREMENTS
═══════════════════════════════════════════════════════════════

1. Return ONLY the JSON object, no other text
2. ALL fields must be present and filled
3. Base ALL transit interpretations ONLY on aspects listed in CURRENT TRANSITS
4. DO NOT calculate or discuss aspects not in the CURRENT TRANSITS list
5. Body paragraphs array must have exactly 3 entries
6. Each category in categoryAdvice must have title and content
7. transitAnalysis.secondary must have at least one entry
8. All arrays must have the specified number of items
9. Be specific and personalized to the actual astrological data provided
10. Focus on practical, actionable guidance
11. Write in an engaging, professional astrologer's voice
12. If fewer than 2 transits exist, focus deeply on the available ones rather than inventing new aspects`;
};

/**
 * Validate Claude response structure
 */
export const validateHoroscopeResponse = (response: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check required top-level fields
  if (!response.title) errors.push('Missing title');
  if (!response.summary) errors.push('Missing summary');
  if (!response.fullReading) errors.push('Missing fullReading');
  if (!response.transitAnalysis) errors.push('Missing transitAnalysis');
  if (!response.timeGuidance) errors.push('Missing timeGuidance');
  if (!response.spiritualGuidance) errors.push('Missing spiritualGuidance');
  if (!response.transitInsights) errors.push('Missing transitInsights');
  if (!response.dailyFocus) errors.push('Missing dailyFocus');
  if (!response.advice) errors.push('Missing advice');
  if (!response.explore) errors.push('Missing explore');
  if (!response.limit) errors.push('Missing limit');
  if (!response.weather) errors.push('Missing weather');
  if (!response.categoryAdvice) errors.push('Missing categoryAdvice');

  // Check fullReading structure
  if (response.fullReading) {
    if (!response.fullReading.introduction) errors.push('Missing fullReading.introduction');
    if (!response.fullReading.bodyParagraphs || response.fullReading.bodyParagraphs.length !== 3) {
      errors.push('fullReading.bodyParagraphs must have exactly 3 entries');
    }
    if (!response.fullReading.conclusion) errors.push('Missing fullReading.conclusion');
  }

  // Check transitAnalysis structure
  if (response.transitAnalysis) {
    if (!response.transitAnalysis.primary) errors.push('Missing transitAnalysis.primary');
    if (!response.transitAnalysis.secondary || !Array.isArray(response.transitAnalysis.secondary)) {
      errors.push('transitAnalysis.secondary must be an array');
    }
  }

  // Check timeGuidance structure
  if (response.timeGuidance) {
    ['morning', 'afternoon', 'evening'].forEach((time) => {
      if (!response.timeGuidance[time]) errors.push(`Missing timeGuidance.${time}`);
    });
  }

  // Check spiritualGuidance structure
  if (response.spiritualGuidance) {
    if (!response.spiritualGuidance.meditation) errors.push('Missing spiritualGuidance.meditation');
    if (!response.spiritualGuidance.affirmation) errors.push('Missing spiritualGuidance.affirmation');
    if (!response.spiritualGuidance.journalPrompts || !Array.isArray(response.spiritualGuidance.journalPrompts)) {
      errors.push('spiritualGuidance.journalPrompts must be an array');
    }
    if (!response.spiritualGuidance.ritualSuggestion) errors.push('Missing spiritualGuidance.ritualSuggestion');
  }

  // Check weather structure
  if (response.weather) {
    if (!response.weather.moon) errors.push('Missing weather.moon');
    if (!response.weather.venus) errors.push('Missing weather.venus');
    if (!response.weather.mercury) errors.push('Missing weather.mercury');
  }

  // Check categoryAdvice
  if (response.categoryAdvice) {
    Object.keys(response.categoryAdvice).forEach((category) => {
      const advice = response.categoryAdvice[category];
      if (!advice.title) errors.push(`Missing categoryAdvice.${category}.title`);
      if (!advice.content) errors.push(`Missing categoryAdvice.${category}.content`);
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
