import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { HeaderBarProps } from '../types';
import { theme } from '../styles/theme';

export const HeaderBar: React.FC<HeaderBarProps> = ({
  title,
  leftAction,
  rightActions = [],
  showSync = false,
  syncStatus = 'idle',
  onSyncPress,
  backgroundColor = theme.colors.background.primary,
  testId = 'header-bar',
}) => {
  const insets = useSafeAreaInsets();

  const getSyncIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return 'sync';
      case 'error':
        return 'alert-circle';
      default:
        return 'cloud-done';
    }
  };

  const getSyncColor = () => {
    switch (syncStatus) {
      case 'syncing':
        return theme.colors.info;
      case 'error':
        return theme.colors.error;
      default:
        return theme.colors.success;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor, paddingTop: insets.top }]} testID={testId}>
      <View style={styles.content}>
        {/* Left Action */}
        <View style={styles.leftSection}>
          {leftAction && (
            <TouchableOpacity
              onPress={leftAction.onPress}
              disabled={leftAction.disabled}
              style={styles.actionButton}
              testID={`${testId}-left-action`}
            >
              <Ionicons
                name={leftAction.icon as any}
                size={24}
                color={leftAction.disabled ? theme.colors.textLight : theme.colors.text.primary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Title */}
        <View style={styles.centerSection}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>

        {/* Right Actions */}
        <View style={styles.rightSection}>
          {showSync && onSyncPress && (
            <TouchableOpacity
              onPress={onSyncPress}
              style={[styles.actionButton, styles.syncButton]}
              testID={`${testId}-sync`}
            >
              <Ionicons
                name={getSyncIcon() as any}
                size={20}
                color={getSyncColor()}
              />
            </TouchableOpacity>
          )}
          {rightActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              onPress={action.onPress}
              disabled={action.disabled}
              style={styles.actionButton}
              testID={`${testId}-right-action-${index}`}
            >
              <Ionicons
                name={action.icon as any}
                size={24}
                color={action.disabled ? theme.colors.textLight : theme.colors.text.primary}
              />
              {action.badge !== undefined && action.badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {action.badge > 99 ? '99+' : action.badge}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...theme.shadows.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: theme.spacing.md,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  centerSection: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  actionButton: {
    padding: theme.spacing.sm,
    position: 'relative',
  },
  syncButton: {
    marginRight: theme.spacing.xs,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: theme.colors.error,
    borderRadius: theme.borderRadius.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: theme.colors.textInverse,
    fontSize: 10,
    fontWeight: theme.fontWeight.bold,
  },
});
