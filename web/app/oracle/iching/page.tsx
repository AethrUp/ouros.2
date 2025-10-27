'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui';
import { TextArea } from '@/components/ui';
import { fadeInUp, transitions } from '@/lib/animations';
import { CoinCastingView } from '@/components/iching/CoinCastingView';
import { InterpretationView } from '@/components/iching/InterpretationView';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useAppStore } from '@/store';
import { HexagramLine } from '@/types/iching';
import { getHexagramByLines } from '@/data/iching/hexagrams';

type SessionStep = 'question' | 'loading' | 'casting' | 'interpretation' | 'complete';

export default function IChingPage() {
  const {
    question,
    ichingSessionStep,
    preFetchedCoinTosses,
    primaryHexagram,
    relatingHexagram,
    ichingInterpretation,
    isGeneratingIChingInterpretation,
    setQuestion,
    fetchCoinTosses,
    setPrimaryHexagram,
    setRelatingHexagram,
    generateIChingInterpretation,
    clearIChingSession,
    setIChingSessionStep,
  } = useAppStore();

  const handleQuestionSubmit = () => {
    if (question.trim().length < 3) return;
    fetchCoinTosses();
  };

  const handleCastingComplete = useCallback(
    (lines: HexagramLine[]) => {
      console.log('✅ Casting complete, processing hexagram...');

      try {
        const linePattern: [boolean, boolean, boolean, boolean, boolean, boolean] = [
          lines[0].type === 'yang' || lines[0].type === 'changing-yang',
          lines[1].type === 'yang' || lines[1].type === 'changing-yang',
          lines[2].type === 'yang' || lines[2].type === 'changing-yang',
          lines[3].type === 'yang' || lines[3].type === 'changing-yang',
          lines[4].type === 'yang' || lines[4].type === 'changing-yang',
          lines[5].type === 'yang' || lines[5].type === 'changing-yang',
        ];

        const hexagram = getHexagramByLines(linePattern);
        if (!hexagram) throw new Error('Failed to find hexagram for cast lines');

        const changingLines = lines.filter((line) => line.isChanging).map((line) => line.position);

        const primary = {
          hexagram,
          lines,
          changingLines,
        };
        setPrimaryHexagram(primary);

        if (changingLines.length > 0) {
          const relatingPattern: [boolean, boolean, boolean, boolean, boolean, boolean] = [
            lines[0].isChanging ? !linePattern[0] : linePattern[0],
            lines[1].isChanging ? !linePattern[1] : linePattern[1],
            lines[2].isChanging ? !linePattern[2] : linePattern[2],
            lines[3].isChanging ? !linePattern[3] : linePattern[3],
            lines[4].isChanging ? !linePattern[4] : linePattern[4],
            lines[5].isChanging ? !linePattern[5] : linePattern[5],
          ];

          const relatingHex = getHexagramByLines(relatingPattern);
          if (relatingHex) {
            const stableLines: HexagramLine[] = relatingPattern.map((isYang, idx) => ({
              position: idx + 1,
              type: isYang ? 'yang' : 'yin',
              isChanging: false,
            }));

            const relating = {
              hexagram: relatingHex,
              lines: stableLines,
              changingLines: [],
            };
            setRelatingHexagram(relating);
          }
        } else {
          setRelatingHexagram(null);
        }

        setIChingSessionStep('interpretation');
        generateIChingInterpretation();
      } catch (error) {
        console.error('❌ Failed to process hexagram:', error);
      }
    },
    [setPrimaryHexagram, setRelatingHexagram, setIChingSessionStep, generateIChingInterpretation]
  );

  const handleNewReading = () => {
    clearIChingSession();
  };

  const renderContent = () => {
    switch (ichingSessionStep) {
      case 'question':
        return (
          <QuestionInputView
            question={question}
            onQuestionChange={(q) => setQuestion(q)}
            onSubmit={handleQuestionSubmit}
          />
        );

      case 'loading':
        return <LoadingScreen context="iching" />;

      case 'casting':
        return (
          <CoinCastingView
            question={question}
            preFetchedCoinTosses={preFetchedCoinTosses}
            onComplete={handleCastingComplete}
            onCancel={handleNewReading}
          />
        );

      case 'interpretation':
        return <LoadingScreen context="iching" />;

      case 'complete':
        return primaryHexagram ? (
          <InterpretationView
            question={question}
            primaryHexagram={primaryHexagram}
            relatingHexagram={relatingHexagram}
            interpretation={ichingInterpretation}
            isGenerating={isGeneratingIChingInterpretation}
            onNewReading={handleNewReading}
          />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <MainLayout headerTitle="I CHING" showBack={ichingSessionStep === 'question'}>
      <div className="min-h-screen bg-background">
        <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
      </div>
    </MainLayout>
  );
}

interface QuestionInputViewProps {
  question: string;
  onQuestionChange: (q: string) => void;
  onSubmit: () => void;
}

const QuestionInputView: React.FC<QuestionInputViewProps> = ({
  question,
  onQuestionChange,
  onSubmit,
}) => {
  const isValid = question.trim().length >= 3;

  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={transitions.spring}
      className="container mx-auto px-4 py-8 max-w-2xl"
    >
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-serif text-primary">Your Question</h2>
          <p className="text-secondary text-sm leading-relaxed max-w-xl mx-auto">
            Focus your mind and ask a clear question. The I Ching responds best to specific
            inquiries about your situation.
          </p>
        </div>

        <div className="space-y-2">
          <TextArea
            value={question}
            onChange={(e) => onQuestionChange(e.target.value)}
            placeholder="Provide guidance on..."
            rows={4}
            maxLength={500}
            className="w-full"
          />
          <div className="text-right text-xs text-secondary">
            {question.length}/500
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={onSubmit}
            disabled={!isValid}
            size="medium"
          >
            Begin Casting
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
