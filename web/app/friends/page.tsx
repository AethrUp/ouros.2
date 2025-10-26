'use client';

import { motion } from 'framer-motion';
import { Users, Sparkles, RotateCcw, UserPlus, Heart } from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui';
import { fadeInUp, transitions } from '@/lib/animations';

export default function FriendsPage() {
  return (
    <MainLayout headerTitle="Friends">
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
                <Users className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-4xl font-serif mb-4 text-primary">
                Friends & Synastry
              </h2>
              <p className="text-secondary text-lg max-w-2xl mx-auto">
                Connect with friends to explore astrological compatibility and relationship
                dynamics through synastry chart analysis
              </p>
            </div>

            {/* Coming Soon Notice */}
            <div className="bg-card border border-border rounded-lg p-12">
              <div className="text-center space-y-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl  mb-3">Social Features Coming Soon</h3>
                  <p className="text-secondary max-w-lg mx-auto leading-relaxed">
                    We're building a comprehensive social and synastry system that lets you
                    connect with friends and explore your astrological compatibility.
                  </p>
                </div>

                {/* Features List */}
                <div className="max-w-md mx-auto pt-6">
                  <div className="bg-surface rounded-lg p-6">
                    <h4 className="text-sm font-medium text-white mb-4">Upcoming Features:</h4>
                    <ul className="text-sm text-secondary space-y-3 text-left">
                      <li className="flex items-start gap-3">
                        <span className="text-primary">•</span>
                        <span>Add friends and build your cosmic network</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary">•</span>
                        <span>Synastry chart comparison (your chart vs theirs)</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary">•</span>
                        <span>Composite chart generation for relationships</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary">•</span>
                        <span>Compatibility scores for different life areas</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary">•</span>
                        <span>Relationship insights and guidance</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary">•</span>
                        <span>Share readings and interpretations</span>
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

            {/* What is Synastry */}
            <div className="mt-8 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <Heart className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg  mb-2 text-primary">What is Synastry?</h3>
                  <p className="text-white text-sm leading-relaxed">
                    Synastry is the ancient art of comparing two natal charts to understand
                    relationship dynamics. By analyzing how planets in one chart interact with
                    planets in another, we can reveal the strengths, challenges, and deeper
                    purpose of any relationship - romantic, friendship, or professional.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
