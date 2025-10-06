/**
 * I Ching Reading Handlers
 * Handles hexagram casting, interpretation generation, and reading persistence
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  IChingReading,
  CastedHexagram,
  CastingMethod,
} from '../types/iching';
import {
  castHexagramWithCoins,
  castHexagramWithYarrowStalks,
} from '../utils/ichingCasting';
import {
  constructIChingPrompt,
  constructStaticIChingInterpretation,
  validateIChingResponse,
} from '../utils/ichingPromptTemplate';
import { supabase } from '../utils/supabase';
import { useAppStore } from '../store';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '',
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
): Promise<string> => {
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
  const style = preferences?.interpretationStyle || 'psychological';
  const detailLevel = preferences?.detailLevel || 'detailed';

  // Try AI interpretation first
  try {
    // Construct prompt
    const prompt = constructIChingPrompt({
      question,
      primaryHexagram,
      relatingHexagram,
      context,
      style,
      detailLevel,
    });

    console.log('📡 Calling Anthropic API...');

    // Call Anthropic API
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens:
        detailLevel === 'comprehensive'
          ? 3000
          : detailLevel === 'detailed'
          ? 2000
          : 1000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract text from response
    const interpretation =
      response.content[0]?.type === 'text' ? response.content[0].text : '';

    // Validate response
    const validation = validateIChingResponse(interpretation);

    if (!validation.valid) {
      console.warn('AI response validation failed:', validation.error);
      throw new Error(validation.error);
    }

    console.log('✅ AI interpretation generated successfully');
    console.log('📊 Token usage:', {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
      total: response.usage.input_tokens + response.usage.output_tokens,
    });

    return interpretation;
  } catch (error) {
    console.error('AI interpretation failed, using static fallback:', error);

    // Fallback to static interpretation
    const staticInterpretation = constructStaticIChingInterpretation(
      question,
      primaryHexagram,
      relatingHexagram
    );

    return staticInterpretation;
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
  interpretation: string;
}): Promise<IChingReading> => {
  const store = useAppStore.getState();
  const userId = store.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  console.log('💾 Saving I Ching reading to database...');

  try {
    // Save to Supabase using the unified 'readings' table
    const { data: savedReading, error } = await supabase
      .from('readings')
      .insert({
        user_id: userId,
        reading_type: 'iching',
        timestamp: new Date().toISOString(),
        intention: data.question, // Using 'intention' field for the question
        interpretation: data.interpretation,
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
    const readings: IChingReading[] = (data || []).map((record) => ({
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
        lines: record.metadata.primary_hexagram.lines || [],
        changingLines: record.metadata.primary_hexagram.changing_lines || [],
      } as CastedHexagram,
      relatingHexagram: record.metadata.relating_hexagram
        ? ({
            hexagram: {
              number: record.metadata.relating_hexagram.number,
              chineseName: record.metadata.relating_hexagram.chinese_name,
              englishName: record.metadata.relating_hexagram.name,
            },
            lines: [],
            changingLines: [],
          } as CastedHexagram)
        : undefined,
      interpretation: record.interpretation,
      interpretationSource: record.metadata.interpretation_source || 'ai',
    }));

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
