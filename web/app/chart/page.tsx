'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import Image from 'next/image';
import { MainLayout } from '@/components/layout';
import { useAppStore } from '@/store';
import { fadeInUp, transitions } from '@/lib/animations';
import { TableView } from '@/components/chart/TableView';
import { InterpretationView } from '@/components/chart/InterpretationView';
import { PlanetDetailModal } from '@/components/chart/PlanetDetailModal';
import { cn } from '@/lib/utils';

type TabId = 'interp' | 'table' | 'wheel';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'interp', label: 'INTERP.' },
  { id: 'table', label: 'TABLE' },
  { id: 'wheel', label: 'WHEEL' },
];

export default function ChartPage() {
  const { birthData, natalChart } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabId>('table');
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);

  const zodiacSigns = [
    { name: 'Aries', symbol: '♈' },
    { name: 'Taurus', symbol: '♉' },
    { name: 'Gemini', symbol: '♊' },
    { name: 'Cancer', symbol: '♋' },
    { name: 'Leo', symbol: '♌' },
    { name: 'Virgo', symbol: '♍' },
    { name: 'Libra', symbol: '♎' },
    { name: 'Scorpio', symbol: '♏' },
    { name: 'Sagittarius', symbol: '♐' },
    { name: 'Capricorn', symbol: '♑' },
    { name: 'Aquarius', symbol: '♒' },
    { name: 'Pisces', symbol: '♓' },
  ];

  return (
    <MainLayout headerTitle="Natal Chart" showBack>
      <div className="min-h-screen bg-background pb-20 lg:pb-8">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={transitions.spring}
            className="max-w-6xl mx-auto"
          >
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 mb-6">
                <Image
                  src="/icons/natalIcon.svg"
                  alt="Natal Chart"
                  width={80}
                  height={80}
                  className="text-primary"
                />
              </div>
              <h2 className="text-4xl font-serif mb-4 text-primary">Your Natal Chart</h2>
              <p className="text-secondary text-lg max-w-2xl mx-auto">
                Your birth chart is a snapshot of the sky at the moment you were born,
                revealing your unique cosmic blueprint
              </p>
              {birthData && (
                <p className="text-sm text-secondary mt-3">
                  {new Date(birthData.birthDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}{' '}
                  at {birthData.birthTime} • {birthData.birthLocation?.name}
                </p>
              )}
            </div>

            {/* Tab Navigation */}
            {natalChart && (
              <>
                <div className="flex gap-8 border-b-2 border-border mb-8">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'pb-3 text-sm tracking-wider transition-colors relative',
                        activeTab === tab.id
                          ? 'text-primary'
                          : 'text-secondary hover:text-white'
                      )}
                    >
                      {tab.label}
                      {activeTab === tab.id && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="min-h-[600px]">
                  {activeTab === 'table' && (
                    <motion.div
                      key="table"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <TableView
                        chartData={natalChart}
                        onPlanetClick={(planetKey) => setSelectedPlanet(planetKey)}
                      />
                    </motion.div>
                  )}

                  {activeTab === 'interp' && (
                    <motion.div
                      key="interp"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <InterpretationView chartData={natalChart} />
                    </motion.div>
                  )}

                  {activeTab === 'wheel' && (
                    <motion.div
                      key="wheel"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="bg-card border border-border rounded-lg p-12"
                    >
                      <div className="aspect-square max-w-xl mx-auto bg-surface/30 rounded-full border-2 border-primary/20 relative flex items-center justify-center">
                        {/* Zodiac wheel placeholder */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-full h-full relative">
                            {/* Placeholder zodiac symbols in circle */}
                            {zodiacSigns.map((sign, index) => {
                              const angle = (index * 30 - 90) * (Math.PI / 180);
                              const radius = 45; // percentage
                              const x = 50 + radius * Math.cos(angle);
                              const y = 50 + radius * Math.sin(angle);

                              return (
                                <div
                                  key={sign.name}
                                  className="absolute text-2xl text-primary/50"
                                  style={{
                                    left: `${x}%`,
                                    top: `${y}%`,
                                    transform: 'translate(-50%, -50%)',
                                  }}
                                >
                                  {sign.symbol}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Center content */}
                        <div className="relative z-10 text-center">
                          <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
                          <p className="text-white text-lg mb-2">
                            Interactive Chart
                          </p>
                          <p className="text-secondary text-sm">Coming Soon</p>
                        </div>
                      </div>

                      <div className="mt-8 text-center">
                        <p className="text-secondary text-sm">
                          Full SVG natal chart wheel with houses, aspects, and interactive
                          elements
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Planet Detail Modal */}
                <PlanetDetailModal
                  isOpen={selectedPlanet !== null}
                  onClose={() => setSelectedPlanet(null)}
                  planetKey={selectedPlanet}
                  chartData={natalChart}
                />
              </>
            )}

            {/* No Chart Data - Show Placeholder */}
            {!natalChart && (
              <div className="bg-card border border-border rounded-lg p-12 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 mb-6">
                  <Image
                    src="/icons/natalIcon.svg"
                    alt="Natal Chart"
                    width={80}
                    height={80}
                  />
                </div>
                <h3 className="text-2xl mb-3 text-white font-serif">
                  No Chart Data Available
                </h3>
                <p className="text-secondary max-w-md mx-auto">
                  Please generate your natal chart from the dashboard to view your cosmic
                  blueprint.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
