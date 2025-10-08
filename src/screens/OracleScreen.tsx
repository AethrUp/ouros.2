import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { NavigationProps } from '../types';
import { HeaderBar } from '../components';
import { colors, spacing, typography } from '../styles';

export const OracleScreen: React.FC<NavigationProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <HeaderBar title="ORACLE" />

      <View style={styles.content}>
        {/* Tarot Option */}
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => navigation.navigate('Tarot')}
        >
          <Text style={styles.optionTitle}>Tarot</Text>
          <Text style={styles.optionDescription}>
            Draw cards to gain insight into your questions and challenges
          </Text>
        </TouchableOpacity>

        {/* I Ching Option */}
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => navigation.navigate('IChing')}
        >
          <Text style={styles.optionTitle}>I Ching</Text>
          <Text style={styles.optionDescription}>
            Cast coins to consult the ancient Book of Changes
          </Text>
        </TouchableOpacity>

        {/* Dream Interpretation Option */}
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => {}}
        >
          <Text style={styles.optionTitle}>Dream Interpretation</Text>
          <Text style={styles.optionDescription}>
            Explore the symbolism and meaning within your dreams
          </Text>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    alignItems: 'center',
  },
  optionCard: {
    width: '100%',
    padding: spacing.xl,
    backgroundColor: colors.background.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  optionTitle: {
    ...typography.h2,
    marginBottom: spacing.sm,
    textTransform: 'none',
  },
  optionDescription: {
    ...typography.body,
    color: colors.text.primary,
    lineHeight: 22,
  },
});
