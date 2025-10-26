import { cn } from '@/lib/utils';

interface PlanetIconProps {
  planet: string;
  size?: number;
  className?: string;
}

const PLANET_SYMBOLS: Record<string, string> = {
  sun: '☉\uFE0E',
  moon: '☽\uFE0E',
  mercury: '☿\uFE0E',
  venus: '♀\uFE0E',
  mars: '♂\uFE0E',
  jupiter: '♃\uFE0E',
  saturn: '♄\uFE0E',
  uranus: '♅\uFE0E',
  neptune: '♆\uFE0E',
  pluto: '♇\uFE0E',
  northnode: '☊\uFE0E',
  southnode: '☋\uFE0E',
  chiron: '⚷\uFE0E',
};

export const PlanetIcon = ({ planet, size = 24, className }: PlanetIconProps) => {
  const symbol = PLANET_SYMBOLS[planet.toLowerCase()] || '?';

  return (
    <span
      className={cn('font-serif inline-block', className)}
      style={{ fontSize: size * 1.3 }}
      aria-label={planet}
    >
      {symbol}
    </span>
  );
};
