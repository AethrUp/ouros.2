import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen, OnboardingScreen, BirthDataScreen, BirthDateTimeScreen } from '../screens';

const Stack = createNativeStackNavigator();

export const OnboardingNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="splash"
    >
      <Stack.Screen name="splash" component={SplashScreen} />
      <Stack.Screen name="onboarding" component={OnboardingScreen} />
      <Stack.Screen name="birthData" component={BirthDataScreen} />
      <Stack.Screen name="birthDateTime" component={BirthDateTimeScreen} />
    </Stack.Navigator>
  );
};
