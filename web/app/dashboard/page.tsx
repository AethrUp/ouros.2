'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store';
import { MainLayout } from '@/components/layout';
import { Button, LoadingScreen } from '@/components/ui';
import { TransitEffectivenessGraph, CosmicWeatherChart } from '@/components/charts';
import { staggerContainer, staggerItem, fadeInUp } from '@/lib/animations';
import { Sparkles, BookOpen, Users, UserPlus, Star } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, birthData, natalChart } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (isAuthenticated && !birthData) {
      router.push('/onboarding');
      return;
    }
    setIsLoading(false);
  }, [isAuthenticated, birthData, router]);

  if (isLoading || !isAuthenticated || !user) {
    return <LoadingScreen context="dashboard" />;
  }

  // Mock data for demonstration (TODO: Replace with real data from horoscope generation)
  const mockHoroscope = {
    preview: {
      title: 'A Day of Cosmic Balance',
      summary:
        'Today brings harmonious energy as Venus trines your natal Jupiter. Your natural charm is amplified, making it an excellent time for social connections and creative pursuits. The Moon\'s position suggests heightened intuition - trust your instincts in decision-making.',
      weather: {
        moon: {
          description: 'Emotional clarity and intuitive insights flow freely today',
          aspects: {
            emotions: 75,
            intuition: 85,
            comfort: 60,
          },
        },
        venus: {
          description: 'Love and beauty surround you with grace and ease',
          aspects: {
            love: 80,
            beauty: 70,
            pleasure: 75,
          },
        },
        mercury: {
          description: 'Communication flows smoothly, ideas come quickly',
          aspects: {
            communication: 65,
            thinking: 70,
            movement: 60,
          },
        },
      },
    },
    fullContent: {
      transitAnalysis: {
        primary: {
          planet: 'Venus',
          natalPlanet: 'Jupiter',
          aspectType: 'Trine',
          timingData: {
            strengthCurve: [
              20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75,
              80, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35,
            ],
          },
        },
        secondary: [
          {
            planet: 'Mercury',
            natalPlanet: 'Sun',
            aspectType: 'Sextile',
            timingData: {
              strengthCurve: [
                30, 32, 35, 38, 42, 45, 48, 52, 55, 58, 60, 62,
                64, 65, 63, 60, 57, 54, 50, 47, 44, 40, 37, 33,
              ],
            },
          },
        ],
      },
    },
  };

  const quickActions = [
    {
      title: 'Tarot Reading',
      description: 'Draw cards for guidance',
      href: '/oracle/tarot',
      icon: '🃏',
    },
    {
      title: 'I Ching',
      description: 'Cast coins for wisdom',
      href: '/oracle/iching',
      icon: '☯️',
    },
    {
      title: 'Dream Journal',
      description: 'Record your dreams',
      href: '/oracle/dreams',
      icon: '🌙',
    },
    {
      title: 'Natal Chart',
      description: 'View your chart',
      href: '/chart',
      icon: '⭐',
    },
  ];

  // Mock journal prompts
  const journalPrompts = [
    'What intentions are you setting under today\'s cosmic energy?',
    'How can you harness Venus\'s harmonious trine to deepen your relationships?',
    'What creative projects feel aligned with your current planetary transits?',
  ];

  return (
    <MainLayout>
      <div className="min-h-screen bg-background pb-20 lg:pb-8">
        {/* Hero Section with Horoscope Preview */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-6 px-4 pt-6"
        >
          {/* Main Horoscope Card */}
          <motion.div variants={staggerItem} className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold mb-1">{mockHoroscope.preview.title}</h1>
                <p className="text-sm text-secondary">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              {natalChart?.planets?.sun?.sign && (
                <div className="text-4xl">{getZodiacEmoji(natalChart.planets.sun.sign)}</div>
              )}
            </div>

            <p className="text-white leading-relaxed mb-6">{mockHoroscope.preview.summary}</p>

            <Button variant="primary" onClick={() => router.push('/horoscope')} className="w-full">
              Read Full Horoscope
            </Button>
          </motion.div>

          {/* Today's Transits */}
          {mockHoroscope.fullContent?.transitAnalysis && (
            <motion.div variants={staggerItem}>
              <div className="px-4">
                <h2 className="text-sm font-semibold tracking-wider text-secondary mb-3">
                  TODAY'S TRANSITS
                </h2>
              </div>
              <TransitEffectivenessGraph
                transits={[
                  mockHoroscope.fullContent.transitAnalysis.primary,
                  ...(mockHoroscope.fullContent.transitAnalysis.secondary || []),
                ]}
                maxTransits={3}
                className="mx-4"
              />
            </motion.div>
          )}

          {/* Cosmic Weather Chart */}
          {mockHoroscope.preview?.weather && (
            <motion.div variants={staggerItem}>
              <div className="px-4">
                <h2 className="text-sm font-semibold tracking-wider text-secondary mb-3">
                  COSMIC WEATHER
                </h2>
              </div>
              <CosmicWeatherChart weather={mockHoroscope.preview.weather} className="mx-4" />
            </motion.div>
          )}

          {/* Journal Prompts */}
          <motion.div variants={staggerItem} className="px-4">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="w-5 h-5 text-primary" />
                <h2 className="text-sm font-semibold tracking-wider text-secondary">
                  JOURNAL PROMPTS
                </h2>
              </div>
              <div className="space-y-4">
                {journalPrompts.slice(0, 2).map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => router.push(`/journal?prompt=${encodeURIComponent(prompt)}`)}
                    className="w-full text-left p-4 bg-surface rounded-lg hover:bg-surface/80 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                      <p className="text-sm text-white group-hover:text-primary transition-colors">
                        {prompt}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              <Button
                variant="ghost"
                onClick={() => router.push('/journal')}
                className="w-full mt-4"
              >
                View All Prompts
              </Button>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={staggerItem} className="px-4">
            <h2 className="text-sm font-semibold tracking-wider text-secondary mb-3">
              QUICK ACTIONS
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="bg-card border border-border rounded-lg p-4 hover:border-primary transition-colors group text-center"
                >
                  <div className="text-3xl mb-2">{action.icon}</div>
                  <h3 className="text-sm font-medium mb-1 group-hover:text-primary transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-xs text-secondary">{action.description}</p>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Friends & Synastry Placeholder */}
          <motion.div variants={staggerItem} className="px-4 pb-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-5 h-5 text-primary" />
                <h2 className="text-sm font-semibold tracking-wider text-secondary">
                  SYNASTRY READINGS
                </h2>
              </div>
              <p className="text-sm text-secondary mb-4">
                Connect with friends to explore your astrological compatibility
              </p>
              <Button
                variant="secondary"
                onClick={() => router.push('/friends')}
                className="w-full flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Invite Friend
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </MainLayout>
  );
}

// Helper function to get zodiac emoji
function getZodiacEmoji(sign: string): string {
  const emojis: Record<string, string> = {
    aries: '♈',
    taurus: '♉',
    gemini: '♊',
    cancer: '♋',
    leo: '♌',
    virgo: '♍',
    libra: '♎',
    scorpio: '♏',
    sagittarius: '♐',
    capricorn: '♑',
    aquarius: '♒',
    pisces: '♓',
  };
  return emojis[sign.toLowerCase()] || '⭐';
}
