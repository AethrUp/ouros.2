'use client';

import { motion } from 'framer-motion';
import { Star, Sparkles, RotateCcw } from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui';
import { useAppStore } from '@/store';
import { fadeInUp, transitions } from '@/lib/animations';

export default function ChartPage() {
  const { birthData, natalChart } = useAppStore();

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
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                <Star className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-4xl font-bold font-serif mb-4 text-primary">Your Natal Chart</h2>
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

            {/* Display chart data if available */}
            {natalChart && (
              <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Planets */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-4">Planetary Positions</h3>
                  <div className="space-y-3">
                    {Object.entries(natalChart.planets).map(([planetName, planet]) => (
                      <div key={planetName} className="flex items-center justify-between border-b border-border/50 pb-2">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold capitalize text-primary">{planetName}</span>
                          {planet.retrograde && <span className="text-xs text-secondary">(R)</span>}
                        </div>
                        <div className="text-right">
                          <div className="font-medium capitalize">{planet.sign} {planet.degree.toFixed(2)}°</div>
                          <div className="text-xs text-secondary">House {planet.house}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Houses */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-4">House Cusps</h3>
                  <div className="space-y-3">
                    {natalChart.houses.map((house) => (
                      <div key={house.house} className="flex items-center justify-between border-b border-border/50 pb-2">
                        <span className="font-semibold text-primary">House {house.house}</span>
                        <div className="text-right">
                          <div className="font-medium capitalize">{house.sign} {house.degree.toFixed(2)}°</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Angles */}
                <div className="bg-card border border-border rounded-lg p-6 md:col-span-2">
                  <h3 className="text-xl font-bold mb-4">Chart Angles</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-surface rounded-lg">
                      <div className="text-sm text-secondary mb-1">Ascendant</div>
                      <div className="text-lg font-bold text-primary">{natalChart.angles.ascendant.toFixed(2)}°</div>
                    </div>
                    <div className="text-center p-4 bg-surface rounded-lg">
                      <div className="text-sm text-secondary mb-1">Midheaven</div>
                      <div className="text-lg font-bold text-primary">{natalChart.angles.midheaven.toFixed(2)}°</div>
                    </div>
                    <div className="text-center p-4 bg-surface rounded-lg">
                      <div className="text-sm text-secondary mb-1">Descendant</div>
                      <div className="text-lg font-bold text-primary">{natalChart.angles.descendant.toFixed(2)}°</div>
                    </div>
                    <div className="text-center p-4 bg-surface rounded-lg">
                      <div className="text-sm text-secondary mb-1">Imum Coeli</div>
                      <div className="text-lg font-bold text-primary">{natalChart.angles.imumCoeli.toFixed(2)}°</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Chart Placeholder */}
            <div className="bg-card border border-border rounded-lg p-12 mb-8">
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
                  <p className="text-white text-lg font-semibold mb-2">Interactive Chart</p>
                  <p className="text-secondary text-sm">Coming Soon</p>
                </div>
              </div>

              <div className="mt-8 text-center">
                <p className="text-secondary text-sm">
                  Full SVG natal chart wheel with houses, aspects, and interactive elements
                </p>
              </div>
            </div>

            {/* Coming Soon Features */}
            <div className="bg-card border border-border rounded-lg p-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-3">Full Chart Experience Coming Soon</h3>
                <p className="text-secondary text-sm max-w-2xl mx-auto">
                  We're building a comprehensive natal chart visualization with all the features
                  you need for deep astrological analysis.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-white">Chart Features:</h4>
                  <ul className="text-sm text-secondary space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Interactive SVG chart wheel</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>12 houses with detailed meanings</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Major and minor aspects visualization</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Planet and sign interpretations</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-white">Advanced Features:</h4>
                  <ul className="text-sm text-secondary space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Clickable planets for detailed info</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Transit overlay (current vs natal)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Progressions and solar returns</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Export and share your chart</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* CTA */}
              <div className="pt-6 text-center">
                <Button
                  variant="ghost"
                  onClick={() => window.history.back()}
                  className="flex items-center justify-center gap-2 mx-auto"
                >
                  <RotateCcw className="w-4 h-4" />
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
