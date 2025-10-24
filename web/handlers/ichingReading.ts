/**
 * I Ching Reading Handlers
 * Handles hexagram casting, interpretation generation, and reading persistence
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  IChingReading,
  CastedHexagram,
  CastingMethod,
  IChingInterpretation,
  IChingInterpretationV2,
} from '../types/iching';
import {
  castHexagramWithCoins,
  castHexagramWithYarrowStalks,
} from '../utils/ichingCasting';
import {
  constructIChingPromptV2,
  validateIChingInterpretationV2JSON,
} from '../utils/ichingPromptTemplateV2';
import {
  constructStaticIChingInterpretation,
} from '../utils/ichingPromptTemplate';
import { supabase } from '../utils/supabase';
import { useAppStore } from '../store';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

/**
 * Cast a hexagram using the specified method
 */
export const handleCastHexagram = async (
  method: CastingMethod
): Promise<{
  primaryHexagram: CastedHexagram;
  relatingHexagram?: CastedHexagram;
}> => {
  console.log(`🎲 Casting hexagram using ${method} method...`);

  try {
    let result;

    if (method === 'three-coins') {
      result = await castHexagramWithCoins();
    } else if (method === 'yarrow-stalks') {
      result = await castHexagramWithYarrowStalks();
    } else {
      throw new Error(`Unknown casting method: ${method}`);
    }

    console.log(
      `✨ Cast Hexagram ${result.primaryHexagram.hexagram.number}: ${result.primaryHexagram.hexagram.englishName}`
    );

    if (result.relatingHexagram) {
      console.log(
        `   → Relating Hexagram ${result.relatingHexagram.hexagram.number}: ${result.relatingHexagram.hexagram.englishName}`
      );
    }

    return result;
  } catch (error) {
    console.error('❌ Failed to cast hexagram:', error);
    throw error;
  }
};

/**
 * Generate AI-powered I Ching interpretation
 * Falls back to static interpretation if AI unavailable
 */
export const generateIChingInterpretation = async (
  question: string,
  primaryHexagram: CastedHexagram,
  relatingHexagram?: CastedHexagram
): Promise<IChingInterpretationV2> => {
  const store = useAppStore.getState();
  const { birthData, preferences } = store;

  console.log('☯️ Generating I Ching interpretation...');

  // Build personalization context
  const context = {
    birthData,
    preferences,
    currentDate: new Date().toISOString(),
  };

  // Determine interpretation style and detail level
  // Map user preference style to I Ching prompt style
  const userStyle = preferences?.interpretationStyle || 'psychological';
  const style = userStyle === 'mystical' ? 'spiritual' : userStyle as 'traditional' | 'psychological' | 'spiritual' | 'practical';

  // Map detail level: 'brief' -> 'concise'
  const userDetailLevel = preferences?.detailLevel || 'detailed';
  const detailLevel = userDetailLevel === 'brief' ? 'concise' : userDetailLevel as 'concise' | 'detailed' | 'comprehensive';

  // Try AI interpretation first
  try {
    // Construct V2 prompt (structured format)
    const prompt = constructIChingPromptV2({
      question,
      primaryHexagram,
      relatingHexagram,
      context,
      style,
      detailLevel,
    });

    console.log('📡 Calling Anthropic API with V2 prompt...');

    // Call Anthropic API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000, // V2 format needs more tokens for structured content
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract text from response
    const responseText =
      response.content[0]?.type === 'text' ? response.content[0].text : '';

    if (!responseText) {
      throw new Error('Empty response from AI');
    }

    // Parse JSON response
    let interpretationData: IChingInterpretationV2;
    try {
      // Try to extract JSON if there's text before/after the JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : responseText;
      interpretationData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      console.log('Raw response:', responseText.substring(0, 200));
      throw new Error('Invalid JSON in AI response');
    }

    // Validate JSON structure
    const validation = validateIChingInterpretationV2JSON(interpretationData);

    if (!validation.valid) {
      console.warn('AI response JSON validation failed:', validation.errors);
      throw new Error(`Invalid interpretation structure: ${validation.errors.join(', ')}`);
    }

    console.log('✅ AI interpretation V2 generated successfully');
    console.log('📊 Token usage:', {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
      total: response.usage.input_tokens + response.usage.output_tokens,
    });

    // The interpretationData is already in the correct IChingInterpretationV2 format
    return interpretationData;
  } catch (error) {
    console.error('AI interpretation failed, using static fallback:', error);

    // Fallback to static interpretation (V1 format, still compatible)
    const staticInterpretation = constructStaticIChingInterpretation(
      question,
      primaryHexagram,
      relatingHexagram
    );

    // For now, return the V1 format - the UI will handle both
    return staticInterpretation as any;
  }
};

/**
 * Save I Ching reading to database
 */
