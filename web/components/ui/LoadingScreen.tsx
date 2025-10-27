'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import RadionicSpinner from './RadionicSpinner';

type LoadingContext = 'natal-chart' | 'tarot' | 'dream' | 'synastry' | 'iching' | 'dashboard' | 'horoscope' | 'general';

interface LoadingScreenProps {
  context?: LoadingContext;
  messages?: string[];
  rotationInterval?: number;
  overlay?: boolean;
  className?: string;
}

const MESSAGE_SETS: Record<LoadingContext, string[]> = {
  'natal-chart': [
    'Calculating planetary positions',
    'Analyzing celestial influences',
    'Mapping your cosmic blueprint',
    'Interpreting astrological patterns',
  ],
  'tarot': [
    'Shuffling the cosmic deck',
    'Connecting with universal energies',
    'Reading the mystical patterns',
    'Channeling divine guidance',
  ],
  'dream': [
    'Interpreting your dream',
    'Analyzing symbolic meanings',
    'Connecting subconscious patterns',
    'Unveiling hidden messages',
  ],
  'synastry': [
    'Analyzing relationship dynamics',
    'Calculating compatibility patterns',
    'Mapping cosmic connections',
    'Interpreting relational energies',
  ],
  'iching': [
    'Consulting the oracle',
    'Interpreting hexagram wisdom',
    'Connecting with ancient guidance',
    'Reading the cosmic patterns',
  ],
  'dashboard': [
    'Loading your cosmic dashboard',
    'Preparing today\'s insights',
    'Gathering celestial data',
    'Calculating transits',
  ],
  'horoscope': [
    'Analyzing current planetary transits',
    'Interpreting cosmic influences on your chart',
    'Generating personalized insights',
    'Calculating daily guidance',
  ],
  'general': [
    'Loading',
    'Just a moment',
    'Preparing your insights',
  ],
};

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  context = 'general',
  messages,
  rotationInterval = 4500,
  overlay = false,
  className,
}) => {
  const messageArray = messages || MESSAGE_SETS[context];
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // Message rotation
  useEffect(() => {
    if (messageArray.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messageArray.length);
    }, rotationInterval);

    return () => clearInterval(interval);
  }, [messageArray, rotationInterval]);

  const content = (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1],
      }}
      className={cn(
        'flex min-h-screen flex-col items-center justify-center px-8',
        overlay ? 'bg-black/70 backdrop-blur-sm' : 'bg-background',
        className
      )}
      role="progressbar"
      aria-label={messageArray[currentMessageIndex]}
    >
      {/* Spinner */}
      <div className="mb-8">
        <RadionicSpinner />
      </div>

      {/* Rotating Messages */}
      <div className="relative w-full max-w-2xl h-20 flex items-center justify-center px-4">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentMessageIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className={cn(
              'text-xl md:text-2xl font-serif text-center',
              overlay ? 'text-white' : 'text-white'
            )}
          >
            {messageArray[currentMessageIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 z-50">
        {content}
      </div>
    );
  }

  return content;
};
