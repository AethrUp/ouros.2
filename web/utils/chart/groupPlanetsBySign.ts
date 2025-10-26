import { NatalChartData } from '@/types/user';

export interface PlanetInfo {
  key: string;
  name: string;
  sign: string;
  house: number;
  degree: number;
  retrograde: boolean;
}

export interface SignGroup {
  sign: string;
  planets: PlanetInfo[];
}

const ZODIAC_ORDER = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
];

/**
 * Groups planets by their zodiac sign and sorts by zodiac order
 */
export const groupPlanetsBySign = (chartData: NatalChartData): SignGroup[] => {
  const grouped = new Map<string, SignGroup>();

  // Group planets by sign
  Object.entries(chartData.planets).forEach(([key, planet]) => {
    const signLower = planet.sign.toLowerCase();

    if (!grouped.has(signLower)) {
      grouped.set(signLower, { sign: planet.sign, planets: [] });
    }

    grouped.get(signLower)!.planets.push({
      key,
      name: key.toUpperCase(),
      sign: planet.sign,
      house: planet.house,
      degree: planet.degree,
      retrograde: planet.retrograde,
    });
  });

  // Sort groups by zodiac order and filter out empty signs
  const sortedGroups = Array.from(grouped.values()).sort((a, b) => {
    const indexA = ZODIAC_ORDER.indexOf(a.sign.toLowerCase());
    const indexB = ZODIAC_ORDER.indexOf(b.sign.toLowerCase());
    return indexA - indexB;
  });

  return sortedGroups;
};
