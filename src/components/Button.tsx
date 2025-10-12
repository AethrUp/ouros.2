import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ButtonProps } from '../types';
import { theme } from '../styles/theme';

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  testId = 'button',
}) => {
  const isDisabled = disabled || loading;

  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[`button_${size}`]];

    if (fullWidth) {
      baseStyle.push(styles.fullWidth);
    }

    if (isDisabled) {
      baseStyle.push(styles.disabled);
      return baseStyle;
    }

    switch (variant) {
      case 'primary':
        baseStyle.push(styles.primary);
        break;
      case 'secondary':
        baseStyle.push(styles.secondary);
        break;
      case 'outline':
        baseStyle.push(styles.outline);
        break;
      case 'text':
        baseStyle.push(styles.text);
        break;
      case 'danger':
        baseStyle.push(styles.danger);
        break;
    }

    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.buttonText, styles[`text_${size}`]];

    if (isDisabled) {
      baseStyle.push(styles.textDisabled);
      return baseStyle;
    }

    switch (variant) {
      case 'primary':
        baseStyle.push(styles.textDark);
        break;
      case 'secondary':
      case 'danger':
        baseStyle.push(styles.textInverse);
        break;
      case 'outline':
        baseStyle.push(styles.textOutline);
        break;
      case 'text':
        baseStyle.push(styles.textPrimary);
        break;
    }

    return baseStyle;
  };

  const iconColor = () => {
    if (isDisabled) return theme.colors.textLight;
    if (variant === 'primary' || variant === 'secondary' || variant === 'danger') {
      return theme.colors.textInverse;
    }
    if (variant === 'outline') return theme.colors.primary;
    return theme.colors.primary;
  };

  const iconSize = size === 'small' ? 16 : size === 'large' ? 24 : 20;

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      testID={testId}
    >
      {loading ? (
        <ActivityIndicator color={iconColor()} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && (
            <Ionicons name={icon as any} size={iconSize} color={iconColor()} style={styles.iconLeft} />
          )}
          <Text style={getTextStyle()}>{title.toUpperCase()}</Text>
          {icon && iconPosition === 'right' && (
            <Ionicons name={icon as any} size={iconSize} color={iconColor()} style={styles.iconRight} />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  button_small: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    minHeight: 32,
  },
  button_medium: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    minHeight: 44,
  },
  button_large: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    minHeight: 56,
  },
  fullWidth: {
    width: '100%',
  },
  primary: {
    backgroundColor: theme.colors.textInverse,
  },
  secondary: {
    backgroundColor: theme.colors.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  text: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: theme.colors.error,
  },
  disabled: {
    backgroundColor: theme.colors.surface,
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: theme.fontWeight.medium,
    textAlign: 'center',
    letterSpacing: 1.2,
    fontFamily: 'Inter',
  },
  text_small: {
    fontSize: theme.fontSize.xs,
  },
  text_medium: {
    fontSize: theme.fontSize.sm,
  },
  text_large: {
    fontSize: theme.fontSize.lg,
  },
  textDark: {
    color: theme.colors.backgroundDark,
  },
  textInverse: {
    color: theme.colors.textInverse,
  },
  textOutline: {
    color: theme.colors.primary,
  },
  textPrimary: {
    color: theme.colors.primary,
  },
  textDisabled: {
    color: theme.colors.textLight,
  },
  iconLeft: {
    marginRight: theme.spacing.sm,
  },
  iconRight: {
    marginLeft: theme.spacing.sm,
  },
});
