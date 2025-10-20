import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProps } from '../types';
import { HeaderBar, LoadingScreen, PlanetIcon, NatalChartWheel } from '../components';
import { useAppStore } from '../store';
import { handleChartGeneration } from '../handlers/chartGeneration';
import { colors, spacing, typography } from '../styles';

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

// Helper function to get house suffix (1st, 2nd, 3rd, etc.)
const getHouseSuffix = (house: number): string => {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = house % 100;
  return suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0];
};

export const NatalChartScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const { natalChart, birthData, setNatalChart, selectPlanet, selectHouse } = useAppStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTabIndex, setCurrentTabIndex] = useState(1); // Default to TABLE tab
  const tabScrollRef = useRef<ScrollView>(null);

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

  // Tab configuration
  const tabs = [
    { id: 'interp', label: 'INTERP.' },
    { id: 'table', label: 'TABLE' },
    { id: 'wheel', label: 'WHEEL' },
  ];

  // Render content based on selected tab
  const renderTabContent = () => {
    const currentTab = tabs[currentTabIndex].id;

    switch (currentTab) {
      case 'interp':
        // Check if we have any interpretations
        const hasWholeChartInterpretation = natalChart?.wholeChartInterpretation;
        const hasPlanetInterpretations = natalChart?.planets &&
          Object.values(natalChart.planets).some(
            planet => planet.personalizedDescription?.detailed
          );

        if (!hasWholeChartInterpretation && !hasPlanetInterpretations) {
          return (
            <View style={styles.tabContent}>
              <Text style={styles.placeholderText}>No Interpretations Available</Text>
              <Text style={styles.placeholderSubtext}>
                Regenerate your chart to get personalized interpretations
              </Text>
            </View>
          );
        }

        return (
          <ScrollView
            style={styles.interpretationScrollView}
            contentContainerStyle={styles.interpretationContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Whole Chart Interpretation */}
            {hasWholeChartInterpretation && (
              <View style={styles.wholeChartCard}>
                <View style={styles.wholeChartHeader}>
                  <Ionicons name="star" size={24} color="#F6D99F" />
                  <Text style={styles.wholeChartTitle}>Your Natal Chart</Text>
                </View>

                {/* Section 1: Core Nature */}
                <View style={styles.interpretationSection}>
                  <Text style={styles.sectionTitle}>Your Core Nature</Text>
                  <Text style={styles.wholeChartText}>
                    {natalChart.wholeChartInterpretation.coreNature}
                  </Text>
                </View>

                {/* Section 2: Love and Connection */}
                <View style={styles.interpretationSection}>
                  <Text style={styles.sectionTitle}>How You Love & Connect</Text>
                  <Text style={styles.wholeChartText}>
                    {natalChart.wholeChartInterpretation.loveAndConnection}
                  </Text>
                </View>

                {/* Section 3: Growth Edge */}
                <View style={styles.interpretationSection}>
                  <Text style={styles.sectionTitle}>Your Growth Edge</Text>
                  <Text style={styles.wholeChartText}>
                    {natalChart.wholeChartInterpretation.growthEdge}
                  </Text>
                </View>

                {/* Section 4: Gifts to the World */}
                <View style={styles.interpretationSection}>
                  <Text style={styles.sectionTitle}>Your Gifts to the World</Text>
                  <Text style={styles.wholeChartText}>
                    {natalChart.wholeChartInterpretation.giftsToWorld}
                  </Text>
                </View>
              </View>
            )}

            {/* Section divider if we have both whole chart and planet interpretations */}
            {hasWholeChartInterpretation && hasPlanetInterpretations && (
              <View style={styles.sectionDivider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>PLANET DETAILS</Text>
                <View style={styles.dividerLine} />
              </View>
            )}

            {/* Individual Planet Interpretations */}
            {hasPlanetInterpretations && Object.entries(natalChart.planets).map(([planetKey, planetData]) => {
              const interpretation = planetData.personalizedDescription;

              if (!interpretation?.detailed) return null;

              return (
                <View key={planetKey} style={styles.interpretationCard}>
                  <View style={styles.interpretationHeader}>
                    <PlanetIcon planet={planetKey} size={24} color="#F6D99F" />
                    <View style={styles.interpretationTitleContainer}>
                      <Text style={styles.interpretationTitle}>
                        {planetKey.toUpperCase()}
                      </Text>
                      <Text style={styles.interpretationSubtitle}>
                        in {planetData.sign} • {planetData.house}{getHouseSuffix(planetData.house)} House
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.interpretationText}>
                    {interpretation.detailed}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        );

      case 'table':
        return (
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
                        <PlanetIcon planet={planet.key} size={16} color={colors.text.primary} />
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
        );

      case 'wheel':
        return (
          <ScrollView
            style={styles.wheelScrollView}
            contentContainerStyle={styles.wheelContentContainer}
            showsVerticalScrollIndicator={false}
          >
            <NatalChartWheel chartData={natalChart} />
          </ScrollView>
        );

      default:
        return null;
    }
  };

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
        <LoadingScreen context="natal-chart" />
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
        <View style={styles.contentWrapper}>
          {/* Tab Navigation */}
          <View style={styles.tabNavContainer}>
            <ScrollView
              ref={tabScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tabNavScroll}
              contentContainerStyle={styles.tabNavContent}
            >
              {tabs.map((tab, index) => (
                <TouchableOpacity
                  key={tab.id}
                  style={styles.tabNavItem}
                  onPress={() => setCurrentTabIndex(index)}
                >
                  <Text
                    style={[
                      styles.tabNavLabel,
                      currentTabIndex === index && styles.activeTabNavLabel,
                    ]}
                  >
                    {tab.label}
                  </Text>
                  {currentTabIndex === index && <View style={styles.tabNavUnderline} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Tab Content */}
          {renderTabContent()}
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
    ...typography.h3,
    fontFamily: 'PTSerif_400Regular',
    color: '#F6D99F',
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
    ...typography.h3,
    color: colors.text.primary,
    textAlign: 'center',
    fontFamily: 'PTSerif_400Regular',
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
  planetName: {
    ...typography.caption,
    fontWeight: '500',
    color: colors.text.primary,
    letterSpacing: 0.5,
    marginLeft: spacing.sm,
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
  contentWrapper: {
    flex: 1,
  },
  // Tab Navigation
  tabNavContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '30',
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.primary,
  },
  tabNavScroll: {
    flexGrow: 0,
  },
  tabNavContent: {
    flexDirection: 'row',
    width: '100%',
  },
  tabNavItem: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabNavLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    letterSpacing: 1,
    fontSize: 12,
  },
  activeTabNavLabel: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  tabNavUnderline: {
    position: 'absolute',
    bottom: 0,
    left: spacing.md,
    right: spacing.md,
    height: 2,
    backgroundColor: colors.text.primary,
  },
  // Tab Content
  tabContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  placeholderText: {
    ...typography.h1,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  placeholderSubtext: {
    ...typography.bodySecondary,
    color: colors.text.secondary,
  },
  // Wheel Tab
  wheelScrollView: {
    flex: 1,
  },
  wheelContentContainer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  // Interpretation Tab
  interpretationScrollView: {
    flex: 1,
  },
  interpretationContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  interpretationCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  interpretationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '30',
  },
  interpretationTitleContainer: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  interpretationTitle: {
    ...typography.h2,
    color: '#F6D99F',
    marginBottom: 2,
  },
  interpretationSubtitle: {
    ...typography.h3,
    color: colors.text.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  interpretationText: {
    ...typography.body,
    color: colors.text.primary,
    lineHeight: 22,
  },
  // Whole Chart Interpretation
  wholeChartCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  wholeChartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '30',
  },
  wholeChartTitle: {
    ...typography.h1,
    color: '#F6D99F',
    marginLeft: spacing.sm,
  },
  wholeChartText: {
    ...typography.body,
    color: colors.text.primary,
    lineHeight: 22,
  },
  interpretationSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h2,
    color: '#F6D99F',
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  // Section Divider
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border + '50',
  },
  dividerText: {
    ...typography.h3,
    color: colors.text.secondary,
    marginHorizontal: spacing.md,
  },
});
