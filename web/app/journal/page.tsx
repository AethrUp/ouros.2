'use client';

import { motion } from 'framer-motion';
import { BookOpen, Sparkles, RotateCcw, PenLine, Calendar } from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui';
import { fadeInUp, transitions } from '@/lib/animations';

export default function JournalPage() {
  return (
    <MainLayout headerTitle="Journal">
      <div className="min-h-screen bg-background pb-20 lg:pb-8">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={transitions.spring}
            className="max-w-4xl mx-auto"
          >
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                <BookOpen className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-4xl font-bold font-serif mb-4 text-primary">
                Spiritual Journal
              </h2>
              <p className="text-secondary text-lg max-w-2xl mx-auto">
                Document your spiritual journey, reflect on insights, and track your growth
                through journaling linked to your readings
              </p>
            </div>

            {/* Coming Soon Notice */}
            <div className="bg-card border border-border rounded-lg p-12">
              <div className="text-center space-y-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-3">Digital Journal Coming Soon</h3>
                  <p className="text-secondary max-w-lg mx-auto leading-relaxed">
                    We're creating a beautiful journaling experience that seamlessly integrates
                    with your oracle readings, horoscopes, and astrological insights.
                  </p>
                </div>

                {/* Features List */}
                <div className="max-w-md mx-auto pt-6">
                  <div className="bg-surface rounded-lg p-6">
                    <h4 className="text-sm font-semibold text-white mb-4">Upcoming Features:</h4>
                    <ul className="text-sm text-secondary space-y-3 text-left">
                      <li className="flex items-start gap-3">
                        <span className="text-primary">•</span>
                        <span>Rich text editor for expressive journaling</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary">•</span>
                        <span>Link entries to oracle readings and horoscopes</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary">•</span>
                        <span>AI-powered reflection prompts based on your chart</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary">•</span>
                        <span>Tag entries by themes, emotions, and intentions</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary">•</span>
                        <span>Timeline view to track your spiritual evolution</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary">•</span>
                        <span>Search and filter past entries</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* CTA */}
                <div className="pt-6">
                  <Button
                    variant="ghost"
                    onClick={() => window.history.back()}
                    className="flex items-center justify-center gap-2 mx-auto"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Back to Dashboard
                  </Button>
                </div>
              </div>
            </div>

            {/* Why Journal */}
            <div className="mt-8 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <PenLine className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-primary">Why Keep a Spiritual Journal?</h3>
                  <p className="text-white text-sm leading-relaxed mb-3">
                    Journaling deepens your connection to cosmic wisdom and tracks your spiritual
                    evolution. By reflecting on readings, dreams, and insights, you create a
                    personal record of growth that reveals patterns and meaning over time.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-secondary">
                        Track how transits affect your life
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <BookOpen className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-secondary">
                        Document synchronicities and insights
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
