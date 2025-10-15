import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Line as SvgLine, Path as SvgPath } from 'react-native-svg';
import { colors, spacing, typography } from '../styles';
import { TransitAnalysisItem } from '../types/reading';

interface TransitEffectivenessGraphProps {
  transits: TransitAnalysisItem[];
  maxTransits?: number;
}

// Color mappings for celestial bodies (matching TransitStrengthBar)
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

// Fallback colors if planet not found
const FALLBACK_COLORS = [
  '#F6D99F', // Gold - primary
  '#A8C0D4', // Blue - secondary
  '#C9A9E0', // Purple - tertiary
];

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
  chiron: '⚷',
  northnode: '☊',
  southnode: '☋',
};

// Bootstrap Icons SVG paths
const BootstrapIcons = {
  moonStars: 'M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278zM4.858 1.311A7.269 7.269 0 0 0 1.025 7.71c0 4.02 3.279 7.276 7.319 7.276a7.316 7.316 0 0 0 5.205-2.162c-.337.042-.68.063-1.029.063-4.61 0-8.343-3.714-8.343-8.29 0-1.167.242-2.278.681-3.286z',
  brightnessAltHighFill: 'M8 3a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 3zm8 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zm-13.5.5a.5.5 0 0 0 0-1h-2a.5.5 0 0 0 0 1h2zm11.157-6.157a.5.5 0 0 1 0 .707l-1.414 1.414a.5.5 0 1 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm-9.9 2.121a.5.5 0 0 0 .707-.707L3.05 5.343a.5.5 0 1 0-.707.707l1.414 1.414zM8 7a4 4 0 0 0-4 4 .5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5 4 4 0 0 0-4-4z',
  sunFill: 'M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z',
  brightnessAltLow: 'M8 3a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 3zm8 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zm-13.5.5a.5.5 0 0 0 0-1h-2a.5.5 0 0 0 0 1h2zm11.157-6.157a.5.5 0 0 1 0 .707l-1.414 1.414a.5.5 0 1 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm-9.9 2.121a.5.5 0 0 0 .707-.707L3.05 5.343a.5.5 0 1 0-.707.707l1.414 1.414zM8 7a4 4 0 0 0-4 4 .5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5 4 4 0 0 0-4-4zm0 4.5a3 3 0 0 1 2.959-2.5A3.5 3.5 0 0 1 8 11.5z',
};

