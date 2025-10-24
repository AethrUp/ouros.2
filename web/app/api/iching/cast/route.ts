import { NextRequest, NextResponse } from 'next/server';
import {
  castHexagramWithCoins,
  castHexagramWithYarrowStalks,
} from '@/utils/ichingCasting';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { method } = body;

    if (!method || !['three-coins', 'yarrow-stalks'].includes(method)) {
      return NextResponse.json(
        { success: false, error: 'Invalid casting method' },
        { status: 400 }
      );
    }

    console.log(`🎲 Casting hexagram using ${method} method...`);

    let result;

    if (method === 'three-coins') {
      result = await castHexagramWithCoins();
    } else if (method === 'yarrow-stalks') {
      result = await castHexagramWithYarrowStalks();
    } else {
      throw new Error(`Unknown casting method: ${method}`);
    }

    console.log(
      `✨ Cast Hexagram ${result.primaryHexagram.hexagram.number}: ${result.primaryHexagram.hexagram.englishName}`
    );

    if (result.relatingHexagram) {
      console.log(
        `   → Relating Hexagram ${result.relatingHexagram.hexagram.number}: ${result.relatingHexagram.hexagram.englishName}`
      );
    }

    return NextResponse.json({
      success: true,
      primaryHexagram: result.primaryHexagram,
      relatingHexagram: result.relatingHexagram,
    });
  } catch (error: any) {
    console.error('❌ Failed to cast hexagram:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to cast hexagram' },
      { status: 500 }
    );
  }
}
