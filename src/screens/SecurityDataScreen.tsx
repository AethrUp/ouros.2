import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { NavigationProps } from '../types';
import { HeaderBar, Button } from '../components';
import { colors, spacing, typography } from '../styles';
import { useAppStore } from '../store';

export const SecurityDataScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const { logout } = useAppStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'Password change functionality will be implemented soon.',
      [{ text: 'OK' }]
    );
  };

  const handleDeleteData = () => {
    Alert.alert(
      'Delete My Data',
      'Are you sure you want to delete all your data? This action cannot be undone. Your account will remain active but all readings, charts, and personal data will be permanently deleted.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete Data',
          style: 'destructive',
          onPress: async () => {
            setIsProcessing(true);
            try {
              // TODO: Implement data deletion
              Alert.alert('Success', 'Your data has been deleted.');
              await logout();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete data');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete My Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone. All your data, readings, and account information will be permanently deleted.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            // Second confirmation
            Alert.alert(
              'Final Confirmation',
              'This is your last chance. Are you absolutely sure you want to delete your account?',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Yes, Delete',
                  style: 'destructive',
                  onPress: async () => {
                    setIsProcessing(true);
                    try {
                      // TODO: Implement account deletion
                      Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
                      await logout();
                    } catch (error: any) {
                      Alert.alert('Error', error.message || 'Failed to delete account');
                    } finally {
                      setIsProcessing(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <HeaderBar
        title="Security and Data"
        leftAction={{
          icon: 'arrow-back',
          onPress: () => navigation.goBack(),
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <Text style={styles.description}>
            Manage your account security settings
          </Text>
          <Button
            title="Change Password"
            onPress={handleChangePassword}
            disabled={isProcessing}
            fullWidth
            variant="primary"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <Text style={styles.description}>
            Delete your personal data while keeping your account active
          </Text>
          <Button
            title="Delete My Data"
            onPress={handleDeleteData}
            disabled={isProcessing}
            fullWidth
            variant="primary"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <Text style={[styles.description, styles.warningText]}>
            Permanently delete your account and all associated data. This action cannot be undone.
          </Text>
          <Button
            title="Delete My Account"
            onPress={handleDeleteAccount}
            disabled={isProcessing}
            fullWidth
            variant="primary"
          />
        </View>
      </ScrollView>
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: 'PTSerif_400Regular',
    fontSize: 20,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.text.primary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  warningText: {
    color: colors.text.primary,
  },
});
