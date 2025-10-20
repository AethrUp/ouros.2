/**
 * Planet-House Interpretation Handler
 * Generates AI-powered interpretations for each planet's house placement
 */

import Anthropic from '@anthropic-ai/sdk';
import { BirthData, NatalChartData, PlanetPosition, PersonalizedDescription, WholeChartInterpretation } from '../types/user';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '',
});

// Planet names for display (keys match Swiss Ephemeris API capitalization)
const PLANET_DISPLAY_NAMES: Record<string, string> = {
  Sun: 'Sun',
  Moon: 'Moon',
  Mercury: 'Mercury',
  Venus: 'Venus',
  Mars: 'Mars',
  Jupiter: 'Jupiter',
  Saturn: 'Saturn',
  Uranus: 'Uranus',
  Neptune: 'Neptune',
  Pluto: 'Pluto',
  'North Node': 'North Node',
  Chiron: 'Chiron',
};

// House ordinals for display
const HOUSE_ORDINALS: Record<number, string> = {
  1: '1st',
  2: '2nd',
  3: '3rd',
  4: '4th',
  5: '5th',
  6: '6th',
  7: '7th',
  8: '8th',
  9: '9th',
  10: '10th',
  11: '11th',
  12: '12th',
};

/**
 * Calculate user's current age from birth data
 */
const calculateAge = (birthDate: string): number => {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};

/**
 * Get the ruling planet of a zodiac sign
 */
const getSignRuler = (sign: string): string => {
  const rulers: Record<string, string> = {
    Aries: 'Mars',
    Taurus: 'Venus',
    Gemini: 'Mercury',
    Cancer: 'Moon',
    Leo: 'Sun',
    Virgo: 'Mercury',
    Libra: 'Venus',
    Scorpio: 'Pluto',
    Sagittarius: 'Jupiter',
    Capricorn: 'Saturn',
    Aquarius: 'Uranus',
    Pisces: 'Neptune',
  };

  return rulers[sign] || 'Unknown';
};

/**
 * Get other planets in the same house
 */
const getOtherPlanetsInHouse = (
  planetKey: string,
  house: number,
  allPlanets: Record<string, PlanetPosition>
): string[] => {
  return Object.entries(allPlanets)
    .filter(([key, planet]) => key !== planetKey && planet.house === house)
    .map(([key]) => PLANET_DISPLAY_NAMES[key] || key);
};

/**
 * Construct the prompt for planet-house interpretation
 */
const constructPlanetHousePrompt = (
  planetKey: string,
  planetData: PlanetPosition,
  chartData: NatalChartData,
  birthData: BirthData
): string => {
  const planetName = PLANET_DISPLAY_NAMES[planetKey];
  const houseOrdinal = HOUSE_ORDINALS[planetData.house];
  const age = calculateAge(birthData.birthDate);

  // Get the house cusp sign (the sign on the house cusp)
  const houseCusp = chartData.houses.find(h => h.house === planetData.house);
  const houseCuspSign = houseCusp?.sign || 'Unknown';
  const houseRuler = getSignRuler(houseCuspSign);

  // Get other planets in this house
  const otherPlanets = getOtherPlanetsInHouse(planetKey, planetData.house, chartData.planets);

  const prompt = `# Planet in House Interpretation Prompt

You are creating a personalized interpretation for a specific planet's placement in a natal chart house. Focus on how this placement shows up in practical, everyday life while maintaining an empowering and growth-oriented tone.

## Input Data:

### Primary Data:
- **Planet:** ${planetName}
- **House:** ${houseOrdinal} house
- **Sign:** ${planetData.sign}
- **Degree:** ${planetData.degree.toFixed(2)}°
- **Retrograde:** ${planetData.retrograde ? 'Yes' : 'No'}

### Supporting Context:
- **House ruler:** ${houseRuler} (ruler of ${houseCuspSign} on the ${houseOrdinal} house cusp)
- **Other planets in same house:** ${otherPlanets.length > 0 ? otherPlanets.join(', ') : 'None'}
- **User's age:** ${age}

## Interpretation Structure:

### Opening Statement (1-2 sentences)
Clearly explain what this placement means in accessible language.

### How This Shows Up in Daily Life (2-3 sentences)
Provide concrete, relatable examples of how this energy manifests.
*Focus on behaviors, preferences, motivations they'd recognize*

### Strengths & Natural Gifts (2-3 sentences)
Highlight the positive expressions and talents this placement provides.
*What they're naturally good at, what comes easily*

### Growth Opportunities (1-2 sentences)
Gently address potential challenges as growth edges, not limitations.
*Frame as "learning to..." or "developing..." rather than problems*

### Practical Integration (1-2 sentences)
Offer actionable insight on how to work with this energy effectively.
*How they can optimize this placement in their current life*

## Writing Guidelines:

**Tone:**
- Warm and validating
- Curious rather than definitive
- Empowering, not limiting
- Personal and relatable

**Language Style:**
- Use "you might find" instead of "you will"
- Include phrases like "often," "tends to," "naturally drawn to"
- Avoid astrological jargon (no "squares," "orbs," "dignities")
- Use metaphors and everyday examples
- Use gender-neutral language (they/them/their when referring to the person)

**Length:** 150-250 words total

**Key Principles:**
- Every placement has gifts AND growth edges
- Focus on potential, not fate
- Connect to universal human experiences
- Help them understand their unique wiring

## Avoid:
- Predictions about specific events
- Absolute statements about personality
- Cultural stereotypes
- Technical astrological terms
- Negative judgments about any placement

Please provide ONLY the interpretation text (150-250 words), without any additional formatting, headers, or JSON structure. Just the pure interpretation text.`;

  return prompt;
};

