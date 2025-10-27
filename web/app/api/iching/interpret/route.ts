import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { constructIChingPromptV2, validateIChingInterpretationV2JSON } from '@/utils/ichingPromptTemplateV2';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, primaryHexagram, relatingHexagram, style = 'psychological', detailLevel = 'detailed' } = body;

    if (!primaryHexagram) {
      return NextResponse.json(
        { success: false, error: 'Primary hexagram is required' },
        { status: 400 }
      );
    }

    console.log('☯️ Generating I Ching interpretation...');

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

    // Map detail level
    const mappedDetailLevel = detailLevel === 'brief' ? 'concise' : detailLevel;

    // Construct prompt
    const prompt = constructIChingPromptV2({
      question,
      primaryHexagram,
      relatingHexagram,
      context,
      style,
      detailLevel: mappedDetailLevel,
    });

    console.log('📡 Calling Anthropic API with V2 prompt...');

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText =
      response.content[0]?.type === 'text' ? response.content[0].text : '';

    if (!responseText) {
      throw new Error('Empty response from AI');
    }

    // Parse JSON response
    let interpretationData;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : responseText;
      interpretationData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      throw new Error('Invalid JSON in AI response');
    }

    // Validate JSON structure
    const validation = validateIChingInterpretationV2JSON(interpretationData);
    if (!validation.valid) {
      console.warn('⚠️ Interpretation validation warnings:', validation.errors);
    }

    console.log('✅ I Ching interpretation generated successfully');
    console.log('📊 Token usage:', {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
      total: response.usage.input_tokens + response.usage.output_tokens,
    });
    console.log('🔍 API - interpretationData keys:', Object.keys(interpretationData));
    console.log('🔍 API - interpretationData structure:', JSON.stringify(interpretationData, null, 2));

    return NextResponse.json({
      success: true,
      interpretation: interpretationData,
    });
  } catch (error: any) {
    console.error('❌ I Ching interpretation failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate interpretation' },
      { status: 500 }
    );
  }
}
