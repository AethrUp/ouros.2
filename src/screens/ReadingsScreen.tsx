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
    dreamReadings,
    loadHistory,
    loadIChingHistory,
    loadDreamHistory,
    isLoadingHistory,
    isLoadingIChingHistory,
  } = useAppStore();

  const [refreshing, setRefreshing] = React.useState(false);

  // Load readings on mount
  useEffect(() => {
    loadHistory();
    loadIChingHistory();
    loadDreamHistory();
  }, []);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadHistory(), loadIChingHistory(), loadDreamHistory()]);
    setRefreshing(false);
  };

  // Combine and sort all readings by date
  const allReadings = [
    ...readings.map((r) => ({ ...r, type: 'tarot' as const })),
    ...ichingReadings.map((r) => ({ ...r, type: 'iching' as const })),
    ...dreamReadings.map((r) => ({ ...r, type: 'dream' as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const isLoading = isLoadingHistory || isLoadingIChingHistory;

  return (
    <View style={styles.container}>
      <HeaderBar
        title="READINGS"
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
              Your divination readings will appear here. Start with a Tarot reading, I Ching
              consultation, or dream interpretation.
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
                  <TarotReadingCard
                    reading={reading}
                    onPress={() => navigation.navigate('TarotReadingDetail', { readingId: reading.id })}
                  />
                ) : reading.type === 'iching' ? (
                  <IChingReadingCard
                    reading={reading}
                    onPress={() => navigation.navigate('IChingReadingDetail', { readingId: reading.id })}
                  />
                ) : (
                  <DreamReadingCard
                    reading={reading}
                    onPress={() => {
                      // For now, just show an alert or navigate to a simple detail view
                      // TODO: Create DreamReadingDetailScreen
                      console.log('Dream reading detail:', reading.id);
                    }}
                  />
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
  const dateStr = format(new Date(reading.createdAt), 'MMM d');

  return (
    <TouchableOpacity style={styles.readingCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.readingHeader}>
        <View style={styles.readingTypeBadge}>
          <Text style={styles.readingTypeText}>TAROT</Text>
        </View>
        <Text style={styles.readingDate}>{dateStr}</Text>
      </View>

      <Text style={styles.readingIntention} numberOfLines={1}>
        {reading.intention || 'No intention recorded'}
      </Text>

      <Text style={styles.readingDetails}>
        {reading.spread?.name || 'Unknown Spread'} • {reading.cards?.length || 0} cards
      </Text>
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
  const dateStr = format(new Date(reading.createdAt), 'MMM d');

  const hexagramName =
    reading.primaryHexagram?.hexagram?.englishName ||
    reading.primaryHexagram?.hexagram?.name ||
    'Unknown';
  const hexagramNumber = reading.primaryHexagram?.hexagram?.number || '?';

  return (
    <TouchableOpacity style={styles.readingCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.readingHeader}>
        <View style={styles.readingTypeBadge}>
          <Text style={styles.readingTypeText}>I CHING</Text>
        </View>
        <Text style={styles.readingDate}>{dateStr}</Text>
      </View>

      <Text style={styles.readingIntention} numberOfLines={1}>
        {reading.question || 'No question recorded'}
      </Text>

      <Text style={styles.readingDetails}>
        #{hexagramNumber} {hexagramName}
      </Text>
    </TouchableOpacity>
  );
};

/**
 * Dream Reading Card
 */
interface DreamReadingCardProps {
  reading: any;
  onPress: () => void;
}

const DreamReadingCard: React.FC<DreamReadingCardProps> = ({ reading, onPress }) => {
  const dateStr = format(new Date(reading.createdAt), 'MMM d');

  const dreamPreview =
    reading.dreamDescription?.substring(0, 60) ||
    reading.intention?.substring(0, 60) ||
    'No description';

  return (
    <TouchableOpacity style={styles.readingCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.readingHeader}>
        <View style={[styles.readingTypeBadge, styles.dreamBadge]}>
          <Text style={styles.readingTypeText}>DREAM</Text>
        </View>
        <Text style={styles.readingDate}>{dateStr}</Text>
      </View>

      <Text style={styles.readingIntention} numberOfLines={2}>
        {dreamPreview}
        {dreamPreview.length >= 60 ? '...' : ''}
      </Text>

      <Text style={styles.readingDetails}>Dream Interpretation</Text>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl * 2,
    gap: spacing.md,
  },
  readingCard: {
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  readingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  readingTypeBadge: {
    ...typography.caption,
    color: '#FFFFFF',
    backgroundColor: 'rgba(200, 182, 226, 0.5)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  dreamBadge: {
    backgroundColor: 'rgba(139, 189, 229, 0.5)', // Blue tint for dreams
  },
  readingTypeText: {
    ...typography.caption,
    color: '#FFFFFF',
  },
  readingDate: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  readingIntention: {
    fontSize: 20,
    fontWeight: '400',
    marginBottom: spacing.xs,
    color: '#F6D99F',
    fontFamily: 'Georgia',
    letterSpacing: 0,
  },
  readingDetails: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.5)',
    lineHeight: 20,
  },
});
