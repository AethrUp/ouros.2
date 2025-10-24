/**
 * Horoscope Generation Handler
 * Orchestrates transit calculation + AI interpretation
 */

import Anthropic from '@anthropic-ai/sdk';
import { NatalChartData } from '../types/user';
import { DailyHoroscope, HoroscopeGenerationMetadata } from '../types/reading';
import {
  createCoreReadingPrompt,
  createTransitDataPrompt,
  createTimeGuidancePrompt,
  createCosmicWeatherPrompt,
  validateCoreReadingResponse,
  validateTransitDataResponse,
  validateTimeGuidanceResponse,
  validateCosmicWeatherResponse,
} from '../utils/aiPromptTemplates';
import { getNatalTransits, getTropicalTransits } from '../utils/transitCalculation';
import { supabase } from '../utils/supabase';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '',
});

interface HoroscopeGenerationOptions {
  forceRegenerate?: boolean;
  maxCacheAgeHours?: number;
}

interface HoroscopeGenerationResult {
  success: boolean;
  horoscope?: DailyHoroscope;
  metadata?: HoroscopeGenerationMetadata;
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
 * Check if cached horoscope is still valid
 */
const isCacheValid = (
  cachedDate: string | null,
  maxAgeHours: number = 24
): boolean => {
  if (!cachedDate) return false;

  const today = getTodayDate();
  if (cachedDate !== today) return false;

  return true;
};

/**
 * Generate daily horoscope with AI interpretation
 */
export const generateDailyHoroscope = async (
  natalChart: NatalChartData,
  userProfile: any,
  options: HoroscopeGenerationOptions = {}
): Promise<HoroscopeGenerationResult> => {
  const {
    forceRegenerate = false,
    maxCacheAgeHours = 24,
  } = options;

  const today = getTodayDate();

  console.log('🔮 Starting horoscope generation for', today);

  try {
    // Step 1: Get current transits
    console.log('📡 Fetching natal transits...');
    const transitData = await getNatalTransits(userProfile, new Date());

    if (!transitData || !transitData.aspects) {
      throw new Error('Failed to fetch transit data');
    }

    console.log('✅ Transit data received:', {
      totalAspects: transitData.aspects.length,
      majorAspects: transitData.summary.majorAspects,
    });

    // DEBUG: Log detailed transit aspects
    console.log('🔍 DEBUG: Detailed Transit Aspects:');
    transitData.aspects.forEach((aspect: any, index: number) => {
      console.log(`  ${index + 1}. ${aspect.transitPlanet} ${aspect.aspect} ${aspect.natalPlanet}`, {
        orb: aspect.orb,
        isApplying: aspect.isApplying,
        exactDate: aspect.exactDate,
      });
    });

    // Step 2: Get current planetary positions
    console.log('🌍 Fetching current planetary positions...');
    const currentPositionsResult = await getTropicalTransits();

    if (!currentPositionsResult.success || !currentPositionsResult.data) {
      throw new Error('Failed to fetch current planetary positions');
    }

    const currentPositions = currentPositionsResult.data.positions;

    console.log('✅ Current positions received');

    // Step 3: Build 4 AI prompts
    console.log('📝 Building 4 AI prompts...');
    const userCategories = userProfile.selectedCategories;

    // DEBUG: Log input data
    console.log('🔍 DEBUG: ========== INPUT DATA FOR PROMPT CREATION ==========');
    console.log('🔍 DEBUG: Natal Chart Summary:', {
      planets: Object.keys(natalChart.planets || {}),
      houses: Object.keys(natalChart.houses || {}),
      ascendant: natalChart.angles?.ascendant,
    });
    console.log('🔍 DEBUG: Transit Data Summary:', {
      totalAspects: transitData.aspects.length,
      majorAspects: transitData.summary.majorAspects,
    });
    console.log('🔍 DEBUG: User Categories:', userCategories);
    console.log('🔍 DEBUG: Date:', today);
    console.log('🔍 DEBUG: ========== END OF INPUT DATA ==========');

    const corePrompt = createCoreReadingPrompt(natalChart, transitData, currentPositions, today, userCategories);
    const transitPrompt = createTransitDataPrompt(natalChart, transitData, currentPositions, today, userCategories);
    const timePrompt = createTimeGuidancePrompt(natalChart, transitData, currentPositions, today, userCategories);
    const weatherPrompt = createCosmicWeatherPrompt(natalChart, transitData, currentPositions, today, userCategories);

    console.log('🔍 DEBUG: Prompt lengths:', {
      core: corePrompt.length,
      transit: transitPrompt.length,
      time: timePrompt.length,
      weather: weatherPrompt.length,
      total: corePrompt.length + transitPrompt.length + timePrompt.length + weatherPrompt.length,
    });

    // Step 4: Make 4 parallel API calls
    console.log('🤖 Calling Anthropic API (4 parallel calls)...');
    const startTime = Date.now();

    const [coreMsg, transitMsg, timeMsg, weatherMsg] = await Promise.all([
      anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4000,
        messages: [{ role: 'user', content: corePrompt }],
      }),
      anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4000,
        messages: [{ role: 'user', content: transitPrompt }],
      }),
      anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2000,
        messages: [{ role: 'user', content: timePrompt }],
      }),
      anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 3000,
        messages: [{ role: 'user', content: weatherPrompt }],
      }),
    ]);

    const apiDuration = Date.now() - startTime;
    console.log(`✅ All 4 AI responses received in ${apiDuration}ms`);

    // Step 5: Parse 4 JSON responses
    console.log('🔍 Parsing 4 JSON responses...');

    // Helper function to strip markdown code fences
    const stripMarkdown = (text: string): string => {
      let cleaned = text.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '');
        cleaned = cleaned.replace(/\n?```\s*$/, '');
      }
      return cleaned;
    };

    let coreData: any, transitDataParsed: any, timeData: any, weatherData: any;
    try {
      const coreText = coreMsg.content[0].type === 'text' ? coreMsg.content[0].text : '';
      const transitText = transitMsg.content[0].type === 'text' ? transitMsg.content[0].text : '';
      const timeText = timeMsg.content[0].type === 'text' ? timeMsg.content[0].text : '';
      const weatherText = weatherMsg.content[0].type === 'text' ? weatherMsg.content[0].text : '';

      console.log('🔍 DEBUG: Response lengths:', {
        core: coreText.length,
        transit: transitText.length,
        time: timeText.length,
        weather: weatherText.length,
      });

      coreData = JSON.parse(stripMarkdown(coreText));
      transitDataParsed = JSON.parse(stripMarkdown(transitText));
      timeData = JSON.parse(stripMarkdown(timeText));
      weatherData = JSON.parse(stripMarkdown(weatherText));

      console.log('✅ All 4 responses parsed successfully');
    } catch (parseError: any) {
      console.error('❌ Failed to parse one or more AI responses:', parseError);
      throw new Error('One or more AI responses are not valid JSON');
    }

    // Step 6: Validate 4 responses
    console.log('🔍 Validating 4 responses...');
    const validations = [
      { name: 'Core Reading', result: validateCoreReadingResponse(coreData) },
      { name: 'Transit Data', result: validateTransitDataResponse(transitDataParsed) },
      { name: 'Time Guidance', result: validateTimeGuidanceResponse(timeData) },
      { name: 'Cosmic Weather', result: validateCosmicWeatherResponse(weatherData) },
    ];

    const failedValidations = validations.filter(v => !v.result.valid);
    if (failedValidations.length > 0) {
      console.error('❌ Validation failed for:', failedValidations.map(v => v.name).join(', '));
      failedValidations.forEach(v => {
        console.error(`  ${v.name} errors:`, v.result.errors);
      });
      const allErrors = failedValidations.flatMap(v => v.result.errors);
      throw new Error(`Invalid AI responses: ${allErrors.join(', ')}`);
    }

    console.log('✅ All responses validated successfully');

    // Step 7: Merge into single horoscope object
    console.log('🔧 Merging 4 responses into single horoscope...');
    const horoscopeData = {
      // From Call 1: Core Reading
      title: coreData.title,
      summary: coreData.summary,
      fullReading: coreData.fullReading,
      dailyFocus: coreData.dailyFocus,
      advice: coreData.advice,

      // From Call 2: Transit Data
      transitAnalysis: transitDataParsed.transitAnalysis,
      transitInsights: transitDataParsed.transitInsights,

      // From Call 3: Time Guidance
      timeGuidance: timeData.timeGuidance,
      explore: timeData.explore,
      limit: timeData.limit,

      // From Call 4: Cosmic Weather
      weather: weatherData.weather,
      spiritualGuidance: weatherData.spiritualGuidance,
      categoryAdvice: weatherData.categoryAdvice,
    };

    console.log('✅ Horoscope data merged successfully');

    // Step 6: Structure horoscope data according to DAILY_READING_DATA_STRUCTURE
    const dailyHoroscope: DailyHoroscope = {
      date: today,

      // Lightweight preview
      preview: {
        title: horoscopeData.title,
        summary: horoscopeData.summary,
        weather: horoscopeData.weather,
        categoryAdvice: horoscopeData.categoryAdvice,
      },

      // Full content
      fullContent: {
        fullReading: horoscopeData.fullReading,
        transitAnalysis: horoscopeData.transitAnalysis,
        timeGuidance: horoscopeData.timeGuidance,
        spiritualGuidance: horoscopeData.spiritualGuidance,
        transitInsights: horoscopeData.transitInsights,
        astronomicalData: {
          transits: transitData,
          currentPositions: currentPositions,
        },
        explore: horoscopeData.explore,
        limit: horoscopeData.limit,
        dailyFocus: horoscopeData.dailyFocus,
        advice: horoscopeData.advice,
      },

      // Combined for backward compatibility
      content: {
        ...horoscopeData,
      },

      hasFullReading: true,
      lastUpdated: new Date().toISOString(),
    };

    // Step 8: Create metadata (combining all 4 calls)
    const metadata: HoroscopeGenerationMetadata = {
      source: 'anthropic_ai',
      model: coreMsg.model,
      timestamp: new Date().toISOString(),
      usage: {
        inputTokens:
          coreMsg.usage.input_tokens +
          transitMsg.usage.input_tokens +
          timeMsg.usage.input_tokens +
          weatherMsg.usage.input_tokens,
        outputTokens:
          coreMsg.usage.output_tokens +
          transitMsg.usage.output_tokens +
          timeMsg.usage.output_tokens +
          weatherMsg.usage.output_tokens,
        totalTokens:
          (coreMsg.usage.input_tokens + coreMsg.usage.output_tokens) +
          (transitMsg.usage.input_tokens + transitMsg.usage.output_tokens) +
          (timeMsg.usage.input_tokens + timeMsg.usage.output_tokens) +
          (weatherMsg.usage.input_tokens + weatherMsg.usage.output_tokens),
      },
      dataQuality: {
        astrologyApiUsed: true,
        transitCount: transitData.aspects.length,
        significantTransits: transitData.summary.majorAspects,
        confidence: 'very_high',
        hasExpandedContent: true,
      },
    };

    console.log('✅ Horoscope generation complete');
    console.log('📊 Token usage:', {
      input: metadata.usage.inputTokens,
      output: metadata.usage.outputTokens,
      total: metadata.usage.totalTokens,
    });

    // Step 8: Save to Supabase
    if (userProfile.id) {
      try {
        console.log('💾 Saving horoscope to Supabase...');

        // Prepare horoscope data for database
        const horoscopeRecord = {
          user_id: userProfile.id,
          date: today,
          title: horoscopeData.title,
          summary: horoscopeData.summary,
          weather_moon: typeof horoscopeData.weather?.moon === 'string'
            ? horoscopeData.weather.moon
            : JSON.stringify(horoscopeData.weather?.moon || {}),
          weather_venus: typeof horoscopeData.weather?.venus === 'string'
            ? horoscopeData.weather.venus
            : JSON.stringify(horoscopeData.weather?.venus || {}),
          weather_mercury: typeof horoscopeData.weather?.mercury === 'string'
            ? horoscopeData.weather.mercury
            : JSON.stringify(horoscopeData.weather?.mercury || {}),
          category_advice: horoscopeData.categoryAdvice || {},
          full_reading: horoscopeData.fullReading || null,
          transit_analysis: horoscopeData.transitAnalysis || null,
          time_guidance: horoscopeData.timeGuidance || null,
          spiritual_guidance: horoscopeData.spiritualGuidance ? {
            meditation: horoscopeData.spiritualGuidance.meditation,
            affirmation: horoscopeData.spiritualGuidance.affirmation,
            journalPrompts: horoscopeData.spiritualGuidance.journalPrompts,
          } : null,
          transit_insights: horoscopeData.transitInsights || [],
          astronomical_data: {
            transits: transitData,
            currentPositions: currentPositions,
          },
          explore: horoscopeData.explore || [],
          limitations: horoscopeData.limit || [],
          daily_focus: horoscopeData.dailyFocus || null,
          advice: horoscopeData.advice || null,
          has_full_reading: true,
          last_updated: new Date().toISOString(),
        };

        const { data: savedHoroscope, error: horoscopeError } = await supabase
          .from('daily_horoscopes')
          .upsert(horoscopeRecord, { onConflict: 'user_id,date' })
          .select()
          .single();

        if (horoscopeError) {
          console.error('❌ Failed to save horoscope to Supabase:', horoscopeError);
        } else {
          console.log('✅ Horoscope saved to Supabase');

          // Save generation metadata
          if (savedHoroscope?.id) {
            const metadataRecord = {
              horoscope_id: savedHoroscope.id,
              source: metadata.source,
              model: metadata.model,
              timestamp: metadata.timestamp,
              input_tokens: metadata.usage.inputTokens,
              output_tokens: metadata.usage.outputTokens,
              total_tokens: metadata.usage.totalTokens,
              astrology_api_used: metadata.dataQuality.astrologyApiUsed,
              transit_count: metadata.dataQuality.transitCount,
              significant_transits: metadata.dataQuality.significantTransits,
              confidence: metadata.dataQuality.confidence,
              has_expanded_content: metadata.dataQuality.hasExpandedContent,
            };

            const { error: metadataError } = await supabase
              .from('horoscope_generation_metadata')
              .insert(metadataRecord);

            if (metadataError) {
              console.error('❌ Failed to save metadata to Supabase:', metadataError);
            } else {
              console.log('✅ Metadata saved to Supabase');
            }
          }
        }
      } catch (dbError: any) {
        console.error('❌ Database save error:', dbError);
        // Don't fail the whole operation if DB save fails
      }
    }

    return {
      success: true,
      horoscope: dailyHoroscope,
      metadata: metadata,
    };
  } catch (error: any) {
    console.error('❌ Horoscope generation failed:', error);

    return {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
  }
};

/**
 * Load horoscope from Supabase for a specific date
 */
const loadHoroscopeFromSupabase = async (
  userId: string,
  date: string
): Promise<DailyHoroscope | null> => {
  try {
    console.log('🔍 Checking Supabase for horoscope:', { userId, date });

    const { data, error } = await supabase
      .from('daily_horoscopes')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - not an error, just no horoscope for this date
        console.log('📭 No horoscope found in Supabase for', date);
        return null;
      }
      console.error('❌ Error loading horoscope from Supabase:', error);
      return null;
    }

    if (!data) {
      console.log('📭 No horoscope found in Supabase for', date);
      return null;
    }

    console.log('✅ Found horoscope in Supabase for', date);

    // Reconstruct DailyHoroscope from database record
    const horoscope: DailyHoroscope = {
      date: data.date,
      preview: {
        title: data.title,
        summary: data.summary,
        weather: {
          moon: typeof data.weather_moon === 'string'
            ? JSON.parse(data.weather_moon || '{}')
            : data.weather_moon || {},
          venus: typeof data.weather_venus === 'string'
            ? JSON.parse(data.weather_venus || '{}')
            : data.weather_venus || {},
          mercury: typeof data.weather_mercury === 'string'
            ? JSON.parse(data.weather_mercury || '{}')
            : data.weather_mercury || {},
        },
        categoryAdvice: data.category_advice || {},
      },
      fullContent: {
        fullReading: data.full_reading || null,
        transitAnalysis: data.transit_analysis || null,
        timeGuidance: data.time_guidance || null,
        spiritualGuidance: data.spiritual_guidance || null,
        transitInsights: data.transit_insights || [],
        astronomicalData: data.astronomical_data || null,
        explore: data.explore || [],
        limit: data.limitations || [],
        dailyFocus: data.daily_focus || null,
        advice: data.advice || null,
      },
      content: {
        title: data.title,
        summary: data.summary,
        weather: {
          moon: typeof data.weather_moon === 'string'
            ? JSON.parse(data.weather_moon || '{}')
            : data.weather_moon || {},
          venus: typeof data.weather_venus === 'string'
            ? JSON.parse(data.weather_venus || '{}')
            : data.weather_venus || {},
          mercury: typeof data.weather_mercury === 'string'
            ? JSON.parse(data.weather_mercury || '{}')
            : data.weather_mercury || {},
        },
        categoryAdvice: data.category_advice || {},
        fullReading: data.full_reading || null,
        transitAnalysis: data.transit_analysis || null,
        transitInsights: data.transit_insights || [],
        explore: data.explore || [],
        limit: data.limitations || [],
        dailyFocus: data.daily_focus || null,
        advice: data.advice || null,
      },
      hasFullReading: data.has_full_reading || false,
      lastUpdated: data.last_updated,
    };

    return horoscope;
  } catch (error: any) {
    console.error('❌ Failed to load horoscope from Supabase:', error);
    return null;
  }
};

/**
 * Get daily horoscope (with caching)
 */
export const getDailyHoroscope = async (
  natalChart: NatalChartData,
  userProfile: any,
  cachedHoroscope: DailyHoroscope | null,
  options: HoroscopeGenerationOptions = {}
): Promise<HoroscopeGenerationResult> => {
  const { forceRegenerate = false, maxCacheAgeHours = 24 } = options;
  const today = getTodayDate();

  // Step 1: Check local cache (fastest)
  if (!forceRegenerate && cachedHoroscope && isCacheValid(cachedHoroscope.date, maxCacheAgeHours)) {
    console.log('✅ Using cached horoscope from AsyncStorage for', cachedHoroscope.date);
    return {
      success: true,
      horoscope: cachedHoroscope,
      fromCache: true,
    };
  }

  // Step 2: Check Supabase database (before generating new)
  if (!forceRegenerate && userProfile.id) {
    const dbHoroscope = await loadHoroscopeFromSupabase(userProfile.id, today);
    if (dbHoroscope) {
      console.log('✅ Using horoscope from Supabase for', today);
      return {
        success: true,
        horoscope: dbHoroscope,
        fromCache: true,
      };
    }
  }

  // Step 3: Generate new horoscope
  console.log('🔄 No valid horoscope found, generating new one for', today);
  return await generateDailyHoroscope(natalChart, userProfile, options);
};

/**
 * Validate Anthropic API key
 */
export const validateAnthropicApiKey = (): boolean => {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error('❌ EXPO_PUBLIC_ANTHROPIC_API_KEY is not set in .env file');
    return false;
  }

  if (!apiKey.startsWith('sk-ant-')) {
    console.error('❌ Invalid Anthropic API key format');
    return false;
  }

  return true;
};
