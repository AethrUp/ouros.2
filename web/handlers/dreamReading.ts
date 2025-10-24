/**
 * Dream Interpretation Handlers
 * Handles dream interpretation generation and reading persistence
 */

import Anthropic from '@anthropic-ai/sdk';
import { DreamReading } from '../types/dream';
import { supabase } from '../utils/supabase';
import { useAppStore } from '../store';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

/**
 * Generate AI-powered dream interpretation
 */
export const generateDreamInterpretation = async (
  dreamDescription: string
): Promise<string> => {
  const store = useAppStore.getState();
  const { birthData, preferences } = store;

  console.log('💭 Generating dream interpretation...');

  // Build personalization context
  const context = {
    birthData,
    preferences,
    currentDate: new Date().toISOString(),
  };

  // Determine interpretation style and detail level
  const style = preferences?.interpretationStyle || 'psychological';
  const detailLevel = preferences?.detailLevel || 'detailed';

  // Construct prompt
  const prompt = constructDreamPrompt({
    dreamDescription,
    context,
    style,
    detailLevel,
  });

  try {
    console.log('📡 Calling Anthropic API...');

    // Call Anthropic API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
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

    if (!interpretation) {
      throw new Error('Empty response from AI');
    }

    console.log('✅ AI interpretation generated successfully');
    console.log('📊 Token usage:', {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
      total: response.usage.input_tokens + response.usage.output_tokens,
    });

    return interpretation;
  } catch (error) {
    console.error('AI interpretation failed:', error);
    throw error;
  }
};

/**
 * Construct dream interpretation prompt
 */
function constructDreamPrompt({
  dreamDescription,
  context,
  style,
  detailLevel,
}: {
  dreamDescription: string;
  context: any;
  style: string;
  detailLevel: string;
}): string {
  const { birthData } = context;

  let prompt = `You are an expert dream interpreter, combining Jungian psychology, archetypal symbolism, and modern dream analysis. Provide a thoughtful, insightful interpretation of the following dream.\n\n`;

  prompt += `DREAM DESCRIPTION:\n${dreamDescription}\n\n`;

  // Add personalization if available
  if (birthData?.sun) {
    prompt += `DREAMER'S ASTROLOGICAL CONTEXT:\n`;
    prompt += `Sun Sign: ${birthData.sun.sign.name}\n`;
    if (birthData.moon) {
      prompt += `Moon Sign: ${birthData.moon.sign.name}\n`;
    }
    if (birthData.ascendant) {
      prompt += `Rising Sign: ${birthData.ascendant.sign.name}\n`;
    }
    prompt += `\n`;
  }

  // Style guidance
  if (style === 'psychological') {
    prompt += `INTERPRETATION STYLE: Use a psychological and introspective approach, exploring the dream's personal meaning and emotional significance.\n\n`;
  } else if (style === 'spiritual') {
    prompt += `INTERPRETATION STYLE: Use a spiritual and mystical approach, exploring archetypal symbols, universal meanings, and soul-level messages.\n\n`;
  } else if (style === 'practical') {
    prompt += `INTERPRETATION STYLE: Use a practical approach, focusing on how the dream relates to current life situations and actionable insights.\n\n`;
  }

  // Detail level guidance
  if (detailLevel === 'brief') {
    prompt += `DETAIL LEVEL: Provide a concise interpretation (2-3 paragraphs).\n\n`;
  } else if (detailLevel === 'detailed') {
    prompt += `DETAIL LEVEL: Provide a thorough interpretation (4-5 paragraphs).\n\n`;
  } else if (detailLevel === 'comprehensive') {
    prompt += `DETAIL LEVEL: Provide an in-depth, comprehensive interpretation (6+ paragraphs).\n\n`;
  }

  prompt += `STRUCTURE YOUR INTERPRETATION:\n`;
  prompt += `1. **Overview**: Brief summary of the dream's primary themes and emotional tone\n`;
  prompt += `2. **Symbolic Analysis**: Interpret key symbols, characters, and settings\n`;
  prompt += `3. **Personal Meaning**: What this dream might be revealing about the dreamer's inner world, emotions, or life situation\n`;
  prompt += `4. **Message & Guidance**: The potential message or insight the dream is offering\n`;
  prompt += `5. **Reflection Questions**: 2-3 questions to help the dreamer explore the dream's meaning more deeply\n\n`;

  prompt += `Provide your interpretation in a warm, insightful tone. Be specific to the dream content while also addressing universal human experiences and emotions.`;

  return prompt;
}

/**
 * Save dream reading to database
 */
export const saveDreamReading = async (data: {
  dreamDescription: string;
  interpretation: string;
}): Promise<DreamReading> => {
  const store = useAppStore.getState();
  const userId = store.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  console.log('💾 Saving dream reading to database...');

  try {
    // Save to Supabase using the unified 'readings' table
    const { data: savedReading, error } = await supabase
      .from('readings')
      .insert({
        user_id: userId,
        reading_type: 'dream',
        timestamp: new Date().toISOString(),
        intention: data.dreamDescription.substring(0, 200), // Store first 200 chars as "intention"
        interpretation: data.interpretation,
        metadata: {
          dream_description: data.dreamDescription,
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
    const reading: DreamReading = {
      id: savedReading.id,
      userId,
      createdAt: savedReading.timestamp,
      dreamDescription: data.dreamDescription,
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
    const reading: DreamReading = {
      id: `local-${Date.now()}`,
      userId,
      createdAt: new Date().toISOString(),
      dreamDescription: data.dreamDescription,
      interpretation: data.interpretation,
      interpretationSource: 'ai',
    };

    return reading;
  }
};

/**
 * Load user's dream reading history from database
 */
export const loadDreamHistory = async (): Promise<DreamReading[]> => {
  const store = useAppStore.getState();
  const userId = store.user?.id;

  if (!userId) {
    console.warn('User not authenticated, returning empty history');
    return [];
  }

  console.log('📚 Loading dream reading history...');

  try {
    const { data, error } = await supabase
      .from('readings')
      .select('*')
      .eq('user_id', userId)
      .eq('reading_type', 'dream')
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Failed to load history:', error);
      throw error;
    }

    // Transform database records to DreamReading objects
    const readings: DreamReading[] = (data || []).map((record) => ({
      id: record.id,
      userId: record.user_id,
      createdAt: record.timestamp,
      dreamDescription:
        record.metadata?.dream_description || record.intention || '',
      interpretation: record.interpretation,
      interpretationSource: record.metadata?.interpretation_source || 'ai',
    }));

    console.log(`✅ Loaded ${readings.length} dream readings`);

    return readings;
  } catch (error) {
    console.error('Failed to load dream history:', error);
    return [];
  }
};

/**
 * Delete a dream reading from database
 */
export const deleteDreamReading = async (readingId: string): Promise<void> => {
  const store = useAppStore.getState();
  const userId = store.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  console.log('🗑️ Deleting dream reading:', readingId);

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

    console.log('✅ Dream reading deleted successfully');
  } catch (error) {
    console.error('Failed to delete dream reading:', error);
    throw error;
  }
};