export const saveIChingReading = async (data: {
  question: string;
  castingMethod: CastingMethod;
  primaryHexagram: CastedHexagram;
  relatingHexagram?: CastedHexagram;
  interpretation: string | IChingInterpretation | IChingInterpretationV2;
}): Promise<IChingReading> => {
  const store = useAppStore.getState();
  const userId = store.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  console.log('💾 Saving I Ching reading to database...');

  try {
    // Serialize interpretation (support both string and structured format)
    const serializedInterpretation =
      typeof data.interpretation === 'string'
        ? data.interpretation
        : JSON.stringify(data.interpretation);

    // Save to Supabase using the unified 'readings' table
    const { data: savedReading, error } = await supabase
      .from('readings')
      .insert({
        user_id: userId,
        reading_type: 'iching',
        timestamp: new Date().toISOString(),
        intention: data.question, // Using 'intention' field for the question
        interpretation: serializedInterpretation,
        metadata: {
          casting_method: data.castingMethod,
          primary_hexagram: {
            number: data.primaryHexagram.hexagram.number,
            name: data.primaryHexagram.hexagram.englishName,
            chinese_name: data.primaryHexagram.hexagram.chineseName,
            changing_lines: data.primaryHexagram.changingLines,
            lines: data.primaryHexagram.lines,
          },
          relating_hexagram: data.relatingHexagram
            ? {
                number: data.relatingHexagram.hexagram.number,
                name: data.relatingHexagram.hexagram.englishName,
                chinese_name: data.relatingHexagram.hexagram.chineseName,
              }
            : null,
          interpretation_source: 'ai',
        },
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log('✅ Reading saved successfully');

    // Create the reading object with the database-generated ID
    const reading: IChingReading = {
      id: savedReading.id,
      userId,
      createdAt: savedReading.timestamp,
      question: data.question,
      castingMethod: data.castingMethod,
      primaryHexagram: data.primaryHexagram,
      relatingHexagram: data.relatingHexagram,
      interpretation: data.interpretation,
      interpretationSource: 'ai',
    };

    return reading;
  } catch (error) {
    // If database save fails, still return the reading
    // It will be stored in local state via Zustand
    console.error('Failed to save to database:', error);
    console.warn('⚠️ Reading not persisted to database, stored locally only');

    // Return a reading object with a temporary local ID
    const reading: IChingReading = {
      id: `local-${Date.now()}`,
      userId,
      createdAt: new Date().toISOString(),
      question: data.question,
      castingMethod: data.castingMethod,
      primaryHexagram: data.primaryHexagram,
      relatingHexagram: data.relatingHexagram,
      interpretation: data.interpretation,
      interpretationSource: 'ai',
    };

    return reading;
  }
};

/**
 * Helper function to try parsing JSON from string
 */
const tryParseJSON = (str: string): IChingInterpretation | null => {
  try {
    const parsed = JSON.parse(str);
    // Validate that it's a proper IChingInterpretation structure
    if (parsed && typeof parsed === 'object' && 'interpretation' in parsed) {
      return parsed as IChingInterpretation;
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Load user's I Ching reading history from database
 */
export const loadIChingHistory = async (): Promise<IChingReading[]> => {
  const store = useAppStore.getState();
  const userId = store.user?.id;

  if (!userId) {
    console.warn('User not authenticated, returning empty history');
    return [];
  }

  console.log('📚 Loading I Ching reading history...');

  try {
    const { data, error } = await supabase
      .from('readings')
      .select('*')
      .eq('user_id', userId)
      .eq('reading_type', 'iching')
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Failed to load history:', error);
      throw error;
    }

    // Transform database records to IChingReading objects
    const readings: IChingReading[] = (data || []).map((record) => {
      // Parse interpretation (support both string and JSON)
      let interpretation: string | IChingInterpretation = record.interpretation;
      if (typeof record.interpretation === 'string') {
        const parsed = tryParseJSON(record.interpretation);
        if (parsed) {
          interpretation = parsed;
        }
      }

      // Reconstruct primary hexagram
      const primaryLines = record.metadata.primary_hexagram.lines || [];
      const changingLines = record.metadata.primary_hexagram.changing_lines || [];

      // Reconstruct relating hexagram lines from primary hexagram + changing lines
      let relatingHexagram: CastedHexagram | undefined = undefined;
      if (record.metadata.relating_hexagram && primaryLines.length > 0) {
        const relatingLines = primaryLines.map((line: any, idx: number) => {
          const isChanging = changingLines.includes(line.position);

          if (isChanging) {
            // Flip the line type
            const isYang = line.type === 'yang' || line.type === 'changing-yang';
            const flippedType = isYang ? 'yin' : 'yang';
            return {
              position: idx + 1,
              type: flippedType,
              isChanging: false,
            };
          }

          // Keep the line as-is but mark as stable
          const isYang = line.type === 'yang' || line.type === 'changing-yang';
          return {
            position: idx + 1,
            type: isYang ? 'yang' : 'yin',
            isChanging: false,
          };
        });

        relatingHexagram = record.metadata.relating_hexagram as unknown as CastedHexagram;
      }

      return {
        id: record.id,
        userId: record.user_id,
        createdAt: record.timestamp,
        question: record.intention || '',
        castingMethod: record.metadata.casting_method || 'three-coins',
        primaryHexagram: {
          hexagram: {
            number: record.metadata.primary_hexagram.number,
            chineseName: record.metadata.primary_hexagram.chinese_name,
            englishName: record.metadata.primary_hexagram.name,
            // Note: Full hexagram data would need to be reconstituted from the hexagrams data
          },
          lines: primaryLines,
          changingLines: changingLines,
        } as CastedHexagram,
        relatingHexagram,
        interpretation,
        interpretationSource: record.metadata.interpretation_source || 'ai',
      };
    });

    console.log(`✅ Loaded ${readings.length} readings`);

    return readings;
  } catch (error) {
    console.error('Failed to load I Ching history:', error);
    return [];
  }
};

/**
 * Delete an I Ching reading from database
 */
export const deleteIChingReading = async (
  readingId: string
): Promise<void> => {
  const store = useAppStore.getState();
  const userId = store.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  console.log('🗑️ Deleting reading:', readingId);

  try {
    const { error } = await supabase
      .from('readings')
      .delete()
      .eq('id', readingId)
      .eq('user_id', userId); // Security: ensure user can only delete their own readings

    if (error) {
      console.error('Failed to delete reading:', error);
      throw error;
    }

    console.log('✅ Reading deleted successfully');
  } catch (error) {
    console.error('Failed to delete reading:', error);
    throw error;
  }
};
