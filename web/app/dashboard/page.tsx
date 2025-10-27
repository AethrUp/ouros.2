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
import { ArrowRight, BookOpen, Users, UserPlus } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, birthData, natalChart, dailyHoroscope, isGeneratingHoroscope, generateHoroscope, profile } = useAppStore();
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

  // Auto-generate horoscope if needed
  useEffect(() => {
    const checkAndGenerateHoroscope = async () => {
      if (!natalChart || !user || !birthData) return;

      const today = new Date().toISOString().split('T')[0];
      const hasHoroscopeForToday = dailyHoroscope && dailyHoroscope.date === today;

      if (!hasHoroscopeForToday && !isGeneratingHoroscope) {
        try {
          const userProfile = {
            id: user.id,
            email: user.email,
            birthDate: birthData.birthDate,
            birthTime: birthData.birthTime,
            birthLocation: birthData.birthLocation,
            selectedCategories: (profile as any)?.selectedCategories || [],
          };
          await generateHoroscope(natalChart, userProfile);
        } catch (error) {
          console.error('Failed to generate horoscope:', error);
        }
      }
    };

    if (!isLoading) {
      checkAndGenerateHoroscope();
    }
  }, [natalChart, user, dailyHoroscope, isGeneratingHoroscope, birthData, profile, generateHoroscope, isLoading]);

  if (isLoading || !isAuthenticated || !user) {
    return <LoadingScreen context="dashboard" />;
  }

  // Use real horoscope data or fallback to default
  const horoscopeData = dailyHoroscope || {
    preview: {
      title: 'Your Daily Horoscope',
      summary: 'Generate your personalized horoscope to see today\'s cosmic insights.',
      weather: null,
    },
    content: {
      summary: 'Generate your personalized horoscope to see today\'s cosmic insights.',
    },
    fullContent: {
      transitAnalysis: null,
    },
  };

  const quickActions = [
    {
      title: 'Tarot Reading',
      description: 'Draw cards for guidance',
      href: '/oracle/tarot',
      iconPath: '/icons/tarotIcon.svg',
      color: 'from-purple-500/20 to-pink-500/20',
    },
    {
      title: 'I Ching',
      description: 'Cast coins for wisdom',
      href: '/oracle/iching',
      iconPath: '/icons/ichingIcon.svg',
      color: 'from-blue-500/20 to-cyan-500/20',
    },
    {
      title: 'Dream Journal',
      description: 'Record your dreams',
      href: '/oracle/dreams',
      iconPath: '/icons/dreamIcon.svg',
      color: 'from-indigo-500/20 to-violet-500/20',
    },
    {
      title: 'Natal Chart',
      description: 'View your chart',
      href: '/chart',
      iconPath: '/icons/natalIcon.svg',
      color: 'from-amber-500/20 to-orange-500/20',
    },
  ];

  // Journal prompts - use from horoscope or default
  const journalPrompts = (dailyHoroscope?.fullContent as any)?.spiritualGuidance?.journalPrompts || [
    'What intentions are you setting under today\'s cosmic energy?',
    'How are the current planetary transits influencing your daily life?',
    'What creative projects feel aligned with your current energy?',
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
                <h1 className="text-2xl font-serif text-primary mb-1">{horoscopeData.preview?.title || 'Your Daily Horoscope'}</h1>
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

            <p className="text-white leading-relaxed mb-6 text-sm">
              {horoscopeData.preview?.summary || horoscopeData.content?.summary || 'Loading your personalized horoscope...'}
            </p>

            <Button variant="primary" onClick={() => router.push('/horoscope')} className="w-full">
              Read Full Horoscope
            </Button>
          </motion.div>

          {/* Transits & Cosmic Weather - Side by side on desktop */}
          {(horoscopeData.fullContent?.transitAnalysis || horoscopeData.preview?.weather) && (
            <motion.div variants={staggerItem}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Today's Transits */}
                {horoscopeData.fullContent?.transitAnalysis && (
                  <div className="flex flex-col">
                    <h3 className="section-title mb-3">Today's Transits</h3>
                    <div className="flex-1">
                      <TransitEffectivenessGraph
                        transits={[
                          horoscopeData.fullContent.transitAnalysis.primary,
                          ...(horoscopeData.fullContent.transitAnalysis.secondary || []),
                        ].filter(Boolean)}
                        maxTransits={3}
                      />
                    </div>
                  </div>
                )}

                {/* Cosmic Weather Chart */}
                {horoscopeData.preview?.weather && (
                  <div className="flex flex-col">
                    <h3 className="section-title mb-3">Cosmic Weather</h3>
                    <div className="flex-1">
                      <CosmicWeatherChart weather={horoscopeData.preview.weather} />
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          )}

          {/* Journal Prompts */}
          <motion.div variants={staggerItem}>
            <h3 className="section-title mb-3">Journal Prompts</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {journalPrompts.map((prompt: string, index: number) => (
                <div key={index} className="journal-card flex flex-col">
                  <p className="text-sm text-white mb-4 flex-1">
                    {prompt}
                  </p>
                  <button
                    onClick={() => {
                      const today = new Date().toISOString().split('T')[0];
                      const params = new URLSearchParams({
                        prompt,
                        type: 'horoscope',
                        readingId: `horoscope-${today}`,
                        title: 'Horoscope Reflection',
                      });
                      router.push(`/journal?${params.toString()}`);
                    }}
                    className="flex items-center gap-2 text-white text-xs font-normal uppercase tracking-wider underline hover:text-primary transition-colors self-start"
                  >
                    START WRITING
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={staggerItem}>
            <h3 className="section-title mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="card p-4 transition-all group text-center relative overflow-hidden"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                  />
                  <div className="relative z-10">
                    <div className="flex items-center justify-center mb-3 transform group-hover:scale-110 transition-transform duration-300">
                      <Image
                        src={action.iconPath}
                        alt={action.title}
                        width={48}
                        height={48}
                      />
                    </div>
                    <h4 className="font-serif mb-1 transition-colors">
                      {action.title}
                    </h4>
                    <p className="text-xs text-secondary">{action.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Friends & Synastry Placeholder */}
          <motion.div variants={staggerItem} className="pb-6">
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-5 h-5 text-primary" />
                <h3 className="section-title">Synastry Readings</h3>
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
