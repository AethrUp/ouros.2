'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface WeatherAspects {
  [key: string]: number;
}

interface PlanetWeather {
  description: string;
  aspects: WeatherAspects;
}

export interface CosmicWeather {
  moon?: PlanetWeather;
  venus?: PlanetWeather;
  mercury?: PlanetWeather;
}

interface CosmicWeatherChartProps {
  weather: CosmicWeather;
  className?: string;
}

const PLANET_CONFIG = {
  moon: {
    symbol: '☽',
    aspects: [
      { key: 'emotions', label: 'Emotions' },
      { key: 'intuition', label: 'Intuition' },
      { key: 'comfort', label: 'Comfort' },
    ],
  },
  venus: {
    symbol: '♀',
    aspects: [
      { key: 'love', label: 'Love' },
      { key: 'beauty', label: 'Beauty' },
      { key: 'pleasure', label: 'Pleasure' },
    ],
  },
  mercury: {
    symbol: '☿',
    aspects: [
      { key: 'communication', label: 'Dialog' },
      { key: 'thinking', label: 'Thinking' },
      { key: 'movement', label: 'Movement' },
    ],
  },
};

export const CosmicWeatherChart: React.FC<CosmicWeatherChartProps> = ({
  weather,
  className,
}) => {
  const renderPlanetSection = (planetKey: keyof typeof PLANET_CONFIG) => {
    const planetData = weather[planetKey];

    if (!planetData) {
      return null;
    }

    const config = PLANET_CONFIG[planetKey];

    return (
      <div key={planetKey} className="space-y-4">
        {/* Planet symbol and description */}
        <div className="flex flex-col items-center text-center">
          <div className="text-4xl text-white mb-2">{config.symbol}</div>
          <p className="text-sm text-white leading-relaxed text-justify">
            {planetData.description}
          </p>
        </div>

        {/* Aspect bars */}
        <div className="flex justify-between gap-3">
          {config.aspects.map((aspect) => {
            const intensity = planetData.aspects[aspect.key] || 0;
            const clampedIntensity = Math.max(0, Math.min(100, intensity));
            const position = `${clampedIntensity}%`;

            return (
              <div key={aspect.key} className="flex-1 flex flex-col items-center">
                {/* Slider container */}
                <div className="relative w-full h-[18px] flex items-center mb-2">
                  {/* Track */}
                  <div className="absolute inset-0 bg-[#141414] rounded" />
                  {/* Indicator line */}
                  <div
                    className="absolute w-0.5 h-full bg-primary"
                    style={{ left: position, transform: 'translateX(-50%)' }}
                  />
                </div>
                {/* Label */}
                <p className="text-xs text-white uppercase tracking-wider text-center">
                  {aspect.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const planetKeys: Array<keyof typeof PLANET_CONFIG> = ['moon', 'venus', 'mercury'];
  const planetsToRender = planetKeys.filter((key) => weather[key]);

  if (planetsToRender.length === 0) {
    return null;
  }

  return (
    <div className={cn('p-6 bg-card border border-border rounded-lg space-y-6', className)}>
      {planetsToRender.map((planetKey, index) => (
        <React.Fragment key={planetKey}>
          {renderPlanetSection(planetKey)}
          {index < planetsToRender.length - 1 && (
            <div className="h-px bg-white/50" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
