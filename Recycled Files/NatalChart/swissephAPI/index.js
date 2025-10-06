/**
 * Swiss Ephemeris API Service - Main Export
 * Central export point for all Railway Swiss Ephemeris functionality
 * Drop-in replacement for AstrologyAPI Service
 */

// Core client
export { 
  calculatePlanets, 
  calculateHouses, 
  calculateTransits,
  getNatalChart,
  testConnection 
} from './client.js';

// House cusps functionality
export {
  getHouseCusps,
  getHouseCuspsReport,
  getNatalHouseCuspReport
} from './houses.js';

// Planetary positions functionality
export {
  getAllPlanetaryPositions,
  getPlanetHouseReport,
  getPlanetaryAspects
} from './planets.js';

// Natal chart generation
export {
  generateNatalChart,
  validateNatalChart
} from './natalChart.js';

// Transit calculations (already implemented)
export {
  getNatalTransits,
  getTropicalTransits,
  validateTransitData,
  formatTransitSummaryForAI
} from './transits.js';

// Default service object with all methods
import { generateNatalChart, validateNatalChart } from './natalChart.js';
import { getHouseCusps, getHouseCuspsReport, getNatalHouseCuspReport } from './houses.js';
import { getAllPlanetaryPositions, getPlanetHouseReport, getPlanetaryAspects } from './planets.js';
import { getNatalTransits, getTropicalTransits, validateTransitData, formatTransitSummaryForAI } from './transits.js';

const SwissEphAPIService = {
  // Chart generation
  generateNatalChart,
  validateNatalChart,
  
  // House calculations
  getHouseCusps,
  getHouseCuspsReport,
  getNatalHouseCuspReport,
  
  // Planetary calculations
  getAllPlanetaryPositions,
  getPlanetHouseReport,
  getPlanetaryAspects,
  
  // Transit calculations
  getNatalTransits,
  getTropicalTransits,
  validateTransitData,
  formatTransitSummaryForAI
};

export default SwissEphAPIService;