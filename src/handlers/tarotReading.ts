/**
 * Tarot Reading Handlers
 * Handles card drawing, interpretation generation, and reading persistence
 */

import Anthropic from '@anthropic-ai/sdk';
import { TarotCard, DrawnCard, SpreadLayout, TarotReading } from '../types/tarot';
import { getQuantumRandom } from '../utils/quantumRandom';
import { constructTarotPrompt, constructStaticInterpretation, validateTarotResponse } from '../utils/tarotPromptTemplate';
import { supabase } from '../utils/supabase';
import { useAppStore } from '../store';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '',
});

/**
 * Draw cards using quantum random number generation
 * Ensures no duplicate cards in a single spread
 */
export const handleDrawCards = async (spread: SpreadLayout): Promise<DrawnCard[]> => {
  // Import tarot deck - will be created once user provides images
  // For now, this is a placeholder that will work once the deck is added
  let TAROT_DECK: TarotCard[];

  try {
    // Dynamic import to handle case where deck doesn't exist yet
    const tarotDeckModule = await import('../data/tarot/tarotCards');
    TAROT_DECK = tarotDeckModule.TAROT_DECK;
  } catch (error) {
    console.error('Tarot deck not found:', error);
    throw new Error('Tarot card deck not yet configured. Please ensure tarotCards.ts is created with card data.');
  }

  // Request twice as many random numbers:
  // - First set for card selection
  // - Second set for orientation (upright/reversed)
  const randomNumbers = await getQuantumRandom(spread.cardCount * 2);

  const drawnCards: DrawnCard[] = [];
  const usedIndices = new Set<number>();

  spread.positions.forEach((position, idx) => {
    // Select unique card index
    let cardIndex = randomNumbers[idx] % TAROT_DECK.length;

    // Ensure no duplicates in this spread
    while (usedIndices.has(cardIndex)) {
      cardIndex = (cardIndex + 1) % TAROT_DECK.length;
    }
    usedIndices.add(cardIndex);

    // Determine orientation (upright or reversed)
    const orientation = randomNumbers[spread.cardCount + idx] % 2 === 0
      ? 'upright'
      : 'reversed';

    drawnCards.push({
      card: TAROT_DECK[cardIndex],
      position: position.name,
      orientation,
      positionMeaning: position.meaning
    });
  });

  console.log(`✨ Drew ${drawnCards.length} cards for ${spread.name} spread`);

  return drawnCards;
};

/**
 * Generate AI-powered tarot interpretation
 * Falls back to static interpretation if AI unavailable
 */
export const generateTarotInterpretation = async (
  intention: string,
  drawnCards: DrawnCard[]
): Promise<string> => {
  const store = useAppStore.getState();
  const { profile, birthData, preferences } = store;

  console.log('🔮 Generating tarot interpretation...');

  // Build personalization context
  const context = {
    birthData,
    preferences,
    currentDate: new Date().toISOString()
  };

  // Determine interpretation style and detail level
  const style = preferences?.interpretationStyle || 'psychological';
  const detailLevel = preferences?.detailLevel || 'detailed';

  // Try AI interpretation first
  try {
    // Construct prompt
    const prompt = constructTarotPrompt({
      intention,
      cards: drawnCards,
      context,
      style,
      detailLevel
    });

    console.log('📡 Calling Anthropic API...');

    // Call Anthropic API
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: detailLevel === 'comprehensive' ? 3000 : detailLevel === 'detailed' ? 2000 : 1000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // Extract text from response
    const interpretation = response.content[0]?.type === 'text'
      ? response.content[0].text
      : '';

    // Validate response
    const validation = validateTarotResponse(interpretation);

    if (!validation.valid) {
      console.warn('AI response validation failed:', validation.error);
      throw new Error(validation.error);
    }

    console.log('✅ AI interpretation generated successfully');
    console.log('📊 Token usage:', {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
      total: response.usage.input_tokens + response.usage.output_tokens
    });

    return interpretation;

  } catch (error) {
    console.error('AI interpretation failed, using static fallback:', error);

    // Fallback to static interpretation
    const staticInterpretation = constructStaticInterpretation(intention, drawnCards);

    return staticInterpretation;
  }
};

/**
 * Save tarot reading to database
 */
export const saveTarotReading = async (data: {
  intention: string;
  spread: SpreadLayout;
  drawnCards: DrawnCard[];
  interpretation: string;
}): Promise<TarotReading> => {
  const store = useAppStore.getState();
  const userId = store.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  console.log('💾 Saving tarot reading to database...');

  try {
    // Save to Supabase using the unified 'readings' table
    // Let Supabase generate the UUID
    const { data: savedReading, error } = await supabase
      .from('readings')
      .insert({
        user_id: userId,
        reading_type: 'tarot',
        timestamp: new Date().toISOString(),
        intention: data.intention,
        interpretation: data.interpretation,
        metadata: {
          spread_id: data.spread.id,
          spread_name: data.spread.name,
          cards: data.drawnCards,
          interpretation_source: 'ai'
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log('✅ Reading saved successfully');

    // Create the reading object with the database-generated ID
    const reading: TarotReading = {
      id: savedReading.id,
      userId,
      createdAt: savedReading.timestamp,
      intention: data.intention,
      spread: data.spread,
      cards: data.drawnCards,
      interpretation: data.interpretation,
      interpretationSource: 'ai'
    };

    return reading;

  } catch (error) {
    // If database save fails, still return the reading
    // It will be stored in local state via Zustand
    console.error('Failed to save to database:', error);
    console.warn('⚠️ Reading not persisted to database, stored locally only');

    // Return a reading object with a temporary local ID
    const reading: TarotReading = {
      id: `local-${Date.now()}`,
      userId,
      createdAt: new Date().toISOString(),
      intention: data.intention,
      spread: data.spread,
      cards: data.drawnCards,
      interpretation: data.interpretation,
      interpretationSource: 'ai'
    };

    return reading;
  }
};

/**
 * Load user's tarot reading history from database
 */
export const loadTarotHistory = async (): Promise<TarotReading[]> => {
  const store = useAppStore.getState();
  const userId = store.user?.id;

  if (!userId) {
    console.warn('User not authenticated, returning empty history');
    return [];
  }

  console.log('📚 Loading tarot reading history...');

  try {
    const { data, error } = await supabase
      .from('readings')
      .select('*')
      .eq('user_id', userId)
      .eq('reading_type', 'tarot')
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Failed to load history:', error);
      throw error;
    }

    // Transform database records to TarotReading objects
    const readings: TarotReading[] = (data || []).map(record => ({
      id: record.id,
      userId: record.user_id,
      createdAt: record.timestamp,
      intention: record.intention || '',
      spread: {
        id: record.metadata.spread_id,
        name: record.metadata.spread_name || '',
        description: '',
        cardCount: record.metadata.cards?.length || 0,
        positions: []
      },
      cards: record.metadata.cards || [],
      interpretation: record.interpretation,
      interpretationSource: record.metadata.interpretation_source || 'ai'
    }));

    console.log(`✅ Loaded ${readings.length} readings`);

    return readings;

  } catch (error) {
    console.error('Failed to load tarot history:', error);
    return [];
  }
};

/**
 * Delete a tarot reading from database
 */
export const deleteTarotReading = async (readingId: string): Promise<void> => {
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
