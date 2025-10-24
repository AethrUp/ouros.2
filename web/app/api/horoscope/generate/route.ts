import { NextRequest, NextResponse } from 'next/server';
import { generateDailyHoroscope } from '@/handlers/horoscopeGeneration';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { natalChart, userProfile, options } = body;

    if (!natalChart || !userProfile) {
      return NextResponse.json(
        { success: false, error: 'Missing required data: natalChart and userProfile' },
        { status: 400 }
      );
    }

    console.log('🔮 Horoscope generation API called');

    // Generate horoscope
    const result = await generateDailyHoroscope(natalChart, userProfile, options || {});

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to generate horoscope' },
        { status: 500 }
      );
    }

    console.log('✅ Horoscope generated successfully');

    return NextResponse.json({
      success: true,
      horoscope: result.horoscope,
      metadata: result.metadata,
      fromCache: result.fromCache,
    });

  } catch (error: any) {
    console.error('❌ Horoscope generation API failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate horoscope' },
      { status: 500 }
    );
  }
}
