/**
 * Daily Synastry Forecast Handler
 * Generates daily relationship forecasts based on transits affecting synastry charts
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  SynastryChart,
  DailySynastryForecast,
  TransitData,
} from '../types/synastry';
import { NatalChartData } from '../types/user';
import { getNatalTransits, getTropicalTransits } from '../utils/transitCalculation';
import {
  identifyTriggeredSynastryAspects,
  getOverallEnergyRating,
  getTopTheme,
} from '../utils/triggeredAspectsCalculation';
import {
  createDailySynastryForecastPrompt,
  validateDailySynastryForecastResponse,
} from '../utils/dailySynastryPromptTemplate';
import { supabase } from '../utils/supabase';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '',
});

const MODEL = 'claude-sonnet-4-20250514';
const PROMPT_VERSION = '2.0'; // V2: Structured format with timeBasedForecasts, transitAnalysis, relationshipInsights, guidance, connectionPractice

interface DailySynastryForecastOptions {
  forceRegenerate?: boolean;
  focusArea?: 'romantic' | 'friendship' | 'business' | 'family' | 'general';
}

interface DailySynastryForecastResult {
  success: boolean;
  forecast?: DailySynastryForecast;
  error?: string;
  fromCache?: boolean;
}

/**
 * Get today's date in YYYY-MM-DD format (local time)
 */
const getTodayDate = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Check if cached forecast is still valid (from today)
 */
const isCacheValid = (cachedDate: string | null): boolean => {
  if (!cachedDate) return false;
  const today = getTodayDate();
  return cachedDate === today;
};

/**
 * Load cached forecast from Supabase
 */
const loadCachedForecast = async (
  synastryChartId: string,
  date: string
): Promise<DailySynastryForecast | null> => {
  try {
    const { data, error } = await supabase
      .from('daily_synastry_forecasts')
      .select('*')
      .eq('synastry_chart_id', synastryChartId)
      .eq('date', date)
      .single();

    if (error || !data) {
      return null;
    }

    // Transform database record to DailySynastryForecast
    // Check format version and construct appropriate fullContent
    let fullContent;
    if (data.format_version === 'v2') {
      // V2 format - use structured JSONB content
      fullContent = data.full_content_v2;
    } else {
      // V1 format - use legacy flat fields
      fullContent = {
        morningForecast: data.morning_forecast,
        afternoonForecast: data.afternoon_forecast,
        eveningForecast: data.evening_forecast,
        advice: data.advice,
        activitiesSuggested: data.activities_suggested,
        activitiesToAvoid: data.activities_to_avoid,
        transitAnalysis: data.transit_analysis,
      };
    }

    const forecast: DailySynastryForecast = {
      id: data.id,
      date: data.date,
      synastryChartId: data.synastry_chart_id,
      connectionId: data.connection_id,
      savedChartId: data.saved_chart_id,
      person1Name: data.person1_name,
      person2Name: data.person2_name,
      person1Transits: data.person1_transits,
      person2Transits: data.person2_transits,
      currentPositions: data.current_positions,
      triggeredAspects: data.triggered_aspects,
      preview: {
        topTheme: data.top_theme,
        summary: data.summary,
        energyRating: data.energy_rating,
      },
      fullContent,
      hasFullForecast: data.has_full_forecast,
      generatedAt: data.generated_at,
      model: data.model,
      promptVersion: data.prompt_version,
    };

    return forecast;
  } catch (error) {
    console.error('Error loading cached forecast:', error);
    return null;
  }
};

/**
 * Generate daily synastry forecast with AI
 */
