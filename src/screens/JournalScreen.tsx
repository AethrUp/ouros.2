import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { NavigationProps } from '../types';
import { HeaderBar, LoadingScreen } from '../components';
import { colors, spacing, typography } from '../styles';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store';
import { format } from 'date-fns';

type TabType = 'journal' | 'readings';

export const JournalScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const {
    journalEntries,
    getEntries,
    isLoadingEntries,
    readings,
    ichingReadings,
    dreamReadings,
    loadHistory,
    loadIChingHistory,
    loadDreamHistory,
    isLoadingHistory,
    isLoadingIChingHistory,
  } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabType>('journal');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        getEntries(),
        loadHistory(),
        loadIChingHistory(),
        loadDreamHistory(),
      ]);
    };
    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'journal') {
      await getEntries();
    } else if (activeTab === 'readings') {
      await Promise.all([loadHistory(), loadIChingHistory(), loadDreamHistory()]);
    }
    setRefreshing(false);
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  // Combine and sort all readings by date
  const allReadings = [
    ...readings.map((r) => ({ ...r, type: 'tarot' as const })),
    ...ichingReadings.map((r) => ({ ...r, type: 'iching' as const })),
    ...dreamReadings.map((r) => ({ ...r, type: 'dream' as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const isLoadingReadings = isLoadingHistory || isLoadingIChingHistory;

  return (
    <View style={styles.container}>
      <HeaderBar
        title="JOURNAL"
        rightActions={[
          {
            icon: 'add-outline',
            onPress: () => navigation.navigate('JournalEntry'),
          },
        ]}
      />

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => handleTabChange('journal')}
        >
          <Text style={[styles.tabText, activeTab === 'journal' && styles.tabTextActive]}>
            JOURNAL
          </Text>
          {activeTab === 'journal' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tab}
          onPress={() => handleTabChange('readings')}
        >
          <Text style={[styles.tabText, activeTab === 'readings' && styles.tabTextActive]}>
            READINGS
          </Text>
          {activeTab === 'readings' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {activeTab === 'journal' ? (
          <View style={styles.entriesSection}>
            <Text style={styles.sectionTitle}>JOURNAL ENTRIES</Text>
            {isLoadingEntries ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Loading entries...</Text>
              </View>
            ) : journalEntries.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={48} color={colors.text.secondary} />
                <Text style={styles.emptyText}>No journal entries yet</Text>
                <Text style={styles.emptySubtext}>Tap the + button to create your first entry</Text>
              </View>
            ) : (
              <View style={styles.entriesList}>
                {journalEntries.map((entry, index) => (
                  <Animated.View key={entry.id} entering={FadeIn.delay(index * 50)}>
                    <TouchableOpacity
                      style={styles.entryCard}
                      onPress={() => navigation.navigate('JournalEntry', { entryId: entry.id })}
                    >
                      <View style={styles.entryHeader}>
                        <Text style={styles.entryType}>{entry.entry_type.toUpperCase()}</Text>
                        <Text style={styles.entryDate}>
                          {new Date(entry.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </Text>
                      </View>
                      <Text style={styles.entryTitle} numberOfLines={1}>
                        {entry.title || `Journal Entry ${new Date(entry.date).toLocaleDateString()}`}
                      </Text>
                      <Text style={styles.entryPreview} numberOfLines={2}>
                        {entry.content}
                      </Text>
                      {entry.linked_reading && (
                        <View style={styles.linkedBadge}>
                          <Ionicons name="link-outline" size={12} color={colors.primary} />
                          <Text style={styles.linkedBadgeText}>Linked Reading</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            )}
          </View>
        ) : activeTab === 'readings' ? (
          <View style={styles.entriesSection}>
            {isLoadingReadings && allReadings.length === 0 ? (
              <View style={styles.loadingContainer}>
                <LoadingScreen context="general" />
              </View>
            ) : allReadings.length === 0 ? (
              <Animated.View entering={FadeIn} style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📖</Text>
                <Text style={styles.emptyText}>No Readings Yet</Text>
                <Text style={styles.emptySubtext}>
                  Your divination readings will appear here. Start with a Tarot reading, I Ching
                  consultation, or dream interpretation.
                </Text>
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
                          console.log('Dream reading detail:', reading.id);
                        }}
                      />
                    )}
                  </Animated.View>
                ))}
              </View>
            )}
          </View>
        ) : null}
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
  scrollContent: {
    flex: 1,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background.primary,
    marginTop: spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    position: 'relative',
  },
  tabText: {
    ...typography.body,
    color: colors.text.secondary,
    letterSpacing: 1.2,
    fontSize: 12,
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: 2,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    ...typography.caption,
    letterSpacing: 1,
    marginBottom: spacing.md,
    color: colors.text.secondary,
  },
  entriesSection: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    ...typography.h3,
    marginTop: spacing.md,
    color: colors.text.secondary,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  entriesList: {
    gap: spacing.md,
  },
  entryCard: {
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  entryType: {
    ...typography.caption,
    color: '#FFFFFF',
    backgroundColor: 'rgba(200, 182, 226, 0.5)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  entryDate: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  entryTitle: {
    fontSize: 20,
    fontWeight: '400',
    marginBottom: spacing.xs,
    color: '#F6D99F',
    fontFamily: 'Georgia',
    letterSpacing: 0,
  },
  entryPreview: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.5)',
    lineHeight: 20,
  },
  linkedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  linkedBadgeText: {
    ...typography.caption,
    color: colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  readingsList: {
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
    backgroundColor: 'rgba(139, 189, 229, 0.5)',
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
