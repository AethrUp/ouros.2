import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { NavigationProps } from '../types';
import { Button } from '../components';
import { LocationPicker } from '../components/LocationPicker';
import { LocationData } from '../types/user';
import { colors, spacing, typography } from '../styles';

export const BirthDataScreen: React.FC<NavigationProps> = ({ navigation, route }) => {
  const { date, time } = route.params as any;
  const [location, setLocation] = useState<LocationData | null>(null);

  const handleLocationSelect = (selectedLocation: LocationData) => {
    setLocation(selectedLocation);
  };

  const handleContinue = async () => {
    if (!location) return;

    // Navigate to onboarding (categories) with all birth data
    navigation.navigate('onboarding', { date, time, location });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Text style={styles.title}>Where were you born?</Text>

            <View style={styles.formContainer}>
              <LocationPicker
                onLocationSelect={handleLocationSelect}
                testId="birth-location-picker"
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="NEXT"
            onPress={handleContinue}
            disabled={!location}
            fullWidth
            variant="primary"
            testId="birth-data-next-button"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
  },
  title: {
    ...typography.h1,
    fontSize: 32,
    marginBottom: spacing.xl,
  },
  formContainer: {
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
