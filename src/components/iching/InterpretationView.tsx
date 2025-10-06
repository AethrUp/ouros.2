/**
 * I Ching Interpretation View Component
 * Displays hexagram information and AI interpretation
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { CastedHexagram } from '../../types/iching';
import { HexagramDisplay } from './HexagramDisplay';
import { colors, typography, spacing } from '../../styles';
import { LoadingSpinner } from '../LoadingSpinner';

interface InterpretationViewProps {
  question: string;
  primaryHexagram: CastedHexagram;
  relatingHexagram?: CastedHexagram | null;
  interpretation: string | null;
  isGenerating: boolean;
  onSave?: () => void;
  onNewReading?: () => void;
  onJournal?: () => void;
}

/**
 * Interpretation View - Shows hexagram and AI interpretation
 */
export const InterpretationView: React.FC<InterpretationViewProps> = ({
  question,
  primaryHexagram,
  relatingHexagram,
  interpretation,
  isGenerating,
  onSave,
  onNewReading,
  onJournal,
}) => {
  const { hexagram: primary, changingLines } = primaryHexagram;
  const hasChangingLines = changingLines.length > 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Question */}
      <Animated.View entering={FadeIn} style={styles.questionSection}>
        <Text style={styles.sectionLabel}>Your Question</Text>
        <Text style={styles.questionText}>{question}</Text>
      </Animated.View>

      {/* Primary Hexagram */}
      <Animated.View entering={FadeIn.delay(200)} style={styles.hexagramSection}>
        <Text style={styles.sectionLabel}>
          {hasChangingLines ? 'Present Hexagram' : 'Your Hexagram'}
        </Text>

        <View style={styles.hexagramInfo}>
          <Text style={styles.hexagramNumber}>#{primary.number}</Text>
          <Text style={styles.hexagramName}>{primary.englishName}</Text>
          <Text style={styles.hexagramChinese}>
            {primary.chineseName} {primary.pinyinName}
          </Text>
        </View>

        <HexagramDisplay lines={primaryHexagram.lines} maxLines={6} />

        {/* Trigrams */}
        <View style={styles.trigramsContainer}>
          <View style={styles.trigramInfo}>
            <Text style={styles.trigramLabel}>Upper</Text>
            <Text style={styles.trigramName}>{primary.upperTrigram.englishName}</Text>
            <Text style={styles.trigramSymbol}>{primary.upperTrigram.symbol}</Text>
          </View>
          <View style={styles.trigramInfo}>
            <Text style={styles.trigramLabel}>Lower</Text>
            <Text style={styles.trigramName}>{primary.lowerTrigram.englishName}</Text>
            <Text style={styles.trigramSymbol}>{primary.lowerTrigram.symbol}</Text>
          </View>
        </View>

        {/* Keywords */}
        <View style={styles.keywordsContainer}>
          {primary.keywords.slice(0, 6).map((keyword, index) => (
            <View key={index} style={styles.keywordPill}>
              <Text style={styles.keywordText}>{keyword}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* Relating Hexagram (if changing lines exist) */}
      {relatingHexagram && (
        <Animated.View entering={FadeIn.delay(400)} style={styles.hexagramSection}>
          <Text style={styles.sectionLabel}>Future Hexagram</Text>

          <View style={styles.hexagramInfo}>
            <Text style={styles.hexagramNumber}>#{relatingHexagram.hexagram.number}</Text>
            <Text style={styles.hexagramName}>{relatingHexagram.hexagram.englishName}</Text>
            <Text style={styles.hexagramChinese}>
              {relatingHexagram.hexagram.chineseName} {relatingHexagram.hexagram.pinyinName}
            </Text>
          </View>

          <HexagramDisplay lines={relatingHexagram.lines} maxLines={6} />

          <Text style={styles.transformationNote}>
            This hexagram represents the situation after the changing lines transform, showing the
            potential outcome or future development.
          </Text>
        </Animated.View>
      )}

      {/* Interpretation */}
      <Animated.View entering={FadeIn.delay(600)} style={styles.interpretationSection}>
        <Text style={styles.sectionLabel}>Interpretation</Text>

        {isGenerating ? (
          <View style={styles.loadingContainer}>
            <LoadingSpinner />
            <Text style={styles.loadingText}>Generating interpretation...</Text>
          </View>
        ) : interpretation ? (
          <View style={styles.interpretationContent}>
            <Text style={styles.interpretationText}>{interpretation}</Text>
          </View>
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={styles.errorText}>No interpretation available</Text>
          </View>
        )}
      </Animated.View>

      {/* Action Buttons */}
      {!isGenerating && interpretation && (
        <Animated.View entering={FadeIn.delay(800)} style={styles.actionsContainer}>
          {onSave && (
            <TouchableOpacity style={styles.actionButton} onPress={onSave} activeOpacity={0.8}>
              <Text style={styles.actionButtonText}>Save Reading</Text>
            </TouchableOpacity>
          )}

          {onJournal && (
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={onJournal}
              activeOpacity={0.8}
            >
              <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
                Add to Journal
              </Text>
            </TouchableOpacity>
          )}

          {onNewReading && (
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={onNewReading}
              activeOpacity={0.8}
            >
              <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
                New Reading
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  contentContainer: {
    paddingBottom: spacing.xl * 2,
  },
  questionSection: {
    padding: spacing.lg,
    backgroundColor: 'rgba(129, 184, 181, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.text.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
    fontSize: 11,
  },
  questionText: {
    ...typography.body,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text.primary,
  },
  hexagramSection: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  hexagramInfo: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  hexagramNumber: {
    ...typography.caption,
    color: colors.text.secondary,
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  hexagramName: {
    ...typography.h2,
    fontSize: 24,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  hexagramChinese: {
    ...typography.body,
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  trigramsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.secondary,
  },
  trigramInfo: {
    alignItems: 'center',
  },
  trigramLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    fontSize: 10,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  trigramName: {
    ...typography.body,
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  trigramSymbol: {
    fontSize: 24,
    color: colors.text.accent,
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  keywordPill: {
    backgroundColor: 'rgba(129, 184, 181, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  keywordText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.text.primary,
  },
  transformationNote: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 18,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  interpretationSection: {
    padding: spacing.lg,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
  },
  interpretationContent: {
    marginTop: spacing.sm,
  },
  interpretationText: {
    ...typography.body,
    fontSize: 15,
    lineHeight: 24,
    color: colors.text.primary,
  },
  actionsContainer: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  actionButton: {
    backgroundColor: colors.button.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  actionButtonText: {
    ...typography.button,
    color: colors.button.text,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border.primary,
    shadowOpacity: 0,
    elevation: 0,
  },
  secondaryButtonText: {
    color: colors.text.primary,
  },
});
