'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Calendar, RefreshCw, Loader2, Heart,
  Sun, Sunrise, Sunset, Moon, TrendingUp, Brain, Smile, Target, AlertCircle,
  Book, Flower2
} from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui';
import { useAppStore } from '@/store';
import { fadeInUp, transitions, staggerContainer, staggerItem } from '@/lib/animations';

// Category icon mappings
const categoryIcons: Record<string, any> = {
  love: Heart,
  career: Target,
  health: Heart,
  family: Heart,
  friendship: Heart,
  travel: Target,
  creativity: Sparkles,
  spirituality: Flower2,
  education: Book,
  finance: TrendingUp,
  personal: Target,
  social: Heart,
};

export default function HoroscopePage() {
  const { natalChart, birthData, profile, user, dailyHoroscope, isGeneratingHoroscope, generateHoroscope } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('main');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Auto-generate horoscope on page load
  useEffect(() => {
    const checkAndGenerateHoroscope = async () => {
      if (!natalChart || !user) return;

      const today = new Date().toISOString().split('T')[0];
      const hasHoroscopeForToday = dailyHoroscope && dailyHoroscope.date === today;

      if (!hasHoroscopeForToday && !isGeneratingHoroscope) {
        setIsLoading(true);
        try {
          const userProfile = {
            id: user.id,
            email: user.email,
            birthDate: birthData?.birthDate,
            birthTime: birthData?.birthTime,
            birthLocation: birthData?.birthLocation,
            selectedCategories: (profile as any)?.selectedCategories || [],
          };
          await generateHoroscope(natalChart, userProfile);
        } catch (error) {
          console.error('Failed to generate horoscope:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    checkAndGenerateHoroscope();
  }, [natalChart, user, dailyHoroscope, isGeneratingHoroscope, birthData, profile, generateHoroscope]);

  // Set first category as active
  useEffect(() => {
    const selectedCategories = (profile as any)?.selectedCategories || [];
    if (selectedCategories.length > 0 && !activeCategory) {
      setActiveCategory(selectedCategories[0]);
    }
  }, [profile, activeCategory]);

  const handleRefresh = async () => {
    if (!natalChart || !user || !birthData) return;

    setIsLoading(true);
    try {
      const userProfile = {
        id: user.id,
        email: user.email,
        birthDate: birthData.birthDate,
        birthTime: birthData.birthTime,
        birthLocation: birthData.birthLocation,
        selectedCategories: (profile as any)?.selectedCategories || [],
      };
      await generateHoroscope(natalChart, userProfile, { forceRegenerate: true });
    } catch (error) {
      console.error('Failed to regenerate horoscope:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Build dynamic tabs based on available data
  const buildTabs = () => {
    const tabs: Array<{ id: string; label: string }> = [];
    const fullContent = (dailyHoroscope?.fullContent || {}) as any;
    const transitAnalysis = fullContent.transitAnalysis;

    tabs.push({ id: 'main', label: 'OVERVIEW' });
    tabs.push({ id: 'morning', label: 'MORNING' });
    tabs.push({ id: 'afternoon', label: 'AFTERNOON' });
    tabs.push({ id: 'evening', label: 'EVENING' });

    if (transitAnalysis?.primary || transitAnalysis?.secondary?.length > 0) {
      tabs.push({ id: 'transits', label: 'TRANSITS' });
    }

    if (fullContent.transitInsights?.length > 0) {
      tabs.push({ id: 'insights', label: 'INSIGHTS' });
    }

    if (fullContent.dailyFocus || fullContent.explore?.length > 0 || fullContent.limit?.length > 0) {
      tabs.push({ id: 'guidance', label: 'GUIDANCE' });
    }

    if (fullContent.spiritualGuidance) {
      tabs.push({ id: 'spiritual', label: 'SPIRITUAL' });
    }

    const selectedCategories = (profile as any)?.selectedCategories || [];
    if (selectedCategories.length > 0) {
      tabs.push({ id: 'categories', label: 'CATEGORIES' });
    }

    return tabs;
  };

  // Loading state
  if (isLoading || isGeneratingHoroscope) {
    return (
      <MainLayout headerTitle="Daily Horoscope" showBack>
        <div className="min-h-screen bg-background pb-20 lg:pb-8 flex items-center justify-center">
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={transitions.spring}
            className="text-center"
          >
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <h3 className="text-xl  mb-2">Generating Your Daily Horoscope</h3>
            <p className="text-secondary">Analyzing transits and creating personalized insights...</p>
          </motion.div>
        </div>
      </MainLayout>
    );
  }

  // No natal chart state
  if (!natalChart) {
    return (
      <MainLayout headerTitle="Daily Horoscope" showBack>
        <div className="min-h-screen bg-background pb-20 lg:pb-8">
          <div className="container mx-auto px-4 py-8">
            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={transitions.spring}
              className="max-w-4xl mx-auto text-center"
            >
              <div className="bg-card border border-border rounded-lg p-12">
                <Calendar className="w-16 h-16 text-primary mx-auto mb-6" />
                <h3 className="text-2xl  mb-3">Complete Your Profile First</h3>
                <p className="text-secondary max-w-lg mx-auto leading-relaxed mb-6">
                  To generate your personalized daily horoscope, we need your natal chart.
                  Please complete your birth information in the onboarding flow.
                </p>
                <Button onClick={() => window.location.href = '/onboarding'}>
                  Complete Onboarding
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // No horoscope yet
  if (!dailyHoroscope) {
    return (
      <MainLayout headerTitle="Daily Horoscope" showBack>
        <div className="min-h-screen bg-background pb-20 lg:pb-8">
          <div className="container mx-auto px-4 py-8">
            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={transitions.spring}
              className="max-w-4xl mx-auto text-center"
            >
              <div className="bg-card border border-border rounded-lg p-12">
                <Sparkles className="w-16 h-16 text-primary mx-auto mb-6" />
                <h3 className="text-2xl  mb-3">Ready to Generate Your Horoscope</h3>
                <p className="text-secondary max-w-lg mx-auto leading-relaxed mb-6">
                  Click below to generate your personalized daily horoscope based on current transits
                  and your natal chart.
                </p>
                <Button onClick={handleRefresh} disabled={isLoading}>
                  {isLoading ? 'Generating...' : 'Generate Horoscope'}
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </MainLayout>
    );
  }

  const { preview, fullContent, content } = dailyHoroscope;
  const tabs = buildTabs();

  return (
    <MainLayout headerTitle="Daily Horoscope" showBack>
      <div className="min-h-screen bg-background pb-20 lg:pb-8">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="max-w-6xl mx-auto"
          >
            {/* Header */}
            <motion.div variants={staggerItem} className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-serif text-primary">Daily Horoscope</h2>
                <p className="text-secondary mt-1">
                  {(() => {
                    const [year, month, day] = dailyHoroscope.date.split('-').map(Number);
                    const date = new Date(year, month - 1, day);
                    return date.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    });
                  })()}
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </motion.div>

            {/* Tab Navigation */}
            <motion.div variants={staggerItem} className="mb-6">
              <div className="flex items-center gap-6 overflow-x-auto pb-2 border-b border-border/30">
                {tabs.map((tab) => {
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative px-2 py-2 transition-all whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'text-white'
                          : 'text-white hover:text-white'
                      }`}
                      style={{ letterSpacing: '0.15em' }}
                    >
                      <span className="text-sm">{tab.label}</span>
                      {activeTab === tab.id && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'main' && <MainReadingTab fullContent={fullContent} preview={preview} content={content} />}
                {activeTab === 'morning' && <TimeTab timeKey="morning" fullContent={fullContent} />}
                {activeTab === 'afternoon' && <TimeTab timeKey="afternoon" fullContent={fullContent} />}
                {activeTab === 'evening' && <TimeTab timeKey="evening" fullContent={fullContent} />}
                {activeTab === 'transits' && <TransitsTab fullContent={fullContent} />}
                {activeTab === 'insights' && <InsightsTab fullContent={fullContent} />}
                {activeTab === 'guidance' && <GuidanceTab fullContent={fullContent} content={content} />}
                {activeTab === 'spiritual' && <SpiritualTab fullContent={fullContent} />}
                {activeTab === 'categories' && (
                  <CategoriesTab
                    dailyHoroscope={dailyHoroscope}
                    profile={profile}
                    activeCategory={activeCategory}
                    setActiveCategory={setActiveCategory}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}

// Main Reading Tab
function MainReadingTab({ fullContent, preview, content }: any) {
  const fullReading = fullContent?.fullReading;

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-3xl font-serif text-primary mb-4">{preview?.title || 'Daily Reading'}</h3>
        {fullReading?.introduction && (
          <p className="text-lg leading-relaxed mb-4">{fullReading.introduction}</p>
        )}
        {content?.summary && (
          <p className="leading-relaxed text-secondary">{content.summary}</p>
        )}
        {fullReading?.conclusion && (
          <p className="leading-relaxed text-secondary mt-4">{fullReading.conclusion}</p>
        )}
      </div>

      {/* Cosmic Weather */}
      {preview?.weather && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-3xl font-serif text-primary mb-4">Cosmic Weather</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {preview.weather.moon && (
              <div className="flex items-start gap-3 p-4 bg-surface rounded-lg">
                <span className="text-2xl text-primary flex-shrink-0">☽</span>
                <div>
                  <div className=" text-sm text-primary mb-1 uppercase tracking-wider">Moon</div>
                  <p className="text-sm text-secondary">
                    {typeof preview.weather.moon === 'string'
                      ? preview.weather.moon
                      : (preview.weather.moon as any).description || JSON.stringify(preview.weather.moon)}
                  </p>
                </div>
              </div>
            )}
            {preview.weather.venus && (
              <div className="flex items-start gap-3 p-4 bg-surface rounded-lg">
                <span className="text-2xl text-primary flex-shrink-0">♀</span>
                <div>
                  <div className=" text-sm text-primary mb-1 uppercase tracking-wider">Venus</div>
                  <p className="text-sm text-secondary">
                    {typeof preview.weather.venus === 'string'
                      ? preview.weather.venus
                      : (preview.weather.venus as any).description || JSON.stringify(preview.weather.venus)}
                  </p>
                </div>
              </div>
            )}
            {preview.weather.mercury && (
              <div className="flex items-start gap-3 p-4 bg-surface rounded-lg">
                <span className="text-2xl text-primary flex-shrink-0">☿</span>
                <div>
                  <div className=" text-sm text-primary mb-1 uppercase tracking-wider">Mercury</div>
                  <p className="text-sm text-secondary">
                    {typeof preview.weather.mercury === 'string'
                      ? preview.weather.mercury
                      : (preview.weather.mercury as any).description || JSON.stringify(preview.weather.mercury)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Time Tab (Morning/Afternoon/Evening)
function TimeTab({ timeKey, fullContent }: { timeKey: 'morning' | 'afternoon' | 'evening'; fullContent: any }) {
  const timeIndex = { morning: 0, afternoon: 1, evening: 2 }[timeKey];
  const timeLabels = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' };
  const fullReading = fullContent?.fullReading;
  const timeGuidance = fullContent?.timeGuidance?.[timeKey];
  const paragraph = fullReading?.bodyParagraphs?.[timeIndex];

  if (!paragraph) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <p className="text-secondary">No guidance available for this time period.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-3xl font-serif text-primary mb-4">{timeLabels[timeKey]}</h3>
        {timeGuidance?.energy && (
          <div className="inline-block px-3 py-1 bg-primary/20 rounded-full text-sm font-medium text-primary mb-4">
            Energy: {timeGuidance.energy}
          </div>
        )}
        <p className="leading-relaxed text-secondary">{paragraph}</p>
      </div>

      {/* Guidance Columns */}
      {timeGuidance && (timeGuidance.bestFor?.length > 0 || timeGuidance.avoid?.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {timeGuidance.bestFor?.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h4 className="text-xl font-serif text-green-400 mb-4">Best For</h4>
              <ul className="space-y-2">
                {timeGuidance.bestFor.map((item: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-secondary">
                    <span className="text-green-400">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {timeGuidance.avoid?.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h4 className="text-xl font-serif text-orange-400 mb-4">Avoid</h4>
              <ul className="space-y-2">
                {timeGuidance.avoid.map((item: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-secondary">
                    <span className="text-orange-400">!</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Transits Tab
function TransitsTab({ fullContent }: any) {
  const transitAnalysis = fullContent?.transitAnalysis;
  const allTransits = [];

  if (transitAnalysis?.primary) {
    allTransits.push({ transit: transitAnalysis.primary, number: 1 });
  }
  if (transitAnalysis?.secondary) {
    transitAnalysis.secondary.forEach((transit: any, index: number) => {
      allTransits.push({ transit, number: index + 2 });
    });
  }

  if (allTransits.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <p className="text-secondary">No transit data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {allTransits.map(({ transit, number }) => (
        <div key={number} className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-3xl font-serif text-primary">Transit {number}</h3>
            {transit.timing && (
              <span className="text-sm text-secondary italic">{transit.timing}</span>
            )}
          </div>

          {/* Transit Timeline */}
          {transit.timingData?.strengthCurve && transit.timingData.strengthCurve.length > 0 && (
            <TransitTimeline transit={transit} />
          )}

          <h4 className="text-lg font-medium mb-2 text-primary">{transit.aspect}</h4>
          <p className="leading-relaxed text-secondary mb-4">{transit.interpretation}</p>
          {transit.advice && (
            <div className="bg-surface rounded-lg p-4">
              <p className="text-sm text-secondary">{transit.advice}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Transit Timeline Component
function TransitTimeline({ transit }: any) {
  const strengthCurve = transit.timingData?.strengthCurve || [];
  if (strengthCurve.length === 0) return null;

  const minStrength = Math.min(...strengthCurve);
  const maxStrength = Math.max(...strengthCurve);
  const range = maxStrength - minStrength;

  const width = 600;
  const height = 80;
  const padding = 8;

  const points = strengthCurve
    .map((strength: number, index: number) => {
      const x = (index / (strengthCurve.length - 1)) * width;
      const normalizedStrength = range > 0 ? (strength - minStrength) / range : 0.5;
      const availableHeight = height - (padding * 2);
      const y = height - padding - (normalizedStrength * availableHeight);
      return `${x},${y}`;
    })
    .join(' ');

  const timeIcons = [
    { hour: 0, icon: Moon, label: '12AM', x: 0 },
    { hour: 6, icon: Sunrise, label: '6AM', x: width * 0.25 },
    { hour: 12, icon: Sun, label: '12PM', x: width * 0.5 },
    { hour: 18, icon: Sunset, label: '6PM', x: width * 0.75 },
  ];

  return (
    <div className="my-4">
      <div className="flex justify-between mb-2 px-2">
        {timeIcons.map((time) => {
          const Icon = time.icon;
          return (
            <div key={time.hour} className="flex flex-col items-center">
              <Icon className="w-4 h-4 text-primary" />
            </div>
          );
        })}
      </div>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="w-full">
        <polyline
          points={points}
          fill="none"
          stroke="#F6D99F"
          strokeWidth="2"
          opacity="1"
        />
      </svg>
      <p className="text-xs text-secondary/50 text-center mt-2 tracking-wider">24 HOUR TRANSIT INFLUENCE</p>
    </div>
  );
}

// Insights Tab
function InsightsTab({ fullContent }: any) {
  const transitInsights = fullContent?.transitInsights || [];
  const categories = ['Energy', 'Influence', 'Emotion', 'Opportunities', 'Challenges'];
  const icons = [TrendingUp, Target, Smile, Sparkles, AlertCircle];

  if (transitInsights.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <p className="text-secondary">No insights available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transitInsights.map((insight: string, index: number) => {
        const Icon = icons[index] || Brain;
        return (
          <div key={index} className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-2xl font-serif text-primary mb-3">{categories[index] || 'Insight'}</h3>
            <p className="leading-relaxed text-secondary">{insight}</p>
          </div>
        );
      })}
    </div>
  );
}

// Guidance Tab
function GuidanceTab({ fullContent, content }: any) {
  const explore = fullContent?.explore || content?.explore || [];
  const limit = fullContent?.limit || content?.limit || [];
  const dailyFocus = fullContent?.dailyFocus || content?.dailyFocus;

  return (
    <div className="space-y-6">
      {dailyFocus && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-3xl font-serif text-primary mb-4">Today's Focus</h3>
          <p className="leading-relaxed text-secondary">{dailyFocus}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {explore.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-xl font-serif text-green-400 mb-4">Explore Today</h3>
            <ul className="space-y-2">
              {explore.map((item: string, index: number) => (
                <li key={index} className="flex items-start gap-2 text-secondary">
                  <span className="text-green-400">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {limit.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-xl font-serif text-orange-400 mb-4">Be Mindful Of</h3>
            <ul className="space-y-2">
              {limit.map((item: string, index: number) => (
                <li key={index} className="flex items-start gap-2 text-secondary">
                  <span className="text-orange-400">!</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// Spiritual Tab
function SpiritualTab({ fullContent }: any) {
  const spiritualGuidance = fullContent?.spiritualGuidance;

  if (!spiritualGuidance) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <p className="text-secondary">No spiritual guidance available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {spiritualGuidance.meditation && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-3xl font-serif text-primary mb-4">Meditation</h3>
          <p className="leading-relaxed text-secondary">{spiritualGuidance.meditation}</p>
        </div>
      )}

      {spiritualGuidance.affirmation && (
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-8 text-center">
          <h3 className="text-3xl font-serif text-primary mb-4">Daily Affirmation</h3>
          <p className="text-xl italic text-white leading-relaxed">"{spiritualGuidance.affirmation}"</p>
        </div>
      )}

      {spiritualGuidance.journalPrompts && spiritualGuidance.journalPrompts.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-3xl font-serif text-primary mb-4">Journal Prompts</h3>
          <p className="text-xs text-secondary mb-4 italic">Reflect on these questions in your journal</p>
          <ul className="space-y-3">
            {spiritualGuidance.journalPrompts.map((prompt: string, index: number) => (
              <li key={index} className="flex items-start gap-3 p-4 bg-surface rounded-lg">
                <Book className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-secondary">{prompt}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Categories Tab
function CategoriesTab({ dailyHoroscope, profile, activeCategory, setActiveCategory }: any) {
  const selectedCategories = (profile as any)?.selectedCategories || [];
  const allCategories = Object.keys(categoryIcons);
  const categoryAdvice = dailyHoroscope?.content?.categoryAdvice;

  return (
    <div className="space-y-6">
      {/* Category Navigation */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-3xl font-serif text-primary mb-4">Your Focus Areas</h3>
        <div className="flex flex-wrap gap-4">
          {allCategories.map((category) => {
            const isSelected = selectedCategories.includes(category);
            const isActive = activeCategory === category;
            const Icon = categoryIcons[category];

            return (
              <button
                key={category}
                onClick={() => isSelected && setActiveCategory(category)}
                disabled={!isSelected}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  isActive
                    ? 'bg-primary text-background'
                    : isSelected
                    ? 'bg-surface text-primary hover:bg-surface/80'
                    : 'bg-surface/30 text-secondary/30 cursor-not-allowed'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm  capitalize">{category}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Category Content */}
      {activeCategory && categoryAdvice && categoryAdvice[activeCategory] && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-3xl font-serif text-[#F6D99F] mb-4 capitalize">
            {categoryAdvice[activeCategory].title
              ? categoryAdvice[activeCategory].title.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim()
              : activeCategory}
          </h3>
          <p className="leading-relaxed text-secondary">{categoryAdvice[activeCategory].content}</p>
        </div>
      )}
    </div>
  );
}
