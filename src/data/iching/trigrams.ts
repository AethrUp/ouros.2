import { Trigram } from '../../types/iching';

/**
 * The 8 fundamental trigrams (Bagua)
 * Each trigram consists of 3 lines (bottom to top)
 * true = yang (solid line), false = yin (broken line)
 */
export const TRIGRAMS: Record<string, Trigram> = {
  qian: {
    id: 'qian',
    chineseName: '乾',
    englishName: 'Heaven',
    lines: [true, true, true],
    element: 'Metal',
    attribute: 'Creative, Strong',
    family: 'Father',
    direction: 'Northwest',
    symbol: '☰',
  },
  kun: {
    id: 'kun',
    chineseName: '坤',
    englishName: 'Earth',
    lines: [false, false, false],
    element: 'Earth',
    attribute: 'Receptive, Yielding',
    family: 'Mother',
    direction: 'Southwest',
    symbol: '☷',
  },
  zhen: {
    id: 'zhen',
    chineseName: '震',
    englishName: 'Thunder',
    lines: [true, false, false],
    element: 'Wood',
    attribute: 'Arousing, Movement',
    family: 'Eldest Son',
    direction: 'East',
    symbol: '☳',
  },
  kan: {
    id: 'kan',
    chineseName: '坎',
    englishName: 'Water',
    lines: [false, true, false],
    element: 'Water',
    attribute: 'Abysmal, Danger',
    family: 'Middle Son',
    direction: 'North',
    symbol: '☵',
  },
  gen: {
    id: 'gen',
    chineseName: '艮',
    englishName: 'Mountain',
    lines: [false, false, true],
    element: 'Earth',
    attribute: 'Stillness, Keeping Still',
    family: 'Youngest Son',
    direction: 'Northeast',
    symbol: '☶',
  },
  xun: {
    id: 'xun',
    chineseName: '巽',
    englishName: 'Wind',
    lines: [false, true, true],
    element: 'Wood',
    attribute: 'Gentle, Penetrating',
    family: 'Eldest Daughter',
    direction: 'Southeast',
    symbol: '☴',
  },
  li: {
    id: 'li',
    chineseName: '離',
    englishName: 'Fire',
    lines: [true, false, true],
    element: 'Fire',
    attribute: 'Clinging, Clarity',
    family: 'Middle Daughter',
    direction: 'South',
    symbol: '☲',
  },
  dui: {
    id: 'dui',
    chineseName: '兌',
    englishName: 'Lake',
    lines: [true, true, false],
    element: 'Metal',
    attribute: 'Joyous, Pleasure',
    family: 'Youngest Daughter',
    direction: 'West',
    symbol: '☱',
  },
};

/**
 * Helper function to get trigram by its line pattern
 */
export const getTrigramByLines = (
  lines: [boolean, boolean, boolean]
): Trigram | undefined => {
  return Object.values(TRIGRAMS).find(
    (trigram) =>
      trigram.lines[0] === lines[0] &&
      trigram.lines[1] === lines[1] &&
      trigram.lines[2] === lines[2]
  );
};
