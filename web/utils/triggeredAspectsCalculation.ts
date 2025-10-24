/**
 * Triggered Aspects Calculation
 * Identifies which synastry aspects are activated by today's transits
 */

import {
  SynastryChart,
  SynastryAspect,
  TransitAspect,
  TransitData,
  TriggeredSynastryAspect,
} from '../types/synastry';

/**
 * Planet archetypes for generating themes
 */
const PLANET_THEMES: Record<string, string> = {
  sun: 'identity, vitality, core self',
  moon: 'emotions, instincts, comfort',
  mercury: 'communication, thoughts, exchange',
  venus: 'love, attraction, values',
  mars: 'action, desire, assertion',
  jupiter: 'growth, expansion, optimism',
  saturn: 'structure, commitment, responsibility',
  uranus: 'change, innovation, freedom',
  neptune: 'dreams, spirituality, confusion',
  pluto: 'transformation, power, depth',
};

/**
 * Aspect archetypes for generating themes
 */
const ASPECT_THEMES: Record<string, { type: string; description: string }> = {
  conjunction: { type: 'intense', description: 'merging and intensifying' },
  Conjunction: { type: 'intense', description: 'merging and intensifying' },
  opposition: { type: 'challenging', description: 'polarizing and balancing' },
  Opposition: { type: 'challenging', description: 'polarizing and balancing' },
  square: { type: 'challenging', description: 'creating tension and growth' },
  Square: { type: 'challenging', description: 'creating tension and growth' },
  trine: { type: 'harmonious', description: 'flowing harmoniously' },
  Trine: { type: 'harmonious', description: 'flowing harmoniously' },
  sextile: { type: 'harmonious', description: 'offering opportunities' },
  Sextile: { type: 'harmonious', description: 'offering opportunities' },
  quincunx: { type: 'transformative', description: 'requiring adjustment' },
  Quincunx: { type: 'transformative', description: 'requiring adjustment' },
};

/**
 * Normalize planet names to lowercase
 */
const normalizePlanetName = (planet: string): string => {
  return planet.toLowerCase().replace(/^(person1|person2|user1|user2)\./, '');
};

/**
 * Calculate intensity of triggered aspect
 * Based on transit strength and synastry aspect strength
 */
const calculateIntensity = (
  synastryAspect: SynastryAspect,
  triggeringTransits: TransitAspect[]
): number => {
  // Base intensity from synastry aspect strength
  const synastryStrength = synastryAspect.strength || 0.5;

  // Average strength of triggering transits
  const transitStrength =
    triggeringTransits.reduce((sum, t) => sum + (t.strength || 0.5), 0) /
    triggeringTransits.length;

  // Multiply and convert to 0-100 scale
  const intensity = synastryStrength * transitStrength * 100;

  return Math.round(intensity);
};

/**
 * Generate theme for triggered aspect
 */
const generateTheme = (
  synastryAspect: SynastryAspect,
  triggeringTransits: TransitAspect[]
): string => {
  const planet1 = normalizePlanetName(synastryAspect.planet1);
  const planet2 = normalizePlanetName(synastryAspect.planet2);

  const planet1Theme = PLANET_THEMES[planet1] || planet1;
  const planet2Theme = PLANET_THEMES[planet2] || planet2;

  // SynastryAspect has a 'type' property from AspectData
  const aspectInfo =
    ASPECT_THEMES[synastryAspect.type] ||
    { type: 'general', description: 'connecting' };

  // Primary transit
  const primaryTransit = triggeringTransits[0];
  const transitPlanet = normalizePlanetName(primaryTransit.transitPlanet);
  const transitPlanetTheme = PLANET_THEMES[transitPlanet] || transitPlanet;

  // Build theme
  const theme = `Your ${planet1}-${planet2} connection (${planet1Theme} ${aspectInfo.description} ${planet2Theme}) is activated by ${transitPlanet} (${transitPlanetTheme})`;

  return theme;
};

/**
 * Generate advice for triggered aspect
 */
