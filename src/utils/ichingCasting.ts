/**
 * I Ching Casting Methods
 * Implements traditional methods for casting hexagrams
 */

import { getQuantumRandom } from './quantumRandom';
import { HexagramLine, LineType, CoinToss, CastedHexagram } from '../types/iching';
import { getHexagramByLines } from '../data/iching/hexagrams';

/**
 * Three Coin Method
 * Each coin toss generates one line (repeated 6 times for a complete hexagram)
 *
 * Traditional values:
 * - 3 Heads (3 yang) = 9 = Old Yang (changing yang line) ——×
 * - 2 Heads, 1 Tail = 8 = Young Yin (stable yin line) — —
 * - 2 Tails, 1 Head = 7 = Young Yang (stable yang line) ——
 * - 3 Tails (3 yin) = 6 = Old Yin (changing yin line) —×—
 */

/**
 * Convert random numbers to coin toss result
 * Helper function used by both single and batch casting
 */
const convertRandomNumbersToCoinToss = (randomNumbers: number[]): CoinToss => {
  // Convert to heads (yang/true) or tails (yin/false)
  // true = heads (value 3), false = tails (value 2)
  const coins: [boolean, boolean, boolean] = [
    randomNumbers[0] % 2 === 0,
    randomNumbers[1] % 2 === 0,
    randomNumbers[2] % 2 === 0,
  ];

  // Count heads (yang)
  const headsCount = coins.filter((c) => c).length;

  // Calculate total value and determine line type
  let value: number;
  let lineType: LineType;

  switch (headsCount) {
    case 3:
      // 3 heads = 9 = Old Yang (changing)
      value = 9;
      lineType = 'changing-yang';
      break;
    case 2:
      // 2 heads, 1 tail = 7 = Young Yang (stable)
      value = 7;
      lineType = 'yang';
      break;
    case 1:
      // 1 head, 2 tails = 8 = Young Yin (stable)
      value = 8;
      lineType = 'yin';
      break;
    case 0:
      // 3 tails = 6 = Old Yin (changing)
      value = 6;
      lineType = 'changing-yin';
      break;
    default:
      // Fallback (should never happen)
      value = 7;
      lineType = 'yang';
  }

  return {
    coins,
    lineType,
    value,
  };
};

/**
 * Pre-fetch all 6 coin tosses at once using quantum randomness
 * Returns an array of 6 CoinToss results (one per line)
 * Similar to how tarot drawCards works - fetches all random numbers in one API call
 */
export const preFetchAllCoinTosses = async (): Promise<CoinToss[]> => {
  // Get all 18 random numbers at once (3 coins × 6 lines)
  const randomNumbers = await getQuantumRandom(18);

  const coinTosses: CoinToss[] = [];

  // Convert batches of 3 random numbers to coin tosses
  for (let i = 0; i < 6; i++) {
    const startIdx = i * 3;
    const lineRandomNumbers = randomNumbers.slice(startIdx, startIdx + 3);
    const coinToss = convertRandomNumbersToCoinToss(lineRandomNumbers);
    coinTosses.push(coinToss);
  }

  console.log('✨ Pre-fetched all 6 coin tosses from quantum random API');
  return coinTosses;
};

/**
 * Cast a single line using three coins
 * Returns the coin toss result and derived line type
 */
export const castLineWithCoins = async (): Promise<CoinToss> => {
  // Get 3 random numbers for the 3 coins
  const randomNumbers = await getQuantumRandom(3);
  return convertRandomNumbersToCoinToss(randomNumbers);
};

/**
 * Cast a complete hexagram using the three coin method
 * Returns the primary hexagram and relating hexagram (if there are changing lines)
 */
