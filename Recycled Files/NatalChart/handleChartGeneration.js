// SWISS EPHEMERIS - Using Railway-hosted Swiss Ephemeris server
// All calculations handled by SwissEphAPIService
import SwissEphAPIService from '../../services/swissephAPI/index.js';
import { setCurrentReading, addToHistory, setLoading, setError, clearError, clearCurrentReading } from '../../state/global/readingState.js';
import { setNatalChart } from '../../state/global/userState.js';
import { saveNatalChart, getNatalChart } from '../../utils/storage.js';
import { personalizedDescriptionService } from '../../services/astrology/personalizedDescriptions.js';
import { natalChartService } from '../../services/charts/NatalChartService.js';
import { supabase } from '../../services/supabase/index.js';

/**
 * Handle Chart Generation - Calculate and display natal chart using Swiss Ephemeris
 * 
 * Uses Railway-hosted Swiss Ephemeris server for professional-grade 
 * astrological calculations with detailed reports.
 * 
 * @param {Object} birthData - The birth data for chart calculation
 * @param {string} birthData.birthDate - Date of birth (YYYY-MM-DD)
 * @param {string} birthData.birthTime - Time of birth (HH:MM:SS)
 * @param {Object} birthData.birthLocation - Birth location with coordinates
 * @param {string} birthData.timezone - Timezone information
 * @param {Function} dispatch - Redux dispatch function
 * @param {Object} options - Chart generation options (Swiss Ephemeris enhanced)
 * @returns {Promise<Object>} Success/error result with chart data
 */
