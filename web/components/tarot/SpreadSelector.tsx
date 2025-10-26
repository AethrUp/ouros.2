'use client';

import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { SpreadLayout } from '@/types/tarot';
import { staggerContainer, staggerItem } from '@/lib/animations';

interface SpreadSelectorProps {
  spreads: SpreadLayout[];
  onSelect: (spread: SpreadLayout) => void;
}

const SPREAD_ICONS: Record<string, string> = {
  'single-card': '🃏',
  'three-card': '🎴',
  'five-elements': '✨',
  'celtic-cross': '🔮',
};

const SPREAD_COLORS: Record<string, string> = {
  'single-card': 'from-purple-500/20 to-pink-500/20',
  'three-card': 'from-pink-500/20 to-rose-500/20',
  'five-elements': 'from-violet-500/20 to-purple-500/20',
  'celtic-cross': 'from-fuchsia-500/20 to-pink-500/20',
};

export function SpreadSelector({ spreads, onSelect }: SpreadSelectorProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-serif text-primary mb-4">
          Choose Your Spread
        </h2>
        <p className="text-secondary text-lg">
          Select a spread that resonates with your intention
        </p>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {spreads.map((spread) => (
          <motion.button
            key={spread.id}
            variants={staggerItem}
            onClick={() => onSelect(spread)}
            className="group relative bg-card border-2 border-border rounded-lg p-6 text-left overflow-hidden
                     transition-all duration-300
                     focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                     focus:ring-offset-background"
          >
            {/* Gradient hover overlay */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${SPREAD_COLORS[spread.id] || 'from-purple-500/20 to-pink-500/20'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
            />

            {/* Info button - optional for now */}
            <div className="absolute top-4 right-4 opacity-50 hover:opacity-100 transition-opacity z-10">
              <Info className="w-5 h-5 text-secondary" />
            </div>

            {/* Icon */}
            <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className="text-4xl">
                {SPREAD_ICONS[spread.id] || '🔯'}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-serif text-primary mb-1">
                  {spread.name}
                </h3>
                <p className="text-sm text-secondary">
                  {spread.cardCount} card{spread.cardCount > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-secondary leading-relaxed relative z-10">
              {spread.description}
            </p>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
