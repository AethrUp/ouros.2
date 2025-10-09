/**
 * Structured Interpretation View Component
 * Displays structured I Ching interpretation with sections
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { IChingInterpretation } from '../../types/iching';
import { Section } from './Section';
import { Badge } from './Badge';
import { colors, typography, spacing } from '../../styles';

interface StructuredInterpretationViewProps {
  interpretationData: IChingInterpretation;
}

export const StructuredInterpretationView: React.FC<
  StructuredInterpretationViewProps
> = ({ interpretationData }) => {
  const { interpretation, tone, confidence } = interpretationData;

  return (
    <Animated.View entering={FadeIn.delay(300)} style={styles.container}>
      {/* Metadata indicators */}
      <View style={styles.metadataRow}>
        <Badge text={tone} type="tone" />
        <Badge text={`${confidence} confidence`} type="confidence" />
      </View>

      {/* Overview */}
      <Section title="Overview">
        <Text style={styles.bodyText}>{interpretation.overview}</Text>
      </Section>

      {/* Present Situation */}
      <Section title="Present Situation">
        <Text style={styles.bodyText}>{interpretation.present_situation}</Text>
      </Section>

      {/* Trigram Dynamics */}
      <Section title="The Energies at Play">
        <Text style={styles.bodyText}>{interpretation.trigram_dynamics}</Text>
      </Section>

      {/* Changing Lines (if present) */}
      {interpretation.changing_lines && (
        <Section title="Lines of Transformation">
          <Text style={styles.bodyText}>{interpretation.changing_lines}</Text>
        </Section>
      )}

      {/* Transformation (if relating hexagram exists) */}
      {interpretation.transformation && (
        <Section title="The Journey Ahead">
          <Text style={styles.bodyText}>{interpretation.transformation}</Text>
        </Section>
      )}

      {/* Guidance */}
      <Section title="Guidance">
        <Text style={styles.bodyText}>{interpretation.guidance}</Text>
      </Section>

      {/* Timing */}
      <Section title="Timing & Rhythm">
        <Text style={styles.bodyText}>{interpretation.timing}</Text>
      </Section>

      {/* Key Insight - Highlighted */}
      <Section title="Key Insight" highlighted={true}>
        <Text style={styles.keyInsightText}>{interpretation.key_insight}</Text>
      </Section>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.md,
  },
  metadataRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    flexWrap: 'wrap',
  },
  bodyText: {
    ...typography.body,
    fontSize: 15,
    lineHeight: 24,
    color: colors.text.primary,
  },
  keyInsightText: {
    ...typography.body,
    fontSize: 16,
    lineHeight: 26,
    color: '#BA8FFF',
    fontWeight: '500',
  },
});
