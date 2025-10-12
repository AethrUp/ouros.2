import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationProps } from '../types';
import { LoadingSpinner } from '../components';
import { colors, spacing, typography } from '../styles';

export const SplashScreen: React.FC<NavigationProps> = ({ navigation }) => {
  useEffect(() => {
    // Simulate loading/initialization
    const timer = setTimeout(() => {
      navigation.replace('birthDateTime');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.loaderContainer}>
        <View style={styles.circle} />
        <Text style={styles.text}>Checking stars...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: colors.text.primary,
    borderTopColor: 'transparent',
    marginBottom: spacing.xl,
  },
  text: {
    ...typography.h2,
    textAlign: 'center',
  },
});
