import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => !tab.disabled && onTabChange(tab.id)}
            disabled={tab.disabled}
            activeOpacity={0.7}
            testID={`${testId}-tab-${tab.id}`}
          >
            <Text
              style={[
                styles.label,
                tab.disabled && styles.labelDisabled,
                isActive && styles.labelActive,
              ]}
              numberOfLines={1}
            >
              {tab.label.toUpperCase()}
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
    paddingTop: 8,
    ...theme.shadows.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    position: 'relative',
  },
  label: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1.2,
  },
  labelActive: {
    color: '#FFFFFF',
    fontWeight: theme.fontWeight.semibold,
  },
  labelDisabled: {
    color: theme.colors.textLight,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: 2,
    backgroundColor: '#FFFFFF',
  },
});
