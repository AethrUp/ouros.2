import React from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import Tooltip from 'react-native-walkthrough-tooltip';
import { colors, typography, spacing } from '../styles';

interface TourTooltipProps {
  visible: boolean;
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  progress?: string;
  onNext: () => void;
  onSkip: () => void;
  isLastStep?: boolean;
  children: React.ReactElement;
}

export const TourTooltip: React.FC<TourTooltipProps> = ({
  visible,
  title,
  content,
  placement = 'bottom',
  progress,
  onNext,
  onSkip,
  isLastStep = false,
  children,
}) => {
  // For center placement, use a modal overlay instead of tooltip
  if (placement === 'center') {
    return (
      <>
        {children}
        {visible && (
          <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onSkip}
            statusBarTranslucent
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={onSkip}
            >
              <TouchableOpacity
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
              >
                <View style={styles.modalContent}>
                  <View style={styles.header}>
                    <Text style={styles.title}>{title}</Text>
                    {progress && <Text style={styles.progress}>{progress}</Text>}
                  </View>
                  <Text style={styles.content}>{content}</Text>
                  <View style={styles.buttons}>
                    <TouchableOpacity onPress={onSkip} style={styles.skipButton} activeOpacity={0.8}>
                      <Text style={styles.skipText}>Skip Tour</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onNext} style={styles.nextButton} activeOpacity={0.8}>
                      <Text style={styles.nextText}>{isLastStep ? 'Got it!' : 'Next'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>
        )}
      </>
    );
  }

  // For other placements, use the tooltip
  return (
    <Tooltip
      isVisible={visible}
      content={
        <View style={styles.tooltipContent}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            {progress && <Text style={styles.progress}>{progress}</Text>}
          </View>
          <Text style={styles.content}>{content}</Text>
          <View style={styles.buttons}>
            <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip Tour</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onNext} style={styles.nextButton}>
              <Text style={styles.nextText}>{isLastStep ? 'Got it!' : 'Next'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      }
      placement={placement}
      onClose={onSkip}
      contentStyle={styles.tooltip}
      tooltipStyle={styles.tooltipContainer}
      backgroundColor="rgba(0,0,0,0.7)"
      showChildInTooltip={false}
      disableShadow={false}
    >
      {children}
    </Tooltip>
  );
};

const styles = StyleSheet.create({
  // Modal styles for center placement
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: spacing.xl,
    width: '85%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  // Tooltip styles for other placements
  tooltipContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tooltip: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: 0,
  },
  tooltipContent: {
    padding: spacing.lg,
    minWidth: 280,
    maxWidth: 320,
  },
  // Shared styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    flex: 1,
  },
  progress: {
    ...typography.caption,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
    backgroundColor: `${colors.primary}20`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  content: {
    ...typography.body,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  skipButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  skipText: {
    ...typography.button,
    color: colors.text.secondary,
  },
  nextButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  nextText: {
    ...typography.button,
    color: colors.text.primary,
  },
});
