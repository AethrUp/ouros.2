import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../styles';
import { FriendConnection, SavedChart, SynastryPartner } from '../../types/synastry';

interface PartnerSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (partner: SynastryPartner) => void;
  connections: FriendConnection[];
  savedCharts: SavedChart[];
}

export const PartnerSelector: React.FC<PartnerSelectorProps> = ({
  visible,
  onClose,
  onSelect,
  connections,
  savedCharts,
}) => {
  const [activeTab, setActiveTab] = useState<'friends' | 'saved'>('friends');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConnections = connections.filter(conn =>
    conn.friendDisplayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSavedCharts = savedCharts.filter(chart =>
    chart.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (chart.relationship && chart.relationship.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelectConnection = (connection: FriendConnection) => {
    // Note: In a real implementation, you'd need to fetch the friend's natal chart
    // For now, we'll need to pass this responsibility to the parent component
    const partner: SynastryPartner = {
      type: 'user',
      userId: connection.friendId,
      connectionId: connection.connectionId,
      displayName: connection.friendDisplayName,
      natalChart: {} as any, // This should be fetched by the parent
    };
    onSelect(partner);
    onClose();
  };

  const handleSelectSavedChart = (chart: SavedChart) => {
    const partner: SynastryPartner = {
      type: 'saved',
      savedChartId: chart.id,
      displayName: chart.name,
      natalChart: chart.natalChart,
    };
    onSelect(partner);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Select Partner</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.text.secondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              placeholderTextColor={colors.text.secondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'friends' && styles.tabActive]}
              onPress={() => setActiveTab('friends')}
            >
              <Ionicons
                name="people"
                size={20}
                color={activeTab === 'friends' ? colors.primary : colors.text.secondary}
              />
              <Text style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}>
                Friends
              </Text>
              {connections.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{connections.length}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'saved' && styles.tabActive]}
              onPress={() => setActiveTab('saved')}
            >
              <Ionicons
                name="bookmark"
                size={20}
                color={activeTab === 'saved' ? colors.primary : colors.text.secondary}
              />
              <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>
                Saved Charts
              </Text>
              {savedCharts.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{savedCharts.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {activeTab === 'friends' ? (
              <>
                {filteredConnections.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="people-outline" size={64} color={colors.text.secondary} />
                    <Text style={styles.emptyTitle}>
                      {connections.length === 0 ? 'No Friends Yet' : 'No Results'}
                    </Text>
                    <Text style={styles.emptyText}>
                      {connections.length === 0
                        ? 'Add friends to see them here'
                        : 'Try a different search term'}
                    </Text>
                  </View>
                ) : (
                  filteredConnections.map((connection) => (
                    <TouchableOpacity
                      key={connection.connectionId}
                      style={styles.item}
                      onPress={() => handleSelectConnection(connection)}
                    >
                      <View style={styles.avatar}>
                        <Ionicons name="person" size={24} color={colors.primary} />
                      </View>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{connection.friendDisplayName}</Text>
                        {connection.relationshipLabel && (
                          <Text style={styles.itemLabel}>{connection.relationshipLabel}</Text>
                        )}
                        <Text style={styles.itemDetail}>Code: {connection.friendCode}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
                    </TouchableOpacity>
                  ))
                )}
              </>
            ) : (
              <>
                {filteredSavedCharts.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="bookmark-outline" size={64} color={colors.text.secondary} />
                    <Text style={styles.emptyTitle}>
                      {savedCharts.length === 0 ? 'No Saved Charts' : 'No Results'}
                    </Text>
                    <Text style={styles.emptyText}>
                      {savedCharts.length === 0
                        ? 'Create a saved chart to see it here'
                        : 'Try a different search term'}
                    </Text>
                  </View>
                ) : (
                  filteredSavedCharts.map((chart) => (
                    <TouchableOpacity
                      key={chart.id}
                      style={styles.item}
                      onPress={() => handleSelectSavedChart(chart)}
                    >
                      <View style={styles.avatar}>
                        <Ionicons name="star" size={24} color={colors.primary} />
                      </View>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{chart.name}</Text>
                        {chart.relationship && (
                          <Text style={styles.itemLabel}>{chart.relationship}</Text>
                        )}
                        <Text style={styles.itemDetail}>
                          {new Date(chart.birthData.birthDate).toLocaleDateString()}
                          {chart.birthData.birthLocation?.name &&
                            ` • ${chart.birthData.birthLocation.name}`}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
                    </TouchableOpacity>
                  ))
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.secondary,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginTop: spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    ...typography.caption,
    color: '#FFF',
    fontWeight: '600',
    fontSize: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...typography.h3,
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  itemLabel: {
    ...typography.caption,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  itemDetail: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyTitle: {
    ...typography.h2,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