/**
 * Generate interpretation for a single planet
 */
const generateSinglePlanetInterpretation = async (
  planetKey: string,
  planetData: PlanetPosition,
  chartData: NatalChartData,
  birthData: BirthData
): Promise<string> => {
  const prompt = constructPlanetHousePrompt(planetKey, planetData, chartData, birthData);

  console.log(`🔮 Generating interpretation for ${PLANET_DISPLAY_NAMES[planetKey]} in ${HOUSE_ORDINALS[planetData.house]} house...`);

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const interpretationText = response.content[0]?.type === 'text'
      ? response.content[0].text
      : '';

    if (!interpretationText) {
      throw new Error('AI returned empty response');
    }

    console.log(`✅ Generated interpretation for ${PLANET_DISPLAY_NAMES[planetKey]} (${response.usage.output_tokens} tokens)`);

    return interpretationText.trim();

  } catch (error: any) {
    console.error(`❌ Failed to generate interpretation for ${planetKey}:`, error);
    throw error;
  }
};

/**
 * Extract brief summary (first 1-2 sentences) from full interpretation
 */
const extractBriefSummary = (fullText: string): string => {
  // Split by periods and take first 1-2 sentences
  const sentences = fullText.split(/\.\s+/);

  if (sentences.length >= 2) {
    return sentences.slice(0, 2).join('. ') + '.';
  }

  return sentences[0] + '.';
};

/**
 * Extract keywords from interpretation
 */
const extractKeywords = (planetKey: string, fullText: string): string[] => {
  // Simple keyword extraction - look for emphasized themes
  const commonThemes: Record<string, string[]> = {
    Sun: ['identity', 'self-expression', 'vitality', 'purpose'],
    Moon: ['emotions', 'intuition', 'comfort', 'nurturing'],
    Mercury: ['communication', 'thinking', 'learning', 'connection'],
    Venus: ['relationships', 'values', 'beauty', 'harmony'],
    Mars: ['action', 'energy', 'drive', 'passion'],
    Jupiter: ['growth', 'expansion', 'wisdom', 'optimism'],
    Saturn: ['discipline', 'structure', 'responsibility', 'mastery'],
    Uranus: ['innovation', 'freedom', 'uniqueness', 'change'],
    Neptune: ['imagination', 'spirituality', 'compassion', 'dreams'],
    Pluto: ['transformation', 'power', 'depth', 'renewal'],
    'North Node': ['destiny', 'growth', 'purpose', 'evolution'],
    Chiron: ['healing', 'wounds', 'wisdom', 'teaching'],
  };

  // Return planet-specific keywords
  return commonThemes[planetKey] || [];
};

/**
 * Generate PersonalizedDescription for a planet
 */
