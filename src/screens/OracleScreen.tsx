import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProps } from '../types';
import { HeaderBar, TarotIcon, IChingIcon, DreamIcon, Badge, InfoModal } from '../components';
import { colors, spacing, typography } from '../styles';
import { useSubscriptionTier } from '../hooks/useFeatureAccess';
import { theme } from '../styles/theme';
import { ORACLE_METHOD_INFO, QUANTUM_RNG_INFO } from '../data/oracle/oracleInfo';

export const OracleScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const { isFree } = useSubscriptionTier();
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState<typeof ORACLE_METHOD_INFO[keyof typeof ORACLE_METHOD_INFO] | null>(null);

  const handleInfoPress = (methodKey: string, event: any) => {
    event.stopPropagation();
    const method = ORACLE_METHOD_INFO[methodKey];
    setSelectedInfo(method);
    setInfoModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <HeaderBar title="ORACLE" />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Tarot Option */}
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => navigation.navigate('Tarot')}
        >
          <TouchableOpacity
            onPress={(e) => handleInfoPress('tarot', e)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.infoButtonCorner}
          >
            <Ionicons
              name="information-circle-outline"
              size={20}
              color="rgba(255, 255, 255, 0.5)"
            />
          </TouchableOpacity>
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
          <TouchableOpacity
            onPress={(e) => handleInfoPress('iching', e)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.infoButtonCorner}
          >
            <Ionicons
              name="information-circle-outline"
              size={20}
              color="rgba(255, 255, 255, 0.5)"
            />
          </TouchableOpacity>
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
          <TouchableOpacity
            onPress={(e) => handleInfoPress('dream', e)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.infoButtonCorner}
          >
            <Ionicons
              name="information-circle-outline"
              size={20}
              color="rgba(255, 255, 255, 0.5)"
            />
          </TouchableOpacity>
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

        {/* Quantum RNG Info */}
        <TouchableOpacity
          style={styles.quantumInfo}
          onPress={() => {
            setSelectedInfo({
              title: QUANTUM_RNG_INFO.title,
              sections: [{ title: '', content: QUANTUM_RNG_INFO.content }],
            });
            setInfoModalVisible(true);
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name="information-circle-outline"
            size={20}
            color="rgba(255, 255, 255, 0.5)"
          />
          <Text style={styles.quantumText}>Quantum Random Number Generator</Text>
        </TouchableOpacity>
      </ScrollView>

      {selectedInfo && (
        <InfoModal
          visible={infoModalVisible}
          title={selectedInfo.title}
          sections={selectedInfo.sections}
          onClose={() => setInfoModalVisible(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
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
  infoButtonCorner: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    padding: spacing.xs,
    zIndex: 10,
  },
  quantumInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  quantumText: {
    fontSize: 14,
    color: colors.text.primary,
    fontFamily: 'Inter',
  },
});
