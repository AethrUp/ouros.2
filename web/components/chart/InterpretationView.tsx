'use client';

import { NatalChartData } from '@/types/user';
import { Button } from '@/components/ui/Button';
import { Sparkles } from 'lucide-react';
import { PlanetIcon } from '@/components/icons/PlanetIcon';

interface InterpretationViewProps {
  chartData: NatalChartData;
  onGenerateClick?: () => void;
}

interface SectionProps {
  title: string;
  content: string;
  planetIcon?: string;
}

const Section = ({ title, content, planetIcon }: SectionProps) => (
  <div className="space-y-3">
    <div className="flex items-center gap-3">
      {planetIcon && <PlanetIcon planet={planetIcon} size={28} className="text-primary" />}
      <h3 className="text-2xl font-serif text-primary">{title}</h3>
    </div>
    <p className="text-secondary leading-relaxed whitespace-pre-wrap text-base">
      {content}
    </p>
  </div>
);

export const InterpretationView = ({
  chartData,
  onGenerateClick,
}: InterpretationViewProps) => {
  const interpretation = chartData.wholeChartInterpretation;
  const hasPlanetInterpretations = chartData.planets &&
    Object.values(chartData.planets).some(
      planet => planet.personalizedDescription?.detailed
    );

  if (!interpretation && !hasPlanetInterpretations) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
          <Sparkles className="w-10 h-10 text-primary" />
        </div>
        <h3 className="text-2xl mb-3 text-white font-serif">
          Personalized Interpretation
        </h3>
        <p className="text-secondary mb-6 max-w-md mx-auto">
          Get an AI-generated interpretation of your entire natal chart, revealing the
          unique patterns and themes in your cosmic blueprint.
        </p>
        {onGenerateClick && (
          <Button onClick={onGenerateClick} className="mx-auto">
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Interpretation
          </Button>
        )}
      </div>
    );
  }

  // Helper function to get house suffix (1st, 2nd, 3rd, etc.)
  const getHouseSuffix = (house: number): string => {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = house % 100;
    return suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0];
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Whole Chart Interpretation */}
      {interpretation && (
        <div className="bg-card border border-border rounded-2xl p-8 space-y-8">
          <div className="flex items-center gap-3 pb-4 border-b border-border/30">
            <Sparkles className="w-6 h-6 text-primary" />
            <h3 className="text-3xl font-serif text-primary">Your Natal Chart</h3>
          </div>

          {/* Core Nature */}
          {interpretation.coreNature && (
            <div className="space-y-3">
              <h1 className="text-xl font-serif text-primary">Your Core Nature</h1>
              <p className="text-secondary leading-relaxed whitespace-pre-wrap">
                {interpretation.coreNature}
              </p>
            </div>
          )}

          {/* Love & Connection */}
          {interpretation.loveAndConnection && (
            <div className="space-y-3">
              <h1 className="text-xl font-serif text-primary">How You Love & Connect</h1>
              <p className="text-secondary leading-relaxed whitespace-pre-wrap">
                {interpretation.loveAndConnection}
              </p>
            </div>
          )}

          {/* Growth Edge */}
          {interpretation.growthEdge && (
            <div className="space-y-3">
              <h1 className="text-xl font-serif text-primary">Your Growth Edge</h1>
              <p className="text-secondary leading-relaxed whitespace-pre-wrap">
                {interpretation.growthEdge}
              </p>
            </div>
          )}

          {/* Gifts to World */}
          {interpretation.giftsToWorld && (
            <div className="space-y-3">
              <h1 className="text-xl font-serif text-primary">Your Gifts to the World</h1>
              <p className="text-secondary leading-relaxed whitespace-pre-wrap">
                {interpretation.giftsToWorld}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Section divider if we have both whole chart and planet interpretations */}
      {interpretation && hasPlanetInterpretations && (
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-border/50" />
          <span className="text-sm text-secondary tracking-wider">PLANET DETAILS</span>
          <div className="flex-1 h-px bg-border/50" />
        </div>
      )}

      {/* Individual Planet Interpretations */}
      {hasPlanetInterpretations && Object.entries(chartData.planets).map(([planetKey, planetData]) => {
        const planetInterpretation = planetData.personalizedDescription;

        if (!planetInterpretation?.detailed) return null;

        return (
          <div key={planetKey} className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-border/30">
              <PlanetIcon planet={planetKey} size={24} className="text-primary" />
              <div className="flex-1">
                <h3 className="text-xl  text-primary">{planetKey.toUpperCase()}</h3>
                <p className="text-sm text-white tracking-wide">
                  in {planetData.sign} • {planetData.house}{getHouseSuffix(planetData.house)} House
                </p>
              </div>
            </div>
            <p className="text-secondary leading-relaxed whitespace-pre-wrap">
              {planetInterpretation.detailed}
            </p>
          </div>
        );
      })}

      {/* Footer info */}
      <div className="pt-8 border-t border-border">
        <p className="text-xs text-secondary text-center">
          This interpretation was generated using AI based on your natal chart positions.
        </p>
      </div>
    </div>
  );
};
