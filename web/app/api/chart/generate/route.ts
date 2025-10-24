import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_SWISSEPH_API_URL || 'https://astrologyapp-production.up.railway.app';

interface PlanetPositionRaw {
  longitude: number;
  latitude: number;
  distance: number;
  speed: number;
  speedLat: number;
  speedDist: number;
}

interface HouseCuspsRaw {
  houses: number[];
  angles: {
    ascendant: number;
    midheaven: number;
    descendant: number;
    imumCoeli: number;
  };
}

// Helper to get zodiac sign from longitude
function getZodiacSign(longitude: number): string {
  const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  const signIndex = Math.floor(longitude / 30);
  return signs[signIndex];
}

// Helper to get house for a planet
function getPlanetHouse(planetLongitude: number, houseCusps: number[]): number {
  for (let i = 0; i < 12; i++) {
    const nextHouse = (i + 1) % 12;
    const cusp = houseCusps[i];
    const nextCusp = houseCusps[nextHouse];

    if (nextCusp > cusp) {
      if (planetLongitude >= cusp && planetLongitude < nextCusp) {
        return i + 1;
      }
    } else {
      if (planetLongitude >= cusp || planetLongitude < nextCusp) {
        return i + 1;
      }
    }
  }
  return 1;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { birthDate, birthTime, birthLocation } = body;

    if (!birthDate || !birthTime || !birthLocation) {
      return NextResponse.json(
        { success: false, error: 'Missing required birth data' },
        { status: 400 }
      );
    }

    console.log('🌟 Generating natal chart for:', { birthDate, birthTime, location: birthLocation.name });

    // Calculate timezone offset in hours (birthLocation.timezoneOffset is in seconds)
    const timezoneHours = birthLocation.timezoneOffset ? birthLocation.timezoneOffset / 3600 : 0;

    // Step 1: Calculate planets
    const planetsResponse = await fetch(`${API_BASE_URL}/api/planets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: birthDate,
        time: birthTime,
        timezone: timezoneHours,
      }),
    });

    const planetsData = await planetsResponse.json();
    if (!planetsData.success) {
      throw new Error(planetsData.error || 'Failed to calculate planets');
    }

    // Step 2: Calculate houses
    const housesResponse = await fetch(`${API_BASE_URL}/api/houses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: birthDate,
        time: birthTime,
        timezone: timezoneHours,
        latitude: birthLocation.latitude,
        longitude: birthLocation.longitude,
        system: 'placidus',
      }),
    });

    const housesData = await housesResponse.json();
    if (!housesData.success) {
      throw new Error(housesData.error || 'Failed to calculate houses');
    }

    // Convert houses data
    let housesArray: number[];
    if (Array.isArray(housesData.houses)) {
      housesArray = housesData.houses;
    } else if (typeof housesData.houses === 'object') {
      housesArray = [];
      for (let i = 1; i <= 12; i++) {
        const house = housesData.houses[i.toString()];
        if (house && house.cusp !== null && house.cusp !== undefined) {
          housesArray.push(house.cusp);
        }
      }
    } else {
      throw new Error('Invalid houses data structure');
    }

    // Process planets into chart format
    const planets: Record<string, any> = {};
    const planetNames = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];

    for (const planetName of planetNames) {
      const planetData: PlanetPositionRaw = planetsData.positions[planetName];
      if (planetData) {
        const longitude = planetData.longitude;
        const sign = getZodiacSign(longitude);
        const degree = longitude % 30;
        const house = getPlanetHouse(longitude, housesArray);

        planets[planetName] = {
          sign,
          degree,
          house,
          longitude,
          latitude: planetData.latitude,
          isRetrograde: planetData.speed < 0,
        };
      }
    }

    // Process houses
    const houses: Record<string, any> = {};
    for (let i = 0; i < 12; i++) {
      const cusp = housesArray[i];
      houses[(i + 1).toString()] = {
        cusp,
        sign: getZodiacSign(cusp),
      };
    }

    // Extract angles
    const angles = {
      ascendant: housesData.angles?.ascendant || housesArray[0],
      midheaven: housesData.angles?.midheaven || housesArray[9],
      descendant: housesData.angles?.descendant || housesArray[6],
      imumCoeli: housesData.angles?.imumCoeli || housesArray[3],
    };

    const natalChart = {
      planets,
      houses,
      angles,
      birthData: {
        birthDate,
        birthTime,
        birthLocation,
      },
      generatedAt: new Date().toISOString(),
    };

    console.log('✅ Natal chart generated successfully');

    return NextResponse.json({
      success: true,
      data: natalChart,
    });

  } catch (error: any) {
    console.error('❌ Chart generation failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate natal chart' },
      { status: 500 }
    );
  }
}
