import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../styles';

type BadgeVariant = 'new' | 'pro' | 'premium' | 'locked' | 'custom';

export interface BadgeProps {
  variant?: BadgeVariant;
  text?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  backgroundColor?: string;
  textColor?: string;
  iconColor?: string;
  iconSize?: number;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'custom',
  text,
  icon,
  position = 'top-right',
  backgroundColor,
  textColor,
  iconColor,
  iconSize = 16,
  style,
}) => {
  // Determine badge content based on variant
  const getBadgeConfig = () => {
    switch (variant) {
      case 'new':
        return {
          text: 'NEW',
          backgroundColor: backgroundColor || colors.text.primary,
          textColor: textColor || colors.background.primary,
        };
      case 'pro':
        return {
          text: 'PRO',
          backgroundColor: backgroundColor || '#FFD700',
          textColor: textColor || '#000000',
        };
      case 'premium':
        return {
          text: 'PREMIUM',
          backgroundColor: backgroundColor || '#9B85AE',
          textColor: textColor || '#FFFFFF',
        };
      case 'locked':
        return {
          icon: 'lock-closed' as keyof typeof Ionicons.glyphMap,
          iconColor: iconColor || colors.text.primary,
        };
      case 'custom':
      default:
        return {
          text,
          icon,
          backgroundColor,
          textColor,
          iconColor,
        };
    }
  };

  const config = getBadgeConfig();

  // Determine position styles
  const getPositionStyle = (): ViewStyle => {
    const basePosition: ViewStyle = { position: 'absolute', zIndex: 10 };

    switch (position) {
      case 'top-right':
        return { ...basePosition, top: spacing.xs, right: spacing.xs };
      case 'top-left':
        return { ...basePosition, top: spacing.xs, left: spacing.xs };
      case 'bottom-right':
        return { ...basePosition, bottom: spacing.xs, right: spacing.xs };
      case 'bottom-left':
        return { ...basePosition, bottom: spacing.xs, left: spacing.xs };
      default:
        return { ...basePosition, top: spacing.xs, right: spacing.xs };
    }
  };

  // If badge has an icon, render icon badge
  if (config.icon) {
    return (
      <View style={[getPositionStyle(), style]}>
        <Ionicons name={config.icon} size={iconSize} color={config.iconColor} />
      </View>
    );
  }

  // Otherwise render text badge
  return (
    <View
      style={[
        styles.badge,
        getPositionStyle(),
        { backgroundColor: config.backgroundColor || colors.text.primary },
        style,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          { color: config.textColor || colors.background.primary },
        ]}
      >
        {config.text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: 'bold',
  },
});
