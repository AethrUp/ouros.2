import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { NavigationProps } from '../types';
import { HeaderBar } from '../components';
import { colors, spacing, typography } from '../styles';
import { Ionicons } from '@expo/vector-icons';

export const FriendsScreen: React.FC<NavigationProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <HeaderBar title="FRIENDS" />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={64} color={colors.text.secondary} />
          <Text style={styles.emptyTitle}>Synastry Coming Soon</Text>
          <Text style={styles.emptyDescription}>
            Compare your chart with friends and loved ones to explore relationship dynamics and compatibility.
          </Text>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
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
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  emptyDescription: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
});
