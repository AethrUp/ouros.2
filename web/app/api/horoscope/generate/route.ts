import { NextRequest, NextResponse } from 'next/server';
import { getDailyHoroscope } from '@/handlers/horoscopeGeneration';
import { createClient } from '@/lib/supabase/server';
import { getUserTier } from '@/lib/usageEnforcement';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { natalChart, userProfile, cachedHoroscope, options } = body;

    if (!natalChart || !userProfile) {
      return NextResponse.json(
        { success: false, error: 'Missing required data: natalChart and userProfile' },
        { status: 400 }
      );
    }

    console.log('🔮 Horoscope API called - checking cache and database first');

    // Create server-side Supabase client with authenticated session
    const supabase = await createClient();

    // ====================================================================
    // USAGE ENFORCEMENT: Verify user authentication and subscription
    // Note: Daily horoscope is available to all tiers (free, premium, pro)
    // Enhanced horoscope features are tier-restricted on the client side
    // No daily usage limits on horoscopes currently
    // ====================================================================
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('🔒 Verifying horoscope access for user:', user.id);
    const tier = await getUserTier(user.id);

    if (!tier) {
      return NextResponse.json(
        { success: false, error: 'Unable to verify subscription status' },
        { status: 500 }
      );
    }

    console.log('✅ Horoscope access granted for tier:', tier);

    // Get daily horoscope (checks cache, then Supabase, then generates if needed)
    const result = await getDailyHoroscope(
      natalChart,
      userProfile,
      supabase,
      cachedHoroscope || null,
      options || {}
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to get horoscope' },
        { status: 500 }
      );
    }

    console.log(result.fromCache ? '✅ Horoscope loaded from cache/database' : '✅ Horoscope generated successfully');

    return NextResponse.json({
      success: true,
      horoscope: result.horoscope,
      metadata: result.metadata,
      fromCache: result.fromCache,
    });

  } catch (error: any) {
    console.error('❌ Horoscope API failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get horoscope' },
      { status: 500 }
    );
  }
}
