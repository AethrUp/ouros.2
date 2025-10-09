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

  // Calculate compatibility for each element
  const fire = calculateElementScore(user1Elements.fire, user2Elements.fire);
  const earth = calculateElementScore(user1Elements.earth, user2Elements.earth);
  const air = calculateElementScore(user1Elements.air, user2Elements.air);
  const water = calculateElementScore(user1Elements.water, user2Elements.water);

  // Overall is weighted average (fire and air are compatible, earth and water are compatible)
  const fireAirAvg = (fire + air) / 2;
  const earthWaterAvg = (earth + water) / 2;
  const overall = (fireAirAvg + earthWaterAvg) / 2;

  return {
    fire,
    earth,
    air,
    water,
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
 * Calculate element score
 */
function calculateElementScore(user1Count: number, user2Count: number): number {
  // Higher score when both have balanced representation
  const avg = (user1Count + user2Count) / 2;
  const balance = 1 - Math.abs(user1Count - user2Count) / 10;
  return Math.min(100, (avg / 10) * 100 * balance);
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

  const cardinal = calculateElementScore(user1Modalities.cardinal, user2Modalities.cardinal);
  const fixed = calculateElementScore(user1Modalities.fixed, user2Modalities.fixed);
  const mutable = calculateElementScore(user1Modalities.mutable, user2Modalities.mutable);

  const overall = (cardinal + fixed + mutable) / 3;

  return {
    cardinal,
    fixed,
    mutable,
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
 * Calculate overall compatibility score
 */
function calculateOverallCompatibility(
  aspects: SynastryAspect[],
  elementComp: ElementCompatibility,
  modalityComp: ModalityCompatibility
): number {
  // Aspect score: harmonious aspects add, challenging aspects subtract
  const aspectScore = aspects.reduce((sum, aspect) => {
    const weight = aspect.strength;
    return sum + (aspect.isHarmonious ? weight : -weight * 0.5);
  }, 0);

  const normalizedAspectScore = Math.max(0, Math.min(100, (aspectScore / aspects.length) * 100));

  // Weighted average
  const overall =
    normalizedAspectScore * 0.6 + elementComp.overall * 0.25 + modalityComp.overall * 0.15;

  return Math.round(Math.max(0, Math.min(100, overall)));
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
