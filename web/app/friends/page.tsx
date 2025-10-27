'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  Send,
  Check,
  X,
  Trash2,
  Copy,
  Plus,
  Heart,
  Clock,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { Button, LoadingScreen, Modal, ConfirmModal, Input } from '@/components/ui';
import { fadeInUp, transitions } from '@/lib/animations';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { SavedChartModal } from '@/components/friends/SavedChartModal';

type TabType = 'connections' | 'invitations' | 'saved';

export default function FriendsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('connections');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isSavedChartModalOpen, setIsSavedChartModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'connection' | 'invitation' | 'saved'>('connection');

  const {
    connections,
    sentInvitations,
    receivedInvitations,
    savedCharts,
    isLoadingConnections,
    isLoadingInvitations,
    isLoadingSavedCharts,
    connectionsError,
    invitationsError,
    savedChartsError,
    myFriendCode,
    loadConnections,
    loadInvitations,
    loadSavedCharts,
    loadMyFriendCode,
    removeConnection,
    acceptInvitation,
    declineInvitation,
    cancelInvitation,
    deleteSavedChart,
  } = useAppStore();

  useEffect(() => {
    loadConnections();
    loadInvitations();
    loadSavedCharts();
    loadMyFriendCode();
  }, []);

  const tabs = [
    { label: 'CONNECTIONS', value: 'connections' as TabType, count: connections.length },
    {
      label: 'INVITATIONS',
      value: 'invitations' as TabType,
      count: receivedInvitations.length,
    },
    { label: 'SAVED CHARTS', value: 'saved' as TabType, count: savedCharts.length },
  ];

  const handleDeleteConnection = async () => {
    if (!deleteConfirmId) return;
    try {
      await removeConnection(deleteConfirmId);
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Failed to delete connection:', error);
    }
  };

  const handleDeleteSavedChart = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteSavedChart(deleteConfirmId);
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Failed to delete saved chart:', error);
    }
  };

  const handleCancelInvitation = async (id: string) => {
    try {
      await cancelInvitation(id);
    } catch (error) {
      console.error('Failed to cancel invitation:', error);
    }
  };

  const handleAcceptInvitation = async (id: string) => {
    try {
      await acceptInvitation(id);
    } catch (error) {
      console.error('Failed to accept invitation:', error);
    }
  };

  const handleDeclineInvitation = async (id: string) => {
    try {
      await declineInvitation(id);
    } catch (error) {
      console.error('Failed to decline invitation:', error);
    }
  };

  const handleViewSynastry = (connectionId: string) => {
    router.push(`/synastry/${connectionId}?type=connection`);
  };

  const handleViewSavedChartSynastry = (chartId: string) => {
    router.push(`/synastry/${chartId}?type=saved`);
  };

  const isLoading =
    (activeTab === 'connections' && isLoadingConnections) ||
    (activeTab === 'invitations' && isLoadingInvitations) ||
    (activeTab === 'saved' && isLoadingSavedCharts);

  if (isLoading && connections.length === 0 && savedCharts.length === 0) {
    return <LoadingScreen messages={['Loading friends...']} />;
  }

  return (
    <MainLayout headerTitle="Friends & Synastry">
      <div className="min-h-screen bg-background pb-20 lg:pb-8">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={transitions.spring}
            className="max-w-5xl mx-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-3xl font-serif text-primary">Friends & Synastry</h2>
                  <p className="text-secondary text-sm">
                    Connect and explore compatibility
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsSavedChartModalOpen(true)}
                  variant="ghost"
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Chart</span>
                </Button>
                <Button
                  onClick={() => setIsInviteModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Friend</span>
                </Button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-8 border-b-2 border-border mb-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    'pb-3 text-sm font-normal transition-colors relative whitespace-nowrap',
                    activeTab === tab.value ? 'text-white' : 'text-secondary hover:text-white'
                  )}
                  style={{ letterSpacing: '0.15em' }}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span
                      className={cn(
                        'ml-2 px-2 py-0.5 rounded-full text-xs',
                        activeTab === tab.value
                          ? 'bg-primary text-white'
                          : 'bg-surface text-secondary'
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                  {activeTab === tab.value && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === 'connections' && (
                <motion.div
                  key="connections"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {connections.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface mb-4">
                        <Users className="w-8 h-8 text-secondary" />
                      </div>
                      <h3 className="text-xl mb-2">No Connections Yet</h3>
                      <p className="text-secondary mb-6 max-w-md mx-auto">
                        Add friends to explore your astrological compatibility and relationship
                        dynamics
                      </p>
                      <Button onClick={() => setIsInviteModalOpen(true)}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Your First Friend
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {connections.map((connection) => (
                        <motion.div
                          key={connection.connectionId}
                          layout
                          className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-all group"
                        >
                          <div
                            onClick={() => handleViewSynastry(connection.connectionId)}
                            className="p-6 cursor-pointer"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-4 flex-1">
                                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-serif text-lg group-hover:bg-primary/30 transition-colors">
                                  {connection.friendDisplayName.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-medium text-white group-hover:text-primary transition-colors">
                                      {connection.friendDisplayName}
                                    </h3>
                                    <ChevronRight className="w-4 h-4 text-secondary group-hover:text-primary transition-colors" />
                                  </div>
                                  <p className="text-sm text-secondary">{connection.friendEmail}</p>
                                  {connection.relationshipLabel && (
                                    <div className="flex items-center gap-2 mt-2">
                                      <Heart className="w-3 h-3 text-primary" />
                                      <span className="text-xs text-primary">
                                        {connection.relationshipLabel}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirmId(connection.connectionId);
                                    setDeleteType('connection');
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-secondary">
                              <span>Connected {format(new Date(connection.createdAt), 'MMM d, yyyy')}</span>
                              <span>Code: {connection.friendCode}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'invitations' && (
                <motion.div
                  key="invitations"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8"
                >
                  {/* Received Invitations */}
                  <div>
                    <h3 className="text-lg font-medium text-white mb-4">Received</h3>
                    {receivedInvitations.length === 0 ? (
                      <div className="text-center py-8 bg-card border border-border rounded-lg">
                        <p className="text-secondary">No pending invitations</p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {receivedInvitations.map((invitation) => (
                          <div
                            key={invitation.id}
                            className="bg-card border border-border rounded-lg p-6"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-4 flex-1">
                                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-serif text-lg">
                                  {invitation.senderProfile?.displayName.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-lg font-medium text-white">
                                    {invitation.senderProfile?.displayName}
                                  </h3>
                                  <p className="text-sm text-secondary">
                                    {invitation.senderProfile?.email}
                                  </p>
                                  {invitation.message && (
                                    <div className="mt-2 flex items-start gap-2">
                                      <MessageSquare className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                                      <p className="text-sm text-white">{invitation.message}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                              <span className="text-xs text-secondary flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(invitation.createdAt), 'MMM d, yyyy')}
                              </span>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="small"
                                  onClick={() => handleDeclineInvitation(invitation.id)}
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Decline
                                </Button>
                                <Button
                                  variant="primary"
                                  size="small"
                                  onClick={() => handleAcceptInvitation(invitation.id)}
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Accept
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sent Invitations */}
                  <div>
                    <h3 className="text-lg font-medium text-white mb-4">Sent</h3>
                    {sentInvitations.length === 0 ? (
                      <div className="text-center py-8 bg-card border border-border rounded-lg">
                        <p className="text-secondary">No sent invitations</p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {sentInvitations.map((invitation) => (
                          <div
                            key={invitation.id}
                            className="bg-card border border-border rounded-lg p-6"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-4 flex-1">
                                <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center text-secondary font-serif text-lg">
                                  {invitation.recipientProfile?.displayName.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-lg font-medium text-white">
                                    {invitation.recipientProfile?.displayName}
                                  </h3>
                                  <p className="text-sm text-secondary">
                                    {invitation.recipientProfile?.email}
                                  </p>
                                  <div className="mt-2">
                                    <span
                                      className={cn(
                                        'text-xs px-2 py-1 rounded-full',
                                        invitation.status === 'pending'
                                          ? 'bg-yellow-500/20 text-yellow-500'
                                          : invitation.status === 'accepted'
                                          ? 'bg-green-500/20 text-green-500'
                                          : 'bg-red-500/20 text-red-500'
                                      )}
                                    >
                                      {invitation.status.toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {invitation.status === 'pending' && (
                                <Button
                                  variant="ghost"
                                  size="small"
                                  onClick={() => handleCancelInvitation(invitation.id)}
                                >
                                  Cancel
                                </Button>
                              )}
                            </div>
                            <div className="mt-4 pt-4 border-t border-border">
                              <span className="text-xs text-secondary flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Sent {format(new Date(invitation.createdAt), 'MMM d, yyyy')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'saved' && (
                <motion.div
                  key="saved"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {savedCharts.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface mb-4">
                        <Heart className="w-8 h-8 text-secondary" />
                      </div>
                      <h3 className="text-xl mb-2">No Saved Charts</h3>
                      <p className="text-secondary mb-6 max-w-md mx-auto">
                        Create charts for people who don't use the app to explore synastry
                      </p>
                      <Button onClick={() => setIsSavedChartModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Chart
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {savedCharts.map((chart) => (
                        <motion.div
                          key={chart.id}
                          layout
                          className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-all group"
                        >
                          <div
                            onClick={() => handleViewSavedChartSynastry(chart.id)}
                            className="p-6 cursor-pointer"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-4 flex-1">
                                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-serif text-lg group-hover:bg-primary/30 transition-colors">
                                  {chart.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-medium text-white group-hover:text-primary transition-colors">
                                      {chart.name}
                                    </h3>
                                    <ChevronRight className="w-4 h-4 text-secondary group-hover:text-primary transition-colors" />
                                  </div>
                                  <p className="text-sm text-secondary">
                                    {format(new Date(chart.birthData.birthDate), 'MMMM d, yyyy')}
                                    {chart.birthData.birthTime && ` at ${chart.birthData.birthTime}`}
                                  </p>
                                  {chart.relationship && (
                                    <div className="flex items-center gap-2 mt-2">
                                      <Heart className="w-3 h-3 text-primary" />
                                      <span className="text-xs text-primary">{chart.relationship}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirmId(chart.id);
                                    setDeleteType('saved');
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            {chart.notes && (
                              <div className="mt-4 pt-4 border-t border-border">
                                <p className="text-sm text-secondary">{chart.notes}</p>
                              </div>
                            )}
                            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-secondary">
                              <span>Created {format(new Date(chart.createdAt), 'MMM d, yyyy')}</span>
                              <span>{chart.birthData.birthLocation.name}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Add Friend Modal */}
      <InviteFriendModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        myFriendCode={myFriendCode}
      />

      {/* Add Saved Chart Modal */}
      <SavedChartModal
        isOpen={isSavedChartModalOpen}
        onClose={() => setIsSavedChartModalOpen(false)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={deleteType === 'saved' ? handleDeleteSavedChart : handleDeleteConnection}
        title={`Delete ${deleteType === 'saved' ? 'Saved Chart' : 'Connection'}?`}
        message={`Are you sure you want to delete this ${
          deleteType === 'saved' ? 'chart' : 'connection'
        }? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </MainLayout>
  );
}

// Invite Friend Modal Component
function InviteFriendModal({
  isOpen,
  onClose,
  myFriendCode,
}: {
  isOpen: boolean;
  onClose: () => void;
  myFriendCode: string | null;
}) {
  const [friendCode, setFriendCode] = useState(['', '', '', '', '', '']);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const { sendInvitation } = useAppStore();

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const chars = value.toUpperCase().split('').slice(0, 6);
      const newCode = [...friendCode];
      chars.forEach((char, i) => {
        if (index + i < 6) {
          newCode[index + i] = char;
        }
      });
      setFriendCode(newCode);
      return;
    }

    const newCode = [...friendCode];
    newCode[index] = value.toUpperCase();
    setFriendCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !friendCode[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleCopyCode = () => {
    if (myFriendCode) {
      navigator.clipboard.writeText(myFriendCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSend = async () => {
    const code = friendCode.join('');
    if (code.length !== 6) {
      setError('Please enter a valid 6-character friend code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await sendInvitation(code, message || undefined);
      setFriendCode(['', '', '', '', '', '']);
      setMessage('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Friend"
      description="Share your friend code or enter theirs to connect"
      size="medium"
    >
      <div className="space-y-6">
        {/* Your Friend Code */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">Your Friend Code</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-4 py-3 bg-surface border border-border rounded-lg font-mono text-2xl text-center text-primary tracking-widest">
              {myFriendCode || 'Loading...'}
            </div>
            <Button
              variant="ghost"
              size="small"
              onClick={handleCopyCode}
              disabled={!myFriendCode}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-secondary mt-2">Share this code with friends to connect</p>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-card text-secondary">OR</span>
          </div>
        </div>

        {/* Enter Friend Code */}
        <div>
          <label className="block text-sm font-medium text-white mb-3">
            Enter Friend's Code
          </label>
          <div className="flex justify-center gap-2">
            {friendCode.map((char, index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                maxLength={6}
                value={char}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center bg-surface border border-border rounded-lg font-mono text-2xl text-white focus:outline-none focus:border-primary transition-colors uppercase"
              />
            ))}
          </div>
        </div>

        {/* Optional Message */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Message (Optional)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a personal message..."
            rows={3}
            className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-white placeholder-secondary focus:outline-none focus:border-primary transition-colors resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            loading={loading}
            disabled={friendCode.join('').length !== 6}
            className="flex-1"
          >
            <Send className="w-4 h-4 mr-2" />
            Send Invitation
          </Button>
        </div>
      </div>
    </Modal>
  );
}
