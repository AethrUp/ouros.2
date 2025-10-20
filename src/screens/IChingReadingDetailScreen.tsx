/**
 * I Ching Reading Detail Screen
 * Displays a historical I Ching reading
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProps } from '../types';
import { useAppStore } from '../store';
import { InterpretationView } from '../components/iching/InterpretationView';
import { IChingReading, LinkedReading } from '../types';
import { colors } from '../styles';
import { LoadingScreen } from '../components';

interface IChingReadingDetailScreenProps extends NavigationProps {
  route: {
    params: {
      readingId: string;
    };
  };
}

export const IChingReadingDetailScreen: React.FC<IChingReadingDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { readingId } = route.params;
  const { ichingReadings } = useAppStore();
  const [reading, setReading] = useState<IChingReading | null>(null);

  useEffect(() => {
    // Find the reading by ID
    const foundReading = ichingReadings.find((r) => r.id === readingId);
    if (foundReading) {
      setReading(foundReading);
    } else {
      Alert.alert('Error', 'Reading not found');
      navigation.goBack();
    }
  }, [readingId, ichingReadings]);

  const handleJournal = (prompt?: string, promptIndex?: number) => {
    if (!reading) return;

    // Transform IChingReading to LinkedReading format
    const linkedReading: LinkedReading = {
      id: reading.id,
      reading_type: 'iching',
      title: `Hexagram ${reading.primaryHexagram.hexagram.number}: ${reading.primaryHexagram.hexagram.englishName}`,
      timestamp: reading.createdAt,
      interpretation: typeof reading.interpretation === 'string'
        ? reading.interpretation
        : JSON.stringify(reading.interpretation),
      intention: prompt || reading.question, // Use prompt if provided
      metadata: {
        primaryHexagram: reading.primaryHexagram.hexagram.number,
        changingLines: reading.primaryHexagram.changingLines,
        relatingHexagram: reading.relatingHexagram?.hexagram.number,
        ...(prompt && { prompt, promptIndex }),
      },
    };

    // Navigate to journal entry screen with linked reading
    navigation.navigate('JournalEntry', {
      linkedReading,
      entryType: 'iching',
    });
  };

  if (!reading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <LoadingScreen context="iching" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <InterpretationView
        question={reading.question}
        primaryHexagram={reading.primaryHexagram}
        relatingHexagram={reading.relatingHexagram}
        interpretation={reading.interpretation}
        isGenerating={false}
        onJournal={handleJournal}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
