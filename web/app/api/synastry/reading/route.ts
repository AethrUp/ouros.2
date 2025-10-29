import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { checkCachedSynastryReading, cacheSynastryReading } from '@/handlers/synastryReading';
import {
  checkFeatureAccess,
  checkSaveChartLimit,
  incrementUsage,
  createRateLimitResponse,
  createTierRestrictionResponse,
} from '@/lib/usageEnforcement';

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
      savedChartId,
      relationshipContext,
      detailLevel = 'detailed',
    } = body;

    if (!synastryChart || !person1Chart || !person2Chart || !person1Name || !person2Name) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    if (!connectionId && !savedChartId) {
      return NextResponse.json(
        { success: false, error: 'Either connectionId or savedChartId is required' },
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

    // ====================================================================
    // USAGE ENFORCEMENT: Check if user can use synastry feature
    // CRITICAL: Free tier has 0 access to synastry - must be premium or pro
    // Premium tier has limit of 3 saved charts, Pro is unlimited
    // ====================================================================
    console.log('🔒 Checking synastry access for user:', user.id);
    const accessCheck = await checkFeatureAccess(user.id, 'synastry', 'daily');

    if (!accessCheck.allowed) {
      console.log('❌ Synastry access denied:', accessCheck.reason);

      if (accessCheck.reason?.includes('not available')) {
        // Feature not available on this tier (FREE users get blocked here)
        return NextResponse.json(
          createTierRestrictionResponse(accessCheck),
          { status: 403 }
        );
      } else {
        // Usage limit exceeded (shouldn't happen for synastry with current limits)
        return NextResponse.json(
          createRateLimitResponse(accessCheck),
          { status: 429 }
        );
      }
    }

    console.log('✅ Synastry access granted for tier:', accessCheck.tier);

    // Check if user can save another synastry chart (limit enforcement)
    // Note: This checks the count BEFORE saving, preventing excess saves
    const saveCheck = await checkSaveChartLimit(user.id, 'synastry');
    if (!saveCheck.allowed) {
      console.log('❌ Synastry chart save limit reached:', saveCheck.reason);
      return NextResponse.json(
        {
          success: false,
          error: saveCheck.reason,
          tier: saveCheck.tier,
          currentUsage: saveCheck.currentUsage,
          limit: saveCheck.limit,
          upgradeRequired: saveCheck.tier !== 'pro',
        },
        { status: 429 }
      );
    }

    console.log('✅ Synastry save allowed:', {
      tier: saveCheck.tier,
      current: saveCheck.currentUsage,
      limit: saveCheck.limit,
    });

    // Check cache first to avoid unnecessary API calls
    console.log('🔍 Checking for cached reading...');
    const cachedReading = await checkCachedSynastryReading(
      synastryChart.id,
      relationshipContext,
      connectionId,
      savedChartId,
      168 // 7 days cache
    );

    if (cachedReading) {
      console.log('✅ Returning cached reading');
      return NextResponse.json({
        success: true,
        reading: {
          ...cachedReading,
          synastryChart, // Add the chart data to the response
        },
        message: 'Synastry reading retrieved from cache',
        fromCache: true,
      });
    }

    console.log('💨 No cache hit, generating new reading...');

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
      connectionId: connectionId || undefined,
      savedChartId: savedChartId || undefined,
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

    // ====================================================================
    // USAGE ENFORCEMENT: Increment synastry usage after successful generation
    // Note: Synastry doesn't have daily usage limits in current tier config,
    // but we track it for analytics and potential future limits
    // ====================================================================
    console.log('📈 Incrementing synastry usage counter for user:', user.id);
    const incrementResult = await incrementUsage(user.id, 'synastry', 'daily');

    if (!incrementResult.success) {
      console.error('⚠️ Failed to increment usage counter:', incrementResult.error);
      // Don't fail the request, but log the error for monitoring
    } else {
      console.log('✅ Usage counter incremented successfully');
    }

    // Cache the reading asynchronously (don't wait for it)
    cacheSynastryReading(reading).catch((error) => {
      console.error('⚠️ Failed to cache reading (non-critical):', error);
    });

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
