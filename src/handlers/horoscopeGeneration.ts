/**
 * Horoscope Generation Handler
 * Orchestrates transit calculation + AI interpretation
 */

import Anthropic from '@anthropic-ai/sdk';
import { NatalChartData } from '../types/user';
import { DailyHoroscope, HoroscopeGenerationMetadata } from '../types/reading';
import { createHoroscopePrompt, validateHoroscopeResponse } from '../utils/aiPromptTemplates';
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
      console.log(`  ${index + 1}. ${aspect.transitingPlanet} ${aspect.aspect} ${aspect.natalPlanet}`, {
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

    // Step 3: Build AI prompt
    console.log('📝 Building AI prompt...');
    const userCategories = userProfile.selectedCategories || userProfile.preferences?.selectedCategories;

    // DEBUG: Log input data being sent to prompt creation
    console.log('🔍 DEBUG: ========== INPUT DATA FOR PROMPT CREATION ==========');
    console.log('🔍 DEBUG: Natal Chart Summary:', {
      planets: Object.keys(natalChart.planets || {}),
      houses: Object.keys(natalChart.houses || {}),
      ascendant: natalChart.ascendant,
      name: userProfile.name || 'N/A',
      birthDate: userProfile.birthDate || 'N/A',
      birthLocation: userProfile.birthLocation || 'N/A',
    });
    console.log('🔍 DEBUG: Complete Natal Chart Planets:', natalChart.planets);
    console.log('🔍 DEBUG: Complete Natal Chart Houses:', natalChart.houses);
    console.log('🔍 DEBUG: Transit Data Summary:', {
      totalAspects: transitData.aspects.length,
      majorAspects: transitData.summary.majorAspects,
      aspectTypes: [...new Set(transitData.aspects.map((a: any) => a.aspect))],
      transitingPlanets: [...new Set(transitData.aspects.map((a: any) => a.transitingPlanet))],
      natalPlanets: [...new Set(transitData.aspects.map((a: any) => a.natalPlanet))],
    });
    console.log('🔍 DEBUG: Complete Transit Aspects:', JSON.stringify(transitData.aspects, null, 2));
    console.log('🔍 DEBUG: Transit Summary:', transitData.summary);
    console.log('🔍 DEBUG: Current Planetary Positions:', currentPositions);
    console.log('🔍 DEBUG: User Categories:', userCategories);
    console.log('🔍 DEBUG: Date:', today);
    console.log('🔍 DEBUG: ========== END OF INPUT DATA ==========');

    const prompt = createHoroscopePrompt(
      natalChart,
      transitData,
      currentPositions,
      today,
      userCategories
    );

    // DEBUG: Log the complete prompt
    console.log('🔍 DEBUG: ========== FULL PROMPT SENT TO LLM ==========');
    console.log(prompt);
    console.log('🔍 DEBUG: ========== END OF PROMPT ==========');
    console.log('🔍 DEBUG: Prompt length:', prompt.length, 'characters');

    // Step 4: Call Anthropic API
    console.log('🤖 Calling Anthropic Claude API...');
    console.log('🔍 DEBUG: API Request Details:', {
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 12000,
      message_role: 'user',
      content_length: prompt.length,
    });
    const startTime = Date.now();

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 12000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const apiDuration = Date.now() - startTime;
    console.log(`✅ AI response received in ${apiDuration}ms`);

    // Step 5: Parse and validate response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    console.log('🔍 DEBUG: Raw AI response length:', responseText.length);
    console.log('🔍 DEBUG: First 200 characters:', responseText.substring(0, 200));
    console.log('🔍 DEBUG: Last 200 characters:', responseText.substring(Math.max(0, responseText.length - 200)));
    console.log('🔍 DEBUG: Full response:', responseText);

    let horoscopeData: any;
    try {
      // Strip markdown code fences if present
      let jsonText = responseText.trim();

      // Check if response is wrapped in markdown code fences
      if (jsonText.startsWith('```')) {
        // Remove opening fence (```json or ```)
        jsonText = jsonText.replace(/^```(?:json)?\s*\n?/, '');
        // Remove closing fence
        jsonText = jsonText.replace(/\n?```\s*$/, '');
      }

      horoscopeData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('❌ Failed to parse AI response as JSON:', parseError);
      console.error('❌ DEBUG: Full response text that failed to parse:', responseText);
      throw new Error('AI response is not valid JSON');
    }

    // Validate response structure
    const validation = validateHoroscopeResponse(horoscopeData);
    if (!validation.valid) {
      console.error('❌ AI response validation failed:', validation.errors);
      throw new Error(`Invalid AI response structure: ${validation.errors.join(', ')}`);
    }

    console.log('✅ AI response validated successfully');

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

    // Step 7: Create metadata
    const metadata: HoroscopeGenerationMetadata = {
      source: 'anthropic_ai',
      model: message.model,
      timestamp: new Date().toISOString(),
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
        totalTokens: message.usage.input_tokens + message.usage.output_tokens,
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
          spiritual_guidance: horoscopeData.spiritualGuidance || null,
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
            ? data.weather_moon
            : JSON.parse(data.weather_moon || '{}'),
          venus: typeof data.weather_venus === 'string'
            ? data.weather_venus
            : JSON.parse(data.weather_venus || '{}'),
          mercury: typeof data.weather_mercury === 'string'
            ? data.weather_mercury
            : JSON.parse(data.weather_mercury || '{}'),
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
            ? data.weather_moon
            : JSON.parse(data.weather_moon || '{}'),
          venus: typeof data.weather_venus === 'string'
            ? data.weather_venus
            : JSON.parse(data.weather_venus || '{}'),
          mercury: typeof data.weather_mercury === 'string'
            ? data.weather_mercury
            : JSON.parse(data.weather_mercury || '{}'),
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
