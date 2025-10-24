import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProps } from '../types';
import { HeaderBar, Button, PrivacyPolicyModal, TermsOfServiceModal } from '../components';
import { DebugSubscriptionPanel } from '../components/DebugSubscriptionPanel';
import { colors, spacing, typography } from '../styles';
import { useAppStore } from '../store';

export const ProfileScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfService, setShowTermsOfService] = useState(false);
  const tapCount = useRef(0);
  const tapTimer = useRef<NodeJS.Timeout | null>(null);

  const logout = useAppStore((state) => state.logout);

  // Triple-tap to open debug panel (dev only)
  const handleTitlePress = () => {
    if (!__DEV__) return;

    tapCount.current += 1;

    if (tapTimer.current) {
      clearTimeout(tapTimer.current);
    }

    tapTimer.current = setTimeout(() => {
      if (tapCount.current >= 3) {
        setShowDebugPanel(true);
      }
      tapCount.current = 0;
    }, 500);
  };

  const handleNotifications = async () => {
    // Open system notification settings
    await Linking.openSettings();
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <HeaderBar
        title="Settings"
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            handleTitlePress();
            navigation.navigate('ProfileEdit');
          }}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="person-outline" size={24} color={colors.text.primary} />
            <Text style={styles.menuItemText}>Profile</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.text.secondary} />
        </TouchableOpacity>

        {/* Security and Data Section */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('SecurityData')}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="shield-checkmark-outline" size={24} color={colors.text.primary} />
            <Text style={styles.menuItemText}>Security and Data</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.text.secondary} />
        </TouchableOpacity>

        {/* Notifications Section */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleNotifications}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="notifications-outline" size={24} color={colors.text.primary} />
            <Text style={styles.menuItemText}>Notifications</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.text.secondary} />
        </TouchableOpacity>

        {/* Privacy Policy Section */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setShowPrivacyPolicy(true)}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="document-text-outline" size={24} color={colors.text.primary} />
            <Text style={styles.menuItemText}>Privacy Policy</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.text.secondary} />
        </TouchableOpacity>

        {/* Terms of Service Section */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setShowTermsOfService(true)}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="document-text-outline" size={24} color={colors.text.primary} />
            <Text style={styles.menuItemText}>Terms of Service</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.text.secondary} />
        </TouchableOpacity>

        {/* Developer Menu (dev only) */}
        {__DEV__ && (
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('DevMenu')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="code-slash-outline" size={24} color={colors.text.primary} />
              <Text style={styles.menuItemText}>Developer Menu</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.text.secondary} />
          </TouchableOpacity>
        )}

        {/* Log Out Section */}
        <View style={styles.logoutSection}>
          <Button
            title="Log Out"
            onPress={handleLogout}
            fullWidth
            variant="primary"
          />
        </View>
      </ScrollView>

      {/* Modals */}
      <PrivacyPolicyModal
        visible={showPrivacyPolicy}
        onClose={() => setShowPrivacyPolicy(false)}
      />
      <TermsOfServiceModal
        visible={showTermsOfService}
        onClose={() => setShowTermsOfService(false)}
      />

      {/* Debug Panel (dev only) */}
      <DebugSubscriptionPanel
        visible={showDebugPanel}
        onClose={() => setShowDebugPanel(false)}
      />
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
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.card,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: 10,
    marginBottom: spacing.md,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  menuItemText: {
    ...typography.h4,
    color: colors.text.primary,
  },
  logoutSection: {
    marginTop: spacing.lg,
  },
});
