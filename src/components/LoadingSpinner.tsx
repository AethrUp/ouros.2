import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Modal } from 'react-native';
import { LoadingSpinnerProps } from '../types';
import { theme } from '../styles/theme';

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = theme.colors.primary,
  text,
  overlay = false,
  progress,
  testId = 'loading-spinner',
}) => {
  const sizeMap = {
    small: 'small' as const,
    medium: 'large' as const,
    large: 'large' as const,
  };

  const scaleMap = {
    small: 0.7,
    medium: 1,
    large: 1.5,
  };

  const spinnerContent = (
    <View style={[styles.container, overlay && styles.overlayContainer]} testID={testId}>
      <View style={styles.content}>
        <ActivityIndicator
          size={sizeMap[size]}
          color={color}
          style={{ transform: [{ scale: scaleMap[size] }] }}
        />
        {text && (
          <Text style={[styles.text, { color: overlay ? theme.colors.textInverse : theme.colors.text.primary }]}>
            {text}
          </Text>
        )}
        {progress !== undefined && (
          <Text style={[styles.progress, { color: overlay ? theme.colors.textInverse : theme.colors.textSecondary }]}>
            {Math.round(progress * 100)}%
          </Text>
        )}
      </View>
    </View>
  );

  if (overlay) {
    return (
      <Modal transparent visible animationType="fade">
        {spinnerContent}
      </Modal>
    );
  }

  return spinnerContent;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContainer: {
    backgroundColor: theme.colors.overlay,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'transparent',
  },
  text: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    textAlign: 'center',
  },
  progress: {
    marginTop: theme.spacing.sm,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.regular,
  },
});
