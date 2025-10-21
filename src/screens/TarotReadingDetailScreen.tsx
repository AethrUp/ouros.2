/**
 * Tarot Reading Detail Screen
 * Displays a historical Tarot reading
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProps } from '../types';
import { useAppStore } from '../store';
import { InterpretationScreen } from '../components/tarot/InterpretationScreen';
import { TarotReading, LinkedReading } from '../types';
import { colors } from '../styles';
import { LoadingScreen } from '../components';

interface TarotReadingDetailScreenProps extends NavigationProps {
  route: {
    params: {
      readingId: string;
    };
  };
}

export const TarotReadingDetailScreen: React.FC<TarotReadingDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { readingId } = route.params;
  const { readings } = useAppStore();
  const [reading, setReading] = useState<TarotReading | null>(null);

  useEffect(() => {
    // Find the reading by ID
    const foundReading = readings.find((r) => r.id === readingId);
    if (foundReading) {
      setReading(foundReading);
    } else {
      Alert.alert('Error', 'Reading not found');
      navigation.goBack();
    }
  }, [readingId, readings]);

  const handleSave = () => {
    // Reading is already saved, this is just for consistency with the interface
    console.log('Reading already saved');
  };

  const handleJournal = (prompt?: string, promptIndex?: number) => {
    if (!reading) return;

    // Extract human-readable interpretation text
    let interpretationText: string;
    if (typeof reading.interpretation === 'string') {
      interpretationText = reading.interpretation;
    } else if ('fullContent' in reading.interpretation) {
      // V2 format (TarotInterpretation)
      interpretationText = reading.interpretation.fullContent.overview;
    } else {
      interpretationText = 'No interpretation available';
    }

    // Transform TarotReading to LinkedReading format
    const linkedReading: LinkedReading = {
      id: reading.id,
      reading_type: 'tarot',
      title: `${reading.spread.name} - ${reading.cards.length} cards`,
      timestamp: reading.createdAt,
      interpretation: interpretationText,
      intention: prompt || reading.intention, // Use prompt if provided
      metadata: {
        spread: reading.spread.name,
        cardCount: reading.cards.length,
        cards: reading.cards.map((dc) => ({
          name: dc.card.name,
          position: dc.position,
          orientation: dc.orientation,
        })),
        ...(prompt && { prompt, promptIndex }),
      },
    };

    // Navigate to journal entry screen with linked reading
    navigation.navigate('JournalEntry', {
      linkedReading,
      entryType: 'tarot',
    });
  };

  if (!reading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <LoadingScreen context="tarot" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <InterpretationScreen
        drawnCards={reading.cards}
        spread={reading.spread}
        intention={reading.intention}
        interpretation={reading.interpretation}
        onSave={handleSave}
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
