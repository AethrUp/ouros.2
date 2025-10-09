import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { NavigationProps } from '../types';
import { HeaderBar, LoadingSpinner } from '../components';
import { useAppStore } from '../store';
import { handleChartGeneration } from '../handlers/chartGeneration';
import { colors, spacing, typography } from '../styles';

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

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
};

export const NatalChartScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const { natalChart, birthData, setNatalChart, selectPlanet, selectHouse } = useAppStore();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateChart = async () => {
    if (!birthData) {
      Alert.alert('Birth Data Required', 'Please complete your birth data in onboarding first.');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await handleChartGeneration(birthData, {
        houseSystem: 'placidus',
        precision: 'professional',
        includeReports: true,
        includeAspects: true,
        includeMinorAspects: false,
        includeMidpoints: false,
        forceRegenerate: true,
      });

      if (result.success && result.data?.chartData) {
        setNatalChart(result.data.chartData);
        Alert.alert('Success', 'Natal chart generated successfully!');
      } else {
        Alert.alert('Error', result.message || 'Failed to generate chart');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to generate chart');
    } finally {
      setIsGenerating(false);
    }
  };

  // Group planets by sign
  const getTableData = () => {
    if (!natalChart?.planets) return [];

    const planetGroups: any[] = [];
    const signGroups: Record<string, any[]> = {};

    // Group planets by sign
    Object.entries(natalChart.planets).forEach(([planetKey, data]) => {
      const sign = data.sign;
      if (!signGroups[sign]) {
        signGroups[sign] = [];
      }
      signGroups[sign].push({
        name: planetKey.toUpperCase(),
        symbol: PLANET_SYMBOLS[planetKey] || '●',
        sign: sign,
        house: data.house,
        key: planetKey,
      });
    });

    // Create ordered groups
    ZODIAC_SIGNS.forEach((zodiacSign) => {
      if (signGroups[zodiacSign]) {
        planetGroups.push({
          sign: zodiacSign,
          planets: signGroups[zodiacSign],
        });
      }
    });

    return planetGroups;
  };

  const tableData = getTableData();

  return (
    <View style={styles.container}>
      <HeaderBar
        title="Natal Chart"
        rightActions={[
          {
            icon: 'refresh',
            onPress: handleGenerateChart,
            disabled: isGenerating,
          },
        ]}
      />

      {isGenerating ? (
        <LoadingSpinner size="large" text="Generating chart..." />
      ) : !natalChart ? (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataTitle}>Generate Chart</Text>
          <Text style={styles.noDataText}>
            Generate your natal chart with professional calculations.
          </Text>
          <TouchableOpacity style={styles.generateButton} onPress={handleGenerateChart}>
            <Text style={styles.generateButtonText}>GENERATE CHART</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.tableContainer}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <View style={styles.signHeaderCell}>
              <Text style={styles.columnHeader}>SIGNS</Text>
            </View>
            <View style={styles.planetHeaderCell}>
              <Text style={styles.columnHeader}>PLANETS</Text>
            </View>
            <View style={styles.houseHeaderCell}>
              <Text style={styles.columnHeader}>HOUSES</Text>
            </View>
          </View>

          {/* Table Body */}
          <ScrollView style={styles.tableBody} showsVerticalScrollIndicator={false}>
            {tableData.map((signGroup, signIndex) => (
              <View key={signGroup.sign} style={styles.signGroupContainer}>
                {signGroup.planets.map((planet: any, planetIndex: number) => (
                  <View key={planet.key} style={styles.tableRow}>
                    {/* Sign cell - only show for first planet in the sign group */}
                    {planetIndex === 0 && (
                      <View
                        style={[
                          styles.signCell,
                          { height: signGroup.planets.length * 50 },
                        ]}
                      >
                        <Text style={styles.signText}>{signGroup.sign}</Text>
                      </View>
                    )}

                    {/* Planet cell */}
                    <TouchableOpacity
                      style={styles.planetCell}
                      onPress={() => {
                        selectPlanet(planet.key);
                        navigation.navigate('PlanetDetail', { planetKey: planet.key });
                      }}
                    >
                      <Text style={styles.planetSymbol}>{planet.symbol}</Text>
                      <Text style={styles.planetName}>{planet.name}</Text>
                    </TouchableOpacity>

                    {/* House cell - only show for first planet in the sign group */}
                    {planetIndex === 0 && (
                      <TouchableOpacity
                        style={[
                          styles.houseCell,
                          { height: signGroup.planets.length * 50 },
                        ]}
                        onPress={() => selectHouse(planet.house)}
                      >
                        <Text style={styles.houseNumber}>{planet.house}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  noDataContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  noDataTitle: {
    ...typography.h1,
    fontSize: 32,
    color: colors.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  noDataText: {
    ...typography.h4,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  generateButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 10,
    minWidth: 200,
  },
  generateButtonText: {
    ...typography.button,
    color: colors.background.primary,
    textAlign: 'center',
    letterSpacing: 1.2,
  },
  tableContainer: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  signHeaderCell: {
    width: 110,
    paddingRight: spacing.md,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planetHeaderCell: {
    flex: 1,
    paddingHorizontal: spacing.md,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  houseHeaderCell: {
    width: 80,
    paddingLeft: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  columnHeader: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text.secondary,
    letterSpacing: 1,
    textAlign: 'center',
  },
  tableBody: {
    flex: 1,
  },
  signGroupContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRow: {
    flexDirection: 'row',
    position: 'relative',
  },
  signCell: {
    width: 110,
    paddingRight: spacing.md,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    position: 'absolute',
    left: 0,
    top: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  signText: {
    ...typography.body,
    fontWeight: '500',
    color: colors.text.primary,
    textAlign: 'center',
  },
  planetCell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 50,
    marginLeft: 110,
    marginRight: 80,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    flex: 1,
  },
  planetSymbol: {
    fontSize: 20,
    color: colors.text.primary,
    textAlign: 'center',
    marginRight: spacing.sm,
  },
  planetName: {
    ...typography.body,
    fontWeight: '500',
    color: colors.text.primary,
    letterSpacing: 0.3,
  },
  houseCell: {
    width: 80,
    paddingLeft: spacing.md,
    position: 'absolute',
    right: 0,
    top: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  houseNumber: {
    ...typography.h4,
    color: colors.text.primary,
    fontFamily: 'Inter',
  },
});
