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
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Header */}
        <div className="grid grid-cols-[160px_1fr_120px] border-b-2 border-primary/50 mb-4">
          <div className="p-4 text-sm  tracking-wider text-primary">
            SIGNS
          </div>
          <div className="p-4 text-sm  tracking-wider text-primary">
            PLANETS
          </div>
          <div className="p-4 text-sm  tracking-wider text-primary">
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
                className="relative border-b border-border/30"
                style={{ height: totalHeight }}
              >
                {/* Sign Cell - Absolute positioned, spans full height */}
                <div
                  className="absolute left-0 top-0 w-[160px] border-r border-border flex items-center justify-center gap-2"
                  style={{ height: totalHeight }}
                >
                  <ZodiacIcon sign={signGroup.sign} size={24} className="text-primary" />
                  <span className=" capitalize">{signGroup.sign}</span>
                </div>

                {/* Planet Cells - Stacked vertically */}
                <div className="ml-[160px] mr-[120px]">
                  {signGroup.planets.map((planet, idx) => (
                    <button
                      key={planet.key}
                      onClick={() => onPlanetClick?.(planet.key)}
                      className={cn(
                        'w-full h-[60px] px-6 flex items-center gap-3',
                        'hover:bg-surface/50 transition-colors',
                        'border-r border-border',
                        idx < signGroup.planets.length - 1 && 'border-b border-border/30'
                      )}
                    >
                      <PlanetIcon planet={planet.key} size={20} className="text-primary" />
                      <span className=" capitalize">{planet.key}</span>
                      {planet.retrograde && (
                        <span className="text-xs text-secondary ml-1">(R)</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* House Cell - Absolute positioned, spans full height */}
                <div
                  className="absolute right-0 top-0 w-[120px] flex items-center justify-center"
                  style={{ height: totalHeight }}
                >
                  <span className="text-2xl text-primary">
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
