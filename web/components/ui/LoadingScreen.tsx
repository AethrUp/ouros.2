'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type LoadingContext = 'natal-chart' | 'tarot' | 'dream' | 'synastry' | 'iching' | 'general';

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
  'general': [
    'Loading',
    'Just a moment',
    'Preparing your insights',
  ],
};

// Radionic Spinner Component (Web version)
const RadionicSpinner: React.FC = () => {
  return (
    <div className="relative w-64 h-64">
      {/* Outer rotating ring */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-primary/30"
        animate={{ rotate: 360 }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Middle rotating ring */}
      <motion.div
        className="absolute inset-6 rounded-full border-2 border-primary/50"
        animate={{ rotate: -360 }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Inner rotating ring */}
      <motion.div
        className="absolute inset-12 rounded-full border-2 border-primary/70"
        animate={{ rotate: 360 }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Center pulsing circle */}
      <motion.div
        className="absolute inset-20 rounded-full bg-primary/20"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Center core */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-4 h-4 rounded-full bg-primary shadow-lg shadow-primary/50" />
      </div>
    </div>
  );
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
      <div className="relative w-full max-w-md h-20 flex items-center justify-center">
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
