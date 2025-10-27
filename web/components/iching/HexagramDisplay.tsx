import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HexagramLine } from '@/types/iching';

interface HexagramLineDisplayProps {
  line?: HexagramLine;
  position: number;
}

const HexagramLineDisplay: React.FC<HexagramLineDisplayProps> = ({ line, position }) => {
  const hasLine = !!line;
  const isYang = line?.type === 'yang' || line?.type === 'changing-yang';
  const isChanging = line?.isChanging || false;

  return (
    <div className="flex items-center justify-center my-1">
      <AnimatePresence mode="wait">
        {hasLine ? (
          <motion.div
            key={`line-${position}-filled`}
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0, scaleX: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="relative flex items-center justify-center w-32"
          >
            {/* Line Visual */}
            {isYang ? (
              // Yang line (solid)
              <div
                className={`h-2 w-full rounded-sm transition-all ${
                  isChanging
                    ? 'bg-primary shadow-[0_0_8px_rgba(246,217,159,0.5)]'
                    : 'bg-white'
                }`}
              />
            ) : (
              // Yin line (broken)
              <div className="flex items-center justify-center w-full gap-4">
                <div
                  className={`h-2 flex-1 rounded-sm transition-all ${
                    isChanging
                      ? 'bg-primary shadow-[0_0_8px_rgba(246,217,159,0.5)]'
                      : 'bg-white'
                  }`}
                />
                <div
                  className={`h-2 flex-1 rounded-sm transition-all ${
                    isChanging
                      ? 'bg-primary shadow-[0_0_8px_rgba(246,217,159,0.5)]'
                      : 'bg-white'
                  }`}
                />
              </div>
            )}

            {/* Changing Line Indicator */}
            {isChanging && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="absolute -right-8"
              >
                <span className="text-primary text-xl">✦</span>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key={`line-${position}-empty`}
            className="relative flex items-center justify-center w-32 opacity-20"
          >
            <div className="h-2 w-full rounded-sm bg-white" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface HexagramDisplayProps {
  lines: HexagramLine[];
  maxLines?: number;
}

export const HexagramDisplay: React.FC<HexagramDisplayProps> = ({ lines = [], maxLines = 6 }) => {
  const positions = Array.from({ length: maxLines }, (_, i) => i + 1);

  return (
    <div className="flex flex-col items-center justify-center py-4">
      {positions.reverse().map((position) => {
        const line = lines.find((l) => l.position === position);
        return <HexagramLineDisplay key={`line-${position}`} line={line} position={position} />;
      })}
    </div>
  );
};
