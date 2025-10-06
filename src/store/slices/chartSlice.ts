import { StateCreator } from 'zustand';
import { NatalChartData } from '../../types/user';
import { TransitData, AspectType } from '../../types/chart';

export interface ChartSlice {
  // Current chart data
  natalChart: NatalChartData | null;
  currentTransits: TransitData | null;

  // Chart calculation state
  isCalculating: boolean;
  calculationError: string | null;
  lastCalculated: number | null;

  // Chart display preferences
  selectedPlanet: string | null;
  selectedHouse: number | null;
  selectedAspect: string | null;
  aspectFilter: AspectType[];
  showTransits: boolean;

  // Actions
  setNatalChart: (chart: NatalChartData) => void;
  saveNatalChart: (userId: string, chart: NatalChartData, houseSystem: string) => Promise<void>;
  setCurrentTransits: (transits: TransitData) => void;
  setCalculating: (calculating: boolean) => void;
  setCalculationError: (error: string | null) => void;
  selectPlanet: (planet: string | null) => void;
  selectHouse: (house: number | null) => void;
  selectAspect: (aspect: string | null) => void;
  toggleAspectFilter: (aspectType: AspectType) => void;
  setShowTransits: (show: boolean) => void;
  clearChart: () => void;
}

export const createChartSlice: StateCreator<ChartSlice> = (set, get) => ({
  // Initial state
  natalChart: null,
  currentTransits: null,
  isCalculating: false,
  calculationError: null,
  lastCalculated: null,
  selectedPlanet: null,
  selectedHouse: null,
  selectedAspect: null,
  aspectFilter: ['conjunction', 'opposition', 'trine', 'square', 'sextile'],
  showTransits: false,

  // Actions
  setNatalChart: (chart) =>
    set({
      natalChart: chart,
      lastCalculated: Date.now(),
      calculationError: null,
    }),

  saveNatalChart: async (userId, chart, houseSystem) => {
    try {
      const { supabase } = await import('../../utils/supabase');

      // Insert or update natal_charts table with correct structure
      const { error: chartError } = await supabase
        .from('natal_charts')
        .upsert({
          user_id: userId,
          planets: chart.planets,
          houses: chart.houses,
          aspects: chart.aspects,
          angles: chart.angles,
          house_system: houseSystem,
          calculation_method: chart.metadata?.calculationMethod || 'swiss_ephemeris',
          precision: chart.metadata?.precision || 'professional',
          data_source: chart.metadata?.dataSource || 'swiss_ephemeris',
          version: chart.metadata?.version || '1.0',
          calculated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (chartError) {
        console.error('Failed to save natal chart to database:', chartError);
        throw new Error(chartError.message);
      }

      console.log('✅ Natal chart saved to database');

      // Update local state
      set({
        natalChart: chart,
        lastCalculated: Date.now(),
        calculationError: null,
      });
    } catch (error: any) {
      console.error('❌ Failed to save natal chart:', error);
      set({
        calculationError: error.message || 'Failed to save natal chart',
        isCalculating: false,
      });
      throw error;
    }
  },

  setCurrentTransits: (transits) => set({ currentTransits: transits }),

  setCalculating: (calculating) => set({ isCalculating: calculating }),

  setCalculationError: (error) =>
    set({
      calculationError: error,
      isCalculating: false,
    }),

  selectPlanet: (planet) => set({ selectedPlanet: planet }),

  selectHouse: (house) => set({ selectedHouse: house }),

  selectAspect: (aspect) => set({ selectedAspect: aspect }),

  toggleAspectFilter: (aspectType) => {
    const { aspectFilter } = get();
    const newFilter = aspectFilter.includes(aspectType)
      ? aspectFilter.filter((a) => a !== aspectType)
      : [...aspectFilter, aspectType];
    set({ aspectFilter: newFilter });
  },

  setShowTransits: (show) => set({ showTransits: show }),

  clearChart: () =>
    set({
      natalChart: null,
      currentTransits: null,
      selectedPlanet: null,
      selectedHouse: null,
      selectedAspect: null,
      calculationError: null,
    }),
});
