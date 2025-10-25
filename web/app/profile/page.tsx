'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Mail, Calendar, MapPin, Star, LogOut, Edit, Settings } from 'lucide-react';
import { useAppStore } from '@/store';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui';
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations';

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, birthData, logout } = useAppStore();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

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
              <h2 className="text-2xl font-bold mb-2">
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
                  <h3 className="text-lg font-semibold">Birth Information</h3>
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
                      <p className="font-medium">
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
                      <p className="font-medium">
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
                        <p className="font-medium">{birthData.birthLocation.name}</p>
                        <p className="text-xs text-secondary mt-1">
                          {birthData.birthLocation.timezone}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Account Settings */}
            <motion.div
              variants={staggerItem}
              className="bg-card border border-border rounded-lg p-6"
            >
              <h3 className="text-lg font-semibold mb-4">Account Settings</h3>
              <div className="space-y-3">
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={() => alert('Edit profile coming soon')}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Display Name
                </Button>
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={() => router.push('/onboarding')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Update Birth Data
                </Button>
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={() => alert('Subscription management coming soon')}
                >
                  <Star className="w-4 h-4 mr-2" />
                  Manage Subscription
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
                <h3 className="text-lg font-semibold mb-4">Your Focus Areas</h3>
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
    </MainLayout>
  );
}
