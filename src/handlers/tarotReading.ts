/**
 * Tarot Reading Handlers
 * Handles card drawing, interpretation generation, and reading persistence
 */

import Anthropic from '@anthropic-ai/sdk';
import { TarotCard, DrawnCard, SpreadLayout, TarotReading, CardInsight } from '../types/tarot';
import { getQuantumRandom } from '../utils/quantumRandom';
import {
  constructTarotPrompt,
  constructOverviewPrompt,
  constructCardPrompt,
  constructMetaPrompt,
  constructStaticInterpretation,
  validateTarotResponse
} from '../utils/tarotPromptTemplate';
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
 * Helper: Parse and clean JSON response from AI
 */
const parseAIResponse = (text: string): any => {
  let cleanedText = text.trim();

  // Remove markdown code fences if present
  if (cleanedText.startsWith('```json')) {
    cleanedText = cleanedText.substring(7);
  } else if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.substring(3);
  }

  if (cleanedText.endsWith('```')) {
    cleanedText = cleanedText.substring(0, cleanedText.length - 3);
  }

  return JSON.parse(cleanedText.trim());
};

/**
 * Generate tarot interpretation using parallel AI calls (for larger spreads)
 */
const generateParallelInterpretation = async (
  intention: string,
  drawnCards: DrawnCard[],
  context: any,
  style: 'mystical' | 'psychological' | 'practical'
): Promise<string> => {
  const startTime = Date.now();
  console.log(`🚀 Starting parallel generation for ${drawnCards.length} cards...`);

  // Create all prompts
  const overviewPrompt = constructOverviewPrompt({
    intention,
    cards: drawnCards,
    context,
    style
  });

  const cardPrompts = drawnCards.map((card, index) =>
    constructCardPrompt({
      card,
      cardIndex: index,
      allCards: drawnCards,
      intention,
      context,
      style
    })
  );

  const metaPrompt = constructMetaPrompt({
    intention,
    cards: drawnCards,
    context,
    style
  });

  // Create all API calls
  const overviewCall = anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 400,
    temperature: 0.7,
    messages: [{ role: 'user', content: overviewPrompt }]
  });

  const cardCalls = cardPrompts.map(prompt =>
    anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 500,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }]
    })
  );

  const metaCall = anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1500,
    temperature: 0.7,
    messages: [{ role: 'user', content: metaPrompt }]
  });

  // Execute all calls in parallel
  console.log(`📡 Executing ${2 + drawnCards.length} parallel API calls...`);
  const [overviewResponse, ...cardAndMetaResponses] = await Promise.all([
    overviewCall,
    ...cardCalls,
    metaCall
  ]);

  // Split card responses and meta response
  const cardResponses = cardAndMetaResponses.slice(0, drawnCards.length);
  const metaResponse = cardAndMetaResponses[drawnCards.length];

  const parallelTime = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`⚡ All parallel calls completed in ${parallelTime}s`);

  // Parse responses
  const overviewData = parseAIResponse(
    overviewResponse.content[0]?.type === 'text' ? overviewResponse.content[0].text : '{}'
  );

  const cardInsights: CardInsight[] = cardResponses.map((response, index) => {
    try {
      const cardData = parseAIResponse(
        response.content[0]?.type === 'text' ? response.content[0].text : '{}'
      );
      return cardData as CardInsight;
    } catch (error) {
      console.error(`Failed to parse card ${index + 1}:`, error);
      // Fallback for this card
      return {
        position: drawnCards[index].position,
        cardName: `${drawnCards[index].card.name} (${drawnCards[index].orientation})`,
        interpretation: drawnCards[index].orientation === 'upright'
          ? drawnCards[index].card.uprightMeaning
          : drawnCards[index].card.reversedMeaning
      };
    }
  });

  const metaData = parseAIResponse(
    metaResponse.content[0]?.type === 'text' ? metaResponse.content[0].text : '{}'
  );

  // Assemble final interpretation
  const finalInterpretation = {
    preview: metaData.preview,
    fullContent: {
      overview: overviewData.overview,
      cardInsights,
      synthesis: metaData.synthesis,
      guidance: metaData.guidance,
      timing: metaData.timing,
      keyInsight: metaData.keyInsight,
      reflectionPrompts: metaData.reflectionPrompts,
      conclusion: metaData.conclusion
    }
  };

  // Calculate total tokens
  const totalTokens = [overviewResponse, ...cardResponses, metaResponse].reduce(
    (sum, resp) => sum + resp.usage.input_tokens + resp.usage.output_tokens,
    0
  );

  console.log('✅ Parallel interpretation assembled successfully');
  console.log('📊 Total token usage:', totalTokens);
  console.log(`⚡ Generation method: parallel (${2 + drawnCards.length} calls)`);

  // Validate assembled interpretation
  const validation = validateTarotResponse(finalInterpretation);
  if (!validation.valid) {
    console.warn('⚠️ Assembled interpretation validation failed:', validation.error);
    // Continue anyway - we have content
  }

  return JSON.stringify(finalInterpretation);
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

  // Decide on generation method based on card count
  const useParallel = drawnCards.length >= 6;

  console.log(`📊 Card count: ${drawnCards.length}, Method: ${useParallel ? 'PARALLEL' : 'SINGLE-CALL'}`);

  // Try AI interpretation first
  try {
    if (useParallel) {
      // Use parallel generation for large spreads
      return await generateParallelInterpretation(intention, drawnCards, context, style);
    }

    // Use single-call generation for small spreads (legacy method)
    const prompt = constructTarotPrompt({
      intention,
      cards: drawnCards,
      context,
      style,
      detailLevel
    });

    console.log('📡 Calling Anthropic API (single call)...');

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: detailLevel === 'comprehensive' ? 4000 : detailLevel === 'detailed' ? 2500 : 1500,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const interpretationText = response.content[0]?.type === 'text'
      ? response.content[0].text
      : '';

    if (!interpretationText) {
      throw new Error('AI returned empty response');
    }

    const interpretationJson = parseAIResponse(interpretationText);

    // Validate parsed JSON
    const validation = validateTarotResponse(interpretationJson);

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

    return JSON.stringify(interpretationJson);

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
    // Import spreads and deck to reconstruct full objects
    const { TAROT_SPREADS } = await import('../data/tarot/spreads');
    const { TAROT_DECK } = await import('../data/tarot/tarotCards');

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
    const readings: TarotReading[] = (data || []).map(record => {
      // Find the full spread layout from spread_id
      const spreadId = record.metadata.spread_id;
      const fullSpread = TAROT_SPREADS.find(s => s.id === spreadId);

      // If we can't find the spread, create a minimal one with positions
      const spread: SpreadLayout = fullSpread || {
        id: spreadId || 'unknown',
        name: record.metadata.spread_name || 'Unknown Spread',
        description: '',
        cardCount: record.metadata.cards?.length || 0,
        positions: (record.metadata.cards || []).map((card: any, index: number) => ({
          id: `pos-${index}`,
          name: card.position || `Position ${index + 1}`,
          meaning: card.positionMeaning || '',
          x: index === 0 ? 0.5 : index === 1 ? 0.3 : 0.7,
          y: 0.5,
        })),
      };

      // Reconstruct cards with imageUri from TAROT_DECK
      const cards: DrawnCard[] = (record.metadata.cards || []).map((savedCard: any) => {
        // Find the full card in TAROT_DECK by name or id
        const fullCard = TAROT_DECK.find(
          c => c.name === savedCard.card?.name || c.id === savedCard.card?.id
        );

        if (!fullCard) {
          console.warn(`Card not found in deck: ${savedCard.card?.name || savedCard.card?.id}`);
        }

        return {
          card: fullCard || savedCard.card, // Use full card with imageUri, fallback to saved card
          position: savedCard.position,
          orientation: savedCard.orientation,
          positionMeaning: savedCard.positionMeaning,
        };
      });

      return {
        id: record.id,
        userId: record.user_id,
        createdAt: record.timestamp,
        intention: record.intention || '',
        spread,
        cards,
        interpretation: record.interpretation,
        interpretationSource: record.metadata.interpretation_source || 'ai'
      };
    });

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
