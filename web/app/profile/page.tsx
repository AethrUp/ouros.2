'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Calendar, MapPin, Star, LogOut, Edit, Settings, Code, Wrench } from 'lucide-react';
import { useAppStore } from '@/store';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui';
import { SubscriptionInfo } from '@/components/subscription/SubscriptionInfo';
import { ProfileEditModal, BirthDataEditModal } from '@/components/profile';
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations';
import type { SubscriptionTier } from '@/types/subscription';

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, birthData, logout, subscriptionState, updateSubscriptionTier, loadSubscriptionState } = useAppStore();
  const [isUpdatingTier, setIsUpdatingTier] = useState(false);
  const [tierUpdateError, setTierUpdateError] = useState<string | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isBirthDataEditOpen, setIsBirthDataEditOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleTierChange = async (tier: SubscriptionTier) => {
    setIsUpdatingTier(true);
    setTierUpdateError(null);
    try {
      await updateSubscriptionTier(tier, true); // true = isDebug flag
      // Reload subscription state from database to update cache
      await loadSubscriptionState();
      console.log(`✅ Tier updated to: ${tier}`);
      // Force page reload to ensure all components get the new tier
      window.location.reload();
    } catch (error: any) {
      console.error('Failed to update tier:', error);
      setTierUpdateError(error.message || 'Failed to update tier');
    } finally {
      setIsUpdatingTier(false);
    }
  };

  const currentTier = subscriptionState?.tier || 'free';

  return (
    <MainLayout headerTitle="Profile" showBack>
      <div className="min-h-screen bg-background pb-20 lg:pb-8">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="max-w-2xl mx-auto space-y-6"
          >
            {/* Profile Header */}
            <motion.div
              variants={staggerItem}
              className="bg-card border border-border rounded-lg p-8 text-center"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
                <User className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl  mb-2">
                {profile?.displayName || user?.email?.split('@')[0] || 'User'}
              </h2>
              <p className="text-secondary">{user?.email}</p>
            </motion.div>

            {/* Birth Data */}
            {birthData && (
              <motion.div
                variants={staggerItem}
                className="bg-card border border-border rounded-lg p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg ">Birth Information</h3>
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => router.push('/onboarding')}
                    className="flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-secondary">Birth Date</p>
                      <p>
                        {new Date(birthData.birthDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Star className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-secondary">Birth Time</p>
                      <p>
                        {birthData.birthTime
                          ? new Date(`2000-01-01T${birthData.birthTime}`).toLocaleTimeString(
                              'en-US',
                              {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              }
                            )
                          : 'Not set'}
                      </p>
                    </div>
                  </div>
                  {birthData.birthLocation && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm text-secondary">Birth Location</p>
                        <p>{birthData.birthLocation.name}</p>
                        <p className="text-xs text-secondary mt-1">
                          {birthData.birthLocation.timezone}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Subscription */}
            <motion.div variants={staggerItem}>
              <SubscriptionInfo />
            </motion.div>

            {/* Dev Controls - For Testing */}
            <motion.div
              variants={staggerItem}
              className="bg-amber-950/30 border-2 border-amber-600/30 rounded-lg p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Wrench className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg  text-amber-400">Developer Controls</h3>
              </div>
              <p className="text-sm text-amber-200/70 mb-4">
                Switch subscription tiers for testing. Changes are marked as debug overrides.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm text-secondary">Current Tier:</span>
                  <span className="px-3 py-1 bg-primary/20 border border-primary/40 rounded-full text-sm  text-primary capitalize">
                    {currentTier}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant={currentTier === 'free' ? 'primary' : 'secondary'}
                    size="small"
                    onClick={() => handleTierChange('free')}
                    disabled={isUpdatingTier || currentTier === 'free'}
                    className="w-full"
                  >
                    Free
                  </Button>
                  <Button
                    variant={currentTier === 'premium' ? 'primary' : 'secondary'}
                    size="small"
                    onClick={() => handleTierChange('premium')}
                    disabled={isUpdatingTier || currentTier === 'premium'}
                    className="w-full"
                  >
                    Premium
                  </Button>
                  <Button
                    variant={currentTier === 'pro' ? 'primary' : 'secondary'}
                    size="small"
                    onClick={() => handleTierChange('pro')}
                    disabled={isUpdatingTier || currentTier === 'pro'}
                    className="w-full"
                  >
                    Pro
                  </Button>
                </div>

                {isUpdatingTier && (
                  <p className="text-sm text-amber-400 text-center mt-2">Updating tier...</p>
                )}
                {tierUpdateError && (
                  <p className="text-sm text-red-400 text-center mt-2">{tierUpdateError}</p>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-amber-600/20">
                <p className="text-xs text-amber-200/50 italic">
                  Note: This is a development feature. In production, tiers are managed through Stripe subscriptions.
                </p>
              </div>
            </motion.div>

            {/* Account Settings */}
            <motion.div
              variants={staggerItem}
              className="bg-card border border-border rounded-lg p-6"
            >
              <h3 className="text-lg  mb-4">Account Settings</h3>
              <div className="space-y-3">
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={() => setIsEditProfileOpen(true)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Display Name
                </Button>
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={() => setIsBirthDataEditOpen(true)}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Update Birth Data
                </Button>
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={() => alert('App settings coming soon')}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  App Settings
                </Button>
              </div>
            </motion.div>

            {/* Preferences */}
            {(profile as any)?.selectedCategories && (
              <motion.div
                variants={staggerItem}
                className="bg-card border border-border rounded-lg p-6"
              >
                <h3 className="text-lg  mb-4">Your Focus Areas</h3>
                <div className="flex flex-wrap gap-2">
                  {(profile as any).selectedCategories.map((category: string) => (
                    <span
                      key={category}
                      className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-sm text-primary capitalize"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Sign Out */}
            <motion.div variants={staggerItem} className="bg-card border border-border rounded-lg p-6">
              <Button variant="destructive" className="w-full flex items-center justify-center gap-2" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />

      {/* Birth Data Edit Modal */}
      <BirthDataEditModal
        isOpen={isBirthDataEditOpen}
        onClose={() => setIsBirthDataEditOpen(false)}
      />
    </MainLayout>
  );
}
