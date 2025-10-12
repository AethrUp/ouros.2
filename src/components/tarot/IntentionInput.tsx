import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { HeaderBar } from '../HeaderBar';
import { Button } from '../Button';
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
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const [showFullText, setShowFullText] = useState(false);

  const handleInputFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  return (
    <View style={styles.container}>
      <HeaderBar title="TAROT" />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.innerContainer}>
            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
            <Text style={styles.instructionTitle}>Set Your Intention</Text>
            <Text style={styles.instructionText}>
              Take a moment to center yourself with a few deep breaths before writing your intention. Frame your question as a request for guidance rather than a demand for predictions.{showFullText && " Instead of asking \"Will this happen?\" try \"What do I need to know about this situation?\" or \"How can I approach this challenge?\" Focus on what you can learn or how you can grow, rather than trying to control outcomes. Be specific about the area of your life you're seeking guidance on, whether it's relationships, career, personal growth, or a particular decision you're facing. Your intention should feel authentic to you and address what you genuinely want to understand."}
            </Text>
            <TouchableOpacity onPress={() => setShowFullText(!showFullText)}>
              <Text style={styles.moreButton}>{showFullText ? 'LESS' : 'MORE'}</Text>
            </TouchableOpacity>

            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Provide guidance on..."
              placeholderTextColor={theme.colors.text.secondary}
              value={value}
              onChangeText={onChange}
              onFocus={handleInputFocus}
              multiline
              numberOfLines={6}
              maxLength={500}
              textAlignVertical="top"
              returnKeyType="done"
              blurOnSubmit={true}
            />

            <Text style={styles.characterCount}>{value.length}/500</Text>
            </ScrollView>

            <View style={styles.buttonContainer}>
              <Button
                title="Next"
                onPress={onNext}
                variant="primary"
                size="medium"
                fullWidth
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  instructionTitle: {
    fontSize: 20,
    fontWeight: '400',
    color: '#F6D99F',
    fontFamily: 'PTSerif_400Regular',
    marginBottom: theme.spacing.sm,
  },
  instructionText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontFamily: 'Inter',
    lineHeight: 20,
    marginBottom: theme.spacing.xs,
  },
  moreButton: {
    fontSize: 14,
    color: '#F6D99F',
    fontFamily: 'Inter',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  input: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    color: theme.colors.text.primary,
    fontSize: 14,
    fontFamily: 'Inter',
    minHeight: 120,
    borderWidth: 0,
    marginBottom: theme.spacing.xs,
  },
  characterCount: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    fontFamily: 'Inter',
    textAlign: 'right',
    marginTop: theme.spacing.xs,
  },
  buttonContainer: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
});
