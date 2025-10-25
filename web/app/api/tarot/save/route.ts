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

    const { data, error} = await supabase
      .from('readings')
      .insert({
        user_id: user.id,
        reading_type: 'tarot',
        timestamp: new Date().toISOString(),
        intention,
        interpretation,
        metadata: {
          spread_id: spread.id,
          spread_name: spread.name,
          cards: drawnCards,
          interpretation_source: 'ai'
        }
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      reading: {
        id: data.id,
        userId: data.user_id,
        createdAt: data.timestamp,
        intention: data.intention,
        spread: {
          id: data.metadata.spread_id,
          name: data.metadata.spread_name,
        },
        cards: data.metadata.cards,
        interpretation: data.interpretation,
        interpretationSource: 'ai',
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
