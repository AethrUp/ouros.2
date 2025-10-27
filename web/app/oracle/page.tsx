'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { Card, Badge, UsageIndicator } from '@/components/ui';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { useAppStore } from '@/store';
import { getRemainingUsage } from '@/utils/featureGates';
import type { UsageFeature } from '@/types/subscription';

export default function OraclePage() {
  const { subscriptionState, usageTracking, loadSubscriptionState, loadUsageTracking } = useAppStore();
  const [remainingUsage, setRemainingUsage] = useState<Record<string, number | 'unlimited'>>({});

  useEffect(() => {
    // Load subscription and usage data
    const loadData = async () => {
      await loadSubscriptionState();
      await loadUsageTracking();
    };
    loadData();
  }, [loadSubscriptionState, loadUsageTracking]);

  useEffect(() => {
    // Calculate remaining usage for each oracle method
    if (subscriptionState) {
      const tier = subscriptionState.tier;
      const remaining: Record<string, number | 'unlimited'> = {
        tarot: getRemainingUsage(tier, 'tarot', usageTracking.tarot?.count || 0),
        iching: getRemainingUsage(tier, 'iching', usageTracking.iching?.count || 0),
        dream: getRemainingUsage(tier, 'dream', usageTracking.dream?.count || 0),
      };
      setRemainingUsage(remaining);
    }
  }, [subscriptionState, usageTracking]);

  const oracles = [
    {
      title: 'Tarot',
      description: 'Draw cards to gain insight into your questions and challenges',
      href: '/oracle/tarot',
      icon: '/icons/tarotIcon.svg',
      color: 'from-purple-500/20 to-pink-500/20',
      premium: false,
      feature: 'tarot' as UsageFeature,
    },
    {
      title: 'I Ching',
      description: 'Cast coins to consult the ancient Book of Changes',
      href: '/oracle/iching',
      icon: '/icons/ichingIcon.svg',
      color: 'from-blue-500/20 to-cyan-500/20',
      premium: false,
      feature: 'iching' as UsageFeature,
    },
    {
      title: 'Dream Interpretation',
      description: 'Explore the symbolism and meaning within your dreams',
      href: '/oracle/dreams',
      icon: '/icons/dreamIcon.svg',
      color: 'from-indigo-500/20 to-violet-500/20',
      premium: false,
      feature: 'dream' as UsageFeature,
    },
  ];

  return (
    <MainLayout headerTitle="Oracle">
      <div className="min-h-screen bg-background pb-20 lg:pb-8">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="container mx-auto px-4 py-8"
        >
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <motion.div variants={staggerItem} className="mb-12 text-center">
              <h2 className="text-4xl font-serif mb-4 text-primary">
                Choose Your Oracle
              </h2>
              <p className="text-secondary text-lg max-w-2xl mx-auto">
                Connect with ancient wisdom through divination. Each oracle offers unique insights
                into your questions and life path.
              </p>
            </motion.div>

            {/* Oracle Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {oracles.map((oracle, index) => (
                <motion.div key={oracle.href} variants={staggerItem}>
                  <Link href={oracle.href}>
                    <Card
                      variant="outlined"
                      className="p-8 transition-all cursor-pointer h-full group relative overflow-hidden"
                    >
                      {/* Top-right indicators */}
                      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                        {oracle.premium && <Badge variant="warning">Premium</Badge>}
                        {subscriptionState && remainingUsage[oracle.feature] !== undefined && (
                          <UsageIndicator
                            remaining={remainingUsage[oracle.feature]}
                            feature={oracle.title}
                          />
                        )}
                      </div>

                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${oracle.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                      />

                      <div className="relative z-10">
                        <div className="mb-6 flex justify-center transform group-hover:scale-110 transition-transform duration-300">
                          <Image
                            src={oracle.icon}
                            alt={`${oracle.title} icon`}
                            width={80}
                            height={80}
                            className="w-20 h-20"
                          />
                        </div>
                        <h3 className="text-2xl font-serif mb-3 text-center text-gold transition-colors">
                          {oracle.title}
                        </h3>
                        <p className="text-white/50 text-center text-sm leading-relaxed">
                          {oracle.description}
                        </p>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Quantum RNG Info */}
            <motion.div
              variants={staggerItem}
              className="bg-card border border-border rounded-lg p-6 max-w-2xl mx-auto"
            >
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm  text-white mb-2">
                    Quantum Random Number Generator
                  </h3>
                  <p className="text-sm text-secondary leading-relaxed">
                    Our oracle systems use quantum random number generation to ensure truly random
                    outcomes, providing authentic divination experiences free from algorithmic bias.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* How to Use */}
            <motion.div
              variants={staggerItem}
              className="mt-12 text-center text-sm text-secondary"
            >
              <p>
                Choose an oracle method that resonates with you. Set your intention clearly, then
                allow the cosmic energies to guide your reading.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
}
