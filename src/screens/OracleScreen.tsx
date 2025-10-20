import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { NavigationProps } from '../types';
import { HeaderBar, TarotIcon, IChingIcon, DreamIcon, Badge } from '../components';
import { colors, spacing, typography } from '../styles';
import { useSubscriptionTier } from '../hooks/useFeatureAccess';

export const OracleScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const { isFree } = useSubscriptionTier();

  return (
    <View style={styles.container}>
      <HeaderBar title="ORACLE" />

      <View style={styles.content}>
        {/* Tarot Option */}
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => navigation.navigate('Tarot')}
        >
          <View style={styles.iconContainer}>
            <TarotIcon size={72} color="#F6D99F" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.optionTitle}>Tarot</Text>
            <Text style={styles.optionDescription}>
              Draw cards to gain insight into your questions and challenges
            </Text>
          </View>
        </TouchableOpacity>

        {/* I Ching Option */}
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => navigation.navigate('IChing')}
        >
          <View style={styles.iconContainer}>
            <IChingIcon size={72} color="#F6D99F" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.optionTitle}>I Ching</Text>
            <Text style={styles.optionDescription}>
              Cast coins to consult the ancient Book of Changes
            </Text>
          </View>
        </TouchableOpacity>

        {/* Dream Interpretation Option */}
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => navigation.navigate('DreamInterpretation')}
        >
          {isFree && <Badge variant="premium" />}
          <View style={styles.iconContainer}>
            <DreamIcon size={72} color="#F6D99F" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.optionTitle}>Dream Interpretation</Text>
            <Text style={styles.optionDescription}>
              Explore the symbolism and meaning within your dreams
            </Text>
          </View>
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
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  iconContainer: {
    marginRight: spacing.lg,
  },
  textContainer: {
    flex: 1,
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
