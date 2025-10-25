'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Moon, BookOpen, Save } from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { Button, TextArea, LoadingScreen } from '@/components/ui';
import { fadeInUp, transitions } from '@/lib/animations';
import { useAppStore } from '@/store';

type SessionStep = 'input' | 'interpreting' | 'complete';

export default function DreamsPage() {
  const router = useRouter();
  const { user } = useAppStore();

  const [sessionStep, setSessionStep] = useState<SessionStep>('input');
  const [dreamDescription, setDreamDescription] = useState('');
  const [interpretation, setInterpretation] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  // Handle dream submission
  const handleSubmit = async () => {
    if (dreamDescription.trim().length < 10) {
      setError('Please describe your dream in at least 10 characters');
      return;
    }

    setError('');
    setSessionStep('interpreting');
    setIsGenerating(true);

    try {
      // TODO: Integrate with actual AI dream interpretation
      // For now, simulate API call
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Mock interpretation
      const mockInterpretation = `Your dream reveals deep insights into your subconscious mind. The symbols and imagery you described suggest a time of transition and personal growth.

**Key Themes:**
• Transformation and change
• Hidden emotions seeking expression
• A call to trust your intuition

The presence of ${dreamDescription.includes('water') ? 'water' : 'these elements'} in your dream often symbolizes the flow of emotions and the unconscious mind. This suggests you may be processing feelings or experiences that haven't fully surfaced to your conscious awareness.

**Guidance:**
Pay attention to your dreams over the coming days. They may continue to reveal important messages about your inner journey. Consider journaling about any recurring symbols or feelings that emerge.

**Reflection Prompts:**
• What emotions did you feel during the dream?
• Are there any current life situations that mirror these dream elements?
• What might your subconscious be trying to communicate?

Trust that your dreams are guiding you toward greater self-understanding and wholeness.`;

      setInterpretation(mockInterpretation);
      setSessionStep('complete');
    } catch (err: any) {
      setError(err.message || 'Failed to generate interpretation');
      setSessionStep('input');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle save reading
  const handleSaveReading = async () => {
    // TODO: Save to Supabase
    console.log('💾 Saving dream reading...');
    alert('Dream reading saved! (TODO: Implement Supabase save)');
  };

  // Handle journal
  const handleJournal = () => {
    // TODO: Navigate to journal with linked reading
    router.push(`/journal?prompt=${encodeURIComponent(`Reflection on dream: ${dreamDescription.substring(0, 50)}...`)}`);
  };

  // Handle new reading
  const handleNewReading = () => {
    setSessionStep('input');
    setDreamDescription('');
    setInterpretation('');
    setError('');
  };

  // Render input view
  const renderInputView = () => (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      transition={transitions.spring}
      className="max-w-3xl mx-auto"
    >
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
          <Moon className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-3xl font-bold font-serif mb-4">Dream Interpretation</h2>
        <p className="text-secondary text-lg">
          Share your dream and discover its hidden meanings
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-8">
        <div className="mb-6">
          <label htmlFor="dream" className="block text-sm font-medium text-white mb-3">
            Describe Your Dream
          </label>
          <TextArea
            id="dream"
            value={dreamDescription}
            onChange={(e) => {
              setDreamDescription(e.target.value);
              if (error) setError('');
            }}
            placeholder="I was walking through a forest when I saw..."
            rows={10}
            className="w-full"
            helperText="Include as many details as you remember: settings, people, emotions, colors, and symbols"
          />
          {error && (
            <p className="mt-2 text-sm text-error">{error}</p>
          )}
        </div>

        <div className="bg-surface/50 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Tips for Better Interpretations
          </h3>
          <ul className="text-sm text-secondary space-y-1 ml-6 list-disc">
            <li>Describe the emotions you felt during the dream</li>
            <li>Note any recurring symbols or themes</li>
            <li>Mention colors, numbers, or specific details</li>
            <li>Include the overall atmosphere or mood</li>
          </ul>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={dreamDescription.trim().length < 10}
          className="w-full"
          variant="primary"
        >
          Interpret My Dream
        </Button>
      </div>
    </motion.div>
  );

  // Render interpreting view
  const renderInterpretingView = () => (
    <div className="max-w-3xl mx-auto">
      <LoadingScreen context="dream" />
      <div className="text-center mt-8">
        <p className="text-secondary">
          Analyzing your dream symbols and uncovering hidden meanings...
        </p>
      </div>
    </div>
  );

  // Render complete view
  const renderCompleteView = () => (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      transition={transitions.spring}
      className="max-w-4xl mx-auto"
    >
      {/* Dream Description */}
      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <h3 className="text-sm font-semibold text-secondary mb-3 flex items-center gap-2">
          <Moon className="w-4 h-4" />
          YOUR DREAM
        </h3>
        <p className="text-white leading-relaxed">{dreamDescription}</p>
      </div>

      {/* Interpretation */}
      <div className="bg-card border border-border rounded-lg p-8 mb-6">
        <h3 className="text-2xl font-bold font-serif mb-6 text-primary">
          Dream Interpretation
        </h3>
        <div className="prose prose-invert max-w-none">
          {interpretation.split('\n\n').map((paragraph, index) => (
            <p key={index} className="mb-4 text-white leading-relaxed whitespace-pre-wrap">
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Button
          onClick={handleSaveReading}
          variant="secondary"
          className="flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Reading
        </Button>
        <Button
          onClick={handleJournal}
          variant="secondary"
          className="flex items-center justify-center gap-2"
        >
          <BookOpen className="w-4 h-4" />
          Journal
        </Button>
        <Button
          onClick={handleNewReading}
          variant="primary"
        >
          New Dream
        </Button>
      </div>
    </motion.div>
  );

  return (
    <MainLayout headerTitle="Dream Interpretation" showBack>
      <div className="min-h-screen bg-background pb-20 lg:pb-8">
        <div className="container mx-auto px-4 py-8">
          <AnimatePresence mode="wait">
            {sessionStep === 'input' && (
              <motion.div key="input">{renderInputView()}</motion.div>
            )}
            {sessionStep === 'interpreting' && (
              <motion.div key="interpreting">{renderInterpretingView()}</motion.div>
            )}
            {sessionStep === 'complete' && (
              <motion.div key="complete">{renderCompleteView()}</motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MainLayout>
  );
}
