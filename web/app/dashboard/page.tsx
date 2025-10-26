'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store';
import { MainLayout } from '@/components/layout';
import { Button, LoadingScreen } from '@/components/ui';
import { TransitEffectivenessGraph, CosmicWeatherChart } from '@/components/charts';
import { staggerContainer, staggerItem, fadeInUp } from '@/lib/animations';
import { Sparkles, BookOpen, Users, UserPlus } from 'lucide-react';

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
      iconPath: '/icons/tarotIcon.svg',
    },
    {
      title: 'I Ching',
      description: 'Cast coins for wisdom',
      href: '/oracle/iching',
      iconPath: '/icons/ichingIcon.svg',
    },
    {
      title: 'Dream Journal',
      description: 'Record your dreams',
      href: '/oracle/dreams',
      iconPath: '/icons/dreamIcon.svg',
    },
    {
      title: 'Natal Chart',
      description: 'View your chart',
      href: '/chart',
      iconPath: '/icons/natalIcon.svg',
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
          className="space-y-6 px-4 pt-6 max-w-4xl mx-auto"
        >
          {/* Main Horoscope Card */}
          <motion.div variants={staggerItem} className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="mb-1">{mockHoroscope.preview.title}</h2>
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

            <p className="text-white leading-relaxed mb-6 text-sm">{mockHoroscope.preview.summary}</p>

            <Button variant="primary" onClick={() => router.push('/horoscope')} className="w-full">
              Read Full Horoscope
            </Button>
          </motion.div>

          {/* Transits & Cosmic Weather - Side by side on desktop */}
          {(mockHoroscope.fullContent?.transitAnalysis || mockHoroscope.preview?.weather) && (
            <motion.div variants={staggerItem}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Today's Transits */}
                {mockHoroscope.fullContent?.transitAnalysis && (
                  <div className="flex flex-col">
                    <h3 className="mb-3">Today's Transits</h3>
                    <div className="flex-1">
                      <TransitEffectivenessGraph
                        transits={[
                          mockHoroscope.fullContent.transitAnalysis.primary,
                          ...(mockHoroscope.fullContent.transitAnalysis.secondary || []),
                        ]}
                        maxTransits={3}
                      />
                    </div>
                  </div>
                )}

                {/* Cosmic Weather Chart */}
                {mockHoroscope.preview?.weather && (
                  <div className="flex flex-col">
                    <h3 className="mb-3">Cosmic Weather</h3>
                    <div className="flex-1">
                      <CosmicWeatherChart weather={mockHoroscope.preview.weather} />
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          )}

          {/* Journal Prompts */}
          <motion.div variants={staggerItem}>
            <h3 className="mb-3">Journal Prompts</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {journalPrompts.map((prompt, index) => (
                <div key={index} className="card p-4 flex flex-col">
                  <div className="flex items-start gap-3 mb-4 flex-1">
                    <Sparkles className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <p className="text-sm text-white">
                      {prompt}
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="small"
                    onClick={() => router.push(`/journal?prompt=${encodeURIComponent(prompt)}`)}
                    className="w-full"
                  >
                    START WRITING
                  </Button>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={staggerItem}>
            <h3 className="mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="card p-4 hover:border-primary transition-colors group text-center"
                >
                  <div className="flex items-center justify-center mb-3">
                    <Image
                      src={action.iconPath}
                      alt={action.title}
                      width={48}
                      height={48}
                      className="group-hover:scale-110 transition-transform"
                    />
                  </div>
                  <p className="text-sm mb-1 group-hover:text-primary transition-colors">
                    {action.title}
                  </p>
                  <p className="text-xs text-secondary">{action.description}</p>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Friends & Synastry Placeholder */}
          <motion.div variants={staggerItem} className="pb-6">
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-5 h-5 text-primary" />
                <h3>Synastry Readings</h3>
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
