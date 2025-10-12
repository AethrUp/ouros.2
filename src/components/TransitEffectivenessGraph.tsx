import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Line as SvgLine, Text as SvgText } from 'react-native-svg';
import { colors, spacing, typography } from '../styles';
import { TransitAnalysisItem } from '../types/reading';

interface TransitEffectivenessGraphProps {
  transits: TransitAnalysisItem[];
  maxTransits?: number;
}

const GRAPH_COLORS = [
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

        {/* X-axis labels - Morning, Noon, Night */}
        {[
          { label: 'Morning', hour: 6 },
          { label: 'Noon', hour: 12 },
          { label: 'Night', hour: 20 },
        ].map(({ label, hour }) => {
          const x = padding.left + hour * xScale;
          return (
            <SvgText
              key={`x-label-${label}`}
              x={x}
              y={padding.top + chartHeight + 20}
              fill={colors.text.secondary}
              fontSize="11"
              textAnchor="middle"
              fontFamily="SourceSansPro_400Regular"
            >
              {label}
            </SvgText>
          );
        })}

        {/* Transit curves - drawn with enhanced smoothness */}
        {validTransits.map((transit, index) => {
          if (!transit.timingData?.strengthCurve) return null;

          const path = generateSmoothPath(transit.timingData.strengthCurve);
          const color = GRAPH_COLORS[index];

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

          return (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: GRAPH_COLORS[index] }]} />
              <Text style={styles.legendSymbols}>
                {planetSymbol} {aspectSymbol} {natalSymbol}
              </Text>
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
  legendSymbols: {
    ...typography.body,
    fontSize: 16,
    letterSpacing: 2,
  },
});
