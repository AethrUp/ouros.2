import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../styles/theme';

const { width: screenWidth } = Dimensions.get('window');

// Category icon mappings
const categoryIcons = {
  love: 'heart',
  career: 'briefcase',
  health: 'fitness',
  family: 'home',
  friendship: 'people',
  travel: 'airplane',
  creativity: 'color-palette',
  spirituality: 'flower',
  education: 'library'
};

const DailyReadingScreen = () => {
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);
  const [activeTab, setActiveTab] = useState(0);
  const [sectionPositions, setSectionPositions] = useState({});
  const [isNavigating, setIsNavigating] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  
  // Get data from Redux store
  const userProfile = useSelector(state => state.user?.profile);
  const dailyHoroscope = useSelector(state => state.reading?.dailyHoroscope);
  const cosmicWeather = useSelector(state => state.reading?.cosmicWeather);
  
  // Extract content from Redux state
  const preview = dailyHoroscope?.preview || {};
  const fullContent = dailyHoroscope?.fullContent || {};
  const content = dailyHoroscope?.content || {}; // Fallback for compatibility
  
  // Set first selected category as active on mount
  useEffect(() => {
    const selectedCategories = userProfile?.selectedCategories || [];
    if (selectedCategories.length > 0 && !activeCategory) {
      setActiveCategory(selectedCategories[0]);
    }
  }, [userProfile, activeCategory]);
  
  // Section configuration
  const sections = [
    { id: 'fullReading', label: 'Full Reading', shortLabel: 'READING' },
    { id: 'transits', label: 'Planetary Transits', shortLabel: 'TRANSITS' },
    { id: 'guidance', label: 'Daily Guidance', shortLabel: 'GUIDANCE' },
    { id: 'spiritual', label: 'Spiritual Practice', shortLabel: 'SPIRITUAL' }
  ];
  
  // Measure section positions for scroll navigation
  const measureSection = (sectionId, event) => {
    const { y } = event.nativeEvent.layout;
    setSectionPositions(prev => ({
      ...prev,
      [sectionId]: y
    }));
  };
  
  // Scroll to section when dot is pressed
  const handleSectionPress = (index, sectionId) => {
    setActiveTab(index);
    setIsNavigating(true);
    
    // Clear navigation flag after animation completes
    setTimeout(() => {
      setIsNavigating(false);
    }, 600);
    
    const position = sectionPositions[sectionId];
    if (scrollViewRef.current && position !== undefined) {
      scrollViewRef.current.scrollTo({ y: position - 100, animated: true });
    }
  };
  
  // Update active tab based on scroll position
  const handleScroll = (event) => {
    // Don't update active tab while navigating manually
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
    return today.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    }).toUpperCase();
  };
  
  // Render full reading section
  const renderFullReading = () => {
    const fullReading = fullContent.fullReading;
    const timeGuidance = fullContent.timeGuidance;
    
    if (!fullReading) {
      // Fallback to basic content if no expanded reading
      return (
        <View onLayout={(e) => measureSection('fullReading', e)} style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Reading</Text>
          <Text style={styles.bodyText}>
            {content.summary || preview.summary || 'Loading your personalized reading...'}
          </Text>
          {content.advice && (
            <Text style={styles.bodyText}>{content.advice}</Text>
          )}
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
        
        {/* Body Paragraphs with Time Headings and Guidance */}
        <View style={styles.timeSectionsContainer}>
          {fullReading.bodyParagraphs && fullReading.bodyParagraphs.map((paragraph, index) => {
            const timeHeadings = ['Morning', 'Afternoon', 'Evening'];
            const timeKeys = ['morning', 'afternoon', 'evening'];
            const guidance = timeGuidance?.[timeKeys[index]];
            
            return (
              <View key={index} style={styles.timeSection}>
                <Text style={[styles.sectionTitle, { marginTop: 0 }]}>{timeHeadings[index]}</Text>
                {guidance?.energy && (
                  <Text style={[styles.subsectionTitle, { color: colors.textPrimary + '80', marginTop: 0, marginBottom: spacing.sm }]}>Energy: {guidance.energy}</Text>
                )}
                <Text style={styles.bodyText}>{paragraph}</Text>
                
                {/* Two-column guidance layout */}
                {guidance && (guidance.bestFor?.length > 0 || guidance.avoid?.length > 0) && (
                  <View style={styles.guidanceColumns}>
                    {guidance.bestFor?.length > 0 && (
                      <View style={styles.guidanceColumn}>
                        <Text style={[styles.subsectionTitle, { color: colors.textPrimary + '80', marginTop: 0, marginBottom: spacing.sm }]}>Best For</Text>
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
                        <Text style={[styles.subsectionTitle, { color: colors.textPrimary + '80', marginTop: 0, marginBottom: spacing.sm }]}>Avoid</Text>
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
            {transitAnalysis.primary.timing && (
              <Text style={[styles.transitTiming, { fontStyle: 'italic' }]}>{transitAnalysis.primary.timing}</Text>
            )}
            <Text style={styles.bodyText}>{transitAnalysis.primary.interpretation}</Text>
            {transitAnalysis.primary.advice && (
              <Text style={styles.bodyText}>{transitAnalysis.primary.advice}</Text>
            )}
          </View>
        )}
        
        {/* Secondary Transits */}
        {transitAnalysis?.secondary && transitAnalysis.secondary.map((transit, index) => (
          <View key={index} style={styles.transitItem}>
            <Text style={[styles.sectionTitle, { marginTop: 0 }]}>{transit.aspect}</Text>
            {transit.timing && (
              <Text style={[styles.transitTiming, { fontStyle: 'italic' }]}>{transit.timing}</Text>
            )}
            <Text style={styles.bodyText}>{transit.interpretation}</Text>
            {transit.advice && (
              <Text style={styles.bodyText}>{transit.advice}</Text>
            )}
          </View>
        ))}
        
        {/* Transit Insights (fallback or additional) */}
        {transitInsights.length > 0 && (
          <View style={styles.insightsContainer}>
            {transitInsights.map((insight, index) => {
              const categories = ['Energy', 'Influence', 'Emotion', 'Opportunities', 'Challenges'];
              const category = categories[index] || '';
              
              return (
                <View key={index} style={styles.insightItem}>
                  {category && (
                    <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: spacing.xs }]}>{category}</Text>
                  )}
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
  
  // Render time guidance section
  const renderGuidance = () => {
    const explore = fullContent.explore || content.explore || [];
    const limit = fullContent.limit || content.limit || [];
    const dailyFocus = fullContent.dailyFocus || content.dailyFocus;
    
    return (
      <View onLayout={(e) => measureSection('guidance', e)} style={styles.section}>
        <Text style={[styles.titleText, { marginTop: spacing.lg, marginBottom: spacing.sm, color: colors.textPrimary, paddingHorizontal: 0 }]}>Daily Guidance</Text>
        
        {/* Daily Focus */}
        {dailyFocus && (
          <View>
            <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: spacing.sm }]}>Today's Focus</Text>
            <Text style={styles.bodyText}>{dailyFocus}</Text>
          </View>
        )}
        
        {/* Explore and Limit */}
        <View style={styles.exploreContainer}>
          {explore.length > 0 && (
            <View style={styles.exploreSection}>
              <Text style={[styles.sectionTitle, { marginTop: 0 }]}>Explore Today</Text>
              {explore.map((item, index) => (
                <Text key={index} style={[styles.bodyText, { marginBottom: spacing.xs }]}>✦ {item}</Text>
              ))}
            </View>
          )}
          
          {limit.length > 0 && (
            <View style={[styles.exploreSection, { marginBottom: spacing.lg }]}>
              <Text style={[styles.sectionTitle, { marginTop: spacing.md }]}>Be Mindful Of</Text>
              {limit.map((item, index) => (
                <Text key={index} style={[styles.bodyText, { marginBottom: spacing.xs }]}>✦ {item}</Text>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };
  
  // Render spiritual guidance section
  const renderSpiritual = () => {
    const spiritualGuidance = fullContent.spiritualGuidance;
    const weather = preview.weather || content.weather || cosmicWeather;
    
    return (
      <View onLayout={(e) => measureSection('spiritual', e)} style={styles.section}>
        <Text style={[styles.sectionTitle, { marginTop: 0 }]}>Spiritual Practice</Text>
        
        {/* Meditation */}
        {spiritualGuidance?.meditation && (
          <View style={styles.spiritualCard}>
            <Text style={styles.bodyText}>{spiritualGuidance.meditation}</Text>
          </View>
        )}
        
        {/* Affirmation */}
        {spiritualGuidance?.affirmation && (
          <View style={[styles.affirmationCard, { marginBottom: spacing.lg }]}>
            <Text style={[styles.spiritualLabel, { color: colors.textPrimary }]}>DAILY AFFIRMATION</Text>
            <Text style={styles.affirmationText}>"{spiritualGuidance.affirmation}"</Text>
          </View>
        )}
        
        {/* Journal Prompts */}
        {spiritualGuidance?.journalPrompts && spiritualGuidance.journalPrompts.length > 0 && (
          <View style={styles.spiritualCard}>
            <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: spacing.sm }]}>Journal Prompts</Text>
            {spiritualGuidance.journalPrompts.map((prompt, index) => (
              <View key={index} style={styles.promptItem}>
                <Text style={styles.bodyText}>✦</Text>
                <Text style={[styles.promptText, { marginBottom: spacing.xs }]}>{prompt}</Text>
              </View>
            ))}
          </View>
        )}
        
        {/* Ritual Suggestion */}
        {spiritualGuidance?.ritualSuggestion && (
          <View style={styles.spiritualCard}>
            <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: spacing.sm }]}>Ritual Suggestion</Text>
            <Text style={styles.bodyText}>{spiritualGuidance.ritualSuggestion}</Text>
          </View>
        )}
        
        {/* Cosmic Weather */}
        {weather && (
          <View style={styles.cosmicWeatherSection}>
            <Text style={[styles.titleText, { paddingHorizontal: 0, marginBottom: spacing.sm, color: colors.textPrimary }]}>Cosmic Weather</Text>
            
            {weather.moon && (
              <View style={styles.symbolRow}>
                <Text style={styles.symbolIcon}>{weather.moon?.symbol || '☽'}</Text>
                <View style={styles.symbolContent}>
                  <Text style={styles.symbolTitle}>{weather.moon?.title || 'Lunar influence for today'}</Text>
                  <Text style={styles.symbolDescription}>
                    {weather.moon?.description || weather.moon || 'The moon brings intuitive wisdom and emotional clarity.'}
                  </Text>
                </View>
              </View>
            )}
            
            {weather.venus && (
              <View style={styles.symbolRow}>
                <Text style={styles.symbolIcon}>{weather.venus?.symbol || '♀'}</Text>
                <View style={styles.symbolContent}>
                  <Text style={styles.symbolTitle}>{weather.venus?.title || 'Venus brings harmony'}</Text>
                  <Text style={styles.symbolDescription}>
                    {weather.venus?.description || weather.venus || 'Venus enhances love, creativity, and beauty in your day.'}
                  </Text>
                </View>
              </View>
            )}
            
            {weather.mercury && (
              <View style={styles.symbolRow}>
                <Text style={styles.symbolIcon}>{weather.mercury?.symbol || '☿'}</Text>
                <View style={styles.symbolContent}>
                  <Text style={styles.symbolTitle}>{weather.mercury?.title || 'Mercury enhances communication'}</Text>
                  <Text style={styles.symbolDescription}>
                    {weather.mercury?.description || weather.mercury || 'Mercury supports clear thinking and meaningful connections.'}
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
    const selectedCategories = userProfile?.selectedCategories || [];
    const allCategories = Object.keys(categoryIcons);
    
    return (
      <View style={styles.categoryNav}>
        {allCategories.map(category => {
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
                color={isSelected ? colors.textPrimary : colors.textSecondary}
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
    const cleanTitle = advice.title ? 
      advice.title.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim() :
      `${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)}`;
    
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
        <View style={styles.headerSpacer} />
      </View>
      
      {/* Progress Navigation */}
      <View style={styles.progressNavigation}>
        {sections.map((section, index) => (
          <TouchableOpacity
            key={section.id}
            style={styles.progressItem}
            onPress={() => handleSectionPress(index, section.id)}
          >
            <Text style={[styles.progressLabel, activeTab === index && styles.activeProgressLabel]}>
              {section.shortLabel}
            </Text>
            {activeTab === index && <View style={styles.activeUnderline} />}
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Content */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {renderFullReading()}
        {renderTransits()}
        {renderGuidance()}
        {renderSpiritual()}
        
        {/* Divider before category navigation */}
        <View style={styles.dividerLine} />

        {/* Category Navigation */}
        {renderCategoryNav()}
        
        {/* Active Category Advice */}
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
    fontSize: 24,
    color: colors.textPrimary,
  },
  dateText: {
    ...typography.caption,
    fontWeight: '500',
    letterSpacing: 1,
  },
  headerSpacer: {
    width: 40,
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
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
  activeProgressLabel: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  activeUnderline: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    width: '80%',
    backgroundColor: colors.textPrimary,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  section: {
  },
  sectionTitle: {
    ...typography.h2,
  },
  subsectionTitle: {
    ...typography.h3,
  },
  bodyText: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  introductionSection: {
  },
  timeSectionsContainer: {
  },
  timeSection: {
  },
  timeHeading: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  timeEnergy: {
    ...typography.caption,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
    color: colors.accent, // Keep accent color for emphasis
  },
  guidanceColumns: {
    flexDirection: 'row',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.lg,
  },
  guidanceColumn: {
    flex: 1,
  },
  guidanceColumnTitle: {
    ...typography.caption,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  guidanceItemContainer: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  guidanceBullet: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  guidanceItemText: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
    paddingLeft: spacing.xs,
  },
  guidanceItem: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  conclusionSection: {
  },
  transitItem: {
  },
  transitAspect: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  transitTiming: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  adviceBox: {
    marginTop: spacing.md,
  },
  adviceLabel: {
    ...typography.caption,
    letterSpacing: 1,
    marginBottom: spacing.xs,
    color: colors.accent, // Keep accent color for labels
  },
  adviceText: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  insightsContainer: {
  },
  insightItem: {
    marginBottom: spacing.sm,
  },
  insightBullet: {
    color: colors.accent,
    marginRight: spacing.sm,
    marginTop: 2,
  },
  insightText: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  focusCard: {
  },
  focusLabel: {
    ...typography.caption,
    letterSpacing: 1,
    marginBottom: spacing.sm,
    color: colors.accent, // Keep accent color for focus labels
  },
  focusText: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  timeGuidanceContainer: {
  },
  timeCard: {
    borderLeftWidth: 2,
    borderLeftColor: colors.accent + '50',
    paddingLeft: spacing.md,
  },
  timeCardTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  energyLabel: {
    ...typography.caption,
    color: colors.accent,
    fontSize: 11,
    marginBottom: spacing.sm,
  },
  listContainer: {
    marginTop: spacing.sm,
  },
  listLabel: {
    ...typography.caption,
    marginBottom: spacing.xs,
    color: colors.textSecondary, // Keep secondary color for labels
  },
  listItem: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    marginLeft: spacing.sm,
  },
  exploreContainer: {
  },
  exploreSection: {
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  tag: {
    backgroundColor: colors.accent + '20',
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  limitTag: {
    backgroundColor: colors.textSecondary + '20',
  },
  tagText: {
    ...typography.caption,
  },
  spiritualCard: {
  },
  spiritualLabel: {
    ...typography.caption,
    letterSpacing: 1,
    marginBottom: spacing.sm,
    color: colors.accent, // Keep accent color for spiritual labels
  },
  affirmationCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 8,
    padding: spacing.lg,
    alignItems: 'center',
  },
  affirmationText: {
    ...typography.h3,
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  promptItem: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  promptNumber: {
    ...typography.body,
    marginRight: spacing.sm,
    color: colors.accent, // Keep accent color for numbering
  },
  promptText: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
    paddingLeft: spacing.sm,
  },
  cosmicWeatherSection: {
    borderTopWidth: 1,
    borderTopColor: colors.textPrimary,
  },
  symbolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  symbolIcon: {
    fontSize: 24,
    color: colors.textPrimary,
    marginRight: spacing.lg,
    width: 32,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  symbolContent: {
    flex: 1,
  },
  symbolTitle: {
    ...typography.h3,
    fontSize: 15,
    marginBottom: spacing.xs,
  },
  symbolDescription: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.textPrimary,
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
    backgroundColor: colors.textPrimary,
  },
  categoryIconDisabled: {
    opacity: 0.3,
  },
  categorySection: {
    marginBottom: spacing.xl,
  },
  categoryTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  categoryContent: {
    ...typography.body,
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
});

export default DailyReadingScreen;