export const handleChartGeneration = async (birthData, dispatch, options = {}) => {
  // SWISS EPHEMERIS OPTIONS - Professional astrological calculations
  const {
    includeMinorAspects = false,
    includeMidpoints = false,
    houseSystem = 'placidus', // Standard astrological house system
    includeReports = true, // Include detailed interpretations
    includeAspects = true, // Include planetary aspects
    saveToCurrent = true,
    addToHistoryOption = true,
    forceRegenerate = false,
    maxAgeHours = 24
  } = options;

  try {
    // Clear any existing errors, cached readings, and set loading
    dispatch(clearError());
    dispatch(clearCurrentReading()); // 🆕 Clear cached chart data from Redux
    dispatch(setLoading(true));
    
    console.log('🧹 Cleared cached chart data from Redux state');
    
    // Enhanced cache clearing for refresh operations
    if (forceRegenerate) {
      console.log('🔄 FORCE REGENERATE MODE - Clearing ALL cached data');
      console.log('🔄 Timestamp:', new Date().toISOString());
      console.log('🔄 Birth data for regeneration:', JSON.stringify(birthData, null, 2));
      console.log('🔄 Options for regeneration:', { houseSystem, includeReports, includeAspects, forceRegenerate, maxAgeHours });
      console.log('🔄 Expected flow: handleChartGeneration → SwissEphAPIService → Railway calculations');
    }

    // Check for existing chart in storage (unless forcing regeneration)
    if (!forceRegenerate) {
      const existingChart = await loadExistingChart(birthData, { maxAgeHours });
      if (existingChart) {
        console.log('📋 Loading existing natal chart from storage');
        
        // Update state with existing chart
        if (saveToCurrent) {
          dispatch(setCurrentReading({
            reading: existingChart,
            type: 'natal_chart'
          }));
        }
        
        // Also save to user profile where NatalChartScreen expects it
        if (existingChart.chartData) {
          dispatch(setNatalChart(existingChart.chartData));
          console.log('✅ Existing natal chart loaded into user profile');
        }

        if (addToHistoryOption) {
          dispatch(addToHistory(existingChart));
        }

        dispatch(setLoading(false));

        return {
          success: true,
          data: existingChart,
          message: 'Natal chart loaded from storage',
          fromCache: true
        };
      }
    }

    // Validate birth data is present
    if (!birthData || !birthData.birthDate || !birthData.birthTime || !birthData.birthLocation) {
      throw new Error('Complete birth data required for chart generation');
    }

    // SwissEphAPIService handles all calculations via Railway server
    // Professional-grade astrological calculations with detailed reports

    // 🌐 SWISS EPHEMERIS CHART GENERATION - Railway server calculations
    console.log('🌐 Generating natal chart using Swiss Ephemeris...');
    console.log('📊 Birth data:', birthData);
    console.log('🏠 House system:', houseSystem);
    console.log('🎯 Precision: Professional Grade');
    console.log('📝 Include reports:', includeReports);
    console.log('🔗 Include aspects:', includeAspects);
    
    // Generate chart using SwissEphAPIService - handles all Railway API calls
    const chartResult = await SwissEphAPIService.generateNatalChart({
      birthDate: birthData.birthDate,
      birthTime: birthData.birthTime,
      birthLocation: birthData.birthLocation,
      timezone: birthData.timezone
    }, {
      houseSystem: houseSystem,
      includeReports: includeReports,
      includeAspects: includeAspects
    });
    
    // STRICT validation - ensure we have actual chart data
    if (!SwissEphAPIService.validateNatalChart(chartResult)) {
      console.error('🚨 CHART VALIDATION FAILED - Chart does not contain required data');
      throw new Error('Chart validation failed: Missing essential astrological data (planets, houses, or angles)');
    }
    
    // Validate that we have essential data before claiming success
    const planetCount = chartResult.planets ? Object.keys(chartResult.planets).length : 0;
    const houseCount = chartResult.houses ? chartResult.houses.length : 0;
    
    if (planetCount === 0 || houseCount === 0) {
      console.error('🚨 CHART DATA VALIDATION FAILED:', {
        planets: planetCount,
        houses: houseCount,
        hasAngles: !!chartResult.angles
      });
      throw new Error('Chart generation returned empty data - please check your birth information and try again');
    }
    
    console.log('✅ Chart generation completed successfully');
    console.log('📊 Generated data validated:', {
      planets: planetCount,
      houses: houseCount,
      aspects: chartResult.aspects ? chartResult.aspects.length : 0,
      hasAngles: !!chartResult.angles
    });

    // Generate personalized descriptions for all planets
    console.log('✨ Generating personalized planet descriptions...');
    try {
      const personalizedDescriptions = await personalizedDescriptionService.generateAllPlanetDescriptions(
        chartResult.planets,
        birthData
      );
      
      // Merge personalized descriptions into planet data
      Object.entries(personalizedDescriptions).forEach(([planet, description]) => {
        if (chartResult.planets[planet]) {
          chartResult.planets[planet].personalizedDescription = {
            ...description,
            generatedAt: new Date().toISOString(),
            version: '1.0'
          };
        }
      });
      
      console.log('✅ Personalized descriptions generated and integrated');
      console.log('📊 Generated descriptions for:', Object.keys(personalizedDescriptions).join(', '));
      
    } catch (error) {
      console.warn('⚠️ Failed to generate personalized descriptions, using fallback:', error.message);
      
      // Use fallback descriptions
      try {
        const fallbackDescriptions = personalizedDescriptionService.getFallbackDescriptions(
          chartResult.planets
        );
        
        Object.entries(fallbackDescriptions).forEach(([planet, description]) => {
          if (chartResult.planets[planet]) {
            chartResult.planets[planet].personalizedDescription = {
              ...description,
              generatedAt: new Date().toISOString(),
              version: '1.0'
            };
          }
        });
        
        console.log('✅ Fallback descriptions applied');
        
      } catch (fallbackError) {
        console.error('❌ Even fallback descriptions failed:', fallbackError);
        // Continue without personalized descriptions - will use static ones
      }
    }

    // Create complete chart reading object with SwissEphAPIService metadata
    const chartReading = {
      id: Date.now(),
      type: 'natal_chart',
      timestamp: new Date().toISOString(),
      birthData: birthData,
      chartData: chartResult, // Use the chart data from SwissEphAPIService
      metadata: {
        ...chartResult.metadata, // Include SwissEphAPIService metadata
        houseSystem,
        includeMinorAspects,
        includeMidpoints,
        includeReports,
        includeAspects,
        dataSource: 'swisseph', // Railway Swiss Ephemeris server
        precision: 'Professional Grade',
        generationTime: new Date().toISOString(),
        calculationMethod: 'Railway Swiss Ephemeris Server',
        offlineCapable: false,
        apiRequired: true
      }
    };

    // Save chart to persistent storage for future access
    try {
      await saveNatalChart(chartReading);
      console.log('✅ Natal chart saved to persistent storage');

      // Also save to Supabase if user is authenticated
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          console.log('💾 Saving natal chart to Supabase...');
          await natalChartService.saveUserNatalChart(chartResult, {
            ...chartResult.metadata,
            birthData: birthData,
            generatedAt: new Date().toISOString(),
            source: 'chart_generation',
            forceRegenerate: forceRegenerate
          });
          console.log('✅ Natal chart saved to Supabase successfully');
        } else {
          console.log('ℹ️ User not authenticated - skipping Supabase save');
        }
      } catch (supabaseError) {
        console.warn('⚠️ Failed to save chart to Supabase:', supabaseError.message);
        // Don't fail the whole operation if Supabase save fails
      }
    } catch (storageError) {
      console.warn('⚠️ Failed to save chart to storage, but generation succeeded:', storageError.message);
    }

    // Update state based on options
    if (saveToCurrent) {
      const samplePlanet = Object.values(chartReading.chartData.planets)[0];
      console.log('💾 Saving to Redux - Sample planet house:', samplePlanet?.house);
      
      dispatch(setCurrentReading({
        reading: chartReading,
        type: 'natal_chart'
      }));
    }
    
    // Also save to user profile where NatalChartScreen expects it
    dispatch(setNatalChart(chartReading.chartData));
    console.log('✅ Natal chart saved to user profile in Redux');

    if (addToHistoryOption) {
      dispatch(addToHistory(chartReading));
    }

    dispatch(setLoading(false));

    // Final success logging - Swiss Ephemeris
    console.log('🎉 SWISS EPHEMERIS CHART GENERATION COMPLETED SUCCESSFULLY');
    console.log('🌟 Timestamp:', new Date().toISOString());
    console.log('🌟 Data source: Railway Swiss Ephemeris Server');
    console.log('🌟 House system used:', houseSystem);
    console.log('🌟 Precision: Professional Grade');
    console.log('🌟 Reports included:', includeReports);
    console.log('🌟 Aspects included:', includeAspects);
    console.log('🌟 Force regenerated:', forceRegenerate);

    return {
      success: true,
      data: chartReading,
      message: 'Chart generated successfully with Swiss Ephemeris - professional grade, Railway calculations'
    };

  } catch (error) {
    console.error('Error in handleChartGeneration:', error);
    
    dispatch(setError(error.message));
    dispatch(setLoading(false));

    return {
      success: false,
      errors: [error.message],
      message: 'Failed to generate natal chart'
    };
  }
};