const generateAdvice = (
  synastryAspect: SynastryAspect,
  triggeringTransits: TransitAspect[],
  person1Name: string,
  person2Name: string
): string => {
  const planet1 = normalizePlanetName(synastryAspect.planet1);
  const planet2 = normalizePlanetName(synastryAspect.planet2);

  // SynastryAspect has a 'type' property from AspectData
  const aspectInfo =
    ASPECT_THEMES[synastryAspect.type] ||
    { type: 'general', description: 'connecting' };

  const primaryTransit = triggeringTransits[0];
  const transitPlanet = normalizePlanetName(primaryTransit.transitPlanet);
  const transitAspectType = primaryTransit.aspect;

  // Generate contextual advice
  let advice = '';

  // Venus-Mars combinations (romantic/attraction)
  if (
    (planet1 === 'venus' && planet2 === 'mars') ||
    (planet1 === 'mars' && planet2 === 'venus')
  ) {
    if (aspectInfo.type === 'harmonious') {
      advice = `Attraction and passion flow naturally today. Great time for romance and physical connection.`;
    } else if (aspectInfo.type === 'challenging') {
      advice = `Desires may clash. Practice patience and find ways to honor both your needs.`;
    }
  }
  // Mercury combinations (communication)
  else if (planet1 === 'mercury' || planet2 === 'mercury') {
    if (aspectInfo.type === 'harmonious') {
      advice = `Communication flows easily. Have important conversations today.`;
    } else if (aspectInfo.type === 'challenging') {
      advice = `Be mindful of miscommunications. Listen actively and clarify intentions.`;
    }
  }
  // Moon combinations (emotional)
  else if (planet1 === 'moon' || planet2 === 'moon') {
    if (aspectInfo.type === 'harmonious') {
      advice = `Emotional understanding deepens. Share feelings openly.`;
    } else if (aspectInfo.type === 'challenging') {
      advice = `Emotional sensitivities are heightened. Offer extra compassion.`;
    }
  }
  // Sun combinations (identity)
  else if (planet1 === 'sun' || planet2 === 'sun') {
    if (aspectInfo.type === 'harmonious') {
      advice = `Your sense of purpose aligns. Support each other's goals.`;
    } else if (aspectInfo.type === 'challenging') {
      advice = `Individual needs may compete. Find balance between togetherness and independence.`;
    }
  }
  // Saturn combinations (commitment)
  else if (planet1 === 'saturn' || planet2 === 'saturn') {
    if (aspectInfo.type === 'harmonious') {
      advice = `Good day to discuss long-term plans and commitments.`;
    } else if (aspectInfo.type === 'challenging') {
      advice = `Responsibilities may feel heavy. Work together to lighten the load.`;
    }
  }
  // Jupiter combinations (growth)
  else if (planet1 === 'jupiter' || planet2 === 'jupiter') {
    if (aspectInfo.type === 'harmonious') {
      advice = `Optimism and growth are highlighted. Dream big together.`;
    } else {
      advice = `Watch for overconfidence or excess. Stay grounded while expanding.`;
    }
  }
  // Default advice
  else {
    if (aspectInfo.type === 'harmonious') {
      advice = `This aspect flows naturally today. Lean into the ease.`;
    } else if (aspectInfo.type === 'challenging') {
      advice = `This dynamic requires awareness today. Stay conscious and communicative.`;
    } else {
      advice = `Pay attention to how this aspect manifests today. Notice patterns.`;
    }
  }

  return advice;
};

/**
 * Identify which synastry aspects are triggered by today's transits
 */
export const identifyTriggeredSynastryAspects = (
  synastryChart: SynastryChart,
  person1Transits: TransitData,
  person2Transits: TransitData,
  person1Name: string,
  person2Name: string
): TriggeredSynastryAspect[] => {
  const triggeredAspects: TriggeredSynastryAspect[] = [];

  // Check each synastry aspect
  for (const synastryAspect of synastryChart.synastryAspects) {
    const triggeringTransits: TransitAspect[] = [];

    // Normalize planet names
    const planet1 = normalizePlanetName(synastryAspect.planet1);
    const planet2 = normalizePlanetName(synastryAspect.planet2);

    // Check if any transit from person1 affects their planet in this synastry aspect
    for (const transit of person1Transits.aspects) {
      const natalPlanet = normalizePlanetName(transit.natalPlanet);
      if (natalPlanet === planet1) {
        triggeringTransits.push(transit);
      }
    }

    // Check if any transit from person2 affects their planet in this synastry aspect
    for (const transit of person2Transits.aspects) {
      const natalPlanet = normalizePlanetName(transit.natalPlanet);
      if (natalPlanet === planet2) {
        triggeringTransits.push(transit);
      }
    }

    // If this synastry aspect is triggered, add it to results
    if (triggeringTransits.length > 0) {
      const intensity = calculateIntensity(synastryAspect, triggeringTransits);
      const theme = generateTheme(synastryAspect, triggeringTransits);
      const advice = generateAdvice(
        synastryAspect,
        triggeringTransits,
        person1Name,
        person2Name
      );

      triggeredAspects.push({
        synastryAspect,
        triggeringTransits,
        intensity,
        theme,
        advice,
      });
    }
  }

  // Sort by intensity (highest first)
  triggeredAspects.sort((a, b) => b.intensity - a.intensity);

  return triggeredAspects;
};

/**
 * Get the overall energy rating based on triggered aspects
 */
export const getOverallEnergyRating = (
  triggeredAspects: TriggeredSynastryAspect[]
): 'harmonious' | 'intense' | 'challenging' | 'transformative' => {
  if (triggeredAspects.length === 0) {
    return 'harmonious';
  }

  // Count aspect types
  let harmoniousCount = 0;
  let challengingCount = 0;
  let intenseCount = 0;
  let transformativeCount = 0;

  for (const triggered of triggeredAspects) {
    // SynastryAspect only has 'type' property from AspectData
    const aspectInfo =
      ASPECT_THEMES[triggered.synastryAspect.type];

    if (aspectInfo) {
      if (aspectInfo.type === 'harmonious') harmoniousCount++;
      else if (aspectInfo.type === 'challenging') challengingCount++;
      else if (aspectInfo.type === 'intense') intenseCount++;
      else if (aspectInfo.type === 'transformative') transformativeCount++;
    }
  }

  // Determine overall rating
  if (challengingCount > harmoniousCount && challengingCount > intenseCount) {
    return 'challenging';
  } else if (intenseCount >= harmoniousCount && intenseCount >= challengingCount) {
    return 'intense';
  } else if (transformativeCount > 0 && transformativeCount >= harmoniousCount / 2) {
    return 'transformative';
  } else {
    return 'harmonious';
  }
};

/**
 * Get the top theme from triggered aspects
 */
export const getTopTheme = (triggeredAspects: TriggeredSynastryAspect[]): string => {
  if (triggeredAspects.length === 0) {
    return 'Quiet day in your relationship dynamics';
  }

  // Return theme of the strongest (first) triggered aspect
  return triggeredAspects[0].theme;
};
