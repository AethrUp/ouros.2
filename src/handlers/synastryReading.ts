/**
 * Synastry Reading Handler
 * Generates AI-powered synastry readings using Anthropic Claude API
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import {
  SynastryChart,
  SynastryReading,
  GenerateSynastryReadingResponse,
} from '../types/synastry';
import { NatalChartData } from '../types/user';
import { createSynastryPrompt, validateSynastryResponse } from '../utils/synastryPromptTemplate';

// Initialize Supabase client for server-side operations
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '',
});

const MODEL = 'claude-sonnet-4-20250514';
const PROMPT_VERSION = '1.0';

/**
 * Generate synastry reading using AI
 */
export const generateSynastryReading = async (
  synastryChart: SynastryChart,
  person1Chart: NatalChartData,
  person2Chart: NatalChartData,
  person1Name: string,
  person2Name: string,
  connectionId: string,
  relationshipContext?: string,
  detailLevel: 'brief' | 'detailed' | 'comprehensive' = 'detailed'
): Promise<GenerateSynastryReadingResponse> => {
  try {
    console.log('🌟 Generating synastry reading...');
    console.log(`👥 ${person1Name} & ${person2Name}`);
    console.log(`💫 Relationship: ${relationshipContext || 'general'}, Detail: ${detailLevel}`);

    // Check if API key is configured
    if (!process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API key not configured');
    }

    // Create prompt
    const prompt = createSynastryPrompt(
      synastryChart,
      person1Chart,
      person2Chart,
      person1Name,
      person2Name,
      relationshipContext,
      detailLevel
    );

    console.log('📝 Sending request to Claude API...');

    // Call Claude API
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: detailLevel === 'comprehensive' ? 4000 : detailLevel === 'detailed' ? 2000 : 1000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract text from response
    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude API');
    }

    const interpretation = content.text;

    console.log(`✅ Received interpretation (${interpretation.length} characters)`);

    // Validate response
    const validation = validateSynastryResponse(interpretation);
    if (!validation.valid) {
      console.warn('⚠️ Validation warnings:', validation.errors);
    }

    // Create reading object
    const reading: SynastryReading = {
      id: `synastry_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      synastryChartId: synastryChart.id,
      connectionId,
      interpretation,
      relationshipContext,
      aiGenerated: true,
      model: MODEL,
      promptVersion: PROMPT_VERSION,
      savedByUserId: '', // Will be set by the caller
      createdAt: new Date().toISOString(),
      synastryChart,
    };

    console.log('✅ Synastry reading generated successfully');

    return {
      success: true,
      reading,
      message: 'Synastry reading generated successfully',
      fromCache: false,
    };
  } catch (error: any) {
    console.error('❌ Failed to generate synastry reading:', error);

    return {
      success: false,
      message: error.message || 'Failed to generate synastry reading',
    };
  }
};

/**
 * Generate quick compatibility summary (for previews)
 */
export const generateCompatibilitySummary = async (
  synastryChart: SynastryChart,
  person1Name: string,
  person2Name: string
): Promise<string> => {
  try {
    if (!process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY) {
      // Fallback to generated summary
      return generateFallbackSummary(synastryChart, person1Name, person2Name);
    }

    const prompt = `Create a 2-3 sentence compatibility summary for ${person1Name} and ${person2Name}.
Score: ${synastryChart.compatibilityScore}/100
Strengths: ${synastryChart.strengths.slice(0, 2).join(', ')}
Challenges: ${synastryChart.challenges[0] || 'None noted'}

Write warmly and specifically. Use plain language.`;

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 200,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      return content.text;
    }

    return generateFallbackSummary(synastryChart, person1Name, person2Name);
  } catch (error) {
    console.error('Failed to generate compatibility summary:', error);
    return generateFallbackSummary(synastryChart, person1Name, person2Name);
  }
};

/**
 * Fallback summary when AI is unavailable
 */
function generateFallbackSummary(
  synastryChart: SynastryChart,
  person1Name: string,
  person2Name: string
): string {
  const score = synastryChart.compatibilityScore || 0;
  let rating = 'good';

  if (score >= 80) rating = 'excellent';
  else if (score >= 60) rating = 'strong';
  else if (score < 40) rating = 'complex';

  return `${person1Name} and ${person2Name} have a ${rating} compatibility (${score}/100). ${synastryChart.strengths[0] || 'Their connection shows interesting dynamics.'} ${synastryChart.challenges[0] ? `Areas for growth include ${synastryChart.challenges[0].toLowerCase()}.` : 'Their relationship has potential for mutual growth.'}`;
}

/**
 * Check for cached reading
 * Queries Supabase for existing synastry readings matching the chart and context
 */
export const checkCachedSynastryReading = async (
  synastryChartId: string,
  relationshipContext?: string,
  connectionId?: string,
  savedChartId?: string,
  maxAgeHours: number = 168 // Default: 7 days
): Promise<SynastryReading | null> => {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('Supabase not configured, skipping cache check');
      return null;
    }

    console.log('🔍 Checking cache for synastry reading...', {
      synastryChartId,
      relationshipContext,
      connectionId,
      savedChartId,
    });

    // Calculate the cutoff time for cache validity
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - maxAgeHours);

    // Build the query
    let query = supabase
      .from('synastry_readings')
      .select('*')
      .eq('synastry_chart_id', synastryChartId)
      .gte('created_at', cutoffTime.toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    // Add relationship context filter if provided
    if (relationshipContext) {
      query = query.eq('relationship_context', relationshipContext);
    }

    // Add connection or saved chart filter
    if (connectionId) {
      query = query.eq('connection_id', connectionId);
    } else if (savedChartId) {
      query = query.eq('saved_chart_id', savedChartId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error querying cache:', error);
      return null;
    }

    if (!data || data.length === 0) {
      console.log('💨 No cached reading found');
      return null;
    }

    const cachedReading = data[0];
    console.log('✅ Found cached reading:', {
      id: cachedReading.id,
      age: Math.round((Date.now() - new Date(cachedReading.created_at).getTime()) / 1000 / 60 / 60) + ' hours',
    });

    // Transform database row to SynastryReading type
    return {
      id: cachedReading.id,
      synastryChartId: cachedReading.synastry_chart_id,
      connectionId: cachedReading.connection_id,
      savedChartId: cachedReading.saved_chart_id,
      interpretation: cachedReading.interpretation,
      relationshipContext: cachedReading.relationship_context,
      aiGenerated: cachedReading.ai_generated,
      model: cachedReading.model,
      promptVersion: cachedReading.prompt_version,
      savedByUserId: cachedReading.saved_by_user_id,
      createdAt: cachedReading.created_at,
    };
  } catch (error) {
    console.error('❌ Error checking cache:', error);
    return null;
  }
};

/**
 * Save reading to cache
 * Stores the synastry reading in Supabase for future retrieval
 */
export const cacheSynastryReading = async (reading: SynastryReading): Promise<boolean> => {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('Supabase not configured, skipping cache save');
      return false;
    }

    console.log('💾 Caching synastry reading...', {
      id: reading.id,
      synastryChartId: reading.synastryChartId,
      connectionId: reading.connectionId,
      savedChartId: reading.savedChartId,
    });

    // Prepare the data for insertion
    const dataToInsert = {
      id: reading.id,
      synastry_chart_id: reading.synastryChartId,
      connection_id: reading.connectionId || null,
      saved_chart_id: reading.savedChartId || null,
      interpretation: reading.interpretation,
      relationship_context: reading.relationshipContext || null,
      ai_generated: reading.aiGenerated,
      model: reading.model || null,
      prompt_version: reading.promptVersion || null,
      saved_by_user_id: reading.savedByUserId,
      created_at: reading.createdAt,
    };

    // Insert into Supabase
    const { data, error } = await supabase
      .from('synastry_readings')
      .insert(dataToInsert)
      .select()
      .single();

    if (error) {
      console.error('❌ Error caching reading:', error);
      // Log the error but don't throw - caching is non-critical
      return false;
    }

    console.log('✅ Successfully cached reading:', data.id);
    return true;
  } catch (error) {
    console.error('❌ Error caching reading:', error);
    // Don't throw - caching failure shouldn't break the main flow
    return false;
  }
};
