/**
 * Swiss Ephemeris API Client
 * Connects to remote Swiss Ephemeris calculation server
 */

// Configure your API endpoint here
// In React Native with Expo, use process.env.EXPO_PUBLIC_ prefix
const API_BASE_URL = process.env.EXPO_PUBLIC_SWISSEPH_API_URL || 'https://astrologyapp-production.up.railway.app';

/**
 * Calculate planetary positions for a given date/time
 */
export const calculatePlanets = async (date, time, timezone) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/planets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        date,
        time,
        timezone
      })
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
export const calculateHouses = async (date, time, timezone, latitude, longitude, system = 'placidus') => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/houses`, {
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
        system
      })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to calculate houses');
    }
    
    return {
      houses: data.houses,
      angles: data.angles
    };
  } catch (error) {
    console.error('Error fetching house cusps:', error);
    throw error;
  }
};

/**
 * Calculate current transits relative to natal positions
 */
export const calculateTransits = async (natalPositions) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/transits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        natalPositions
      })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to calculate transits');
    }
    
    return {
      transits: data.transits,
      currentPositions: data.currentPositions
    };
  } catch (error) {
    console.error('Error fetching transits:', error);
    throw error;
  }
};

/**
 * Get complete natal chart data
 */
export const getNatalChart = async (birthData) => {
  const { date, time, timezone, latitude, longitude } = birthData;
  
  try {
    // Fetch planetary positions and houses in parallel
    const [planets, housesData] = await Promise.all([
      calculatePlanets(date, time, timezone),
      calculateHouses(date, time, timezone, latitude, longitude)
    ]);
    
    return {
      planets,
      houses: housesData.houses,
      angles: housesData.angles,
      birthData
    };
  } catch (error) {
    console.error('Error fetching natal chart:', error);
    throw error;
  }
};

/**
 * Test API connection
 */
export const testConnection = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET'
    });
    
    return response.ok;
  } catch (error) {
    console.error('API connection test failed:', error);
    return false;
  }
};