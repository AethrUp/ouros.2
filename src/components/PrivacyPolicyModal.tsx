import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../styles';

interface PrivacyPolicyModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  visible,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Privacy Policy</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.lastUpdated}>Last Updated: January 2025</Text>

          <Text style={styles.sectionTitle}>1. Information We Collect</Text>
          <Text style={styles.paragraph}>
            We collect information you provide directly to us, including:
          </Text>
          <Text style={styles.paragraph}>
            • Account information (email, display name)
          </Text>
          <Text style={styles.paragraph}>
            • Birth data (date, time, location) for astrological calculations
          </Text>
          <Text style={styles.paragraph}>
            • Reading history and journal entries
          </Text>
          <Text style={styles.paragraph}>
            • Device and usage information
          </Text>

          <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
          <Text style={styles.paragraph}>
            We use the information we collect to:
          </Text>
          <Text style={styles.paragraph}>
            • Provide personalized astrological readings and interpretations
          </Text>
          <Text style={styles.paragraph}>
            • Calculate and generate your natal chart and transit information
          </Text>
          <Text style={styles.paragraph}>
            • Improve and personalize your experience
          </Text>
          <Text style={styles.paragraph}>
            • Send you notifications and updates (if enabled)
          </Text>

          <Text style={styles.sectionTitle}>3. Data Security</Text>
          <Text style={styles.paragraph}>
            We take reasonable measures to protect your personal information from
            unauthorized access, use, or disclosure. Your data is encrypted both in
            transit and at rest.
          </Text>

          <Text style={styles.sectionTitle}>4. Data Sharing</Text>
          <Text style={styles.paragraph}>
            We do not sell, trade, or rent your personal information to third parties.
            We may share your information only in the following circumstances:
          </Text>
          <Text style={styles.paragraph}>
            • With your explicit consent
          </Text>
          <Text style={styles.paragraph}>
            • To comply with legal obligations
          </Text>
          <Text style={styles.paragraph}>
            • To protect our rights and prevent fraud
          </Text>

          <Text style={styles.sectionTitle}>5. Your Rights</Text>
          <Text style={styles.paragraph}>
            You have the right to:
          </Text>
          <Text style={styles.paragraph}>
            • Access your personal data
          </Text>
          <Text style={styles.paragraph}>
            • Correct inaccurate data
          </Text>
          <Text style={styles.paragraph}>
            • Delete your data and account
          </Text>
          <Text style={styles.paragraph}>
            • Export your data
          </Text>

          <Text style={styles.sectionTitle}>6. Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have questions about this Privacy Policy, please contact us at
            privacy@ouros.app
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h2,
    fontSize: 24,
  },
  closeButton: {
    padding: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  lastUpdated: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
    fontStyle: 'italic',
  },
  sectionTitle: {
    ...typography.h3,
    fontSize: 16,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    textTransform: 'none',
    letterSpacing: 0,
  },
  paragraph: {
    ...typography.body,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    lineHeight: 22,
  },
});
