'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/store';
import { MainLayout } from '@/components/layout';
import { Card } from '@/components/ui';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, birthData } = useAppStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
    if (isAuthenticated && !birthData) {
      router.push('/onboarding');
    }
  }, [isAuthenticated, birthData, router]);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  const features = [
    {
      title: 'Daily Horoscope',
      description: 'Get your personalized daily astrological insights',
      href: '/horoscope',
      icon: '🌟',
    },
    {
      title: 'Natal Chart',
      description: 'Explore your birth chart and planetary positions',
      href: '/chart',
      icon: '🔮',
    },
    {
      title: 'Tarot Reading',
      description: 'Draw cards for guidance and wisdom',
      href: '/oracle/tarot',
      icon: '🃏',
    },
    {
      title: 'I Ching',
      description: 'Cast coins and receive ancient wisdom',
      href: '/oracle/iching',
      icon: '☯️',
    },
    {
      title: 'Dream Interpretation',
      description: 'Decode the messages in your dreams',
      href: '/oracle/dreams',
      icon: '🌙',
    },
    {
      title: 'Journal',
      description: 'Record your spiritual journey and insights',
      href: '/journal',
      icon: '📝',
    },
  ];

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Welcome to Ouros</h2>
            <p className="text-secondary">Your cosmic dashboard</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature) => (
              <Link key={feature.href} href={feature.href}>
                <Card
                  variant="outlined"
                  className="p-6 hover:border-primary transition-colors cursor-pointer h-full"
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-secondary text-sm">{feature.description}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
