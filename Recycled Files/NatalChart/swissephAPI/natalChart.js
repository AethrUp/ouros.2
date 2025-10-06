/**
 * Swiss Ephemeris API Natal Chart Generation
 * Uses remote Swiss Ephemeris API server for complete chart calculation
 * Drop-in replacement for src/services/astrologyAPI/natalChart.js
 */

import { getHouseCusps } from './houses.js';
import { getAllPlanetaryPositions } from './planets.js';

/**
 * Generate complete natal chart using Railway Swiss Ephemeris
 * @param {Object} birthData - Birth information
 * @param {Object} options - Chart generation options
 * @returns {Promise<Object>} Complete natal chart
 */
export const generateNatalChart = async (birthData, options = {}) => {
  try {
    const {
      houseSystem = 'porphyry',
      includeReports = true,
      includeAspects = true
    } = options;
    
    console.log('🎨 Generating complete natal chart via Railway Swiss Ephemeris');
    console.log('📅 Birth data:', birthData);
    console.log('🏠 House system:', houseSystem);
    
    // Enhanced timezone handling - calculate numeric timezone offset from Google API data
    let processedBirthData = { ...birthData };
    if (birthData.birthLocation && birthData.birthLocation.timezoneData && 
        birthData.birthLocation.timezoneData.rawOffset !== undefined && 
        birthData.birthLocation.timezoneData.dstOffset !== undefined) {
      // Convert seconds to hours for Railway API
      processedBirthData.timezone = (birthData.birthLocation.timezoneData.rawOffset + birthData.birthLocation.timezoneData.dstOffset) / 3600;
      console.log('🌌 Calculated timezone offset from Google data:', processedBirthData.timezone);
    } else if (birthData.timezone) {
      processedBirthData.timezone = birthData.timezone;
      console.log('🌌 Using provided timezone offset:', processedBirthData.timezone);
    } else {
      processedBirthData.timezone = 0;
      console.log('⚠️ No timezone data available, defaulting to UTC');
    }
    
    // Parallel API calls for better performance - use processed birth data with timezone
    const promises = [
      getHouseCusps(processedBirthData, houseSystem),
      getAllPlanetaryPositions(processedBirthData, houseSystem)
    ];
    
    const results = await Promise.allSettled(promises);
    
    // Extract results and validate
    const houseCusps = results[0].status === 'fulfilled' ? results[0].value : null;
    const planets = results[1].status === 'fulfilled' ? results[1].value : {};
    
    // Check for failures
    const houseCuspsError = results[0].status === 'rejected' ? results[0].reason : null;
    const planetsError = results[1].status === 'rejected' ? results[1].reason : null;
    
    if (houseCuspsError) {
      console.error('🚨 Railway API FAILURE - House Cusps:', houseCuspsError.message || houseCuspsError);
      throw new Error(`House cusps calculation failed: ${houseCuspsError.message || 'API error'}`);
    }
    
    if (planetsError) {
      console.error('🚨 Railway API FAILURE - Planetary Positions:', planetsError.message || planetsError);
      throw new Error(`Planetary positions calculation failed: ${planetsError.message || 'API error'}`);
    }
    
    // Additional validation - ensure we have actual data
    if (!houseCusps || !houseCusps.houses || houseCusps.houses.length === 0) {
      throw new Error('House cusps API returned empty or invalid data');
    }
    
    if (!planets || Object.keys(planets).length === 0) {
      throw new Error('Planets API returned empty or invalid data');
    }
    
    // Build complete chart object matching AstrologyAPI structure exactly
    const chart = {
      planets: planets, // Already has house assignments from getAllPlanetaryPositions
      houses: formatHousesForChart(houseCusps),
      aspects: [], // Aspects not calculated by Railway API (use AI for interpretations)
      angles: houseCusps.angles,
      birthInfo: formatBirthInfo(processedBirthData),
      metadata: {
        calculationMethod: 'Swiss Ephemeris',
        houseSystem: houseSystem,
        dataSource: 'Railway Swiss Ephemeris Server',
        precision: 'Professional Grade',
        includeReports: includeReports,
        includeAspects: includeAspects,
        generatedAt: new Date().toISOString()
      }
    };
    
    console.log('✅ Natal chart generated successfully:', {
      planetCount: Object.keys(chart.planets).length,
      houseCount: chart.houses.length,
      ascendant: chart.angles.ascendant?.toFixed(2),
      midheaven: chart.angles.midheaven?.toFixed(2)
    });
    
    return chart;
    
  } catch (error) {
    console.error('Failed to generate natal chart:', error);
    throw new Error(`Natal chart generation failed: ${error.message}`);
  }
};

