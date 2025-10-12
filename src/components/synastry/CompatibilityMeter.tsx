import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../styles';

// Alchemical symbols for elements
const ELEMENT_SYMBOLS = {
  fire: '🜂',
  earth: '🜃',
  air: '🜁',
  water: '🜄',
};

interface ElementCompatibilityItemProps {
  element: 'fire' | 'earth' | 'air' | 'water';
  score: number;
}

const ElementCompatibilityItem: React.FC<ElementCompatibilityItemProps> = ({ element, score }) => {
  const normalizedScore = Math.max(0, Math.min(100, score));

  const getRating = (score: number): string => {
    if (score >= 80) return 'EXCELLENT';
    if (score >= 60) return 'STRONG';
    if (score >= 40) return 'MODERATE';
    return 'COMPLEX';
  };

  const rating = getRating(normalizedScore);
  const symbol = ELEMENT_SYMBOLS[element];
  const elementName = element.charAt(0).toUpperCase() + element.slice(1);

  return (
    <View style={styles.elementItem}>
      <Text style={styles.elementSymbol}>{symbol}</Text>
      <Text style={styles.elementName}>{elementName}</Text>
      <View style={styles.elementBarBackground}>
        <View
          style={[
            styles.elementBarFill,
            {
              width: `${normalizedScore}%`,
            },
          ]}
        />
      </View>
      <Text style={styles.elementRating}>{rating}</Text>
    </View>
  );
};

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

  const getRating = (score: number): string => {
    if (score >= 80) return 'EXCELLENT';
    if (score >= 60) return 'STRONG';
    if (score >= 40) return 'MODERATE';
    return 'COMPLEX';
  };

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

  // Use simplified vertical layout for small size without percentage
  if (size === 'small' && !showPercentage) {
    return (
      <View style={styles.container}>
        <Text style={[styles.label, { fontSize: sizeConfig.labelSize * 1.3 }]}>{label}</Text>

        {/* Progress bar */}
        <View style={[styles.barBackground, { height: sizeConfig.height }]}>
          <View
            style={[
              styles.barFill,
              {
                width: `${normalizedScore}%`,
                height: sizeConfig.height,
              },
            ]}
          />
        </View>

        <Text style={[styles.rating, { fontSize: sizeConfig.fontSize }]}>
          {rating}
        </Text>

        {/* Description */}
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mainContent}>
        <View style={styles.leftContent}>
          <Text style={[styles.label, { fontSize: sizeConfig.labelSize * 1.3 }]}>{label}</Text>

          {/* Progress bar */}
          <View style={[styles.barBackground, { height: sizeConfig.height }]}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${normalizedScore}%`,
                  height: sizeConfig.height,
                },
              ]}
            />
          </View>

          <Text style={[styles.rating, { fontSize: sizeConfig.fontSize }]}>
            {rating}
          </Text>
        </View>

        {showPercentage && (
          <Text style={[styles.score, { fontSize: sizeConfig.fontSize * 2.5 }]}>
            {normalizedScore}%
          </Text>
        )}
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
          <View style={styles.elementQuadrant}>
            {fire !== undefined && <ElementCompatibilityItem element="fire" score={fire} />}
            {earth !== undefined && <ElementCompatibilityItem element="earth" score={earth} />}
            {air !== undefined && <ElementCompatibilityItem element="air" score={air} />}
            {water !== undefined && <ElementCompatibilityItem element="water" score={water} />}
          </View>
        </View>
      )}

      {/* Modality Compatibility */}
      {(cardinal !== undefined || fixed !== undefined || mutable !== undefined) && (
        <View style={styles.subsection}>
          <Text style={styles.subsectionTitle}>Action Styles</Text>
          <View style={styles.actionStylesRow}>
            {cardinal !== undefined && (
              <View style={styles.actionStyleItem}>
                <CompatibilityMeter
                  score={cardinal}
                  label="Cardinal"
                  size="small"
                  showPercentage={false}
                />
              </View>
            )}
            {fixed !== undefined && (
              <View style={styles.actionStyleItem}>
                <CompatibilityMeter
                  score={fixed}
                  label="Fixed"
                  size="small"
                  showPercentage={false}
                />
              </View>
            )}
            {mutable !== undefined && (
              <View style={styles.actionStyleItem}>
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
  mainContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftContent: {
    flex: 1,
    marginRight: spacing.lg,
  },
  label: {
    fontFamily: 'PTSerif-Regular',
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  score: {
    fontFamily: 'PTSerif-Regular',
    fontWeight: '700',
    color: '#F8D89E',
  },
  rating: {
    ...typography.caption,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    marginTop: spacing.xs,
  },
  barBackground: {
    width: '100%',
    backgroundColor: '#434343',
    borderRadius: 10,
    overflow: 'hidden',
  },
  barFill: {
    borderRadius: 10,
    backgroundColor: '#F8D89E',
  },
  description: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    lineHeight: 16,
  },
  groupContainer: {
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
  elementQuadrant: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  elementItem: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  elementSymbol: {
    fontSize: 40,
    marginBottom: spacing.xs,
    color: '#FFFFFF',
  },
  elementName: {
    fontFamily: 'PTSerif-Regular',
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
    fontSize: 16,
  },
  elementBarBackground: {
    width: '100%',
    height: 6,
    backgroundColor: '#434343',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  elementBarFill: {
    height: 6,
    borderRadius: 10,
    backgroundColor: '#F8D89E',
  },
  elementRating: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
  },
  actionStylesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  actionStyleItem: {
    flex: 1,
  },
});
