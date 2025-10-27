'use client';

import { useMemo } from 'react';
import { NatalChartData } from '@/types/user';
import { Modal } from '@/components/ui/Modal';
import { PlanetIcon } from '@/components/icons/PlanetIcon';
import { ZodiacIcon } from '@/components/icons/ZodiacIcon';
import { formatDegrees } from '@/utils/chart/formatDegrees';
import { cn } from '@/lib/utils';

interface PlanetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  planetKey: string | null;
  chartData: NatalChartData;
}

const ASPECT_SYMBOLS: Record<string, string> = {
  conjunction: '☌',
  opposition: '☍',
  trine: '△',
  square: '□',
  sextile: '⚹',
  semi_sextile: '⚺',
  quintile: 'Q',
  bi_quintile: 'bQ',
  quincunx: '⚻',
};

export const PlanetDetailModal = ({
  isOpen,
  onClose,
  planetKey,
  chartData,
}: PlanetDetailModalProps) => {
  const planet = planetKey ? chartData.planets[planetKey] : null;

  const aspects = useMemo(() => {
    if (!planetKey || !chartData.aspects) return [];

    return chartData.aspects.filter(
      (aspect) => aspect.planet1 === planetKey || aspect.planet2 === planetKey
    );
  }, [planetKey, chartData.aspects]);

  if (!planet || !planetKey) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="large" showCloseButton={false}>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center border-b border-border pb-6">
          <PlanetIcon planet={planetKey} size={48} className="text-primary mb-3" />
          <h2 className="text-4xl capitalize font-serif text-white">
            {planetKey} in {planet.sign}
          </h2>
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-secondary hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Position Section */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-6 bg-surface rounded-lg border border-border">
            <div className="h-[2.25rem] flex items-center justify-center mb-2">
              <ZodiacIcon sign={planet.sign} size={36} className="text-primary" />
            </div>
            <div className="text-sm text-secondary uppercase tracking-wide">
              Sign
            </div>
          </div>
          <div className="text-center p-6 bg-surface rounded-lg border border-border">
            <div className="text-4xl font-serif text-primary mb-2 h-[2.25rem] flex items-center justify-center">{planet.house}</div>
            <div className="text-sm text-secondary uppercase tracking-wide">House</div>
          </div>
          <div className="text-center p-6 bg-surface rounded-lg border border-border">
            <div className="text-4xl font-serif text-primary mb-2 h-[2.25rem] flex items-center justify-center">
              {formatDegrees(planet.degree % 30)}
            </div>
            <div className="text-sm text-secondary uppercase tracking-wide">Position</div>
            {planet.retrograde && (
              <div className="text-xs text-primary mt-2">Retrograde ℞</div>
            )}
          </div>
        </div>

        {/* Interpretation */}
        {planet.personalizedDescription && (
          <div className="border-t border-border pt-6">
            <h3 className="text-2xl  mb-4 font-serif text-primary">
              Interpretation
            </h3>

            {planet.personalizedDescription.brief && (
              <p className="text-white text-lg mb-4 leading-relaxed">
                {planet.personalizedDescription.brief}
              </p>
            )}

            {planet.personalizedDescription.detailed && (
              <p className="text-secondary leading-relaxed">
                {planet.personalizedDescription.detailed}
              </p>
            )}

            {planet.personalizedDescription.keywords &&
              planet.personalizedDescription.keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-6">
                  {planet.personalizedDescription.keywords.map((keyword, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-primary/10 border border-primary/30 rounded-full text-xs text-primary"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              )}
          </div>
        )}

        {/* Aspects */}
        <div className="border-t border-border pt-6">
          <h3 className="text-2xl  mb-4 font-serif text-primary">
            Aspects
          </h3>

          {aspects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {aspects.map((aspect) => {
                const otherPlanet =
                  aspect.planet1 === planetKey ? aspect.planet2 : aspect.planet1;
                const strength = aspect.strength || 0;

                return (
                  <div
                    key={aspect.id}
                    className="p-4 bg-surface rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <PlanetIcon planet={otherPlanet} size={24} className="text-primary" />
                      <span className=" capitalize text-white">
                        {otherPlanet}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl text-primary">
                          {ASPECT_SYMBOLS[aspect.type] || '•'}
                        </span>
                        <span className="text-sm capitalize text-secondary">
                          {aspect.type.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-xs text-secondary">
                        Orb: {aspect.orb.toFixed(2)}°
                      </span>
                    </div>

                    {/* Strength indicator */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-secondary">Strength</span>
                        <span className="text-xs text-secondary">
                          {Math.round(strength * 100)}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-border rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full transition-all rounded-full',
                            strength >= 0.8 ? 'bg-primary' : 'bg-primary/50'
                          )}
                          style={{ width: `${strength * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-secondary text-sm text-center py-8">
              No major aspects found for this planet.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};
