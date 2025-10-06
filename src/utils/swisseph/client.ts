/**
 * Swiss Ephemeris API Client
 * Connects to remote Swiss Ephemeris calculation server
 */

// Configure your API endpoint here
const API_BASE_URL =
  process.env.EXPO_PUBLIC_SWISSEPH_API_URL ||
  'https://astrologyapp-production.up.railway.app';

export interface PlanetPositionRaw {
  longitude: number;
  latitude: number;
  distance: number;
  speed: number;
  speedLat: number;
  speedDist: number;
}

export interface HouseCuspsRaw {
  houses: number[];
  angles: {
    ascendant: number;
    midheaven: number;
    descendant: number;
    imumCoeli: number;
  };
}

/**
 * Calculate planetary positions for a given date/time
 */
export const calculatePlanets = async (
  date: string,
  time: string,
  timezone: string | number
): Promise<Record<string, PlanetPositionRaw>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/planets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        date,
        time,
        timezone,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to calculate planetary positions');
    }

    return data.positions;
  } catch (error) {
    console.error('Error fetching planetary positions:', error);
    throw error;
  }
};

/**
 * Calculate house cusps for a given date/time and location
 */
export const calculateHouses = async (
  date: string,
  time: string,
  timezone: string | number,
  latitude: number,
  longitude: number,
  system: string = 'placidus'
): Promise<HouseCuspsRaw> => {
  try {
    const requestBody = {
      date,
      time,
      timezone,
      latitude,
      longitude,
      system,
    };

    console.log('🏠 Calculating houses with params:', requestBody);

    const response = await fetch(`${API_BASE_URL}/api/houses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to calculate houses');
    }

    if (!data.houses) {
      console.error('Missing houses data:', data);
      throw new Error('Missing houses data from API');
    }

    // Convert houses object to array if needed
    let housesArray: number[];
    if (Array.isArray(data.houses)) {
      housesArray = data.houses;
    } else if (typeof data.houses === 'object') {
      // Convert object format {"1": {cusp: ...}, "2": {cusp: ...}} to array
      housesArray = [];
      for (let i = 1; i <= 12; i++) {
        const house = data.houses[i.toString()];
        if (house && house.cusp !== null && house.cusp !== undefined) {
          housesArray.push(house.cusp);
        } else {
          console.error(`Invalid cusp data for house ${i}:`, house);
          throw new Error(`Invalid or missing cusp data for house ${i}`);
        }
      }
    } else {
      console.error('Invalid houses data structure:', data.houses);
      throw new Error('Invalid houses data structure from API');
    }

    if (!data.angles) {
      console.error('Missing angles data:', data);
      throw new Error('Missing angles data from API');
    }

    // Extract angles, handling both direct values and nested objects
    const angles = {
      ascendant: data.angles.ascendant ?? (data.houses['1']?.cusp || 0),
      midheaven: data.angles.midheaven ?? (data.houses['10']?.cusp || 0),
      descendant: data.angles.descendant ?? (data.houses['7']?.cusp || 0),
      imumCoeli: data.angles.imumCoeli ?? (data.houses['4']?.cusp || 0),
    };

    return {
      houses: housesArray,
      angles: angles,
    };
  } catch (error) {
    console.error('Error fetching house cusps:', error);
    throw error;
  }
};

/**
 * Calculate current transits relative to natal positions
 */
export const calculateTransits = async (natalPositions: any): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/transits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        natalPositions,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to calculate transits');
    }

    return {
      transits: data.transits,
      currentPositions: data.currentPositions,
    };
  } catch (error) {
    console.error('Error fetching transits:', error);
    throw error;
  }
};

/**
 * Get complete natal chart data
 */
export const getNatalChart = async (
  date: string,
  time: string,
  timezone: string,
  latitude: number,
  longitude: number,
  houseSystem: string = 'placidus'
): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/natal-chart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        date,
        time,
        timezone,
        latitude,
        longitude,
        houseSystem,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to get natal chart');
    }

    return data.chart;
  } catch (error) {
    console.error('Error fetching natal chart:', error);
    throw error;
  }
};

/**
 * Test connection to Swiss Ephemeris API
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Error testing Swiss Ephemeris connection:', error);
    return false;
  }
};
