import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../styles';

interface WeatherAspects {
  [key: string]: number;
}

interface PlanetWeather {
  description: string;
  aspects: WeatherAspects;
}

interface CosmicWeather {
  moon?: PlanetWeather;
  venus?: PlanetWeather;
  mercury?: PlanetWeather;
}

interface CosmicWeatherChartProps {
  weather: CosmicWeather;
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

export const CosmicWeatherChart: React.FC<CosmicWeatherChartProps> = ({ weather }) => {
  const renderAspectSlider = (label: string, intensity: number) => {
    // Clamp intensity between 0-100
    const clampedIntensity = Math.max(0, Math.min(100, intensity));
    const position = `${clampedIntensity}%`;

    return (
      <View key={label} style={styles.aspectRow}>
        <Text style={styles.aspectLabel}>{label.toUpperCase()}</Text>
        <View style={styles.sliderContainer}>
          <View style={styles.sliderTrack} />
          <View style={[styles.iconContainer, { left: position }]} />
        </View>
      </View>
    );
  };

  const renderPlanetSection = (planetKey: keyof typeof PLANET_CONFIG) => {
    const planetData = weather[planetKey];

    if (!planetData) {
      return null;
    }

    const config = PLANET_CONFIG[planetKey];

    return (
      <View key={planetKey} style={styles.planetSection}>
        <View style={styles.planetIconContainer}>
          <Text style={styles.planetSymbol}>{config.symbol}</Text>
          <Text style={styles.planetDescription}>{planetData.description}</Text>
        </View>
        <View style={styles.barsContainer}>
          {config.aspects.map((aspect) => {
            const intensity = planetData.aspects[aspect.key] || 0;
            const clampedIntensity = Math.max(0, Math.min(100, intensity));
            const position = `${clampedIntensity}%`;

            return (
              <View key={aspect.key} style={styles.barColumn}>
                <View style={styles.sliderContainerHorizontal}>
                  <View style={styles.sliderTrack} />
                  <View style={[styles.lineIndicator, { left: position }]} />
                </View>
                <Text style={styles.barLabel}>{aspect.label.toUpperCase()}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const planetKeys: Array<keyof typeof PLANET_CONFIG> = ['moon', 'venus', 'mercury'];
  const planetsToRender = planetKeys.filter(key => weather[key]);

  return (
    <View style={styles.container}>
      {planetsToRender.map((planetKey, index) => (
        <React.Fragment key={planetKey}>
          {renderPlanetSection(planetKey)}
          {index < planetsToRender.length - 1 && <View style={styles.separator} />}
        </React.Fragment>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.background.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  planetSection: {
    marginBottom: spacing.lg,
  },
  planetRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconColumn: {
    width: 50,
    alignItems: 'center',
    marginRight: spacing.md,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  aspectsColumn: {
    flex: 1,
  },
  aspectRow: {
    marginBottom: spacing.md,
  },
  aspectLabel: {
    ...typography.caption,
    fontSize: 11,
    letterSpacing: 0.5,
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  sliderContainer: {
    height: 24,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderTrack: {
    height: 8,
    backgroundColor: '#141414',
    borderRadius: 4,
  },
  iconContainer: {
    position: 'absolute',
    width: 24,
    height: 24,
    backgroundColor: '#F6D99F',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -12, // Center the icon on the position
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  planetSymbol: {
    fontSize: 32,
    color: colors.text.primary,
  },
  planetIconContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  planetDescription: {
    ...typography.body,
    fontSize: 13,
    color: '#FFFFFF',
    textAlign: 'justify',
    marginTop: spacing.xs,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginVertical: spacing.md,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  sliderContainerHorizontal: {
    height: 18,
    width: '100%',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: spacing.xs,
  },
  lineIndicator: {
    position: 'absolute',
    width: 2,
    height: 18,
    backgroundColor: '#F6D99F',
    marginLeft: -1, // Center the line on the position
  },
  barLabel: {
    ...typography.caption,
    fontSize: 11,
    letterSpacing: 0.5,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
