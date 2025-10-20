import React from 'react';
import { Text } from 'react-native';

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

  // Map zodiac signs to their Unicode symbols
  // Adding \uFE0E (text variation selector) to force text rendering instead of emoji
  const getZodiacSymbol = () => {
    switch (signLower) {
      case 'aries':
        return '♈\uFE0E';
      case 'taurus':
        return '♉\uFE0E';
      case 'gemini':
        return '♊\uFE0E';
      case 'cancer':
        return '♋\uFE0E';
      case 'leo':
        return '♌\uFE0E';
      case 'virgo':
        return '♍\uFE0E';
      case 'libra':
        return '♎\uFE0E';
      case 'scorpio':
        return '♏\uFE0E';
      case 'sagittarius':
        return '♐\uFE0E';
      case 'capricorn':
        return '♑\uFE0E';
      case 'aquarius':
        return '♒\uFE0E';
      case 'pisces':
        return '♓\uFE0E';
      default:
        return '○';
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
      {getZodiacSymbol()}
    </Text>
  );
};
