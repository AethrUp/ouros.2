/**
 * Chart Generation Handler
 * Handles natal chart generation and caching
 * Note: This handler generates charts. Database persistence is handled by chartSlice.saveNatalChart()
 */

import { BirthData, NatalChartData } from '../types/user';
import { ChartGenerationOptions, ChartGenerationResult } from '../types/chart';
import SwissEphService from '../utils/swisseph';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHART_STORAGE_KEY = 'natal_chart_data';

/**
 * Generate natal chart from birth data
 */
export const handleChartGeneration = async (
  birthData: BirthData,
  options: ChartGenerationOptions = {
    houseSystem: 'placidus',
    precision: 'professional',
    includeReports: true,
    includeAspects: true,
    includeMinorAspects: false,
    includeMidpoints: false,
    forceRegenerate: false,
    maxAgeHours: 24,
  }
): Promise<ChartGenerationResult> => {
  try {
    console.log('🌟 Starting chart generation...');
    console.log('📍 Birth data:', JSON.stringify(birthData, null, 2));
    console.log('⚙️ Options:', JSON.stringify(options, null, 2));

    // Check for cached chart (unless forcing regeneration)
    if (!options.forceRegenerate) {
      const cachedChart = await loadCachedChart(birthData, options.maxAgeHours || 24);
      if (cachedChart) {
        console.log('✅ Using cached chart');
        return {
          success: true,
          data: cachedChart,
          message: 'Loaded cached natal chart',
          fromCache: true,
        };
      }
    }

    // Validate birth data
    if (!birthData.birthDate || !birthData.birthTime || !birthData.birthLocation) {
      throw new Error('Complete birth data required for chart generation');
    }

    // Generate chart using Swiss Ephemeris
    const chartData = await SwissEphService.generateNatalChart(birthData, {
      houseSystem: options.houseSystem,
      includeReports: options.includeReports,
      includeAspects: options.includeAspects,
    });

    // Validate chart data
    if (!SwissEphService.validateNatalChart(chartData)) {
      throw new Error('Generated chart data is invalid');
    }

    // Create chart record
    const chartRecord = {
      id: Date.now().toString(),
      type: 'natal_chart',
      timestamp: new Date().toISOString(),
      birthData,
      chartData,
    };

    // Save to cache
    await saveChartToCache(chartRecord);

    console.log('✅ Chart generation completed successfully');

    return {
      success: true,
      data: chartRecord,
      message: 'Chart generated successfully',
      fromCache: false,
    };
  } catch (error: any) {
    console.error('❌ Chart generation failed:', error);
    return {
      success: false,
      message: 'Failed to generate natal chart',
      errors: [error.message],
    };
  }
};

/**
 * Load cached chart from storage
 */
const loadCachedChart = async (
  birthData: BirthData,
  maxAgeHours: number
): Promise<any | null> => {
  try {
    const cachedData = await AsyncStorage.getItem(CHART_STORAGE_KEY);
    if (!cachedData) return null;

    const chartRecord = JSON.parse(cachedData);

    // Check if chart matches birth data
    if (!birthDataMatches(chartRecord.birthData, birthData)) {
      console.log('⚠️ Cached chart does not match current birth data');
      return null;
    }

    // Check chart age
    const ageInHours =
      (Date.now() - new Date(chartRecord.timestamp).getTime()) / (1000 * 60 * 60);

    if (ageInHours > maxAgeHours) {
      console.log(`⚠️ Cached chart is too old (${ageInHours.toFixed(1)}h > ${maxAgeHours}h)`);
      return null;
    }

    console.log(`✅ Found valid cached chart (age: ${ageInHours.toFixed(1)}h)`);
    return chartRecord;
  } catch (error) {
    console.warn('Error loading cached chart:', error);
    return null;
  }
};

/**
 * Save chart to cache
 */
const saveChartToCache = async (chartRecord: any): Promise<void> => {
  try {
    await AsyncStorage.setItem(CHART_STORAGE_KEY, JSON.stringify(chartRecord));
    console.log('💾 Chart saved to cache');
  } catch (error) {
    console.warn('⚠️ Failed to save chart to cache:', error);
  }
};

/**
 * Check if two birth data objects match
 */
const birthDataMatches = (cached: BirthData, current: BirthData): boolean => {
  return (
    cached.birthDate === current.birthDate &&
    cached.birthTime === current.birthTime &&
    cached.birthLocation.latitude === current.birthLocation.latitude &&
    cached.birthLocation.longitude === current.birthLocation.longitude
  );
};

/**
 * Clear cached chart
 */
export const clearCachedChart = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(CHART_STORAGE_KEY);
    console.log('🧹 Cached chart cleared');
  } catch (error) {
    console.warn('⚠️ Failed to clear cached chart:', error);
  }
};
