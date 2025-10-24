import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

function constructTarotPrompt({
  intention,
  cards,
  context,
  style,
  detailLevel
}: any): string {
  let prompt = `You are an expert tarot reader with deep knowledge of symbolism, archetypes, and divination. Provide an insightful interpretation of this tarot reading.\n\n`;

  prompt += `INTENTION/QUESTION:\n${intention || 'General guidance'}\n\n`;

  prompt += `CARDS DRAWN:\n`;
  cards.forEach((drawnCard: any, index: number) => {
    prompt += `${index + 1}. ${drawnCard.card.name} (${drawnCard.orientation}) - Position: ${drawnCard.position}\n`;
    prompt += `   Position Meaning: ${drawnCard.positionMeaning}\n`;
  });
  prompt += `\n`;

  // Add personalization
  if (context.birthData?.sun) {
    prompt += `QUERENT'S ASTROLOGICAL CONTEXT:\n`;
    prompt += `Sun Sign: ${context.birthData.sun.sign.name}\n`;
    if (context.birthData.moon) {
      prompt += `Moon Sign: ${context.birthData.moon.sign.name}\n`;
    }
    prompt += `\n`;
  }

  // Style guidance
  if (style === 'mystical') {
    prompt += `INTERPRETATION STYLE: Use a mystical and spiritual approach, exploring esoteric symbolism and divine messages.\n\n`;
  } else if (style === 'psychological') {
    prompt += `INTERPRETATION STYLE: Use a psychological approach, exploring the cards as mirrors of the inner self and unconscious patterns.\n\n`;
  } else if (style === 'practical') {
    prompt += `INTERPRETATION STYLE: Use a practical approach, focusing on actionable insights and real-world applications.\n\n`;
  }

  prompt += `DETAIL LEVEL: ${detailLevel}\n\n`;

  prompt += `Please provide a comprehensive reading that includes:\n`;
  prompt += `1. Overview of the reading\n`;
  prompt += `2. Interpretation of each card in its position\n`;
  prompt += `3. How the cards relate to each other\n`;
  prompt += `4. Guidance and advice based on the reading\n`;
  prompt += `5. A key insight or message\n\n`;

  prompt += `Write in a warm, insightful tone that honors both the mystery of the tarot and the practical needs of the querent.`;

  return prompt;
}
