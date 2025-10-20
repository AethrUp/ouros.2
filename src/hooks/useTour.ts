import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TourStep {
  key: string;
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  screen?: string; // Optional screen name for navigation
}

export const useTour = (
  tourKey: string,
  steps: TourStep[],
  onNavigate?: (nextStep: number, screen?: string) => void
) => {
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    checkTourStatus();
  }, []);

  const checkTourStatus = async () => {
    try {
      const hasCompleted = await AsyncStorage.getItem(`tour_${tourKey}_completed`);
      const savedStep = await AsyncStorage.getItem(`tour_${tourKey}_step`);

      if (!hasCompleted) {
        const stepToShow = savedStep ? parseInt(savedStep, 10) : 0;
        // Small delay to ensure UI is rendered
        setTimeout(() => {
          setCurrentStep(stepToShow);
          setIsActive(true);
        }, 500);
      }
    } catch (error) {
      console.error('Error checking tour status:', error);
    }
  };

  const nextStep = async () => {
    if (currentStep < steps.length - 1) {
      const nextStepIndex = currentStep + 1;
      setCurrentStep(nextStepIndex);

      // Save the current step
      try {
        await AsyncStorage.setItem(`tour_${tourKey}_step`, nextStepIndex.toString());
      } catch (error) {
        console.error('Error saving tour step:', error);
      }

      // Call navigation callback if provided
      if (onNavigate && steps[nextStepIndex]?.screen) {
        onNavigate(nextStepIndex, steps[nextStepIndex].screen);
      }
    } else {
      completeTour();
    }
  };

  const skipTour = () => {
    completeTour();
  };

  const completeTour = async () => {
    try {
      await AsyncStorage.setItem(`tour_${tourKey}_completed`, 'true');
      await AsyncStorage.removeItem(`tour_${tourKey}_step`);
      setIsActive(false);
      setCurrentStep(-1);
    } catch (error) {
      console.error('Error completing tour:', error);
    }
  };

  const resetTour = async () => {
    try {
      await AsyncStorage.removeItem(`tour_${tourKey}_completed`);
      await AsyncStorage.removeItem(`tour_${tourKey}_step`);
      setCurrentStep(0);
      setIsActive(true);
    } catch (error) {
      console.error('Error resetting tour:', error);
    }
  };

  const setStep = async (step: number) => {
    try {
      setCurrentStep(step);
      await AsyncStorage.setItem(`tour_${tourKey}_step`, step.toString());
    } catch (error) {
      console.error('Error setting tour step:', error);
    }
  };

  return {
    currentStep,
    isActive,
    nextStep,
    skipTour,
    resetTour,
    setStep,
    isStepActive: (stepIndex: number) => isActive && currentStep === stepIndex,
    progress: isActive && currentStep >= 0 ? `${currentStep + 1}/${steps.length}` : '',
  };
};
