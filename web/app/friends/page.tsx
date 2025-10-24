'use client';

import { MainLayout } from '@/components/layout';
import { Card } from '@/components/ui';

export default function FriendsPage() {
  return (
    <MainLayout headerTitle="Friends">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Friends & Synastry</h2>
            <p className="text-secondary">
              Explore compatibility and relationship dynamics
            </p>
          </div>

          <Card variant="outlined" className="p-8">
            <p className="text-center text-secondary">
              Friends and synastry interface coming soon...
            </p>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
