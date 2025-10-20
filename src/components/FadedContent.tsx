import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing } from '../styles';
import { Button } from './Button';

interface FadedContentProps {
  /**
   * Content to show with fade
   */
  children: React.ReactNode;

  /**
   * Callback when user taps to unlock
   */
  onUnlock: () => void;

  /**
   * Maximum height before fading starts (in pixels)
   * Default: 140px (roughly 3-4 lines of text)
   */
  maxHeight?: number;

  /**
   * Custom style for container
   */
  style?: ViewStyle;

  /**
   * Whether this content is locked (if false, shows full content)
   */
  isLocked?: boolean;
}

/**
 * Displays content with a gradient fade and "Unlock to read more" CTA
 * Used for premium sections on free tier
 */
export const FadedContent: React.FC<FadedContentProps> = ({
  children,
  onUnlock,
  maxHeight = 140,
  style,
  isLocked = true,
}) => {
  // If not locked, just render children normally
  if (!isLocked) {
    return <View style={style}>{children}</View>;
  }

  return (
    <View style={[styles.container, style]}>
      {/* Content container with max height */}
      <View style={[styles.contentContainer, { maxHeight }]}>
        {children}
      </View>

      {/* Gradient overlay - fades from transparent to background color */}
      <LinearGradient
        colors={[
          'rgba(37, 37, 37, 0)',      // Transparent at top (#252525 with 0% opacity)
          'rgba(37, 37, 37, 0.7)',    // Semi-transparent middle (#252525 with 70% opacity)
          'rgba(37, 37, 37, 0.95)',   // Almost opaque (#252525 with 95% opacity)
          'rgba(37, 37, 37, 1)',      // Fully opaque at bottom (#252525 with 100% opacity)
        ]}
        locations={[0, 0.5, 0.8, 1]}
        style={styles.gradientOverlay}
        pointerEvents="none"
      />

      {/* Unlock CTA - positioned at bottom */}
      <View style={styles.unlockButtonContainer}>
        <Button
          title="Unlock to read more"
          onPress={onUnlock}
          variant="primary"
          size="small"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  contentContainer: {
    overflow: 'hidden',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 200, // Height of gradient effect
    zIndex: 1,
  },
  unlockButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    backgroundColor: 'transparent',
    zIndex: 2,
  },
});
