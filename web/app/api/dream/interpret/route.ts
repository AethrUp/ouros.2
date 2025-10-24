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
    const { dreamDescription, style, detailLevel } = body;

    if (!dreamDescription?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Dream description is required' },
        { status: 400 }
      );
    }

    console.log('💭 Generating dream interpretation...');

    // Get user context from Supabase
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

    // Get user's birth data if available
    let birthData = null;
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('birth_data')
        .eq('id', user.id)
        .single();
      birthData = profile?.birth_data;
    }

    // Construct prompt
    const prompt = constructDreamPrompt({
      dreamDescription,
      birthData,
      style: style || 'psychological',
      detailLevel: detailLevel || 'detailed',
    });

    console.log('📡 Calling Anthropic API...');

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

    return NextResponse.json({
      success: true,
      interpretation,
    });
  } catch (error: any) {
    console.error('❌ Dream interpretation failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate interpretation' },
      { status: 500 }
    );
  }
}

function constructDreamPrompt({
  dreamDescription,
  birthData,
  style,
  detailLevel,
}: {
  dreamDescription: string;
  birthData: any;
  style: string;
  detailLevel: string;
}): string {
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
