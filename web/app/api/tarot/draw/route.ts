import { NextRequest, NextResponse } from 'next/server';
import { getQuantumRandom } from '@/lib/quantumRandom';
import { TAROT_DECK } from '@/data/tarot/tarotCards';
import { SpreadLayout, DrawnCard } from '@/types/tarot';

export async function POST(request: NextRequest) {
  try {
    const { spread }: { spread: SpreadLayout } = await request.json();

    if (!spread || !spread.positions || spread.positions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid spread configuration' },
        { status: 400 }
      );
    }

    console.log(`🎴 Drawing ${spread.cardCount} cards for ${spread.name} spread...`);

    // Request twice as many random numbers:
    // - First set for card selection
    // - Second set for orientation (upright/reversed)
    const randomNumbers = await getQuantumRandom(spread.cardCount * 2);

    const drawnCards: DrawnCard[] = [];
    const usedIndices = new Set<number>();

    spread.positions.forEach((position, idx) => {
      // Select unique card index
      let cardIndex = randomNumbers[idx] % TAROT_DECK.length;

      // Ensure no duplicates in this spread
      while (usedIndices.has(cardIndex)) {
        cardIndex = (cardIndex + 1) % TAROT_DECK.length;
      }
      usedIndices.add(cardIndex);

      // Determine orientation (upright or reversed)
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

    console.log(`✨ Drew ${drawnCards.length} cards successfully`);

    return NextResponse.json({
      success: true,
      drawnCards,
      metadata: {
        spreadId: spread.id,
        spreadName: spread.name,
        cardCount: drawnCards.length,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('❌ Failed to draw cards:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to draw cards'
      },
      { status: 500 }
    );
  }
}
