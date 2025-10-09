import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../styles';

interface CompatibilityMeterProps {
  score: number;
  label: string;
  description?: string;
  size?: 'small' | 'medium' | 'large';
  showPercentage?: boolean;
}

export const CompatibilityMeter: React.FC<CompatibilityMeterProps> = ({
  score,
  label,
  description,
  size = 'medium',
  showPercentage = true,
}) => {
  // Ensure score is between 0 and 100
  const normalizedScore = Math.max(0, Math.min(100, score));

  // Determine color based on score
  const getColor = (score: number): string => {
    if (score >= 80) return '#4CAF50'; // Green - Excellent
    if (score >= 60) return '#8BC34A'; // Light Green - Good
    if (score >= 40) return '#FFC107'; // Amber - Fair
    return '#FF9800'; // Orange - Challenging
  };

  const getRating = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Strong';
    if (score >= 40) return 'Moderate';
    return 'Complex';
  };

  const barColor = getColor(normalizedScore);
  const rating = getRating(normalizedScore);

  const sizes = {
    small: {
      height: 6,
      fontSize: 12,
      labelSize: 12,
    },
    medium: {
      height: 8,
      fontSize: 14,
      labelSize: 14,
    },
    large: {
      height: 10,
      fontSize: 16,
      labelSize: 16,
    },
  };

  const sizeConfig = sizes[size];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.label, { fontSize: sizeConfig.labelSize }]}>{label}</Text>
        <View style={styles.scoreContainer}>
          {showPercentage && (
            <Text style={[styles.score, { fontSize: sizeConfig.fontSize, color: barColor }]}>
              {normalizedScore}%
            </Text>
          )}
          <Text style={[styles.rating, { fontSize: sizeConfig.fontSize, color: barColor }]}>
            {rating}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={[styles.barBackground, { height: sizeConfig.height }]}>
        <View
          style={[
            styles.barFill,
            {
              width: `${normalizedScore}%`,
              backgroundColor: barColor,
              height: sizeConfig.height,
            },
          ]}
        />
      </View>

      {/* Description */}
      {description && <Text style={styles.description}>{description}</Text>}
    </View>
  );
};

interface CompatibilityMeterGroupProps {
  overall: number;
  fire?: number;
  earth?: number;
  air?: number;
  water?: number;
  cardinal?: number;
  fixed?: number;
  mutable?: number;
}

export const CompatibilityMeterGroup: React.FC<CompatibilityMeterGroupProps> = ({
  overall,
  fire,
  earth,
  air,
  water,
  cardinal,
  fixed,
  mutable,
}) => {
  return (
    <View style={styles.groupContainer}>
      {/* Overall Compatibility - Larger */}
      <View style={styles.overallSection}>
        <CompatibilityMeter score={overall} label="Overall Compatibility" size="large" />
      </View>

      {/* Element Compatibility */}
      {(fire !== undefined || earth !== undefined || air !== undefined || water !== undefined) && (
        <View style={styles.subsection}>
          <Text style={styles.subsectionTitle}>Elemental Harmony</Text>
          <View style={styles.metersGrid}>
            {fire !== undefined && (
              <View style={styles.gridItem}>
                <CompatibilityMeter
                  score={fire}
                  label="Fire 🔥"
                  size="small"
                  showPercentage={false}
                />
              </View>
            )}
            {earth !== undefined && (
              <View style={styles.gridItem}>
                <CompatibilityMeter
                  score={earth}
                  label="Earth 🌍"
                  size="small"
                  showPercentage={false}
                />
              </View>
            )}
            {air !== undefined && (
              <View style={styles.gridItem}>
                <CompatibilityMeter
                  score={air}
                  label="Air 💨"
                  size="small"
                  showPercentage={false}
                />
              </View>
            )}
            {water !== undefined && (
              <View style={styles.gridItem}>
                <CompatibilityMeter
                  score={water}
                  label="Water 💧"
                  size="small"
                  showPercentage={false}
                />
              </View>
            )}
          </View>
        </View>
      )}

      {/* Modality Compatibility */}
      {(cardinal !== undefined || fixed !== undefined || mutable !== undefined) && (
        <View style={styles.subsection}>
          <Text style={styles.subsectionTitle}>Action Styles</Text>
          <View style={styles.metersGrid}>
            {cardinal !== undefined && (
              <View style={styles.gridItem}>
                <CompatibilityMeter
                  score={cardinal}
                  label="Cardinal"
                  size="small"
                  showPercentage={false}
                />
              </View>
            )}
            {fixed !== undefined && (
              <View style={styles.gridItem}>
                <CompatibilityMeter
                  score={fixed}
                  label="Fixed"
                  size="small"
                  showPercentage={false}
                />
              </View>
            )}
            {mutable !== undefined && (
              <View style={styles.gridItem}>
                <CompatibilityMeter
                  score={mutable}
                  label="Mutable"
                  size="small"
                  showPercentage={false}
                />
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  score: {
    ...typography.body,
    fontWeight: '700',
  },
  rating: {
    ...typography.caption,
    fontWeight: '600',
  },
  barBackground: {
    width: '100%',
    backgroundColor: colors.background.tertiary,
    borderRadius: 10,
    overflow: 'hidden',
  },
  barFill: {
    borderRadius: 10,
  },
  description: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    lineHeight: 16,
  },
  groupContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  overallSection: {
    marginBottom: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  subsection: {
    marginBottom: spacing.lg,
  },
  subsectionTitle: {
    ...typography.h3,
    fontSize: 14,
    color: colors.text.primary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  gridItem: {
    width: '50%',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
});
