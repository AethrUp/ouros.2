/**
 * Synastry Calculation Handler
 * Handles synastry chart calculation and compatibility analysis
 */

import {
  SynastryChart,
  SynastryAspect,
  ElementCompatibility,
  ModalityCompatibility,
  CalculateSynastryResponse,
  getAspectCategory,
  isHarmoniousAspect,
  isChallengingAspect,
} from '../types/synastry';
import { NatalChartData, PlanetPosition, AspectData } from '../types/user';
import { AspectType } from '../types/chart';

// Aspect orbs for synastry (more lenient than natal chart aspects)
const SYNASTRY_ORBS: Record<AspectType, number> = {
  conjunction: 8,
  opposition: 8,
  trine: 6,
  square: 6,
  sextile: 5,
  semi_sextile: 3,
  quintile: 2,
  bi_quintile: 2,
  quincunx: 3,
};

// Aspect angles
const ASPECT_ANGLES: Record<AspectType, number> = {
  conjunction: 0,
  opposition: 180,
  trine: 120,
  square: 90,
  sextile: 60,
  semi_sextile: 30,
  quintile: 72,
  bi_quintile: 144,
  quincunx: 150,
};

// Aspect importance weights - normalized planet names (lowercase)
const ASPECT_WEIGHTS: Record<string, number> = {
  // Tier 1: Core relationship aspects
  'sun-moon': 3.0,
  'sun-venus': 2.5,
  'moon-venus': 2.5,
  'venus-mars': 3.0,
  'sun-mars': 2.0,
  'moon-mars': 2.0,

  // Tier 2: Important personal planets
  'sun-mercury': 1.8,
  'moon-mercury': 1.8,
  'venus-mercury': 1.8,
  'mars-mercury': 1.5,
  'sun-jupiter': 1.8,
  'moon-jupiter': 1.8,
  'venus-jupiter': 2.0,

  // Tier 3: Outer planets to personal planets
  'sun-saturn': 1.5,
  'moon-saturn': 1.5,
  'venus-saturn': 1.5,
  'mars-saturn': 1.3,
  'sun-uranus': 1.3,
  'moon-uranus': 1.3,
  'sun-neptune': 1.3,
  'moon-neptune': 1.3,
  'sun-pluto': 1.3,
  'moon-pluto': 1.3,
};

// Conjunction significance bonuses
const CONJUNCTION_BONUSES: Record<string, number> = {
  'sun-moon': 15,      // Luminaries together - very significant
  'venus-mars': 12,    // Love/attraction planets
  'sun-venus': 10,     // Harmony and attraction
  'moon-venus': 10,    // Emotional harmony
  'sun-mars': 8,       // Ego/action alignment
  'moon-mars': 8,      // Emotional/sexual chemistry
  'venus-jupiter': 8,  // Love expansion
  'sun-jupiter': 6,    // Confidence boost
  'moon-jupiter': 6,   // Emotional expansion
};

// Major vs minor aspects
const MAJOR_ASPECTS: AspectType[] = ['conjunction', 'opposition', 'trine', 'square', 'sextile'];
const MINOR_ASPECTS: AspectType[] = ['quincunx', 'semi_sextile', 'quintile', 'bi_quintile'];

// Maximum number of minor aspects to include (prevents dilution)
const MAX_MINOR_ASPECTS = 18;

/**
 * Calculate synastry chart between two users
 */
