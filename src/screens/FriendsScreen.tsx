import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Clipboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NavigationProps } from '../types';
import { HeaderBar, Button, SwipeableChartCard } from '../components';
import { colors, spacing, typography } from '../styles';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store';
import { SavedChartForm } from '../components';

export const FriendsScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const {
    connections,
    sentInvitations,
    receivedInvitations,
    isLoadingConnections,
    isLoadingInvitations,
    showInviteModal,
    inviteFriendCode,
    inviteMessage,
    myFriendCode,
    savedCharts,
    setShowInviteModal,
    setInviteFriendCode,
    setInviteMessage,
    loadConnections,
    loadInvitations,
    loadMyFriendCode,
    loadSavedCharts,
    createSavedChart,
    deleteSavedChart,
    sendInvitation,
    acceptInvitation,
    declineInvitation,
    removeConnection,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'connections' | 'invitations'>('connections');
  const [showChartForm, setShowChartForm] = useState(false);
  const [codeDigits, setCodeDigits] = useState(['', '', '', '', '', '']);

  // Refs for code input fields
  const codeInputRefs = useRef<Array<TextInput | null>>([
    null, null, null, null, null, null
  ]);

  useEffect(() => {
    loadConnections();
    loadInvitations();
    loadMyFriendCode();
    loadSavedCharts();
  }, []);

  const handleCopyFriendCode = async () => {
    if (myFriendCode) {
      await Clipboard.setStringAsync(myFriendCode);
      Alert.alert('Copied!', 'Your friend code has been copied to clipboard.');
    }
  };

  const handleCodeChange = (text: string, index: number) => {
    // Only allow alphanumeric characters
    const sanitized = text.toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (sanitized.length > 1) {
      // Handle paste - distribute characters across fields
      const chars = sanitized.split('').slice(0, 6);
      const newDigits = [...codeDigits];
      chars.forEach((char, i) => {
        if (index + i < 6) {
          newDigits[index + i] = char;
        }
      });
      setCodeDigits(newDigits);

      // Focus the next empty field or the last field
      const nextIndex = Math.min(index + chars.length, 5);
      codeInputRefs.current[nextIndex]?.focus();
    } else {
      // Single character input
      const newDigits = [...codeDigits];
      newDigits[index] = sanitized;
      setCodeDigits(newDigits);

      // Auto-focus next field if character was entered
      if (sanitized && index < 5) {
        codeInputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleCodeKeyPress = (e: any, index: number) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && !codeDigits[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleSendInvitation = async () => {
    const code = codeDigits.join('');

    if (!code || code.length < 6) {
      Alert.alert('Error', 'Please enter a complete 6-character friend code');
      return;
    }

    try {
      await sendInvitation(code);
      Alert.alert('Success', 'Invitation sent!');
      // Clear the code fields
      setCodeDigits(['', '', '', '', '', '']);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send invitation');
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      await acceptInvitation(invitationId);
      Alert.alert('Success', 'Invitation accepted!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to accept invitation');
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    Alert.alert(
      'Decline Invitation',
      'Are you sure you want to decline this invitation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              await declineInvitation(invitationId);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to decline invitation');
            }
          },
        },
      ]
    );
  };

  const confirmRemoveConnection = (friendName: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      Alert.alert(
        'Remove Connection',
        `Remove ${friendName} from your connections?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => reject()
          },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => resolve(),
          },
        ],
        { cancelable: true, onDismiss: () => reject() }
      );
    });
  };

  const handleRemoveConnection = async (connectionId: string): Promise<void> => {
    try {
      await removeConnection(connectionId);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to remove connection');
      throw error;
    }
  };

  const confirmDeleteSavedChart = (name: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      Alert.alert(
        'Delete Chart',
        `Remove ${name} from your saved charts?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => reject()
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => resolve(),
          },
        ],
        { cancelable: true, onDismiss: () => reject() }
      );
    });
  };

  const handleDeleteSavedChart = async (chartId: string): Promise<void> => {
    try {
      await deleteSavedChart(chartId);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to delete chart');
      throw error;
    }
  };

  const handleViewSynastry = (connection: any) => {
    navigation.navigate('Synastry', { connection });
  };

  const handleCreateSavedChart = async (
    name: string,
    birthData: any,
    natalChart: any,
    options?: { relationship?: string; notes?: string }
  ) => {
    try {
      await createSavedChart(name, birthData, natalChart, options);
      setShowChartForm(false);
      Alert.alert('Success', `Chart for ${name} created successfully!`);
    } catch (error: any) {
      throw error; // Let the form handle the error
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBar
        title="FRIENDS"
        rightActions={[
          {
            icon: 'add-circle-outline',
            label: 'New Chart',
            onPress: () => setShowChartForm(true),
          },
          {
            icon: 'person-add-outline',
            label: 'Invite',
            onPress: () => setShowInviteModal(true),
          },
        ]}
      />

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab('connections')}
        >
          <Text style={[styles.tabText, activeTab === 'connections' && styles.tabTextActive]}>
            Connections
          </Text>
          {activeTab === 'connections' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab('invitations')}
        >
          <Text style={[styles.tabText, activeTab === 'invitations' && styles.tabTextActive]}>
            Invitations
          </Text>
          {receivedInvitations.length > 0 && (
            <View style={[styles.badge, styles.badgeAlert]}>
              <Text style={styles.badgeText}>{receivedInvitations.length}</Text>
            </View>
          )}
          {activeTab === 'invitations' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {activeTab === 'connections' && (
          <>
            {isLoadingConnections ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : connections.length === 0 && savedCharts.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={64} color={colors.text.secondary} />
                <Text style={styles.emptyTitle}>No Connections Yet</Text>
                <Text style={styles.emptyDescription}>
                  Add friends or create saved charts for people without the app
                </Text>
                <View style={styles.emptyButtonContainer}>
                  <View style={{ flex: 1 }}>
                    <Button
                      title="Add Friend"
                      onPress={() => setShowInviteModal(true)}
                      variant="primary"
                      size="medium"
                      fullWidth
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      title="Add Chart"
                      onPress={() => setShowChartForm(true)}
                      variant="primary"
                      size="medium"
                      fullWidth
                    />
                  </View>
                </View>
              </View>
            ) : (
              <>
                {/* Saved Charts Section */}
                {savedCharts.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>Saved Charts</Text>
                    {savedCharts.map((chart) => (
                      <SwipeableChartCard
                        key={chart.id}
                        onConfirmDelete={() => confirmDeleteSavedChart(chart.name)}
                        onDelete={() => handleDeleteSavedChart(chart.id)}
                      >
                        <TouchableOpacity
                          style={styles.connectionCard}
                          onPress={() => {
                            // Create a mock FriendConnection from saved chart
                            const mockConnection: any = {
                              connectionId: chart.id,
                              friendId: chart.id,
                              friendEmail: '',
                              friendDisplayName: chart.name,
                              friendCode: '',
                              userSharesChart: true,
                              friendSharesChart: true,
                              relationshipLabel: chart.relationship,
                              createdAt: chart.createdAt,
                            };
                            navigation.navigate('Synastry', {
                              connection: mockConnection,
                              savedChart: chart
                            });
                          }}
                        >
                          <View style={styles.connectionInfo}>
                            <Text style={styles.connectionName}>{chart.name}</Text>
                            <Text style={styles.connectionCode}>
                              {new Date(chart.birthData.birthDate).toLocaleDateString()}
                              {chart.birthData.timeUnknown ? '' : ` • ${chart.birthData.birthTime}`}
                            </Text>
                            {chart.relationship && (
                              <Text style={styles.connectionLabel}>{chart.relationship.toUpperCase()}</Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      </SwipeableChartCard>
                    ))}
                  </>
                )}

                {/* Connections Section */}
                {connections.length > 0 && (
                  <>
                    <Text style={[styles.sectionTitle, savedCharts.length > 0 && { marginTop: spacing.xl }]}>
                      Connections
                    </Text>
                  </>
                )}

                {connections.map((connection) => (
                  <SwipeableChartCard
                    key={connection.connectionId}
                    onConfirmDelete={() => confirmRemoveConnection(connection.friendDisplayName)}
                    onDelete={() => handleRemoveConnection(connection.connectionId)}
                  >
                    <TouchableOpacity
                      style={styles.connectionCard}
                      onPress={() => handleViewSynastry(connection)}
                    >
                      <View style={styles.connectionInfo}>
                        <Text style={styles.connectionName}>{connection.friendDisplayName}</Text>
                        {connection.friendProfile?.birthData && (
                          <Text style={styles.connectionCode}>
                            {new Date(connection.friendProfile.birthData.birthDate).toLocaleDateString()}
                            {connection.friendProfile.birthData.timeUnknown ? '' : ` • ${connection.friendProfile.birthData.birthTime}`}
                          </Text>
                        )}
                        {connection.relationshipLabel && (
                          <Text style={styles.connectionLabel}>{connection.relationshipLabel.toUpperCase()}</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  </SwipeableChartCard>
                ))}
              </>
            )}
          </>
        )}

        {activeTab === 'invitations' && (
          <>
            {receivedInvitations.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Received Invitations</Text>
                {receivedInvitations.map((invitation) => (
                  <View key={invitation.id} style={styles.invitationCardWrapper}>
                    <View style={styles.connectionCard}>
                      <View style={styles.connectionInfo}>
                        <Text style={styles.connectionName}>
                          {invitation.senderProfile?.displayName || 'Unknown User'}
                        </Text>
                        {invitation.message && (
                          <Text style={styles.connectionCode}>"{invitation.message}"</Text>
                        )}
                        <Text style={styles.connectionLabel}>PENDING INVITATION</Text>
                      </View>

                      <View style={styles.invitationActions}>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.acceptButton]}
                          onPress={() => handleAcceptInvitation(invitation.id)}
                        >
                          <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
                          <Text style={styles.acceptButtonText}>Accept</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.actionButton, styles.declineButton]}
                          onPress={() => handleDeclineInvitation(invitation.id)}
                        >
                          <Ionicons name="close-circle-outline" size={20} color={colors.error} />
                          <Text style={styles.declineButtonText}>Decline</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </>
            )}

            {sentInvitations.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>
                  Sent Invitations
                </Text>
                {sentInvitations.map((invitation) => (
                  <View key={invitation.id} style={styles.invitationCardWrapper}>
                    <View style={styles.connectionCard}>
                      <View style={styles.connectionInfo}>
                        <Text style={styles.connectionName}>
                          {invitation.recipientProfile?.displayName || 'Unknown User'}
                        </Text>
                        <Text style={styles.connectionCode}>
                          {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                        </Text>
                        <Text style={styles.connectionLabel}>SENT INVITATION</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </>
            )}

            {receivedInvitations.length === 0 && sentInvitations.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="mail-open-outline" size={64} color={colors.text.secondary} />
                <Text style={styles.emptyTitle}>No Invitations</Text>
                <Text style={styles.emptyDescription}>
                  You don't have any pending invitations.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Invite Modal */}
      <Modal
        visible={showInviteModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowInviteModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalOverlay}
            onPress={() => setShowInviteModal(false)}
          >
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Add Friend</Text>
                  <TouchableOpacity onPress={() => setShowInviteModal(false)}>
                    <Ionicons name="close" size={24} color={colors.text.primary} />
                  </TouchableOpacity>
                </View>

                {/* Your Friend Code */}
                {myFriendCode && (
                  <View style={styles.modalFriendCodeCard}>
                    <Text style={styles.modalFriendCodeLabel}>Your Friend Code</Text>
                    <View style={styles.modalFriendCodeRow}>
                      <Text style={styles.modalFriendCodeText}>{myFriendCode}</Text>
                      <TouchableOpacity onPress={handleCopyFriendCode}>
                        <Ionicons name="copy-outline" size={20} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.modalFriendCodeHint}>
                      Share this code with your friend
                    </Text>
                  </View>
                )}

                <Text style={styles.modalDescription}>
                  Enter your friend's 6-character code to send them a connection request.
                </Text>

                <View style={styles.codeInputContainer}>
                  {codeDigits.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => (codeInputRefs.current[index] = ref)}
                      style={styles.codeInput}
                      value={digit}
                      onChangeText={(text) => handleCodeChange(text, index)}
                      onKeyPress={(e) => handleCodeKeyPress(e, index)}
                      maxLength={1}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      keyboardType="default"
                      selectTextOnFocus
                      textAlign="center"
                    />
                  ))}
                </View>

                <Button
                  title="Send Invitation"
                  onPress={handleSendInvitation}
                  variant="primary"
                  size="medium"
                  fullWidth
                />
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Saved Chart Form Modal */}
      <SavedChartForm
        visible={showChartForm}
        onClose={() => setShowChartForm(false)}
        onSave={handleCreateSavedChart}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  friendCodeCard: {
    backgroundColor: colors.background.card,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  friendCodeLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  friendCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  friendCodeText: {
    ...typography.h2,
    color: colors.primary,
    letterSpacing: 4,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  copyButtonText: {
    ...typography.button,
    color: colors.primary,
    fontSize: 14,
  },
  friendCodeHint: {
    ...typography.caption,
    color: colors.text.secondary,
    lineHeight: 16,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background.primary,
    marginTop: spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
    position: 'relative',
  },
  tabText: {
    ...typography.body,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: 2,
    backgroundColor: '#FFFFFF',
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeAlert: {
    backgroundColor: colors.error,
  },
  badgeText: {
    ...typography.caption,
    color: '#FFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyTitle: {
    ...typography.h2,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  emptyDescription: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
    marginBottom: spacing.xl,
  },
  emptyButtonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  connectionCard: {
    backgroundColor: colors.background.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  connectionInfo: {
    flex: 1,
  },
  connectionName: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  connectionCode: {
    ...typography.caption,
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  connectionLabel: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 1.2,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  invitationCardWrapper: {
    marginBottom: spacing.md,
  },
  invitationActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    gap: spacing.xs,
    borderWidth: 1,
  },
  acceptButton: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  acceptButtonText: {
    ...typography.button,
    color: '#FFF',
    fontSize: 14,
  },
  declineButton: {
    backgroundColor: 'transparent',
    borderColor: colors.error,
  },
  declineButtonText: {
    ...typography.button,
    color: colors.error,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.h2,
  },
  modalDescription: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  input: {
    ...typography.body,
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 0,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  codeInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  codeInput: {
    flex: 1,
    ...typography.h2,
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderWidth: 0,
    textAlign: 'center',
    color: colors.primary,
    fontSize: 24,
    fontWeight: '600',
  },
  modalFriendCodeCard: {
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
  },
  modalFriendCodeLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalFriendCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  modalFriendCodeText: {
    ...typography.h2,
    color: colors.primary,
    letterSpacing: 4,
    fontSize: 24,
  },
  modalFriendCodeHint: {
    ...typography.caption,
    color: colors.text.secondary,
    fontSize: 12,
  },
  quickAccessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.primary + '40',
  },
  quickAccessIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  quickAccessInfo: {
    flex: 1,
  },
  quickAccessTitle: {
    ...typography.h3,
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  quickAccessSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
