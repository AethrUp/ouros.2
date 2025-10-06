import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { NavigationProps } from '../types';
import { HeaderBar, LoadingSpinner } from '../components';
import { colors, typography, spacing } from '../styles';
import { useAppStore } from '../store';
import { format } from 'date-fns';

export const ReadingsScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const {
    readings,
    ichingReadings,
    loadHistory,
    loadIChingHistory,
    isLoadingHistory,
    isLoadingIChingHistory,
  } = useAppStore();

  const [refreshing, setRefreshing] = React.useState(false);

  // Load readings on mount
  useEffect(() => {
    loadHistory();
    loadIChingHistory();
  }, []);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadHistory(), loadIChingHistory()]);
    setRefreshing(false);
  };

  // Combine and sort all readings by date
  const allReadings = [
    ...readings.map((r) => ({ ...r, type: 'tarot' as const })),
    ...ichingReadings.map((r) => ({ ...r, type: 'iching' as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const isLoading = isLoadingHistory || isLoadingIChingHistory;

  return (
    <View style={styles.container}>
      <HeaderBar
        title="Reading History"
        rightActions={[
          {
            icon: 'funnel-outline',
            onPress: () => console.log('Filter'),
          },
        ]}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {isLoading && allReadings.length === 0 ? (
          <View style={styles.loadingContainer}>
            <LoadingSpinner />
            <Text style={styles.loadingText}>Loading readings...</Text>
          </View>
        ) : allReadings.length === 0 ? (
          <Animated.View entering={FadeIn} style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📖</Text>
            <Text style={styles.emptyTitle}>No Readings Yet</Text>
            <Text style={styles.emptyText}>
              Your divination readings will appear here. Start with a Tarot reading or I Ching
              consultation.
            </Text>
            <View style={styles.emptyButtons}>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('tarot')}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyButtonText}>Try Tarot</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.emptyButton, styles.emptyButtonSecondary]}
                onPress={() => navigation.navigate('iching')}
                activeOpacity={0.8}
              >
                <Text style={[styles.emptyButtonText, styles.emptyButtonTextSecondary]}>
                  Try I Ching
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        ) : (
          <View style={styles.readingsList}>
            {allReadings.map((reading, index) => (
              <Animated.View key={reading.id} entering={FadeIn.delay(index * 50)}>
                {reading.type === 'tarot' ? (
                  <TarotReadingCard reading={reading} onPress={() => console.log('View tarot')} />
                ) : (
                  <IChingReadingCard reading={reading} onPress={() => console.log('View iching')} />
                )}
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

/**
 * Tarot Reading Card
 */
interface TarotReadingCardProps {
  reading: any;
  onPress: () => void;
}

const TarotReadingCard: React.FC<TarotReadingCardProps> = ({ reading, onPress }) => {
  const dateStr = format(new Date(reading.createdAt), 'MMM d, yyyy');
  const timeStr = format(new Date(reading.createdAt), 'h:mm a');

  return (
    <TouchableOpacity style={styles.readingCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.readingHeader}>
        <View style={[styles.readingTypeBadge, styles.tarotBadge]}>
          <Text style={styles.readingTypeText}>Tarot</Text>
        </View>
        <Text style={styles.readingDate}>{dateStr}</Text>
      </View>

      <Text style={styles.readingIntention} numberOfLines={2}>
        {reading.intention || 'No intention recorded'}
      </Text>

      <View style={styles.readingDetails}>
        <Text style={styles.readingDetailText}>
          {reading.spread?.name || 'Unknown Spread'} • {reading.cards?.length || 0} cards
        </Text>
        <Text style={styles.readingTime}>{timeStr}</Text>
      </View>
    </TouchableOpacity>
  );
};

/**
 * I Ching Reading Card
 */
interface IChingReadingCardProps {
  reading: any;
  onPress: () => void;
}

const IChingReadingCard: React.FC<IChingReadingCardProps> = ({ reading, onPress }) => {
  const dateStr = format(new Date(reading.createdAt), 'MMM d, yyyy');
  const timeStr = format(new Date(reading.createdAt), 'h:mm a');

  const hexagramName =
    reading.primaryHexagram?.hexagram?.englishName ||
    reading.primaryHexagram?.hexagram?.name ||
    'Unknown';
  const hexagramNumber = reading.primaryHexagram?.hexagram?.number || '?';

  return (
    <TouchableOpacity style={styles.readingCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.readingHeader}>
        <View style={[styles.readingTypeBadge, styles.ichingBadge]}>
          <Text style={styles.readingTypeText}>I Ching</Text>
        </View>
        <Text style={styles.readingDate}>{dateStr}</Text>
      </View>

      <Text style={styles.readingIntention} numberOfLines={2}>
        {reading.question || 'No question recorded'}
      </Text>

      <View style={styles.readingDetails}>
        <Text style={styles.readingDetailText}>
          #{hexagramNumber} {hexagramName}
        </Text>
        <Text style={styles.readingTime}>{timeStr}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.h2,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  emptyButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  emptyButton: {
    backgroundColor: colors.button.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  emptyButtonText: {
    ...typography.button,
    color: colors.button.text,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyButtonTextSecondary: {
    color: colors.text.primary,
  },
  readingsList: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  readingCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  readingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  readingTypeBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  tarotBadge: {
    backgroundColor: 'rgba(147, 51, 234, 0.15)',
  },
  ichingBadge: {
    backgroundColor: 'rgba(129, 184, 181, 0.15)',
  },
  readingTypeText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  readingDate: {
    ...typography.caption,
    color: colors.text.secondary,
    fontSize: 12,
  },
  readingIntention: {
    ...typography.body,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.sm,
    color: colors.text.primary,
  },
  readingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readingDetailText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontSize: 11,
  },
  readingTime: {
    ...typography.caption,
    color: colors.text.secondary,
    fontSize: 11,
  },
});