const createPersonalizedDescription = (planetKey: string, fullInterpretation: string): PersonalizedDescription => {
  return {
    brief: extractBriefSummary(fullInterpretation),
    detailed: fullInterpretation,
    keywords: extractKeywords(planetKey, fullInterpretation),
    generatedAt: new Date().toISOString(),
    version: '1.0',
  };
};

/**
 * Generate interpretations for all planets in the natal chart
 */
export const generatePlanetHouseInterpretations = async (
  chartData: NatalChartData,
  birthData: BirthData
): Promise<Record<string, PersonalizedDescription>> => {
  console.log('🌟 Starting planet-house interpretation generation...');

  const interpretations: Record<string, PersonalizedDescription> = {};
  const planetKeys = Object.keys(chartData.planets);

  console.log(`📊 Generating interpretations for ${planetKeys.length} planets in parallel...`);

  // Generate all interpretations in parallel using Promise.allSettled
  const interpretationPromises = planetKeys.map(async (planetKey) => {
    const planetData = chartData.planets[planetKey];
    try {
      const fullInterpretation = await generateSinglePlanetInterpretation(
        planetKey,
        planetData,
        chartData,
        birthData
      );
      return {
        planetKey,
        success: true,
        interpretation: createPersonalizedDescription(planetKey, fullInterpretation),
      };
    } catch (error: any) {
      console.error(`❌ Failed to generate interpretation for ${planetKey}:`, error);
      return {
        planetKey,
        success: false,
        error,
      };
    }
  });

  // Wait for all promises to settle
  const results = await Promise.allSettled(interpretationPromises);

  // Process results
  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      const { planetKey, success, interpretation } = result.value;

      if (success && interpretation) {
        interpretations[planetKey] = interpretation;
      } else {
        // Failed to generate, use error message
        interpretations[planetKey] = {
          brief: 'Error getting interpretation.',
          detailed: 'Error getting interpretation.',
          keywords: extractKeywords(planetKey, ''),
          generatedAt: new Date().toISOString(),
          version: '1.0',
        };
      }
    } else {
      // Promise itself was rejected (shouldn't happen with our try-catch, but handle it)
      console.error('❌ Unexpected promise rejection:', result.reason);
    }
  });

  const successCount = Object.values(interpretations).filter(
    (interp) => interp.detailed !== 'Error getting interpretation.'
  ).length;

  console.log(`✅ Generated ${successCount}/${planetKeys.length} planet-house interpretations successfully`);

  return interpretations;
};

/**
 * Construct prompt for whole chart interpretation
 */
