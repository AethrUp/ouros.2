import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { intention, spread, drawnCards, interpretation } = body;

    if (!spread || !drawnCards || !interpretation) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
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

    const { data, error } = await supabase
      .from('tarot_readings')
      .insert({
        user_id: user.id,
        intention,
        spread_id: spread.id,
        spread_name: spread.name,
        drawn_cards: drawnCards,
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
        intention: data.intention,
        spreadId: data.spread_id,
        spreadName: data.spread_name,
        drawnCards: data.drawn_cards,
        interpretation: data.interpretation,
        createdAt: data.created_at,
      },
    });
  } catch (error: any) {
    console.error('❌ Failed to save tarot reading:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save reading' },
      { status: 500 }
    );
  }
}
