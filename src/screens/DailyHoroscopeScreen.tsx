import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Polyline, Path } from 'react-native-svg';
import { colors, spacing, typography } from '../styles';
import { useAppStore } from '../store';
import { getDailyHoroscope } from '../handlers/horoscopeGeneration';

// Bootstrap Icons SVG paths
const BootstrapIcons = {
  moonStars: 'M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278zM4.858 1.311A7.269 7.269 0 0 0 1.025 7.71c0 4.02 3.279 7.276 7.319 7.276a7.316 7.316 0 0 0 5.205-2.162c-.337.042-.68.063-1.029.063-4.61 0-8.343-3.714-8.343-8.29 0-1.167.242-2.278.681-3.286z',
  brightnessAltHighFill: 'M8 3a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 3zm8 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zm-13.5.5a.5.5 0 0 0 0-1h-2a.5.5 0 0 0 0 1h2zm11.157-6.157a.5.5 0 0 1 0 .707l-1.414 1.414a.5.5 0 1 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm-9.9 2.121a.5.5 0 0 0 .707-.707L3.05 5.343a.5.5 0 1 0-.707.707l1.414 1.414zM8 7a4 4 0 0 0-4 4 .5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5 4 4 0 0 0-4-4z',
  sunFill: 'M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z',
  brightnessAltLow: 'M8 3a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 3zm8 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zm-13.5.5a.5.5 0 0 0 0-1h-2a.5.5 0 0 0 0 1h2zm11.157-6.157a.5.5 0 0 1 0 .707l-1.414 1.414a.5.5 0 1 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm-9.9 2.121a.5.5 0 0 0 .707-.707L3.05 5.343a.5.5 0 1 0-.707.707l1.414 1.414zM8 7a4 4 0 0 0-4 4 .5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5 4 4 0 0 0-4-4zm0 4.5a3 3 0 0 1 2.959-2.5A3.5 3.5 0 0 1 8 11.5z',
};

// Category icon mappings
const categoryIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  love: 'heart',
  career: 'briefcase',
  health: 'fitness',
  family: 'home',
  friendship: 'people',
  travel: 'airplane',
  creativity: 'color-palette',
  spirituality: 'flower',
  education: 'library',
  finance: 'cash',
  personal: 'person',
  social: 'people-circle',
};

// Bootstrap Icon Component
const BootstrapIcon: React.FC<{ name: keyof typeof BootstrapIcons; size?: number; color?: string }> = ({
  name,
  size = 16,
  color = '#FFFFFF'
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
      <Path d={BootstrapIcons[name]} />
    </Svg>
  );
};

// Transit Timeline Component
const TransitTimeline: React.FC<{ transit: any }> = ({ transit }) => {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - spacing.lg * 2;
  const chartHeight = 80;
  const verticalPadding = 8; // Padding to prevent clipping at top and bottom
  const strengthCurve = transit.timingData?.strengthCurve || [];

  if (strengthCurve.length === 0) return null;

  // Find min and max values for dynamic scaling
  const minStrength = Math.min(...strengthCurve);
  const maxStrength = Math.max(...strengthCurve);
  const range = maxStrength - minStrength;

  // Calculate points for the polyline with dynamic scaling and padding
  const points = strengthCurve
    .map((strength: number, index: number) => {
      const x = (index / (strengthCurve.length - 1)) * chartWidth;
      // Scale relative to min/max instead of 0-100
      const normalizedStrength = range > 0 ? (strength - minStrength) / range : 0.5;
      // Apply vertical padding to prevent clipping
      const availableHeight = chartHeight - (verticalPadding * 2);
      const y = chartHeight - verticalPadding - (normalizedStrength * availableHeight);
      return `${x},${y}`;
    })
    .join(' ');

  // Time of day icons at key hours (0, 6, 12, 18)
  const timeIcons = [
    { hour: 0, icon: 'moonStars' as const, label: '12AM' },
    { hour: 6, icon: 'brightnessAltHighFill' as const, label: '6AM' },
    { hour: 12, icon: 'sunFill' as const, label: '12PM' },
    { hour: 18, icon: 'brightnessAltLow' as const, label: '6PM' },
  ];

  return (
    <View style={styles.timelineContainer}>
      {/* Time Icons */}
      <View style={styles.timeIconsContainer}>
        {timeIcons.map((time) => (
          <View key={time.hour} style={styles.timeIconItem}>
            <BootstrapIcon name={time.icon} size={18} color="#FFFFFF" />
          </View>
        ))}
      </View>

      {/* Line Chart */}
      <Svg width={chartWidth} height={chartHeight} style={styles.timelineChart}>
        <Polyline
          points={points}
          fill="none"
          stroke="#F6D99F"
          strokeWidth="2"
          opacity={1}
        />
      </Svg>

      {/* Graph Label */}
      <Text style={styles.graphLabel}>24 HOUR TRANSIT INFLUENCE</Text>
    </View>
  );
};

