/**
 * Swiss Ephemeris API Planetary Positions Service
 * Uses remote Swiss Ephemeris API server for planetary calculations
 * Drop-in replacement for src/services/astrologyAPI/planetReports.js
 */

import { calculatePlanets, calculateHouses } from './client.js';

/**
 * Get all planetary positions with house placements
 * @param {Object} birthData - Birth information
 * @param {string} houseSystem - House system to use
 * @returns {Promise<Object>} All planets with positions
 */
export const getAllPlanetaryPositions = async (birthData, houseSystem = 'porphyry') => {
  try {
    const { birthDate, birthTime, birthLocation, timezone } = birthData;
    
    console.log('🌌 Fetching all planetary positions via Railway Swiss Ephemeris');
    
    // Format date for API
    let date;
    if (typeof birthDate === 'string') {
      date = birthDate.includes('T') ? birthDate.split('T')[0] : birthDate;
    } else if (birthDate instanceof Date) {
      date = birthDate.toISOString().split('T')[0];
    } else {
      date = birthDate;
    }
    
    // Format time for API
    let time = '12:00'; // default
    if (birthTime) {
      if (typeof birthTime === 'string') {
        time = birthTime;
      } else if (typeof birthTime === 'object' && birthTime.hour !== undefined && birthTime.minute !== undefined) {
        const hour = String(birthTime.hour).padStart(2, '0');
        const minute = String(birthTime.minute).padStart(2, '0');
        time = `${hour}:${minute}`;
      }
    }
    
    // Extract timezone
    let tzOffset = 0;
    if (timezone !== null && timezone !== undefined) {
      if (typeof timezone === 'number') {
        tzOffset = timezone;
      } else if (birthLocation?.timezone !== undefined) {
        tzOffset = birthLocation.timezone;
      }
    }
    
    // Extract coordinates for house calculation
    const latitude = birthLocation?.lat || birthLocation?.latitude || 0;
    const longitude = birthLocation?.lng || birthLocation?.longitude || 0;
    
    console.log('🔧 Formatted data for Railway API:', { 
      date, 
      time, 
      timezone: tzOffset,
      latitude,
      longitude
    });
    
    // Get planetary positions and houses in parallel for efficiency
    const [planetPositions, houseData] = await Promise.all([
      calculatePlanets(date, time, tzOffset),
      calculateHouses(date, time, tzOffset, latitude, longitude, houseSystem)
    ]);
    
    console.log('📊 Raw planet positions received:', Object.keys(planetPositions));
    
    // Format planets to match expected structure
    const planets = {};
    
    // Map Railway planet names to AstrologyAPI format
    const planetNameMapping = {
      'Sun': 'sun',
      'Moon': 'moon',
      'Mercury': 'mercury',
      'Venus': 'venus',
      'Mars': 'mars',
      'Jupiter': 'jupiter',
      'Saturn': 'saturn',
      'Uranus': 'uranus',
      'Neptune': 'neptune',
      'Pluto': 'pluto',
      'North Node': 'north_node',
      'Chiron': 'chiron'
    };
    
    // Process each planet
    Object.entries(planetPositions).forEach(([railwayName, planetData]) => {
      const apiName = planetNameMapping[railwayName];
      if (apiName && planetData) {
        // Calculate which house this planet is in
        const house = calculatePlanetHouse(planetData.longitude, houseData.houses);
        
        planets[apiName] = {
          name: apiName,
          longitude: planetData.longitude,
          latitude: planetData.latitude || 0,
          sign: planetData.sign,
          degree: planetData.degree,
          house: house,
          retrograde: planetData.isRetrograde || false,
          speed: planetData.longitudeSpeed || 0,
          // Additional fields for display
          distance: planetData.distance,
          formattedPosition: planetData.formattedPosition
        };
      }
    });
    
    console.log('🎯 Final planets data:', Object.keys(planets).map(name => 
      `${name}: ${planets[name].sign} House ${planets[name].house}`
    ).join(', '));
    
    return planets;
    
  } catch (error) {
    console.error('Failed to get planetary positions from Railway:', error);
    throw new Error(`Planetary positions calculation failed: ${error.message}`);
  }
};

/**
 * Calculate which house a planet is in based on house cusps
 * @param {number} planetLongitude - Planet's ecliptic longitude
 * @param {Object} houses - House cusps object from Railway API
 * @returns {number} House number (1-12)
 */
const calculatePlanetHouse = (planetLongitude, houses) => {
  // Normalize longitude to 0-360
  const longitude = ((planetLongitude % 360) + 360) % 360;
  
  // Convert houses object to array and sort by house number
  const houseCusps = Object.entries(houses)
    .map(([num, data]) => ({
      number: parseInt(num),
      cusp: data.cusp
    }))
    .sort((a, b) => a.number - b.number);
  
  // Find which house the planet falls in
  for (let i = 0; i < 12; i++) {
    const currentHouse = houseCusps[i];
    const nextHouse = houseCusps[(i + 1) % 12];
    
    const currentCusp = currentHouse.cusp;
    const nextCusp = nextHouse.cusp;
    
    // Handle house that crosses 0° (12th to 1st house)
    if (currentCusp > nextCusp) {
      if (longitude >= currentCusp || longitude < nextCusp) {
        return currentHouse.number;
      }
    } else {
      if (longitude >= currentCusp && longitude < nextCusp) {
        return currentHouse.number;
      }
    }
  }
  
  return 1; // Default to first house if not found
};

/**
 * Get general house report for a specific planet (DEPRECATED)
 * Maintained for compatibility but returns empty data
 */
export const getPlanetHouseReport = async (birthData, planetName, houseSystem = 'porphyry') => {
  console.log(`🪐 Planet house reports not needed (using AI for interpretations)`);
  return {
    name: planetName,
    report: '',
    keywords: []
  };
};

/**
 * Get planetary aspects (DEPRECATED)
 * Maintained for compatibility but returns empty data
 */
export const getPlanetaryAspects = async (birthData) => {
  console.log('🔗 Planetary aspects not needed (using AI for interpretations)');
  return [];
};

export default {
  getAllPlanetaryPositions,
  getPlanetHouseReport,
  getPlanetaryAspects
};