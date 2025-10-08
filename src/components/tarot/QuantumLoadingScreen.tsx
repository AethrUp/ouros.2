import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { theme } from '../../styles/theme';

interface QuantumLoadingScreenProps {
  message?: string;
}

export const QuantumLoadingScreen: React.FC<QuantumLoadingScreenProps> = ({
  message = 'Loading...',
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulsing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.quantumCircle,
          {
            transform: [{ scale: pulseAnim }, { rotate }],
          },
        ]}
      >
        <View style={styles.innerCircle} />
      </Animated.View>

      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  quantumCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#D4AF37', // Gold color
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  innerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: theme.colors.text.primary,
    opacity: 0.3,
  },
  message: {
    fontSize: 18,
    color: theme.colors.text.primary,
    fontFamily: 'Libre Baskerville',
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subMessage: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
});
