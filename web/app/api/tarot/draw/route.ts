import { NextRequest, NextResponse } from 'next/server';
import { getQuantumRandom } from '@/utils/quantumRandom';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { spread } = body;

    if (!spread || !spread.cardCount || !spread.positions) {
      return NextResponse.json(
        { success: false, error: 'Invalid spread configuration' },
        { status: 400 }
      );
    }

    // Import tarot deck
    let TAROT_DECK;
    try {
      const tarotDeckModule = await import('@/data/tarot/tarotCards');
      TAROT_DECK = tarotDeckModule.TAROT_DECK;
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Tarot card deck not yet configured' },
        { status: 500 }
      );
    }

    // Get quantum random numbers
    const randomNumbers = await getQuantumRandom(spread.cardCount * 2);

    const drawnCards: any[] = [];
    const usedIndices = new Set<number>();

    spread.positions.forEach((position: any, idx: number) => {
      let cardIndex = randomNumbers[idx] % TAROT_DECK.length;

      // Ensure no duplicates
      while (usedIndices.has(cardIndex)) {
        cardIndex = (cardIndex + 1) % TAROT_DECK.length;
      }
      usedIndices.add(cardIndex);

      const orientation = randomNumbers[spread.cardCount + idx] % 2 === 0
        ? 'upright'
        : 'reversed';

      drawnCards.push({
        card: TAROT_DECK[cardIndex],
        position: position.name,
        orientation,
        positionMeaning: position.meaning
      });
    });

    console.log(`✨ Drew ${drawnCards.length} cards for ${spread.name} spread`);

    return NextResponse.json({
      success: true,
      drawnCards,
    });
  } catch (error: any) {
    console.error('❌ Failed to draw tarot cards:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to draw cards' },
      { status: 500 }
    );
  }
}