const constructWholeChartPrompt = (
  chartData: NatalChartData,
  birthData: BirthData
): string => {
  const age = calculateAge(birthData.birthDate);
  const planets = chartData.planets;

  // Get essential planetary positions
  const sun = planets.Sun || planets.sun;
  const moon = planets.Moon || planets.moon;
  const venus = planets.Venus || planets.venus;
  const mars = planets.Mars || planets.mars;
  const jupiter = planets.Jupiter || planets.jupiter;
  const saturn = planets.Saturn || planets.saturn;
  const northNode = planets['North Node'] || planets['north node'];

  // Get ascendant sign
  const ascendantDegree = chartData.angles.ascendant;
  const ascendantSign = getSignFromDegree(ascendantDegree);

  // Get midheaven sign
  const midheavenDegree = chartData.angles.midheaven;
  const midheavenSign = getSignFromDegree(midheavenDegree);

  // Get 7th house info
  const house7 = chartData.houses.find(h => h.house === 7);
  const planetsInHouse7 = Object.entries(planets)
    .filter(([_, planet]) => planet.house === 7)
    .map(([key, _]) => PLANET_DISPLAY_NAMES[key] || key);

  // Get 10th house info
  const house10 = chartData.houses.find(h => h.house === 10);
  const planetsInHouse10 = Object.entries(planets)
    .filter(([_, planet]) => planet.house === 10)
    .map(([key, _]) => PLANET_DISPLAY_NAMES[key] || key);

  // Format aspects
  let aspectsSummary = 'None provided';
  if (chartData.aspects && chartData.aspects.length > 0) {
    const majorAspects = chartData.aspects.filter(a =>
      ['conjunction', 'opposition', 'square', 'trine', 'sextile'].includes(a.type)
    );
    aspectsSummary = majorAspects.map(a =>
      `${PLANET_DISPLAY_NAMES[a.planet1] || a.planet1} ${a.type} ${PLANET_DISPLAY_NAMES[a.planet2] || a.planet2} (${a.orb.toFixed(1)}°)`
    ).join('\n');
  }

  const prompt = `# Natal Chart Interpretation Prompt

You are creating a personalized natal chart interpretation that helps someone understand their cosmic blueprint for personal growth and relationships. Use warm, accessible language that feels supportive rather than deterministic.

## Input Data:

### Essential Planetary Positions:
- **Sun:** ${sun?.sign || 'Unknown'} in ${HOUSE_ORDINALS[sun?.house || 1]} house
- **Moon:** ${moon?.sign || 'Unknown'} in ${HOUSE_ORDINALS[moon?.house || 1]} house
- **Rising/Ascendant:** ${ascendantSign}
- **Venus:** ${venus?.sign || 'Unknown'} in ${HOUSE_ORDINALS[venus?.house || 1]} house
- **Mars:** ${mars?.sign || 'Unknown'} in ${HOUSE_ORDINALS[mars?.house || 1]} house
- **Jupiter:** ${jupiter?.sign || 'Unknown'} in ${HOUSE_ORDINALS[jupiter?.house || 1]} house
- **Saturn:** ${saturn?.sign || 'Unknown'} in ${HOUSE_ORDINALS[saturn?.house || 1]} house
- **North Node:** ${northNode?.sign || 'Unknown'} in ${HOUSE_ORDINALS[northNode?.house || 1]} house

### Key House Information:
- **7th House:** ${house7?.sign || 'Unknown'} on the cusp${planetsInHouse7.length > 0 ? ` + ${planetsInHouse7.join(', ')} inside` : ', no planets inside'}
- **10th House/Midheaven:** ${midheavenSign} on the cusp${planetsInHouse10.length > 0 ? ` + ${planetsInHouse10.join(', ')} inside` : ', no planets inside'}

### Major Aspects:
${aspectsSummary}

### Birth Information:
- Birth date: ${birthData.birthDate}
- Birth location: ${birthData.birthLocation.name}
- Age: ${age}

## Structure your interpretation in 4 sections:

### 1. Your Core Nature (Sun, Moon, Rising)
**Purpose:** Help them understand their fundamental operating system
**Tone:** Validating and empowering
**Focus:** How they naturally shine, feel safe, and engage with the world

*Example opening:* "Your cosmic signature reveals someone who..."

### 2. How You Love & Connect (Venus, Mars, 7th House)
**Purpose:** Illuminate their relationship patterns and needs
**Tone:** Insightful and practical for relationships
**Focus:** What brings them joy, how they pursue what they want, partnership style

*Example opening:* "In relationships, you naturally..."

### 3. Your Growth Edge (North Node, Saturn, challenging aspects)
**Purpose:** Reframe challenges as purposeful development areas
**Tone:** Encouraging growth mindset, not prescriptive
**Focus:** What they're here to learn and develop in this lifetime

*Example opening:* "Your soul is learning to..."

### 4. Your Gifts to the World (Midheaven, Jupiter, harmonious aspects)
**Purpose:** Help them see their unique contribution and strengths
**Tone:** Inspiring and confidence-building
**Focus:** Natural talents, how they can serve, career themes

*Example opening:* "You're designed to contribute through..."

## Writing Guidelines:

**Language Style:**
- Use "you naturally tend to" instead of "you are"
- Avoid absolute statements - include phrases like "often," "may find," "might discover"
- Focus on strengths while acknowledging growth areas
- Use metaphors and analogies that feel relatable

**Avoid:**
- Overly technical astrological terms
- Negative predictions or warnings
- Making decisions for them
- Cultural stereotypes about signs

**Include:**
- Practical examples of how traits might show up in daily life
- Validation of their unique design
- Connection between different parts of their chart
- Encouragement for their personal journey

**Length:** Keep each section 2-3 paragraphs, total interpretation 500-800 words.

## Key Message:
Help them shift from "What's wrong with me?" to "How am I designed to contribute?" Show them they're not broken or random - they're uniquely designed with both gifts and growth edges that serve their soul's evolution.

## Output Format:
Return your interpretation as a JSON object with the following structure:
{
  "coreNature": "Your interpretation of their core nature (Sun, Moon, Rising) - 2-3 paragraphs",
  "loveAndConnection": "Your interpretation of how they love and connect (Venus, Mars, 7th House) - 2-3 paragraphs",
  "growthEdge": "Your interpretation of their growth edge (North Node, Saturn, challenging aspects) - 2-3 paragraphs",
  "giftsToWorld": "Your interpretation of their gifts to the world (Midheaven, Jupiter, harmonious aspects) - 2-3 paragraphs"
}

Return ONLY valid JSON, no additional text or markdown formatting before or after the JSON object.`;

  return prompt;
};

