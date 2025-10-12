/**
 * Synastry Reading Handler
 * Generates AI-powered synastry readings using Anthropic Claude API
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  SynastryChart,
  SynastryReading,
  GenerateSynastryReadingResponse,
} from '../types/synastry';
import { NatalChartData } from '../types/user';
import { createSynastryPrompt, validateSynastryResponse } from '../utils/synastryPromptTemplate';

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
 * TODO: Implement caching logic with Supabase
 */
export const checkCachedSynastryReading = async (
  synastryChartId: string,
  focusArea: string
): Promise<SynastryReading | null> => {
  try {
    // TODO: Query Supabase for cached reading
    // For now, return null (no cache)
    return null;
  } catch (error) {
    console.error('Error checking cache:', error);
    return null;
  }
};

/**
 * Save reading to cache
 * TODO: Implement with Supabase
 */
export const cacheSynastryReading = async (reading: SynastryReading): Promise<void> => {
  try {
    // TODO: Save to Supabase synastry_readings table
    console.log('TODO: Cache synastry reading', reading.id);
  } catch (error) {
    console.error('Error caching reading:', error);
  }
};
