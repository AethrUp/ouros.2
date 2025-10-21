import React, { useEffect } from 'react';
import { NavigationProps } from '../types';
import { LoadingScreen } from '../components';

export const SplashScreen: React.FC<NavigationProps> = ({ navigation }) => {
  useEffect(() => {
    // Simulate loading/initialization
    const timer = setTimeout(() => {
      navigation.replace('birthDateTime');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return <LoadingScreen context="general" />;
};
