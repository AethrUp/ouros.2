'use client';

import React from 'react';
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

// Generate smooth SVG path using Catmull-Rom spline
const generateSmoothPath = (
  strengthCurve: number[],
  width: number,
  height: number,
  yMin: number,
  yMax: number
): string => {
  const padding = { top: 15, right: 10, bottom: 35, left: 10 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const xScale = chartWidth / 23; // 24 hours (0-23)
  const yRange = yMax - yMin;
  const yScale = chartHeight / yRange;

  const points = strengthCurve.map((strength, hour) => ({
    x: padding.left + hour * xScale,
    y: padding.top + (yMax - strength) * yScale,
  }));

  if (points.length < 2) return '';

  let path = `M ${points[0].x} ${points[0].y}`;

  // Use Catmull-Rom spline for smoother curves
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const tension = 0.5;

    // Calculate control points
    const cp1x = p1.x + ((p2.x - p0.x) / 6) * tension;
    const cp1y = p1.y + ((p2.y - p0.y) / 6) * tension;
    const cp2x = p2.x - ((p3.x - p1.x) / 6) * tension;
    const cp2y = p2.y - ((p3.y - p1.y) / 6) * tension;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return path;
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

export const TransitEffectivenessGraph: React.FC<TransitEffectivenessGraphProps> = ({
  transits,
  maxTransits = 3,
  className,
}) => {
  const graphWidth = 600; // Fixed width for consistency
  const graphHeight = 126;
  const padding = { top: 15, right: 10, bottom: 35, left: 10 };

  // Filter to only transits with timing data
  const validTransits = transits
    .filter((t) => t.timingData?.strengthCurve?.length === 24)
    .slice(0, maxTransits);

  if (validTransits.length === 0) {
    return null;
  }

  // Calculate scales with dynamic Y-axis range
  const chartWidth = graphWidth - padding.left - padding.right;
  const chartHeight = graphHeight - padding.top - padding.bottom;

  // Find min and max values across all transits
  let minStrength = 100;
  let maxStrength = 0;
  validTransits.forEach((transit) => {
    transit.timingData?.strengthCurve.forEach((strength) => {
      minStrength = Math.min(minStrength, strength);
      maxStrength = Math.max(maxStrength, strength);
    });
  });

  // Add padding to range
  const range = Math.max(maxStrength - minStrength, 40);
  const rangePadding = range * 0.25;
  const yMin = Math.max(0, minStrength - rangePadding);
  const yMax = Math.min(100, maxStrength + rangePadding);

  return (
    <div className={cn('p-4 bg-card border border-border rounded-lg', className)}>
      {/* Graph */}
      <svg
        width="100%"
        height={graphHeight}
        viewBox={`0 0 ${graphWidth} ${graphHeight}`}
        className="overflow-visible"
      >
        {/* Y-axis grid lines */}
        {[0, 0.5, 1].map((fraction) => {
          const y = padding.top + (1 - fraction) * chartHeight;
          return (
            <line
              key={`y-${fraction}`}
              x1={padding.left}
              y1={y}
              x2={padding.left + chartWidth}
              y2={y}
              stroke="rgb(var(--color-border))"
              strokeWidth="1"
              opacity="0.2"
            />
          );
        })}

        {/* X-axis time of day icons */}
        {[
          { icon: 'moonStars' },
          { icon: 'brightnessAltHighFill' },
          { icon: 'sunFill' },
          { icon: 'brightnessAltLow' },
        ].map(({ icon }, index, array) => {
          const iconSize = 16;
          const isFirst = index === 0;
          const isLast = index === array.length - 1;
          let x;
          if (isFirst) {
            x = padding.left;
          } else if (isLast) {
            x = padding.left + chartWidth - iconSize;
          } else {
            const spacing = chartWidth / (array.length - 1);
            x = padding.left + index * spacing - iconSize / 2;
          }
          return (
            <path
              key={`x-icon-${index}`}
              d={BootstrapIcons[icon as keyof typeof BootstrapIcons]}
              fill="#FFFFFF"
              opacity="0.8"
              transform={`translate(${x}, ${padding.top + chartHeight + 12}) scale(${iconSize / 16})`}
            />
          );
        })}

        {/* Transit curves */}
        {validTransits.map((transit, index) => {
          if (!transit.timingData?.strengthCurve) return null;

          const path = generateSmoothPath(
            transit.timingData.strengthCurve,
            graphWidth,
            graphHeight,
            yMin,
            yMax
          );

          // Get color based on transiting planet
          const planetKey = transit.planet?.toLowerCase().replace(/\s/g, '') || '';
          const color = PLANET_COLORS[planetKey] || FALLBACK_COLORS[index] || '#F6D99F';

          return (
            <path
              key={index}
              d={path}
              stroke={color}
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}

        {/* Bottom axis */}
        <line
          x1={padding.left}
          y1={padding.top + chartHeight}
          x2={padding.left + chartWidth}
          y2={padding.top + chartHeight}
          stroke="rgb(var(--color-border))"
          strokeWidth="1"
        />
      </svg>

      {/* Legend */}
      <div className="flex justify-center items-center gap-6 mt-4">
        {validTransits.map((transit, index) => {
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
    </div>
  );
};
