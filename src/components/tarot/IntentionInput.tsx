import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { theme } from '../../styles/theme';

interface IntentionInputProps {
  value: string;
  onChange: (text: string) => void;
  onNext: () => void;
  spreadName?: string;
}

export const IntentionInput: React.FC<IntentionInputProps> = ({
  value,
  onChange,
  onNext,
  spreadName,
}) => {
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.innerContainer}>
          <Text style={styles.title}>Tarot</Text>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.instructionTitle}>Some instructions</Text>
            <Text style={styles.instructionText}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. In ut cursus risus, scelerisque faucibus ipsum.
              Phasellus sodales bibendum nisi, in dictum ante tincidunt id. Aliquam erat volutpat. Duis ac diam nec v
            </Text>

            <TextInput
              style={styles.input}
              placeholder="SET YOUR INTENTION"
              placeholderTextColor={theme.colors.text.secondary}
              value={value}
              onChangeText={onChange}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              returnKeyType="done"
              blurOnSubmit={true}
            />
          </ScrollView>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={onNext}
            activeOpacity={0.7}
          >
            <Text style={styles.nextButtonText}>NEXT</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  innerContainer: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '400',
    color: theme.colors.text.primary,
    fontFamily: 'Libre Baskerville',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  instructionTitle: {
    fontSize: 20,
    fontWeight: '400',
    color: '#D4AF37', // Gold color
    fontFamily: 'Libre Baskerville',
    marginBottom: theme.spacing.sm,
  },
  instructionText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontFamily: 'Inter',
    lineHeight: 20,
    marginBottom: theme.spacing.xl,
  },
  input: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    color: theme.colors.text.primary,
    fontSize: 14,
    fontFamily: 'Inter',
    minHeight: 150,
    borderWidth: 1,
    borderColor: theme.colors.background.card,
  },
  nextButton: {
    backgroundColor: theme.colors.textInverse || '#FFFFFF',
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.background.primary,
    letterSpacing: 1.2,
    fontFamily: 'Inter',
  },
});
