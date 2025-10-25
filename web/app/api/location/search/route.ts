import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');

  if (!query || query.length < 3) {
    return NextResponse.json({ predictions: [] });
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

  if (!apiKey || apiKey === 'your_google_places_api_key_here') {
    console.warn('Google Places API key not configured, returning mock data');
    const mockResults = [
      {
        name: 'New York, NY, USA',
        latitude: 40.7128,
        longitude: -74.006,
        timezone: 'America/New_York',
        timezoneOffset: -18000,
        country: 'USA',
        region: 'NY',
      },
      {
        name: 'Los Angeles, CA, USA',
        latitude: 34.0522,
        longitude: -118.2437,
        timezone: 'America/Los_Angeles',
        timezoneOffset: -28800,
        country: 'USA',
        region: 'CA',
      },
      {
        name: 'London, UK',
        latitude: 51.5074,
        longitude: -0.1278,
        timezone: 'Europe/London',
        timezoneOffset: 0,
        country: 'UK',
        region: 'England',
      },
    ];

    const filtered = mockResults.filter((loc) =>
      loc.name.toLowerCase().includes(query.toLowerCase())
    );

    return NextResponse.json({ predictions: filtered });
  }

  try {
    // Use Google Places Autocomplete API
    const autocompleteUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      query
    )}&types=(cities)&key=${apiKey}`;

    const response = await fetch(autocompleteUrl);
    const data = await response.json();

    if (data.status === 'OK' && data.predictions) {
      // Get place details for each prediction to get lat/lng and timezone
      const suggestions = await Promise.all(
        data.predictions.slice(0, 5).map(async (prediction: any) => {
          try {
            const detailsResponse = await fetch(
              `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&fields=geometry,address_components&key=${apiKey}`
            );
            const details = await detailsResponse.json();

            if (details.status === 'OK' && details.result) {
              const { lat, lng } = details.result.geometry.location;

              // Extract country and region from address components
              const addressComponents = details.result.address_components || [];
              const country = addressComponents.find((c: any) =>
                c.types.includes('country')
              )?.short_name || '';
              const region = addressComponents.find((c: any) =>
                c.types.includes('administrative_area_level_1')
              )?.short_name || '';

              // Get timezone and UTC offset
              const timestamp = Math.floor(Date.now() / 1000);
              const timezoneResponse = await fetch(
                `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lng}&timestamp=${timestamp}&key=${apiKey}`
              );
              const timezoneData = await timezoneResponse.json();

              let timezone = 'UTC';
              let timezoneOffset = 0;

              if (timezoneData.status === 'OK') {
                timezone = timezoneData.timeZoneId;
                timezoneOffset = timezoneData.rawOffset + timezoneData.dstOffset;
              }

              return {
                name: prediction.description,
                latitude: lat,
                longitude: lng,
                timezone,
                timezoneOffset,
                country,
                region,
              };
            }
            return null;
          } catch (error) {
            console.error('Error fetching place details:', error);
            return null;
          }
        })
      );

      const validSuggestions = suggestions.filter(Boolean);
      return NextResponse.json({ predictions: validSuggestions });
    } else {
      return NextResponse.json({ predictions: [] });
    }
  } catch (error) {
    console.error('Location search error:', error);
    return NextResponse.json(
      { error: 'Failed to search locations' },
      { status: 500 }
    );
  }
}
