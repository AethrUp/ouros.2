import React from 'react';
import Svg, { Path, Circle, Line, G } from 'react-native-svg';

interface ZodiacIconProps {
  sign: string;
  size?: number;
  color?: string;
}

export const ZodiacIcon: React.FC<ZodiacIconProps> = ({
  sign,
  size = 32,
  color = '#FFFFFF'
}) => {
  const signLower = sign.toLowerCase();

  // Common props
  const strokeWidth = 2;
  const viewBox = `0 0 ${size} ${size}`;

  switch (signLower) {
    case 'aries':
      // Ram's horns
      return (
        <Svg width={size} height={size} viewBox={viewBox}>
          <Path
            d={`M ${size * 0.2} ${size * 0.7} Q ${size * 0.2} ${size * 0.3}, ${size * 0.35} ${size * 0.2} L ${size * 0.35} ${size * 0.8}`}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
          <Path
            d={`M ${size * 0.8} ${size * 0.7} Q ${size * 0.8} ${size * 0.3}, ${size * 0.65} ${size * 0.2} L ${size * 0.65} ${size * 0.8}`}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
        </Svg>
      );

    case 'taurus':
      // Bull's head with horns
      return (
        <Svg width={size} height={size} viewBox={viewBox}>
          <Circle cx={size / 2} cy={size * 0.5} r={size * 0.25} stroke={color} strokeWidth={strokeWidth} fill="none" />
          <Path
            d={`M ${size * 0.3} ${size * 0.3} Q ${size * 0.2} ${size * 0.15}, ${size * 0.15} ${size * 0.25}`}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
          <Path
            d={`M ${size * 0.7} ${size * 0.3} Q ${size * 0.8} ${size * 0.15}, ${size * 0.85} ${size * 0.25}`}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
        </Svg>
      );

    case 'gemini':
      // The twins - two parallel lines
      return (
        <Svg width={size} height={size} viewBox={viewBox}>
          <Line x1={size * 0.3} y1={size * 0.2} x2={size * 0.3} y2={size * 0.8} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1={size * 0.7} y1={size * 0.2} x2={size * 0.7} y2={size * 0.8} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1={size * 0.3} y1={size * 0.25} x2={size * 0.7} y2={size * 0.25} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1={size * 0.3} y1={size * 0.75} x2={size * 0.7} y2={size * 0.75} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );

    case 'cancer':
      // The crab - 69 symbol
      return (
        <Svg width={size} height={size} viewBox={viewBox}>
          <Circle cx={size * 0.35} cy={size * 0.35} r={size * 0.15} stroke={color} strokeWidth={strokeWidth} fill="none" />
          <Circle cx={size * 0.65} cy={size * 0.65} r={size * 0.15} stroke={color} strokeWidth={strokeWidth} fill="none" />
          <Path
            d={`M ${size * 0.35} ${size * 0.2} L ${size * 0.35} ${size * 0.15}`}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <Path
            d={`M ${size * 0.65} ${size * 0.8} L ${size * 0.65} ${size * 0.85}`}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </Svg>
      );

    case 'leo':
      // Lion's mane
      return (
        <Svg width={size} height={size} viewBox={viewBox}>
          <Circle cx={size * 0.4} cy={size * 0.4} r={size * 0.2} stroke={color} strokeWidth={strokeWidth} fill="none" />
          <Path
            d={`M ${size * 0.6} ${size * 0.4} Q ${size * 0.75} ${size * 0.5}, ${size * 0.65} ${size * 0.7} Q ${size * 0.6} ${size * 0.8}, ${size * 0.75} ${size * 0.85}`}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
        </Svg>
      );

    case 'virgo':
      // The maiden - stylized M with tail
      return (
        <Svg width={size} height={size} viewBox={viewBox}>
          <Path
            d={`M ${size * 0.15} ${size * 0.7} L ${size * 0.15} ${size * 0.3} L ${size * 0.35} ${size * 0.5} L ${size * 0.35} ${size * 0.3} L ${size * 0.55} ${size * 0.5} L ${size * 0.55} ${size * 0.3}`}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d={`M ${size * 0.55} ${size * 0.5} Q ${size * 0.7} ${size * 0.5}, ${size * 0.75} ${size * 0.65} Q ${size * 0.8} ${size * 0.75}, ${size * 0.7} ${size * 0.8}`}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
        </Svg>
      );

    case 'libra':
      // The scales
      return (
        <Svg width={size} height={size} viewBox={viewBox}>
          <Line x1={size * 0.2} y1={size * 0.5} x2={size * 0.8} y2={size * 0.5} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1={size * 0.2} y1={size * 0.7} x2={size * 0.8} y2={size * 0.7} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Path
            d={`M ${size * 0.5} ${size * 0.2} Q ${size * 0.65} ${size * 0.25}, ${size * 0.65} ${size * 0.4}`}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
        </Svg>
      );

    case 'scorpio':
      // The scorpion - stylized M with arrow tail
      return (
        <Svg width={size} height={size} viewBox={viewBox}>
          <Path
            d={`M ${size * 0.15} ${size * 0.7} L ${size * 0.15} ${size * 0.3} L ${size * 0.35} ${size * 0.5} L ${size * 0.35} ${size * 0.3} L ${size * 0.55} ${size * 0.5} L ${size * 0.55} ${size * 0.3}`}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d={`M ${size * 0.55} ${size * 0.5} L ${size * 0.7} ${size * 0.65} L ${size * 0.85} ${size * 0.5}`}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d={`M ${size * 0.75} ${size * 0.45} L ${size * 0.85} ${size * 0.5} L ${size * 0.8} ${size * 0.6}`}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case 'sagittarius':
      // The archer's arrow
      return (
        <Svg width={size} height={size} viewBox={viewBox}>
          <Line x1={size * 0.2} y1={size * 0.8} x2={size * 0.8} y2={size * 0.2} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Path
            d={`M ${size * 0.65} ${size * 0.2} L ${size * 0.8} ${size * 0.2} L ${size * 0.8} ${size * 0.35}`}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Line x1={size * 0.2} y1={size * 0.65} x2={size * 0.35} y2={size * 0.8} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );

    case 'capricorn':
      // The goat
      return (
        <Svg width={size} height={size} viewBox={viewBox}>
          <Path
            d={`M ${size * 0.25} ${size * 0.5} Q ${size * 0.25} ${size * 0.25}, ${size * 0.4} ${size * 0.25} L ${size * 0.4} ${size * 0.7}`}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
          <Path
            d={`M ${size * 0.4} ${size * 0.5} Q ${size * 0.55} ${size * 0.5}, ${size * 0.6} ${size * 0.35} Q ${size * 0.65} ${size * 0.25}, ${size * 0.75} ${size * 0.35} Q ${size * 0.8} ${size * 0.5}, ${size * 0.7} ${size * 0.65}`}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
        </Svg>
      );

    case 'aquarius':
      // The water bearer - waves
      return (
        <Svg width={size} height={size} viewBox={viewBox}>
          <Path
            d={`M ${size * 0.15} ${size * 0.4} Q ${size * 0.25} ${size * 0.3}, ${size * 0.35} ${size * 0.4} Q ${size * 0.45} ${size * 0.5}, ${size * 0.55} ${size * 0.4} Q ${size * 0.65} ${size * 0.3}, ${size * 0.75} ${size * 0.4} Q ${size * 0.85} ${size * 0.5}, ${size * 0.9} ${size * 0.4}`}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
          <Path
            d={`M ${size * 0.15} ${size * 0.6} Q ${size * 0.25} ${size * 0.5}, ${size * 0.35} ${size * 0.6} Q ${size * 0.45} ${size * 0.7}, ${size * 0.55} ${size * 0.6} Q ${size * 0.65} ${size * 0.5}, ${size * 0.75} ${size * 0.6} Q ${size * 0.85} ${size * 0.7}, ${size * 0.9} ${size * 0.6}`}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
        </Svg>
      );

    case 'pisces':
      // The fish
      return (
        <Svg width={size} height={size} viewBox={viewBox}>
          <Path
            d={`M ${size * 0.3} ${size * 0.3} Q ${size * 0.2} ${size * 0.35}, ${size * 0.2} ${size * 0.5} Q ${size * 0.2} ${size * 0.65}, ${size * 0.3} ${size * 0.7}`}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
          <Path
            d={`M ${size * 0.7} ${size * 0.3} Q ${size * 0.8} ${size * 0.35}, ${size * 0.8} ${size * 0.5} Q ${size * 0.8} ${size * 0.65}, ${size * 0.7} ${size * 0.7}`}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
          <Line x1={size * 0.3} y1={size * 0.5} x2={size * 0.7} y2={size * 0.5} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );

    default:
      // Default circle if sign not recognized
      return (
        <Svg width={size} height={size} viewBox={viewBox}>
          <Circle cx={size / 2} cy={size / 2} r={size * 0.3} stroke={color} strokeWidth={strokeWidth} fill="none" />
        </Svg>
      );
  }
};
