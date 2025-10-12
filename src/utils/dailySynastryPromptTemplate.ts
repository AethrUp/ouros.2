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
- Warm, supportive, and relationship-focused
- Practical and actionable - what can they actually DO together today?
- Balanced - acknowledge both individual transits AND relationship dynamics
- Conversational and accessible - no heavy astrological jargon
- Empowering - frame challenges as opportunities for growth
- Specific to TODAY - not generic relationship advice

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

Create a DETAILED daily relationship forecast with this exact JSON structure. ALL FIELDS ARE REQUIRED:

{
  "title": "Compelling title for today's relationship energy (4-8 words)",
  "summary": "2-3 sentence overview of how today's planetary influences affect this relationship",
  "energyRating": "harmonious|intense|challenging|transformative",
  "topTheme": "Single phrase capturing the dominant theme (5-8 words)",

  "morningForecast": "4-6 sentences about relationship energy and dynamics in the morning hours (6am-12pm). Be specific about how you two might interact, what flows easily, what to be mindful of. Include practical suggestions.",

  "afternoonForecast": "4-6 sentences about relationship energy in the afternoon (12pm-6pm). Describe how the dynamic shifts, what activities or conversations are favored, how to navigate any tensions.",

  "eveningForecast": "4-6 sentences about relationship energy in the evening (6pm-12am). Focus on winding down together, emotional connection, and how to end the day on a positive note.",

  "advice": [
    "Practical advice item 1 (1-2 sentences)",
    "Practical advice item 2 (1-2 sentences)",
    "Practical advice item 3 (1-2 sentences)",
    "Practical advice item 4 (1-2 sentences)"
  ],

  "activitiesSuggested": [
    "Specific activity suggestion 1",
    "Specific activity suggestion 2",
    "Specific activity suggestion 3",
    "Specific activity suggestion 4",
    "Specific activity suggestion 5"
  ],

  "activitiesToAvoid": [
    "Thing to avoid 1 with brief reason",
    "Thing to avoid 2 with brief reason",
    "Thing to avoid 3 with brief reason"
  ],

  "transitAnalysis": "2-3 paragraphs analyzing how today's transits specifically affect this relationship. Reference the triggered synastry aspects. Explain what's being activated and why it matters. Connect individual transits to relationship dynamics."
}

CRITICAL REQUIREMENTS:
1. Return ONLY the JSON object, no other text before or after
2. ALL fields must be present and filled completely
3. Write in second person ("you two", "your relationship") to address the couple
4. Reference both ${person1Name} and ${person2Name} by name when relevant
5. Connect today's transits to their specific synastry dynamics
6. If triggered aspects exist, weave them into the forecast naturally
7. Be specific to TODAY - mention time of day, specific activities, real situations
8. Keep it practical - what can they actually do with this information?
9. Balance individual needs with relationship dynamics
10. Frame challenges constructively - always include how to work with difficult energy
11. energyRating must be exactly one of: harmonious, intense, challenging, transformative
12. Each forecast section (morning/afternoon/evening) should be substantial and specific
13. Activities suggested should be concrete and doable
14. Advice should be actionable, not platitudes
15. Transit analysis should reference the actual astrological data provided

EXAMPLES OF GOOD VS BAD:

BAD: "Communication may be important today."
GOOD: "With Mercury activating ${person1Name}'s natal Moon, conversations about feelings flow more easily this morning. ${person2Name}, you'll find your partner especially receptive to heart-to-hearts before noon."

BAD: "Spend time together."
GOOD: "Go for a walk together this afternoon - physical movement helps channel the restless Mars energy you're both feeling."

BAD: "Be aware of tensions."
GOOD: "Around 3pm, you might notice competing desires for attention. ${person1Name} needs space while ${person2Name} wants connection. Rather than push, agree to reconnect at dinner."

Write the forecast now:`;
};

/**
 * Validate daily synastry forecast response
 */
export const validateDailySynastryForecastResponse = (
  response: any
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check required fields
  if (!response.title) errors.push('Missing title');
  if (!response.summary) errors.push('Missing summary');
  if (!response.energyRating) errors.push('Missing energyRating');
  if (!response.topTheme) errors.push('Missing topTheme');
  if (!response.morningForecast) errors.push('Missing morningForecast');
  if (!response.afternoonForecast) errors.push('Missing afternoonForecast');
  if (!response.eveningForecast) errors.push('Missing eveningForecast');
  if (!response.advice) errors.push('Missing advice');
  if (!response.activitiesSuggested) errors.push('Missing activitiesSuggested');
  if (!response.activitiesToAvoid) errors.push('Missing activitiesToAvoid');
  if (!response.transitAnalysis) errors.push('Missing transitAnalysis');

  // Validate energyRating
  if (response.energyRating) {
    const validRatings = ['harmonious', 'intense', 'challenging', 'transformative'];
    if (!validRatings.includes(response.energyRating)) {
      errors.push(
        `energyRating must be one of: ${validRatings.join(', ')}`
      );
    }
  }

  // Validate arrays
  if (response.advice && !Array.isArray(response.advice)) {
    errors.push('advice must be an array');
  }
  if (response.activitiesSuggested && !Array.isArray(response.activitiesSuggested)) {
    errors.push('activitiesSuggested must be an array');
  }
  if (response.activitiesToAvoid && !Array.isArray(response.activitiesToAvoid)) {
    errors.push('activitiesToAvoid must be an array');
  }

  // Validate minimum array lengths
  if (response.advice && response.advice.length < 3) {
    errors.push('advice must have at least 3 items');
  }
  if (response.activitiesSuggested && response.activitiesSuggested.length < 3) {
    errors.push('activitiesSuggested must have at least 3 items');
  }
  if (response.activitiesToAvoid && response.activitiesToAvoid.length < 2) {
    errors.push('activitiesToAvoid must have at least 2 items');
  }

  // Validate content length
  if (response.morningForecast && response.morningForecast.length < 100) {
    errors.push('morningForecast is too short');
  }
  if (response.afternoonForecast && response.afternoonForecast.length < 100) {
    errors.push('afternoonForecast is too short');
  }
  if (response.eveningForecast && response.eveningForecast.length < 100) {
    errors.push('eveningForecast is too short');
  }
  if (response.transitAnalysis && response.transitAnalysis.length < 200) {
    errors.push('transitAnalysis is too short');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