export const castHexagramWithCoins = async (): Promise<{
  primaryHexagram: CastedHexagram;
  relatingHexagram?: CastedHexagram;
}> => {
  const lines: HexagramLine[] = [];

  // Cast 6 lines (bottom to top)
  for (let position = 1; position <= 6; position++) {
    const coinToss = await castLineWithCoins();

    lines.push({
      position,
      type: coinToss.lineType,
      isChanging:
        coinToss.lineType === 'changing-yang' ||
        coinToss.lineType === 'changing-yin',
    });
  }

  // Build primary hexagram line pattern (true = yang, false = yin)
  const primaryLines: [boolean, boolean, boolean, boolean, boolean, boolean] = [
    lines[0].type === 'yang' || lines[0].type === 'changing-yang',
    lines[1].type === 'yang' || lines[1].type === 'changing-yang',
    lines[2].type === 'yang' || lines[2].type === 'changing-yang',
    lines[3].type === 'yang' || lines[3].type === 'changing-yang',
    lines[4].type === 'yang' || lines[4].type === 'changing-yang',
    lines[5].type === 'yang' || lines[5].type === 'changing-yang',
  ];

  // Find the hexagram
  const hexagram = getHexagramByLines(primaryLines);

  if (!hexagram) {
    console.error('❌ Failed to find hexagram for line pattern:', primaryLines);
    console.error('Line types:', lines.map((l, i) => `Line ${i + 1}: ${l.type}`));
    throw new Error(`Failed to find hexagram for cast lines: [${primaryLines.map(l => l ? 'yang' : 'yin').join(', ')}]`);
  }

  // Identify changing lines
  const changingLines = lines
    .filter((line) => line.isChanging)
    .map((line) => line.position);

  const primaryHexagram: CastedHexagram = {
    hexagram,
    lines,
    changingLines,
  };

  // If there are changing lines, calculate the relating hexagram
  let relatingHexagram: CastedHexagram | undefined;

  if (changingLines.length > 0) {
    // Transform changing lines to their opposite
    const relatingLines: [boolean, boolean, boolean, boolean, boolean, boolean] = [
      lines[0].isChanging ? !primaryLines[0] : primaryLines[0],
      lines[1].isChanging ? !primaryLines[1] : primaryLines[1],
      lines[2].isChanging ? !primaryLines[2] : primaryLines[2],
      lines[3].isChanging ? !primaryLines[3] : primaryLines[3],
      lines[4].isChanging ? !primaryLines[4] : primaryLines[4],
      lines[5].isChanging ? !primaryLines[5] : primaryLines[5],
    ];

    const relatingHex = getHexagramByLines(relatingLines);

    if (relatingHex) {
      // Create stable lines for relating hexagram (no changing lines)
      const stableLines: HexagramLine[] = relatingLines.map((isYang, idx) => ({
        position: idx + 1,
        type: isYang ? 'yang' : 'yin',
        isChanging: false,
      }));

      relatingHexagram = {
        hexagram: relatingHex,
        lines: stableLines,
        changingLines: [],
      };
    }
  }

  return {
    primaryHexagram,
    relatingHexagram,
  };
};

/**
 * Yarrow Stalk Method (Simplified Simulation)
 * This is a simplified version that mimics the statistical distribution
 * of the traditional yarrow stalk method
 *
 * Traditional probabilities:
 * - Old Yang (9): 3/16 (18.75%)
 * - Young Yang (7): 5/16 (31.25%)
 * - Young Yin (8): 7/16 (43.75%)
 * - Old Yin (6): 1/16 (6.25%)
 */
export const castLineWithYarrowStalks = async (): Promise<LineType> => {
  // Get a random number 0-15 (16 possibilities)
  const [randomValue] = await getQuantumRandom(1);
  const value = randomValue % 16;

  // Map to line type based on traditional probabilities
  if (value < 1) {
    // 1/16 = 6.25%
    return 'changing-yin';
  } else if (value < 8) {
    // 7/16 = 43.75%
    return 'yin';
  } else if (value < 13) {
    // 5/16 = 31.25%
    return 'yang';
  } else {
    // 3/16 = 18.75%
    return 'changing-yang';
  }
};

