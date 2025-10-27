'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Alchemical symbols for elements
const ELEMENT_SYMBOLS = {
  fire: '🜂',
  earth: '🜃',
  air: '🜁',
  water: '🜄',
};

interface ElementCompatibilityItemProps {
  element: 'fire' | 'earth' | 'air' | 'water';
  score: number;
}

const ElementCompatibilityItem: React.FC<ElementCompatibilityItemProps> = ({ element, score }) => {
  const normalizedScore = Math.max(0, Math.min(100, score));

  const getRating = (score: number): string => {
    if (score >= 80) return 'EXCELLENT';
    if (score >= 60) return 'STRONG';
    if (score >= 40) return 'MODERATE';
    return 'COMPLEX';
  };

  const rating = getRating(normalizedScore);
  const symbol = ELEMENT_SYMBOLS[element];
  const elementName = element.charAt(0).toUpperCase() + element.slice(1);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center py-4 px-3"
    >
      <span className="text-5xl mb-2 text-white">{symbol}</span>
      <span className="font-serif font-semibold text-white mb-3 text-base">{elementName}</span>
      <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden mb-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${normalizedScore}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full bg-primary rounded-full"
        />
      </div>
      <span className="text-xs font-semibold text-secondary uppercase tracking-wide">{rating}</span>
    </motion.div>
  );
};

interface CompatibilityMeterProps {
  score: number;
  label: string;
  description?: string;
  size?: 'small' | 'medium' | 'large';
  showPercentage?: boolean;
}

export const CompatibilityMeter: React.FC<CompatibilityMeterProps> = ({
  score,
  label,
  description,
  size = 'medium',
  showPercentage = true,
}) => {
  const normalizedScore = Math.max(0, Math.min(100, score));

  const getRating = (score: number): string => {
    if (score >= 80) return 'EXCELLENT';
    if (score >= 60) return 'STRONG';
    if (score >= 40) return 'MODERATE';
    return 'COMPLEX';
  };

  const rating = getRating(normalizedScore);

  const sizeConfig = {
    small: { height: 'h-1.5', fontSize: 'text-xs', labelSize: 'text-xs', scoreSize: 'text-2xl' },
    medium: { height: 'h-2', fontSize: 'text-sm', labelSize: 'text-sm', scoreSize: 'text-3xl' },
    large: { height: 'h-2.5', fontSize: 'text-base', labelSize: 'text-base', scoreSize: 'text-5xl' },
  };

  const config = sizeConfig[size];

  if (size === 'small' && !showPercentage) {
    return (
      <div className="mb-4">
        <h3 className={cn('font-serif font-semibold text-white mb-2', config.labelSize)}>{label}</h3>
        <div className={cn('w-full bg-surface rounded-full overflow-hidden', config.height)}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${normalizedScore}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={cn('bg-primary rounded-full', config.height)}
          />
        </div>
        <span className={cn('block mt-2 font-semibold text-secondary uppercase tracking-wide', config.fontSize)}>
          {rating}
        </span>
        {description && <p className="text-xs text-secondary mt-1 leading-relaxed">{description}</p>}
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center">
        <div className="flex-1 mr-8">
          <h3 className={cn('font-serif font-semibold text-white mb-2', config.labelSize)}>{label}</h3>
          <div className={cn('w-full bg-surface rounded-full overflow-hidden', config.height)}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${normalizedScore}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={cn('bg-primary rounded-full', config.height)}
            />
          </div>
          <span className={cn('block mt-2 font-semibold text-secondary uppercase tracking-wide', config.fontSize)}>
            {rating}
          </span>
        </div>
        {showPercentage && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className={cn('font-serif font-bold text-primary', config.scoreSize)}
          >
            {normalizedScore}%
          </motion.span>
        )}
      </div>
      {description && <p className="text-xs text-secondary mt-2 leading-relaxed">{description}</p>}
    </div>
  );
};

interface CompatibilityMeterGroupProps {
  overall: number;
  fire?: number;
  earth?: number;
  air?: number;
  water?: number;
  cardinal?: number;
  fixed?: number;
  mutable?: number;
}

export const CompatibilityMeterGroup: React.FC<CompatibilityMeterGroupProps> = ({
  overall,
  fire,
  earth,
  air,
  water,
  cardinal,
  fixed,
  mutable,
}) => {
  const hasElementData = fire !== undefined || earth !== undefined || air !== undefined || water !== undefined;
  const hasModalityData = cardinal !== undefined || fixed !== undefined || mutable !== undefined;

  return (
    <div className="mb-8">
      {/* Overall Compatibility */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8 pb-8 border-b border-border"
      >
        <CompatibilityMeter score={overall} label="Overall Compatibility" size="large" />
      </motion.div>

      {/* Element Compatibility */}
      {hasElementData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-8"
        >
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
            Elemental Harmony
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {fire !== undefined && <ElementCompatibilityItem element="fire" score={fire} />}
            {earth !== undefined && <ElementCompatibilityItem element="earth" score={earth} />}
            {air !== undefined && <ElementCompatibilityItem element="air" score={air} />}
            {water !== undefined && <ElementCompatibilityItem element="water" score={water} />}
          </div>
        </motion.div>
      )}

      {/* Modality Compatibility */}
      {hasModalityData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-8"
        >
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
            Action Styles
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {cardinal !== undefined && (
              <div>
                <CompatibilityMeter score={cardinal} label="Cardinal" size="small" showPercentage={false} />
              </div>
            )}
            {fixed !== undefined && (
              <div>
                <CompatibilityMeter score={fixed} label="Fixed" size="small" showPercentage={false} />
              </div>
            )}
            {mutable !== undefined && (
              <div>
                <CompatibilityMeter score={mutable} label="Mutable" size="small" showPercentage={false} />
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};
