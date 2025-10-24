'use client';

import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store';
import { MainLayout } from '@/components/layout';
import { Card, Button } from '@/components/ui';

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, logout } = useAppStore();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <MainLayout headerTitle="Profile" showBack>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card variant="outlined" className="p-6">
            <h3 className="text-xl font-semibold mb-4">Account Information</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-secondary">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              {profile?.displayName && (
                <div>
                  <p className="text-sm text-secondary">Display Name</p>
                  <p className="font-medium">{profile.displayName}</p>
                </div>
              )}
            </div>
          </Card>

          <Card variant="outlined" className="p-6">
            <h3 className="text-xl font-semibold mb-4">Settings</h3>
            <div className="space-y-3">
              <Button variant="secondary" className="w-full justify-start">
                Edit Profile
              </Button>
              <Button variant="secondary" className="w-full justify-start">
                Birth Data Settings
              </Button>
              <Button variant="secondary" className="w-full justify-start">
                Subscription
              </Button>
            </div>
          </Card>

          <Card variant="outlined" className="p-6">
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleLogout}
            >
              Sign Out
            </Button>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
