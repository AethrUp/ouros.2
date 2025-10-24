/**
 * Transit Calculation Utility
 * Uses server-side Swiss Ephemeris calculations
 */

import { calculateTransits, calculatePlanets } from './swisseph/client';

export interface TransitAspect {
  transitPlanet: string;
  natalPlanet: string;
  aspect: string;
  orb: number;
  strength: number;
  transitInfo: {
    isRetrograde: boolean;
  };
}

export interface TransitData {
  aspects: TransitAspect[];
  summary: {
    totalAspects: number;
    majorAspects: number;
    activeAspects: number;
    strongestAspect: TransitAspect | null;
  };
  metadata?: {
    calculatedAt: string;
    dataSource: string;
    precision: string;
  };
}

export interface TropicalTransitsResult {
  success: boolean;
  data?: {
    positions: Record<string, {
      position: number;
      sign: string;
      degree: number;
      retrograde: boolean;
      formatted: string;
    }>;
    calculatedAt: string;
    method: string;
  };
  error?: string;
}

/**
 * Get natal transits for a specific date
 */
export const getNatalTransits = async (
  userProfile: any,
  targetDate: Date = new Date()
): Promise<TransitData> => {
  try {
    // Extract birth data
    const { birthDate, birthTime, birthLocation } = userProfile;

    if (!birthDate) {
      throw new Error('Birth date is required');
    }

    // Format date
    let date: string;
    if (typeof birthDate === 'string') {
      date = birthDate.includes('T') ? birthDate.split('T')[0] : birthDate;
    } else {
      date = birthDate;
    }

    // Format time
    let time = '12:00';
    if (birthTime) {
      if (typeof birthTime === 'string') {
        time = birthTime;
      } else if (typeof birthTime === 'object' && birthTime.hour !== undefined && birthTime.minute !== undefined) {
        const hour = String(birthTime.hour).padStart(2, '0');
        const minute = String(birthTime.minute).padStart(2, '0');
        time = `${hour}:${minute}`;
      }
    }

    // Use timezone offset if available (convert from seconds to hours), otherwise fall back to 0
    const timezone = birthLocation?.timezoneOffset !== undefined
      ? birthLocation.timezoneOffset / 3600
      : 0;

    // Get natal positions
    const natalPlanets = await calculatePlanets(date, time, timezone);

    // Extract longitudes
    const natalPositions: Record<string, number> = {};
    Object.entries(natalPlanets).forEach(([planet, data]: [string, any]) => {
      if (data && data.longitude !== undefined) {
        natalPositions[planet] = data.longitude;
      }
    });

    // Get current transits
    const transitData = await calculateTransits(natalPositions);

    // Format response
    const aspects: TransitAspect[] = transitData.transits.map((transit: any) => ({
      transitPlanet: transit.transitPlanet,
      natalPlanet: transit.natalPlanet,
      aspect: transit.aspect,
      orb: transit.orb,
      strength: transit.strength,
      transitInfo: {
        isRetrograde: transit.isRetrograde || false,
      },
    }));

    const majorAspectTypes = ['Conjunction', 'Opposition', 'Square', 'Trine', 'Sextile'];
    const majorAspects = aspects.filter((a) =>
      majorAspectTypes.includes(a.aspect)
    );

    return {
      aspects: aspects,
      summary: {
        totalAspects: aspects.length,
        majorAspects: majorAspects.length,
        activeAspects: aspects.length,
        strongestAspect: aspects[0] || null,
      },
      metadata: {
        calculatedAt: new Date().toISOString(),
        dataSource: 'Railway Swiss Ephemeris Calculations',
        precision: 'Professional Grade',
      },
    };
  } catch (error: any) {
    console.error('Error calculating natal transits:', error);
    throw new Error(`Natal transits calculation failed: ${error.message}`);
  }
};

/**
 * Get tropical transits (current planetary positions)
 */
export const getTropicalTransits = async (): Promise<TropicalTransitsResult> => {
  try {
    // Get current date/time
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const hours = now.getUTCHours();
    const minutes = now.getUTCMinutes();
    const time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    // Calculate current positions (UTC timezone = 0)
    const positions = await calculatePlanets(date, time, 0);

    // Format response
    const formattedPositions: Record<string, any> = {};
    Object.entries(positions).forEach(([planet, data]: [string, any]) => {
      if (data) {
        formattedPositions[planet] = {
          position: data.longitude,
          sign: data.sign,
          degree: data.degree,
          retrograde: data.isRetrograde,
          formatted: data.formattedPosition,
        };
      }
    });

    return {
      success: true,
      data: {
        positions: formattedPositions,
        calculatedAt: now.toISOString(),
        method: 'swiss-ephemeris-api',
      },
    };
  } catch (error: any) {
    console.error('Error calculating tropical transits:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Validate transit data structure
 */
export const validateTransitData = (transitData: any): boolean => {
  if (!transitData) return false;

  const isValid =
    transitData.aspects &&
    Array.isArray(transitData.aspects) &&
    transitData.summary &&
    transitData.metadata;

  if (!isValid) {
    console.error('Transit data validation failed:', {
      hasAspects: !!transitData.aspects,
      aspectsIsArray: Array.isArray(transitData.aspects),
      hasSummary: !!transitData.summary,
      hasMetadata: !!transitData.metadata,
    });
  }

  return isValid;
};
