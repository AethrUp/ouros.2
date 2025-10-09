import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { NavigationProps } from '../types';
import { HeaderBar } from '../components';
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
    sendInvitation,
    acceptInvitation,
    declineInvitation,
    removeConnection,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'connections' | 'invitations'>('connections');
  const [showChartForm, setShowChartForm] = useState(false);

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

  const handleSendInvitation = async () => {
    const code = inviteFriendCode.trim().toUpperCase();

    if (!code) {
      Alert.alert('Error', 'Please enter a friend code');
      return;
    }

    if (code.length !== 6) {
      Alert.alert('Error', 'Friend code must be 6 characters');
      return;
    }

    try {
      await sendInvitation(code, inviteMessage);
      Alert.alert('Success', 'Invitation sent!');
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

  const handleRemoveConnection = async (connectionId: string, friendName: string) => {
    Alert.alert(
      'Remove Connection',
      `Remove ${friendName} from your connections?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeConnection(connectionId),
        },
      ]
    );
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
            icon: 'bookmark-outline',
            label: 'Saved Charts',
            onPress: () => navigation.navigate('SavedCharts'),
          },
          {
            icon: 'person-add-outline',
            label: 'Invite',
            onPress: () => setShowInviteModal(true),
          },
        ]}
      />

      {/* My Friend Code Card */}
      {myFriendCode && (
        <View style={styles.friendCodeCard}>
          <Text style={styles.friendCodeLabel}>Your Friend Code</Text>
          <View style={styles.friendCodeRow}>
            <Text style={styles.friendCodeText}>{myFriendCode}</Text>
            <TouchableOpacity style={styles.copyButton} onPress={handleCopyFriendCode}>
              <Ionicons name="copy-outline" size={20} color={colors.primary} />
              <Text style={styles.copyButtonText}>Copy</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.friendCodeHint}>
            Share this code with friends to let them add you
          </Text>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'connections' && styles.tabActive]}
          onPress={() => setActiveTab('connections')}
        >
          <Text style={[styles.tabText, activeTab === 'connections' && styles.tabTextActive]}>
            Connections
          </Text>
          {connections.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{connections.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'invitations' && styles.tabActive]}
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
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {activeTab === 'connections' && (
          <>
            {isLoadingConnections ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : connections.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={64} color={colors.text.secondary} />
                <Text style={styles.emptyTitle}>No Connections Yet</Text>
                <Text style={styles.emptyDescription}>
                  Add friends or create saved charts for people without the app
                </Text>
                <View style={styles.emptyButtonContainer}>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => setShowInviteModal(true)}
                  >
                    <Ionicons name="person-add-outline" size={20} color="#FFF" />
                    <Text style={styles.primaryButtonText}>Add Friend</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryButton, styles.secondaryButton]}
                    onPress={() => setShowChartForm(true)}
                  >
                    <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                    <Text style={[styles.primaryButtonText, styles.secondaryButtonText]}>
                      Create Chart
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                {/* Saved Charts Quick Access */}
                {savedCharts.length > 0 && (
                  <TouchableOpacity
                    style={styles.quickAccessCard}
                    onPress={() => navigation.navigate('SavedCharts')}
                  >
                    <View style={styles.quickAccessIcon}>
                      <Ionicons name="bookmark" size={24} color={colors.primary} />
                    </View>
                    <View style={styles.quickAccessInfo}>
                      <Text style={styles.quickAccessTitle}>Saved Charts</Text>
                      <Text style={styles.quickAccessSubtitle}>
                        {savedCharts.length} chart{savedCharts.length !== 1 ? 's' : ''} available
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
                  </TouchableOpacity>
                )}

                {connections.map((connection) => (
                  <View key={connection.connectionId} style={styles.connectionCard}>
                  <View style={styles.connectionHeader}>
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="person-outline" size={32} color={colors.primary} />
                    </View>
                    <View style={styles.connectionInfo}>
                      <Text style={styles.connectionName}>{connection.friendDisplayName}</Text>
                      <Text style={styles.connectionCode}>Code: {connection.friendCode}</Text>
                      {connection.relationshipLabel && (
                        <Text style={styles.connectionLabel}>{connection.relationshipLabel}</Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.connectionActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleViewSynastry(connection)}
                    >
                      <Ionicons name="star-outline" size={20} color={colors.primary} />
                      <Text style={styles.actionButtonText}>View Synastry</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.actionButtonDanger]}
                      onPress={() =>
                        handleRemoveConnection(connection.connectionId, connection.friendDisplayName)
                      }
                    >
                      <Ionicons name="person-remove-outline" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
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
                  <View key={invitation.id} style={styles.invitationCard}>
                    <View style={styles.invitationHeader}>
                      <Ionicons name="mail-outline" size={24} color={colors.primary} />
                      <View style={styles.invitationInfo}>
                        <Text style={styles.invitationFrom}>
                          From: {invitation.senderProfile?.display_name || 'Unknown User'}
                        </Text>
                        {invitation.message && (
                          <Text style={styles.invitationMessage}>"{invitation.message}"</Text>
                        )}
                      </View>
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
                ))}
              </>
            )}

            {sentInvitations.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>
                  Sent Invitations
                </Text>
                {sentInvitations.map((invitation) => (
                  <View key={invitation.id} style={styles.invitationCard}>
                    <View style={styles.invitationHeader}>
                      <Ionicons name="paper-plane-outline" size={24} color={colors.text.secondary} />
                      <View style={styles.invitationInfo}>
                        <Text style={styles.invitationFrom}>
                          To: {invitation.recipientProfile?.display_name || 'Unknown User'}
                        </Text>
                        <Text style={styles.invitationStatus}>
                          Status: {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                        </Text>
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Friend</Text>
              <TouchableOpacity onPress={() => setShowInviteModal(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Enter your friend's 6-character code to send them a connection request.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Friend Code (e.g., ABC123)"
              placeholderTextColor={colors.text.secondary}
              value={inviteFriendCode}
              onChangeText={(text) => setInviteFriendCode(text.toUpperCase())}
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect={false}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Personal message (optional)"
              placeholderTextColor={colors.text.secondary}
              value={inviteMessage}
              onChangeText={setInviteMessage}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity style={styles.sendButton} onPress={handleSendInvitation}>
              <Ionicons name="paper-plane" size={20} color="#FFF" />
              <Text style={styles.sendButtonText}>Send Invitation</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    backgroundColor: colors.background.secondary,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary + '40',
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
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
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
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
    gap: spacing.sm,
  },
  primaryButtonText: {
    ...typography.button,
    color: '#FFF',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    color: colors.primary,
  },
  connectionCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  connectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  connectionInfo: {
    flex: 1,
  },
  connectionName: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  connectionCode: {
    ...typography.caption,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  connectionLabel: {
    ...typography.caption,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  connectionActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: spacing.xs,
  },
  actionButtonDanger: {
    flex: 0,
    borderColor: colors.error,
  },
  actionButtonText: {
    ...typography.button,
    color: colors.primary,
    fontSize: 14,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  invitationCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  invitationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  invitationInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  invitationFrom: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  invitationMessage: {
    ...typography.body,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  invitationStatus: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  invitationActions: {
    flexDirection: 'row',
    gap: spacing.sm,
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
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 8,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  sendButtonText: {
    ...typography.button,
    color: '#FFF',
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
