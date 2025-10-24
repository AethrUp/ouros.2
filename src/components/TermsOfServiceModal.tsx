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

interface TermsOfServiceModalProps {
  visible: boolean;
  onClose: () => void;
}

export const TermsOfServiceModal: React.FC<TermsOfServiceModalProps> = ({
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
          <Text style={styles.title}>Terms of Service</Text>
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

          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.paragraph}>
            By accessing and using Ouros, you accept and agree to be bound by the
            terms and provision of this agreement. If you do not agree to these
            terms, please do not use this service.
          </Text>

          <Text style={styles.sectionTitle}>2. Description of Service</Text>
          <Text style={styles.paragraph}>
            Ouros provides personalized astrological readings, natal chart
            calculations, tarot readings, I Ching consultations, and related
            spiritual guidance tools. These services are for entertainment and
            personal growth purposes only.
          </Text>

          <Text style={styles.sectionTitle}>3. Disclaimer</Text>
          <Text style={styles.paragraph}>
            The astrological readings, interpretations, and guidance provided by
            Ouros are not a substitute for professional advice (medical, legal,
            financial, or otherwise). You should not rely solely on this information
            for making important life decisions.
          </Text>

          <Text style={styles.sectionTitle}>4. User Account</Text>
          <Text style={styles.paragraph}>
            You are responsible for maintaining the confidentiality of your account
            and password. You agree to accept responsibility for all activities that
            occur under your account.
          </Text>

          <Text style={styles.sectionTitle}>5. Acceptable Use</Text>
          <Text style={styles.paragraph}>
            You agree not to use the service to:
          </Text>
          <Text style={styles.paragraph}>
            • Violate any laws or regulations
          </Text>
          <Text style={styles.paragraph}>
            • Harass, abuse, or harm other users
          </Text>
          <Text style={styles.paragraph}>
            • Transmit malicious code or viruses
          </Text>
          <Text style={styles.paragraph}>
            • Attempt to gain unauthorized access to the service
          </Text>

          <Text style={styles.sectionTitle}>6. Intellectual Property</Text>
          <Text style={styles.paragraph}>
            All content, features, and functionality of Ouros are owned by us and
            are protected by international copyright, trademark, and other
            intellectual property laws.
          </Text>

          <Text style={styles.sectionTitle}>7. Subscription and Payments</Text>
          <Text style={styles.paragraph}>
            Some features require a paid subscription. Subscription fees are
            non-refundable except as required by law. You may cancel your
            subscription at any time.
          </Text>

          <Text style={styles.sectionTitle}>8. Termination</Text>
          <Text style={styles.paragraph}>
            We reserve the right to terminate or suspend your account at any time,
            without prior notice, for conduct that we believe violates these Terms
            of Service or is harmful to other users or our business interests.
          </Text>

          <Text style={styles.sectionTitle}>9. Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            Ouros and its creators shall not be liable for any indirect,
            incidental, special, consequential, or punitive damages resulting from
            your use or inability to use the service.
          </Text>

          <Text style={styles.sectionTitle}>10. Changes to Terms</Text>
          <Text style={styles.paragraph}>
            We reserve the right to modify these terms at any time. We will notify
            users of any material changes via email or through the app.
          </Text>

          <Text style={styles.sectionTitle}>11. Contact Information</Text>
          <Text style={styles.paragraph}>
            If you have questions about these Terms of Service, please contact us
            at support@ouros.app
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
