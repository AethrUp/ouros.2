'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui';
import { DrawnCard, SpreadLayout, TarotInterpretation } from '@/types/tarot';
import { fadeInUp, staggerContainer, staggerItem, transitions } from '@/lib/animations';
import Image from 'next/image';

interface InterpretationDisplayProps {
  drawnCards: DrawnCard[];
  spread: SpreadLayout;
  intention: string;
  interpretation: string | TarotInterpretation;
  onSave?: () => void;
  onJournal?: (prompt?: string) => void;
}

export function InterpretationDisplay({
  drawnCards,
  spread,
  intention,
  interpretation,
  onSave,
  onJournal,
}: InterpretationDisplayProps) {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  // Helper to extract JSON from markdown code blocks
  const extractJSON = (text: string): string => {
    let cleaned = text.trim();

    // Remove markdown code fences if present
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.substring(3);
    }

    if (cleaned.endsWith('```')) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }

    return cleaned.trim();
  };

  // Parse interpretation if it's a JSON string
  let parsedInterpretation: string | TarotInterpretation = interpretation;
  if (typeof interpretation === 'string') {
    try {
      const cleanedJson = extractJSON(interpretation);
      parsedInterpretation = JSON.parse(cleanedJson);
    } catch (e) {
      // If parsing fails, treat as legacy string format
      console.error('Failed to parse interpretation:', e);
      parsedInterpretation = interpretation;
    }
  }

  // Check if it's structured (V2) format
  const isV2 = typeof parsedInterpretation === 'object' && parsedInterpretation !== null && 'fullContent' in parsedInterpretation;
  const fullContent = isV2 ? (parsedInterpretation as TarotInterpretation).fullContent : null;

  // Debug logging
  console.log('🔍 Interpretation Debug:', {
    isV2,
    hasFullContent: !!fullContent,
    parsedType: typeof parsedInterpretation,
    keys: parsedInterpretation && typeof parsedInterpretation === 'object' ? Object.keys(parsedInterpretation) : 'N/A'
  });

  // Build dynamic sections based on format
  const buildSections = () => {
    const sections: Array<{ id: string; label: string }> = [];

    if (isV2 && fullContent) {
      sections.push({ id: 'overview', label: 'OVERVIEW' });

      fullContent.cardInsights.forEach((_, index) => {
        sections.push({
          id: `card-${index}`,
          label: `CARD ${index + 1}`
        });
      });

      sections.push({ id: 'synthesis', label: 'SYNTHESIS' });
      sections.push({ id: 'guidance', label: 'GUIDANCE' });
      sections.push({ id: 'timing', label: 'TIMING' });
      sections.push({ id: 'keyInsight', label: 'KEY INSIGHT' });
      sections.push({ id: 'reflections', label: 'REFLECTIONS' });
    } else {
      sections.push({ id: 'legacy', label: 'READING' });
    }

    return sections;
  };

  const sections = buildSections();

  // Section render functions
  const renderOverview = () => {
    if (!isV2 || !fullContent) return null;
    return (
      <div className="space-y-4">
        <h3 className="text-2xl font-serif text-primary uppercase tracking-wide">Overview</h3>
        <p className="text-secondary leading-relaxed whitespace-pre-wrap">{fullContent.overview}</p>
      </div>
    );
  };

  const renderCard = (index: number) => {
    if (!isV2 || !fullContent) return null;
    const cardInsight = fullContent.cardInsights[index];
    if (!cardInsight) return null;

    return (
      <div className="space-y-4">
        <h3 className="text-2xl font-serif text-primary uppercase tracking-wide">{cardInsight.position}</h3>
        <p className="text-secondary leading-relaxed whitespace-pre-wrap">{cardInsight.interpretation}</p>
      </div>
    );
  };

  const renderSynthesis = () => {
    if (!isV2 || !fullContent) return null;
    return (
      <div className="space-y-4">
        <h3 className="text-2xl font-serif text-primary uppercase tracking-wide">Synthesis</h3>

        <div>
          <h4 className="text-lg  text-primary mb-2 uppercase tracking-wide">The Story</h4>
          <p className="text-secondary leading-relaxed whitespace-pre-wrap">{fullContent.synthesis.narrative}</p>
        </div>

        <div>
          <h4 className="text-lg  text-primary mb-2 uppercase tracking-wide">Main Theme</h4>
          <p className="text-secondary leading-relaxed whitespace-pre-wrap">{fullContent.synthesis.mainTheme}</p>
        </div>
      </div>
    );
  };

  const renderGuidance = () => {
    if (!isV2 || !fullContent) return null;
    const { guidance } = fullContent;

    return (
      <div className="space-y-4">
        <h3 className="text-2xl font-serif text-primary uppercase tracking-wide">Guidance</h3>

        <p className="text-secondary leading-relaxed whitespace-pre-wrap">{guidance.understanding}</p>

        <div>
          <h4 className="text-lg  text-primary mb-2 uppercase tracking-wide">Action Steps</h4>
          <ul className="space-y-2">
            {guidance.actionSteps.map((step, index) => (
              <li key={index} className="flex gap-2 text-secondary">
                <span className="text-primary">✦</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-lg  text-primary mb-2 uppercase tracking-wide">Things to Embrace</h4>
          <ul className="space-y-2">
            {guidance.thingsToEmbrace.map((item, index) => (
              <li key={index} className="flex gap-2 text-secondary">
                <span className="text-primary">✦</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-lg  text-primary mb-2 uppercase tracking-wide">Things to Release</h4>
          <ul className="space-y-2">
            {guidance.thingsToRelease.map((item, index) => (
              <li key={index} className="flex gap-2 text-secondary">
                <span className="text-primary">✦</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  const renderTiming = () => {
    if (!isV2 || !fullContent) return null;
    const { timing } = fullContent;

    return (
      <div className="space-y-4">
        <h3 className="text-2xl font-serif text-primary uppercase tracking-wide">Timing</h3>

        <div>
          <h4 className="text-lg  text-primary mb-2 uppercase tracking-wide">Right Now</h4>
          <p className="text-secondary leading-relaxed whitespace-pre-wrap">{timing.immediateAction}</p>
        </div>

        <div>
          <h4 className="text-lg  text-primary mb-2 uppercase tracking-wide">Near Future</h4>
          <p className="text-secondary leading-relaxed whitespace-pre-wrap">{timing.nearFuture}</p>
        </div>

        <div>
          <h4 className="text-lg  text-primary mb-2 uppercase tracking-wide">Long Term</h4>
          <p className="text-secondary leading-relaxed whitespace-pre-wrap">{timing.longTerm}</p>
        </div>
      </div>
    );
  };

  const renderKeyInsight = () => {
    if (!isV2 || !fullContent) return null;

    return (
      <div className="space-y-4">
        <h3 className="text-2xl font-serif text-primary uppercase tracking-wide">Key Insight</h3>
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
          <p className="text-primary text-lg font-serif italic text-center leading-relaxed">
            {fullContent.keyInsight}
          </p>
        </div>
      </div>
    );
  };

  const renderReflections = () => {
    if (!isV2 || !fullContent) return null;

    return (
      <div className="space-y-4">
        <h3 className="text-2xl font-serif text-primary uppercase tracking-wide">Reflection Prompts</h3>
        <p className="text-xs text-secondary italic mb-4">
          Click a prompt to journal about it
        </p>
        <div className="space-y-2">
          {fullContent.reflectionPrompts.map((prompt, index) => (
            <button
              key={index}
              onClick={() => onJournal?.(prompt)}
              className="w-full text-left bg-surface/50 hover:bg-surface rounded-lg p-4 transition-colors group"
            >
              <div className="flex items-start gap-3">
                <span className="text-secondary">{index + 1}.</span>
                <span className="text-secondary flex-1 group-hover:text-primary transition-colors">
                  {prompt}
                </span>
                <BookOpen className="w-4 h-4 text-secondary group-hover:text-primary transition-colors" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderLegacy = () => {
    if (isV2) return null;
    const legacyText = typeof parsedInterpretation === 'string' ? parsedInterpretation : '';

    return (
      <div className="space-y-4">
        <h3 className="text-2xl font-serif text-primary uppercase tracking-wide">Your Reading</h3>
        <p className="text-secondary leading-relaxed whitespace-pre-wrap">{legacyText}</p>
      </div>
    );
  };

  // Render current section based on section ID
  const renderCurrentSection = () => {
    const currentSection = sections[currentSectionIndex];
    if (!currentSection) return null;

    const sectionId = currentSection.id;

    if (sectionId === 'overview') return renderOverview();
    if (sectionId.startsWith('card-')) {
      const cardIndex = parseInt(sectionId.replace('card-', ''));
      return renderCard(cardIndex);
    }
    if (sectionId === 'synthesis') return renderSynthesis();
    if (sectionId === 'guidance') return renderGuidance();
    if (sectionId === 'timing') return renderTiming();
    if (sectionId === 'keyInsight') return renderKeyInsight();
    if (sectionId === 'reflections') return renderReflections();
    if (sectionId === 'legacy') return renderLegacy();

    return null;
  };

  const handlePrevious = () => {
    setCurrentSectionIndex((prev) => (prev === 0 ? sections.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentSectionIndex((prev) => (prev === sections.length - 1 ? 0 : prev + 1));
  };

  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      transition={transitions.spring}
      className="max-w-4xl mx-auto px-4 py-8"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-serif text-primary mb-2">
          Your Reading
        </h2>
        <p className="text-secondary">{spread.name}</p>
      </div>

      {/* Intention */}
      {intention && (
        <div className="bg-surface rounded-lg p-6 mb-8">
          <h3 className="text-sm  text-primary mb-2">Your Intention</h3>
          <p className="text-secondary italic">{intention}</p>
        </div>
      )}

      {/* Cards Preview */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="flex justify-center gap-6 mb-8"
      >
        {drawnCards.map((drawnCard, index) => (
          <motion.div
            key={index}
            variants={staggerItem}
            className="text-center max-w-[180px]"
          >
            <div className="relative w-full aspect-[198/342] mb-3 bg-card rounded-xl overflow-hidden border-2 border-primary">
              <Image
                src={drawnCard.card.imageUri || ''}
                alt={drawnCard.card.name}
                fill
                className={`object-cover ${drawnCard.orientation === 'reversed' ? 'rotate-180' : ''}`}
                unoptimized
              />
            </div>
            <h4 className="font-serif text-primary text-center mb-1 text-lg">
              {drawnCard.card.name}
            </h4>
            <p className="text-xs text-secondary text-center mb-2">
              {drawnCard.orientation === 'upright' ? 'Upright' : 'Reversed'}
            </p>
            <p className="text-xs text-secondary text-center uppercase tracking-wider">
              {drawnCard.position}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Section Navigation */}
      <div className="border-b border-border/30 mb-8">
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={handlePrevious}
            className="flex-shrink-0 p-2 hover:bg-surface rounded transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-primary" />
          </button>

          <div className="flex gap-1 justify-center overflow-x-auto">
            {sections.map((section, index) => (
              <button
                key={section.id}
                onClick={() => setCurrentSectionIndex(index)}
                className={`px-3 py-2 text-xs tracking-wider whitespace-nowrap transition-colors ${
                  currentSectionIndex === index
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-secondary hover:text-primary'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleNext}
            className="flex-shrink-0 p-2 hover:bg-surface rounded transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-primary" />
          </button>
        </div>
      </div>

      {/* Content - Current Section */}
      <div className="bg-card border border-border rounded-lg p-6 mb-8 min-h-[400px]">
        {renderCurrentSection()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mb-8">
        <Button
          onClick={handlePrevious}
          variant="secondary"
          size="medium"
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          PREVIOUS
        </Button>

        <div className="text-sm text-secondary">
          {currentSectionIndex + 1} / {sections.length}
        </div>

        <Button
          onClick={handleNext}
          variant="secondary"
          size="medium"
          className="flex items-center gap-2"
        >
          NEXT
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        {onSave && (
          <Button
            onClick={onSave}
            variant="secondary"
            size="large"
            className="flex-1 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Reading
          </Button>
        )}

        {onJournal && (
          <Button
            onClick={() => onJournal()}
            variant="primary"
            size="large"
            className="flex-1 flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            Journal
          </Button>
        )}
      </div>
    </motion.div>
  );
}
