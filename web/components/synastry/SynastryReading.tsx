'use client';

import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SynastryChart } from '@/types/synastry';

interface SynastryReadingProps {
  interpretation: string;
  synastryChart: SynastryChart;
}

export const SynastryReading: React.FC<SynastryReadingProps> = ({ interpretation, synastryChart }) => {
  return (
    <div className="space-y-8">
      {/* Main Interpretation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-xl font-serif text-primary uppercase tracking-wide mb-4">
          Relationship Dynamics
        </h2>
        <div className="prose prose-invert prose-primary max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => (
                <p className="text-white leading-relaxed text-base mb-4">{children}</p>
              ),
              strong: ({ children }) => (
                <strong className="text-primary font-semibold">{children}</strong>
              ),
              em: ({ children }) => (
                <em className="text-primary/90 italic">{children}</em>
              ),
              h1: ({ children }) => (
                <h1 className="text-2xl font-serif text-primary mb-4 mt-6">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-xl font-serif text-primary mb-3 mt-5">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-lg font-serif text-primary mb-2 mt-4">{children}</h3>
              ),
              ul: ({ children }) => (
                <ul className="space-y-2 my-4">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="space-y-2 my-4 list-decimal list-inside">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="text-white leading-relaxed flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>{children}</span>
                </li>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-primary pl-4 italic text-secondary my-4">
                  {children}
                </blockquote>
              ),
            }}
          >
            {interpretation}
          </ReactMarkdown>
        </div>
      </motion.div>

      {/* Strengths */}
      {synastryChart.strengths && synastryChart.strengths.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="border-t border-border pt-8"
        >
          <h2 className="text-xl font-serif text-primary uppercase tracking-wide mb-4">
            Relationship Strengths
          </h2>
          <ul className="space-y-3">
            {synastryChart.strengths.map((strength, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-start"
              >
                <span className="text-primary mr-3 mt-1 flex-shrink-0">✦</span>
                <span className="text-white leading-relaxed">{strength}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Recommendations */}
      {synastryChart.recommendations && synastryChart.recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <h3 className="text-lg font-serif text-white mb-3">Recommendations</h3>
          <ul className="space-y-3">
            {synastryChart.recommendations.map((rec, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-start"
              >
                <span className="text-primary mr-3 mt-1 flex-shrink-0">✦</span>
                <span className="text-white leading-relaxed">{rec}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Challenges */}
      {synastryChart.challenges && synastryChart.challenges.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="border-t border-border pt-8"
        >
          <h2 className="text-xl font-serif text-primary uppercase tracking-wide mb-3">
            Growth Opportunities
          </h2>
          <p className="text-white leading-relaxed mb-4">
            Every relationship has areas for growth. These challenges can strengthen your bond when approached with
            awareness and compassion.
          </p>
          <ul className="space-y-3">
            {synastryChart.challenges.map((challenge, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-start"
              >
                <span className="text-primary mr-3 mt-1 flex-shrink-0">✦</span>
                <span className="text-white leading-relaxed">{challenge}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
};
