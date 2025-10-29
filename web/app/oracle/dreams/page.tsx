'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Moon, BookOpen, Save } from 'lucide-react';
import { toast } from 'sonner';
import { MainLayout } from '@/components/layout';
import { Button, TextArea, LoadingScreen } from '@/components/ui';
import { fadeInUp, transitions } from '@/lib/animations';
import { useAppStore } from '@/store';
import { fetchWithTimeout } from '@/lib/fetchWithTimeout';

type SessionStep = 'input' | 'interpreting' | 'complete';

export default function DreamsPage() {
  const router = useRouter();
  const { user } = useAppStore();

  const [sessionStep, setSessionStep] = useState<SessionStep>('input');
  const [dreamDescription, setDreamDescription] = useState('');
  const [interpretation, setInterpretation] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [savedReadingId, setSavedReadingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
      // Call the dream interpretation API
      const response = await fetchWithTimeout('/api/dream/interpret', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dreamDescription,
          style: 'psychological', // Can be made configurable later
          detailLevel: 'detailed',
        }),
      }, 60000); // 60 second timeout for AI generation

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate interpretation');
      }

      setInterpretation(data.interpretation);
      setSessionStep('complete');
      toast.success('Dream interpreted successfully');
    } catch (err: any) {
      const message = err.message || 'Failed to generate interpretation';
      setError(message);
      setSessionStep('input');
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle save reading
  const handleSaveReading = async () => {
    if (isSaving || savedReadingId) return; // Already saving or saved

    setIsSaving(true);
    setError('');

    try {
      const response = await fetchWithTimeout('/api/dream/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dreamDescription,
          interpretation,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to save dream reading');
      }

      setSavedReadingId(data.reading.id);
      toast.success('Reading saved');
    } catch (err: any) {
      const message = err.message || 'Failed to save dream reading';
      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle journal
  const handleJournal = async () => {
    // Save first if not already saved
    if (!savedReadingId && !isSaving) {
      await handleSaveReading();
    }

    // Navigate to journal with dream content
    const journalPrompt = `Dream Reflection\n\nDream: ${dreamDescription}\n\nInterpretation highlights: ${interpretation.substring(0, 200)}...`;
    const params = new URLSearchParams({
      type: 'dream',
      prompt: journalPrompt,
      title: 'Dream Journal Entry',
    });

    if (savedReadingId) {
      params.append('readingId', savedReadingId);
    }

    router.push(`/journal?${params.toString()}`);
  };

  // Handle new reading
  const handleNewReading = () => {
    setSessionStep('input');
    setDreamDescription('');
    setInterpretation('');
    setError('');
    setSavedReadingId(null);
    setIsSaving(false);
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
        <h2 className="text-3xl font-serif mb-4">Dream Interpretation</h2>
        <p className="text-secondary text-lg">
          Share your dream and discover its hidden meanings
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-8">
        <div className="mb-6">
          <label htmlFor="dream" className="block text-sm text-white mb-3">
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
          <h3 className="text-sm text-white mb-2 flex items-center gap-2">
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
        <h3 className="text-sm  text-secondary mb-3 flex items-center gap-2">
          <Moon className="w-4 h-4" />
          YOUR DREAM
        </h3>
        <p className="text-white leading-relaxed">{dreamDescription}</p>
      </div>

      {/* Interpretation */}
      <div className="bg-card border border-border rounded-lg p-8 mb-6">
        <h3 className="text-2xl font-serif mb-6 text-primary">
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
          disabled={isSaving || !!savedReadingId}
          className="flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : savedReadingId ? 'Saved' : 'Save Reading'}
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
