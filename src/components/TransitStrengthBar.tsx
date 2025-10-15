import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, typography } from '../styles';

interface TransitStrengthBarProps {
  transits: Array<{
    transitPlanet: string;
    natalPlanet: string;
    aspect: string;
    strength: number;
  }>;
  maxTransits?: number;
}

// Color mappings for celestial bodies
const PLANET_COLORS: Record<string, string> = {
  // Personal planets
  sun: '#FDB813',      // Gold/Yellow
  moon: '#C0C0C0',     // Silver
  mercury: '#87CEEB',  // Sky Blue
  venus: '#FF69B4',    // Pink
  mars: '#DC143C',     // Crimson Red

  // Social planets
  jupiter: '#FF8C00',  // Dark Orange
  saturn: '#4B0082',   // Indigo

  // Outer planets
  uranus: '#00CED1',   // Dark Turquoise
  neptune: '#9370DB',  // Medium Purple
  pluto: '#8B4513',    // Saddle Brown

  // Points
  northnode: '#32CD32', // Lime Green
  southnode: '#228B22', // Forest Green
  chiron: '#9B85AE',    // Muted Purple
};

// Planet symbols (Unicode)
const PLANET_SYMBOLS: Record<string, string> = {
  sun: '☉',
  moon: '☽',
  mercury: '☿',
  venus: '♀',
  mars: '♂',
  jupiter: '♃',
  saturn: '♄',
  uranus: '♅',
  neptune: '♆',
  pluto: '♇',
  northnode: '☊',
  southnode: '☋',
  chiron: '⚷',
};

// Fallback color for unknown planets
const DEFAULT_COLOR = '#808080'; // Gray
const DEFAULT_SYMBOL = '●';

export const TransitStrengthBar: React.FC<TransitStrengthBarProps> = ({
  transits,
  maxTransits = 3
}) => {
  // Normalize strength values (handle both 0-1 and 0-100 ranges)
  const normalizedTransits = transits.map(t => ({
    ...t,
    strength: t.strength > 1 ? t.strength : t.strength * 100
  }));

  // Get top N transits by strength
  const topTransits = normalizedTransits
    .filter(t => t.strength > 0)
    .sort((a, b) => b.strength - a.strength)
    .slice(0, maxTransits);

  if (topTransits.length === 0) {
    return null;
  }

  // Calculate total strength for proportional widths
  const totalStrength = topTransits.reduce((sum, t) => sum + t.strength, 0);

  return (
    <View style={styles.container}>
      <View style={styles.barContainer}>
        {topTransits.map((transit, index) => {
          const planetKey = transit.transitPlanet.toLowerCase();
          const color = PLANET_COLORS[planetKey] || DEFAULT_COLOR;
          const symbol = PLANET_SYMBOLS[planetKey] || DEFAULT_SYMBOL;

          // Calculate percentage of total for this segment
          const percentage = (transit.strength / totalStrength) * 100;

          return (
            <View
              key={`${transit.transitPlanet}-${transit.natalPlanet}-${index}`}
              style={[
                styles.barSegment,
                {
                  width: `${percentage}%`,
                  backgroundColor: color,
                },
              ]}
            >
              <Text style={styles.planetSymbol}>{symbol}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  barContainer: {
    flexDirection: 'row',
    height: 40,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  barSegment: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: spacing.sm,
  },
  planetSymbol: {
    fontSize: 24,
    color: 'rgba(0, 0, 0, 0.6)',
    fontWeight: 'bold',
  },
});
