import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../styles';
import { useAppStore } from '../store';
import { NavigationProps } from '../types';
import { SynastryChart } from '../types/synastry';

export const DailySynastryForecastScreen: React.FC<NavigationProps> = ({ navigation, route }) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const isMountedRef = useRef(true);
  const [activeTab, setActiveTab] = useState(0);
  const [sectionPositions, setSectionPositions] = useState<Record<string, number>>({});
  const [isNavigating, setIsNavigating] = useState(false);

  // Get route params
  const synastryChart: SynastryChart = route?.params?.synastryChart;
  const person1Chart = route?.params?.person1Chart;
  const person2Chart = route?.params?.person2Chart;
  const person1Profile = route?.params?.person1Profile;
  const person2Profile = route?.params?.person2Profile;
  const person1Name = route?.params?.person1Name;
  const person2Name = route?.params?.person2Name;
  const connectionId = route?.params?.connectionId;
  const savedChartId = route?.params?.savedChartId;

  // Get data from store
  const {
    dailySynastryForecasts,
    isLoadingForecast,
    isGeneratingForecast,
    forecastError,
    loadDailySynastryForecast,
  } = useAppStore();

  // Get forecast for this synastry chart
  const forecast = synastryChart ? dailySynastryForecasts[synastryChart.id] : null;

  // Reset flag on mount and cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load forecast on mount
  useEffect(() => {
    if (synastryChart && person1Chart && person2Chart && person1Profile && person2Profile && !forecast) {
      loadForecast();
    }
  }, [synastryChart, person1Chart, person2Chart, person1Profile, person2Profile]);

  const loadForecast = async (forceRegenerate = false) => {
    if (!synastryChart || !person1Chart || !person2Chart || !person1Profile || !person2Profile) {
      console.log('⏸️ Missing required data for forecast generation');
      return;
    }

    // Guard against concurrent generation
    if (isGeneratingForecast) {
      console.log('⏸️ Forecast generation already in progress...');
      return;
    }

    try {
      await loadDailySynastryForecast(
        synastryChart,
        person1Chart,
        person2Chart,
        person1Profile,
        person2Profile,
        person1Name,
        person2Name,
        connectionId,
        savedChartId,
        { forceRegenerate }
      );
    } catch (error: any) {
      console.error('Error loading forecast:', error);
    }
  };

  // Section configuration
  const sections = [
    { id: 'forecasts', label: 'Daily Forecast', shortLabel: 'FORECAST' },
    { id: 'advice', label: 'Advice & Activities', shortLabel: 'ADVICE' },
    { id: 'transits', label: 'Transit Analysis', shortLabel: 'TRANSITS' },
  ];

  // Measure section positions for scroll navigation
  const measureSection = (sectionId: string, event: any) => {
    const { y } = event.nativeEvent.layout;
    setSectionPositions((prev) => ({
      ...prev,
      [sectionId]: y,
    }));
  };

  // Scroll to section when dot is pressed
  const handleSectionPress = (index: number, sectionId: string) => {
    setActiveTab(index);
    setIsNavigating(true);

    setTimeout(() => {
      setIsNavigating(false);
    }, 600);

    const position = sectionPositions[sectionId];
    if (scrollViewRef.current && position !== undefined) {
      scrollViewRef.current.scrollTo({ y: position - 100, animated: true });
    }
  };

  // Update active tab based on scroll position
  const handleScroll = (event: any) => {
    if (isNavigating) return;

    const scrollY = event.nativeEvent.contentOffset.y;
    let newActiveTab = 0;

    Object.entries(sectionPositions).forEach(([sectionId, position], index) => {
      if (scrollY >= position - 150) {
        newActiveTab = index;
      }
    });

    if (newActiveTab !== activeTab) {
      setActiveTab(newActiveTab);
    }
  };

  // Get current date for header
  const getCurrentDate = () => {
    const today = new Date();
    return today
      .toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
      .toUpperCase();
  };

  // Loading state
  if (isLoadingForecast || isGeneratingForecast) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.text.primary} />
          <Text style={styles.loadingText}>Generating your relationship forecast...</Text>
          <Text style={styles.loadingSubtext}>
            Analyzing transits for {person1Name} & {person2Name}
          </Text>
        </View>
        <StatusBar style="light" />
      </SafeAreaView>
    );
  }

  // Error state
  if (forecastError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={48} color={colors.text.secondary} />
          <Text style={styles.errorTitle}>Unable to Generate Forecast</Text>
          <Text style={styles.errorText}>{forecastError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadForecast(true)}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
        <StatusBar style="light" />
      </SafeAreaView>
    );
  }

  // No data state
  if (!forecast) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="heart-outline" size={48} color={colors.text.secondary} />
          <Text style={styles.errorTitle}>No Forecast Available</Text>
          <Text style={styles.errorText}>Unable to load relationship forecast</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
        <StatusBar style="light" />
      </SafeAreaView>
    );
  }

  // Get energy rating color
  const getEnergyColor = (rating: string) => {
    switch (rating) {
      case 'harmonious':
        return '#4CAF50';
      case 'intense':
        return '#FF9800';
      case 'challenging':
        return '#F44336';
      case 'transformative':
        return '#9C27B0';
      default:
        return colors.text.primary;
    }
  };

  // Render time-based forecasts
  const renderForecasts = () => {
    const { morningForecast, afternoonForecast, eveningForecast } = forecast.fullContent;

    return (
      <View onLayout={(e) => measureSection('forecasts', e)} style={styles.section}>
        <View style={styles.introductionSection}>
          <Text style={[styles.titleText, { paddingHorizontal: 0, marginBottom: spacing.sm }]}>
            Today's Relationship Energy
          </Text>
          <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: spacing.xs }]}>
            {forecast.preview.title}
          </Text>
          <View style={styles.energyBadge}>
            <Text
              style={[
                styles.energyText,
                { color: getEnergyColor(forecast.preview.energyRating) },
              ]}
            >
              {forecast.preview.energyRating.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.bodyText}>{forecast.preview.summary}</Text>
        </View>

        {/* Morning */}
        <View style={styles.timeSection}>
          <View style={styles.timeSectionHeader}>
            <Ionicons name="sunny-outline" size={24} color={colors.text.primary} />
            <Text style={[styles.sectionTitle, { marginTop: 0, marginLeft: spacing.sm }]}>
              Morning (6am-12pm)
            </Text>
          </View>
          <Text style={styles.bodyText}>{morningForecast}</Text>
        </View>

        {/* Afternoon */}
        <View style={styles.timeSection}>
          <View style={styles.timeSectionHeader}>
            <Ionicons name="partly-sunny-outline" size={24} color={colors.text.primary} />
            <Text style={[styles.sectionTitle, { marginTop: 0, marginLeft: spacing.sm }]}>
              Afternoon (12pm-6pm)
            </Text>
          </View>
          <Text style={styles.bodyText}>{afternoonForecast}</Text>
        </View>

        {/* Evening */}
        <View style={styles.timeSection}>
          <View style={styles.timeSectionHeader}>
            <Ionicons name="moon-outline" size={24} color={colors.text.primary} />
            <Text style={[styles.sectionTitle, { marginTop: 0, marginLeft: spacing.sm }]}>
              Evening (6pm-12am)
            </Text>
          </View>
          <Text style={styles.bodyText}>{eveningForecast}</Text>
        </View>
      </View>
    );
  };

  // Render advice and activities
  const renderAdvice = () => {
    const { advice, activitiesSuggested, activitiesToAvoid } = forecast.fullContent;

    return (
      <View onLayout={(e) => measureSection('advice', e)} style={styles.section}>
        <View style={styles.sectionDivider} />
        <Text
          style={[
            styles.titleText,
            { paddingHorizontal: 0, marginTop: spacing.lg, marginBottom: spacing.sm },
          ]}
        >
          Guidance for Today
        </Text>

        {/* Advice */}
        {advice && advice.length > 0 && (
          <View style={styles.adviceSection}>
            <Text style={[styles.sectionTitle, { marginTop: 0 }]}>Advice</Text>
            {advice.map((item, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.listBullet}>✦</Text>
                <Text style={styles.bodyText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Activities Suggested */}
        {activitiesSuggested && activitiesSuggested.length > 0 && (
          <View style={styles.adviceSection}>
            <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Do Together</Text>
            {activitiesSuggested.map((item, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={[styles.listBullet, { color: '#4CAF50' }]}>✓</Text>
                <Text style={styles.bodyText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Activities to Avoid */}
        {activitiesToAvoid && activitiesToAvoid.length > 0 && (
          <View style={styles.adviceSection}>
            <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Avoid Today</Text>
            {activitiesToAvoid.map((item, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={[styles.listBullet, { color: '#F44336' }]}>✗</Text>
                <Text style={styles.bodyText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.sectionDivider} />
      </View>
    );
  };

  // Render transit analysis
  const renderTransits = () => {
    const { transitAnalysis } = forecast.fullContent;

    if (!transitAnalysis) return null;

    // Split into paragraphs
    const paragraphs = transitAnalysis.split('\n\n').filter((p) => p.trim().length > 0);

    return (
      <View onLayout={(e) => measureSection('transits', e)} style={styles.section}>
        <Text
          style={[
            styles.titleText,
            { marginTop: spacing.lg, marginBottom: spacing.sm, paddingHorizontal: 0 },
          ]}
        >
          Transit Analysis
        </Text>

        {paragraphs.map((paragraph, index) => (
          <Text key={index} style={styles.bodyText}>
            {paragraph}
          </Text>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerSubtitle}>DAILY FORECAST</Text>
          <Text style={styles.headerDate}>{getCurrentDate()}</Text>
          <View style={styles.headerNames}>
            <Text style={styles.headerName}>{person1Name}</Text>
            <Ionicons name="heart" size={16} color={colors.primary} style={styles.headerIcon} />
            <Text style={styles.headerName}>{person2Name}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.refreshButton} onPress={() => loadForecast(true)}>
          <Ionicons name="refresh" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Section Navigation Dots */}
      <View style={styles.sectionNav}>
        {sections.map((section, index) => (
          <TouchableOpacity
            key={section.id}
            onPress={() => handleSectionPress(index, section.id)}
            style={styles.sectionNavItem}
          >
            <View style={[styles.dot, activeTab === index && styles.dotActive]} />
            <Text
              style={[
                styles.sectionNavLabel,
                activeTab === index && styles.sectionNavLabelActive,
              ]}
            >
              {section.shortLabel}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Scrollable Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {renderForecasts()}
        {renderAdvice()}
        {renderTransits()}

        {/* Bottom Padding */}
        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  loadingText: {
    ...typography.h3,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  loadingSubtext: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorTitle: {
    ...typography.h2,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  errorText: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    ...typography.button,
    color: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
    letterSpacing: 1,
    marginBottom: spacing.xs / 2,
  },
  headerDate: {
    ...typography.caption,
    color: colors.text.secondary,
    fontSize: 11,
    marginBottom: spacing.xs,
  },
  headerNames: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerName: {
    ...typography.h3,
    fontSize: 16,
  },
  headerIcon: {
    marginHorizontal: spacing.sm,
  },
  refreshButton: {
    padding: spacing.xs,
  },
  sectionNav: {
    position: 'absolute',
    right: spacing.md,
    top: '40%',
    zIndex: 10,
  },
  sectionNavItem: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.text.secondary + '40',
    marginBottom: spacing.xs,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sectionNavLabel: {
    ...typography.caption,
    fontSize: 9,
    color: colors.text.secondary,
    transform: [{ rotate: '90deg' }],
    width: 60,
    textAlign: 'center',
  },
  sectionNavLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xl,
  },
  titleText: {
    ...typography.h2,
    fontSize: 20,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    ...typography.h3,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  bodyText: {
    ...typography.body,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  introductionSection: {
    marginBottom: spacing.lg,
  },
  energyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.background.card,
    borderRadius: 8,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  energyText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  timeSection: {
    marginBottom: spacing.lg,
  },
  timeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  adviceSection: {
    marginBottom: spacing.md,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  listBullet: {
    ...typography.body,
    marginRight: spacing.sm,
    color: colors.primary,
  },
});