export const calculateSynastry = async (
  user1Chart: NatalChartData,
  user2Chart: NatalChartData,
  user1Id: string,
  user2Id: string
): Promise<CalculateSynastryResponse> => {
  try {
    console.log('🌟 Starting synastry calculation...');

    // Validate both charts
    if (!user1Chart || !user2Chart) {
      throw new Error('Both natal charts are required for synastry calculation');
    }

    // Calculate inter-chart aspects
    const synastryAspects = calculateInterChartAspects(
      user1Chart.planets,
      user2Chart.planets,
      user1Id,
      user2Id
    );

    // Analyze compatibility
    const elementCompatibility = analyzeElementCompatibility(
      user1Chart.planets,
      user2Chart.planets
    );

    const modalityCompatibility = analyzeModalityCompatibility(
      user1Chart.planets,
      user2Chart.planets
    );

    const compatibilityScore = calculateOverallCompatibility(
      synastryAspects,
      elementCompatibility,
      modalityCompatibility
    );

    // Generate insights
    const { strengths, challenges, recommendations } = generateSynastryInsights(
      synastryAspects,
      elementCompatibility,
      modalityCompatibility
    );

    // Normalize user IDs (user1_id < user2_id for database consistency)
    const [normalizedUser1Id, normalizedUser2Id] =
      user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];

    // Create synastry chart object
    const synastryChart: SynastryChart = {
      id: `${normalizedUser1Id}_${normalizedUser2Id}_${Date.now()}`,
      user1Id: normalizedUser1Id,
      user2Id: normalizedUser2Id,
      synastryAspects,
      compatibilityScore,
      elementCompatibility,
      modalityCompatibility,
      strengths,
      challenges,
      recommendations,
      calculationMethod: 'standard',
      houseSystem: user1Chart.metadata.houseSystem,
      version: '1.0',
      calculatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('✅ Synastry calculation completed successfully');
    console.log(`📊 Compatibility Score: ${compatibilityScore}/100`);
    console.log(`🔮 Found ${synastryAspects.length} inter-chart aspects`);

    return {
      success: true,
      synastryChart,
      message: 'Synastry chart calculated successfully',
    };
  } catch (error: any) {
    console.error('❌ Synastry calculation failed:', error);
    return {
      success: false,
      message: 'Failed to calculate synastry',
      errors: [error.message],
    };
  }
};

/**
 * Calculate aspects between two charts
 */
function calculateInterChartAspects(
  user1Planets: Record<string, PlanetPosition>,
  user2Planets: Record<string, PlanetPosition>,
  user1Id: string,
  user2Id: string
): SynastryAspect[] {
  const aspects: SynastryAspect[] = [];

  // Compare each planet in user1's chart with each planet in user2's chart
  Object.entries(user1Planets).forEach(([planet1Name, planet1]) => {
    Object.entries(user2Planets).forEach(([planet2Name, planet2]) => {
      // Calculate angular distance
      const angle = calculateAngularDistance(planet1.longitude, planet2.longitude);

      // Check each aspect type
      Object.entries(ASPECT_ANGLES).forEach(([aspectType, aspectAngle]) => {
        const orb = Math.abs(angle - aspectAngle);
        const maxOrb = SYNASTRY_ORBS[aspectType as AspectType];

        if (orb <= maxOrb) {
          const category = getAspectCategory(planet1Name, planet2Name, aspectType);

          aspects.push({
            id: `${user1Id}_${planet1Name}_${user2Id}_${planet2Name}_${aspectType}`,
            planet1: planet1Name,
            planet2: planet2Name,
            person1Planet: `${user1Id}.${planet1Name}`,
            person2Planet: `${user2Id}.${planet2Name}`,
            person1Degree: planet1.longitude,
            person2Degree: planet2.longitude,
            type: aspectType as AspectType,
            angle: aspectAngle,
            orb,
            strength: calculateAspectStrength(orb, maxOrb),
            applying: false, // Inter-chart aspects don't apply/separate
            element: determineElement(planet1.sign),
            isHarmonious: isHarmoniousAspect(aspectType),
            category,
          });
        }
      });
    });
  });

  // Sort by strength (strongest first)
  return aspects.sort((a, b) => b.strength - a.strength);
}

/**
 * Calculate angular distance between two longitudes
 */
function calculateAngularDistance(long1: number, long2: number): number {
  let distance = Math.abs(long1 - long2);
  if (distance > 180) {
    distance = 360 - distance;
  }
  return distance;
}

/**
 * Calculate aspect strength based on orb
 */
function calculateAspectStrength(orb: number, maxOrb: number): number {
  return Math.max(0, 1 - orb / maxOrb);
}

/**
 * Get the importance weight for an aspect between two planets
 */
