import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Line, Text as SvgText, Path, G } from 'react-native-svg';
import { NatalChartData } from '../types/user';
import { colors, spacing, typography } from '../styles';

interface NatalChartWheelProps {
  chartData: NatalChartData;
  size?: number;
}

// Zodiac sign symbols (with text variation selector to force text rendering)
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

// Zodiac sign order (starting from Aries at 0°)
const ZODIAC_ORDER = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
];

// Planet symbols (with text variation selector to force text rendering)
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
  chiron: '⚷\uFE0E',
  northnode: '☊\uFE0E',
  southnode: '☋\uFE0E',
};

// Planet colors (matching TransitEffectivenessGraph)
const PLANET_COLORS: Record<string, string> = {
  sun: '#FDB813',
  moon: '#C0C0C0',
  mercury: '#87CEEB',
  venus: '#FF69B4',
  mars: '#DC143C',
  jupiter: '#FF8C00',
  saturn: '#4B0082',
  uranus: '#00CED1',
  neptune: '#9370DB',
  pluto: '#8B4513',
  northnode: '#32CD32',
  southnode: '#228B22',
  chiron: '#9B85AE',
};

export const NatalChartWheel: React.FC<NatalChartWheelProps> = ({
  chartData,
  size = Math.min(Dimensions.get('window').width - spacing.xl * 2, 400),
}) => {
  const center = size / 2;
  const outerRadius = size / 2 - 10;
  const zodiacRadius = outerRadius - 30;
  const houseRadius = zodiacRadius - 30;
  const planetRadius = houseRadius - 40;
  const innerRadius = planetRadius - 50;

  // Convert longitude to angle (0° = right, counterclockwise)
  // In astrology, 0° Aries is at 9 o'clock (left), and degrees increase counterclockwise
  const longitudeToAngle = (longitude: number): number => {
    // Adjust so 0° Aries is at 9 o'clock (180° in SVG coordinates)
    return 180 - longitude;
  };

  // Convert polar coordinates to cartesian
  const polarToCartesian = (angle: number, radius: number): { x: number; y: number } => {
    const angleInRadians = (angle * Math.PI) / 180;
    return {
      x: center + radius * Math.cos(angleInRadians),
      y: center + radius * Math.sin(angleInRadians),
    };
  };

  // Get arc path for a section
  const describeArc = (
    startAngle: number,
    endAngle: number,
    innerR: number,
    outerR: number
  ): string => {
    const start1 = polarToCartesian(startAngle, outerR);
    const end1 = polarToCartesian(endAngle, outerR);
    const start2 = polarToCartesian(endAngle, innerR);
    const end2 = polarToCartesian(startAngle, innerR);

    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return [
      'M', start1.x, start1.y,
      'A', outerR, outerR, 0, largeArcFlag, 0, end1.x, end1.y,
      'L', start2.x, start2.y,
      'A', innerR, innerR, 0, largeArcFlag, 1, end2.x, end2.y,
      'Z',
    ].join(' ');
  };

  // Render zodiac signs (outer ring)
  const renderZodiacSigns = () => {
    return ZODIAC_ORDER.map((sign, index) => {
      const startLongitude = index * 30;
      const endLongitude = (index + 1) * 30;
      const startAngle = longitudeToAngle(endLongitude);
      const endAngle = longitudeToAngle(startLongitude);
      const midAngle = longitudeToAngle(startLongitude + 15);

      // Position for sign symbol
      const symbolPos = polarToCartesian(midAngle, (outerRadius + zodiacRadius) / 2);

      return (
        <G key={`zodiac-${sign}`}>
          {/* Zodiac section separator */}
          <Line
            x1={center}
            y1={center}
            x2={polarToCartesian(startAngle, outerRadius).x}
            y2={polarToCartesian(startAngle, outerRadius).y}
            stroke={colors.border}
            strokeWidth="1"
            opacity="0.3"
          />

          {/* Zodiac symbol */}
          <SvgText
            x={symbolPos.x}
            y={symbolPos.y}
            fontSize="20"
            fill="#F6D99F"
            textAnchor="middle"
            alignmentBaseline="central"
            fontFamily="PTSerif_400Regular"
          >
            {ZODIAC_SYMBOLS[sign]}
          </SvgText>
        </G>
      );
    });
  };

  // Render houses
  const renderHouses = () => {
    if (!chartData.houses || chartData.houses.length === 0) {
      return null;
    }

    return chartData.houses.map((house, index) => {
      const nextHouse = chartData.houses[(index + 1) % 12];
      const startAngle = longitudeToAngle(house.longitude);
      const endAngle = longitudeToAngle(nextHouse?.longitude || house.longitude + 30);

      // Calculate mid angle for house number
      let midLongitude = (house.longitude + (nextHouse?.longitude || house.longitude + 30)) / 2;
      // Handle wrapping around 360
      if (nextHouse && nextHouse.longitude < house.longitude) {
        midLongitude = ((house.longitude + (nextHouse.longitude + 360)) / 2) % 360;
      }
      const midAngle = longitudeToAngle(midLongitude);

      const numberPos = polarToCartesian(midAngle, (houseRadius + innerRadius) / 2);

      return (
        <G key={`house-${house.house}`}>
          {/* House cusp line */}
          <Line
            x1={polarToCartesian(startAngle, houseRadius).x}
            y1={polarToCartesian(startAngle, houseRadius).y}
            x2={polarToCartesian(startAngle, innerRadius).x}
            y2={polarToCartesian(startAngle, innerRadius).y}
            stroke={colors.text.primary}
            strokeWidth="1.5"
            opacity="0.6"
          />

          {/* House number */}
          <SvgText
            x={numberPos.x}
            y={numberPos.y}
            fontSize="16"
            fill={colors.text.secondary}
            textAnchor="middle"
            alignmentBaseline="central"
            opacity="0.7"
          >
            {house.house}
          </SvgText>
        </G>
      );
    });
  };

  // Render planets
  const renderPlanets = () => {
    if (!chartData.planets) {
      return null;
    }

    const planetEntries = Object.entries(chartData.planets);

    // Group planets that are close together to avoid overlapping
    const planetPositions: Array<{
      key: string;
      longitude: number;
      symbol: string;
      color: string;
      retrograde: boolean;
    }> = planetEntries.map(([key, data]) => ({
      key,
      longitude: data.longitude,
      symbol: PLANET_SYMBOLS[key.toLowerCase()] || key.charAt(0).toUpperCase(),
      color: PLANET_COLORS[key.toLowerCase()] || colors.primary,
      retrograde: data.retrograde,
    }));

    // Sort by longitude
    planetPositions.sort((a, b) => a.longitude - b.longitude);

    return planetPositions.map((planet, index) => {
      const angle = longitudeToAngle(planet.longitude);

      // Stagger planets radially if they're close together
      const prevPlanet = planetPositions[index - 1];
      let radiusOffset = 0;
      if (prevPlanet && Math.abs(planet.longitude - prevPlanet.longitude) < 10) {
        radiusOffset = ((index % 3) - 1) * 15; // -15, 0, or +15
      }

      const planetPos = polarToCartesian(angle, planetRadius + radiusOffset);

      // Draw line from planet to wheel
      const lineEnd = polarToCartesian(angle, houseRadius);

      return (
        <G key={`planet-${planet.key}`}>
          {/* Line from planet to wheel */}
          <Line
            x1={planetPos.x}
            y1={planetPos.y}
            x2={lineEnd.x}
            y2={lineEnd.y}
            stroke={planet.color}
            strokeWidth="1"
            opacity="0.4"
          />

          {/* Planet symbol background circle */}
          <Circle
            cx={planetPos.x}
            cy={planetPos.y}
            r="14"
            fill={colors.background.primary}
            stroke={planet.color}
            strokeWidth="2"
          />

          {/* Planet symbol */}
          <SvgText
            x={planetPos.x}
            y={planetPos.y}
            fontSize="16"
            fill={planet.color}
            textAnchor="middle"
            alignmentBaseline="central"
            fontWeight="bold"
            fontFamily="PTSerif_400Regular"
          >
            {planet.symbol}
          </SvgText>

          {/* Retrograde indicator */}
          {planet.retrograde && (
            <SvgText
              x={planetPos.x + 12}
              y={planetPos.y - 10}
              fontSize="10"
              fill={planet.color}
              textAnchor="middle"
              alignmentBaseline="central"
              fontFamily="PTSerif_400Regular"
            >
              ℞{'\uFE0E'}
            </SvgText>
          )}
        </G>
      );
    });
  };

  // Render angles (ASC, MC, DSC, IC)
  const renderAngles = () => {
    if (!chartData.angles) {
      return null;
    }

    const angles = [
      { name: 'ASC', longitude: chartData.angles.ascendant, color: colors.primary },
      { name: 'MC', longitude: chartData.angles.midheaven, color: colors.primary },
      { name: 'DSC', longitude: chartData.angles.descendant, color: colors.primary },
      { name: 'IC', longitude: chartData.angles.imumCoeli, color: colors.primary },
    ];

    return angles.map((angle) => {
      const svgAngle = longitudeToAngle(angle.longitude);
      const outerPos = polarToCartesian(svgAngle, zodiacRadius);
      const innerPos = polarToCartesian(svgAngle, houseRadius);
      const labelPos = polarToCartesian(svgAngle, zodiacRadius + 15);

      return (
        <G key={`angle-${angle.name}`}>
          {/* Angle line */}
          <Line
            x1={outerPos.x}
            y1={outerPos.y}
            x2={innerPos.x}
            y2={innerPos.y}
            stroke={angle.color}
            strokeWidth="2"
            opacity="0.8"
          />

          {/* Angle label */}
          <SvgText
            x={labelPos.x}
            y={labelPos.y}
            fontSize="12"
            fill={angle.color}
            textAnchor="middle"
            alignmentBaseline="central"
            fontWeight="bold"
            fontFamily="PTSerif_700Bold"
          >
            {angle.name}
          </SvgText>
        </G>
      );
    });
  };

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* Outer circle */}
        <Circle
          cx={center}
          cy={center}
          r={outerRadius}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2"
        />

        {/* Zodiac circle */}
        <Circle
          cx={center}
          cy={center}
          r={zodiacRadius}
          fill="none"
          stroke={colors.border}
          strokeWidth="1"
        />

        {/* House circle */}
        <Circle
          cx={center}
          cy={center}
          r={houseRadius}
          fill="none"
          stroke={colors.border}
          strokeWidth="1"
        />

        {/* Inner circle */}
        <Circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill="none"
          stroke={colors.border}
          strokeWidth="1"
        />

        {/* Render zodiac signs */}
        {renderZodiacSigns()}

        {/* Render houses */}
        {renderHouses()}

        {/* Render angles */}
        {renderAngles()}

        {/* Render planets */}
        {renderPlanets()}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: spacing.md,
  },
});
