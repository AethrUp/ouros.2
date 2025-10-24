import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { NavigationProps } from '../types';
import { HeaderBar, Button, TransitEffectivenessGraph, TransitStrengthBar, CosmicWeatherChart, ZodiacIcon, LoadingScreen, TarotIcon, IChingIcon, DreamIcon, NatalIcon, JournalIcon, LockedFeatureCard, Badge } from '../components';
import { colors, spacing, typography } from '../styles';
import { useAppStore } from '../store';
import { getDailyHoroscope } from '../handlers/horoscopeGeneration';
import { Ionicons } from '@expo/vector-icons';
import { useSubscriptionTier } from '../hooks/useFeatureAccess';
import { PaywallModal } from '../components/PaywallModal';

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

export const HomeScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const isMountedRef = useRef(true);
  const { tier, isFree, isPremium, isPro } = useSubscriptionTier();
  const [showPaywall, setShowPaywall] = useState(false);

  // Animation values for sequential card fade-in
  const fadeAnims = useRef([
    new Animated.Value(0), // horoscopeCard
    new Animated.Value(0), // transitSection
    new Animated.Value(0), // cosmicWeatherSection
    new Animated.Value(0), // categoriesSection
    new Animated.Value(0), // journalPromptsSection
    new Animated.Value(0), // synastrySection
    new Animated.Value(0), // quickActions
  ]).current;

  const {
    profile,
    birthData,
    natalChart,
    dailyHoroscope,
    isLoadingDailyReading,
    isGeneratingHoroscope,
    dailyReadingError,
    setDailyHoroscope,
    setLoadingDailyReading,
    setDailyReadingError,
    setGenerationMetadata,
    setGeneratingHoroscope,
    connections,
    savedCharts,
    synastryReadings,
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

  // Load horoscope on mount
  useEffect(() => {
    loadHoroscope();
  }, []);

  // Trigger sequential fade-in animations when content is loaded
  useEffect(() => {
    if (!isLoadingDailyReading && dailyHoroscope) {
      // Reset all animations
      fadeAnims.forEach(anim => anim.setValue(0));

      // Create staggered animations
      const animations = fadeAnims.map((anim, index) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 400,
          delay: index * 100, // 100ms delay between each card
          useNativeDriver: true,
        })
      );

      // Start all animations in parallel (they're already staggered by delay)
      Animated.parallel(animations).start();
    }
  }, [isLoadingDailyReading, dailyHoroscope]);

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

  // Get current date
  const getCurrentDate = () => {
    const today = new Date();
    return today
      .toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
      .toUpperCase();
  };

  // Navigate to full horoscope
  const viewFullHoroscope = () => {
    navigation.navigate('DailyHoroscope');
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
        id: savedReading.id,
        reading_type: 'horoscope' as const,
        title: `Daily Horoscope - ${getCurrentDate()}`,
        timestamp: new Date().toISOString(),
        interpretation: dailyHoroscope?.fullContent?.fullReading?.introduction || dailyHoroscope?.content?.summary || '',
        intention: prompt,
        metadata: {
          prompt: prompt,
          promptIndex: promptIndex,
          date: getCurrentDate(),
          hasTransits: !!dailyHoroscope?.fullContent?.transitAnalysis,
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
    }
  };

  // Get recent synastry connections (both friends and saved charts)
  const getRecentSynastryConnections = () => {
    const allConnections: Array<{
      id: string;
      name: string;
      type: 'friend' | 'saved';
      createdAt: string;
      hasReading?: boolean;
      focusArea?: string;
      sunSign?: string;
    }> = [];

    // Add friend connections
    connections.forEach((conn) => {
      // Get sun sign from friend's natal chart if available (check both lowercase and uppercase)
      const planets = conn.friendProfile?.natalChart?.planets;
      const sunSign = planets?.sun?.sign || planets?.Sun?.sign;
      allConnections.push({
        id: conn.connectionId,
        name: conn.friendDisplayName,
        type: 'friend',
        createdAt: conn.createdAt,
        sunSign: sunSign,
      });
    });

    // Add saved charts
    savedCharts.forEach((chart) => {
      const readingForChart = synastryReadings.find((r) => r.synastryChartId === chart.id);
      // Get sun sign from saved chart's natal chart (check both lowercase and uppercase)
      const planets = chart.natalChart?.planets;
      const sunSign = planets?.sun?.sign || planets?.Sun?.sign;
      allConnections.push({
        id: chart.id,
        name: chart.name,
        type: 'saved',
        createdAt: chart.createdAt,
        hasReading: !!readingForChart,
        focusArea: readingForChart?.focusArea,
        sunSign: sunSign,
      });
    });

    // Sort by most recent and take top 5
    return allConnections
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  };

  // Check if connection is new (within last 7 days)
  const isNewConnection = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const daysDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7;
  };

  // Render recent synastry connections
  const renderRecentSynastry = () => {
    const recentConnections = getRecentSynastryConnections();

    if (recentConnections.length === 0 && !isFree) {
      return null;
    }

    const synastryContent = (
      <View style={styles.synastrySection}>
        <Text style={styles.cardSectionTitle}>SYNASTRY READINGS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.synastryScroll}>
          {recentConnections.map((connection) => {
            const isNew = isNewConnection(connection.createdAt);
            const readingTitle = connection.focusArea
              ? connection.focusArea.charAt(0).toUpperCase() + connection.focusArea.slice(1)
              : 'Synastry Reading';

            return (
              <TouchableOpacity
                key={connection.id}
                style={styles.synastryCard}
                onPress={() => {
                  if (connection.type === 'friend') {
                    // Find the actual friend connection
                    const friendConnection = connections.find(c => c.connectionId === connection.id);
                    if (friendConnection) {
                      navigation.navigate('friends', {
                        screen: 'Synastry',
                        params: { connection: friendConnection }
                      });
                    }
                  } else {
                    // It's a saved chart - create a mock FriendConnection
                    const savedChart = savedCharts.find(sc => sc.id === connection.id);
                    if (savedChart) {
                      const mockConnection: any = {
                        connectionId: savedChart.id,
                        friendId: savedChart.id,
                        friendEmail: '',
                        friendDisplayName: savedChart.name,
                        friendCode: '',
                        userSharesChart: true,
                        friendSharesChart: true,
                        relationshipLabel: savedChart.relationship,
                        createdAt: savedChart.createdAt,
                      };
                      navigation.navigate('friends', {
                        screen: 'Synastry',
                        params: {
                          connection: mockConnection,
                          savedChart: savedChart
                        }
                      });
                    }
                  }
                }}
              >
                {isNew && <Badge variant="new" />}
                {connection.sunSign && (
                  <View style={styles.zodiacIconContainer}>
                    <ZodiacIcon sign={connection.sunSign} size={32} color="#FFFFFF" />
                  </View>
                )}
                <Text style={styles.synastryName}>{connection.name}</Text>
                <Text style={styles.synastryReading} numberOfLines={1}>
                  {readingTitle}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Invite Friend Card */}
          <TouchableOpacity
            style={styles.inviteFriendCard}
            onPress={() => navigation.navigate('friends', { screen: 'FriendsHome' })}
          >
            <Ionicons name="person-add" size={32} color={colors.text.primary} style={styles.inviteFriendIcon} />
            <Text style={styles.inviteFriendText}>Invite Friend</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );

    if (isFree) {
      return (
        <Animated.View style={{ opacity: fadeAnims[5] }}>
          <LockedFeatureCard
            featureName="Synastry Readings"
            featureDescription="Explore compatibility and relationship dynamics with friends and loved ones"
            requiredTier="premium"
            onUpgrade={() => setShowPaywall(true)}
            style={{ marginHorizontal: spacing.lg, marginBottom: spacing.lg }}
          >
            {synastryContent}
          </LockedFeatureCard>
        </Animated.View>
      );
    }

    return (
      <Animated.View style={{ opacity: fadeAnims[5] }}>
        {synastryContent}
      </Animated.View>
    );
  };

  // Render category previews
  const renderCategoryPreviews = () => {
    const selectedCategories = profile?.selectedCategories || [];
    if (selectedCategories.length === 0) return null;

    const categoryAdvice = dailyHoroscope?.preview?.categoryAdvice || {};

    const categoryContent = (
      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>YOUR CATEGORIES</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {selectedCategories.map((category) => {
            const advice = categoryAdvice[category];
            if (!advice) return null;

            const iconName = categoryIcons[category];

            return (
              <TouchableOpacity
                key={category}
                style={styles.categoryCard}
                onPress={viewFullHoroscope}
              >
                <Ionicons name={iconName} size={24} color={colors.text.primary} />
                <Text style={styles.categoryName}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
                <Text style={styles.categoryPreview} numberOfLines={3}>
                  {advice.content}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );

    if (isFree) {
      return (
        <Animated.View style={{ opacity: fadeAnims[3] }}>
          <LockedFeatureCard
            featureName="Category Insights"
            featureDescription="Get personalized guidance for your selected life areas"
            requiredTier="premium"
            onUpgrade={() => setShowPaywall(true)}
            style={{ marginHorizontal: spacing.lg, marginBottom: spacing.lg }}
          >
            {categoryContent}
          </LockedFeatureCard>
        </Animated.View>
      );
    }

    return (
      <Animated.View style={{ opacity: fadeAnims[3] }}>
        {categoryContent}
      </Animated.View>
    );
  };

  // Render journal prompts
  const renderJournalPrompts = () => {
    const journalPrompts = dailyHoroscope?.fullContent?.spiritualGuidance?.journalPrompts || [];

    if (journalPrompts.length === 0) return null;

    const promptsContent = (
      <View style={styles.journalPromptsSection}>
        <Text style={styles.journalPromptsTitle}>JOURNAL PROMPTS</Text>
        {journalPrompts.map((prompt, index) => (
          <View key={index} style={styles.journalPromptCard}>
            <View style={styles.journalPromptHeader}>
              <View style={styles.journalIconContainer}>
                <JournalIcon size={32} color="#F6D99F" />
              </View>
              <Text style={styles.journalPromptText}>{prompt}</Text>
            </View>
            <View style={styles.startWritingButtonContainer}>
              <Button
                title="Start Writing"
                onPress={() => handleJournalPrompt(prompt, index)}
                variant="primary"
                size="small"
              />
            </View>
          </View>
        ))}
      </View>
    );

    if (isFree) {
      return (
        <Animated.View style={{ opacity: fadeAnims[4] }}>
          <LockedFeatureCard
            featureName="Journal Prompts"
            featureDescription="Deepen your self-reflection with personalized daily journal prompts"
            requiredTier="premium"
            onUpgrade={() => setShowPaywall(true)}
            style={{ marginHorizontal: spacing.lg, marginBottom: spacing.lg }}
          >
            {promptsContent}
          </LockedFeatureCard>
        </Animated.View>
      );
    }

    return (
      <Animated.View style={{ opacity: fadeAnims[4] }}>
        {promptsContent}
      </Animated.View>
    );
  };

  const content = (
    <>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Date Header */}
        <View style={styles.dateHeader}>
          <Text style={styles.dateText}>{getCurrentDate()}</Text>
        </View>

        {/* Loading State (for refreshes when horoscope exists) */}
        {isLoadingDailyReading && dailyHoroscope && (
          <View style={styles.loadingCard}>
            <LoadingScreen context="natal-chart" />
          </View>
        )}

        {/* Error State */}
        {dailyReadingError && !isLoadingDailyReading && (
          <View style={styles.errorCard}>
            <Ionicons name="warning-outline" size={32} color={colors.text.secondary} />
            <Text style={styles.errorText}>{dailyReadingError}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => loadHoroscope(true)}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Horoscope Preview */}
        {!isLoadingDailyReading && !dailyReadingError && dailyHoroscope && (
          <>
            {/* Main Horoscope Card */}
            <Animated.View style={[styles.horoscopeCard, { opacity: fadeAnims[0] }]}>
              {/* Transit Strength Bar */}
              {dailyHoroscope.fullContent?.astronomicalData?.transits?.aspects && (
                <TransitStrengthBar
                  transits={dailyHoroscope.fullContent.astronomicalData.transits.aspects}
                  maxTransits={3}
                />
              )}

              <Text style={styles.horoscopeTitle}>{dailyHoroscope.preview?.title}</Text>
              <Text style={styles.horoscopeSummary} numberOfLines={4}>
                {dailyHoroscope.preview?.summary}
              </Text>

              <View style={styles.readMoreContainer}>
                <Button
                  title="Read Full Horoscope"
                  onPress={viewFullHoroscope}
                  variant="primary"
                  size="small"
                />
              </View>
            </Animated.View>

            {/* Transit Effectiveness Graph */}
            {dailyHoroscope.fullContent?.transitAnalysis && (
              <Animated.View style={{ opacity: fadeAnims[1] }}>
                {isFree ? (
                  <LockedFeatureCard
                    featureName="Today's Transits"
                    featureDescription="See how planetary movements affect your chart with detailed transit analysis"
                    requiredTier="premium"
                    onUpgrade={() => setShowPaywall(true)}
                    style={{ marginHorizontal: spacing.lg, marginBottom: spacing.lg }}
                  >
                    <View style={styles.transitSection}>
                      <Text style={styles.cardSectionTitle}>TODAY'S TRANSITS</Text>
                      <TransitEffectivenessGraph
                        transits={[
                          dailyHoroscope.fullContent.transitAnalysis.primary,
                          ...(dailyHoroscope.fullContent.transitAnalysis.secondary || []),
                        ]}
                        maxTransits={3}
                      />
                    </View>
                  </LockedFeatureCard>
                ) : (
                  <View style={styles.transitSection}>
                    <Text style={styles.cardSectionTitle}>TODAY'S TRANSITS</Text>
                    <TransitEffectivenessGraph
                      transits={[
                        dailyHoroscope.fullContent.transitAnalysis.primary,
                        ...(dailyHoroscope.fullContent.transitAnalysis.secondary || []),
                      ]}
                      maxTransits={3}
                    />
                  </View>
                )}
              </Animated.View>
            )}

            {/* Cosmic Weather Chart */}
            {dailyHoroscope.preview?.weather && (
              <Animated.View style={{ opacity: fadeAnims[2] }}>
                {isFree ? (
                  <LockedFeatureCard
                    featureName="Cosmic Weather"
                    featureDescription="Track the overall astrological climate and its influence on your daily life"
                    requiredTier="premium"
                    onUpgrade={() => setShowPaywall(true)}
                    style={{ marginHorizontal: spacing.lg, marginBottom: spacing.lg }}
                  >
                    <View style={styles.cosmicWeatherSection}>
                      <Text style={styles.cardSectionTitle}>COSMIC WEATHER</Text>
                      <CosmicWeatherChart weather={dailyHoroscope.preview.weather} />
                    </View>
                  </LockedFeatureCard>
                ) : (
                  <View style={styles.cosmicWeatherSection}>
                    <Text style={styles.cardSectionTitle}>COSMIC WEATHER</Text>
                    <CosmicWeatherChart weather={dailyHoroscope.preview.weather} />
                  </View>
                )}
              </Animated.View>
            )}

            {/* Category Previews */}
            {renderCategoryPreviews()}

            {/* Journal Prompts */}
            {renderJournalPrompts()}
          </>
        )}

        {/* Recent Synastry */}
        {renderRecentSynastry()}

        {/* Quick Actions */}
        <Animated.View style={[styles.quickActions, { opacity: fadeAnims[6] }]}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('chart')}
          >
            <View style={styles.natalChartHeader}>
              <View style={styles.natalIcon}>
                <NatalIcon size={48} color="#F6D99F" />
              </View>
              <View style={styles.natalChartTextContainer}>
                <Text style={styles.actionTitle}>Natal Chart</Text>
                <Text style={styles.actionSubtitle}>View your birth chart</Text>
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionCardThird, { marginRight: spacing.sm }]}
              onPress={() => navigation.navigate('oracle', { screen: 'Tarot' })}
            >
              <View style={styles.oracleIcon}>
                <TarotIcon size={48} color="#FFFFFF" />
              </View>
              <Text style={styles.oracleTitle}>Tarot</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCardThird, { marginRight: spacing.sm }]}
              onPress={() => navigation.navigate('oracle', { screen: 'IChing' })}
            >
              <View style={styles.oracleIcon}>
                <IChingIcon size={48} color="#FFFFFF" />
              </View>
              <Text style={styles.oracleTitle}>I Ching</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCardThird, { marginRight: 0 }]}
              onPress={() => {
                if (isFree) {
                  setShowPaywall(true);
                } else {
                  navigation.navigate('oracle', { screen: 'DreamInterpretation' });
                }
              }}
            >
              <View style={styles.oracleIcon}>
                <DreamIcon size={48} color="#FFFFFF" />
              </View>
              <Text style={styles.oracleTitle}>Dreams</Text>
              {isFree && <Badge variant="locked" />}
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </>
  );

  // Show full-screen loading during initial load
  if (isLoadingDailyReading && !dailyHoroscope) {
    return (
      <View style={styles.container}>
        <HeaderBar
          title="OUROS"
          rightActions={[
            {
              icon: 'person-circle-outline',
              onPress: () => navigation.navigate('Profile'),
            },
          ]}
        />
        <View style={styles.initialLoadingContainer}>
          <View style={styles.dateHeader}>
            <Text style={styles.dateText}>{getCurrentDate()}</Text>
          </View>
          <View style={styles.loadingCard}>
            <LoadingScreen context="natal-chart" />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HeaderBar
        title="OUROS"
        rightActions={[
          {
            icon: 'person-circle-outline',
            onPress: () => navigation.navigate('Profile'),
          },
        ]}
      />

      {content}

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSuccess={() => setShowPaywall(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  initialLoadingContainer: {
    flex: 1,
    backgroundColor: colors.background.card,
  },
  scrollContainer: {
    flex: 1,
  },
  dateHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  dateText: {
    ...typography.body,
    fontSize: 16,
    letterSpacing: 1,
    color: '#FFFFFF',
  },
  loadingCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.xl,
    backgroundColor: colors.background.card,
    borderRadius: 12,
    alignItems: 'center',
  },
  loadingText: {
    ...typography.h3,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  loadingSubtext: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  errorCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.xl,
    backgroundColor: colors.background.card,
    borderRadius: 12,
    alignItems: 'center',
  },
  errorText: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.md,
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
  horoscopeCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.background.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  horoscopeTitle: {
    ...typography.h2,
    marginBottom: spacing.md,
  },
  horoscopeSummary: {
    ...typography.body,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  readMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.md,
  },
  transitSection: {
    marginBottom: spacing.lg,
  },
  cosmicWeatherSection: {
    marginBottom: spacing.lg,
  },
  categoriesSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.caption,
    letterSpacing: 1,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  cardSectionTitle: {
    ...typography.body,
    fontSize: 16,
    letterSpacing: 1,
    color: '#FFFFFF',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  synastrySection: {
    marginBottom: spacing.lg,
  },
  synastryScroll: {
    paddingLeft: spacing.lg,
  },
  synastryCard: {
    width: 160,
    marginRight: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.background.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    alignItems: 'center',
  },
  zodiacIconContainer: {
    marginBottom: spacing.xs,
  },
  synastryName: {
    ...typography.h3,
    marginBottom: spacing.xs,
    color: '#F6D99F',
    fontFamily: 'PTSerif_400Regular',
    letterSpacing: 0,
    textAlign: 'center',
  },
  synastryType: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  synastryReading: {
    ...typography.body,
    fontSize: 12,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  inviteFriendCard: {
    width: 160,
    marginRight: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.background.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteFriendIcon: {
    marginBottom: spacing.xs,
  },
  inviteFriendText: {
    ...typography.h3,
    color: '#F6D99F',
    fontFamily: 'PTSerif_400Regular',
    letterSpacing: 0,
    textAlign: 'center',
  },
  categoryScroll: {
    paddingLeft: spacing.lg,
  },
  categoryCard: {
    width: 160,
    marginRight: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.background.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryName: {
    ...typography.h3,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  categoryPreview: {
    ...typography.body,
    lineHeight: 16,
    color: colors.text.secondary,
  },
  quickActions: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  actionCard: {
    padding: spacing.lg,
    backgroundColor: colors.background.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  natalChartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  natalIcon: {
    marginRight: spacing.md,
  },
  natalChartTextContainer: {
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  actionCardHalf: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionCardThird: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  actionSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
  oracleIcon: {
    alignSelf: 'center',
    marginBottom: spacing.xs,
  },
  oracleTitle: {
    fontSize: 14,
    color: '#F6D99F',
    fontFamily: 'PTSerif_400Regular',
    letterSpacing: 0,
    textAlign: 'center',
  },
  journalPromptsSection: {
    marginBottom: spacing.lg,
  },
  journalPromptsTitle: {
    ...typography.body,
    fontSize: 16,
    letterSpacing: 1,
    color: '#FFFFFF',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  journalPromptCard: {
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    backgroundColor: '#9B85AE40',
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  journalPromptHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  journalIconContainer: {
    marginRight: spacing.sm,
    marginTop: spacing.xs,
  },
  journalPromptText: {
    ...typography.body,
    lineHeight: 20,
    flex: 1,
  },
  startWritingButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  bottomSpacer: {
    height: spacing.xl * 2,
  },
});
