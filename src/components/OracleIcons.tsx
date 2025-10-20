import React from 'react';

// Import your SVG files from assets
import TarotIconSvg from '../../assets/icons/tarotIcon.svg';
import IChingIconSvg from '../../assets/icons/ichingIcon.svg';
import DreamIconSvg from '../../assets/icons/dreamIcon.svg';

interface IconProps {
  size?: number;
  color?: string;
}

// Tarot Icon - Your custom SVG
export const TarotIcon: React.FC<IconProps> = ({ size = 28, color = '#FFFFFF' }) => {
  return <TarotIconSvg width={size} height={size} fill={color} />;
};

// I Ching Icon - Your custom SVG
export const IChingIcon: React.FC<IconProps> = ({ size = 28, color = '#FFFFFF' }) => {
  return <IChingIconSvg width={size} height={size} fill={color} />;
};

// Dream Icon - Your custom SVG
export const DreamIcon: React.FC<IconProps> = ({ size = 28, color = '#FFFFFF' }) => {
  return <DreamIconSvg width={size} height={size} fill={color} />;
};
