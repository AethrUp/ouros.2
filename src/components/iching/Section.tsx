/**
 * Section Component
 * Reusable section with title and content
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { typography, spacing } from '../../styles';

interface SectionProps {
  title: string;
  highlighted?: boolean;
  children: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({
  title,
  highlighted = false,
  children,
}) => {
  return (
    <View style={styles.section}>
      <Text style={[styles.title, highlighted && styles.highlightedTitle]}>
        {title}
      </Text>
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: 'PTSerif_400Regular',
    fontSize: 20,
    fontWeight: '400',
    color: '#F6D99F',
    marginBottom: spacing.sm,
  },
  highlightedTitle: {
    color: '#F6D99F',
  },
  content: {
    marginTop: spacing.xs,
  },
});
