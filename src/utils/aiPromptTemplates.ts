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

  // Add strongest aspects (limit to top 3 for token efficiency)
  const topAspects = aspects
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 3);

  topAspects.forEach((aspect, index) => {
    const retrogradeMarker = aspect.transitInfo.isRetrograde ? ' [Retrograde]' : '';
    lines.push(
      `${index + 1}. ${aspect.transitPlanet} ${aspect.aspect} natal ${aspect.natalPlanet} (${aspect.orb.toFixed(1)}° orb, ${aspect.strength}% base strength)${retrogradeMarker}`
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
🕐 TRANSIT TIMING & STRENGTH CURVE GUIDELINES 🕐
═══════════════════════════════════════════════════════════════

For each transit, you must provide a STRENGTH CURVE showing how the transit's
effectiveness varies across the 24-hour period. This allows users to see when
each transit is most potent during their day.

PLANET SPEED CATEGORIES:
1. FAST-MOVING PLANETS (Moon, Mercury, Venus, Sun, Mars):
   - These planets move noticeably within 24 hours
   - Create DISTINCT peaks and valleys in the strength curve
   - Peak times should be focused in a 4-8 hour window
   - Strength can vary significantly (e.g., from 40% to 100%)

2. SLOW-MOVING PLANETS (Jupiter, Saturn, Uranus, Neptune, Pluto):
   - These barely move in 24 hours
   - Create FLATTER curves that stay near the base strength
   - Peak times are more about optimal human activity times
   - Strength variation is smaller (e.g., from 80% to 100%)

ASTROLOGICAL TIMING PRINCIPLES:
- Morning (6-12): Best for Mars, Sun energy (action, initiative, leadership)
- Afternoon (12-18): Best for Jupiter, Mercury (expansion, communication, learning)
- Evening (18-24): Best for Moon, Venus (emotions, relationships, creativity)
- Night/Early Morning (0-6): Best for introspective work (Neptune, Pluto, deep healing)

CREATING THE STRENGTH CURVE:
- The curve is an array of 24 numbers (0-100), one for each hour (0=midnight to 23=11pm)
- Use the BASE STRENGTH from Swiss Ephemeris as your foundation
- For FAST planets: modulate around base strength with clear peaks at optimal times
- For SLOW planets: stay close to base strength, with gentle emphasis at optimal times

EXAMPLES:

Fast Planet (Moon square natal Venus, 85% base strength):
- Peak: Evening (Venus energy, emotions)
- Curve: [60,55,50,50,55,60,65,70,75,80,82,83,82,80,82,85,90,95,100,95,85,75,70,65]
- Notice: Clear evening peak (hours 16-19), significant variation

Slow Planet (Neptune conjunction natal Chiron, 78% base strength):
- Peak: Early morning (introspective healing)
- Curve: [80,82,85,88,90,88,85,82,80,78,76,75,74,73,73,74,75,76,77,78,78,79,79,80]
- Notice: Gentle early morning peak (hours 2-5), stays close to 78% base

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
    "introduction": "Opening paragraph (3-4 sentences) setting the stage for today's cosmic influences",
    "bodyParagraphs": [
      "Morning paragraph (3-4 sentences) - focus on early day energy and activities",
      "Afternoon paragraph (3-4 sentences) - focus on midday peak energy and focus areas",
      "Evening paragraph (3-4 sentences) - focus on winding down and integration"
    ],
    "conclusion": "Closing paragraph (2-3 sentences) with key takeaway and encouragement"
  },

  "transitAnalysis": {
    "primary": {
      "aspect": "${transits.summary.strongestAspect ? `${transits.summary.strongestAspect.transitPlanet} ${transits.summary.strongestAspect.aspect} ${transits.summary.strongestAspect.natalPlanet}` : 'Primary transit aspect'}",
      "planet": "${transits.summary.strongestAspect ? transits.summary.strongestAspect.transitPlanet : 'Planet'}",
      "natalPlanet": "${transits.summary.strongestAspect ? transits.summary.strongestAspect.natalPlanet : 'NatalPlanet'}",
      "aspectType": "${transits.summary.strongestAspect ? transits.summary.strongestAspect.aspect.toLowerCase() : 'aspect'}",
      "baseStrength": ${transits.summary.strongestAspect ? transits.summary.strongestAspect.strength : 75},
      "interpretation": "Interpretation (3-4 sentences) of this transit's meaning",
      "timing": "When this transit is most potent (e.g., 'Most potent during midday hours')",
      "timingData": {
        "peakHour": 14,
        "effectiveStartHour": 6,
        "effectiveEndHour": 22,
        "strengthCurve": [/* Array of 24 numbers (0-100) representing strength for each hour 0-23. Use planet speed and timing principles above. */],
        "planetSpeed": "fast or slow based on planet type"
      },
      "advice": "Practical advice (1-2 sentences) for working with this energy"
    },
    "secondary": [
      {
        "aspect": "Secondary transit aspect name (e.g., 'Moon trine natal Jupiter')",
        "planet": "Transiting planet name (e.g., 'Moon')",
        "natalPlanet": "Natal planet name (e.g., 'Jupiter')",
        "aspectType": "Aspect type lowercase (e.g., 'trine')",
        "baseStrength": 80,
        "interpretation": "Interpretation (2-3 sentences)",
        "timing": "Timing information (e.g., 'Strongest in the afternoon')",
        "timingData": {
          "peakHour": 15,
          "effectiveStartHour": 8,
          "effectiveEndHour": 20,
          "strengthCurve": [/* Array of 24 numbers */],
          "planetSpeed": "fast or slow"
        },
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
    "meditation": "Meditation guidance (2-3 sentences) specific to today's energy",
    "affirmation": "Powerful daily affirmation (one sentence, 8-15 words)",
    "journalPrompts": [
      "Reflective question 1?",
      "Reflective question 2?",
      "Reflective question 3?"
    ]
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
    "moon": {
      "description": "One sentence describing Moon's overall influence today",
      "aspects": {
        "emotions": /* 0-100: Rate emotional intensity and flow based on Moon's transits */,
        "intuition": /* 0-100: Rate intuitive clarity and psychic sensitivity */,
        "comfort": /* 0-100: Rate sense of security, home comfort, and emotional safety */
      }
    },
    "venus": {
      "description": "One sentence describing Venus's overall influence today",
      "aspects": {
        "love": /* 0-100: Rate romance, relationships, and social harmony */,
        "beauty": /* 0-100: Rate aesthetic appreciation and attraction */,
        "pleasure": /* 0-100: Rate enjoyment, sensory pleasure, and values alignment */
      }
    },
    "mercury": {
      "description": "One sentence describing Mercury's overall influence today",
      "aspects": {
        "communication": /* 0-100: Rate clarity in speaking, writing, and expression */,
        "thinking": /* 0-100: Rate mental clarity, focus, and learning ability */,
        "movement": /* 0-100: Rate ease of travel, errands, and making connections */
      }
    }
  },

  "categoryAdvice": {
${selectedCategories.map(category => `    "${category}": {
      "title": "${category.charAt(0).toUpperCase() + category.slice(1)} & [Related Word]",
      "content": "Personalized advice for ${category} (2-3 sentences) based on today's transits"
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
12. If fewer than 2 transits exist, focus deeply on the available ones rather than inventing new aspects
13. MUST include timingData with strengthCurve (24 numbers) for primary and secondary transits
14. Use planet speed categories (fast/slow) to shape realistic strength curves
15. Strength curves should reflect the baseStrength from Swiss Ephemeris data`;
};

/**
 * Create shared data sections for all prompts
 */
const createSharedDataSections = (
  natalChart: NatalChartData,
  transits: TransitData,
  currentPositions: CurrentPositions,
  date: string
): string => {
  const natalPositionsText = formatNatalPositions(natalChart);
  const transitAspectsText = formatTransitAspects(transits);
  const currentPositionsText = formatCurrentPositions(currentPositions);

  return `
═══════════════════════════════════════════════════════════════
📊 DATA SECTIONS
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
`;
};

/**
 * Create shared rules for all prompts
 */
const createSharedRules = (): string => {
  return `
═══════════════════════════════════════════════════════════════
🚨 CRITICAL DATA USAGE RULES 🚨
═══════════════════════════════════════════════════════════════

YOU HAVE THREE DATA SECTIONS:

1. NATAL CHART POSITIONS (Reference Only)
   - User's birth chart positions (NEVER CHANGE)
   - Use to understand core personality and which planets are activated

2. TODAY'S PLANETARY POSITIONS (Background Context Only)
   - Where planets are in the sky TODAY
   - Use for general cosmic weather descriptions
   - ⚠️ DO NOT calculate aspects from this data yourself

3. CURRENT TRANSITS (YOUR PRIMARY INTERPRETATION DATA)
   - Pre-calculated aspects between today's planets and natal planets
   - These are the ONLY aspects you should interpret and discuss
   - ⚠️ If an aspect is NOT listed here, DO NOT mention it AT ALL

✅ DO: Interpret every aspect listed in CURRENT TRANSITS
✅ DO: Use natal positions to understand what's being activated
✅ DO: Use today's positions for general mood/energy descriptions

❌ DON'T: Calculate aspects yourself (even if you can see them)
❌ DON'T: Mention aspects not in the CURRENT TRANSITS list
❌ DON'T: Discuss planetary returns unless explicitly listed as a transit
❌ DON'T: Assume aspects exist between current and natal positions
`;
};

/**
 * CALL 1: Core Reading Prompt
 * Returns: title, summary, fullReading, dailyFocus, advice
 */
export const createCoreReadingPrompt = (
  natalChart: NatalChartData,
  transits: TransitData,
  currentPositions: CurrentPositions,
  date: string,
  userCategories?: string[]
): string => {
  const sharedRules = createSharedRules();
  const sharedData = createSharedDataSections(natalChart, transits, currentPositions, date);

  return `IMPORTANT: Return ONLY valid JSON, no explanatory text before or after.

You are a professional astrologer writing the main daily reading for ${date}.

${sharedRules}

═══════════════════════════════════════════════════════════════
📝 WRITING STYLE & TONE
═══════════════════════════════════════════════════════════════

Tone:
- Conversational and warm, like talking to someone over coffee
- Confident but not preachy - share insights, don't command
- Supportive and empowering - focus on opportunities and growth
- Honest about challenges but frame them constructively

Language Level:
- Write for someone who might know their sun sign but not much else
- Avoid astrological jargon - transform astro-speak to plain English
- Use everyday situations people can relate to

Content Approach:
- Be specific, not vague
- Connect to real life situations
- Give actionable advice
- Acknowledge their unique chart

What to Avoid:
- Mystical fluff: Skip phrases like "the cosmos whispers"
- Doom and gloom: Frame challenges as growth opportunities
- Vague predictions: Be specific and useful
- Overwhelming detail: They don't need exact degrees and orbs
- Generic advice: Make it relevant to their specific planetary setup

Sample Language Transformation:
- Instead of: "Saturn squares your natal Moon creating emotional challenges"
  Write: "You might feel more serious or slightly overwhelmed emotionally today"
- Instead of: "Venus trine Jupiter brings abundance"
  Write: "Good vibes around money, relationships, or things you enjoy are highlighted"

${sharedData}

═══════════════════════════════════════════════════════════════
📝 REQUIRED JSON OUTPUT STRUCTURE
═══════════════════════════════════════════════════════════════

{
  "title": "Compelling title for today's energy (4-8 words)",
  "summary": "2-3 sentence overview of today's most significant astrological influences",
  "fullReading": {
    "introduction": "Opening paragraph (3-4 sentences) setting the stage for today's cosmic influences",
    "bodyParagraphs": [
      "Morning paragraph (3-4 sentences) - focus on early day energy and activities",
      "Afternoon paragraph (3-4 sentences) - focus on midday peak energy and focus areas",
      "Evening paragraph (3-4 sentences) - focus on winding down and integration"
    ],
    "conclusion": "Closing paragraph (2-3 sentences) with key takeaway and encouragement"
  },
  "dailyFocus": "Single sentence capturing today's primary focus",
  "advice": "Overall advice (2-3 sentences) for navigating today's energy"
}

Return ONLY the JSON object above, no other text.`;
};

/**
 * CALL 2: Transit Data Prompt
 * Returns: transitAnalysis, transitInsights
 */
export const createTransitDataPrompt = (
  natalChart: NatalChartData,
  transits: TransitData,
  currentPositions: CurrentPositions,
  date: string,
  userCategories?: string[]
): string => {
  const sharedRules = createSharedRules();
  const sharedData = createSharedDataSections(natalChart, transits, currentPositions, date);

  return `IMPORTANT: Return ONLY valid JSON, no explanatory text before or after.

You are a professional astrologer analyzing specific transits for ${date}.

${sharedRules}

═══════════════════════════════════════════════════════════════
🕐 TRANSIT TIMING & STRENGTH CURVE GUIDELINES
═══════════════════════════════════════════════════════════════

For each transit, provide a STRENGTH CURVE showing how the transit's
effectiveness varies across the 24-hour period.

PLANET SPEED CATEGORIES:
1. FAST-MOVING PLANETS (Moon, Mercury, Venus, Sun, Mars):
   - Move noticeably within 24 hours
   - Create DISTINCT peaks and valleys in the strength curve
   - Peak times focused in 4-8 hour window
   - Strength varies significantly (e.g., from 40% to 100%)

2. SLOW-MOVING PLANETS (Jupiter, Saturn, Uranus, Neptune, Pluto):
   - Barely move in 24 hours
   - Create FLATTER curves near the base strength
   - Peak times about optimal human activity times
   - Strength variation is smaller (e.g., from 80% to 100%)

ASTROLOGICAL TIMING PRINCIPLES:
- Morning (6-12): Best for Mars, Sun energy (action, initiative, leadership)
- Afternoon (12-18): Best for Jupiter, Mercury (expansion, communication, learning)
- Evening (18-24): Best for Moon, Venus (emotions, relationships, creativity)
- Night/Early Morning (0-6): Best for introspective work (Neptune, Pluto, deep healing)

CREATING THE STRENGTH CURVE:
- Array of 24 numbers (0-100), one for each hour (0=midnight to 23=11pm)
- Use the BASE STRENGTH from Swiss Ephemeris as your foundation
- For FAST planets: modulate around base strength with clear peaks at optimal times
- For SLOW planets: stay close to base strength, with gentle emphasis at optimal times

EXAMPLES:

Fast Planet (Moon square natal Venus, 85% base strength):
- Peak: Evening (Venus energy, emotions)
- Curve: [60,55,50,50,55,60,65,70,75,80,82,83,82,80,82,85,90,95,100,95,85,75,70,65]
- Notice: Clear evening peak (hours 16-19), significant variation

Slow Planet (Neptune conjunction natal Chiron, 78% base strength):
- Peak: Early morning (introspective healing)
- Curve: [80,82,85,88,90,88,85,82,80,78,76,75,74,73,73,74,75,76,77,78,78,79,79,80]
- Notice: Gentle early morning peak (hours 2-5), stays close to 78% base

${sharedData}

═══════════════════════════════════════════════════════════════
📝 REQUIRED JSON OUTPUT STRUCTURE
═══════════════════════════════════════════════════════════════

{
  "transitAnalysis": {
    "primary": {
      "aspect": "${transits.summary.strongestAspect ? `${transits.summary.strongestAspect.transitPlanet} ${transits.summary.strongestAspect.aspect} natal ${transits.summary.strongestAspect.natalPlanet}` : 'Primary transit aspect'}",
      "planet": "${transits.summary.strongestAspect ? transits.summary.strongestAspect.transitPlanet : 'Planet'}",
      "natalPlanet": "${transits.summary.strongestAspect ? transits.summary.strongestAspect.natalPlanet : 'NatalPlanet'}",
      "aspectType": "${transits.summary.strongestAspect ? transits.summary.strongestAspect.aspect.toLowerCase() : 'aspect'}",
      "baseStrength": ${transits.summary.strongestAspect ? transits.summary.strongestAspect.strength : 75},
      "interpretation": "Interpretation (3-4 sentences) of this transit's meaning",
      "timing": "When this transit is most potent (e.g., 'Most potent during midday hours')",
      "timingData": {
        "peakHour": 14,
        "effectiveStartHour": 6,
        "effectiveEndHour": 22,
        "strengthCurve": [60,63,66,69,72,75,78,81,84,87,90,92,94,96,98,96,93,89,85,80,75,70,65,62],
        "planetSpeed": "fast or slow based on planet type"
      },
      "advice": "Practical advice (1-2 sentences) for working with this energy"
    },
    "secondary": [
      {
        "aspect": "Secondary transit aspect name (e.g., 'Moon trine natal Jupiter')",
        "planet": "Transiting planet name (e.g., 'Moon')",
        "natalPlanet": "Natal planet name (e.g., 'Jupiter')",
        "aspectType": "Aspect type lowercase (e.g., 'trine')",
        "baseStrength": 80,
        "interpretation": "Interpretation (2-3 sentences)",
        "timing": "Timing information (e.g., 'Strongest in the afternoon')",
        "timingData": {
          "peakHour": 15,
          "effectiveStartHour": 8,
          "effectiveEndHour": 20,
          "strengthCurve": [55,58,61,64,67,70,73,76,79,82,85,87,89,91,93,91,88,84,79,74,68,63,59,56],
          "planetSpeed": "fast or slow"
        },
        "advice": "Practical advice (1-2 sentences)"
      }
    ]
  },
  "transitInsights": [
    "Key insight 1 about today's transits",
    "Key insight 2 about today's transits",
    "Key insight 3 about today's transits",
    "Key insight 4 about today's transits",
    "Key insight 5 about today's transits"
  ]
}

IMPORTANT:
- Include ALL transits from CURRENT TRANSITS section
- Primary should be the strongest transit
- Secondary should include remaining transits (at least 1-2 more)
- strengthCurve must be exactly 24 numbers
- Use planet speed and timing principles to shape realistic curves

Return ONLY the JSON object above, no other text.`;
};

/**
 * CALL 3: Time Guidance Prompt
 * Returns: timeGuidance, explore, limit
 */
export const createTimeGuidancePrompt = (
  natalChart: NatalChartData,
  transits: TransitData,
  currentPositions: CurrentPositions,
  date: string,
  userCategories?: string[]
): string => {
  const sharedRules = createSharedRules();
  const sharedData = createSharedDataSections(natalChart, transits, currentPositions, date);

  return `IMPORTANT: Return ONLY valid JSON, no explanatory text before or after.

You are a professional astrologer providing timing guidance for ${date}.

${sharedRules}

${sharedData}

═══════════════════════════════════════════════════════════════
📝 FOCUS
═══════════════════════════════════════════════════════════════

Create practical time-based recommendations for when to do activities throughout
the day. Focus on actionable timing advice based on the transits.

- Morning: 6am - 12pm
- Afternoon: 12pm - 6pm
- Evening: 6pm - midnight

For each time period:
- Single word capturing the energy (e.g., "Dynamic", "Reflective", "Social")
- 3 specific activities that are best for this time
- 2 things to avoid during this time

Also provide:
- 3 areas to explore today (opportunities, growth areas)
- 3 things to limit or be mindful of (challenges, cautions)

═══════════════════════════════════════════════════════════════
📝 REQUIRED JSON OUTPUT STRUCTURE
═══════════════════════════════════════════════════════════════

{
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
  "explore": ["area to explore 1", "area to explore 2", "area to explore 3"],
  "limit": ["thing to be mindful of 1", "thing to be mindful of 2", "thing to be mindful of 3"]
}

Return ONLY the JSON object above, no other text.`;
};

/**
 * CALL 4: Cosmic Weather Prompt
 * Returns: weather, spiritualGuidance, categoryAdvice
 */
export const createCosmicWeatherPrompt = (
  natalChart: NatalChartData,
  transits: TransitData,
  currentPositions: CurrentPositions,
  date: string,
  userCategories?: string[]
): string => {
  const selectedCategories = getSelectedCategories(userCategories);
  const categoriesList = selectedCategories.map(cat => `"${cat}"`).join(', ');
  const sharedRules = createSharedRules();
  const sharedData = createSharedDataSections(natalChart, transits, currentPositions, date);

  return `IMPORTANT: Return ONLY valid JSON, no explanatory text before or after.

You are a professional astrologer describing today's cosmic weather and providing guidance for ${date}.

${sharedRules}

${sharedData}

═══════════════════════════════════════════════════════════════
📝 FOCUS
═══════════════════════════════════════════════════════════════

Provide planetary weather ratings, spiritual guidance, and category-specific advice.
This feeds mood indicators, spiritual sections, and guidance widgets.

WEATHER RATINGS (0-100):
- Rate how each planet's energy flows today
- Consider both the planet's current position and any transits involving it
- Higher = more supportive/flowing, Lower = more challenging/blocked

SPIRITUAL GUIDANCE:
- Meditation guidance specific to today's energy (2-3 sentences)
- Daily affirmation (8-15 words, powerful and positive)
- 3 journal prompts for self-reflection

CATEGORY ADVICE:
- Personalized advice for user's selected categories: ${categoriesList}
- Each category gets a title with related word (e.g., "Love & Connection")
- 2-3 sentences of practical, transit-based advice

═══════════════════════════════════════════════════════════════
📝 REQUIRED JSON OUTPUT STRUCTURE
═══════════════════════════════════════════════════════════════

{
  "weather": {
    "moon": {
      "description": "One sentence describing Moon's overall influence today",
      "aspects": {
        "emotions": 75,
        "intuition": 82,
        "comfort": 68
      }
    },
    "venus": {
      "description": "One sentence describing Venus's overall influence today",
      "aspects": {
        "love": 71,
        "beauty": 79,
        "pleasure": 85
      }
    },
    "mercury": {
      "description": "One sentence describing Mercury's overall influence today",
      "aspects": {
        "communication": 88,
        "thinking": 92,
        "movement": 76
      }
    }
  },
  "spiritualGuidance": {
    "meditation": "Meditation guidance (2-3 sentences) specific to today's energy",
    "affirmation": "Powerful daily affirmation (one sentence, 8-15 words)",
    "journalPrompts": [
      "Reflective question 1?",
      "Reflective question 2?",
      "Reflective question 3?"
    ]
  },
  "categoryAdvice": {
${selectedCategories.map(category => `    "${category}": {
      "title": "${category.charAt(0).toUpperCase() + category.slice(1)} & [Related Word]",
      "content": "Personalized advice for ${category} (2-3 sentences) based on today's transits"
    }`).join(',\n')}
  }
}

Return ONLY the JSON object above, no other text.`;
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
    if (!response.transitAnalysis.primary) {
      errors.push('Missing transitAnalysis.primary');
    } else {
      // Validate primary transit structure
      const primary = response.transitAnalysis.primary;
      if (!primary.aspect) errors.push('Missing transitAnalysis.primary.aspect');
      if (!primary.interpretation) errors.push('Missing transitAnalysis.primary.interpretation');
      if (!primary.timing) errors.push('Missing transitAnalysis.primary.timing');
      if (!primary.advice) errors.push('Missing transitAnalysis.primary.advice');

      // Validate timingData if present (optional but recommended)
      if (primary.timingData) {
        if (typeof primary.timingData.peakHour !== 'number' || primary.timingData.peakHour < 0 || primary.timingData.peakHour > 23) {
          errors.push('transitAnalysis.primary.timingData.peakHour must be 0-23');
        }
        if (typeof primary.timingData.effectiveStartHour !== 'number' || primary.timingData.effectiveStartHour < 0 || primary.timingData.effectiveStartHour > 23) {
          errors.push('transitAnalysis.primary.timingData.effectiveStartHour must be 0-23');
        }
        if (typeof primary.timingData.effectiveEndHour !== 'number' || primary.timingData.effectiveEndHour < 0 || primary.timingData.effectiveEndHour > 23) {
          errors.push('transitAnalysis.primary.timingData.effectiveEndHour must be 0-23');
        }
        if (!Array.isArray(primary.timingData.strengthCurve) || primary.timingData.strengthCurve.length !== 24) {
          errors.push('transitAnalysis.primary.timingData.strengthCurve must be an array of 24 numbers');
        }
        if (primary.timingData.planetSpeed && !['fast', 'slow'].includes(primary.timingData.planetSpeed)) {
          errors.push('transitAnalysis.primary.timingData.planetSpeed must be "fast" or "slow"');
        }
      }
    }

    if (!response.transitAnalysis.secondary || !Array.isArray(response.transitAnalysis.secondary)) {
      errors.push('transitAnalysis.secondary must be an array');
    } else {
      // Validate secondary transits
      response.transitAnalysis.secondary.forEach((transit: any, index: number) => {
        if (!transit.aspect) errors.push(`Missing transitAnalysis.secondary[${index}].aspect`);
        if (!transit.interpretation) errors.push(`Missing transitAnalysis.secondary[${index}].interpretation`);
        if (!transit.timing) errors.push(`Missing transitAnalysis.secondary[${index}].timing`);
        if (!transit.advice) errors.push(`Missing transitAnalysis.secondary[${index}].advice`);

        // Validate timingData if present
        if (transit.timingData) {
          if (typeof transit.timingData.peakHour !== 'number' || transit.timingData.peakHour < 0 || transit.timingData.peakHour > 23) {
            errors.push(`transitAnalysis.secondary[${index}].timingData.peakHour must be 0-23`);
          }
          if (!Array.isArray(transit.timingData.strengthCurve) || transit.timingData.strengthCurve.length !== 24) {
            errors.push(`transitAnalysis.secondary[${index}].timingData.strengthCurve must be an array of 24 numbers`);
          }
        }
      });
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
  }

  // Check weather structure
  if (response.weather) {
    ['moon', 'venus', 'mercury'].forEach((planet) => {
      if (!response.weather[planet]) {
        errors.push(`Missing weather.${planet}`);
      } else {
        if (!response.weather[planet].description) {
          errors.push(`Missing weather.${planet}.description`);
        }
        if (!response.weather[planet].aspects) {
          errors.push(`Missing weather.${planet}.aspects`);
        } else {
          const requiredAspects = planet === 'moon'
            ? ['emotions', 'intuition', 'comfort']
            : planet === 'venus'
            ? ['love', 'beauty', 'pleasure']
            : ['communication', 'thinking', 'movement'];

          requiredAspects.forEach((aspect) => {
            if (typeof response.weather[planet].aspects[aspect] !== 'number') {
              errors.push(`Missing or invalid weather.${planet}.aspects.${aspect}`);
            }
          });
        }
      }
    });
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

/**
 * Validate Call 1: Core Reading response
 */
export const validateCoreReadingResponse = (response: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check required fields
  if (!response.title) errors.push('Missing title');
  if (!response.summary) errors.push('Missing summary');
  if (!response.dailyFocus) errors.push('Missing dailyFocus');
  if (!response.advice) errors.push('Missing advice');

  // Check fullReading structure
  if (!response.fullReading) {
    errors.push('Missing fullReading');
  } else {
    if (!response.fullReading.introduction) errors.push('Missing fullReading.introduction');
    if (!response.fullReading.bodyParagraphs || !Array.isArray(response.fullReading.bodyParagraphs)) {
      errors.push('fullReading.bodyParagraphs must be an array');
    } else if (response.fullReading.bodyParagraphs.length !== 3) {
      errors.push('fullReading.bodyParagraphs must have exactly 3 entries');
    }
    if (!response.fullReading.conclusion) errors.push('Missing fullReading.conclusion');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validate Call 2: Transit Data response
 */
export const validateTransitDataResponse = (response: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check transitAnalysis structure
  if (!response.transitAnalysis) {
    errors.push('Missing transitAnalysis');
  } else {
    // Check primary
    if (!response.transitAnalysis.primary) {
      errors.push('Missing transitAnalysis.primary');
    } else {
      const primary = response.transitAnalysis.primary;
      if (!primary.aspect) errors.push('Missing transitAnalysis.primary.aspect');
      if (!primary.interpretation) errors.push('Missing transitAnalysis.primary.interpretation');
      if (!primary.timing) errors.push('Missing transitAnalysis.primary.timing');
      if (!primary.advice) errors.push('Missing transitAnalysis.primary.advice');

      // Validate timingData
      if (primary.timingData) {
        if (typeof primary.timingData.peakHour !== 'number' || primary.timingData.peakHour < 0 || primary.timingData.peakHour > 23) {
          errors.push('transitAnalysis.primary.timingData.peakHour must be 0-23');
        }
        if (!Array.isArray(primary.timingData.strengthCurve) || primary.timingData.strengthCurve.length !== 24) {
          errors.push('transitAnalysis.primary.timingData.strengthCurve must be an array of 24 numbers');
        }
      }
    }

    // Check secondary
    if (!response.transitAnalysis.secondary || !Array.isArray(response.transitAnalysis.secondary)) {
      errors.push('transitAnalysis.secondary must be an array');
    } else {
      response.transitAnalysis.secondary.forEach((transit: any, index: number) => {
        if (!transit.aspect) errors.push(`Missing transitAnalysis.secondary[${index}].aspect`);
        if (!transit.interpretation) errors.push(`Missing transitAnalysis.secondary[${index}].interpretation`);
        if (!transit.timing) errors.push(`Missing transitAnalysis.secondary[${index}].timing`);
        if (!transit.advice) errors.push(`Missing transitAnalysis.secondary[${index}].advice`);

        if (transit.timingData) {
          if (typeof transit.timingData.peakHour !== 'number' || transit.timingData.peakHour < 0 || transit.timingData.peakHour > 23) {
            errors.push(`transitAnalysis.secondary[${index}].timingData.peakHour must be 0-23`);
          }
          if (!Array.isArray(transit.timingData.strengthCurve) || transit.timingData.strengthCurve.length !== 24) {
            errors.push(`transitAnalysis.secondary[${index}].timingData.strengthCurve must be an array of 24 numbers`);
          }
        }
      });
    }
  }

  // Check transitInsights
  if (!response.transitInsights || !Array.isArray(response.transitInsights)) {
    errors.push('transitInsights must be an array');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validate Call 3: Time Guidance response
 */
export const validateTimeGuidanceResponse = (response: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check timeGuidance structure
  if (!response.timeGuidance) {
    errors.push('Missing timeGuidance');
  } else {
    ['morning', 'afternoon', 'evening'].forEach((time) => {
      if (!response.timeGuidance[time]) {
        errors.push(`Missing timeGuidance.${time}`);
      } else {
        const period = response.timeGuidance[time];
        if (!period.energy) errors.push(`Missing timeGuidance.${time}.energy`);
        if (!period.bestFor || !Array.isArray(period.bestFor)) {
          errors.push(`timeGuidance.${time}.bestFor must be an array`);
        }
        if (!period.avoid || !Array.isArray(period.avoid)) {
          errors.push(`timeGuidance.${time}.avoid must be an array`);
        }
      }
    });
  }

  // Check explore array
  if (!response.explore || !Array.isArray(response.explore)) {
    errors.push('explore must be an array');
  }

  // Check limit array
  if (!response.limit || !Array.isArray(response.limit)) {
    errors.push('limit must be an array');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validate Call 4: Cosmic Weather response
 */
export const validateCosmicWeatherResponse = (response: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check weather structure
  if (!response.weather) {
    errors.push('Missing weather');
  } else {
    ['moon', 'venus', 'mercury'].forEach((planet) => {
      if (!response.weather[planet]) {
        errors.push(`Missing weather.${planet}`);
      } else {
        if (!response.weather[planet].description) {
          errors.push(`Missing weather.${planet}.description`);
        }
        if (!response.weather[planet].aspects) {
          errors.push(`Missing weather.${planet}.aspects`);
        } else {
          const requiredAspects = planet === 'moon'
            ? ['emotions', 'intuition', 'comfort']
            : planet === 'venus'
            ? ['love', 'beauty', 'pleasure']
            : ['communication', 'thinking', 'movement'];

          requiredAspects.forEach((aspect) => {
            if (typeof response.weather[planet].aspects[aspect] !== 'number') {
              errors.push(`Missing or invalid weather.${planet}.aspects.${aspect}`);
            }
          });
        }
      }
    });
  }

  // Check spiritualGuidance structure
  if (!response.spiritualGuidance) {
    errors.push('Missing spiritualGuidance');
  } else {
    if (!response.spiritualGuidance.meditation) errors.push('Missing spiritualGuidance.meditation');
    if (!response.spiritualGuidance.affirmation) errors.push('Missing spiritualGuidance.affirmation');
    if (!response.spiritualGuidance.journalPrompts || !Array.isArray(response.spiritualGuidance.journalPrompts)) {
      errors.push('spiritualGuidance.journalPrompts must be an array');
    }
  }

  // Check categoryAdvice
  if (!response.categoryAdvice) {
    errors.push('Missing categoryAdvice');
  } else {
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
