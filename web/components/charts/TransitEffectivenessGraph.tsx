'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { cn } from '@/lib/utils';

export interface TransitAnalysisItem {
  planet?: string;
  natalPlanet?: string;
  aspectType?: string;
  timingData?: {
    strengthCurve: number[]; // 24 values (0-100) representing hourly strength
    peakTime?: string;
    effectivePeriod?: string;
  };
}

interface TransitEffectivenessGraphProps {
  transits: TransitAnalysisItem[];
  maxTransits?: number;
  className?: string;
}

// Color mappings for celestial bodies
const PLANET_COLORS: Record<string, string> = {
  // Personal planets
  sun: '#FDB813',      // Gold/Yellow
  moon: '#C0C0C0',     // Silver
  mercury: '#87CEEB',  // Sky Blue
  venus: '#FF69B4',    // Pink
  mars: '#DC143C',     // Crimson Red

  // Social planets
  jupiter: '#FF8C00',  // Dark Orange
  saturn: '#4B0082',   // Indigo

  // Outer planets
  uranus: '#00CED1',   // Dark Turquoise
  neptune: '#9370DB',  // Medium Purple
  pluto: '#8B4513',    // Saddle Brown

  // Points
  northnode: '#32CD32', // Lime Green
  southnode: '#228B22', // Forest Green
  chiron: '#9B85AE',    // Muted Purple
};

// Fallback colors
const FALLBACK_COLORS = [
  '#F6D99F', // Gold - primary
  '#A8C0D4', // Blue - secondary
  '#C9A9E0', // Purple - tertiary
];

const PLANET_SYMBOLS: Record<string, string> = {
  sun: '☉',
  moon: '☽',
  mercury: '☿',
  venus: '♀',
  mars: '♂',
  jupiter: '♃',
  saturn: '♄',
  uranus: '♅',
  neptune: '♆',
  pluto: '♇',
  chiron: '⚷',
  northnode: '☊',
  southnode: '☋',
};

// Bootstrap Icons SVG paths for time of day
const BootstrapIcons = {
  moonStars: 'M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278zM4.858 1.311A7.269 7.269 0 0 0 1.025 7.71c0 4.02 3.279 7.276 7.319 7.276a7.316 7.316 0 0 0 5.205-2.162c-.337.042-.68.063-1.029.063-4.61 0-8.343-3.714-8.343-8.29 0-1.167.242-2.278.681-3.286z',
  brightnessAltHighFill: 'M8 3a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 3zm8 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zm-13.5.5a.5.5 0 0 0 0-1h-2a.5.5 0 0 0 0 1h2zm11.157-6.157a.5.5 0 0 1 0 .707l-1.414 1.414a.5.5 0 1 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm-9.9 2.121a.5.5 0 0 0 .707-.707L3.05 5.343a.5.5 0 1 0-.707.707l1.414 1.414zM8 7a4 4 0 0 0-4 4 .5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5 4 4 0 0 0-4-4z',
  sunFill: 'M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z',
  brightnessAltLow: 'M8 3a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 3zm8 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zm-13.5.5a.5.5 0 0 0 0-1h-2a.5.5 0 0 0 0 1h2zm11.157-6.157a.5.5 0 0 1 0 .707l-1.414 1.414a.5.5 0 1 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm-9.9 2.121a.5.5 0 0 0 .707-.707L3.05 5.343a.5.5 0 1 0-.707.707l1.414 1.414zM8 7a4 4 0 0 0-4 4 .5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5 4 4 0 0 0-4-4zm0 4.5a3 3 0 0 1 2.959-2.5A3.5 3.5 0 0 1 8 11.5z',
};

// Get planet symbol
const getPlanetSymbol = (planetName?: string): string => {
  if (!planetName) return '•';
  const key = planetName.toLowerCase().replace(/\s/g, '');
  return PLANET_SYMBOLS[key] || planetName.charAt(0).toUpperCase();
};