/**
 * Format houses for chart output
 * @param {Object} houseCusps - House cusp data from Railway
 * @returns {Array} Formatted houses
 */
const formatHousesForChart = (houseCusps) => {
  const houses = [];
  
  // Handle both object format (from Railway API) and array format (pre-processed)
  if (Array.isArray(houseCusps.houses)) {
    // Already processed array from houses.js - use directly
    houseCusps.houses.forEach((house) => {
      houses.push({
        number: house.number,
        cusp: house.absoluteDegree || house.cusp,
        sign: house.sign,
        degree: house.degree,
        position: `${Math.floor(house.degree)}° ${house.sign}`,
        interpretation: '', // Interpretations come from AI
        keywords: [] // Keywords come from AI
      });
    });
    
    // Sort houses by number to ensure correct order for validation
    houses.sort((a, b) => a.number - b.number);
  } else {
    // Raw object format from Railway API - convert to array
    Object.entries(houseCusps.houses).forEach(([houseNum, houseInfo]) => {
      const num = parseInt(houseNum);
      houses.push({
        number: num,
        cusp: houseInfo.cusp,
        sign: houseInfo.sign,
        degree: houseInfo.degree,
        position: `${Math.floor(houseInfo.degree)}° ${houseInfo.sign}`,
        interpretation: '', // Interpretations come from AI
        keywords: [] // Keywords come from AI
      });
    });
    
    // Sort houses by number to ensure correct order
    houses.sort((a, b) => a.number - b.number);
  }
  
  return houses;
};

/**
 * Format birth information for chart
 * @param {Object} birthData - Birth data
 * @returns {Object} Formatted birth info
 */
const formatBirthInfo = (birthData) => {
  return {
    date: birthData.birthDate,
    time: birthData.birthTime,
    location: {
      latitude: birthData.birthLocation?.lat || birthData.birthLocation?.latitude,
      longitude: birthData.birthLocation?.lng || birthData.birthLocation?.longitude,
      name: birthData.birthLocation?.name || 'Unknown'
    },
    timezone: birthData.timezone || 0
  };
};

/**
 * Validate natal chart data
 * @param {Object} chart - Generated chart
 * @returns {boolean} Is valid chart
 */
export const validateNatalChart = (chart) => {
  if (!chart) return false;
  
  // STRICT validation - ensure chart has actual usable data
  const hasRequiredFields = 
    chart.planets && 
    Object.keys(chart.planets).length >= 2 && // At least sun + moon
    chart.houses && 
    chart.houses.length === 12 &&
    chart.angles &&
    chart.birthInfo;
  
  if (!hasRequiredFields) {
    console.error('🚨 VALIDATION FAILED - Chart missing required fields:', {
      hasPlanets: !!chart.planets,
      planetCount: chart.planets ? Object.keys(chart.planets).length : 0,
      hasHouses: !!chart.houses,
      houseCount: chart.houses ? chart.houses.length : 0,
      hasAngles: !!chart.angles,
      hasBirthInfo: !!chart.birthInfo
    });
    return false;
  }
  
  // Validate planet data - must have essential planets with valid coordinates
  const requiredPlanets = ['sun', 'moon'];
  for (const planet of requiredPlanets) {
    const planetData = chart.planets[planet];
    if (!planetData) {
      console.error(`🚨 VALIDATION FAILED - Missing required planet: ${planet}`);
      return false;
    }
    if (planetData.longitude === undefined || planetData.longitude === null) {
      console.error(`🚨 VALIDATION FAILED - Planet ${planet} missing longitude data`);
      return false;
    }
  }
  
  // Validate house data - must have valid cusps
  for (let i = 0; i < 12; i++) {
    const house = chart.houses[i];
    if (!house || house.cusp === undefined || house.cusp === null) {
      console.error(`🚨 VALIDATION FAILED - House ${i + 1} missing cusp data`);
      return false;
    }
  }
  
  // Validate angles - must have essential chart angles
  if (chart.angles.ascendant === undefined || chart.angles.midheaven === undefined) {
    console.error('🚨 VALIDATION FAILED - Missing required angles:', chart.angles);
    return false;
  }
  
  console.log('✅ CHART VALIDATION PASSED - Chart has valid data for display');
  return true;
};

export default {
  generateNatalChart,
  validateNatalChart
};