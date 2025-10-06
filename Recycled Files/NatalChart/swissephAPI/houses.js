/**
 * Swiss Ephemeris API House Cusps Service
 * Uses remote Swiss Ephemeris API server for house calculations
 * Drop-in replacement for src/services/astrologyAPI/houseCusps.js
 */

import { calculateHouses } from './client.js';

/**
 * Get house cusps for tropical zodiac
 * @param {Object} birthData - Birth information
 * @param {string} houseSystem - House system to use
 * @returns {Promise<Object>} House cusps data
 */
export const getHouseCusps = async (birthData, houseSystem = 'porphyry') => {
  try {
    const { birthDate, birthTime, birthLocation, timezone } = birthData;
    
    console.log('🏠 Fetching house cusps via Railway Swiss Ephemeris');
    console.log('📅 Birth data:', { birthDate, birthTime, birthLocation, timezone });
    console.log('🏠 House system:', houseSystem);
    
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
    
    // Extract coordinates
    const latitude = birthLocation?.lat || birthLocation?.latitude || 0;
    const longitude = birthLocation?.lng || birthLocation?.longitude || 0;
    
    console.log('🔧 Formatted data for Railway API:', { 
      date, 
      time, 
      timezone: tzOffset, 
      latitude, 
      longitude,
      system: houseSystem 
    });
    
    // Get house data from Railway API
    const houseData = await calculateHouses(date, time, tzOffset, latitude, longitude, houseSystem);
    
    // Format response to match AstrologyAPI structure exactly
    const formatted = {
      houses: [],
      angles: {
        ascendant: houseData.angles.ascendant,
        midheaven: houseData.angles.midheaven,
        // Calculate derived angles
        descendant: (houseData.angles.ascendant + 180) % 360,
        imumCoeli: (houseData.angles.midheaven + 180) % 360,
        // Vertex would require additional calculation, set to 0 for now
        vertex: 0
      },
      system: houseSystem
    };
    
    // Format each house to match expected structure
    Object.entries(houseData.houses).forEach(([houseNum, houseInfo]) => {
      const num = parseInt(houseNum);
      formatted.houses.push({
        number: num,
        cusp: houseInfo.cusp,
        sign: houseInfo.sign,
        degree: houseInfo.degree,
        absoluteDegree: houseInfo.cusp
      });
    });
    
    // Sort houses by number to ensure correct order
    formatted.houses.sort((a, b) => a.number - b.number);
    
    console.log('✅ House cusps calculated:', {
      houseCount: formatted.houses.length,
      ascendant: formatted.angles.ascendant,
      midheaven: formatted.angles.midheaven
    });
    
    return formatted;
    
  } catch (error) {
    console.error('Failed to get house cusps from Railway:', error);
    throw new Error(`House cusps calculation failed: ${error.message}`);
  }
};

/**
 * Get detailed house cusps report (DEPRECATED)
 * Maintained for compatibility but returns empty data
 */
export const getHouseCuspsReport = async (birthData, houseSystem = 'porphyry') => {
  console.log('📊 House cusps report not needed (using AI for interpretations)');
  return { houses: [], reports: {} };
};

/**
 * Get natal house cusp interpretations (DEPRECATED)
 * Maintained for compatibility but returns empty data
 */
export const getNatalHouseCuspReport = async (birthData, houseSystem = 'porphyry') => {
  console.log('📝 Natal house cusp interpretations not needed (using AI for interpretations)');
  return [];
};

export default {
  getHouseCusps,
  getHouseCuspsReport,
  getNatalHouseCuspReport
};