// Get aspect symbol
const getAspectSymbol = (aspectType?: string): string => {
  if (!aspectType) return '☍';
  const aspect = aspectType.toLowerCase();
  if (aspect.includes('conjunction')) return '☌';
  if (aspect.includes('opposition')) return '☍';
  if (aspect.includes('trine')) return '△';
  if (aspect.includes('square')) return '□';
  if (aspect.includes('sextile')) return '⚹';
  return '☍';
};

// Custom legend component
const CustomLegend = ({ transits }: { transits: TransitAnalysisItem[] }) => {
  return (
    <div className="flex justify-center items-center gap-6 mt-4">
      {transits.map((transit, index) => {
        const planetSymbol = getPlanetSymbol(transit.planet);
        const aspectSymbol = getAspectSymbol(transit.aspectType);
        const natalSymbol = getPlanetSymbol(transit.natalPlanet);

        // Get color
        const planetKey = transit.planet?.toLowerCase().replace(/\s/g, '') || '';
        const color = PLANET_COLORS[planetKey] || FALLBACK_COLORS[index] || '#F6D99F';

        return (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            <div className="flex items-center text-base tracking-wider">
              <span>{planetSymbol}</span>
              <span className="opacity-50"> {aspectSymbol} </span>
              <span>{natalSymbol}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Custom Y-axis tick component (hidden for cleaner look)
const CustomYAxisTick = () => {
  return null;
};

export const TransitEffectivenessGraph: React.FC<TransitEffectivenessGraphProps> = ({
  transits,
  maxTransits = 3,
  className,
}) => {
  // Filter to only transits with timing data
  const validTransits = transits
    .filter((t) => t.timingData?.strengthCurve?.length === 24)
    .slice(0, maxTransits);

  if (validTransits.length === 0) {
    return null;
  }

  // Transform data for Recharts
  const chartData = Array.from({ length: 24 }, (_, hour) => {
    const dataPoint: any = { hour };
    validTransits.forEach((transit, index) => {
      dataPoint[`transit${index}`] = transit.timingData?.strengthCurve[hour] || 0;
    });
    return dataPoint;
  });

  // Calculate dynamic min and max values from all transit data
  const allValues: number[] = [];
  validTransits.forEach((transit) => {
    if (transit.timingData?.strengthCurve) {
      allValues.push(...transit.timingData.strengthCurve);
    }
  });

  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);

  return (
    <div className={cn('h-full p-4 bg-card border border-border rounded-lg flex flex-col', className)}>
      {/* Graph */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255, 255, 255, 0.1)"
            />
            <XAxis
              dataKey="hour"
              stroke="#FFFFFF"
              tick={false}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.3)' }}
            />
            <YAxis
              stroke="#FFFFFF"
              tick={<CustomYAxisTick />}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.3)' }}
              domain={[minValue, maxValue]}
              hide={true}
            />
            {validTransits.map((transit, index) => {
              const planetKey = transit.planet?.toLowerCase().replace(/\s/g, '') || '';
              const color = PLANET_COLORS[planetKey] || FALLBACK_COLORS[index] || '#F6D99F';

              return (
                <Line
                  key={index}
                  type="natural"
                  dataKey={`transit${index}`}
                  stroke={color}
                  strokeWidth={3}
                  dot={false}
                  animationDuration={1000}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Time of day icons */}
      <div className="flex justify-between px-2 pb-2">
        {[
          { icon: 'moonStars' },
          { icon: 'brightnessAltHighFill' },
          { icon: 'sunFill' },
          { icon: 'brightnessAltLow' },
        ].map(({ icon }, index) => (
          <svg
            key={`x-icon-${index}`}
            width="24"
            height="24"
            viewBox="0 0 16 16"
            fill="#FFFFFF"
            opacity="0.8"
          >
            <path d={BootstrapIcons[icon as keyof typeof BootstrapIcons]} />
          </svg>
        ))}
      </div>

      {/* Legend */}
      <CustomLegend transits={validTransits} />
    </div>
  );
};
