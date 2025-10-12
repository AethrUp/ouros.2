/**
 * Horoscope Reading Handlers
 * Handles saving horoscope readings to the unified readings table for journal linking
 */

import { supabase } from '../utils/supabase';
import { DailyHoroscope } from '../types/reading';
import { useAppStore } from '../store';

interface SaveHoroscopeReadingData {
  horoscope: DailyHoroscope;
  horoscopeDbId?: string; // Optional: ID from daily_horoscopes table
  prompt?: string; // Optional: Specific journal prompt being linked
}

interface SaveHoroscopeReadingResult {
  id: string;
}

/**
 * Save horoscope reading to the unified readings table
 * This allows journal entries to properly link to horoscope readings
 */
export const saveHoroscopeReading = async (
  data: SaveHoroscopeReadingData
): Promise<SaveHoroscopeReadingResult> => {
  const store = useAppStore.getState();
  const userId = store.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  console.log('💾 Saving horoscope reading to readings table...');

  try {
    // Prepare interpretation text
    const interpretation =
      data.horoscope.fullContent?.fullReading?.introduction ||
      data.horoscope.preview?.summary ||
      data.horoscope.content?.summary ||
      'Your personalized daily horoscope';

    // Prepare metadata
    const metadata = {
      horoscope_date: data.horoscope.date,
      horoscope_db_id: data.horoscopeDbId,
      prompt: data.prompt,
      title: data.horoscope.preview?.title || data.horoscope.content?.title,
      hasTransits: !!data.horoscope.fullContent?.transitAnalysis,
      hasSpiritual: !!data.horoscope.fullContent?.spiritualGuidance,
      prompts: data.horoscope.fullContent?.spiritualGuidance?.journalPrompts || [],
    };

    // Save to readings table
    const { data: savedReading, error } = await supabase
      .from('readings')
      .insert({
        user_id: userId,
        reading_type: 'horoscope',
        timestamp: new Date().toISOString(),
        intention: data.prompt || `Daily Horoscope - ${data.horoscope.date}`,
        interpretation: interpretation,
        metadata: metadata,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save horoscope reading:', error);
      throw error;
    }

    console.log('✅ Horoscope reading saved successfully');

    return {
      id: savedReading.id,
    };
  } catch (error) {
    console.error('Error saving horoscope reading:', error);
    throw error;
  }
};

/**
 * Load horoscope readings from the unified readings table
 */
export const loadHoroscopeReadings = async (): Promise<any[]> => {
  const store = useAppStore.getState();
  const userId = store.user?.id;

  if (!userId) {
    console.warn('User not authenticated, returning empty history');
    return [];
  }

  console.log('📚 Loading horoscope readings history...');

  try {
    const { data, error } = await supabase
      .from('readings')
      .select('*')
      .eq('user_id', userId)
      .eq('reading_type', 'horoscope')
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Failed to load horoscope readings:', error);
      throw error;
    }

    console.log(`✅ Loaded ${data?.length || 0} horoscope readings`);

    return data || [];
  } catch (error) {
    console.error('Failed to load horoscope readings:', error);
    return [];
  }
};
