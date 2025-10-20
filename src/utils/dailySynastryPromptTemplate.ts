/**
 * AI Prompt Templates for Daily Synastry Forecast Generation
 * Combines synastry analysis with daily transit influences
 */

import {
  SynastryChart,
  TransitData,
  TriggeredSynastryAspect,
} from '../types/synastry';
import { NatalChartData } from '../types/user';

/**
 * Format synastry chart summary
 */
const formatSynastryContext = (synastryChart: SynastryChart): string => {
  const lines: string[] = [];

  lines.push(`Compatibility Score: ${synastryChart.compatibilityScore}/100`);
  lines.push('');
  lines.push('Key Strengths:');
  synastryChart.strengths.slice(0, 3).forEach((strength) => {
    lines.push(`- ${strength}`);
  });
  lines.push('');
  lines.push('Key Challenges:');
  synastryChart.challenges.slice(0, 3).forEach((challenge) => {
    lines.push(`- ${challenge}`);
  });

  return lines.join('\n');
};

/**
 * Format natal positions for a person
 */
const formatNatalPositions = (
  chart: NatalChartData,
  personName: string
): string => {
  const { planets } = chart;
  const lines: string[] = [`${personName}'s Natal Chart:`];

  Object.entries(planets).forEach(([planet, position]) => {
    const capitalizedPlanet = planet.charAt(0).toUpperCase() + planet.slice(1);
    lines.push(`- ${capitalizedPlanet}: ${position.sign} ${position.degree.toFixed(1)}°`);
  });

  return lines.join('\n');
};

/**
 * Format transit aspects for a person
 */
const formatTransitAspects = (
  transits: TransitData,
  personName: string
): string => {
  const lines: string[] = [`${personName}'s Current Transits:`];

  const topAspects = transits.aspects
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 5);

  topAspects.forEach((aspect) => {
    const retrogradeMarker = aspect.transitInfo.isRetrograde ? ' [Rx]' : '';
    lines.push(
      `- ${aspect.transitPlanet} ${aspect.aspect} natal ${aspect.natalPlanet} (${aspect.orb.toFixed(1)}° orb)${retrogradeMarker}`
    );
  });

  return lines.join('\n');
};

/**
 * Format triggered synastry aspects
 */
const formatTriggeredAspects = (
  triggeredAspects: TriggeredSynastryAspect[]
): string => {
  if (triggeredAspects.length === 0) {
    return 'No major relationship aspects strongly triggered today.';
  }

  const lines: string[] = ['Activated Relationship Dynamics:'];

  triggeredAspects.slice(0, 5).forEach((triggered, index) => {
    const { synastryAspect, theme, intensity } = triggered;
    lines.push(
      `${index + 1}. ${synastryAspect.planet1} ${synastryAspect.type} ${synastryAspect.planet2} (Intensity: ${intensity}%)`
    );
    lines.push(`   Theme: ${theme}`);
  });

  return lines.join('\n');
};

/**
 * Format current planetary positions
 */
const formatCurrentPositions = (positions: Record<string, any>): string => {
  const lines: string[] = ['Current Planetary Positions:'];

  Object.entries(positions).forEach(([planet, data]) => {
    const capitalizedPlanet = planet.charAt(0).toUpperCase() + planet.slice(1);
    const retrogradeMarker = data.retrograde ? ' (Rx)' : '';
    lines.push(`- ${capitalizedPlanet}: ${data.sign} ${data.degree.toFixed(1)}°${retrogradeMarker}`);
  });

  return lines.join('\n');
};

/**
 * Create daily synastry forecast prompt for Claude
 */