const DailyHoroscopeScreen = () => {
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  const sectionNavScrollRef = useRef<ScrollView>(null);
  const isMountedRef = useRef(true);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Get data from store
  const {
    profile,
    birthData,
    natalChart,
    preferences,
    dailyHoroscope,
    isLoadingDailyReading,
    isGeneratingHoroscope,
    dailyReadingError,
    setDailyHoroscope,
    setLoadingDailyReading,
    setDailyReadingError,
    setGenerationMetadata,
    setGeneratingHoroscope,
  } = useAppStore();

  // Reset flag on mount and cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    // Reset any stuck flag from previous session
    if (isGeneratingHoroscope) {
      console.log('🔄 Resetting stuck isGeneratingHoroscope flag');
      setGeneratingHoroscope(false);
    }

    return () => {
      isMountedRef.current = false;
      // Cleanup: reset flag on unmount to prevent stuck state
      setGeneratingHoroscope(false);
      setLoadingDailyReading(false);
    };
  }, []);

  const loadHoroscope = async (forceRegenerate = false) => {
    if (!natalChart || !profile || !birthData) {
      console.log('⏸️ Waiting for natal chart and profile data...');
      return;
    }

    // Guard against concurrent generation
    if (isGeneratingHoroscope) {
      console.log('⏸️ Horoscope generation already in progress...');
      return;
    }

    try {
      setLoadingDailyReading(true);
      setGeneratingHoroscope(true);

      const userProfile = {
        ...profile,
        birthDate: birthData.birthDate,
        birthTime: birthData.birthTime,
        birthLocation: birthData.birthLocation,
        selectedCategories: preferences.focusAreas || [],
      };

      const result = await getDailyHoroscope(natalChart, userProfile, dailyHoroscope, { forceRegenerate });

      if (result.success && result.horoscope) {
        if (isMountedRef.current) {
          setDailyHoroscope(result.horoscope);

          if (result.metadata) {
            setGenerationMetadata(result.metadata);
          }

          if (result.fromCache) {
            console.log('✅ Using cached horoscope');
          } else {
            console.log('✅ Generated new horoscope');
          }
        }
      } else {
        if (isMountedRef.current) {
          setDailyReadingError(result.error || 'Failed to generate horoscope');
        }
      }
    } catch (error: any) {
      console.error('Error loading horoscope:', error);
      if (isMountedRef.current) {
        setDailyReadingError(error.message);
      }
    } finally {
      // Always reset flags, even if unmounted, to prevent stuck state
      setLoadingDailyReading(false);
      setGeneratingHoroscope(false);
    }
  };

  // Extract content from store
  const preview = dailyHoroscope?.preview || {};
  const fullContent = dailyHoroscope?.fullContent || {};
  const content = dailyHoroscope?.content || {};

  // Set first selected category as active on mount
  useEffect(() => {
    const selectedCategories = preferences.focusAreas || [];
    if (selectedCategories.length > 0 && !activeCategory) {
      setActiveCategory(selectedCategories[0]);
    }
  }, [preferences, activeCategory]);

  // Build dynamic sections based on available data
  const buildSections = () => {
    const sections: Array<{ id: string; label: string }> = [];
    const transitAnalysis = fullContent.transitAnalysis;
    const transitInsights = fullContent.transitInsights || [];

    // 1. Main Reading
    sections.push({ id: 'mainReading', label: 'MAIN READING' });

    // 2-4. Time sections (Morning, Afternoon, Evening)
    sections.push({ id: 'morning', label: 'MORNING' });
    sections.push({ id: 'afternoon', label: 'AFTERNOON' });
    sections.push({ id: 'evening', label: 'EVENING' });

    // 5+. Transits (dynamic based on data)
    if (transitAnalysis?.primary) {
      sections.push({ id: 'transit-primary', label: 'TRANSIT 1' });
    }
    if (transitAnalysis?.secondary) {
      transitAnalysis.secondary.forEach((_, index) => {
        sections.push({ id: `transit-secondary-${index}`, label: `TRANSIT ${index + 2}` });
      });
    }

    // Insights (Energy, Influence, Emotion, Opportunities, Challenges)
    if (transitInsights.length > 0) {
      sections.push({ id: 'insights', label: 'INSIGHTS' });
    }

    // Guidance (Focus, Explore, Be Mindful)
    if (fullContent.dailyFocus || fullContent.explore?.length > 0 || fullContent.limit?.length > 0) {
      sections.push({ id: 'guidance', label: 'GUIDANCE' });
    }

    // Spiritual (Meditation, Affirmation, Prompts)
    if (fullContent.spiritualGuidance) {
      sections.push({ id: 'spiritual', label: 'SPIRITUAL' });
    }

    // Categories
    const selectedCategories = preferences.focusAreas || [];
    if (selectedCategories.length > 0) {
      sections.push({ id: 'categories', label: 'CATEGORIES' });
    }

    return sections;
  };

  const sections = buildSections();

  // Auto-scroll section navigation to show active section
  useEffect(() => {
    if (sectionNavScrollRef.current && sections.length > 0) {
      // Calculate approximate position of active section
      // Each section item is roughly 100-120px wide (padding + text)
      const itemWidth = 110;
      const scrollPosition = currentSectionIndex * itemWidth - 100; // Offset to center

      sectionNavScrollRef.current.scrollTo({
        x: Math.max(0, scrollPosition),
        animated: true,
      });
    }
  }, [currentSectionIndex]);

  // Navigate to specific section
  const handleSectionPress = (index: number) => {
    setCurrentSectionIndex(index);
  };

  // Navigate to previous section (with looping)
  const handlePrevious = () => {
    setCurrentSectionIndex((prev) => (prev === 0 ? sections.length - 1 : prev - 1));
  };

  // Navigate to next section (with looping)
  const handleNext = () => {
    setCurrentSectionIndex((prev) => (prev === sections.length - 1 ? 0 : prev + 1));
  };

  // Scroll section navigation left (by ~3 label widths)
  const scrollSectionNavLeft = () => {
    if (sectionNavScrollRef.current) {
      // Approximate width of 3 labels (each ~80-85px with reduced spacing)
      const scrollAmount = 250;
      sectionNavScrollRef.current.scrollTo({
        x: Math.max(0, (currentScrollX || 0) - scrollAmount),
        animated: true,
      });
    }
  };

  // Scroll section navigation right (by ~3 label widths)
  const scrollSectionNavRight = () => {
    if (sectionNavScrollRef.current) {
      // Approximate width of 3 labels
      const scrollAmount = 250;
      sectionNavScrollRef.current.scrollTo({
        x: (currentScrollX || 0) + scrollAmount,
        animated: true,
      });
    }
  };

  // Track current scroll position
  const [currentScrollX, setCurrentScrollX] = React.useState(0);
  const handleSectionNavScroll = (event: any) => {
    setCurrentScrollX(event.nativeEvent.contentOffset.x);
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

  // Handle journal prompt press
  const handleJournalPrompt = async (prompt: string, promptIndex: number) => {
    try {
      console.log('📝 Creating journal entry for prompt:', prompt);

      // Save horoscope as a "reading" for proper linking
      const { saveHoroscopeReading } = await import('../handlers/horoscopeReading');
      const savedReading = await saveHoroscopeReading({
        horoscope: dailyHoroscope,
        prompt: prompt,
      });

      // Create linked reading object
      const linkedReading = {
        id: savedReading.id, // Real database ID from readings table
        reading_type: 'horoscope' as const,
        title: `Daily Horoscope - ${getCurrentDate()}`,
        timestamp: new Date().toISOString(),
        interpretation: fullContent.fullReading?.introduction || content.summary || '',
        intention: prompt, // The prompt itself
        metadata: {
          prompt: prompt,
          promptIndex: promptIndex,
          date: getCurrentDate(),
          hasTransits: !!fullContent.transitAnalysis,
        },
      };

      // Navigate to journal
      navigation.navigate('journal', {
        screen: 'JournalEntry',
        params: {
          linkedReading,
          entryType: 'horoscope',
        },
      });
    } catch (error: any) {
      console.error('Failed to create journal entry:', error);
      // Could add error toast/alert here in the future
    }
  };

  // Loading state
  if (isLoadingDailyReading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.text.primary} />
          <Text style={styles.loadingText}>Generating your personalized horoscope...</Text>
          <Text style={styles.loadingSubtext}>Calculating planetary transits and AI interpretation</Text>
        </View>
        <StatusBar style="light" />
      </SafeAreaView>
    );
  }

  // Error state
  if (dailyReadingError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={48} color={colors.text.secondary} />
          <Text style={styles.errorTitle}>Unable to Generate Horoscope</Text>
          <Text style={styles.errorText}>{dailyReadingError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadHoroscope(true)}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
        <StatusBar style="light" />
      </SafeAreaView>
    );
  }

  // No data state
  if (!dailyHoroscope) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="planet-outline" size={48} color={colors.text.secondary} />
          <Text style={styles.errorTitle}>No Horoscope Available</Text>
          <Text style={styles.errorText}>Please ensure your birth data is complete</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
        <StatusBar style="light" />
      </SafeAreaView>
    );
  }

  // Render main reading section (intro, title, summary, conclusion)
  const renderMainReading = () => {
    const fullReading = fullContent.fullReading;

    if (!fullReading) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Reading</Text>
          <Text style={styles.bodyText}>{content.summary || preview.summary || 'Loading your personalized reading...'}</Text>
          {content.advice && <Text style={styles.bodyText}>{content.advice}</Text>}
        </View>
      );
    }

    return (
      <View style={styles.section}>
        {/* Introduction */}
        {fullReading.introduction && (
          <View style={styles.introductionSection}>
            <Text style={[styles.titleText, { paddingHorizontal: 0, marginBottom: spacing.sm }]}>Today's Cosmic Story</Text>
            <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: spacing.sm }]}>
              {preview.title || content.title || 'Daily Cosmic Reading'}
            </Text>
            <Text style={styles.bodyText}>{fullReading.introduction}</Text>
          </View>
        )}

        {/* Summary */}
        {content.summary && (
          <View style={{ marginTop: spacing.md }}>
            <Text style={styles.bodyText}>{content.summary}</Text>
          </View>
        )}

        {/* Conclusion */}
        {fullReading.conclusion && (
          <View style={styles.conclusionSection}>
            <Text style={styles.bodyText}>{fullReading.conclusion}</Text>
          </View>
        )}
      </View>
    );
  };

  // Render individual time section (Morning, Afternoon, or Evening)
  const renderTimeSection = (timeIndex: number) => {
    const fullReading = fullContent.fullReading;
    const timeGuidance = fullContent.timeGuidance;
    const timeHeadings = ['Morning', 'Afternoon', 'Evening'];
    const timeKeys = ['morning', 'afternoon', 'evening'] as const;

    if (!fullReading?.bodyParagraphs || !fullReading.bodyParagraphs[timeIndex]) {
      return (
        <View style={styles.section}>
          <Text style={[styles.titleText, { paddingHorizontal: 0, marginTop: 0, marginBottom: spacing.sm }]}>{timeHeadings[timeIndex]}</Text>
          <Text style={styles.bodyText}>No guidance available for this time period.</Text>
        </View>
      );
    }

    const paragraph = fullReading.bodyParagraphs[timeIndex];
    const guidance = timeGuidance?.[timeKeys[timeIndex]];

    return (
      <View style={styles.section}>
        <Text style={[styles.titleText, { paddingHorizontal: 0, marginTop: 0, marginBottom: spacing.sm }]}>{timeHeadings[timeIndex]}</Text>
        {guidance?.energy && (
          <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: spacing.sm }]}>
            Energy: {guidance.energy}
          </Text>
        )}
        <Text style={styles.bodyText}>{paragraph}</Text>

        {/* Guidance columns */}
        {guidance && (guidance.bestFor?.length > 0 || guidance.avoid?.length > 0) && (
          <View style={styles.guidanceColumns}>
            {guidance.bestFor?.length > 0 && (
              <View style={styles.guidanceColumn}>
                <Text style={[styles.subsectionTitle, { color: colors.text.primary + '80', marginTop: 0, marginBottom: spacing.sm }]}>
                  Best For
                </Text>
                {guidance.bestFor.map((item, idx) => (
                  <View key={idx} style={styles.guidanceItemContainer}>
                    <Text style={styles.guidanceBullet}>✦</Text>
                    <Text style={styles.guidanceItemText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}
            {guidance.avoid?.length > 0 && (
              <View style={styles.guidanceColumn}>
                <Text style={[styles.subsectionTitle, { color: colors.text.primary + '80', marginTop: 0, marginBottom: spacing.sm }]}>
                  Avoid
                </Text>
                {guidance.avoid.map((item, idx) => (
                  <View key={idx} style={styles.guidanceItemContainer}>
                    <Text style={styles.guidanceBullet}>✦</Text>
                    <Text style={styles.guidanceItemText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  // Render individual transit
  const renderTransit = (transitId: string) => {
    const transitAnalysis = fullContent.transitAnalysis;
    let transit: any = null;
    let transitNumber = 1;

    if (transitId === 'transit-primary' && transitAnalysis?.primary) {
      transit = transitAnalysis.primary;
      transitNumber = 1;
    } else if (transitId.startsWith('transit-secondary-')) {
      const index = parseInt(transitId.replace('transit-secondary-', ''));
      if (transitAnalysis?.secondary && transitAnalysis.secondary[index]) {
        transit = transitAnalysis.secondary[index];
        transitNumber = index + 2;
      }
    }

    if (!transit) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transit {transitNumber}</Text>
          <Text style={styles.bodyText}>No transit data available.</Text>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <Text style={[styles.titleText, { paddingHorizontal: 0, marginBottom: spacing.sm }]}>Transit {transitNumber}</Text>

        {/* Transit Timeline */}
        <TransitTimeline transit={transit} />

        <Text style={[styles.sectionTitle, { marginTop: spacing.xs }]}>{transit.aspect}</Text>
        {transit.timing && <Text style={[styles.transitTiming, { fontStyle: 'italic' }]}>{transit.timing}</Text>}
        <Text style={styles.bodyText}>{transit.interpretation}</Text>
        {transit.advice && <Text style={styles.bodyText}>{transit.advice}</Text>}
      </View>
    );
  };

  // Render insights section (Energy, Influence, Emotion, Opportunities, Challenges)
  const renderInsights = () => {
    const transitInsights = fullContent.transitInsights || [];
    const categories = ['Energy', 'Influence', 'Emotion', 'Opportunities', 'Challenges'];

    return (
      <View style={styles.section}>
        <Text style={[styles.titleText, { paddingHorizontal: 0, marginBottom: spacing.sm }]}>Insights</Text>
        {transitInsights.map((insight, index) => {
          const category = categories[index] || '';
          return (
            <View key={index} style={styles.insightItem}>
              {category && <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: spacing.xs }]}>{category}</Text>}
              <Text style={styles.bodyText}>{insight}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  // Render guidance section (Focus, Explore, Be Mindful)
  const renderGuidance = () => {
    const explore = fullContent.explore || content.explore || [];
    const limit = fullContent.limit || content.limit || [];
    const dailyFocus = fullContent.dailyFocus || content.dailyFocus;

    return (
      <View style={styles.section}>
        <Text style={[styles.titleText, { marginBottom: spacing.sm, color: colors.text.primary, paddingHorizontal: 0 }]}>
          Guidance
        </Text>

        {dailyFocus && (
          <View>
            <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: spacing.sm }]}>Today's Focus</Text>
            <Text style={styles.bodyText}>{dailyFocus}</Text>
          </View>
        )}

        {explore.length > 0 && (
          <View style={styles.exploreSection}>
            <Text style={[styles.sectionTitle, { marginTop: dailyFocus ? spacing.md : 0 }]}>Explore Today</Text>
            {explore.map((item, index) => (
              <Text key={index} style={[styles.bodyText, { marginBottom: spacing.xs }]}>
                ✦ {item}
              </Text>
            ))}
          </View>
        )}

        {limit.length > 0 && (
          <View style={styles.exploreSection}>
            <Text style={[styles.sectionTitle, { marginTop: spacing.md }]}>Be Mindful Of</Text>
            {limit.map((item, index) => (
              <Text key={index} style={[styles.bodyText, { marginBottom: spacing.xs }]}>
                ✦ {item}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  // Render spiritual section (Meditation, Affirmation, Prompts)
  const renderSpiritual = () => {
    const spiritualGuidance = fullContent.spiritualGuidance;

    return (
      <View style={styles.section}>
        <Text style={[styles.titleText, { paddingHorizontal: 0, marginBottom: spacing.sm }]}>Spiritual Practice</Text>

        {spiritualGuidance?.meditation && (
          <View style={styles.spiritualCard}>
            <Text style={styles.bodyText}>{spiritualGuidance.meditation}</Text>
          </View>
        )}

        {spiritualGuidance?.affirmation && (
          <View style={[styles.affirmationCard, { marginBottom: spacing.lg }]}>
            <Text style={[styles.spiritualLabel, { color: colors.text.primary }]}>DAILY AFFIRMATION</Text>
            <Text style={styles.affirmationText}>"{spiritualGuidance.affirmation}"</Text>
          </View>
        )}

        {spiritualGuidance?.journalPrompts && spiritualGuidance.journalPrompts.length > 0 && (
          <View style={styles.spiritualCard}>
            <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: spacing.xs }]}>Journal Prompts</Text>
            <Text style={[styles.promptHintText, { marginBottom: spacing.sm }]}>
              Tap a prompt to journal about it
            </Text>
            {spiritualGuidance.journalPrompts.map((prompt, index) => (
              <TouchableOpacity
                key={index}
                style={styles.promptItemTouchable}
                onPress={() => handleJournalPrompt(prompt, index)}
                activeOpacity={0.7}
              >
                <View style={styles.promptItemContainer}>
                  <Text style={styles.bodyText}>✦</Text>
                  <Text style={[styles.promptText, { flex: 1, marginBottom: 0 }]}>{prompt}</Text>
                  <Ionicons
                    name="journal-outline"
                    size={16}
                    color={colors.text.secondary}
                    style={styles.promptIcon}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  // Render categories section
  const renderCategories = () => {
    const selectedCategories = preferences.focusAreas || [];
    const allCategories = Object.keys(categoryIcons);
    const categoryAdvice = dailyHoroscope?.content?.categoryAdvice;

    return (
      <View style={styles.section}>
        <Text style={[styles.titleText, { paddingHorizontal: 0, marginBottom: spacing.md }]}>Categories</Text>

        {/* Category Navigation */}
        <View style={styles.categoryNav}>
          {allCategories.map((category) => {
            const isSelected = selectedCategories.includes(category);
            const isActive = activeCategory === category;

            return (
              <TouchableOpacity
                key={category}
                style={styles.categoryNavItem}
                onPress={() => isSelected && setActiveCategory(category)}
                disabled={!isSelected}
              >
                <Ionicons
                  name={categoryIcons[category]}
                  size={20}
                  color={isSelected ? colors.text.primary : colors.text.secondary}
                  style={!isSelected && styles.categoryIconDisabled}
                />
                {isActive && <View style={styles.categoryNavUnderline} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Active Category Advice */}
        {activeCategory && categoryAdvice && categoryAdvice[activeCategory] && (
          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>
              {categoryAdvice[activeCategory].title
                ? categoryAdvice[activeCategory].title.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim()
                : `${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)}`}
            </Text>
            <Text style={styles.categoryContent}>{categoryAdvice[activeCategory].content}</Text>
          </View>
        )}
      </View>
    );
  };

  // Render current section based on section ID
  const renderCurrentSection = () => {
    const currentSection = sections[currentSectionIndex];
    if (!currentSection) return null;

    const sectionId = currentSection.id;

    // Main Reading
    if (sectionId === 'mainReading') {
      return renderMainReading();
    }

    // Time Sections
    if (sectionId === 'morning') {
      return renderTimeSection(0);
    }
    if (sectionId === 'afternoon') {
      return renderTimeSection(1);
    }
    if (sectionId === 'evening') {
      return renderTimeSection(2);
    }

    // Transits
    if (sectionId.startsWith('transit-')) {
      return renderTransit(sectionId);
    }

    // Insights
    if (sectionId === 'insights') {
      return renderInsights();
    }

    // Guidance
    if (sectionId === 'guidance') {
      return renderGuidance();
    }

    // Spiritual
    if (sectionId === 'spiritual') {
      return renderSpiritual();
    }

    // Categories
    if (sectionId === 'categories') {
      return renderCategories();
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.dateText}>{getCurrentDate()}</Text>
        <TouchableOpacity onPress={() => loadHoroscope(true)} style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Scrollable Section Navigation */}
      <View style={styles.sectionNavContainer}>
        {/* Left Chevron - Scrolls labels left */}
        <TouchableOpacity
          onPress={scrollSectionNavLeft}
          style={styles.navChevron}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text.primary} />
        </TouchableOpacity>

        {/* Horizontal Scrollable Section List */}
        <ScrollView
          ref={sectionNavScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.sectionNavScroll}
          contentContainerStyle={styles.sectionNavContent}
          onScroll={handleSectionNavScroll}
          scrollEventThrottle={16}
        >
          {sections.map((section, index) => (
            <TouchableOpacity
              key={section.id}
              style={styles.sectionNavItem}
              onPress={() => handleSectionPress(index)}
            >
              <Text style={[
                styles.sectionNavLabel,
                currentSectionIndex === index && styles.activeSectionNavLabel
              ]}>
                {section.label}
              </Text>
              {currentSectionIndex === index && <View style={styles.sectionNavUnderline} />}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Right Chevron - Scrolls labels right */}
        <TouchableOpacity
          onPress={scrollSectionNavRight}
          style={styles.navChevron}
        >
          <Ionicons name="chevron-forward" size={20} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Content - Current Section Only */}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {renderCurrentSection()}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Previous/Next Navigation Buttons */}
      <View style={styles.navButtonsContainer}>
        <TouchableOpacity
          onPress={handlePrevious}
          style={styles.navButton}
        >
          <Text style={styles.navButtonText}>PREVIOUS</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleNext}
          style={styles.navButton}
        >
          <Text style={styles.navButtonText}>NEXT</Text>
        </TouchableOpacity>
      </View>

      <StatusBar style="light" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  loadingText: {
    ...typography.h2,
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
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.text.primary + '20',
    borderRadius: 8,
  },
  retryButtonText: {
    ...typography.body,
    color: colors.text.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: colors.text.primary,
  },
  refreshButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateText: {
    ...typography.caption,
    letterSpacing: 1,
  },
  titleText: {
    ...typography.h1,
    textAlign: 'left',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionNavContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '30',
    paddingVertical: spacing.sm,
  },
  navChevron: {
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionNavScroll: {
    flex: 1,
  },
  sectionNavContent: {
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
  },
  sectionNavItem: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    marginHorizontal: 2,
    position: 'relative',
  },
  sectionNavLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    letterSpacing: 1,
  },
  activeSectionNavLabel: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  sectionNavUnderline: {
    position: 'absolute',
    bottom: 0,
    left: spacing.sm,
    right: spacing.sm,
    height: 2,
    backgroundColor: colors.text.primary,
  },
  navButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border + '30',
  },
  navButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  navButtonText: {
    ...typography.body,
    color: colors.text.primary,
    letterSpacing: 1,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  section: {},
  sectionTitle: {
    ...typography.h2,
  },
  subsectionTitle: {
    ...typography.h3,
  },
  bodyText: {
    ...typography.body,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  introductionSection: {},
  timeSectionsContainer: {},
  timeSection: {},
  guidanceColumns: {
    flexDirection: 'row',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.lg,
  },
  guidanceColumn: {
    flex: 1,
  },
  guidanceItemContainer: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  guidanceBullet: {
    ...typography.body,
    lineHeight: 20,
  },
  guidanceItemText: {
    ...typography.body,
    lineHeight: 20,
    flex: 1,
    paddingLeft: spacing.xs,
  },
  conclusionSection: {},
  transitItem: {},
  transitTiming: {
    ...typography.body,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  insightsContainer: {},
  insightItem: {
    marginBottom: spacing.sm,
  },
  exploreContainer: {},
  exploreSection: {},
  spiritualCard: {},
  spiritualLabel: {
    ...typography.caption,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  affirmationCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 8,
    padding: spacing.lg,
    alignItems: 'center',
  },
  affirmationText: {
    ...typography.h3,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  promptHintText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontStyle: 'italic',
    fontSize: 11,
  },
  promptItemTouchable: {
    marginBottom: spacing.xs,
    borderRadius: 6,
    padding: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  promptItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promptItem: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  promptText: {
    ...typography.body,
    lineHeight: 20,
    flex: 1,
    paddingLeft: spacing.sm,
  },
  promptIcon: {
    marginLeft: spacing.sm,
  },
  bottomSpacer: {
    height: spacing.xl * 2,
  },
  categoryNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  categoryNavItem: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  categoryNavUnderline: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    transform: [{ translateX: -12 }],
    width: 24,
    height: 2,
    backgroundColor: colors.text.primary,
  },
  categoryIconDisabled: {
    opacity: 0.3,
  },
  categorySection: {
    marginBottom: spacing.xl,
  },
  categoryTitle: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  categoryContent: {
    ...typography.body,
    color: colors.text.primary,
    lineHeight: 20,
  },
  timelineContainer: {
    marginTop: spacing.sm,
    marginBottom: 0,
    alignItems: 'center',
    width: '100%',
  },
  timelineChart: {
    marginTop: spacing.xs,
  },
  timeIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 0,
    marginBottom: spacing.xs,
  },
  timeIconItem: {
    alignItems: 'center',
  },
  graphLabel: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'left',
    width: '100%',
    marginTop: spacing.xs,
    letterSpacing: 1,
  },
});

export default DailyHoroscopeScreen;
