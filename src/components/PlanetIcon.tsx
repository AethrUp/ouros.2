import React from 'react';
import { Text } from 'react-native';

interface PlanetIconProps {
  planet: string;
  size?: number;
  color?: string;
}

export const PlanetIcon: React.FC<PlanetIconProps> = ({
  planet,
  size = 32,
  color = '#FFFFFF'
}) => {
  const planetLower = planet.toLowerCase();

  // Map planets to their Unicode symbols
  // Adding \uFE0E (text variation selector) to force text rendering instead of emoji
  const getPlanetSymbol = () => {
    switch (planetLower) {
      case 'sun':
        return '☉\uFE0E';
      case 'moon':
        return '☽\uFE0E';
      case 'mercury':
        return '☿\uFE0E';
      case 'venus':
        return '♀\uFE0E';
      case 'mars':
        return '♂\uFE0E';
      case 'jupiter':
        return '♃\uFE0E';
      case 'saturn':
        return '♄\uFE0E';
      case 'uranus':
        return '♅\uFE0E';
      case 'neptune':
        return '♆\uFE0E';
      case 'pluto':
        return '♇\uFE0E';
      case 'north_node':
      case 'northnode':
        return '☊\uFE0E';
      case 'south_node':
      case 'southnode':
        return '☋\uFE0E';
      case 'chiron':
        return '⚷\uFE0E';
      default:
        return '●';
    }
  };

  return (
    <Text
      style={{
        fontFamily: 'PTSerif_400Regular',
        fontSize: size * 1.3,
        color: color,
        lineHeight: size * 1.3,
      }}
    >
      {getPlanetSymbol()}
    </Text>
  );
};