export const createDailySynastryForecastPrompt = (
  synastryChart: SynastryChart,
  person1Chart: NatalChartData,
  person2Chart: NatalChartData,
  person1Transits: TransitData,
  person2Transits: TransitData,
  currentPositions: Record<string, any>,
  triggeredAspects: TriggeredSynastryAspect[],
  person1Name: string,
  person2Name: string,
  date: string,
  focusArea: 'romantic' | 'friendship' | 'business' | 'family' | 'general' = 'general'
): string => {
  const synastryContext = formatSynastryContext(synastryChart);
  const person1Natal = formatNatalPositions(person1Chart, person1Name);
  const person2Natal = formatNatalPositions(person2Chart, person2Name);
  const person1TransitsText = formatTransitAspects(person1Transits, person1Name);
  const person2TransitsText = formatTransitAspects(person2Transits, person2Name);
  const triggeredAspectsText = formatTriggeredAspects(triggeredAspects);
  const currentPositionsText = formatCurrentPositions(currentPositions);

  const focusGuidance: Record<string, string> = {
    romantic: 'Focus on romantic dynamics, attraction, emotional connection, and intimacy.',
    friendship: 'Focus on friendship dynamics, shared activities, support, and connection.',
    business: 'Focus on professional dynamics, collaboration, productivity, and goals.',
    family: 'Focus on family dynamics, emotional bonds, understanding, and harmony.',
    general: 'Provide balanced insights across all relationship areas.',
  };

  return `IMPORTANT: Return ONLY valid JSON, no explanatory text before or after.

You are a professional relationship astrologer creating a daily forecast for ${person1Name} and ${person2Name}'s relationship on ${date}.

WRITING STYLE & TONE:
You're writing a relationship forecast that feels like getting insights from a knowledgeable friend who understands both astrology and real relationships.

Tone:
- Warm and supportive, like you're rooting for this relationship
- Practical and relationship-focused - what can they actually DO together today?
- Honest about challenges but frame them as opportunities for deeper connection
- Conversational and accessible - no heavy astrological jargon
- Balanced - honor both individual needs AND relationship dynamics

Language Level:
- Write for someone who understands basic relationships but may not know astrology
- Instead of "Venus square Mars" say "tension between wanting closeness and needing space"
- When you must use astro terms, explain them in plain language
- Connect to real relationship situations they'll recognize

Content Approach:
- Be specific, not vague - instead of "good day for communication" say "morning conversations about future plans flow especially well"
- Connect to real life - tie cosmic influences to actual couple situations like date nights, difficult discussions, or shared projects
- Give actionable advice - what can they actually DO with this information together?
- Acknowledge their unique dynamic - this isn't a generic sun sign compatibility reading

What to Avoid:
- Mystical fluff: Skip "the stars align" or "cosmic forces unite"
- Doom and gloom: Even challenging transits can strengthen bonds
- Vague predictions: "Something important will happen" tells them nothing
- Overwhelming detail: They don't need exact degrees and orbs
- One-sided focus: Balance both people's needs and energies

What to Include:
- Practical timing: "This morning is better for important talks than this evening"
- Emotional context: "You might both feel extra sensitive today, and that's actually helpful for..."
- Opportunity spotting: "This is a good day to..." or "Pay attention to..."
- Challenge navigation: "If tensions arise around X, try Y approach"
- Relationship validation: Reference how today's energy works with their natural dynamic

RELATIONSHIP CONTEXT:
${synastryContext}

${person1Natal}

${person2Natal}

${person1TransitsText}

${person2TransitsText}

${currentPositionsText}

${triggeredAspectsText}

TODAY'S DATE: ${date}
FOCUS AREA: ${focusArea}
${focusGuidance[focusArea]}

HOW TO USE THIS DATA:

1. NATAL CHARTS = Both people's birth charts (fixed reference points)
   - Use this to understand their core natures and relationship patterns

2. CURRENT PLANETARY POSITIONS = Today's sky (general background context)
   - Use this ONLY for describing general cosmic weather
   - DO NOT calculate aspects from this data yourself

3. INDIVIDUAL TRANSITS = Pre-calculated aspects for each person TODAY
   - These show what each person is experiencing individually
   - Consider how individual transits affect the relationship dynamic

4. TRIGGERED SYNASTRY ASPECTS = Relationship aspects activated TODAY
   - These are the MOST IMPORTANT for relationship forecast
   - Show which parts of their connection are "lit up" today

5. SYNASTRY CONTEXT = Overall relationship strengths and challenges
   - Use this to understand their baseline dynamic
   - Frame today's energy in context of their overall compatibility

IMPORTANT:
- Focus primarily on triggered synastry aspects - these directly affect the relationship
- Individual transits matter when they impact how each person shows up in the relationship
- Do not calculate aspects yourself - only interpret what's provided
- Connect today's transits to their ongoing relationship themes

Create a DETAILED daily relationship forecast with this exact JSON structure. ALL FIELDS ARE REQUIRED:

{
  "topTheme": "Compelling theme/title for today's relationship energy (4-8 words)",
  "summary": "2-3 sentence overview of how today's planetary influences affect this relationship",
  "energyRating": "harmonious|intense|challenging|transformative",

  "introduction": "Opening paragraph (3-4 sentences) setting the stage for today's relationship energy. What's the overall vibe between you two today?",

  "timeBasedForecasts": {
    "morning": {
      "energy": "Single word describing morning energy (Connected/Dynamic/Tender/Intense/etc)",
      "narrative": "4-6 sentences about relationship dynamics in the morning (6am-12pm). How do you two interact? What flows easily? What needs attention? Be specific about conversations, activities, emotional tone.",
      "bestFor": ["Specific activity 1", "Specific activity 2", "Specific activity 3"],
      "avoid": ["Thing to avoid 1", "Thing to avoid 2"]
    },
    "afternoon": {
      "energy": "Single word describing afternoon energy",
      "narrative": "4-6 sentences about relationship dynamics in the afternoon (12pm-6pm). How does the energy shift? What activities or conversations are favored? How to navigate any tensions?",
      "bestFor": ["Specific activity 1", "Specific activity 2", "Specific activity 3"],
      "avoid": ["Thing to avoid 1", "Thing to avoid 2"]
    },
    "evening": {
      "energy": "Single word describing evening energy",
      "narrative": "4-6 sentences about relationship dynamics in the evening (6pm-12am). Focus on winding down together, emotional connection, intimacy. How to end the day on a positive note?",
      "bestFor": ["Specific activity 1", "Specific activity 2", "Specific activity 3"],
      "avoid": ["Thing to avoid 1", "Thing to avoid 2"]
    }
  },

  "transitAnalysis": {
    "primary": {
      "aspect": "Primary triggered synastry aspect or most significant individual transit affecting the relationship",
      "interpretation": "4-6 sentences explaining what this means for the relationship today. How does it show up between you? What's being activated?",
      "timing": "When this is most potent (e.g., 'Most active during morning and early afternoon')",
      "advice": "2-3 sentences of practical advice for working with this energy together"
    },
    "secondary": [
      {
        "aspect": "Secondary transit or triggered aspect",
        "interpretation": "3-4 sentences about its impact on the relationship",
        "timing": "When it's most noticeable",
        "advice": "1-2 sentences of practical guidance"
      }
    ]
  },

  "relationshipInsights": [
    "Insight about connection quality today (2-3 sentences)",
    "Insight about communication climate (2-3 sentences)",
    "Insight about emotional tone (2-3 sentences)",
    "Insight about growth opportunities (2-3 sentences)",
    "Insight about potential challenges (2-3 sentences)"
  ],

  "guidance": {
    "focusOn": "2-3 sentences about what to prioritize together today",
    "exploreTogether": [
      "Area to explore or activity to try 1",
      "Area to explore or activity to try 2",
      "Area to explore or activity to try 3",
      "Area to explore or activity to try 4"
    ],
    "beMindfulOf": [
      "Thing to watch out for 1",
      "Thing to watch out for 2",
      "Thing to watch out for 3"
    ]
  },

  "connectionPractice": {
    "exercise": "2-3 sentences describing a simple practice or activity to deepen connection today (meditation, conversation starter, shared ritual)",
    "affirmation": "Powerful relationship affirmation for today (one sentence, 8-15 words)",
    "reflectionPrompts": [
      "Question to reflect on individually or discuss together 1?",
      "Question to reflect on individually or discuss together 2?",
      "Question to reflect on individually or discuss together 3?"
    ]
  },

  "conclusion": "Closing paragraph (2-3 sentences) with key takeaway and encouragement for the day ahead together"
}

CRITICAL REQUIREMENTS:
1. Return ONLY the JSON object, no other text before or after
2. ALL fields must be present and filled completely
3. Write in second person ("you two", "your relationship") to address the couple directly
4. Reference both ${person1Name} and ${person2Name} by name throughout the forecast
5. Connect today's transits to their specific synastry dynamics and compatibility themes
6. If triggered synastry aspects exist, make them central to the forecast
7. Be specific to TODAY - mention time of day, specific activities, real situations
8. Keep it practical and actionable - what can they actually do with this information?
9. Balance individual needs with relationship dynamics
10. Frame challenges constructively - always include how to work with difficult energy
11. energyRating must be exactly one of: harmonious, intense, challenging, transformative
12. Each narrative section should be substantial (100+ words) and specific
13. Activities suggested should be concrete and doable today
14. Insights should go deeper than surface observations
15. Transit analysis should reference the actual astrological data provided
16. Focus on CONNECTION - everything should help them understand and navigate their relationship today

EXAMPLES OF GOOD VS BAD:

BAD: "Communication may be important today."
GOOD: "With Mercury activating ${person1Name}'s natal Moon, conversations about feelings flow more easily this morning. ${person2Name}, you'll find your partner especially receptive to heart-to-hearts before noon - this is the perfect window to discuss that thing you've been wanting to talk about."

BAD: "Spend time together."
GOOD: "Go for a walk together around 3pm - physical movement helps channel the restless Mars energy you're both feeling. The combination of fresh air and side-by-side movement (rather than face-to-face intensity) creates the perfect space for spontaneous conversation."

BAD: "Be aware of tensions."
GOOD: "Around dinner time, you might notice competing desires for attention. ${person1Name}, you're craving quiet and space to recharge, while ${person2Name}, you're seeking connection and closeness. Rather than push against each other, name it out loud: 'I need 20 minutes to decompress, then let's cook dinner together.' This honors both needs."

BAD: "The stars suggest romance."
GOOD: "Venus's position makes you extra appreciative of each other tonight. ${person2Name}, you might notice yourself really seeing and valuing the little things ${person1Name} does. Say it out loud - specific appreciation lands so much deeper than generic 'I love you's."

Write the complete forecast now:`;
};

