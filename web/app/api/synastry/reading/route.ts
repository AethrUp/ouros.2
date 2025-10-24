import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const MODEL = 'claude-sonnet-4-20250514';
const PROMPT_VERSION = '1.0';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      synastryChart,
      person1Chart,
      person2Chart,
      person1Name,
      person2Name,
      connectionId,
      relationshipContext,
      detailLevel = 'detailed',
    } = body;

    if (!synastryChart || !person1Chart || !person2Chart || !person1Name || !person2Name) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    console.log('🌟 Generating synastry reading...');
    console.log(`👥 ${person1Name} & ${person2Name}`);
    console.log(`💫 Relationship: ${relationshipContext || 'general'}, Detail: ${detailLevel}`);

    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API key not configured');
    }

    // Get Supabase client for auth
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

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Create prompt (simplified version - you may need to import the full prompt template)
    const prompt = createSimplifiedSynastryPrompt(
      synastryChart,
      person1Chart,
      person2Chart,
      person1Name,
      person2Name,
      relationshipContext,
      detailLevel
    );

    console.log('📝 Sending request to Claude API...');

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

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude API');
    }

    const interpretation = content.text;

    console.log(`✅ Received interpretation (${interpretation.length} characters)`);

    const reading = {
      id: `synastry_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      synastryChartId: synastryChart.id,
      connectionId,
      interpretation,
      relationshipContext,
      aiGenerated: true,
      model: MODEL,
      promptVersion: PROMPT_VERSION,
      savedByUserId: user.id,
      createdAt: new Date().toISOString(),
      synastryChart,
    };

    console.log('✅ Synastry reading generated successfully');

    return NextResponse.json({
      success: true,
      reading,
      message: 'Synastry reading generated successfully',
      fromCache: false,
    });
  } catch (error: any) {
    console.error('❌ Failed to generate synastry reading:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to generate synastry reading',
      },
      { status: 500 }
    );
  }
}

function createSimplifiedSynastryPrompt(
  synastryChart: any,
  person1Chart: any,
  person2Chart: any,
  person1Name: string,
  person2Name: string,
  relationshipContext?: string,
  detailLevel: string = 'detailed'
): string {
  let prompt = `You are an expert relationship astrologer. Create a comprehensive synastry reading for ${person1Name} and ${person2Name}.\n\n`;

  prompt += `RELATIONSHIP CONTEXT: ${relationshipContext || 'General compatibility'}\n\n`;

  prompt += `COMPATIBILITY SCORE: ${synastryChart.compatibilityScore}/100\n\n`;

  if (synastryChart.strengths?.length > 0) {
    prompt += `STRENGTHS:\n${synastryChart.strengths.map((s: string) => `- ${s}`).join('\n')}\n\n`;
  }

  if (synastryChart.challenges?.length > 0) {
    prompt += `CHALLENGES:\n${synastryChart.challenges.map((c: string) => `- ${c}`).join('\n')}\n\n`;
  }

  if (synastryChart.aspects?.length > 0) {
    prompt += `KEY ASPECTS:\n`;
    synastryChart.aspects.slice(0, 10).forEach((aspect: any) => {
      prompt += `- ${aspect.planet1} ${aspect.aspect} ${aspect.planet2} (${aspect.orb.toFixed(1)}°)\n`;
    });
    prompt += `\n`;
  }

  prompt += `DETAIL LEVEL: ${detailLevel}\n\n`;

  prompt += `Please provide a warm, insightful synastry reading that covers:\n`;
  prompt += `1. Overall Compatibility Overview\n`;
  prompt += `2. Emotional Connection (Moon aspects)\n`;
  prompt += `3. Communication Style (Mercury aspects)\n`;
  prompt += `4. Love & Attraction (Venus/Mars aspects)\n`;
  prompt += `5. Long-term Potential\n`;
  prompt += `6. Areas for Growth\n\n`;

  prompt += `Write in a supportive, professional tone. Be specific about the astrological factors while keeping the language accessible.`;

  return prompt;
}
