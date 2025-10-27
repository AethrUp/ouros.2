import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HexagramDisplay } from './HexagramDisplay';
import { ThreeCoinToss } from './CoinFlipAnimation';
import { HexagramLine, CoinToss } from '@/types/iching';
import { castLineWithCoins } from '@/utils/ichingCasting';
import { Button } from '@/components/ui';

interface CoinCastingViewProps {
  question: string;
  preFetchedCoinTosses: CoinToss[] | null;
  onComplete: (lines: HexagramLine[]) => void;
  onCancel?: () => void;
}

export const CoinCastingView: React.FC<CoinCastingViewProps> = ({
  question,
  preFetchedCoinTosses,
  onComplete,
  onCancel,
}) => {
  const [currentLinePosition, setCurrentLinePosition] = useState(1);
  const [completedLines, setCompletedLines] = useState<HexagramLine[]>([]);
  const [currentCoinToss, setCurrentCoinToss] = useState<CoinToss | null>(null);
  const [lastCoinToss, setLastCoinToss] = useState<CoinToss | null>(null);
  const [animationTrigger, setAnimationTrigger] = useState(0);
  const isProcessingRef = useRef(false);

  const handleCast = useCallback(async () => {
    if (isProcessingRef.current) {
      console.log('⚠️ Already processing, ignoring click');
      return;
    }

    try {
      isProcessingRef.current = true;

      let coinToss: CoinToss;

      if (preFetchedCoinTosses && preFetchedCoinTosses[currentLinePosition - 1]) {
        coinToss = preFetchedCoinTosses[currentLinePosition - 1];
        console.log(`🎲 Using pre-fetched coin toss for line ${currentLinePosition}`);
      } else {
        coinToss = await castLineWithCoins();
        console.log(`⚠️ Fetching individual coin toss for line ${currentLinePosition} (fallback)`);
      }

      console.log(
        `🎲 Cast line ${currentLinePosition}:`,
        coinToss.lineType,
        `(value: ${coinToss.value})`,
        `coins: [${coinToss.coins.map(c => c ? 'H' : 'T').join(', ')}]`
      );

      // Set the coin toss data first
      setCurrentCoinToss(coinToss);
      setLastCoinToss(coinToss);

      // Then trigger animation by incrementing the trigger
      // This ensures ThreeCoinToss receives new data before animating
      setTimeout(() => {
        setAnimationTrigger(prev => prev + 1);
      }, 50);
    } catch (error) {
      console.error('Failed to cast line:', error);
      isProcessingRef.current = false;
    }
  }, [currentLinePosition, preFetchedCoinTosses]);

  const handleTossComplete = useCallback(() => {
    if (!currentCoinToss) {
      console.error('❌ handleTossComplete called but no currentCoinToss');
      isProcessingRef.current = false;
      return;
    }

    const newLine: HexagramLine = {
      position: currentLinePosition,
      type: currentCoinToss.lineType,
      isChanging:
        currentCoinToss.lineType === 'changing-yang' ||
        currentCoinToss.lineType === 'changing-yin',
    };

    const updatedLines = [...completedLines, newLine];
    setCompletedLines(updatedLines);

    console.log(`✅ Line ${currentLinePosition} completed:`, newLine.type);

    if (currentLinePosition >= 6) {
      console.log('🎉 All 6 lines cast, completing sequence');
      setTimeout(() => {
        onComplete(updatedLines);
        isProcessingRef.current = false;
      }, 1800);
    } else {
      setTimeout(() => {
        setCurrentLinePosition((prev) => prev + 1);
        // Keep lastCoinToss so coins stay visible, but clear currentCoinToss
        setCurrentCoinToss(null);
        isProcessingRef.current = false;
      }, 1000);
    }
  }, [currentCoinToss, currentLinePosition, completedLines, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-8 max-w-4xl"
    >
      <div className="space-y-8">
        {/* Hexagram Display */}
        <div className="flex justify-center">
          <HexagramDisplay lines={completedLines} maxLines={6} />
        </div>

        {/* Coin Toss Area */}
        <div className="h-64 flex items-center justify-center">
          {lastCoinToss && (
            <ThreeCoinToss
              results={lastCoinToss.coins}
              onTossComplete={handleTossComplete}
              animationTrigger={animationTrigger}
            />
          )}
        </div>

        {/* Cast Button or Completion Message */}
        <div className="flex flex-col items-center space-y-4">
          {completedLines.length < 6 ? (
            <>
              <Button
                onClick={handleCast}
                disabled={isProcessingRef.current}
                size="large"
                className="min-w-[200px]"
              >
                {completedLines.length > 0 ? 'Cast Again' : 'Cast Coins'}
              </Button>
              <p className="text-sm text-secondary text-center">
                Line {currentLinePosition} of 6
              </p>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-2"
            >
              <h3 className="text-xl font-serif text-primary">Hexagram Complete</h3>
              <p className="text-sm text-secondary">Calculating your reading...</p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