/**
 * Validate daily synastry forecast response (V2 format)
 */
export const validateDailySynastryForecastResponse = (
  response: any
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check required top-level fields
  if (!response.topTheme) errors.push('Missing topTheme');
  if (!response.summary) errors.push('Missing summary');
  if (!response.energyRating) errors.push('Missing energyRating');
  if (!response.introduction) errors.push('Missing introduction');
  if (!response.timeBasedForecasts) errors.push('Missing timeBasedForecasts');
  if (!response.transitAnalysis) errors.push('Missing transitAnalysis');
  if (!response.relationshipInsights) errors.push('Missing relationshipInsights');
  if (!response.guidance) errors.push('Missing guidance');
  if (!response.connectionPractice) errors.push('Missing connectionPractice');
  if (!response.conclusion) errors.push('Missing conclusion');

  // Validate energyRating
  if (response.energyRating) {
    const validRatings = ['harmonious', 'intense', 'challenging', 'transformative'];
    if (!validRatings.includes(response.energyRating)) {
      errors.push(
        `energyRating must be one of: ${validRatings.join(', ')}`
      );
    }
  }

  // Validate timeBasedForecasts structure
  if (response.timeBasedForecasts) {
    const times = ['morning', 'afternoon', 'evening'];
    times.forEach((time) => {
      if (!response.timeBasedForecasts[time]) {
        errors.push(`Missing timeBasedForecasts.${time}`);
      } else {
        const timeData = response.timeBasedForecasts[time];
        if (!timeData.energy) errors.push(`Missing timeBasedForecasts.${time}.energy`);
        if (!timeData.narrative) errors.push(`Missing timeBasedForecasts.${time}.narrative`);
        if (!timeData.bestFor || !Array.isArray(timeData.bestFor)) {
          errors.push(`timeBasedForecasts.${time}.bestFor must be an array`);
        }
        if (!timeData.avoid || !Array.isArray(timeData.avoid)) {
          errors.push(`timeBasedForecasts.${time}.avoid must be an array`);
        }
      }
    });
  }

  // Validate transitAnalysis structure
  if (response.transitAnalysis) {
    if (!response.transitAnalysis.primary) {
      errors.push('Missing transitAnalysis.primary');
    } else {
      const primary = response.transitAnalysis.primary;
      if (!primary.aspect) errors.push('Missing transitAnalysis.primary.aspect');
      if (!primary.interpretation) errors.push('Missing transitAnalysis.primary.interpretation');
      if (!primary.timing) errors.push('Missing transitAnalysis.primary.timing');
      if (!primary.advice) errors.push('Missing transitAnalysis.primary.advice');
    }

    if (response.transitAnalysis.secondary && !Array.isArray(response.transitAnalysis.secondary)) {
      errors.push('transitAnalysis.secondary must be an array');
    }
  }

  // Validate relationshipInsights
  if (response.relationshipInsights) {
    if (!Array.isArray(response.relationshipInsights)) {
      errors.push('relationshipInsights must be an array');
    } else if (response.relationshipInsights.length < 5) {
      errors.push('relationshipInsights must have at least 5 items');
    }
  }

  // Validate guidance structure
  if (response.guidance) {
    if (!response.guidance.focusOn) errors.push('Missing guidance.focusOn');
    if (!response.guidance.exploreTogether || !Array.isArray(response.guidance.exploreTogether)) {
      errors.push('guidance.exploreTogether must be an array');
    }
    if (!response.guidance.beMindfulOf || !Array.isArray(response.guidance.beMindfulOf)) {
      errors.push('guidance.beMindfulOf must be an array');
    }
  }

  // Validate connectionPractice structure
  if (response.connectionPractice) {
    if (!response.connectionPractice.exercise) errors.push('Missing connectionPractice.exercise');
    if (!response.connectionPractice.affirmation) errors.push('Missing connectionPractice.affirmation');
    if (!response.connectionPractice.reflectionPrompts || !Array.isArray(response.connectionPractice.reflectionPrompts)) {
      errors.push('connectionPractice.reflectionPrompts must be an array');
    }
  }

  // Validate minimum content lengths
  if (response.introduction && response.introduction.length < 100) {
    errors.push('introduction is too short');
  }
  if (response.conclusion && response.conclusion.length < 50) {
    errors.push('conclusion is too short');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
