import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { NavigationProps } from '../types';
import { HeaderBar } from '../components';
import { colors, spacing, typography } from '../styles';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store';

export const JournalScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const { journalEntries, getEntries, isLoadingEntries } = useAppStore();

  useEffect(() => {
    // Load journal entries when screen mounts
    getEntries();
  }, []);

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
      <ScrollView style={styles.scrollContent}>
        {/* Quick Access Section */}
        <View style={styles.quickAccessSection}>
          <View style={styles.accessRow}>
            <TouchableOpacity
              style={styles.accessCard}
              onPress={() => navigation.navigate('chart')}
            >
              <Text style={styles.accessTitle}>NATAL CHART</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.accessCard}
              onPress={() => navigation.navigate('readings')}
            >
              <Text style={styles.accessTitle}>READINGS</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Journal Entries Section */}
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
              {journalEntries.map((entry) => (
                <TouchableOpacity
                  key={entry.id}
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
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
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
  quickAccessSection: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    ...typography.caption,
    letterSpacing: 1,
    marginBottom: spacing.md,
    color: colors.text.secondary,
  },
  accessRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  accessCard: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accessTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: 1.2,
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
});
