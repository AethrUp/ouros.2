import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const MODEL = 'claude-sonnet-4-20250514';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      synastryChartId,
      synastryChart,
      person1Chart,
      person2Chart,
      person1Name,
      person2Name,
      connectionId,
      forceRegenerate = false,
      focusArea = 'general',
    } = body;

    if (!synastryChartId || !synastryChart) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    console.log('🌟 Generating daily synastry forecast...');

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

    const today = getTodayDate();

    // Check for cached forecast
    if (!forceRegenerate) {
      const { data: cachedData } = await supabase
        .from('daily_synastry_forecasts')
        .select('*')
        .eq('synastry_chart_id', synastryChartId)
        .eq('date', today)
        .single();

      if (cachedData) {
        console.log('✅ Returning cached forecast');
        return NextResponse.json({
          success: true,
          forecast: transformCachedForecast(cachedData),
          fromCache: true,
        });
      }
    }

    // Generate new forecast
    const prompt = createDailySynastryForecastPrompt(
      synastryChart,
      person1Name,
      person2Name,
      focusArea
    );

    console.log('📡 Calling Anthropic API...');

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2000,
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

    console.log('✅ Forecast generated successfully');

    // Parse the structured response
    const forecast = parseForecastResponse(interpretation, synastryChartId, connectionId, today);

    // Save to database
    await supabase.from('daily_synastry_forecasts').insert({
      synastry_chart_id: synastryChartId,
      connection_id: connectionId,
      date: today,
      full_content_v2: forecast.fullContent,
      format_version: 'v2',
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      forecast,
      fromCache: false,
    });
  } catch (error: any) {
    console.error('❌ Failed to generate daily synastry forecast:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate forecast',
      },
      { status: 500 }
    );
  }
}

function getTodayDate(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function createDailySynastryForecastPrompt(
  synastryChart: any,
  person1Name: string,
  person2Name: string,
  focusArea: string
): string {
  let prompt = `Create a daily relationship forecast for ${person1Name} and ${person2Name}.\n\n`;

  prompt += `FOCUS AREA: ${focusArea}\n`;
  prompt += `COMPATIBILITY SCORE: ${synastryChart.compatibilityScore}/100\n\n`;

  prompt += `Provide a forecast structured as follows:\n`;
  prompt += `1. MORNING (6am-12pm): What energies are present, what to focus on\n`;
  prompt += `2. AFTERNOON (12pm-6pm): Key dynamics and opportunities\n`;
  prompt += `3. EVENING (6pm-12am): Connection potential and reflection\n`;
  prompt += `4. GUIDANCE: Practical advice for today\n`;
  prompt += `5. CONNECTION PRACTICE: One simple practice to strengthen the bond\n\n`;

  prompt += `Write warmly and practically. Focus on actionable insights.`;

  return prompt;
}

function parseForecastResponse(
  interpretation: string,
  synastryChartId: string,
  connectionId: string,
  date: string
): any {
  // Simple parsing - you may want to make this more sophisticated
  return {
    id: `forecast_${Date.now()}`,
    synastryChartId,
    connectionId,
    date,
    fullContent: {
      interpretation,
    },
    summary: interpretation.substring(0, 200) + '...',
    createdAt: new Date().toISOString(),
  };
}

function transformCachedForecast(data: any): any {
  return {
    id: data.id,
    synastryChartId: data.synastry_chart_id,
    connectionId: data.connection_id,
    date: data.date,
    fullContent: data.full_content_v2,
    summary: data.full_content_v2?.interpretation?.substring(0, 200) + '...',
    createdAt: data.created_at,
  };
}
