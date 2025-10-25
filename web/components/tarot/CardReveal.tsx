'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import { DrawnCard } from '@/types/tarot';
import { fadeInUp, staggerContainer, staggerItem, transitions } from '@/lib/animations';
import { CARD_BACK_IMAGE } from '@/data/tarot/tarotImages';
import Image from 'next/image';

interface CardRevealProps {
  drawnCards: DrawnCard[];
  onComplete: () => void;
}

export function CardReveal({ drawnCards, onComplete }: CardRevealProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCurrentCardRevealed, setIsCurrentCardRevealed] = useState(false);

  const handleReveal = () => {
    setIsCurrentCardRevealed(true);
  };

  const handleNext = () => {
    if (currentCardIndex < drawnCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsCurrentCardRevealed(false);
    } else {
      // Last card, proceed to interpretation
      onComplete();
    }
  };

  const isLastCard = currentCardIndex === drawnCards.length - 1;
  const currentCard = drawnCards[currentCardIndex];

  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      transition={transitions.spring}
      className="max-w-5xl mx-auto px-4 py-8"
    >
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-primary mb-4">
          Your Cards
        </h2>
        <p className="text-secondary text-base md:text-lg">
          {isCurrentCardRevealed
            ? `Card ${currentCardIndex + 1} of ${drawnCards.length}`
            : 'Tap the card to reveal it'}
        </p>
      </div>

      {/* Single Card Display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentCardIndex}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center"
        >
          {/* Card Visual */}
          <div className="mb-8">
            <button
              onClick={() => !isCurrentCardRevealed && handleReveal()}
              disabled={isCurrentCardRevealed}
              className={`relative group ${!isCurrentCardRevealed ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <motion.div
                initial={false}
                animate={{
                  rotateY: isCurrentCardRevealed ? 180 : 0,
                }}
                transition={{
                  duration: 0.6,
                  ease: 'easeInOut',
                }}
                style={{
                  transformStyle: 'preserve-3d',
                  position: 'relative',
                }}
                className="w-48 h-80 md:w-56 md:h-96 lg:w-64 lg:h-[28rem]"
              >
                {/* Card Back */}
                <div
                  className="absolute inset-0"
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                  }}
                >
                  <div className="w-full h-full bg-card border-4 md:border-[6px] border-accent rounded-lg overflow-hidden flex items-center justify-center">
                    <Image
                      src={CARD_BACK_IMAGE}
                      alt="Card Back"
                      fill
                      className="object-contain p-2"
                      unoptimized
                    />
                  </div>
                </div>

                {/* Card Front */}
                <div
                  className="absolute inset-0"
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                >
                  <div
                    className={`w-full h-full bg-card border-2 md:border-4 border-primary rounded-lg overflow-hidden flex items-center justify-center ${
                      currentCard.orientation === 'reversed' ? 'rotate-180' : ''
                    }`}
                  >
                    <Image
                      src={currentCard.card.imageUri}
                      alt={currentCard.card.name}
                      fill
                      className="object-contain p-2"
                      unoptimized
                    />
                  </div>
                </div>
              </motion.div>

              {/* Tap prompt for unrevealed cards */}
              {!isCurrentCardRevealed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 text-sm md:text-base text-accent font-medium whitespace-nowrap"
                >
                  Tap to reveal
                </motion.div>
              )}
            </button>
          </div>

          {/* Card Info */}
          <div className="w-full px-4 md:px-8">
            <AnimatePresence mode="wait">
              {!isCurrentCardRevealed ? (
                <motion.div
                  key="unrevealed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4 text-center max-w-2xl mx-auto"
                >
                  <h3 className="text-xl md:text-2xl lg:text-3xl font-serif font-semibold text-secondary">
                    {currentCard.position}
                  </h3>
                  <p className="text-base md:text-lg lg:text-xl text-secondary/70 leading-relaxed">
                    {currentCard.positionMeaning}
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="revealed"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-4 text-center max-w-2xl mx-auto"
                >
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <h3 className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-primary">
                      {currentCard.card.name}
                    </h3>
                    <span className="text-sm md:text-base text-secondary px-3 py-1.5 bg-surface rounded">
                      {currentCard.orientation === 'upright' ? 'Upright' : 'Reversed'}
                    </span>
                  </div>

                  <p className="text-base md:text-lg lg:text-xl font-medium text-secondary">
                    {currentCard.position}
                  </p>

                  <p className="text-base md:text-lg lg:text-xl text-secondary/80 leading-relaxed">
                    {currentCard.orientation === 'upright'
                      ? currentCard.card.uprightMeaning
                      : currentCard.card.reversedMeaning}
                  </p>

                  {currentCard.card.keywords && currentCard.card.keywords.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2 mt-4">
                      {currentCard.card.keywords.slice(0, 4).map((keyword, i) => (
                        <span
                          key={i}
                          className="text-sm md:text-base text-accent/80 px-3 py-1.5 bg-accent/10 rounded-full"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Progress Indicator */}
      <div className="mt-8 flex justify-center gap-2">
        {drawnCards.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              index < currentCardIndex
                ? 'bg-accent'
                : index === currentCardIndex
                ? 'bg-primary'
                : 'bg-surface'
            }`}
          />
        ))}
      </div>

      {/* Next/Continue Button */}
      {isCurrentCardRevealed && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <Button
            onClick={handleNext}
            variant="primary"
            size="large"
            fullWidth
          >
            {isLastCard ? 'Continue to Interpretation' : 'Next Card'}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
