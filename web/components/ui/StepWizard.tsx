'use client';

import React, { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { slideInRight } from '@/lib/animations';

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  content: ReactNode;
  validate?: () => boolean | Promise<boolean>;
  optional?: boolean;
}

export interface StepWizardProps {
  steps: WizardStep[];
  onComplete: () => void | Promise<void>;
  onCancel?: () => void;
  currentStepIndex?: number;
  showStepIndicator?: boolean;
  allowSkip?: boolean;
  className?: string;
}

export const StepWizard: React.FC<StepWizardProps> = ({
  steps,
  onComplete,
  onCancel,
  currentStepIndex: controlledIndex,
  showStepIndicator = true,
  allowSkip = false,
  className,
}) => {
  const [internalIndex, setInternalIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  const currentIndex = controlledIndex ?? internalIndex;
  const currentStep = steps[currentIndex];
  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === steps.length - 1;

  const goToNext = async () => {
    // Validate current step if validator exists
    if (currentStep.validate) {
      setLoading(true);
      try {
        const isValid = await currentStep.validate();
        if (!isValid) {
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Validation error:', error);
        setLoading(false);
        return;
      }
      setLoading(false);
    }

    if (isLastStep) {
      // Complete wizard
      setLoading(true);
      try {
        await onComplete();
      } catch (error) {
        console.error('Complete error:', error);
      } finally {
        setLoading(false);
      }
    } else {
      // Go to next step
      setDirection('forward');
      if (controlledIndex === undefined) {
        setInternalIndex((prev) => Math.min(prev + 1, steps.length - 1));
      }
    }
  };

  const goToPrevious = () => {
    if (!isFirstStep) {
      setDirection('backward');
      if (controlledIndex === undefined) {
        setInternalIndex((prev) => Math.max(prev - 1, 0));
      }
    }
  };

  const goToStep = (index: number) => {
    if (index >= 0 && index < steps.length) {
      setDirection(index > currentIndex ? 'forward' : 'backward');
      if (controlledIndex === undefined) {
        setInternalIndex(index);
      }
    }
  };

  const handleSkip = () => {
    if (currentStep.optional && allowSkip) {
      setDirection('forward');
      if (controlledIndex === undefined) {
        setInternalIndex((prev) => Math.min(prev + 1, steps.length - 1));
      }
    }
  };

  const variants = {
    enter: (direction: 'forward' | 'backward') => ({
      x: direction === 'forward' ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: 'forward' | 'backward') => ({
      x: direction === 'forward' ? -100 : 100,
      opacity: 0,
    }),
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Step Indicator */}
      {showStepIndicator && steps.length > 1 && (
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                {/* Step Circle */}
                <button
                  onClick={() => goToStep(index)}
                  disabled={index > currentIndex}
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full font-medium text-sm transition-all',
                    index === currentIndex &&
                      'bg-primary text-white ring-4 ring-primary/20 scale-110',
                    index < currentIndex &&
                      'bg-primary text-white hover:scale-110 cursor-pointer',
                    index > currentIndex &&
                      'bg-surface text-secondary cursor-not-allowed'
                  )}
                  aria-label={`Step ${index + 1}: ${step.title}`}
                  aria-current={index === currentIndex ? 'step' : undefined}
                >
                  {index + 1}
                </button>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 h-1 mx-2">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-300',
                        index < currentIndex ? 'bg-primary' : 'bg-surface'
                      )}
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step Labels */}
          <div className="flex items-start justify-between mt-3">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  'flex-1 text-center px-2',
                  index === 0 && 'text-left',
                  index === steps.length - 1 && 'text-right'
                )}
              >
                <p
                  className={cn(
                    'text-sm font-medium transition-colors',
                    index === currentIndex
                      ? 'text-white'
                      : index < currentIndex
                      ? 'text-primary'
                      : 'text-secondary'
                  )}
                >
                  {step.title}
                </p>
                {step.description && index === currentIndex && (
                  <p className="text-xs text-secondary mt-1">
                    {step.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="relative min-h-[300px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="w-full"
          >
            {currentStep.content}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-8 gap-4">
        <div className="flex gap-2">
          {!isFirstStep && (
            <Button
              type="button"
              variant="ghost"
              size="small"
              onClick={goToPrevious}
              disabled={loading}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
          )}
          {onCancel && isFirstStep && (
            <Button
              type="button"
              variant="ghost"
              size="small"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          {currentStep.optional && allowSkip && !isLastStep && (
            <Button
              type="button"
              variant="secondary"
              size="small"
              onClick={handleSkip}
              disabled={loading}
            >
              Skip
            </Button>
          )}
          <Button
            type="button"
            variant="primary"
            size="small"
            onClick={goToNext}
            loading={loading}
            className="gap-2"
          >
            {isLastStep ? 'Complete' : 'Next'}
            {!isLastStep && <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};
