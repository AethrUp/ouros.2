/**
 * Badge Component
 * Small metadata badge for tone/confidence display
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../styles';

interface BadgeProps {
  text: string;
  type: 'tone' | 'confidence';
}

export const Badge: React.FC<BadgeProps> = ({ text, type }) => {
  const badgeStyle = type === 'tone' ? styles.toneBadge : styles.confidenceBadge;
  const textStyle = type === 'tone' ? styles.toneText : styles.confidenceText;

  return (
    <View style={[styles.badge, badgeStyle]}>
      <Text style={[styles.badgeText, textStyle]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  toneBadge: {
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    borderColor: 'rgba(138, 43, 226, 0.3)',
  },
  confidenceBadge: {
    backgroundColor: 'rgba(100, 149, 237, 0.1)',
    borderColor: 'rgba(100, 149, 237, 0.3)',
  },
  badgeText: {
    ...typography.caption,
    fontSize: 11,
    textTransform: 'capitalize',
  },
  toneText: {
    color: '#BA8FFF',
  },
  confidenceText: {
    color: '#6495ED',
  },
});
