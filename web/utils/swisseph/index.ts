/**
 * Swiss Ephemeris API Service - Main Export
 * Central export point for all Swiss Ephemeris functionality
 */

export * from './client';
export * from './natalChart';

// Re-export as default service object
import { generateNatalChart, validateNatalChart } from './natalChart';
import { calculatePlanets, calculateHouses, calculateTransits, testConnection } from './client';

const SwissEphService = {
  // Chart generation
  generateNatalChart,
  validateNatalChart,

  // Raw calculations
  calculatePlanets,
  calculateHouses,
  calculateTransits,

  // Utilities
  testConnection,
};

export default SwissEphService;
