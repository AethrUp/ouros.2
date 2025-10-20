/**
 * Structured Interpretation View V2 Component
 * Displays I Ching interpretation with section navigation
 * Follows the pattern established by Tarot and Daily Horoscope screens
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { IChingInterpretationV2 } from '../../types/iching';
import { colors, typography, spacing } from '../../styles';

interface StructuredInterpretationViewV2Props {
  interpretationData: IChingInterpretationV2;
  onJournal?: (prompt?: string, promptIndex?: number) => void;
}

export const StructuredInterpretationViewV2: React.FC<
  StructuredInterpretationViewV2Props
> = ({ interpretationData, onJournal }) => {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentScrollX, setCurrentScrollX] = useState(0);
  const sectionNavScrollRef = useRef<ScrollView>(null);

  const { preview, fullContent } = interpretationData;

  // Build sections array
  const sections = [
    { id: 'overview', label: 'OVERVIEW' },
    { id: 'present', label: 'PRESENT' },
    { id: 'energies', label: 'ENERGIES' },
    { id: 'changingLines', label: 'CHANGING LINES' },
    { id: 'transformation', label: 'TRANSFORMATION' },
    { id: 'guidance', label: 'GUIDANCE' },
    { id: 'timing', label: 'TIMING' },
    { id: 'keyInsight', label: 'KEY INSIGHT' },
    { id: 'reflections', label: 'REFLECTIONS' },
  ];

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

  const renderOverview = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Overview</Text>
      <Text style={styles.bodyText}>{fullContent.overview}</Text>
    </View>
  );

  const renderPresent = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Present Situation</Text>
      <Text style={styles.bodyText}>{fullContent.presentSituation}</Text>
    </View>
  );

  const renderEnergies = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Energies at Play</Text>
      <Text style={styles.subsectionTitle}>The Interaction</Text>
      <Text style={styles.bodyText}>{fullContent.trigramDynamics.interaction}</Text>

      <Text style={styles.subsectionTitle}>Upper Trigram</Text>
      <Text style={styles.bodyText}>{fullContent.trigramDynamics.upperMeaning}</Text>

      <Text style={styles.subsectionTitle}>Lower Trigram</Text>
      <Text style={styles.bodyText}>{fullContent.trigramDynamics.lowerMeaning}</Text>
    </View>
  );

  const renderChangingLines = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Lines of Transformation</Text>
      <Text style={styles.bodyText}>{fullContent.changingLines.present}</Text>

      <Text style={styles.subsectionTitle}>Significance</Text>
      <Text style={styles.bodyText}>{fullContent.changingLines.significance}</Text>
    </View>
  );

  const renderTransformation = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>The Journey</Text>
      <Text style={styles.bodyText}>{fullContent.transformation.journey}</Text>

      <Text style={styles.subsectionTitle}>Future State</Text>
      <Text style={styles.bodyText}>{fullContent.transformation.futureState}</Text>
    </View>
  );

  const renderGuidance = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Guidance</Text>
      <Text style={styles.bodyText}>{fullContent.guidance.wisdom}</Text>

      <Text style={styles.subsectionTitle}>Right Action</Text>
      {fullContent.guidance.rightAction.map((item, index) => (
        <View key={index} style={styles.listItem}>
          <Text style={styles.listBullet}>✦</Text>
          <Text style={styles.listText}>{item}</Text>
        </View>
      ))}

      <Text style={styles.subsectionTitle}>To Embody</Text>
      {fullContent.guidance.toEmbody.map((item, index) => (
        <View key={index} style={styles.listItem}>
          <Text style={styles.listBullet}>✦</Text>
          <Text style={styles.listText}>{item}</Text>
        </View>
      ))}

      <Text style={styles.subsectionTitle}>To Avoid</Text>
      {fullContent.guidance.toAvoid.map((item, index) => (
        <View key={index} style={styles.listItem}>
          <Text style={styles.listBullet}>✦</Text>
          <Text style={styles.listText}>{item}</Text>
        </View>
      ))}
    </View>
  );

  const renderTiming = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Timing & Rhythm</Text>
      <Text style={styles.bodyText}>{fullContent.timing.nature}</Text>

      <Text style={styles.subsectionTitle}>When to Act</Text>
      <Text style={styles.bodyText}>{fullContent.timing.whenToAct}</Text>

      <Text style={styles.subsectionTitle}>When to Wait</Text>
      <Text style={styles.bodyText}>{fullContent.timing.whenToWait}</Text>
    </View>
  );

  const renderKeyInsight = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Key Insight</Text>
      <View style={styles.keyInsightCard}>
        <Text style={styles.keyInsightText}>{fullContent.keyInsight}</Text>
      </View>
    </View>
  );

  const renderReflections = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Reflection Prompts</Text>
      <Text style={styles.reflectionHint}>
        {onJournal ? 'Tap a prompt to journal about it' : 'Take time to journal or meditate on these questions'}
      </Text>
      {fullContent.reflectionPrompts.map((prompt, index) => (
        onJournal ? (
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
        ) : (
          <View key={index} style={styles.reflectionItem}>
            <Text style={styles.reflectionNumber}>{index + 1}.</Text>
            <Text style={styles.reflectionText}>{prompt}</Text>
          </View>
        )
      ))}

      {fullContent.conclusion && (
        <>
          <Text style={[styles.subsectionTitle, { marginTop: spacing.lg }]}>Closing</Text>
          <Text style={styles.bodyText}>{fullContent.conclusion}</Text>
        </>
      )}
    </View>
  );

  // Render current section based on section ID
  const renderCurrentSection = () => {
    const currentSection = sections[currentSectionIndex];
    if (!currentSection) return null;

    const sectionId = currentSection.id;

    if (sectionId === 'overview') return renderOverview();
    if (sectionId === 'present') return renderPresent();
    if (sectionId === 'energies') return renderEnergies();
    if (sectionId === 'changingLines') return renderChangingLines();
    if (sectionId === 'transformation') return renderTransformation();
    if (sectionId === 'guidance') return renderGuidance();
    if (sectionId === 'timing') return renderTiming();
    if (sectionId === 'keyInsight') return renderKeyInsight();
    if (sectionId === 'reflections') return renderReflections();

    return null;
  };

  return (
    <Animated.View entering={FadeIn.delay(300)} style={styles.container}>
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
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Section Navigation
  sectionNavContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    ...typography.body,
    fontSize: 16,
    lineHeight: 26,
    color: '#BA8FFF',
    fontWeight: '500',
    textAlign: 'center',
    fontStyle: 'italic',
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
  // Bottom Navigation
  navButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
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
