import React, { useEffect, useState, useRef } from 'react';
import { motion, Variants } from 'framer-motion';
import Image from 'next/image';

interface CoinProps {
  isHeads: boolean;
  delay: number;
  onComplete: () => void;
  triggerKey: number;
}

/**
 * AnimatedCoin - Single coin with 3D flip animation using Framer Motion variants
 *
 * Architecture:
 * - Uses CSS 3D transforms with two-sided coin (front & back)
 * - Front face shows result (heads/tails), back face shows casting image
 * - Animation rotates coin to reveal front face with result
 */
const AnimatedCoin: React.FC<CoinProps> = ({ isHeads, delay, onComplete, triggerKey }) => {
  const [animationState, setAnimationState] = useState<'idle' | 'tossing' | 'result'>('idle');
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    // Reset state when component mounts or triggerKey changes
    hasCompletedRef.current = false;
    setAnimationState('idle');

    // Start animation after brief delay
    const startTimer = setTimeout(() => {
      setAnimationState('tossing');
    }, delay);

    return () => clearTimeout(startTimer);
  }, [triggerKey, delay]);

  const handleAnimationComplete = () => {
    if (animationState === 'tossing' && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      setAnimationState('result');
      onComplete();
    }
  };

  // All coins rotate 5 full spins + 180° to land on front face
  // 1980° = 5.5 rotations = ends at 180° (showing front face with result)
  const targetRotation = 1980;

  const coinVariants: Variants = {
    idle: {
      rotateY: 0,
      y: 0,
      scale: 1,
    },
    tossing: {
      rotateY: targetRotation,
      y: [0, -100, -80, -40, 0],
      scale: [1, 1.1, 1.05, 1.02, 1],
      transition: {
        duration: 1.8,
        ease: [0.34, 1.56, 0.64, 1],
        times: [0, 0.3, 0.5, 0.75, 1],
      },
    },
    result: {
      rotateY: targetRotation,
      y: 0,
      scale: 1,
    },
  };

  return (
    <div className="relative perspective-1000" style={{ filter: 'drop-shadow(0 10px 15px rgba(0, 0, 0, 0.4))' }}>
      {/* Rotating coin with two faces */}
      <motion.div
        variants={coinVariants}
        initial="idle"
        animate={animationState}
        onAnimationComplete={handleAnimationComplete}
        className="relative w-20 h-20"
        style={{
          transformStyle: 'preserve-3d',
          WebkitTransformStyle: 'preserve-3d'
        }}
      >
        {/* Back face - coincasting.png (visible at rotateY: 0°) */}
        <div className="absolute inset-0 w-full h-full rounded-full backface-hidden">
          <Image
            src="/images/iching/coincasting.png"
            alt="Coin casting"
            fill
            className="object-cover rounded-full"
            priority
          />
        </div>

        {/* Front face - result (visible at rotateY: 180°) */}
        <div
          className="absolute inset-0 w-full h-full rounded-full backface-hidden"
          style={{ transform: 'rotateY(180deg)' }}
        >
          <Image
            src={isHeads ? '/images/iching/coinHeads.png' : '/images/iching/coinTails.png'}
            alt={isHeads ? 'Heads' : 'Tails'}
            fill
            className="object-cover rounded-full"
            priority
          />
        </div>
      </motion.div>

      {/* Shadow effect during toss */}
      {animationState === 'tossing' && (
        <motion.div
          initial={{ scale: 1, opacity: 0.3 }}
          animate={{ scale: [1, 1.5, 1.2, 1], opacity: [0.3, 0.1, 0.2, 0.4] }}
          transition={{ duration: 1.8 }}
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-black/30 rounded-full blur-md -z-10"
        />
      )}
    </div>
  );
};

interface ThreeCoinTossProps {
  results: [boolean, boolean, boolean];
  onTossComplete: () => void;
  animationTrigger: number;
}

/**
 * ThreeCoinToss - Orchestrates three simultaneous coin animations
 *
 * Architecture:
 * - Receives animationTrigger prop that increments each cast
 * - Tracks completion of all three coins
 * - Fires onTossComplete only once when all coins finish
 */
export const ThreeCoinToss: React.FC<ThreeCoinTossProps> = ({
  results,
  onTossComplete,
  animationTrigger,
}) => {
  const [completedCoins, setCompletedCoins] = useState(0);
  const hasNotifiedRef = useRef(false);

  // Reset when animation trigger changes (new cast)
  useEffect(() => {
    setCompletedCoins(0);
    hasNotifiedRef.current = false;
  }, [animationTrigger]);

  const handleCoinComplete = () => {
    setCompletedCoins((prev) => {
      const newCount = prev + 1;

      // When all 3 coins complete, notify parent
      if (newCount === 3 && !hasNotifiedRef.current) {
        hasNotifiedRef.current = true;
        // Small delay to let final animations settle
        setTimeout(() => {
          onTossComplete();
        }, 200);
      }

      return newCount;
    });
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  return (
    <motion.div
      key={animationTrigger}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex items-center justify-center gap-8"
    >
      {results.map((isHeads, index) => (
        <div key={`coin-${animationTrigger}-${index}`} className="flex items-center justify-center">
          <AnimatedCoin
            isHeads={isHeads}
            delay={index * 80}
            onComplete={handleCoinComplete}
            triggerKey={animationTrigger}
          />
        </div>
      ))}
    </motion.div>
  );
};
