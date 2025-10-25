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
  generateNatalChart: (birthDate: string, birthTime: string, birthLocation: any) => Promise<NatalChartData>;
  setNatalChart: (chart: NatalChartData) => void;
  saveNatalChart: (userId: string, chart: NatalChartData, houseSystem: string) => Promise<void>;
  loadNatalChart: (userId: string) => Promise<void>;
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
  generateNatalChart: async (birthDate, birthTime, birthLocation) => {
    set({ isCalculating: true, calculationError: null });

    try {
      console.log('🌟 Generating natal chart...', { birthDate, birthTime, location: birthLocation.name });

      const response = await fetch('/api/chart/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthDate,
          birthTime,
          birthLocation,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate natal chart');
      }

      // Transform API response to NatalChartData format
      const chartData = result.data;

      // Convert planets object to Record<string, PlanetPosition>
      const planets: Record<string, any> = {};
      for (const [planetName, planetData] of Object.entries(chartData.planets)) {
        const data = planetData as any;
        planets[planetName] = {
          planet: planetName,
          sign: data.sign.toLowerCase(),
          degree: data.degree,
          longitude: data.longitude,
          latitude: data.latitude || 0,
          house: data.house,
          retrograde: data.isRetrograde || false,
          speed: 0, // Speed not provided by API yet
        };
      }

      // Convert houses object to HousePosition array
      const houses = Object.entries(chartData.houses).map(([houseNum, houseData]: [string, any]) => ({
        house: parseInt(houseNum),
        sign: houseData.sign.toLowerCase(),
        degree: houseData.cusp % 30,
        longitude: houseData.cusp,
      }));

      // Create NatalChartData object
      const natalChart: NatalChartData = {
        planets,
        houses,
        aspects: [], // Aspects will be calculated separately later
        angles: {
          ascendant: chartData.angles.ascendant,
          midheaven: chartData.angles.midheaven,
          descendant: chartData.angles.descendant,
          imumCoeli: chartData.angles.imumCoeli,
        },
        metadata: {
          houseSystem: 'placidus',
          precision: 'professional',
          dataSource: 'swiss_ephemeris',
          calculationMethod: 'swiss_ephemeris',
          generatedAt: chartData.generatedAt,
          version: '1.0',
        },
      };

      set({
        natalChart,
        lastCalculated: Date.now(),
        isCalculating: false,
        calculationError: null,
      });

      console.log('✅ Natal chart generated successfully');
      return natalChart;
    } catch (error: any) {
      console.error('❌ Failed to generate natal chart:', error);
      set({
        calculationError: error.message || 'Failed to generate natal chart',
        isCalculating: false,
      });
      throw error;
    }
  },

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

  loadNatalChart: async (userId) => {
    set({ isCalculating: true, calculationError: null });
    try {
      const { supabase } = await import('../../utils/supabase');

      const { data, error } = await supabase
        .from('natal_charts')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No natal chart found - this is ok for new users
          console.log('No natal chart found for user');
          set({ natalChart: null, isCalculating: false });
          return;
        }
        throw new Error(error.message);
      }

      if (data) {
        // Map database data to NatalChartData format
        const natalChart: NatalChartData = {
          planets: data.planets,
          houses: data.houses,
          aspects: data.aspects,
          angles: data.angles,
          metadata: {
            houseSystem: data.house_system,
            precision: data.precision,
            dataSource: data.data_source,
            calculationMethod: data.calculation_method,
            generatedAt: data.calculated_at,
            version: data.version,
          },
        };

        set({
          natalChart,
          lastCalculated: new Date(data.calculated_at).getTime(),
          isCalculating: false,
          calculationError: null,
        });
        console.log('✅ Natal chart loaded from database');
      }
    } catch (error: any) {
      console.error('❌ Failed to load natal chart:', error);
      set({
        calculationError: error.message || 'Failed to load natal chart',
        isCalculating: false,
      });
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