function getAspectWeight(planet1: string, planet2: string): number {
  const p1 = planet1.toLowerCase();
  const p2 = planet2.toLowerCase();
  const key1 = `${p1}-${p2}`;
  const key2 = `${p2}-${p1}`;
  return ASPECT_WEIGHTS[key1] || ASPECT_WEIGHTS[key2] || 1.0;
}

/**
 * Filter aspects and cap minor aspects to prevent score dilution
 */
function filterAndCapAspects(aspects: SynastryAspect[]): SynastryAspect[] {
  // Separate major and minor aspects
  const majorAspects = aspects.filter((aspect) => MAJOR_ASPECTS.includes(aspect.type));
  const minorAspects = aspects.filter((aspect) => MINOR_ASPECTS.includes(aspect.type));

  // Sort minor aspects by strength (tightest orbs first)
  const sortedMinorAspects = minorAspects.sort((a, b) => b.strength - a.strength);

  // Cap minor aspects - only take the strongest ones
  const cappedMinorAspects = sortedMinorAspects.slice(0, MAX_MINOR_ASPECTS);

  return [...majorAspects, ...cappedMinorAspects];
}

/**
 * Calculate bonus points for significant conjunctions
 */
function calculateSignificanceBonus(aspects: SynastryAspect[]): number {
  let bonus = 0;

  aspects.forEach((aspect) => {
    if (aspect.type === 'conjunction') {
      const p1 = aspect.planet1.toLowerCase();
      const p2 = aspect.planet2.toLowerCase();
      const key1 = `${p1}-${p2}`;
      const key2 = `${p2}-${p1}`;
      const bonusPoints = CONJUNCTION_BONUSES[key1] || CONJUNCTION_BONUSES[key2] || 0;

      if (bonusPoints > 0) {
        // Scale bonus by aspect strength (tighter orb = more bonus)
        bonus += bonusPoints * aspect.strength;
      }
    }
  });

  return bonus;
}

/**
 * Determine element from zodiac sign
 */
function determineElement(sign: string): 'fire' | 'earth' | 'air' | 'water' {
  const fireSign = ['aries', 'leo', 'sagittarius'];
  const earthSigns = ['taurus', 'virgo', 'capricorn'];
  const airSigns = ['gemini', 'libra', 'aquarius'];
  const waterSigns = ['cancer', 'scorpio', 'pisces'];

  if (fireSigns.includes(sign.toLowerCase())) return 'fire';
  if (earthSigns.includes(sign.toLowerCase())) return 'earth';
  if (airSigns.includes(sign.toLowerCase())) return 'air';
  if (waterSigns.includes(sign.toLowerCase())) return 'water';

  return 'earth'; // default
}

/**
 * Analyze element compatibility
 */
function analyzeElementCompatibility(
  user1Planets: Record<string, PlanetPosition>,
  user2Planets: Record<string, PlanetPosition>
): ElementCompatibility {
  // Count planets in each element for both users
  const user1Elements = countPlanetsByElement(user1Planets);
  const user2Elements = countPlanetsByElement(user2Planets);

  // Calculate individual element scores using balance-based approach
  const elements = ['fire', 'earth', 'air', 'water'] as const;
  let totalBalance = 0;
  const elementScores: Record<string, number> = {};

  elements.forEach((element) => {
    const diff = Math.abs(user1Elements[element] - user2Elements[element]);
    const maxCount = Math.max(user1Elements[element], user2Elements[element]);
    const balance = maxCount > 0 ? 1 - diff / maxCount : 1;
    totalBalance += balance;

    // Convert balance to percentage score for individual elements
    elementScores[element] = balance * 100;
  });

  // Traditional complementary pairing approach
  const fireAir = (totalBalance * 0.25) * 2; // Fire + Air compatibility
  const earthWater = (totalBalance * 0.25) * 2; // Earth + Water compatibility
  const overall = ((fireAir + earthWater) / 2) * 100;

  return {
    fire: elementScores.fire,
    earth: elementScores.earth,
    air: elementScores.air,
    water: elementScores.water,
    overall,
    description: generateElementDescription(overall),
  };
}

/**
 * Count planets by element
 */
function countPlanetsByElement(planets: Record<string, PlanetPosition>): Record<
  'fire' | 'earth' | 'air' | 'water',
  number