export const TransitEffectivenessGraph: React.FC<TransitEffectivenessGraphProps> = ({
  transits,
  maxTransits = 3,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const graphWidth = screenWidth - spacing.lg * 2 - spacing.md * 2;
  const graphHeight = 126; // 30% reduction from 180
  const padding = { top: 15, right: 10, bottom: 35, left: 10 };

  // Filter to only transits with timing data
  const validTransits = transits
    .filter((t) => t.timingData && t.timingData.strengthCurve && t.timingData.strengthCurve.length === 24)
    .slice(0, maxTransits);

  if (validTransits.length === 0) {
    return null;
  }

  // Calculate scales with dynamic Y-axis range for more dramatic visualization
  const chartWidth = graphWidth - padding.left - padding.right;
  const chartHeight = graphHeight - padding.top - padding.bottom;
  const xScale = chartWidth / 23; // 24 hours (0-23)

  // Find min and max values across all transits to zoom in on the data range
  let minStrength = 100;
  let maxStrength = 0;
  validTransits.forEach((transit) => {
    if (transit.timingData?.strengthCurve) {
      transit.timingData.strengthCurve.forEach((strength) => {
        minStrength = Math.min(minStrength, strength);
        maxStrength = Math.max(maxStrength, strength);
      });
    }
  });

  // Add some padding to the range (20% on each side) and ensure minimum range of 40
  const range = Math.max(maxStrength - minStrength, 40);
  const rangePadding = range * 0.25;
  const yMin = Math.max(0, minStrength - rangePadding);
  const yMax = Math.min(100, maxStrength + rangePadding);
  const yRange = yMax - yMin;
  const yScale = chartHeight / yRange;

  // Generate smooth path using Catmull-Rom spline for more dramatic curves
  const generateSmoothPath = (strengthCurve: number[]): string => {
    const points = strengthCurve.map((strength, hour) => ({
      x: padding.left + hour * xScale,
      y: padding.top + (yMax - strength) * yScale,
    }));

    if (points.length < 2) return '';

    let path = `M ${points[0].x} ${points[0].y}`;

    // Use Catmull-Rom spline for smoother, more natural curves
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      // Catmull-Rom tension (0.5 = centripetal, 0 = uniform, 1 = chordal)
      const tension = 0.5;

      // Calculate control points
      const cp1x = p1.x + (p2.x - p0.x) / 6 * tension;
      const cp1y = p1.y + (p2.y - p0.y) / 6 * tension;
      const cp2x = p2.x - (p3.x - p1.x) / 6 * tension;
      const cp2y = p2.y - (p3.y - p1.y) / 6 * tension;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    return path;
  };

  // Get planet symbol
  const getPlanetSymbol = (planetName?: string): string => {
    if (!planetName) return '•';
    const key = planetName.toLowerCase().replace(/\s/g, '');
    return PLANET_SYMBOLS[key] || planetName.charAt(0).toUpperCase();
  };

  // Get aspect symbol
  const getAspectSymbol = (aspectType?: string): string => {
    if (!aspectType) return '☍';
    const aspect = aspectType.toLowerCase();
    if (aspect.includes('conjunction')) return '☌';
    if (aspect.includes('opposition')) return '☍';
    if (aspect.includes('trine')) return '△';
    if (aspect.includes('square')) return '□';
    if (aspect.includes('sextile')) return '⚹';
    return '☍'; // Default to opposition
  };

  return (
    <View style={styles.container}>
      {/* Graph */}
      <Svg width={graphWidth} height={graphHeight}>
        {/* Y-axis grid lines - subtle background */}
        {[0, 0.5, 1].map((fraction) => {
          const y = padding.top + (1 - fraction) * chartHeight;
          return (
            <SvgLine
              key={`y-${fraction}`}
              x1={padding.left}
              y1={y}
              x2={padding.left + chartWidth}
              y2={y}
              stroke={colors.border}
              strokeWidth="1"
              opacity="0.2"
            />
          );
        })}

        {/* X-axis icons - Time of day */}
        {[
          { icon: 'moonStars' },
          { icon: 'brightnessAltHighFill' },
          { icon: 'sunFill' },
          { icon: 'brightnessAltLow' },
        ].map(({ icon }, index, array) => {
          const iconSize = 16;
          const isFirst = index === 0;
          const isLast = index === array.length - 1;
          let x;
          if (isFirst) {
            // First icon at left edge
            x = padding.left;
          } else if (isLast) {
            // Last icon at right edge
            x = padding.left + chartWidth - iconSize;
          } else {
            // Middle icons evenly spaced
            const spacing = chartWidth / (array.length - 1);
            x = padding.left + (index * spacing) - iconSize / 2;
          }
          return (
            <SvgPath
              key={`x-icon-${index}`}
              d={BootstrapIcons[icon as keyof typeof BootstrapIcons]}
              fill="#FFFFFF"
              opacity="0.8"
              transform={`translate(${x}, ${padding.top + chartHeight + 12}) scale(${iconSize / 16})`}
            />
          );
        })}

        {/* Transit curves - drawn with enhanced smoothness */}
        {validTransits.map((transit, index) => {
          if (!transit.timingData?.strengthCurve) return null;

          const path = generateSmoothPath(transit.timingData.strengthCurve);

          // Get color based on transiting planet
          const planetKey = transit.planet?.toLowerCase().replace(/\s/g, '') || '';
          const color = PLANET_COLORS[planetKey] || FALLBACK_COLORS[index] || '#F6D99F';

          return (
            <Path
              key={index}
              d={path}
              stroke={color}
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}

        {/* Bottom axis */}
        <SvgLine
          x1={padding.left}
          y1={padding.top + chartHeight}
          x2={padding.left + chartWidth}
          y2={padding.top + chartHeight}
          stroke={colors.border}
          strokeWidth="1"
        />
      </Svg>

      {/* Legend - moved to bottom with symbols */}
      <View style={styles.legend}>
        {validTransits.map((transit, index) => {
          const planetSymbol = getPlanetSymbol(transit.planet);
          const aspectSymbol = getAspectSymbol(transit.aspectType);
          const natalSymbol = getPlanetSymbol(transit.natalPlanet);

          // Get color based on transiting planet (same logic as graph)
          const planetKey = transit.planet?.toLowerCase().replace(/\s/g, '') || '';
          const color = PLANET_COLORS[planetKey] || FALLBACK_COLORS[index] || '#F6D99F';

          return (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <View style={styles.legendSymbolsContainer}>
                <Text style={styles.legendSymbols}>{planetSymbol}</Text>
                <Text style={[styles.legendSymbols, { opacity: 0.5 }]}> {aspectSymbol} </Text>
                <Text style={styles.legendSymbols}>{natalSymbol}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.background.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.xs,
  },
  legendSymbolsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendSymbols: {
    ...typography.body,
    fontSize: 16,
    letterSpacing: 2,
  },
});