/**
 * Load existing natal chart from storage if it matches current birth data and is fresh
 */
const loadExistingChart = async (birthData, options = {}) => {
  try {
    const existingChart = await getNatalChart();
    
    if (!existingChart) {
      console.log('📦 No existing chart found in storage');
      return null;
    }

    // Check data freshness (max age: 24 hours for cached charts)
    const maxAge = options.maxAgeHours || 24;
    if (!isChartDataFresh(existingChart, maxAge)) {
      console.log('⏰ Stored chart is stale, will regenerate');
      return null;
    }

    // Validate that the stored chart matches current birth data
    if (isChartDataMatching(existingChart.birthData, birthData)) {
      console.log('✅ Found matching and fresh natal chart in storage');
      return existingChart;
    } else {
      console.log('⚠️ Stored chart doesn\'t match current birth data, will regenerate');
      return null;
    }
  } catch (error) {
    console.warn('Error loading existing chart:', error);
    return null;
  }
};

/**
 * Check if stored chart data is fresh (not stale)
 */
const isChartDataFresh = (chartData, maxAgeHours = 24) => {
  try {
    const generationTime = chartData.metadata?.generationTime || chartData.timestamp;
    
    if (!generationTime) {
      console.log('⚠️ Chart has no generation timestamp, considering stale');
      return false;
    }
    
    const ageInHours = (Date.now() - new Date(generationTime).getTime()) / (1000 * 60 * 60);
    const isFresh = ageInHours <= maxAgeHours;
    
    console.log(`📅 Chart age: ${ageInHours.toFixed(1)}h (max: ${maxAgeHours}h) - ${isFresh ? 'Fresh' : 'Stale'}`);
    
    return isFresh;
  } catch (error) {
    console.warn('Error checking chart freshness:', error);
    return false;
  }
};

/**
 * Check if stored birth data matches current birth data
 */
const isChartDataMatching = (storedBirthData, currentBirthData) => {
  if (!storedBirthData || !currentBirthData) {
    return false;
  }

  // Compare key birth data fields
  const dateMatches = storedBirthData.birthDate === currentBirthData.birthDate ||
                     storedBirthData.date === currentBirthData.birthDate;
  
  const timeMatches = JSON.stringify(storedBirthData.birthTime) === JSON.stringify(currentBirthData.birthTime) ||
                     JSON.stringify(storedBirthData.time) === JSON.stringify(currentBirthData.birthTime);
  
  const locationMatches = storedBirthData.birthLocation?.lat === currentBirthData.birthLocation?.lat &&
                         storedBirthData.birthLocation?.lng === currentBirthData.birthLocation?.lng;

  return dateMatches && timeMatches && locationMatches;
};


/**
 * Handle Chart Refresh - Regenerate existing chart with updated data
 * 
 * @param {Object} existingChart - Previously generated chart
 * @param {Function} dispatch - Redux dispatch function
 * @param {Object} options - Regeneration options
 * @returns {Promise<Object>} Success/error result
 */
export const handleChartRefresh = async (existingChart, dispatch, options = {}) => {
  if (!existingChart || !existingChart.birthData) {
    return {
      success: false,
      errors: ['No existing chart data to refresh'],
      message: 'Chart refresh failed'
    };
  }

  // Regenerate chart with original birth data
  return await handleChartGeneration(existingChart.birthData, dispatch, {
    ...options,
    saveToCurrent: true,
    addToHistory: false // Don't duplicate in history
  });
};