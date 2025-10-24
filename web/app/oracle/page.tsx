'use client';

import Link from 'next/link';
import { MainLayout } from '@/components/layout';
import { Card } from '@/components/ui';

export default function OraclePage() {
  const oracles = [
    {
      title: 'Tarot',
      description: 'Draw cards for guidance and wisdom',
      href: '/oracle/tarot',
      icon: '🃏',
      color: 'from-purple-500/20 to-pink-500/20',
    },
    {
      title: 'I Ching',
      description: 'Cast coins and receive ancient wisdom',
      href: '/oracle/iching',
      icon: '☯️',
      color: 'from-blue-500/20 to-cyan-500/20',
    },
    {
      title: 'Dreams',
      description: 'Decode the messages in your dreams',
      href: '/oracle/dreams',
      icon: '🌙',
      color: 'from-indigo-500/20 to-violet-500/20',
    },
  ];

  return (
    <MainLayout headerTitle="Oracle">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h2 className="text-4xl font-bold font-serif mb-4">Choose Your Oracle</h2>
            <p className="text-secondary text-lg">
              Connect with ancient wisdom through divination
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {oracles.map((oracle) => (
              <Link key={oracle.href} href={oracle.href}>
                <Card
                  variant="outlined"
                  className="p-8 hover:border-primary transition-all cursor-pointer h-full group relative overflow-hidden"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${oracle.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <div className="relative z-10">
                    <div className="text-6xl mb-6 text-center">{oracle.icon}</div>
                    <h3 className="text-2xl font-bold font-serif mb-3 text-center">
                      {oracle.title}
                    </h3>
                    <p className="text-secondary text-center">{oracle.description}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
