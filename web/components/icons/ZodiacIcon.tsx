import { cn } from '@/lib/utils';

interface ZodiacIconProps {
  sign: string;
  size?: number;
  className?: string;
}

const ZODIAC_SYMBOLS: Record<string, string> = {
  aries: '♈\uFE0E',
  taurus: '♉\uFE0E',
  gemini: '♊\uFE0E',
  cancer: '♋\uFE0E',
  leo: '♌\uFE0E',
  virgo: '♍\uFE0E',
  libra: '♎\uFE0E',
  scorpio: '♏\uFE0E',
  sagittarius: '♐\uFE0E',
  capricorn: '♑\uFE0E',
  aquarius: '♒\uFE0E',
  pisces: '♓\uFE0E',
};

export const ZodiacIcon = ({ sign, size = 24, className }: ZodiacIconProps) => {
  const symbol = ZODIAC_SYMBOLS[sign.toLowerCase()] || '?';

  return (
    <span
      className={cn('font-serif inline-block', className)}
      style={{ fontSize: size * 1.3 }}
      aria-label={sign}
    >
      {symbol}
    </span>
  );
};
