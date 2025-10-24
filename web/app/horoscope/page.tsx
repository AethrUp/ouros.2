'use client';

import { MainLayout } from '@/components/layout';
import { Card } from '@/components/ui';

export default function HoroscopePage() {
  return (
    <MainLayout headerTitle="Daily Horoscope" showBack>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Daily Horoscope</h2>
            <p className="text-secondary">
              Your personalized daily astrological insights
            </p>
          </div>

          <Card variant="outlined" className="p-8">
            <p className="text-center text-secondary">
              Daily horoscope interface coming soon...
            </p>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
