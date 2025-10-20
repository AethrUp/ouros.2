import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProps } from '../types';
import { HeaderBar, SwipeableChartCard, LoadingScreen } from '../components';
import { colors, spacing, typography } from '../styles';
import { useAppStore } from '../store';
import { SavedChartForm } from '../components/synastry/SavedChartForm';
import { SavedChart } from '../types/synastry';

export const SavedChartsScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const {
    savedCharts,
    isLoadingSavedCharts,
    loadSavedCharts,
    createSavedChart,
    deleteSavedChart,
  } = useAppStore();

  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadSavedCharts();
  }, []);

  const handleCreateChart = async (
    name: string,
    birthData: any,
    natalChart: any,
    options?: { relationship?: string; notes?: string }
  ) => {
    try {
      await createSavedChart(name, birthData, natalChart, options);
      setShowForm(false);
    } catch (error: any) {
      throw error; // Let the form handle the error display
    }
  };

  const confirmDeleteChart = (chartName: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      Alert.alert(
        'Delete Chart',
        `Are you sure you want to delete the chart for ${chartName}?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => reject()
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => resolve(),
          },
        ],
        { cancelable: true, onDismiss: () => reject() }
      );
    });
  };

  const handleDeleteChart = async (chartId: string): Promise<void> => {
    try {
      await deleteSavedChart(chartId);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to delete chart');
      throw error;
    }
  };

  const handleViewChart = (chart: SavedChart) => {
    // TODO: Navigate to a chart detail screen
    Alert.alert(
      chart.name,
      `Birth Date: ${new Date(chart.birthData.birthDate).toLocaleDateString()}\n` +
      `Location: ${chart.birthData.birthLocation.name}\n` +
      (chart.relationship ? `Relationship: ${chart.relationship}\n` : '') +
      (chart.notes ? `\nNotes: ${chart.notes}` : '')
    );
  };

  return (
    <View style={styles.container}>
      <HeaderBar
        title="SAVED CHARTS"
        rightActions={[
          {
            icon: 'add-circle-outline',
            label: 'Add Chart',
            onPress: () => setShowForm(true),
          },
        ]}
      />

      {isLoadingSavedCharts ? (
        <View style={styles.loadingContainer}>
          <LoadingScreen context="general" />
        </View>
      ) : savedCharts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="bookmark-outline" size={80} color={colors.text.secondary} />
          <Text style={styles.emptyTitle}>No Saved Charts</Text>
          <Text style={styles.emptyDescription}>
            Create charts for people who aren't app users to use in synastry readings
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => setShowForm(true)}>
            <Ionicons name="add-circle" size={20} color="#FFF" />
            <Text style={styles.primaryButtonText}>Create Your First Chart</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {savedCharts.map((chart) => (
            <SwipeableChartCard
              key={chart.id}
              onConfirmDelete={() => confirmDeleteChart(chart.name)}
              onDelete={() => handleDeleteChart(chart.id)}
            >
              <View style={styles.chartCard}>
                <TouchableOpacity
                  style={styles.chartHeader}
                  onPress={() => handleViewChart(chart)}
                >
                  <View style={styles.chartIcon}>
                    <Ionicons name="star" size={28} color={colors.primary} />
                  </View>
                  <View style={styles.chartInfo}>
                    <Text style={styles.chartName}>{chart.name}</Text>
                    {chart.relationship && (
                      <Text style={styles.chartLabel}>{chart.relationship}</Text>
                    )}
                    <View style={styles.chartDetails}>
                      <Ionicons name="calendar-outline" size={14} color={colors.text.secondary} />
                      <Text style={styles.chartDetailText}>
                        {new Date(chart.birthData.birthDate).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.chartDetails}>
                      <Ionicons name="location-outline" size={14} color={colors.text.secondary} />
                      <Text style={styles.chartDetailText}>
                        {chart.birthData.birthLocation.name}
                      </Text>
                    </View>
                    {!chart.birthData.timeUnknown && (
                      <View style={styles.chartDetails}>
                        <Ionicons name="time-outline" size={14} color={colors.text.secondary} />
                        <Text style={styles.chartDetailText}>
                          {chart.birthData.birthTime}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>

                <View style={styles.chartActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      // Navigate to synastry with this saved chart
                      navigation.navigate('Friends');
                      // TODO: Pass chart as parameter or use store
                    }}
                  >
                    <Ionicons name="people-outline" size={18} color={colors.primary} />
                    <Text style={styles.actionButtonText}>Use in Synastry</Text>
                  </TouchableOpacity>
                </View>

                {chart.notes && (
                  <View style={styles.notesContainer}>
                    <Text style={styles.notesLabel}>Notes:</Text>
                    <Text style={styles.notesText}>{chart.notes}</Text>
                  </View>
                )}
              </View>
            </SwipeableChartCard>
          ))}
        </ScrollView>
      )}

      <SavedChartForm
        visible={showForm}
        onClose={() => setShowForm(false)}
        onSave={handleCreateChart}
      />
    </View>
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
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    ...typography.h2,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  emptyDescription: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
    maxWidth: 300,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
    gap: spacing.sm,
  },
  primaryButtonText: {
    ...typography.button,
    color: '#FFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  chartCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.md,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  chartIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  chartInfo: {
    flex: 1,
  },
  chartName: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  chartLabel: {
    ...typography.caption,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  chartDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  chartDetailText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  chartActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: spacing.xs,
  },
  actionButtonDanger: {
    flex: 0,
    borderColor: colors.error,
  },
  actionButtonText: {
    ...typography.button,
    color: colors.primary,
    fontSize: 14,
  },
  notesContainer: {
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.background.tertiary,
    borderRadius: 8,
  },
  notesLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  notesText: {
    ...typography.body,
    color: colors.text.primary,
    fontSize: 14,
  },
});
