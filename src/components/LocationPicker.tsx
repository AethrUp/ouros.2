import React, { useState } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { LocationData } from '../types/user';
import { theme } from '../styles/theme';

interface LocationPickerProps {
  onLocationSelect: (location: LocationData) => void;
  testId?: string;
}

interface LocationSuggestion {
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
  timezoneOffset: number;
  country: string;
  region: string;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  testId = 'location-picker',
}) => {
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchLocations = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);

    try {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

      if (!apiKey || apiKey === 'your-google-places-api-key-here') {
        // Fallback to mock data if no API key
        console.warn('Google Places API key not configured, using mock data');
        const mockResults: LocationSuggestion[] = [
          {
            name: 'New York, NY, USA',
            latitude: 40.7128,
            longitude: -74.006,
            timezone: 'America/New_York',
            timezoneOffset: -18000, // -5 hours in seconds
            country: 'USA',
            region: 'NY',
          },
          {
            name: 'Los Angeles, CA, USA',
            latitude: 34.0522,
            longitude: -118.2437,
            timezone: 'America/Los_Angeles',
            timezoneOffset: -28800, // -8 hours in seconds
            country: 'USA',
            region: 'CA',
          },
        ];
        setSuggestions(mockResults);
        return;
      }

      // Use Google Places Autocomplete API
      const autocompleteUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        query
      )}&types=(cities)&key=${apiKey}`;

      console.log('Fetching places for:', query);
      const response = await fetch(autocompleteUrl);
      const data = await response.json();

      console.log('Places API response:', data);

      if (data.status === 'OK' && data.predictions) {
        // Get place details for each prediction to get lat/lng and timezone
        const suggestions = await Promise.all(
          data.predictions.slice(0, 5).map(async (prediction: any) => {
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
              const timezoneData = await getTimezoneForLocation(lat, lng, apiKey);

              return {
                name: prediction.description,
                latitude: lat,
                longitude: lng,
                timezone: timezoneData.timezone,
                timezoneOffset: timezoneData.offset,
                country,
                region,
              };
            }
            return null;
          })
        );

        const validSuggestions = suggestions.filter(Boolean) as LocationSuggestion[];
        console.log('Setting suggestions:', validSuggestions.length);
        setSuggestions(validSuggestions);
      } else {
        console.log('No predictions or bad status:', data.status);
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Location search error:', error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const getTimezoneForLocation = async (
    lat: number,
    lng: number,
    apiKey: string
  ): Promise<{ timezone: string; offset: number }> => {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lng}&timestamp=${timestamp}&key=${apiKey}`
      );
      const data = await response.json();

      if (data.status === 'OK') {
        // rawOffset is the base offset, dstOffset is the additional DST offset
        const totalOffset = data.rawOffset + data.dstOffset;
        return {
          timezone: data.timeZoneId,
          offset: totalOffset,
        };
      }

      return { timezone: 'UTC', offset: 0 };
    } catch (error) {
      console.error('Timezone fetch error:', error);
      return { timezone: 'UTC', offset: 0 };
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    searchLocations(text);
  };

  const handleLocationSelect = (location: LocationSuggestion) => {
    onLocationSelect(location);
    setSearchText(location.name);
    setSuggestions([]);
  };

  return (
    <View style={styles.container} testID={testId}>
      {suggestions.length > 0 && (
        <FlatList
          data={suggestions}
          keyExtractor={(item, index) => `${item.name}-${index}`}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.suggestionItem}
              onPress={() => handleLocationSelect(item)}
            >
              <Text style={styles.suggestionText}>{item.name}</Text>
            </TouchableOpacity>
          )}
          style={[styles.suggestionsList, styles.suggestionsContainer]}
          scrollEnabled={false}
          nestedScrollEnabled={true}
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="START TYPING CITY"
        placeholderTextColor={theme.colors.textPlaceholder}
        value={searchText}
        onChangeText={handleSearchChange}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  input: {
    backgroundColor: theme.colors.surfaceDark,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.textInverse,
    fontFamily: 'Inter',
  },
  suggestionsContainer: {
    backgroundColor: theme.colors.surfaceDark,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  suggestionText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
    fontFamily: 'Inter',
  },
});
