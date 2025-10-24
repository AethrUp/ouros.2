'use client';

import { MainLayout } from '@/components/layout';
import { Card } from '@/components/ui';

export default function TarotPage() {
  return (
    <MainLayout headerTitle="Tarot" showBack>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h2 className="text-4xl font-bold font-serif mb-4">Tarot Reading</h2>
            <p className="text-secondary text-lg">
              Draw cards to receive guidance from the tarot
            </p>
          </div>

          <Card variant="outlined" className="p-8">
            <p className="text-center text-secondary">
              Tarot reading interface coming soon...
            </p>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
