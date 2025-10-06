import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TabNavigationProps } from '../types';
import { theme } from '../styles/theme';

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  tabs,
  showBadges = false,
  badgeCounts = {},
  testId = 'tab-navigation',
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]} testID={testId}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const badgeCount = badgeCounts[tab.id] || 0;
        const showBadge = showBadges && badgeCount > 0;

        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => !tab.disabled && onTabChange(tab.id)}
            disabled={tab.disabled}
            activeOpacity={0.7}
            testID={`${testId}-tab-${tab.id}`}
          >
            <View style={styles.iconContainer}>
              <Ionicons
                name={tab.icon as any}
                size={24}
                color={
                  tab.disabled
                    ? theme.colors.textLight
                    : isActive
                    ? theme.colors.primary
                    : theme.colors.textSecondary
                }
              />
              {showBadge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.label,
                tab.disabled && styles.labelDisabled,
                isActive && styles.labelActive,
              ]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
            {isActive && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 8,
    ...theme.shadows.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    position: 'relative',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  label: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  labelActive: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  labelDisabled: {
    color: theme.colors.textLight,
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    left: '25%',
    right: '25%',
    height: 3,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: theme.colors.error,
    borderRadius: theme.borderRadius.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: theme.colors.background.primary,
  },
  badgeText: {
    color: theme.colors.textInverse,
    fontSize: 10,
    fontWeight: theme.fontWeight.bold,
  },
});
