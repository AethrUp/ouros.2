import React from 'react';
import { View, TextInput as RNTextInput, Text, StyleSheet, TextInputProps as RNTextInputProps } from 'react-native';
import { theme } from '../styles/theme';

interface TextInputProps extends RNTextInputProps {
  error?: string;
  testId?: string;
}

export const TextInput: React.FC<TextInputProps> = ({
  error,
  testId = 'text-input',
  style,
  ...props
}) => {
  return (
    <View style={styles.container}>
      <RNTextInput
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor={theme.colors.textPlaceholder}
        testID={testId}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  input: {
    backgroundColor: theme.colors.surfaceDark,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.textInverse,
    fontFamily: 'Inter',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.fontSize.sm,
    marginTop: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
    fontFamily: 'Inter',
  },
});
