/**
 * Planet Detail Screen
 * Displays detailed information about a selected planet in the natal chart
 * Including: position, aspects, and space for AI interpretation
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProps } from '../types';
import { useAppStore } from '../store';
import { colors, spacing, typography } from '../styles';
import { AspectData, PlanetPosition } from '../types/user';
import { ZodiacIcon } from '../components';

interface PlanetDetailScreenProps extends NavigationProps {
  route: {
    params: {
      planetKey: string;
    };
  };
}

// Planet symbol mapping (keys match Swiss Ephemeris API capitalization)
const PLANET_SYMBOLS: Record<string, string> = {
  Sun: '☉',
  Moon: '☽',
  Mercury: '☿',
  Venus: '♀',
  Mars: '♂',
  Jupiter: '♃',
  Saturn: '♄',
  Uranus: '♅',
  Neptune: '♆',
  Pluto: '♇',
  'North Node': '☊',
  'South Node': '☋',
  Chiron: '⚷',
};

// Planet display names (keys match Swiss Ephemeris API capitalization)
const PLANET_NAMES: Record<string, string> = {
  Sun: 'Sun',
  Moon: 'Moon',
  Mercury: 'Mercury',
  Venus: 'Venus',
  Mars: 'Mars',
  Jupiter: 'Jupiter',
  Saturn: 'Saturn',
  Uranus: 'Uranus',
  Neptune: 'Neptune',
  Pluto: 'Pluto',
  'North Node': 'North Node',
  'South Node': 'South Node',
  Chiron: 'Chiron',
};

// Aspect symbols
const ASPECT_SYMBOLS: Record<string, string> = {
  conjunction: '☌',
  opposition: '☍',
  trine: '△',
  square: '□',
  sextile: '⚹',
  semi_sextile: '⚺',
  quintile: 'Q',
  bi_quintile: 'bQ',
  quincunx: '⚻',
};

// Aspect display names
const ASPECT_NAMES: Record<string, string> = {
  conjunction: 'Conjunction',
  opposition: 'Opposition',
  trine: 'Trine',
  square: 'Square',
  sextile: 'Sextile',
  semi_sextile: 'Semi-Sextile',
  quintile: 'Quintile',
  bi_quintile: 'Bi-Quintile',
  quincunx: 'Quincunx',
};

// Zodiac sign symbols
const SIGN_SYMBOLS: Record<string, string> = {
  aries: '♈',
  taurus: '♉',
  gemini: '♊',
  cancer: '♋',
  leo: '♌',
  virgo: '♍',
  libra: '♎',
  scorpio: '♏',
  sagittarius: '♐',
  capricorn: '♑',
  aquarius: '♒',
  pisces: '♓',
};

// Aspect strength colors
const getAspectStrengthColor = (strength: number): string => {
  if (strength >= 0.8) return colors.text.primary;
  if (strength >= 0.5) return colors.text.primary + 'CC';
  return colors.text.secondary;
};

// Convert decimal degrees to degrees and minutes
const formatDegrees = (decimalDegrees: number): string => {
  const degrees = Math.floor(decimalDegrees);
  const minutes = Math.floor((decimalDegrees - degrees) * 60);
  return `${degrees}°${minutes.toString().padStart(2, '0')}'`;
};

// Get degree within sign (0-30)
const getDegreeInSign = (absoluteDegree: number): number => {
  return absoluteDegree % 30;
};

export const PlanetDetailScreen: React.FC<PlanetDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { planetKey } = route.params;
  const { natalChart } = useAppStore();

  // Get planet data
  const planetData: PlanetPosition | null = useMemo(() => {
    if (!natalChart?.planets) return null;
    return natalChart.planets[planetKey] || null;
  }, [natalChart, planetKey]);

  // Filter aspects related to this planet
  const relatedAspects: AspectData[] = useMemo(() => {
    if (!natalChart?.aspects) return [];
    return natalChart.aspects.filter(
      (aspect) => aspect.planet1 === planetKey || aspect.planet2 === planetKey
    );
  }, [natalChart, planetKey]);

  // Validate planet exists
  if (!planetData) {
    React.useEffect(() => {
      Alert.alert('Error', 'Planet data not found', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    }, []);

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Planet not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const planetName = PLANET_NAMES[planetKey] || planetKey;
  const planetSymbol = PLANET_SYMBOLS[planetKey] || '●';
  const signSymbol = SIGN_SYMBOLS[planetData.sign.toLowerCase()] || '';
  const degreeInSign = getDegreeInSign(planetData.degree);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerSymbol}>{planetSymbol}</Text>
          <Text style={styles.headerTitle}>{planetName}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Planet Position */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>POSITION</Text>

          <View style={styles.positionContainer}>
            {/* Sign */}
            <View style={styles.positionItem}>
              <ZodiacIcon sign={planetData.sign} size={32} color={colors.text.primary} />
              <Text style={styles.positionItemLabel}>SIGN</Text>
            </View>

            {/* House */}
            <View style={styles.positionItem}>
              <Text style={styles.positionItemValue}>{planetData.house}</Text>
              <Text style={styles.positionItemLabel}>HOUSE</Text>
            </View>

            {/* Longitude */}
            <View style={styles.positionItem}>
              <Text style={styles.positionItemValue}>{formatDegrees(planetData.degree)}</Text>
              <Text style={styles.positionItemLabel}>LONGITUDE</Text>
            </View>
          </View>

          {/* Retrograde status */}
          {planetData.retrograde && (
            <View style={styles.retrogradeNotice}>
              <Text style={styles.retrogradeNoticeSymbol}>℞</Text>
              <Text style={styles.retrogradeNoticeText}>
                This planet is currently in retrograde motion, appearing to move
                backward through the zodiac from Earth's perspective.
              </Text>
            </View>
          )}
        </View>

        {/* AI Interpretation Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INTERPRETATION</Text>

          {planetData.personalizedDescription ? (
            <View style={styles.interpretationContent}>
              <Text style={styles.interpretationText}>
                {planetData.personalizedDescription.detailed}
              </Text>

              {planetData.personalizedDescription.keywords &&
               planetData.personalizedDescription.keywords.length > 0 && (
                <View style={styles.keywordsContainer}>
                  <Text style={styles.keywordsLabel}>Keywords:</Text>
                  <Text style={styles.keywordsText}>
                    {planetData.personalizedDescription.keywords.join(' • ')}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.interpretationPlaceholder}>
              <Text style={styles.interpretationPlaceholderIcon}>✨</Text>
              <Text style={styles.interpretationPlaceholderText}>
                AI-powered interpretation coming soon
              </Text>
              <Text style={styles.interpretationPlaceholderSubtext}>
                Get personalized insights about {planetName} in {planetData.sign},
                House {planetData.house}
              </Text>
            </View>
          )}
        </View>

        {/* Aspects Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            ASPECTS ({relatedAspects.length})
          </Text>

          {relatedAspects.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No major aspects found for this planet.
              </Text>
            </View>
          ) : (
            <View style={styles.aspectsGrid}>
              {relatedAspects.map((aspect, index) => {
                // Determine which planet is the "other" planet
                const otherPlanetKey =
                  aspect.planet1 === planetKey ? aspect.planet2 : aspect.planet1;
                const otherPlanetName =
                  PLANET_NAMES[otherPlanetKey] || otherPlanetKey;
                const otherPlanetSymbol = PLANET_SYMBOLS[otherPlanetKey] || '●';
                const aspectSymbol = ASPECT_SYMBOLS[aspect.type] || '•';
                const aspectName = ASPECT_NAMES[aspect.type] || aspect.type;
                const strengthColor = getAspectStrengthColor(aspect.strength ?? 0);

                return (
                  <View
                    key={aspect.id}
                    style={styles.aspectCard}
                  >
                    {/* Planet name and symbol */}
                    <View style={styles.aspectCardHeader}>
                      <Text style={styles.aspectCardPlanetSymbol}>
                        {otherPlanetSymbol}
                      </Text>
                      <Text style={styles.aspectCardPlanetName}>
                        {otherPlanetName}
                      </Text>
                    </View>

                    {/* Aspect type */}
                    <Text style={styles.aspectCardType}>
                      {aspectSymbol} {aspectName.toUpperCase()}
                    </Text>

                    {/* Aspect details - 2 values in a row */}
                    <View style={styles.aspectCardDetails}>
                      <View style={styles.aspectCardDetailItem}>
                        <Text style={styles.aspectCardDetailValue}>
                          {aspect.orb !== undefined ? `${aspect.orb.toFixed(2)}°` : '—'}
                        </Text>
                        <Text style={styles.aspectCardDetailLabel}>ORB</Text>
                      </View>

                      <View style={styles.aspectCardDetailItem}>
                        <Text
                          style={[
                            styles.aspectCardDetailValue,
                            { color: strengthColor },
                          ]}
                        >
                          {aspect.strength !== undefined ? `${(aspect.strength * 100).toFixed(0)}%` : '—'}
                        </Text>
                        <Text style={styles.aspectCardDetailLabel}>STG</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButtonText: {
    ...typography.h1,
    fontSize: 28,
    color: colors.text.primary,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  headerSymbol: {
    fontSize: 28,
    color: colors.text.primary,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text.primary,
  },
  headerRight: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  positionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.lg,
  },
  positionItem: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  positionItemValue: {
    ...typography.h2,
    fontSize: 32,
    color: colors.text.primary,
  },
  positionItemLabel: {
    ...typography.h3,
    color: colors.text.secondary,
  },
  retrogradeNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  retrogradeNoticeSymbol: {
    fontSize: 20,
    color: colors.primary,
  },
  retrogradeNoticeText: {
    ...typography.caption,
    color: colors.text.secondary,
    flex: 1,
  },
  aspectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  aspectCard: {
    width: '47%', // Slightly less than 50% to account for gap
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  aspectCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  aspectCardPlanetSymbol: {
    fontSize: 20,
    color: colors.text.primary,
  },
  aspectCardPlanetName: {
    ...typography.h2,
    fontSize: 18,
    color: '#F6D99F',
  },
  aspectCardType: {
    ...typography.h3,
    fontSize: 12,
    marginBottom: spacing.md,
  },
  aspectCardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  aspectCardDetailItem: {
    flex: 1,
    alignItems: 'center',
  },
  aspectCardDetailValue: {
    ...typography.body,
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.primary,
    marginBottom: 2,
  },
  aspectCardDetailLabel: {
    ...typography.h3,
    fontSize: 11,
    color: colors.text.secondary,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyStateText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  interpretationContent: {
    paddingTop: spacing.sm,
  },
  interpretationText: {
    ...typography.body,
    color: colors.text.primary,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  keywordsContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  keywordsLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  keywordsText: {
    ...typography.body,
    color: '#F6D99F',
    fontStyle: 'italic',
  },
  interpretationPlaceholder: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  interpretationPlaceholderIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  interpretationPlaceholderText: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  interpretationPlaceholderSubtext: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  bottomSpacer: {
    height: spacing.xl * 2,
  },
});
