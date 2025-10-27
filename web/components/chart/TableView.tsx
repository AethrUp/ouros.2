'use client';

import { useMemo } from 'react';
import { NatalChartData } from '@/types/user';
import { groupPlanetsBySign } from '@/utils/chart/groupPlanetsBySign';
import { PlanetIcon } from '@/components/icons/PlanetIcon';
import { ZodiacIcon } from '@/components/icons/ZodiacIcon';
import { cn } from '@/lib/utils';

interface TableViewProps {
  chartData: NatalChartData;
  onPlanetClick?: (planetKey: string) => void;
}

export const TableView = ({ chartData, onPlanetClick }: TableViewProps) => {
  const tableData = useMemo(() => groupPlanetsBySign(chartData), [chartData]);

  return (
    <div>
      <div>
        {/* Header */}
        <div className="grid grid-cols-[100px_1fr_80px] md:grid-cols-[160px_1fr_120px] border-b-[3px] border-primary/80 mb-4">
          <div className="p-2 md:p-4 text-xs md:text-sm tracking-wider text-primary">
            SIGNS
          </div>
          <div className="p-2 md:p-4 text-xs md:text-sm tracking-wider text-primary">
            PLANETS
          </div>
          <div className="p-2 md:p-4 text-xs md:text-sm tracking-wider text-primary">
            HOUSES
          </div>
        </div>

        {/* Body - Using flexbox with relative/absolute positioning for row spanning */}
        <div className="space-y-0">
          {tableData.map((signGroup) => {
            const rowHeight = 60; // Height per planet row in pixels
            const totalHeight = signGroup.planets.length * rowHeight;

            return (
              <div
                key={signGroup.sign}
                className="relative border-b-2 border-white/50"
                style={{ height: totalHeight }}
              >
                {/* Sign Cell - Absolute positioned, spans full height */}
                <div
                  className="absolute left-0 top-0 w-[100px] md:w-[160px] border-r-2 border-white/50 flex items-center justify-center gap-1 md:gap-2"
                  style={{ height: totalHeight }}
                >
                  <ZodiacIcon sign={signGroup.sign} size={20} className="text-primary md:hidden" />
                  <ZodiacIcon sign={signGroup.sign} size={24} className="text-primary hidden md:block" />
                  <span className="font-serif capitalize text-white text-sm md:text-base">{signGroup.sign}</span>
                </div>

                {/* Planet Cells - Stacked vertically */}
                <div className="ml-[100px] mr-[80px] md:ml-[160px] md:mr-[120px]">
                  {signGroup.planets.map((planet, idx) => (
                    <button
                      key={planet.key}
                      onClick={() => onPlanetClick?.(planet.key)}
                      className={cn(
                        'w-full h-[60px] px-3 md:px-6 flex items-center gap-2 md:gap-3',
                        'hover:bg-surface/50 transition-colors',
                        'border-r-2 border-white/50',
                        idx < signGroup.planets.length - 1 && 'border-b-2 border-white/30'
                      )}
                    >
                      <PlanetIcon planet={planet.key} size={16} className="text-primary md:hidden" />
                      <PlanetIcon planet={planet.key} size={20} className="text-primary hidden md:block" />
                      <span className="text-xs md:text-sm font-medium uppercase tracking-wider">{planet.key}</span>
                      {planet.retrograde && (
                        <span className="text-xs text-secondary ml-1">(R)</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* House Cell - Absolute positioned, spans full height */}
                <div
                  className="absolute right-0 top-0 w-[80px] md:w-[120px] flex items-center justify-center"
                  style={{ height: totalHeight }}
                >
                  <span className="text-xl md:text-2xl font-serif text-white">
                    {signGroup.planets[0].house}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
