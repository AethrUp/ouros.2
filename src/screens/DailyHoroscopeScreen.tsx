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
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../styles';
import { useAppStore } from '../store';
import { getDailyHoroscope } from '../handlers/horoscopeGeneration';

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

const DailyHoroscopeScreen = () => {
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  const isMountedRef = useRef(true);
  const [activeTab, setActiveTab] = useState(0);
  const [sectionPositions, setSectionPositions] = useState<Record<string, number>>({});
  const [isNavigating, setIsNavigating] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Get data from store
  const {
    profile,
    birthData,
    natalChart,
    dailyHoroscope,
    cosmicWeather,
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
        selectedCategories: profile.selectedCategories || [],
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
    const selectedCategories = profile?.selectedCategories || [];
    if (selectedCategories.length > 0 && !activeCategory) {
      setActiveCategory(selectedCategories[0]);
    }
  }, [profile, activeCategory]);

  // Section configuration
  const sections = [
    { id: 'fullReading', label: 'Full Reading', shortLabel: 'READING' },
    { id: 'transits', label: 'Planetary Transits', shortLabel: 'TRANSITS' },
    { id: 'guidance', label: 'Daily Guidance', shortLabel: 'GUIDANCE' },
    { id: 'spiritual', label: 'Spiritual Practice', shortLabel: 'SPIRITUAL' },
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

  // Render full reading section
  const renderFullReading = () => {
    const fullReading = fullContent.fullReading;
    const timeGuidance = fullContent.timeGuidance;

    if (!fullReading) {
      return (
        <View onLayout={(e) => measureSection('fullReading', e)} style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Reading</Text>
          <Text style={styles.bodyText}>{content.summary || preview.summary || 'Loading your personalized reading...'}</Text>
          {content.advice && <Text style={styles.bodyText}>{content.advice}</Text>}
        </View>
      );
    }

    return (
      <View onLayout={(e) => measureSection('fullReading', e)} style={styles.section}>
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

        {/* Body Paragraphs with Time Headings */}
        <View style={styles.timeSectionsContainer}>
          {fullReading.bodyParagraphs &&
            fullReading.bodyParagraphs.map((paragraph, index) => {
              const timeHeadings = ['Morning', 'Afternoon', 'Evening'];
              const timeKeys = ['morning', 'afternoon', 'evening'] as const;
              const guidance = timeGuidance?.[timeKeys[index]];

              return (
                <View key={index} style={styles.timeSection}>
                  <Text style={[styles.sectionTitle, { marginTop: 0 }]}>{timeHeadings[index]}</Text>
                  {guidance?.energy && (
                    <Text style={[styles.subsectionTitle, { color: colors.text.primary + '80', marginTop: 0, marginBottom: spacing.sm }]}>
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
            })}
        </View>

        {/* Conclusion */}
        {fullReading.conclusion && (
          <View style={styles.conclusionSection}>
            <Text style={styles.bodyText}>{fullReading.conclusion}</Text>
          </View>
        )}
      </View>
    );
  };

  // Render transit analysis section
  const renderTransits = () => {
    const transitAnalysis = fullContent.transitAnalysis;
    const transitInsights = fullContent.transitInsights || content.transitInsights || [];

    return (
      <View onLayout={(e) => measureSection('transits', e)} style={styles.section}>
        <View style={styles.sectionDivider} />
        <Text style={[styles.titleText, { paddingHorizontal: 0, marginTop: spacing.lg, marginBottom: spacing.sm }]}>Planetary Transits</Text>

        {/* Primary Transit */}
        {transitAnalysis?.primary && (
          <View style={styles.transitItem}>
            <Text style={[styles.sectionTitle, { marginTop: 0 }]}>{transitAnalysis.primary.aspect}</Text>
            {transitAnalysis.primary.timing && <Text style={[styles.transitTiming, { fontStyle: 'italic' }]}>{transitAnalysis.primary.timing}</Text>}
            <Text style={styles.bodyText}>{transitAnalysis.primary.interpretation}</Text>
            {transitAnalysis.primary.advice && <Text style={styles.bodyText}>{transitAnalysis.primary.advice}</Text>}
          </View>
        )}

        {/* Secondary Transits */}
        {transitAnalysis?.secondary &&
          transitAnalysis.secondary.map((transit, index) => (
            <View key={index} style={styles.transitItem}>
              <Text style={[styles.sectionTitle, { marginTop: 0 }]}>{transit.aspect}</Text>
              {transit.timing && <Text style={[styles.transitTiming, { fontStyle: 'italic' }]}>{transit.timing}</Text>}
              <Text style={styles.bodyText}>{transit.interpretation}</Text>
              {transit.advice && <Text style={styles.bodyText}>{transit.advice}</Text>}
            </View>
          ))}

        {/* Transit Insights */}
        {transitInsights.length > 0 && (
          <View style={styles.insightsContainer}>
            {transitInsights.map((insight, index) => {
              const categories = ['Energy', 'Influence', 'Emotion', 'Opportunities', 'Challenges'];
              const category = categories[index] || '';

              return (
                <View key={index} style={styles.insightItem}>
                  {category && <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: spacing.xs }]}>{category}</Text>}
                  <Text style={styles.bodyText}>{insight}</Text>
                </View>
              );
            })}
          </View>
        )}
        <View style={styles.sectionDivider} />
      </View>
    );
  };

  // Render guidance section
  const renderGuidance = () => {
    const explore = fullContent.explore || content.explore || [];
    const limit = fullContent.limit || content.limit || [];
    const dailyFocus = fullContent.dailyFocus || content.dailyFocus;

    return (
      <View onLayout={(e) => measureSection('guidance', e)} style={styles.section}>
        <Text style={[styles.titleText, { marginTop: spacing.lg, marginBottom: spacing.sm, color: colors.text.primary, paddingHorizontal: 0 }]}>
          Daily Guidance
        </Text>

        {dailyFocus && (
          <View>
            <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: spacing.sm }]}>Today's Focus</Text>
            <Text style={styles.bodyText}>{dailyFocus}</Text>
          </View>
        )}

        <View style={styles.exploreContainer}>
          {explore.length > 0 && (
            <View style={styles.exploreSection}>
              <Text style={[styles.sectionTitle, { marginTop: 0 }]}>Explore Today</Text>
              {explore.map((item, index) => (
                <Text key={index} style={[styles.bodyText, { marginBottom: spacing.xs }]}>
                  ✦ {item}
                </Text>
              ))}
            </View>
          )}

          {limit.length > 0 && (
            <View style={[styles.exploreSection, { marginBottom: spacing.lg }]}>
              <Text style={[styles.sectionTitle, { marginTop: spacing.md }]}>Be Mindful Of</Text>
              {limit.map((item, index) => (
                <Text key={index} style={[styles.bodyText, { marginBottom: spacing.xs }]}>
                  ✦ {item}
                </Text>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  // Render spiritual section
  const renderSpiritual = () => {
    const spiritualGuidance = fullContent.spiritualGuidance;
    const weather = preview.weather || content.weather || cosmicWeather;

    return (
      <View onLayout={(e) => measureSection('spiritual', e)} style={styles.section}>
        <Text style={[styles.sectionTitle, { marginTop: 0 }]}>Spiritual Practice</Text>

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

        {spiritualGuidance?.ritualSuggestion && (
          <View style={styles.spiritualCard}>
            <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: spacing.sm }]}>Ritual Suggestion</Text>
            <Text style={styles.bodyText}>{spiritualGuidance.ritualSuggestion}</Text>
          </View>
        )}

        {/* Cosmic Weather */}
        {weather && (
          <View style={styles.cosmicWeatherSection}>
            <Text style={[styles.titleText, { paddingHorizontal: 0, marginBottom: spacing.sm, color: colors.text.primary }]}>Cosmic Weather</Text>

            {weather.moon && (
              <View style={styles.symbolRow}>
                <Text style={styles.symbolIcon}>{typeof weather.moon === 'object' && weather.moon.symbol ? weather.moon.symbol : '☽'}</Text>
                <View style={styles.symbolContent}>
                  <Text style={styles.symbolTitle}>
                    {typeof weather.moon === 'object' && weather.moon.title ? weather.moon.title : 'Lunar influence for today'}
                  </Text>
                  <Text style={styles.symbolDescription}>
                    {typeof weather.moon === 'object' && weather.moon.description
                      ? weather.moon.description
                      : typeof weather.moon === 'string'
                      ? weather.moon
                      : 'The moon brings intuitive wisdom and emotional clarity.'}
                  </Text>
                </View>
              </View>
            )}

            {weather.venus && (
              <View style={styles.symbolRow}>
                <Text style={styles.symbolIcon}>{typeof weather.venus === 'object' && weather.venus.symbol ? weather.venus.symbol : '♀'}</Text>
                <View style={styles.symbolContent}>
                  <Text style={styles.symbolTitle}>
                    {typeof weather.venus === 'object' && weather.venus.title ? weather.venus.title : 'Venus brings harmony'}
                  </Text>
                  <Text style={styles.symbolDescription}>
                    {typeof weather.venus === 'object' && weather.venus.description
                      ? weather.venus.description
                      : typeof weather.venus === 'string'
                      ? weather.venus
                      : 'Venus enhances love, creativity, and beauty in your day.'}
                  </Text>
                </View>
              </View>
            )}

            {weather.mercury && (
              <View style={styles.symbolRow}>
                <Text style={styles.symbolIcon}>{typeof weather.mercury === 'object' && weather.mercury.symbol ? weather.mercury.symbol : '☿'}</Text>
                <View style={styles.symbolContent}>
                  <Text style={styles.symbolTitle}>
                    {typeof weather.mercury === 'object' && weather.mercury.title ? weather.mercury.title : 'Mercury enhances communication'}
                  </Text>
                  <Text style={styles.symbolDescription}>
                    {typeof weather.mercury === 'object' && weather.mercury.description
                      ? weather.mercury.description
                      : typeof weather.mercury === 'string'
                      ? weather.mercury
                      : 'Mercury supports clear thinking and meaningful connections.'}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  // Render category navigation
  const renderCategoryNav = () => {
    const selectedCategories = profile?.selectedCategories || [];
    const allCategories = Object.keys(categoryIcons);

    return (
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
    );
  };

  // Render active category advice
  const renderActiveCategoryAdvice = () => {
    if (!activeCategory) return null;

    const categoryAdvice = dailyHoroscope?.content?.categoryAdvice;
    if (!categoryAdvice || !categoryAdvice[activeCategory]) return null;

    const advice = categoryAdvice[activeCategory];
    const cleanTitle = advice.title
      ? advice.title.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim()
      : `${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)}`;

    return (
      <View style={styles.categorySection}>
        <Text style={styles.categoryTitle}>{cleanTitle}</Text>
        <Text style={styles.categoryContent}>{advice.content}</Text>
      </View>
    );
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

      {/* Progress Navigation */}
      <View style={styles.progressNavigation}>
        {sections.map((section, index) => (
          <TouchableOpacity key={section.id} style={styles.progressItem} onPress={() => handleSectionPress(index, section.id)}>
            <Text style={[styles.progressLabel, activeTab === index && styles.activeProgressLabel]}>{section.shortLabel}</Text>
            {activeTab === index && <View style={styles.activeUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView ref={scrollViewRef} style={styles.scrollContainer} showsVerticalScrollIndicator={false} onScroll={handleScroll} scrollEventThrottle={16}>
        {renderFullReading()}
        {renderTransits()}
        {renderGuidance()}
        {renderSpiritual()}

        <View style={styles.dividerLine} />

        {renderCategoryNav()}
        {renderActiveCategoryAdvice()}

        <View style={styles.bottomSpacer} />
      </ScrollView>

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
  progressNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '30',
    marginBottom: spacing.md,
  },
  progressItem: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  progressLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    letterSpacing: 1,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
  activeProgressLabel: {
    color: colors.text.primary,
  },
  activeUnderline: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    width: '80%',
    backgroundColor: colors.text.primary,
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
  cosmicWeatherSection: {
    borderTopWidth: 1,
    borderTopColor: colors.text.primary,
  },
  symbolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  symbolIcon: {
    color: colors.text.primary,
    marginRight: spacing.lg,
    width: 32,
    textAlign: 'center',
  },
  symbolContent: {
    flex: 1,
  },
  symbolTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  symbolDescription: {
    ...typography.body,
    lineHeight: 20,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.text.primary,
  },
  bottomSpacer: {
    height: spacing.xl * 2,
  },
  dividerLine: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
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
});

export default DailyHoroscopeScreen;