/**
 * Cast a complete hexagram using the yarrow stalk method
 */
export const castHexagramWithYarrowStalks = async (): Promise<{
  primaryHexagram: CastedHexagram;
  relatingHexagram?: CastedHexagram;
}> => {
  const lines: HexagramLine[] = [];

  // Cast 6 lines (bottom to top)
  for (let position = 1; position <= 6; position++) {
    const lineType = await castLineWithYarrowStalks();

    lines.push({
      position,
      type: lineType,
      isChanging: lineType === 'changing-yang' || lineType === 'changing-yin',
    });
  }

  // Build primary hexagram line pattern
  const primaryLines: [boolean, boolean, boolean, boolean, boolean, boolean] = [
    lines[0].type === 'yang' || lines[0].type === 'changing-yang',
    lines[1].type === 'yang' || lines[1].type === 'changing-yang',
    lines[2].type === 'yang' || lines[2].type === 'changing-yang',
    lines[3].type === 'yang' || lines[3].type === 'changing-yang',
    lines[4].type === 'yang' || lines[4].type === 'changing-yang',
    lines[5].type === 'yang' || lines[5].type === 'changing-yang',
  ];

  const hexagram = getHexagramByLines(primaryLines);

  if (!hexagram) {
    console.error('❌ (Yarrow) Failed to find hexagram for line pattern:', primaryLines);
    console.error('Line types:', lines.map((l, i) => `Line ${i + 1}: ${l.type}`));
    throw new Error(`Failed to find hexagram for cast lines: [${primaryLines.map(l => l ? 'yang' : 'yin').join(', ')}]`);
  }

  const changingLines = lines
    .filter((line) => line.isChanging)
    .map((line) => line.position);

  const primaryHexagram: CastedHexagram = {
    hexagram,
    lines,
    changingLines,
  };

  // Calculate relating hexagram if there are changing lines
  let relatingHexagram: CastedHexagram | undefined;

  if (changingLines.length > 0) {
    const relatingLines: [boolean, boolean, boolean, boolean, boolean, boolean] = [
      lines[0].isChanging ? !primaryLines[0] : primaryLines[0],
      lines[1].isChanging ? !primaryLines[1] : primaryLines[1],
      lines[2].isChanging ? !primaryLines[2] : primaryLines[2],
      lines[3].isChanging ? !primaryLines[3] : primaryLines[3],
      lines[4].isChanging ? !primaryLines[4] : primaryLines[4],
      lines[5].isChanging ? !primaryLines[5] : primaryLines[5],
    ];

    const relatingHex = getHexagramByLines(relatingLines);

    if (relatingHex) {
      const stableLines: HexagramLine[] = relatingLines.map((isYang, idx) => ({
        position: idx + 1,
        type: isYang ? 'yang' : 'yin',
        isChanging: false,
      }));

      relatingHexagram = {
        hexagram: relatingHex,
        lines: stableLines,
        changingLines: [],
      };
    }
  }

  return {
    primaryHexagram,
    relatingHexagram,
  };
};

/**
 * Helper to get line symbol for display
 */
export const getLineSymbol = (lineType: LineType): string => {
  switch (lineType) {
    case 'yang':
      return '——'; // Solid line
    case 'yin':
      return '— —'; // Broken line
    case 'changing-yang':
      return '——○'; // Solid line with changing indicator
    case 'changing-yin':
      return '—×—'; // Broken line with changing indicator
    default:
      return '——';
  }
};

/**
 * Get text description of line position
 */
export const getLinePositionName = (position: number): string => {
  const names = [
    'First Line (Bottom)',
    'Second Line',
    'Third Line',
    'Fourth Line',
    'Fifth Line',
    'Sixth Line (Top)',
  ];
  return names[position - 1] || `Line ${position}`;
};
