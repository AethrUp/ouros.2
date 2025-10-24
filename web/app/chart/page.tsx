'use client';

import { MainLayout } from '@/components/layout';
import { Card } from '@/components/ui';

export default function ChartPage() {
  return (
    <MainLayout headerTitle="Natal Chart" showBack>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Your Natal Chart</h2>
            <p className="text-secondary">
              Explore your birth chart and planetary positions
            </p>
          </div>

          <Card variant="outlined" className="p-8">
            <p className="text-center text-secondary">
              Natal chart visualization coming soon...
            </p>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
