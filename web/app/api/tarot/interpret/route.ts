import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { DrawnCard, CardInsight } from '@/types/tarot';
import {
  constructTarotPrompt,
  constructOverviewPrompt,
  constructCardPrompt,
  constructMetaPrompt,
  constructStaticInterpretation,
  validateTarotResponse
} from '@/lib/tarotPromptTemplate';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { intention, drawnCards, style = 'psychological', detailLevel = 'detailed' } = body;

    if (!drawnCards || drawnCards.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No cards provided' },
        { status: 400 }
      );
    }

    console.log('🔮 Generating tarot interpretation...');

    // Get user context
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    let birthData = null;
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('birth_data')
        .eq('id', user.id)
        .single();
      birthData = profile?.birth_data;
    }

    // Build context
    const context = {
      birthData: birthData || undefined,
      currentDate: new Date().toISOString()
    };

    // Construct prompt
    const prompt = constructTarotPrompt({
      intention,
      cards: drawnCards,
      context,
      style,
      detailLevel
    });

    console.log('📡 Calling Anthropic API...');

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
      throw new Error('Empty response from AI');
    }

    console.log('✅ Tarot interpretation generated successfully');
    console.log('📊 Token usage:', {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
      total: response.usage.input_tokens + response.usage.output_tokens,
    });

    return NextResponse.json({
      success: true,
      interpretation: interpretationText,
    });
  } catch (error: any) {
    console.error('❌ Tarot interpretation failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate interpretation' },
      { status: 500 }
    );
  }
}

/**
 * Helper: Parse and clean JSON response from AI
 */
function parseAIResponse(text: string): any {
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
}
