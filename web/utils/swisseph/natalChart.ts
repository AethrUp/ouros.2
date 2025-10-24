/**
 * Natal Chart Generation using Swiss Ephemeris
 */

import { calculatePlanets, calculateHouses } from './client';
import { BirthData } from '../../types/user';
import { NatalChartData, PlanetPosition, HousePosition, Angles } from '../../types/user';

// Zodiac signs in order
const ZODIAC_SIGNS = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
];

// Planet order for chart generation
const PLANET_ORDER = [
  'sun',
  'moon',
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
];

/**
 * Get zodiac sign from longitude
 */
const getZodiacSign = (longitude: number): string => {
  const signIndex = Math.floor(longitude / 30);
  return ZODIAC_SIGNS[signIndex];
};

/**
 * Determine which house a planet is in
 */
const getPlanetHouse = (planetLongitude: number, houseCusps: number[]): number => {
  // Normalize longitude to 0-360
  let pLon = planetLongitude % 360;
  if (pLon < 0) pLon += 360;

  // Check each house
  for (let i = 0; i < 12; i++) {
    const currentCusp = houseCusps[i];
    const nextCusp = houseCusps[(i + 1) % 12];

    let inHouse = false;

    if (nextCusp > currentCusp) {
      // Normal case: house doesn't cross 0°
      inHouse = pLon >= currentCusp && pLon < nextCusp;
    } else {
      // House crosses 0° Aries
      inHouse = pLon >= currentCusp || pLon < nextCusp;
    }

    if (inHouse) {
      return i + 1; // Houses are 1-indexed
    }
  }

  return 1; // Default to first house if calculation fails
};

/**
 * Generate complete natal chart
 */
export const generateNatalChart = async (
  birthData: BirthData,
  options: {
    houseSystem?: string;
    includeReports?: boolean;
    includeAspects?: boolean;
  } = {}
): Promise<NatalChartData> => {
  const { houseSystem = 'placidus' } = options;

  try {
    console.log('🌟 Generating natal chart with Swiss Ephemeris...');
    console.log('📍 Birth location:', birthData.birthLocation);
    console.log('📅 Birth date/time:', birthData.birthDate, birthData.birthTime);

    // Use timezone offset if available (convert from seconds to hours), otherwise fall back to timezone name
    const timezoneParam = birthData.birthLocation.timezoneOffset !== undefined
      ? birthData.birthLocation.timezoneOffset / 3600
      : birthData.timezone;

    console.log('⏰ Using timezone parameter:', timezoneParam);

    // Calculate planetary positions
    const planetPositionsRaw = await calculatePlanets(
      birthData.birthDate,
      birthData.birthTime,
      timezoneParam
    );

    // Calculate house cusps
    const houseCuspsRaw = await calculateHouses(
      birthData.birthDate,
      birthData.birthTime,
      timezoneParam,
      birthData.birthLocation.latitude,
      birthData.birthLocation.longitude,
      houseSystem
    );

    // Validate house cusps data
    if (!houseCuspsRaw || !houseCuspsRaw.houses || !Array.isArray(houseCuspsRaw.houses)) {
      console.error('Invalid house cusps data:', houseCuspsRaw);
      throw new Error('Invalid house cusps data received');
    }

    // Process planetary positions
    const planets: Record<string, PlanetPosition> = {};
    Object.entries(planetPositionsRaw).forEach(([planetName, position]: [string, any]) => {
      const longitude = position.longitude;
      const sign = getZodiacSign(longitude);
      const house = getPlanetHouse(longitude, houseCuspsRaw.houses);

      planets[planetName] = {
        planet: planetName,
        sign,
        degree: longitude % 30,
        longitude,
        latitude: position.latitude,
        house,
        retrograde: position.speed < 0,
        speed: position.speed,
      };
    });

    // Process house cusps
    const houses: HousePosition[] = houseCuspsRaw.houses.map((cusp, index) => ({
      house: index + 1,
      sign: getZodiacSign(cusp),
      degree: cusp % 30,
      longitude: cusp,
    }));

    // Extract angles
    const angles: Angles = {
      ascendant: houseCuspsRaw.angles.ascendant,
      midheaven: houseCuspsRaw.angles.midheaven,
      descendant: houseCuspsRaw.angles.descendant,
      imumCoeli: houseCuspsRaw.angles.imumCoeli,
    };

    // Calculate aspects (if requested)
    const aspects = options.includeAspects ? calculateAspects(planets) : [];

    const chartData: NatalChartData = {
      planets,
      houses,
      aspects,
      angles,
      metadata: {
        houseSystem,
        precision: 'professional',
        dataSource: 'swisseph',
        calculationMethod: 'Railway Swiss Ephemeris Server',
        generatedAt: new Date().toISOString(),
        version: '1.0',
      },
    };

    console.log('✅ Natal chart generated successfully');
    return chartData;
  } catch (error: any) {
    console.error('❌ Error generating natal chart:', error);
    throw new Error(`Failed to generate natal chart: ${error.message}`);
  }
};

/**
 * Calculate aspects between planets
 */
const calculateAspects = (planets: Record<string, PlanetPosition>) => {
  const aspects: any[] = [];
  const planetNames = Object.keys(planets);

  // Aspect definitions
  const aspectTypes = [
    { name: 'conjunction', angle: 0, orb: 8, element: 'fire' },
    { name: 'opposition', angle: 180, orb: 8, element: 'earth' },
    { name: 'trine', angle: 120, orb: 8, element: 'air' },
    { name: 'square', angle: 90, orb: 8, element: 'earth' },
    { name: 'sextile', angle: 60, orb: 6, element: 'air' },
  ];

  for (let i = 0; i < planetNames.length; i++) {
    for (let j = i + 1; j < planetNames.length; j++) {
      const planet1 = planetNames[i];
      const planet2 = planetNames[j];
      const lon1 = planets[planet1].longitude;
      const lon2 = planets[planet2].longitude;

      let angleDiff = Math.abs(lon1 - lon2);
      if (angleDiff > 180) angleDiff = 360 - angleDiff;

      // Check each aspect type
      aspectTypes.forEach((aspectType) => {
        const orb = Math.abs(angleDiff - aspectType.angle);
        if (orb <= aspectType.orb) {
          aspects.push({
            id: `${planet1}-${planet2}-${aspectType.name}`,
            planet1,
            planet2,
            type: aspectType.name,
            angle: angleDiff,
            orb,
            strength: 1 - orb / aspectType.orb,
            applying: planets[planet1].speed > planets[planet2].speed,
            element: aspectType.element,
          });
        }
      });
    }
  }

  return aspects;
};

/**
 * Validate natal chart data
 */
export const validateNatalChart = (chartData: NatalChartData): boolean => {
  if (!chartData) return false;
  if (!chartData.planets || Object.keys(chartData.planets).length === 0) return false;
  if (!chartData.houses || chartData.houses.length !== 12) return false;
  if (!chartData.angles) return false;

  return true;
};
