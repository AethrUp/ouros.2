import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserTier } from '@/lib/usageEnforcement';
import { TIER_FEATURES } from '@/types/subscription';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dreamDescription, interpretation } = body;

    if (!dreamDescription || !interpretation) {
      return NextResponse.json(
        { success: false, error: 'Dream description and interpretation are required' },
        { status: 400 }
      );
    }

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
    // USAGE ENFORCEMENT: Verify user has access to dream interpretation
    // CRITICAL: Free tier should not be able to save dreams (they can't generate them)
    // ====================================================================
    console.log('💾 Saving dream reading for user:', user.id);
    const tier = await getUserTier(user.id);

    if (!tier) {
      return NextResponse.json(
        { success: false, error: 'Unable to verify subscription status' },
        { status: 500 }
      );
    }

    // Verify user has dream interpretation feature access
    const hasDreamAccess = TIER_FEATURES[tier].dreamInterpretation;
    if (!hasDreamAccess) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dream interpretation is not available on your current plan',
          tier,
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from('dream_readings')
      .insert({
        user_id: user.id,
        dream_description: dreamDescription,
        interpretation,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      reading: {
        id: data.id,
        userId: data.user_id,
        dreamDescription: data.dream_description,
        interpretation: data.interpretation,
        createdAt: data.created_at,
      },
    });
  } catch (error: any) {
    console.error('❌ Failed to save dream reading:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save dream reading' },
      { status: 500 }
    );
  }
}
