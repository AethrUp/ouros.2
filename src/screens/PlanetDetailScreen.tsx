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

interface PlanetDetailScreenProps extends NavigationProps {
  route: {
    params: {
      planetKey: string;
    };
  };
}

// Planet symbol mapping
const PLANET_SYMBOLS: Record<string, string> = {
  sun: '☉',
  moon: '☽',
  mercury: '☿',
  venus: '♀',
  mars: '♂',
  jupiter: '♃',
  saturn: '♄',
  uranus: '♅',
  neptune: '♆',
  pluto: '♇',
  north_node: '☊',
  south_node: '☋',
  chiron: '⚷',
};

// Planet display names
const PLANET_NAMES: Record<string, string> = {
  sun: 'Sun',
  moon: 'Moon',
  mercury: 'Mercury',
  venus: 'Venus',
  mars: 'Mars',
  jupiter: 'Jupiter',
  saturn: 'Saturn',
  uranus: 'Uranus',
  neptune: 'Neptune',
  pluto: 'Pluto',
  north_node: 'North Node',
  south_node: 'South Node',
  chiron: 'Chiron',
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

          <View style={styles.positionList}>
            {/* Sign placement */}
            <View style={styles.positionRow}>
              <Text style={styles.positionLabel}>Sign</Text>
              <View style={styles.positionValueContainer}>
                <Text style={styles.positionValue}>
                  {formatDegrees(degreeInSign)} {signSymbol} {planetData.sign}
                </Text>
                {planetData.retrograde && (
                  <Text style={styles.retrogradeIndicator}>℞</Text>
                )}
              </View>
            </View>

            {/* House placement */}
            <View style={styles.positionRow}>
              <Text style={styles.positionLabel}>House</Text>
              <Text style={styles.positionValue}>{planetData.house}</Text>
            </View>

            {/* Absolute longitude */}
            <View style={styles.positionRow}>
              <Text style={styles.positionLabel}>Longitude</Text>
              <Text style={styles.positionValue}>
                {formatDegrees(planetData.degree)}
              </Text>
            </View>

            {/* Speed */}
            {planetData.speed !== undefined && (
              <View style={styles.positionRow}>
                <Text style={styles.positionLabel}>Speed</Text>
                <Text style={styles.positionValue}>
                  {planetData.speed.toFixed(4)}° /day
                </Text>
              </View>
            )}

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
            <View style={styles.aspectsList}>
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
                  <TouchableOpacity
                    key={aspect.id}
                    style={styles.aspectItem}
                    activeOpacity={0.7}
                    onPress={() => {
                      // Future: Navigate to aspect detail or show modal
                      Alert.alert(
                        aspectName,
                        `${planetName} ${aspectName} ${otherPlanetName}\n\n` +
                          (aspect.angle !== undefined ? `Angle: ${aspect.angle.toFixed(2)}°\n` : '') +
                          (aspect.orb !== undefined ? `Orb: ${aspect.orb.toFixed(2)}°\n` : '') +
                          (aspect.strength !== undefined ? `Strength: ${(aspect.strength * 100).toFixed(0)}%\n` : '') +
                          (aspect.applying !== undefined ? `${aspect.applying ? 'Applying' : 'Separating'}` : '')
                      );
                    }}
                  >
                    {/* Aspect header */}
                    <View style={styles.aspectHeader}>
                      <View style={styles.aspectTitleRow}>
                        <Text style={styles.aspectSymbol}>{aspectSymbol}</Text>
                        <Text style={styles.aspectName}>{aspectName}</Text>
                      </View>
                      <View style={styles.aspectOtherPlanet}>
                        <Text style={styles.aspectOtherSymbol}>
                          {otherPlanetSymbol}
                        </Text>
                        <Text style={styles.aspectOtherName}>{otherPlanetName}</Text>
                      </View>
                    </View>

                    {/* Aspect details */}
                    <View style={styles.aspectDetails}>
                      <View style={styles.aspectDetailItem}>
                        <Text style={styles.aspectDetailLabel}>Orb</Text>
                        <Text style={styles.aspectDetailValue}>
                          {aspect.orb !== undefined ? `${aspect.orb.toFixed(2)}°` : '—'}
                        </Text>
                      </View>
                      <View style={styles.aspectDetailItem}>
                        <Text style={styles.aspectDetailLabel}>Strength</Text>
                        <Text
                          style={[
                            styles.aspectDetailValue,
                            { color: strengthColor },
                          ]}
                        >
                          {aspect.strength !== undefined ? `${(aspect.strength * 100).toFixed(0)}%` : '—'}
                        </Text>
                      </View>
                      <View style={styles.aspectDetailItem}>
                        <Text style={styles.aspectDetailLabel}>Type</Text>
                        <Text style={styles.aspectDetailValue}>
                          {aspect.applying !== undefined ? (aspect.applying ? 'Applying' : 'Separating') : '—'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* AI Interpretation Section - Placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INTERPRETATION</Text>

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
  positionList: {
    // No card styling - just the list
  },
  positionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  positionLabel: {
    ...typography.body,
    color: colors.text.secondary,
  },
  positionValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  positionValue: {
    ...typography.body,
    color: colors.text.primary,
  },
  retrogradeIndicator: {
    fontSize: 18,
    color: colors.primary,
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
  aspectsList: {
    // No card styling
  },
  aspectItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  aspectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  aspectTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  aspectSymbol: {
    fontSize: 18,
    color: colors.text.primary,
  },
  aspectName: {
    ...typography.body,
    color: colors.text.primary,
  },
  aspectOtherPlanet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  aspectOtherSymbol: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  aspectOtherName: {
    ...typography.body,
    color: colors.text.secondary,
  },
  aspectDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  aspectDetailItem: {
    flex: 1,
    alignItems: 'center',
  },
  aspectDetailLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  aspectDetailValue: {
    ...typography.body,
    color: colors.text.primary,
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
