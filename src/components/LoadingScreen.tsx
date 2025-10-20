import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Modal } from 'react-native';
import { theme } from '../styles/theme';
import RadionicSpinner from './RadionicSpinner';

type LoadingContext = 'natal-chart' | 'tarot' | 'dream' | 'synastry' | 'iching' | 'general';

interface LoadingScreenProps {
  context?: LoadingContext;
  messages?: string[];
  rotationInterval?: number;
  overlay?: boolean;
  testId?: string;
}

const MESSAGE_SETS: Record<LoadingContext, string[]> = {
  'natal-chart': [
    'Calculating planetary positions',
    'Analyzing celestial influences',
    'Mapping your cosmic blueprint',
    'Interpreting astrological patterns',
  ],
  'tarot': [
    'Shuffling the cosmic deck',
    'Connecting with universal energies',
    'Reading the mystical patterns',
    'Channeling divine guidance',
  ],
  'dream': [
    'Interpreting your dream',
    'Analyzing symbolic meanings',
    'Connecting subconscious patterns',
    'Unveiling hidden messages',
  ],
  'synastry': [
    'Analyzing relationship dynamics',
    'Calculating compatibility patterns',
    'Mapping cosmic connections',
    'Interpreting relational energies',
  ],
  'iching': [
    'Consulting the oracle',
    'Interpreting hexagram wisdom',
    'Connecting with ancient guidance',
    'Reading the cosmic patterns',
  ],
  'general': [
    'Loading',
    'Just a moment',
    'Preparing your insights',
  ],
};

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  context = 'general',
  messages,
  rotationInterval = 4500,
  overlay = false,
  testId = 'loading-screen',
}) => {
  const messageArray = messages || MESSAGE_SETS[context];
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // Entrance animations
  const entranceOpacity = useRef(new Animated.Value(0)).current;
  const entranceScale = useRef(new Animated.Value(0.95)).current;

  // Message rotation animation
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Entrance animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(entranceOpacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(entranceScale, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Message rotation animation
  useEffect(() => {
    if (messageArray.length <= 1) return;

    const interval = setInterval(() => {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // Change message
        setCurrentMessageIndex((prev) => (prev + 1) % messageArray.length);

        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, rotationInterval);

    return () => clearInterval(interval);
  }, [messageArray, rotationInterval]);

  const content = (
    <Animated.View
      style={[
        styles.container,
        overlay && styles.overlayContainer,
        {
          opacity: entranceOpacity,
          transform: [{ scale: entranceScale }],
        },
      ]}
      testID={testId}
      accessibilityRole="progressbar"
      accessibilityLabel={messageArray[currentMessageIndex]}
    >
      <View style={styles.spinnerWrapper}>
        <RadionicSpinner />
      </View>

      <Animated.View style={[styles.messageContainer, { opacity: fadeAnim }]}>
        <Text
          style={[
            styles.message,
            overlay && styles.messageOverlay,
          ]}
        >
          {messageArray[currentMessageIndex]}
        </Text>
      </Animated.View>
    </Animated.View>
  );

  if (overlay) {
    return (
      <Modal transparent visible animationType="none">
        {content}
      </Modal>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
    paddingHorizontal: theme.spacing.xl,
  },
  overlayContainer: {
    backgroundColor: theme.colors.overlay,
  },
  spinnerWrapper: {
    height: 280,
    width: 280,
    marginBottom: theme.spacing.xl,
  },
  messageContainer: {
    width: '100%',
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
  },
  message: {
    fontSize: 22,
    color: theme.colors.text.primary,
    fontFamily: 'PTSerif_400Regular',
    textAlign: 'center',
  },
  messageOverlay: {
    color: theme.colors.textInverse,
  },
});