> {
  const counts = { fire: 0, earth: 0, air: 0, water: 0 };

  Object.values(planets).forEach((planet) => {
    const element = determineElement(planet.sign);
    counts[element]++;
  });

  return counts;
}

/**
 * Generate element compatibility description
 */
function generateElementDescription(score: number): string {
  if (score >= 80) return 'Excellent elemental harmony';
  if (score >= 60) return 'Good elemental balance';
  if (score >= 40) return 'Moderate elemental compatibility';
  return 'Elemental differences may require understanding';
}

/**
 * Analyze modality compatibility
 */
function analyzeModalityCompatibility(
  user1Planets: Record<string, PlanetPosition>,
  user2Planets: Record<string, PlanetPosition>
): ModalityCompatibility {
  const user1Modalities = countPlanetsByModality(user1Planets);
  const user2Modalities = countPlanetsByModality(user2Planets);

  // Calculate individual modality scores using balance-based approach
  const modalities = ['cardinal', 'fixed', 'mutable'] as const;
  let totalBalance = 0;
  const modalityScores: Record<string, number> = {};

  modalities.forEach((modality) => {
    const diff = Math.abs(user1Modalities[modality] - user2Modalities[modality]);
    const maxCount = Math.max(user1Modalities[modality], user2Modalities[modality]);
    const balance = maxCount > 0 ? 1 - diff / maxCount : 1;
    totalBalance += balance;

    // Convert balance to percentage score for individual modalities
    modalityScores[modality] = balance * 100;
  });

  const overall = (totalBalance / modalities.length) * 100;

  return {
    cardinal: modalityScores.cardinal,
    fixed: modalityScores.fixed,
    mutable: modalityScores.mutable,
    overall,
    description: generateModalityDescription(overall),
  };
}

/**
 * Count planets by modality
 */
function countPlanetsByModality(planets: Record<string, PlanetPosition>): Record<
  'cardinal' | 'fixed' | 'mutable',
  number
> {
  const counts = { cardinal: 0, fixed: 0, mutable: 0 };
  const cardinalSigns = ['aries', 'cancer', 'libra', 'capricorn'];
  const fixedSigns = ['taurus', 'leo', 'scorpio', 'aquarius'];
  const mutableSigns = ['gemini', 'virgo', 'sagittarius', 'pisces'];

  Object.values(planets).forEach((planet) => {
    const sign = planet.sign.toLowerCase();
    if (cardinalSigns.includes(sign)) counts.cardinal++;
    else if (fixedSigns.includes(sign)) counts.fixed++;
    else if (mutableSigns.includes(sign)) counts.mutable++;
  });

  return counts;
}

/**
 * Generate modality description
 */
function generateModalityDescription(score: number): string {
  if (score >= 80) return 'Excellent action-oriented compatibility';
  if (score >= 60) return 'Good balance of initiative and stability';
  if (score >= 40) return 'Some differences in approach to change';
  return 'Different styles of action may require compromise';
}

/**
 * Calculate overall compatibility score using improved weighted ratio method
 */