/**
 * Get zodiac sign from degree (0-360)
 */
const getSignFromDegree = (degree: number): string => {
  const signs = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];
  const signIndex = Math.floor(degree / 30);
  return signs[signIndex] || 'Unknown';
};

/**
 * Strip markdown formatting from text
 */
const stripMarkdown = (text: string): string => {
  return text
    // Remove headers (##, ###, etc.)
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold (**text** or __text__)
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    // Remove italic (*text* or _text_)
    .replace(/(\*|_)(.*?)\1/g, '$2')
    // Remove strikethrough (~~text~~)
    .replace(/~~(.*?)~~/g, '$1')
    // Remove inline code (`text`)
    .replace(/`([^`]+)`/g, '$1')
    // Remove links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    // Remove horizontal rules
    .replace(/^(\*{3,}|-{3,}|_{3,})$/gm, '')
    // Clean up any remaining artifacts
    .trim();
};

/**
 * Generate whole chart interpretation
 */
export const generateWholeChartInterpretation = async (
  chartData: NatalChartData,
  birthData: BirthData
): Promise<WholeChartInterpretation> => {
  console.log('🌟 Generating whole chart interpretation...');

  const prompt = constructWholeChartPrompt(chartData, birthData);

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2500,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const responseText = response.content[0]?.type === 'text'
      ? response.content[0].text
      : '';

    if (!responseText) {
      throw new Error('AI returned empty response');
    }

    console.log(`✅ Generated whole chart interpretation (${response.usage.output_tokens} tokens)`);

    // Parse the JSON response
    let interpretation: WholeChartInterpretation;
    try {
      // Sometimes the AI might wrap JSON in markdown code blocks, so clean that up
      const cleanedJson = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      interpretation = JSON.parse(cleanedJson);

      // Validate that we have all required fields
      if (!interpretation.coreNature || !interpretation.loveAndConnection ||
          !interpretation.growthEdge || !interpretation.giftsToWorld) {
        throw new Error('Missing required fields in interpretation');
      }

      console.log('✅ Successfully parsed JSON interpretation');

    } catch (parseError: any) {
      console.error('❌ Failed to parse JSON response:', parseError);
      console.error('Raw response:', responseText);
      throw new Error(`Failed to parse interpretation JSON: ${parseError.message}`);
    }

    return interpretation;

  } catch (error: any) {
    console.error('❌ Failed to generate whole chart interpretation:', error);
    throw error;
  }
};

/**
 * Enrich natal chart data with planet-house interpretations
 */
export const enrichChartWithInterpretations = async (
  chartData: NatalChartData,
  birthData: BirthData
): Promise<NatalChartData> => {
  console.log('🔮 Enriching chart with interpretations...');

  try {
    // Generate both planet-house interpretations and whole chart interpretation in parallel
    const [interpretations, wholeChartInterpretation] = await Promise.all([
      generatePlanetHouseInterpretations(chartData, birthData),
      generateWholeChartInterpretation(chartData, birthData)
    ]);

    // Create enriched chart data with interpretations
    const enrichedChartData: NatalChartData = {
      ...chartData,
      planets: Object.entries(chartData.planets).reduce((acc, [planetKey, planetData]) => {
        acc[planetKey] = {
          ...planetData,
          personalizedDescription: interpretations[planetKey],
        };
        return acc;
      }, {} as Record<string, PlanetPosition>),
      wholeChartInterpretation,
    };

    console.log('✅ Chart enriched with interpretations');

    return enrichedChartData;

  } catch (error: any) {
    console.error('❌ Failed to enrich chart with interpretations:', error);
    // Return original chart if enrichment fails
    console.warn('⚠️ Returning chart without interpretations due to error');
    return chartData;
  }
};
