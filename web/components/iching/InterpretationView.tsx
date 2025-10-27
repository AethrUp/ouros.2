import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, BookOpen } from 'lucide-react';
import { CastedHexagram, IChingInterpretation, IChingInterpretationV2 } from '@/types/iching';
import { HexagramDisplay } from './HexagramDisplay';
import { Button } from '@/components/ui';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

interface InterpretationViewProps {
  question: string;
  primaryHexagram: CastedHexagram;
  relatingHexagram?: CastedHexagram | null;
  interpretation: string | IChingInterpretation | IChingInterpretationV2 | null;
  isGenerating: boolean;
  onNewReading?: () => void;
}

const isV2Interpretation = (
  interpretation: string | IChingInterpretation | IChingInterpretationV2 | null
): interpretation is IChingInterpretationV2 => {
  return (
    typeof interpretation === 'object' &&
    interpretation !== null &&
    'title' in interpretation &&
    'overview' in interpretation &&
    'trigramDynamics' in interpretation
  );
};

export const InterpretationView: React.FC<InterpretationViewProps> = ({
  question,
  primaryHexagram,
  relatingHexagram,
  interpretation,
  isGenerating,
  onNewReading,
}) => {
  const [currentSection, setCurrentSection] = useState('overview');
  const { hexagram: primary, changingLines } = primaryHexagram;
  const hasChangingLines = changingLines.length > 0;

  if (isGenerating) {
    return <LoadingScreen context="iching" />;
  }

  console.log('🔍 InterpretationView - interpretation data:', interpretation);
  console.log('🔍 InterpretationView - interpretation type:', typeof interpretation);
  console.log('🔍 InterpretationView - interpretation keys:', interpretation ? Object.keys(interpretation) : 'null');

  const isV2 = isV2Interpretation(interpretation);
  console.log('🔍 InterpretationView - isV2:', isV2);

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'present', label: 'Present' },
    { id: 'energies', label: 'Energies' },
    { id: 'changingLines', label: 'Changing Lines' },
    { id: 'transformation', label: 'Transformation' },
    { id: 'guidance', label: 'Guidance' },
    { id: 'timing', label: 'Timing' },
    { id: 'keyInsight', label: 'Key Insight' },
    { id: 'reflections', label: 'Reflections' },
  ];

  const currentIndex = sections.findIndex((s) => s.id === currentSection);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < sections.length - 1;

  const handlePrevious = () => {
    if (hasPrevious) {
      setCurrentSection(sections[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      setCurrentSection(sections[currentIndex + 1].id);
    }
  };

  const renderSectionContent = () => {
    if (!isV2) return null;

    switch (currentSection) {
      case 'overview':
        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-serif text-primary">Overview</h3>
            <p className="text-white leading-relaxed">{interpretation.overview}</p>
          </div>
        );

      case 'present':
        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-serif text-primary">Present Situation</h3>
            <p className="text-white leading-relaxed">{interpretation.presentSituation}</p>
          </div>
        );

      case 'energies':
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-serif text-primary">Energies at Play</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-lg text-primary mb-2">The Interaction</h4>
                <p className="text-white leading-relaxed">
                  {interpretation.trigramDynamics.interaction}
                </p>
              </div>
              <div>
                <h4 className="text-lg text-primary mb-2">Upper Trigram</h4>
                <p className="text-white leading-relaxed">
                  {interpretation.trigramDynamics.upperMeaning}
                </p>
              </div>
              <div>
                <h4 className="text-lg text-primary mb-2">Lower Trigram</h4>
                <p className="text-white leading-relaxed">
                  {interpretation.trigramDynamics.lowerMeaning}
                </p>
              </div>
            </div>
          </div>
        );

      case 'changingLines':
        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-serif text-primary">Lines of Transformation</h3>
            <p className="text-white leading-relaxed">{interpretation.changingLines.present}</p>
            <div>
              <h4 className="text-lg text-primary mb-2">Significance</h4>
              <p className="text-white leading-relaxed">
                {interpretation.changingLines.significance}
              </p>
            </div>
          </div>
        );

      case 'transformation':
        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-serif text-primary">The Journey</h3>
            <p className="text-white leading-relaxed">{interpretation.transformation.journey}</p>
            <div>
              <h4 className="text-lg text-primary mb-2">Future State</h4>
              <p className="text-white leading-relaxed">
                {interpretation.transformation.futureState}
              </p>
            </div>
          </div>
        );

      case 'guidance':
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-serif text-primary">Guidance</h3>
            <p className="text-white leading-relaxed">{interpretation.guidance.wisdom}</p>
            <div>
              <h4 className="text-lg text-primary mb-3">Right Action</h4>
              <ul className="space-y-2">
                {interpretation.guidance.rightAction.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-primary mt-1">✦</span>
                    <span className="text-white leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-lg text-primary mb-3">To Embody</h4>
              <ul className="space-y-2">
                {interpretation.guidance.toEmbody.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-primary mt-1">✦</span>
                    <span className="text-white leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-lg text-primary mb-3">To Avoid</h4>
              <ul className="space-y-2">
                {interpretation.guidance.toAvoid.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-primary mt-1">✦</span>
                    <span className="text-white leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );

      case 'timing':
        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-serif text-primary">Timing & Rhythm</h3>
            <p className="text-white leading-relaxed">{interpretation.timing.nature}</p>
            <div>
              <h4 className="text-lg text-primary mb-2">When to Act</h4>
              <p className="text-white leading-relaxed">{interpretation.timing.whenToAct}</p>
            </div>
            <div>
              <h4 className="text-lg text-primary mb-2">When to Wait</h4>
              <p className="text-white leading-relaxed">{interpretation.timing.whenToWait}</p>
            </div>
          </div>
        );

      case 'keyInsight':
        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-serif text-primary">Key Insight</h3>
            <div className="bg-surface border border-primary/20 rounded-lg p-6">
              <p className="text-primary text-lg leading-relaxed italic">
                {interpretation.keyInsight}
              </p>
            </div>
          </div>
        );

      case 'reflections':
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-serif text-primary">Reflections</h3>
            {interpretation.reflectionPrompts.map((prompt, index) => (
              <div key={index} className="bg-surface rounded-lg p-4">
                <p className="text-white leading-relaxed">{prompt}</p>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-8 max-w-4xl pb-24"
    >
      {/* Hexagrams Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Primary Hexagram */}
          <div className="flex flex-col items-center space-y-4">
            <p className="text-xs text-secondary uppercase tracking-wider">
              {hasChangingLines ? 'Present' : 'Your Hexagram'}
            </p>
            <div className="text-center space-y-1">
              <p className="text-xs text-secondary">#{primary.number}</p>
              <p className="text-xs text-secondary">
                {primary.chineseName} {primary.pinyinName}
              </p>
            </div>
            <HexagramDisplay lines={primaryHexagram.lines} maxLines={6} />
            <h3 className="text-xl font-serif text-primary text-center">{primary.englishName}</h3>
          </div>

          {/* Relating Hexagram */}
          {relatingHexagram && (
            <div className="flex flex-col items-center space-y-4">
              <p className="text-xs text-secondary uppercase tracking-wider">Future</p>
              <div className="text-center space-y-1">
                <p className="text-xs text-secondary">#{relatingHexagram.hexagram.number}</p>
                <p className="text-xs text-secondary">
                  {relatingHexagram.hexagram.chineseName}{' '}
                  {relatingHexagram.hexagram.pinyinName}
                </p>
              </div>
              <HexagramDisplay lines={relatingHexagram.lines} maxLines={6} />
              <h3 className="text-xl font-serif text-primary text-center">
                {relatingHexagram.hexagram.englishName}
              </h3>
            </div>
          )}
        </div>
      </motion.div>

      {/* Section Navigation */}
      {isV2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center gap-6 overflow-x-auto pb-2 border-b border-border/30">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setCurrentSection(section.id)}
                className={`relative px-2 py-2 transition-all whitespace-nowrap ${
                  currentSection === section.id
                    ? 'text-white'
                    : 'text-white hover:text-white'
                }`}
                style={{ letterSpacing: '0.15em' }}
              >
                <span className="text-sm uppercase">{section.label}</span>
                {currentSection === section.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Section Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="bg-card border border-border rounded-lg p-6 md:p-8 mb-8"
        >
          {renderSectionContent()}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex justify-between items-center"
      >
        <Button
          onClick={handlePrevious}
          disabled={!hasPrevious}
          variant="ghost"
          size="small"
          className="text-sm"
        >
          ← Previous
        </Button>
        <Button
          onClick={handleNext}
          disabled={!hasNext}
          variant="ghost"
          size="small"
          className="text-sm"
        >
          Next →
        </Button>
      </motion.div>
    </motion.div>
  );
};
