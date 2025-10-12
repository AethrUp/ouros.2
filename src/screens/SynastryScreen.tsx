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
import { NavigationProps, FriendConnection, SynastryReading } from '../types';
import { CompatibilityMeterGroup } from '../components/synastry/CompatibilityMeter';
import { synastryAPI } from '../handlers/synastryAPI';
import { generateSynastryReading } from '../handlers/synastryReading';

export const SynastryScreen: React.FC<NavigationProps> = ({ navigation, route }) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [sectionPositions, setSectionPositions] = useState<Record<string, number>>({});
  const [isNavigating, setIsNavigating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState<SynastryReading | null>(null);

  const {
    natalChart,
    profile,
    birthData,
  } = useAppStore();

  const [currentSynastryChart, setCurrentSynastryChart] = useState<any>(null);

  // Get connection from route params
  const connection: FriendConnection = route?.params?.connection;
  const savedChart = route?.params?.savedChart;

  useEffect(() => {
    if (connection && natalChart && profile) {
      loadSynastryData();
    } else {
      setError('Missing required data. Please ensure both charts are complete.');
      setIsLoading(false);
    }
  }, [connection, natalChart, profile]);

  const loadSynastryData = async () => {
    if (!connection || !natalChart || !profile) {
      setError('Missing required data');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Determine if this is a saved chart or user connection
      const isSavedChart = !!savedChart;
      const friendChart = savedChart
        ? savedChart.natalChart
        : natalChart; // TODO: Fetch friend's natal chart from Supabase

      // Load or calculate synastry chart using the appropriate method
      let synastryChart;
      if (isSavedChart) {
        // User-to-SavedChart synastry
        synastryChart = await synastryAPI.loadSynastryChartWithSaved(
          profile.id,
          savedChart.id,
          natalChart,
          savedChart.natalChart,
          false
        );
      } else {
        // User-to-User synastry
        synastryChart = await synastryAPI.loadSynastryChart(
          profile.id,
          connection.friendId,
          natalChart,
          friendChart,
          false
        );
      }

      if (!synastryChart) {
        throw new Error('Failed to load synastry chart');
      }

      setCurrentSynastryChart(synastryChart);

      // Try to load existing reading using the appropriate method
      const readings = isSavedChart
        ? await synastryAPI.loadSynastryReadingsForSavedChart(savedChart.id)
        : await synastryAPI.loadSynastryReadings(connection.connectionId);

      if (readings.length > 0) {
        // Use the most recent reading
        setReading(readings[0]);
      } else {
        // Generate new reading
        const result = await generateSynastryReading(
          synastryChart,
          natalChart,
          friendChart,
          profile.displayName,
          connection.friendDisplayName,
          isSavedChart ? savedChart.id : connection.connectionId,
          connection.relationshipLabel || undefined,
          'detailed'
        );

        if (result.success && result.reading) {
          // Add the correct ID field before saving
          const readingToSave = {
            ...result.reading,
            connectionId: isSavedChart ? undefined : connection.connectionId,
            savedChartId: isSavedChart ? savedChart.id : undefined,
          };

          // Save the reading
          const savedReading = await synastryAPI.saveSynastryReading(readingToSave);
          setReading(savedReading);
        } else {
          throw new Error(result.message || 'Failed to generate reading');
        }
      }

      setIsLoading(false);
    } catch (err: any) {
      console.error('Error loading synastry data:', err);
      setError(err.message || 'Failed to load synastry data');
      setIsLoading(false);
    }
  };

  // Navigate to daily forecast
  const viewDailyForecast = () => {
    if (!currentSynastryChart || !natalChart || !profile || !birthData) {
      console.warn('Missing required data for daily forecast');
      return;
    }

    // Prepare profiles for transit calculation
    const person1Profile = {
      ...profile,
      birthDate: birthData.birthDate,
      birthTime: birthData.birthTime,
      birthLocation: birthData.birthLocation,
    };

    const person2Profile = savedChart
      ? {
          birthDate: savedChart.birthData.birthDate,
          birthTime: savedChart.birthData.birthTime,
          birthLocation: savedChart.birthData.birthLocation,
        }
      : person1Profile; // TODO: Get actual friend profile when user-to-user

    const person2Chart = savedChart ? savedChart.natalChart : natalChart;

    navigation.navigate('DailySynastryForecast', {
      synastryChart: currentSynastryChart,
      person1Chart: natalChart,
      person2Chart: person2Chart,
      person1Profile: person1Profile,
      person2Profile: person2Profile,
      person1Name: profile.displayName,
      person2Name: connection.friendDisplayName,
      connectionId: savedChart ? undefined : connection.connectionId,
      savedChartId: savedChart ? savedChart.id : undefined,
    });
  };

  // Section configuration
  const sections = [
    { id: 'compatibility', label: 'Compatibility', shortLabel: 'COMPAT' },
    { id: 'reading', label: 'Full Reading', shortLabel: 'READING' },
    { id: 'strengths', label: 'Strengths', shortLabel: 'STRENGTHS' },
    { id: 'challenges', label: 'Challenges', shortLabel: 'CHALLENGES' },
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

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.text.primary} />
          <Text style={styles.loadingText}>Calculating synastry chart...</Text>
          <Text style={styles.loadingSubtext}>
            Analyzing inter-chart aspects and compatibility
          </Text>
        </View>
        <StatusBar style="light" />
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={48} color={colors.text.secondary} />
          <Text style={styles.errorTitle}>Unable to Calculate Synastry</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadSynastryData()}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
        <StatusBar style="light" />
      </SafeAreaView>
    );
  }

  // No data state
  if (!currentSynastryChart || !reading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="people-outline" size={48} color={colors.text.secondary} />
          <Text style={styles.errorTitle}>No Synastry Data Available</Text>
          <Text style={styles.errorText}>
            Please ensure both birth charts are complete
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
        <StatusBar style="light" />
      </SafeAreaView>
    );
  }

  // Render compatibility section
  const renderCompatibility = () => (
    <View onLayout={(e) => measureSection('compatibility', e)} style={styles.section}>
      <CompatibilityMeterGroup
        overall={currentSynastryChart.compatibilityScore || 0}
        fire={currentSynastryChart.elementCompatibility?.fire}
        earth={currentSynastryChart.elementCompatibility?.earth}
        air={currentSynastryChart.elementCompatibility?.air}
        water={currentSynastryChart.elementCompatibility?.water}
        cardinal={currentSynastryChart.modalityCompatibility?.cardinal}
        fixed={currentSynastryChart.modalityCompatibility?.fixed}
        mutable={currentSynastryChart.modalityCompatibility?.mutable}
      />
    </View>
  );

  // Render full reading section
  const renderReading = () => {
    if (!reading) return null;

    // Split reading into paragraphs
    const paragraphs = reading.interpretation.split('\n\n').filter((p) => p.trim().length > 0);

    return (
      <View onLayout={(e) => measureSection('reading', e)} style={styles.section}>
        <Text style={[styles.titleText, { paddingHorizontal: 0, marginTop: spacing.md, marginBottom: spacing.sm }]}>
          Relationship Dynamics
        </Text>

        {paragraphs.map((paragraph, index) => (
          <Text key={index} style={styles.bodyText}>
            {paragraph}
          </Text>
        ))}
        <View style={styles.sectionDivider} />
      </View>
    );
  };

  // Render strengths section
  const renderStrengths = () => {
    if (!currentSynastryChart.strengths || currentSynastryChart.strengths.length === 0) {
      return null;
    }

    return (
      <View onLayout={(e) => measureSection('strengths', e)} style={styles.section}>
        <Text style={[styles.titleText, { marginTop: spacing.lg, marginBottom: spacing.sm, color: colors.text.primary, paddingHorizontal: 0 }]}>
          Relationship Strengths
        </Text>

        {currentSynastryChart.strengths.map((strength, index) => (
          <View key={index} style={styles.listItem}>
            <Text style={styles.listBullet}>✦</Text>
            <Text style={styles.bodyText}>{strength}</Text>
          </View>
        ))}

        {currentSynastryChart.recommendations &&
          currentSynastryChart.recommendations.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>
                Recommendations
              </Text>
              {currentSynastryChart.recommendations.map((rec, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={styles.listBullet}>✦</Text>
                  <Text style={styles.bodyText}>{rec}</Text>
                </View>
              ))}
            </>
          )}
      </View>
    );
  };

  // Render challenges section
  const renderChallenges = () => {
    if (!currentSynastryChart.challenges || currentSynastryChart.challenges.length === 0) {
      return null;
    }

    return (
      <View onLayout={(e) => measureSection('challenges', e)} style={styles.section}>
        <Text style={[styles.titleText, { marginTop: spacing.lg, marginBottom: spacing.sm, color: colors.text.primary, paddingHorizontal: 0 }]}>
          Growth Opportunities
        </Text>

        <Text style={styles.bodyText}>
          Every relationship has areas for growth. These challenges can strengthen your bond when
          approached with awareness and compassion.
        </Text>

        {currentSynastryChart.challenges.map((challenge, index) => (
          <View key={index} style={styles.listItem}>
            <Text style={styles.listBullet}>✦</Text>
            <Text style={styles.bodyText}>{challenge}</Text>
          </View>
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
          <Text style={styles.headerSubtitle}>SYNASTRY READING</Text>
          <View style={styles.headerNames}>
            <Text style={styles.headerName}>{profile?.displayName}</Text>
            <Text style={styles.headerSeparator}>&</Text>
            <Text style={styles.headerName}>{connection.friendDisplayName}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.moreButton} onPress={viewDailyForecast}>
          <Ionicons name="calendar-outline" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>


      {/* Scrollable Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {renderCompatibility()}
        {renderReading()}
        {renderStrengths()}
        {renderChallenges()}

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
  headerSeparator: {
    ...typography.h3,
    fontSize: 16,
    marginHorizontal: spacing.sm,
    color: colors.text.secondary,
  },
  moreButton: {
    padding: spacing.xs,
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
