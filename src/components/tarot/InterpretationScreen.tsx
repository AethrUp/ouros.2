import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DrawnCard, SpreadLayout, TarotInterpretation } from '../../types/tarot';
import { TarotCard } from './TarotCard';
import { TarotSpread } from './TarotSpread';
import { HeaderBar } from '../HeaderBar';
import { colors, spacing, typography } from '../../styles';
import { isStructuredTarot, isLegacyTarot } from '../../utils/readingTypeGuards';

interface InterpretationScreenProps {
  drawnCards: DrawnCard[];
  spread: SpreadLayout;
  intention: string;
  interpretation: string | TarotInterpretation;
  onSave: () => void;
  onJournal: (prompt?: string, promptIndex?: number) => void;
}

export const InterpretationScreen: React.FC<InterpretationScreenProps> = ({
  drawnCards,
  spread,
  intention,
  interpretation,
  onSave,
  onJournal,
}) => {
  const [selectedCardIndex, setSelectedCardIndex] = useState<number>(0);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentScrollX, setCurrentScrollX] = useState(0);
  const sectionNavScrollRef = useRef<ScrollView>(null);

  const selectedCard = drawnCards[selectedCardIndex];

  // Parse interpretation if it's a JSON string
  let parsedInterpretation: string | TarotInterpretation = interpretation;
  if (typeof interpretation === 'string') {
    try {
      parsedInterpretation = JSON.parse(interpretation);
    } catch (e) {
      // If parsing fails, treat as legacy string format
      parsedInterpretation = interpretation;
    }
  }

  // Detect format and extract data
  const isV2 = isStructuredTarot(parsedInterpretation);
  const fullContent = isV2 ? parsedInterpretation.fullContent : null;

  // Build dynamic sections based on format
  const buildSections = () => {
    const sections: Array<{ id: string; label: string }> = [];

    if (isV2 && fullContent) {
      // V2 Format - structured sections
      sections.push({ id: 'overview', label: 'OVERVIEW' });

      // Card sections - one for each card drawn
      fullContent.cardInsights.forEach((_, index) => {
        sections.push({
          id: `card-${index}`,
          label: `CARD ${index + 1}`
        });
      });

      sections.push({ id: 'synthesis', label: 'SYNTHESIS' });
      sections.push({ id: 'guidance', label: 'GUIDANCE' });
      sections.push({ id: 'timing', label: 'TIMING' });
      sections.push({ id: 'keyInsight', label: 'KEY INSIGHT' });
      sections.push({ id: 'reflections', label: 'REFLECTIONS' });
    } else {
      // Legacy format - single section
      sections.push({ id: 'legacy', label: 'READING' });
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

  // ===== SECTION RENDER FUNCTIONS =====

  const renderOverview = () => {
    if (!isV2 || !fullContent) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <Text style={styles.bodyText}>{fullContent.overview}</Text>
      </View>
    );
  };

  const renderCard = (index: number) => {
    if (!isV2 || !fullContent) return null;

    const cardInsight = fullContent.cardInsights[index];
    if (!cardInsight) return null;

    const drawnCard = drawnCards[index];

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{cardInsight.position}</Text>

        {/* Card visual info */}
        {drawnCard && (
          <View style={styles.cardDetailSection}>
            <Text style={styles.cardDetailName}>{drawnCard.card.name}</Text>
            <Text style={styles.cardDetailOrientation}>
              {drawnCard.orientation === 'upright' ? 'Upright' : 'Reversed'}
            </Text>
            <Text style={styles.cardDetailKeywords}>
              {drawnCard.card.keywords.slice(0, 3).join(' • ')}
            </Text>
          </View>
        )}

        <Text style={styles.bodyText}>{cardInsight.interpretation}</Text>
      </View>
    );
  };

  const renderSynthesis = () => {
    if (!isV2 || !fullContent) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Synthesis</Text>
        <Text style={styles.subsectionTitle}>The Story</Text>
        <Text style={styles.bodyText}>{fullContent.synthesis.narrative}</Text>

        <Text style={styles.subsectionTitle}>Main Theme</Text>
        <Text style={styles.bodyText}>{fullContent.synthesis.mainTheme}</Text>
      </View>
    );
  };

  const renderGuidance = () => {
    if (!isV2 || !fullContent) return null;

    const { guidance } = fullContent;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Guidance</Text>

        <Text style={styles.bodyText}>{guidance.understanding}</Text>

        <Text style={styles.subsectionTitle}>Action Steps</Text>
        {guidance.actionSteps.map((step, index) => (
          <View key={index} style={styles.listItem}>
            <Text style={styles.listBullet}>✦</Text>
            <Text style={styles.listText}>{step}</Text>
          </View>
        ))}

        <Text style={styles.subsectionTitle}>Things to Embrace</Text>
        {guidance.thingsToEmbrace.map((item, index) => (
          <View key={index} style={styles.listItem}>
            <Text style={styles.listBullet}>✦</Text>
            <Text style={styles.listText}>{item}</Text>
          </View>
        ))}

        <Text style={styles.subsectionTitle}>Things to Release</Text>
        {guidance.thingsToRelease.map((item, index) => (
          <View key={index} style={styles.listItem}>
            <Text style={styles.listBullet}>✦</Text>
            <Text style={styles.listText}>{item}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderTiming = () => {
    if (!isV2 || !fullContent) return null;

    const { timing } = fullContent;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Timing</Text>

        <Text style={styles.subsectionTitle}>Right Now</Text>
        <Text style={styles.bodyText}>{timing.immediateAction}</Text>

        <Text style={styles.subsectionTitle}>Near Future</Text>
        <Text style={styles.bodyText}>{timing.nearFuture}</Text>

        <Text style={styles.subsectionTitle}>Long Term</Text>
        <Text style={styles.bodyText}>{timing.longTerm}</Text>
      </View>
    );
  };

  const renderKeyInsight = () => {
    if (!isV2 || !fullContent) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Insight</Text>
        <View style={styles.keyInsightCard}>
          <Text style={styles.keyInsightText}>{fullContent.keyInsight}</Text>
        </View>
      </View>
    );
  };

  const renderReflections = () => {
    if (!isV2 || !fullContent) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reflection Prompts</Text>
        <Text style={styles.reflectionHint}>
          Tap a prompt to journal about it
        </Text>
        {fullContent.reflectionPrompts.map((prompt, index) => (
          <TouchableOpacity
            key={index}
            style={styles.reflectionItemTouchable}
            onPress={() => onJournal(prompt, index)}
            activeOpacity={0.7}
          >
            <View style={styles.reflectionItem}>
              <Text style={styles.reflectionNumber}>{index + 1}.</Text>
              <Text style={styles.reflectionText}>{prompt}</Text>
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
    );
  };

  const renderLegacy = () => {
    if (isV2) return null;
    const legacyText = typeof parsedInterpretation === 'string' ? parsedInterpretation : '';

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Reading</Text>
        <Text style={styles.bodyText}>{legacyText}</Text>
      </View>
    );
  };

  // Render current section based on section ID
  const renderCurrentSection = () => {
    const currentSection = sections[currentSectionIndex];
    if (!currentSection) return null;

    const sectionId = currentSection.id;

    if (sectionId === 'overview') return renderOverview();
    if (sectionId.startsWith('card-')) {
      const cardIndex = parseInt(sectionId.replace('card-', ''));
      return renderCard(cardIndex);
    }
    if (sectionId === 'synthesis') return renderSynthesis();
    if (sectionId === 'guidance') return renderGuidance();
    if (sectionId === 'timing') return renderTiming();
    if (sectionId === 'keyInsight') return renderKeyInsight();
    if (sectionId === 'reflections') return renderReflections();
    if (sectionId === 'legacy') return renderLegacy();

    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tarot Reading</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton} onPress={onSave} activeOpacity={0.7}>
            <Ionicons name="bookmark-outline" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={onJournal} activeOpacity={0.7}>
            <Ionicons name="journal-outline" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Spread Visualization - Reduced Height */}
      <View style={styles.spreadSection}>
        <TarotSpread
          drawnCards={drawnCards}
          spread={spread}
          selectedCardIndex={selectedCardIndex}
          onCardPress={setSelectedCardIndex}
        />
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
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '400',
    color: colors.text.primary,
    fontFamily: 'PTSerif_400Regular',
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  iconButton: {
    padding: spacing.xs,
  },
  // Spread Section - Reduced card size
  // Note: scale transform doesn't affect layout, so we use negative margins
  // to compensate for the extra space the scaled content creates
  spreadSection: {
    transform: [{ scale: 0.65 }],
    marginTop: -20,
    marginBottom: -20,
  },
  // Section Navigation
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
    marginBottom: spacing.sm,
  },
  bodyText: {
    ...typography.body,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  // Card Detail (in card sections)
  cardDetailSection: {
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
  },
  cardDetailName: {
    fontSize: 16,
    fontWeight: '400',
    color: '#F6D99F',
    fontFamily: 'PTSerif_400Regular',
    marginBottom: spacing.xs,
  },
  cardDetailOrientation: {
    fontSize: 12,
    color: colors.text.secondary,
    fontFamily: 'Inter',
    marginBottom: spacing.xs,
  },
  cardDetailKeywords: {
    ...typography.caption,
    color: colors.text.secondary,
    fontStyle: 'italic',
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
  },
  listText: {
    ...typography.body,
    lineHeight: 20,
    flex: 1,
  },
  // Key Insight Card
  keyInsightCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 8,
    padding: spacing.lg,
    alignItems: 'center',
  },
  keyInsightText: {
    ...typography.h3,
    textTransform: 'none',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 24,
  },
  // Reflections
  reflectionHint: {
    ...typography.caption,
    color: colors.text.secondary,
    fontStyle: 'italic',
    fontSize: 11,
    marginBottom: spacing.md,
  },
  reflectionItemTouchable: {
    marginBottom: spacing.xs,
    borderRadius: 6,
    padding: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  reflectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  promptIcon: {
    marginLeft: spacing.sm,
  },
});
