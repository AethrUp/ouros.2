/**
 * Swiss Ephemeris API Transit Service
 * Uses remote Swiss Ephemeris API server for calculations
 * Drop-in replacement for src/services/astrologyAPI/transits.js
 */

import { calculateTransits, calculatePlanets } from './client.js';

/**
 * Get natal transits for a specific date
 * Compatible with existing AstrologyAPI interface
 */
export const getNatalTransits = async (userProfile, targetDate = new Date()) => {
  try {
    // Extract and validate birth data
    const { birthDate, birthTime, birthLocation } = userProfile;
    
    console.log('🔍 Raw userProfile data:', { birthDate, birthTime, birthLocation });
    
    if (!birthDate) {
      throw new Error('Birth date is required');
    }
    
    // Format date for API
    let date;
    if (typeof birthDate === 'string') {
      date = birthDate.includes('T') ? birthDate.split('T')[0] : birthDate;
    } else {
      date = birthDate;
    }
    
    // Format time for API
    let time = '12:00'; // default
    if (birthTime) {
      if (typeof birthTime === 'string') {
        time = birthTime;
      } else if (typeof birthTime === 'object' && birthTime.hour !== undefined && birthTime.minute !== undefined) {
        // Convert {hour: 6, minute: 36} to "06:36"
        const hour = String(birthTime.hour).padStart(2, '0');
        const minute = String(birthTime.minute).padStart(2, '0');
        time = `${hour}:${minute}`;
      } else if (typeof birthTime === 'object' && birthTime.toString) {
        time = birthTime.toString();
      }
    }
    
    const timezone = birthLocation?.timezone || 0;
    
    console.log('🔧 Formatted data for railway API:', { date, time, timezone });
    
    // Get natal positions first
    const natalPlanets = await calculatePlanets(date, time, timezone);
    
    // Extract just the longitudes for transit calculation
    const natalPositions = {};
    Object.entries(natalPlanets).forEach(([planet, data]) => {
      if (data && data.longitude !== undefined) {
        natalPositions[planet] = data.longitude;
      }
    });
    
    // Get current transits
    const transitData = await calculateTransits(natalPositions);
    
    // Format response to match LLM expectations (same as astrologyAPI format)
    const aspects = transitData.transits.map(transit => ({
      transitPlanet: transit.transitPlanet,
      natalPlanet: transit.natalPlanet,
      aspect: transit.aspect,
      orb: transit.orb,
      strength: transit.strength,
      transitInfo: {
        isRetrograde: transit.isRetrograde || false
      }
    }));

    return {
      aspects: aspects,
      summary: {
        totalAspects: aspects.length,
        majorAspects: aspects.filter(a => ['Conjunction', 'Opposition', 'Square', 'Trine', 'Sextile'].includes(a.aspect)).length,
        activeAspects: aspects.length,
        strongestAspect: aspects[0] || null
      },
      metadata: {
        calculatedAt: new Date().toISOString(),
        dataSource: 'Railway Swiss Ephemeris Calculations',
        precision: 'Professional Grade'
      }
    };
  } catch (error) {
    console.error('Error calculating natal transits:', error);
    throw new Error(`Natal transits calculation failed: ${error.message}`);
  }
};

/**
 * Get tropical transits (current planetary positions)
 * Compatible with existing AstrologyAPI interface
 */
export const getTropicalTransits = async () => {
  try {
    // Get current date/time
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const hours = now.getUTCHours();
    const minutes = now.getUTCMinutes();
    const time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    // Calculate current positions (UTC timezone = 0)
    const positions = await calculatePlanets(date, time, 0);
    
    // Format response to match existing interface
    const formattedPositions = {};
    Object.entries(positions).forEach(([planet, data]) => {
      if (data) {
        formattedPositions[planet] = {
          position: data.longitude,
          sign: data.sign,
          degree: data.degree,
          retrograde: data.isRetrograde,
          formatted: data.formattedPosition
        };
      }
    });
    
    return {
      success: true,
      data: {
        positions: formattedPositions,
        calculatedAt: now.toISOString(),
        method: 'swiss-ephemeris-api'
      }
    };
  } catch (error) {
    console.error('Error calculating tropical transits:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

/**
 * Validate transit data
 */
export const validateTransitData = (transitData) => {
  if (!transitData) return false;
  
  const isValid = 
    transitData.aspects && 
    Array.isArray(transitData.aspects) &&
    transitData.summary &&
    transitData.metadata;
    
  if (!isValid) {
    console.error('🚨 VALIDATION FAILED - Transit data missing required fields:', {
      hasAspects: !!transitData.aspects,
      aspectsIsArray: Array.isArray(transitData.aspects),
      hasSummary: !!transitData.summary,
      hasMetadata: !!transitData.metadata
    });
  }
  
  return isValid;
};

/**
 * Format transit summary for AI interpretation
 */
export const formatTransitSummaryForAI = (transitData) => {
  if (!validateTransitData(transitData)) {
    return 'No valid transit data available.';
  }
  
  const { aspects, summary } = transitData;
  
  let summaryText = `Daily Transits for ${new Date().toDateString()}:\n\n`;
  
  // Add summary stats
  summaryText += `Transit Summary: ${summary.totalAspects} aspects total, ${summary.activeAspects} currently active\n\n`;
  
  // Add major aspects (limit to top 5 for AI processing)
  const majorAspects = aspects.filter(a => ['Conjunction', 'Opposition', 'Square', 'Trine', 'Sextile'].includes(a.aspect)).slice(0, 5);
  
  if (majorAspects.length > 0) {
    summaryText += 'Major Transit Aspects:\n';
    majorAspects.forEach(aspect => {
      summaryText += `• ${aspect.transitPlanet} ${aspect.aspect} natal ${aspect.natalPlanet} `;
      summaryText += `(${aspect.orb}° orb, ${aspect.strength}% strength)`;
      summaryText += aspect.transitInfo.isRetrograde ? ' [Retrograde]' : '';
      summaryText += `\n`;
    });
  }
  
  return summaryText;
};

/**
 * Get transit interpretation (placeholder for AI integration)
 */
export const getTransitInterpretation = async (transitData, userProfile) => {
  const summary = formatTransitSummaryForAI(transitData);
  
  // This would normally call an AI service for interpretation
  // For now, return a structured summary
  return {
    success: true,
    interpretation: {
      summary: summary,
      keyTransits: transitData.data.transits.slice(0, 5),
      advice: 'Transit interpretations will be generated by AI service',
      generatedAt: new Date().toISOString()
    }
  };
};

export default {
  getNatalTransits,
  getTropicalTransits,
  validateTransitData,
  formatTransitSummaryForAI,
  getTransitInterpretation
};