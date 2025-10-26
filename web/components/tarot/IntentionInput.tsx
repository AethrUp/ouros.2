'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui';
import { TextArea } from '@/components/ui/TextArea';
import { fadeInUp, transitions } from '@/lib/animations';

interface IntentionInputProps {
  value: string;
  onChange: (text: string) => void;
  onNext: () => void;
  spreadName?: string;
}

export function IntentionInput({
  value,
  onChange,
  onNext,
  spreadName,
}: IntentionInputProps) {
  const [showFullText, setShowFullText] = useState(false);

  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      transition={transitions.spring}
      className="max-w-2xl mx-auto px-4 py-8"
    >
      <div className="mb-8">
        <h2 className="text-3xl md:text-4xl font-serif text-primary mb-4">
          Set Your Intention
        </h2>

        <div className="space-y-3 text-secondary leading-relaxed">
          <p>
            Take a moment to center yourself with a few deep breaths before writing your
            intention. Frame your question as a request for guidance rather than a demand for
            predictions.
          </p>

          {showFullText && (
            <p className="text-sm">
              Instead of asking "Will this happen?" try "What do I need to know about this
              situation?" or "How can I approach this challenge?" Focus on what you can learn
              or how you can grow, rather than trying to control outcomes. Be specific about
              the area of your life you're seeking guidance on, whether it's relationships,
              career, personal growth, or a particular decision you're facing. Your intention
              should feel authentic to you and address what you genuinely want to understand.
            </p>
          )}

          <button
            onClick={() => setShowFullText(!showFullText)}
            className="text-primary text-sm hover:underline"
          >
            {showFullText ? 'LESS' : 'MORE'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <TextArea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Provide guidance on..."
          rows={6}
          maxLength={500}
          className="w-full"
        />

        <div className="flex justify-between items-center">
          <span className="text-xs text-secondary">
            {value.length}/500 characters
          </span>
        </div>
      </div>

      <div className="mt-8">
        <Button
          onClick={onNext}
          variant="primary"
          size="large"
          fullWidth
          disabled={!value.trim()}
        >
          Draw Cards
        </Button>
      </div>
    </motion.div>
  );
}