function calculateOverallCompatibility(
  aspects: SynastryAspect[],
  elementComp: ElementCompatibility,
  modalityComp: ModalityCompatibility
): number {
  // Step 1: Filter and cap aspects to prevent dilution
  const filteredAspects = filterAndCapAspects(aspects);

  console.log(`🔮 Synastry aspects - Original: ${aspects.length}, After filtering: ${filteredAspects.length}`);
  console.log(`   Major aspects: ${filteredAspects.filter((a) => MAJOR_ASPECTS.includes(a.type)).length}`);
  console.log(`   Minor aspects: ${filteredAspects.filter((a) => MINOR_ASPECTS.includes(a.type)).length}`);

  // Step 2: Calculate weighted harmony scores
  let harmoniousScore = 0;
  let challengingScore = 0;
  let neutralScore = 0;

  filteredAspects.forEach((aspect) => {
    const weight = getAspectWeight(aspect.planet1, aspect.planet2);
    const weightedStrength = aspect.strength * weight;

    if (['trine', 'sextile'].includes(aspect.type)) {
      harmoniousScore += weightedStrength;
    } else if (aspect.type === 'conjunction') {
      // Conjunctions are generally harmonious but can be intense
      harmoniousScore += weightedStrength * 0.8;
    } else if (['square', 'opposition'].includes(aspect.type)) {
      challengingScore += weightedStrength;
    } else {
      // Minor aspects - treat as mildly challenging or neutral
      neutralScore += weightedStrength * 0.3;
    }
  });

  // Step 3: Calculate base score using weighted ratio method
  const netHarmony = harmoniousScore - challengingScore * 0.5 - neutralScore * 0.2;
  const totalWeightedAspects = harmoniousScore + challengingScore + neutralScore;

  let aspectScore = 50; // Neutral baseline
  if (totalWeightedAspects > 0) {
    // Scale from the baseline based on net harmony ratio
    const harmonyRatio = netHarmony / totalWeightedAspects;
    aspectScore = 50 + harmonyRatio * 50;
    aspectScore = Math.max(0, Math.min(100, aspectScore));
  }

  // Step 4: Add significance bonus for important conjunctions
  const significanceBonus = calculateSignificanceBonus(filteredAspects);
  aspectScore = Math.min(100, aspectScore + significanceBonus);

  console.log(`   Harmonious: ${harmoniousScore.toFixed(2)}, Challenging: ${challengingScore.toFixed(2)}, Neutral: ${neutralScore.toFixed(2)}`);
  console.log(`   Net harmony: ${netHarmony.toFixed(2)}, Significance bonus: ${significanceBonus.toFixed(2)}`);
  console.log(`   Aspect score: ${aspectScore.toFixed(1)}%`);

  // Step 5: Calculate final weighted score
  const finalScore = aspectScore * 0.6 + elementComp.overall * 0.25 + modalityComp.overall * 0.15;

  console.log(`📊 Final breakdown - Aspects: ${aspectScore.toFixed(1)}% (60%), Elements: ${elementComp.overall.toFixed(1)}% (25%), Modalities: ${modalityComp.overall.toFixed(1)}% (15%)`);
  console.log(`🎯 Final Compatibility Score: ${finalScore.toFixed(1)}%`);

  return Math.round(Math.max(0, Math.min(100, finalScore)));
}

/**
 * Generate synastry insights
 */
function generateSynastryInsights(
  aspects: SynastryAspect[],
  elementComp: ElementCompatibility,
  modalityComp: ModalityCompatibility
): {
  strengths: string[];
  challenges: string[];
  recommendations: string[];
} {
  const strengths: string[] = [];
  const challenges: string[] = [];
  const recommendations: string[] = [];

  // Analyze strongest harmonious aspects
  const harmoniousAspects = aspects.filter((a) => a.isHarmonious && a.strength > 0.7);
  if (harmoniousAspects.length > 0) {
    harmoniousAspects.slice(0, 3).forEach((aspect) => {
      strengths.push(
        `Strong ${aspect.type} between ${aspect.planet1} and ${aspect.planet2}`
      );
    });
  }

  // Analyze challenging aspects
  const challengingAspects = aspects.filter((a) => !a.isHarmonious && a.strength > 0.7);
  if (challengingAspects.length > 0) {
    challengingAspects.slice(0, 3).forEach((aspect) => {
      challenges.push(
        `Tension in ${aspect.type} between ${aspect.planet1} and ${aspect.planet2}`
      );
    });
  }

  // Element-based insights
  if (elementComp.overall > 70) {
    strengths.push('Excellent elemental harmony supports natural understanding');
  } else if (elementComp.overall < 40) {
    challenges.push('Elemental differences require conscious effort to bridge');
    recommendations.push('Practice patience with different emotional and mental styles');
  }

  // Modality-based insights
  if (modalityComp.overall > 70) {
    strengths.push('Compatible approaches to action and change');
  }

  // Generic recommendations
  recommendations.push('Communication is key to navigating differences');
  recommendations.push('Celebrate your complementary strengths');

  return { strengths, challenges, recommendations };
}

// Fix typo
const fireSigns = ['aries', 'leo', 'sagittarius'];