export const generateDailySynastryForecast = async (
  synastryChart: SynastryChart,
  person1Chart: NatalChartData,
  person2Chart: NatalChartData,
  person1Profile: any,
  person2Profile: any,
  person1Name: string,
  person2Name: string,
  connectionId?: string,
  savedChartId?: string,
  options: DailySynastryForecastOptions = {}
): Promise<DailySynastryForecastResult> => {
  const { focusArea = 'general' } = options;
  const today = getTodayDate();

  console.log('🌟 Starting daily synastry forecast generation for', today);
  console.log(`👥 ${person1Name} & ${person2Name}`);

  try {
    // Step 1: Get transits for person1
    console.log('📡 Fetching transits for', person1Name);
    const person1Transits = await getNatalTransits(person1Profile, new Date());

    if (!person1Transits || !person1Transits.aspects) {
      throw new Error('Failed to fetch person1 transit data');
    }

    console.log('✅ Person1 transit data received:', {
      totalAspects: person1Transits.aspects.length,
    });

    // Step 2: Get transits for person2
    console.log('📡 Fetching transits for', person2Name);
    const person2Transits = await getNatalTransits(person2Profile, new Date());

    if (!person2Transits || !person2Transits.aspects) {
      throw new Error('Failed to fetch person2 transit data');
    }

    console.log('✅ Person2 transit data received:', {
      totalAspects: person2Transits.aspects.length,
    });

    // Step 3: Get current planetary positions
    console.log('🌍 Fetching current planetary positions...');
    const currentPositionsResult = await getTropicalTransits();

    if (!currentPositionsResult.success || !currentPositionsResult.data) {
      throw new Error('Failed to fetch current planetary positions');
    }

    const currentPositions = currentPositionsResult.data.positions;
    console.log('✅ Current positions received');

    // Step 4: Identify triggered synastry aspects
    console.log('🔍 Identifying triggered synastry aspects...');
    const triggeredAspects = identifyTriggeredSynastryAspects(
      synastryChart,
      person1Transits,
      person2Transits,
      person1Name,
      person2Name
    );

    console.log('✅ Triggered aspects identified:', triggeredAspects.length);

    // Step 5: Determine energy rating and top theme
    const energyRating = getOverallEnergyRating(triggeredAspects);
    const topTheme = getTopTheme(triggeredAspects);

    console.log('📊 Energy rating:', energyRating);
    console.log('🎯 Top theme:', topTheme);

    // Step 6: Build AI prompt
    console.log('📝 Building AI prompt...');
    const prompt = createDailySynastryForecastPrompt(
      synastryChart,
      person1Chart,
      person2Chart,
      person1Transits,
      person2Transits,
      currentPositions,
      triggeredAspects,
      person1Name,
      person2Name,
      today,
      focusArea
    );

    // Step 7: Call Anthropic API
    console.log('🤖 Calling Anthropic Claude API...');
    const startTime = Date.now();

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const apiDuration = Date.now() - startTime;
    console.log(`✅ AI response received in ${apiDuration}ms`);

    // Step 8: Parse and validate response
    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    console.log('🔍 Raw AI response length:', responseText.length);

    let forecastData: any;
    try {
      // Strip markdown code fences if present
      let jsonText = responseText.trim();

      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```(?:json)?\s*\n?/, '');
        jsonText = jsonText.replace(/\n?```\s*$/, '');
      }

      forecastData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('❌ Failed to parse AI response as JSON:', parseError);
      throw new Error('AI response is not valid JSON');
    }

    // Validate response structure
    const validation = validateDailySynastryForecastResponse(forecastData);
    if (!validation.valid) {
      console.error('❌ AI response validation failed:', validation.errors);
      throw new Error(`Invalid AI response: ${validation.errors.join(', ')}`);
    }

    console.log('✅ AI response validated successfully');

    // Step 9: Structure forecast data with V2 format
    const forecast: DailySynastryForecast = {
      id: `forecast_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      date: today,
      synastryChartId: synastryChart.id,
      connectionId,
      savedChartId,
      person1Name,
      person2Name,
      person1Transits,
      person2Transits,
      currentPositions,
      triggeredAspects,
      preview: {
        topTheme: forecastData.topTheme,
        summary: forecastData.summary,
        energyRating: forecastData.energyRating,
      },
      fullContent: {
        introduction: forecastData.introduction,
        timeBasedForecasts: forecastData.timeBasedForecasts,
        transitAnalysis: forecastData.transitAnalysis,
        relationshipInsights: forecastData.relationshipInsights,
        guidance: forecastData.guidance,
        connectionPractice: forecastData.connectionPractice,
        conclusion: forecastData.conclusion,
      },
      hasFullForecast: true,
      generatedAt: new Date().toISOString(),
      model: MODEL,
      promptVersion: PROMPT_VERSION,
      synastryChart,
    };

    console.log('✅ Forecast structured successfully');

    // Step 10: Save to Supabase
    try {
      console.log('💾 Saving forecast to Supabase...');

      const forecastRecord = {
        synastry_chart_id: synastryChart.id,
        date: today,
        connection_id: connectionId || null,
        saved_chart_id: savedChartId || null,
        person1_name: person1Name,
        person2_name: person2Name,
        person1_transits: person1Transits,
        person2_transits: person2Transits,
        current_positions: currentPositions,
        triggered_aspects: triggeredAspects,

        // Preview fields (used by both V1 and V2)
        title: forecastData.topTheme,
        summary: forecastData.summary,
        energy_rating: forecastData.energyRating,
        top_theme: forecastData.topTheme,

        // V2 format fields
        format_version: 'v2',
        full_content_v2: {
          introduction: forecastData.introduction,
          timeBasedForecasts: forecastData.timeBasedForecasts,
          transitAnalysis: forecastData.transitAnalysis,
          relationshipInsights: forecastData.relationshipInsights,
          guidance: forecastData.guidance,
          connectionPractice: forecastData.connectionPractice,
          conclusion: forecastData.conclusion,
        },

        // V1 fields = null for V2 forecasts (for backward compatibility)
        morning_forecast: null,
        afternoon_forecast: null,
        evening_forecast: null,
        advice: null,
        activities_suggested: null,
        activities_to_avoid: null,
        transit_analysis: null,

        // Metadata
        has_full_forecast: true,
        generated_at: forecast.generatedAt,
        model: MODEL,
        prompt_version: PROMPT_VERSION,
      };

      const { data: savedForecast, error: saveError } = await supabase
        .from('daily_synastry_forecasts')
        .upsert(forecastRecord, {
          onConflict: 'synastry_chart_id,date',
        })
        .select()
        .single();

      if (saveError) {
        console.error('❌ Failed to save forecast to Supabase:', saveError);
      } else {
        console.log('✅ Forecast saved to Supabase:', savedForecast.id);
        forecast.id = savedForecast.id;
      }
    } catch (dbError: any) {
      console.error('❌ Database save error:', dbError);
      // Don't fail the whole operation if DB save fails
    }

    console.log('✅ Daily synastry forecast generation complete');
    console.log('📊 Token usage:', {
      input: message.usage.input_tokens,
      output: message.usage.output_tokens,
      total: message.usage.input_tokens + message.usage.output_tokens,
    });

    return {
      success: true,
      forecast,
    };
  } catch (error: any) {
    console.error('❌ Forecast generation failed:', error);

    return {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
  }
};

/**
 * Get daily synastry forecast (with caching)
 */
export const getDailySynastryForecast = async (
  synastryChart: SynastryChart,
  person1Chart: NatalChartData,
  person2Chart: NatalChartData,
  person1Profile: any,
  person2Profile: any,
  person1Name: string,
  person2Name: string,
  connectionId?: string,
  savedChartId?: string,
  options: DailySynastryForecastOptions = {}
): Promise<DailySynastryForecastResult> => {
  const { forceRegenerate = false } = options;
  const today = getTodayDate();

  // Check cache unless force regenerate
  if (!forceRegenerate) {
    console.log('🔍 Checking for cached forecast...');
    const cachedForecast = await loadCachedForecast(synastryChart.id, today);

    if (cachedForecast && isCacheValid(cachedForecast.date)) {
      console.log('✅ Using cached forecast for', cachedForecast.date);
      return {
        success: true,
        forecast: cachedForecast,
        fromCache: true,
      };
    }
  }

  // Generate new forecast
  return await generateDailySynastryForecast(
    synastryChart,
    person1Chart,
    person2Chart,
    person1Profile,
    person2Profile,
    person1Name,
    person2Name,
    connectionId,
    savedChartId,
    options
  );
};
