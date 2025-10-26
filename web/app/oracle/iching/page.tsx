'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, RotateCcw } from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui';
import { fadeInUp, transitions, staggerContainer, staggerItem } from '@/lib/animations';

export default function IChingPage() {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const methods = [
    {
      id: 'coins',
      name: 'Three Coin Method',
      description: 'Traditional coin casting for hexagram generation',
      icon: '🪙',
    },
    {
      id: 'yarrow',
      name: 'Yarrow Stalks',
      description: 'Ancient method using 50 stalks',
      icon: '🌾',
      premium: true,
    },
  ];

  return (
    <MainLayout headerTitle="I Ching" showBack>
      <div className="min-h-screen bg-background pb-20 lg:pb-8">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={transitions.spring}
            className="max-w-4xl mx-auto"
          >
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                <span className="text-5xl">☯️</span>
              </div>
              <h2 className="text-4xl font-serif mb-4 text-primary">I Ching Oracle</h2>
              <p className="text-secondary text-lg max-w-2xl mx-auto">
                Consult the Book of Changes, an ancient Chinese divination system that has guided
                seekers for over 3,000 years
              </p>
            </div>

            {/* Method Selection */}
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="mb-12"
            >
              <h3 className="text-xl  mb-6 text-center">Choose Your Method</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                {methods.map((method) => (
                  <motion.button
                    key={method.id}
                    variants={staggerItem}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`bg-card border-2 rounded-lg p-6 text-left transition-all hover:border-primary ${
                      selectedMethod === method.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    }`}
                    disabled={method.premium}
                  >
                    <div className="text-4xl mb-4 text-center">{method.icon}</div>
                    <h4 className="text-lg font-medium mb-2 text-white">{method.name}</h4>
                    <p className="text-sm text-secondary">{method.description}</p>
                    {method.premium && (
                      <div className="mt-3 text-xs text-yellow-500">Premium Feature</div>
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Coming Soon Notice */}
            <div className="bg-card border border-border rounded-lg p-12">
              <div className="text-center space-y-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl  mb-3">I Ching Experience Coming Soon</h3>
                  <p className="text-secondary max-w-lg mx-auto leading-relaxed">
                    We're creating an immersive I Ching consultation experience with animated coin
                    tosses, hexagram formation, and deep interpretations of the changing lines.
                  </p>
                </div>

                {/* Features List */}
                <div className="max-w-md mx-auto pt-6">
                  <div className="bg-surface rounded-lg p-6">
                    <h4 className="text-sm font-medium text-white mb-4">Upcoming Features:</h4>
                    <ul className="text-sm text-secondary space-y-3 text-left">
                      <li className="flex items-start gap-3">
                        <span className="text-primary">•</span>
                        <span>Animated coin toss with quantum randomization</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary">•</span>
                        <span>Visual hexagram formation and transformation</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary">•</span>
                        <span>Detailed interpretation of all 64 hexagrams</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary">•</span>
                        <span>Changing lines analysis and transformation hexagrams</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary">•</span>
                        <span>Save readings and track guidance over time</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary">•</span>
                        <span>AI-powered contextual interpretation for your question</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* CTA */}
                <div className="pt-6">
                  <Button
                    variant="ghost"
                    onClick={() => window.history.back()}
                    className="flex items-center justify-center gap-2 mx-auto"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Back to Oracle Hub
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
