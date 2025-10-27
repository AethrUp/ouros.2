'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface UsageIndicatorProps {
  remaining: number | 'unlimited';
  feature?: string;
}

export function UsageIndicator({ remaining, feature }: UsageIndicatorProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Don't show indicator for unlimited
  if (remaining === 'unlimited') {
    return null;
  }

  // Determine styling based on remaining usage
  const getColors = () => {
    if (remaining === 0) {
      return {
        bg: 'bg-red-500/20',
        text: 'text-red-400',
        border: 'border-red-500/50',
      };
    }
    if (remaining === 1) {
      return {
        bg: 'bg-yellow-500/20',
        text: 'text-yellow-400',
        border: 'border-yellow-500/50',
      };
    }
    return {
      bg: 'bg-blue-500/20',
      text: 'text-blue-400',
      border: 'border-blue-500/50',
    };
  };

  const colors = getColors();

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className={`
          flex items-center justify-center
          min-w-[2rem] h-8 px-2
          rounded-full border
          ${colors.bg} ${colors.text} ${colors.border}
          font-medium text-sm
          cursor-help
          transition-all duration-200
          hover:scale-110
        `}
      >
        {remaining}
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 z-30 pointer-events-none"
          >
            <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
              <p className="text-xs text-secondary">
                {remaining === 0
                  ? 'No readings left today'
                  : `${remaining} ${remaining === 1 ? 'reading' : 'readings'} left today`}
              </p>
              <p className="text-xs text-secondary/70 mt-1">Refreshes every 24 hours</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
