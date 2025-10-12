/**
 * I Ching Interpretation View Component
 * Displays hexagram information and AI interpretation
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CastedHexagram, IChingInterpretation } from '../../types/iching';
import { HexagramDisplay } from './HexagramDisplay';
import { StructuredInterpretationView } from './StructuredInterpretationView';
import { isStructuredInterpretation } from '../../utils/ichingPromptTemplate';
import { colors, typography, spacing } from '../../styles';
import { LoadingSpinner } from '../LoadingSpinner';

interface InterpretationViewProps {
  question: string;
  primaryHexagram: CastedHexagram;
  relatingHexagram?: CastedHexagram | null;
  interpretation: string | IChingInterpretation | null;
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
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.headerTitle}>I Ching Reading</Text>
        <View style={styles.headerActions}>
          {onSave && (
            <TouchableOpacity style={styles.iconButton} onPress={onSave} activeOpacity={0.7}>
              <Ionicons name="bookmark-outline" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          )}
          {onJournal && (
            <TouchableOpacity style={styles.iconButton} onPress={onJournal} activeOpacity={0.7}>
              <Ionicons name="journal-outline" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Hexagrams Section */}
        <Animated.View entering={FadeIn.delay(200)} style={styles.hexagramsMainSection}>
        <View style={styles.hexagramsRow}>
          {/* Primary Hexagram */}
          <View style={styles.hexagramColumn}>
            <Text style={styles.sectionLabel}>
              {hasChangingLines ? 'Present' : 'Your Hexagram'}
            </Text>

            <View style={styles.hexagramInfo}>
              <Text style={styles.hexagramNumber}>#{primary.number}</Text>
              <Text style={styles.hexagramChinese}>
                {primary.chineseName} {primary.pinyinName}
              </Text>
            </View>

            <HexagramDisplay lines={primaryHexagram.lines} maxLines={6} />

            <Text style={styles.hexagramName}>{primary.englishName}</Text>
          </View>

          {/* Relating Hexagram (if changing lines exist) */}
          {relatingHexagram && (
            <View style={styles.hexagramColumn}>
              <Text style={styles.sectionLabel}>Future</Text>

              <View style={styles.hexagramInfo}>
                <Text style={styles.hexagramNumber}>#{relatingHexagram.hexagram.number}</Text>
                <Text style={styles.hexagramChinese}>
                  {relatingHexagram.hexagram.chineseName} {relatingHexagram.hexagram.pinyinName}
                </Text>
              </View>

              <HexagramDisplay lines={relatingHexagram.lines} maxLines={6} />

              <Text style={styles.hexagramName}>{relatingHexagram.hexagram.englishName}</Text>
            </View>
          )}
        </View>
      </Animated.View>

      {/* Interpretation */}
      <Animated.View entering={FadeIn.delay(600)} style={styles.interpretationSection}>
        {isGenerating ? (
          <View style={styles.loadingContainer}>
            <LoadingSpinner />
            <Text style={styles.loadingText}>Generating interpretation...</Text>
          </View>
        ) : interpretation ? (
          isStructuredInterpretation(interpretation) ? (
            // New structured view
            <StructuredInterpretationView interpretationData={interpretation} />
          ) : (
            // Legacy plain text view
            <View style={styles.interpretationContent}>
              <Text style={styles.interpretationText}>{interpretation}</Text>
            </View>
          )
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={styles.errorText}>No interpretation available</Text>
          </View>
        )}
      </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background.primary,
  },
  headerTitle: {
    ...typography.h1,
    fontSize: 24,
    color: colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  iconButton: {
    padding: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: spacing.xl * 2,
  },
  hexagramsMainSection: {
    padding: spacing.lg,
  },
  hexagramsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: spacing.md,
  },
  hexagramColumn: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
    minWidth: 0, // Allow shrinking below content size
  },
  sectionLabel: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
    fontSize: 11,
  },
  hexagramInfo: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  hexagramNumber: {
    ...typography.caption,
    color: colors.text.secondary,
    fontSize: 10,
    marginBottom: 2,
  },
  hexagramName: {
    ...typography.h2,
    fontSize: 18,
    textAlign: 'center',
    marginTop: spacing.sm,
    flexWrap: 'wrap',
  },
  hexagramChinese: {
    ...typography.body,
    fontSize: 10,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  trigramsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.secondary,
  },
  trigramInfo: {
    alignItems: 'center',
  },
  trigramLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    fontSize: 9,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  trigramName: {
    ...typography.body,
    fontSize: 11,
    marginBottom: 2,
  },
  trigramSymbol: {
    fontSize: 18,
    color: colors.text.accent,
  },
  transformationNote: {
    ...typography.caption,
    fontSize: 10,
    lineHeight: 14,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    fontStyle: 'italic',
    textAlign: 'center',
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
});
