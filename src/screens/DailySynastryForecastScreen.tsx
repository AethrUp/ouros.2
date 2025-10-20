import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../styles';
import { useAppStore } from '../store';
import { NavigationProps } from '../types';
import { SynastryChart } from '../types/synastry';
import { LoadingScreen } from '../components';
import { isSynastryV1Format, isSynastryV2Format } from '../utils/readingTypeGuards';

export const DailySynastryForecastScreen: React.FC<NavigationProps> = ({ navigation, route }) => {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentScrollX, setCurrentScrollX] = useState(0);
  const sectionNavScrollRef = useRef<ScrollView>(null);

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

  // Detect format
  const isV2 = forecast ? isSynastryV2Format(forecast.fullContent) : false;
  const isV1 = forecast ? isSynastryV1Format(forecast.fullContent) : false;

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

  // Build dynamic sections based on format
  const buildSections = () => {
    const sections: Array<{ id: string; label: string }> = [];

    if (!forecast) return sections;

    if (isV2) {
      // V2 Format - structured sections
      sections.push({ id: 'overview', label: 'OVERVIEW' });
      sections.push({ id: 'morning', label: 'MORNING' });
      sections.push({ id: 'afternoon', label: 'AFTERNOON' });
      sections.push({ id: 'evening', label: 'EVENING' });
      sections.push({ id: 'guidance', label: 'GUIDANCE' });

      // Transit sections
      if (forecast.fullContent.transitAnalysis) {
        sections.push({ id: 'transit-primary', label: 'TRANSIT 1' });
        if (forecast.fullContent.transitAnalysis.secondary?.length) {
          forecast.fullContent.transitAnalysis.secondary.forEach((_, i) => {
            sections.push({ id: `transit-${i}`, label: `TRANSIT ${i + 2}` });
          });
        }
      }

      sections.push({ id: 'insights', label: 'INSIGHTS' });
      sections.push({ id: 'practice', label: 'PRACTICE' });
      sections.push({ id: 'conclusion', label: 'CLOSING' });
    } else if (isV1) {
      // V1 Format - legacy sections
      sections.push({ id: 'overview', label: 'OVERVIEW' });
      sections.push({ id: 'morning', label: 'MORNING' });
      sections.push({ id: 'afternoon', label: 'AFTERNOON' });
      sections.push({ id: 'evening', label: 'EVENING' });
      sections.push({ id: 'advice', label: 'ADVICE' });
      sections.push({ id: 'transits', label: 'TRANSITS' });
    }

    return sections;
  };

  const sections = buildSections();

  // Auto-scroll section navigation to show active section
  useEffect(() => {
    if (sectionNavScrollRef.current && sections.length > 0) {
      const itemWidth = 110;
      const scrollPosition = currentSectionIndex * itemWidth - 100;

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

  // Scroll section navigation left
  const scrollSectionNavLeft = () => {
    if (sectionNavScrollRef.current) {
      const scrollAmount = 250;
      sectionNavScrollRef.current.scrollTo({
        x: Math.max(0, (currentScrollX || 0) - scrollAmount),
        animated: true,
      });
    }
  };

  // Scroll section navigation right
  const scrollSectionNavRight = () => {
    if (sectionNavScrollRef.current) {
      const scrollAmount = 250;
      sectionNavScrollRef.current.scrollTo({
        x: (currentScrollX || 0) + scrollAmount,
        animated: true,
      });
    }
  };

  // Track current scroll position
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

  // Loading state
  if (isLoadingForecast || isGeneratingForecast) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingScreen context="synastry" />
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

  // ===== HELPER FUNCTIONS =====

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

  // ===== SECTION RENDER FUNCTIONS =====

  const renderOverview = () => {
    if (!forecast) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Energy</Text>
        <Text style={[styles.headerSubtitle, { marginBottom: spacing.sm }]}>
          {forecast.preview.topTheme}
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

        {isV2 && forecast.fullContent.introduction && (
          <>
            <Text style={styles.subsectionTitle}>Overview</Text>
            <Text style={styles.bodyText}>{forecast.fullContent.introduction}</Text>
          </>
        )}
      </View>
    );
  };

  const renderMorning = () => {
    if (!forecast) return null;

    const content = forecast.fullContent;

    if (isV2) {
      const morning = content.timeBasedForecasts.morning;
      return (
        <View style={styles.section}>
          <View style={styles.timeSectionHeader}>
            <Ionicons name="sunny-outline" size={24} color={colors.text.primary} />
            <Text style={[styles.sectionTitle, { marginTop: 0, marginLeft: spacing.sm }]}>
              Morning (6am-12pm)
            </Text>
          </View>

          {morning.energy && (
            <View style={styles.energyBadgeSmall}>
              <Text style={styles.energyTextSmall}>{morning.energy}</Text>
            </View>
          )}

          <Text style={styles.bodyText}>{morning.narrative}</Text>

          {morning.bestFor && morning.bestFor.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>Best For</Text>
              {morning.bestFor.map((item, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={[styles.listBullet, { color: '#4CAF50' }]}>✦</Text>
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}
            </>
          )}

          {morning.avoid && morning.avoid.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>Avoid</Text>
              {morning.avoid.map((item, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={[styles.listBullet, { color: '#F44336' }]}>✦</Text>
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}
            </>
          )}
        </View>
      );
    } else if (isV1) {
      return (
        <View style={styles.section}>
          <View style={styles.timeSectionHeader}>
            <Ionicons name="sunny-outline" size={24} color={colors.text.primary} />
            <Text style={[styles.sectionTitle, { marginTop: 0, marginLeft: spacing.sm }]}>
              Morning (6am-12pm)
            </Text>
          </View>
          <Text style={styles.bodyText}>{content.morningForecast}</Text>
        </View>
      );
    }

    return null;
  };

  const renderAfternoon = () => {
    if (!forecast) return null;

    const content = forecast.fullContent;

    if (isV2) {
      const afternoon = content.timeBasedForecasts.afternoon;
      return (
        <View style={styles.section}>
          <View style={styles.timeSectionHeader}>
            <Ionicons name="partly-sunny-outline" size={24} color={colors.text.primary} />
            <Text style={[styles.sectionTitle, { marginTop: 0, marginLeft: spacing.sm }]}>
              Afternoon (12pm-6pm)
            </Text>
          </View>

          {afternoon.energy && (
            <View style={styles.energyBadgeSmall}>
              <Text style={styles.energyTextSmall}>{afternoon.energy}</Text>
            </View>
          )}

          <Text style={styles.bodyText}>{afternoon.narrative}</Text>

          {afternoon.bestFor && afternoon.bestFor.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>Best For</Text>
              {afternoon.bestFor.map((item, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={[styles.listBullet, { color: '#4CAF50' }]}>✦</Text>
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}
            </>
          )}

          {afternoon.avoid && afternoon.avoid.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>Avoid</Text>
              {afternoon.avoid.map((item, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={[styles.listBullet, { color: '#F44336' }]}>✦</Text>
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}
            </>
          )}
        </View>
      );
    } else if (isV1) {
      return (
        <View style={styles.section}>
          <View style={styles.timeSectionHeader}>
            <Ionicons name="partly-sunny-outline" size={24} color={colors.text.primary} />
            <Text style={[styles.sectionTitle, { marginTop: 0, marginLeft: spacing.sm }]}>
              Afternoon (12pm-6pm)
            </Text>
          </View>
          <Text style={styles.bodyText}>{content.afternoonForecast}</Text>
        </View>
      );
    }

    return null;
  };

  const renderEvening = () => {
    if (!forecast) return null;

    const content = forecast.fullContent;

    if (isV2) {
      const evening = content.timeBasedForecasts.evening;
      return (
        <View style={styles.section}>
          <View style={styles.timeSectionHeader}>
            <Ionicons name="moon-outline" size={24} color={colors.text.primary} />
            <Text style={[styles.sectionTitle, { marginTop: 0, marginLeft: spacing.sm }]}>
              Evening (6pm-12am)
            </Text>
          </View>

          {evening.energy && (
            <View style={styles.energyBadgeSmall}>
              <Text style={styles.energyTextSmall}>{evening.energy}</Text>
            </View>
          )}

          <Text style={styles.bodyText}>{evening.narrative}</Text>

          {evening.bestFor && evening.bestFor.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>Best For</Text>
              {evening.bestFor.map((item, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={[styles.listBullet, { color: '#4CAF50' }]}>✦</Text>
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}
            </>
          )}

          {evening.avoid && evening.avoid.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>Avoid</Text>
              {evening.avoid.map((item, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={[styles.listBullet, { color: '#F44336' }]}>✦</Text>
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}
            </>
          )}
        </View>
      );
    } else if (isV1) {
      return (
        <View style={styles.section}>
          <View style={styles.timeSectionHeader}>
            <Ionicons name="moon-outline" size={24} color={colors.text.primary} />
            <Text style={[styles.sectionTitle, { marginTop: 0, marginLeft: spacing.sm }]}>
              Evening (6pm-12am)
            </Text>
          </View>
          <Text style={styles.bodyText}>{content.eveningForecast}</Text>
        </View>
      );
    }

    return null;
  };

  const renderGuidance = () => {
    if (!forecast) return null;

    const content = forecast.fullContent;

    if (isV2) {
      const { guidance } = content;
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Guidance</Text>

          <Text style={styles.subsectionTitle}>Focus On</Text>
          <Text style={styles.bodyText}>{guidance.focusOn}</Text>

          {guidance.exploreTogether && guidance.exploreTogether.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>Explore Together</Text>
              {guidance.exploreTogether.map((item, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={styles.listBullet}>✦</Text>
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}
            </>
          )}

          {guidance.beMindfulOf && guidance.beMindfulOf.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>Be Mindful Of</Text>
              {guidance.beMindfulOf.map((item, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={styles.listBullet}>✦</Text>
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}
            </>
          )}
        </View>
      );
    }

    return null;
  };

  const renderAdvice = () => {
    if (!forecast || !isV1) return null;

    const { advice, activitiesSuggested, activitiesToAvoid } = forecast.fullContent;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Guidance for Today</Text>

        {advice && advice.length > 0 && (
          <>
            <Text style={styles.subsectionTitle}>Advice</Text>
            {advice.map((item, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.listBullet}>✦</Text>
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </>
        )}

        {activitiesSuggested && activitiesSuggested.length > 0 && (
          <>
            <Text style={[styles.subsectionTitle, { marginTop: spacing.lg }]}>Do Together</Text>
            {activitiesSuggested.map((item, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={[styles.listBullet, { color: '#4CAF50' }]}>✓</Text>
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </>
        )}

        {activitiesToAvoid && activitiesToAvoid.length > 0 && (
          <>
            <Text style={[styles.subsectionTitle, { marginTop: spacing.lg }]}>Avoid Today</Text>
            {activitiesToAvoid.map((item, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={[styles.listBullet, { color: '#F44336' }]}>✗</Text>
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </>
        )}
      </View>
    );
  };

  const renderTransit = (transitIndex: number) => {
    if (!forecast || !isV2) return null;

    const { transitAnalysis } = forecast.fullContent;
    let transit;

    if (transitIndex === 0) {
      transit = transitAnalysis.primary;
    } else if (transitAnalysis.secondary && transitAnalysis.secondary[transitIndex - 1]) {
      transit = transitAnalysis.secondary[transitIndex - 1];
    } else {
      return null;
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transit {transitIndex + 1}</Text>

        <View style={styles.transitAspect}>
          <Text style={styles.transitAspectText}>{transit.aspect}</Text>
        </View>

        <Text style={styles.subsectionTitle}>Interpretation</Text>
        <Text style={styles.bodyText}>{transit.interpretation}</Text>

        {transit.timing && (
          <>
            <Text style={styles.subsectionTitle}>Timing</Text>
            <Text style={styles.bodyText}>{transit.timing}</Text>
          </>
        )}

        {transit.advice && (
          <>
            <Text style={styles.subsectionTitle}>Advice</Text>
            <Text style={styles.bodyText}>{transit.advice}</Text>
          </>
        )}
      </View>
    );
  };

  const renderTransitsV1 = () => {
    if (!forecast || !isV1) return null;

    const { transitAnalysis } = forecast.fullContent;
    if (!transitAnalysis) return null;

    // Split into paragraphs
    const paragraphs = transitAnalysis.split('\n\n').filter((p) => p.trim().length > 0);

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transit Analysis</Text>
        {paragraphs.map((paragraph, index) => (
          <Text key={index} style={styles.bodyText}>
            {paragraph}
          </Text>
        ))}
      </View>
    );
  };

  const renderInsights = () => {
    if (!forecast || !isV2) return null;

    const { relationshipInsights } = forecast.fullContent;
    if (!relationshipInsights || relationshipInsights.length === 0) return null;

    const insightLabels = [
      'Connection Quality',
      'Communication Climate',
      'Emotional Tone',
      'Growth Opportunities',
      'Challenges to Navigate'
    ];

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Relationship Insights</Text>
        {relationshipInsights.map((insight, index) => (
          <View key={index} style={styles.insightItem}>
            <Text style={styles.subsectionTitle}>{insightLabels[index] || `Insight ${index + 1}`}</Text>
            <Text style={styles.bodyText}>{insight}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderPractice = () => {
    if (!forecast || !isV2) return null;

    const { connectionPractice } = forecast.fullContent;
    if (!connectionPractice) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Connection Practice</Text>

        <Text style={styles.subsectionTitle}>Exercise</Text>
        <Text style={styles.bodyText}>{connectionPractice.exercise}</Text>

        {connectionPractice.affirmation && (
          <>
            <Text style={styles.subsectionTitle}>Affirmation</Text>
            <View style={styles.affirmationCard}>
              <Text style={styles.affirmationText}>{connectionPractice.affirmation}</Text>
            </View>
          </>
        )}

        {connectionPractice.reflectionPrompts && connectionPractice.reflectionPrompts.length > 0 && (
          <>
            <Text style={styles.subsectionTitle}>Reflection Prompts</Text>
            {connectionPractice.reflectionPrompts.map((prompt, index) => (
              <View key={index} style={styles.reflectionItem}>
                <Text style={styles.reflectionNumber}>{index + 1}.</Text>
                <Text style={styles.reflectionText}>{prompt}</Text>
              </View>
            ))}
          </>
        )}
      </View>
    );
  };

  const renderConclusion = () => {
    if (!forecast || !isV2) return null;

    const { conclusion } = forecast.fullContent;
    if (!conclusion) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Closing Thoughts</Text>
        <Text style={styles.bodyText}>{conclusion}</Text>
      </View>
    );
  };

  // Render current section based on section ID
  const renderCurrentSection = () => {
    if (!forecast || sections.length === 0) return null;

    const currentSection = sections[currentSectionIndex];
    if (!currentSection) return null;

    const sectionId = currentSection.id;

    if (sectionId === 'overview') return renderOverview();
    if (sectionId === 'morning') return renderMorning();
    if (sectionId === 'afternoon') return renderAfternoon();
    if (sectionId === 'evening') return renderEvening();
    if (sectionId === 'guidance') return renderGuidance();
    if (sectionId === 'advice') return renderAdvice();
    if (sectionId === 'transit-primary') return renderTransit(0);
    if (sectionId.startsWith('transit-')) {
      const transitIndex = parseInt(sectionId.replace('transit-', '')) + 1;
      return renderTransit(transitIndex);
    }
    if (sectionId === 'transits') return renderTransitsV1();
    if (sectionId === 'insights') return renderInsights();
    if (sectionId === 'practice') return renderPractice();
    if (sectionId === 'conclusion') return renderConclusion();

    return null;
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
          <Text style={styles.headerName}>{person2Name || 'Synastry Chart'}</Text>
        </View>

        <TouchableOpacity style={styles.refreshButton} onPress={() => loadForecast(true)}>
          <Ionicons name="refresh" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Section Navigation */}
      <View style={styles.sectionNavContainer}>
        <TouchableOpacity onPress={scrollSectionNavLeft} style={styles.navChevron}>
          <Ionicons name="chevron-back" size={20} color={colors.text.primary} />
        </TouchableOpacity>

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
              <Text
                style={[
                  styles.sectionNavLabel,
                  currentSectionIndex === index && styles.activeSectionNavLabel,
                ]}
              >
                {section.label}
              </Text>
              {currentSectionIndex === index && <View style={styles.sectionNavUnderline} />}
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity onPress={scrollSectionNavRight} style={styles.navChevron}>
          <Ionicons name="chevron-forward" size={20} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Content - Current Section Only */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          {renderCurrentSection()}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.navButtonsContainer}>
        <TouchableOpacity onPress={handlePrevious} style={styles.navButton}>
          <Text style={styles.navButtonText}>PREVIOUS</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleNext} style={styles.navButton}>
          <Text style={styles.navButtonText}>NEXT</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  // Loading & Error States
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
  // Header
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
    alignItems: 'flex-start',
    marginLeft: spacing.md,
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
  headerName: {
    ...typography.h3,
    fontSize: 16,
  },
  refreshButton: {
    padding: spacing.xs,
  },
  // Section Navigation (Horizontal Tabs)
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
  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h2,
    marginBottom: spacing.sm,
  },
  subsectionTitle: {
    ...typography.h3,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  bodyText: {
    ...typography.body,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  // Energy Badges
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
  energyBadgeSmall: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 6,
    marginBottom: spacing.sm,
  },
  energyTextSmall: {
    ...typography.caption,
    fontSize: 11,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  // Time Section
  timeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  // Lists
  listItem: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  listBullet: {
    ...typography.body,
    lineHeight: 20,
    marginRight: spacing.xs,
    color: colors.primary,
  },
  listText: {
    ...typography.body,
    lineHeight: 20,
    flex: 1,
  },
  // Transit Section
  transitAspect: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  transitAspectText: {
    ...typography.h3,
    fontSize: 14,
    textAlign: 'center',
    color: '#F6D99F',
  },
  // Insights
  insightItem: {
    marginBottom: spacing.md,
  },
  // Affirmation Card
  affirmationCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 8,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  affirmationText: {
    ...typography.h3,
    textTransform: 'none',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 24,
  },
  // Reflections
  reflectionItem: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  reflectionNumber: {
    ...typography.body,
    color: colors.text.secondary,
    marginRight: spacing.sm,
  },
  reflectionText: {
    ...typography.body,
    lineHeight: 20,
    flex: 1,
  },
  // Bottom Navigation
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
});
