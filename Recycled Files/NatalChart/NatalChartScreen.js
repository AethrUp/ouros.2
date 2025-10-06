import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { colors, spacing, typography } from '../styles/theme';
import { handleChartGeneration } from '../handlers/astrology/handleChartGeneration';
import NatalChart from '../components/astrology/NatalChart';
import PlanetInfoPanel from '../components/astrology/PlanetInfoPanel';
import HouseInfoPanel from '../components/astrology/HouseInfoPanel';

const NatalChartScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  
  // State for UI
  const [selectedPlanet, setSelectedPlanet] = useState(null);
  const [selectedHouse, setSelectedHouse] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Get data from Redux store
  const userProfile = useSelector(state => state.user?.profile);
  const currentReading = useSelector(state => state.reading?.currentReading);
  
  // Chart data from user profile natal chart
  const chartData = userProfile?.natalChart;
  const birthData = userProfile ? {
    birthDate: userProfile.birthDate,
    birthTime: userProfile.birthTime, 
    birthLocation: userProfile.birthLocation,
    timezone: userProfile.timezone
  } : null;
  

  const handleGenerateChart = async () => {
    console.log('🔍 NatalChartScreen birthData check:', {
      hasBirthData: !!birthData,
      birthDate: birthData?.birthDate,
      birthTime: birthData?.birthTime,
      birthLocation: birthData?.birthLocation,
      timezone: birthData?.timezone,
      userProfile: !!userProfile
    });
    
    if (!birthData) {
      Alert.alert('Birth Data Required', 'Please complete your birth data in onboarding first.');
      return;
    }
    
    // Additional validation
    if (!birthData.birthDate || !birthData.birthTime || !birthData.birthLocation) {
      console.error('❌ Incomplete birth data:', birthData);
      Alert.alert('Incomplete Data', 'Some birth data is missing. Please check your profile settings.');
      return;
    }

    setIsGenerating(true);
    
    try {
      
      const result = await handleChartGeneration(birthData, dispatch, {
        houseSystem: 'placidus',
        precision: 'Professional',
        forceRegenerate: true
      });
      
      if (result.success) {
        Alert.alert('Success', 'Natal chart generated successfully!');
      } else {
        Alert.alert('Error', result.message || 'Failed to generate chart');
      }
    } catch (error) {
      console.error('🚨 Chart generation error:', error.message);
      
      // Provide specific error messages based on error type
      let errorTitle = 'Chart Generation Failed';
      let errorMessage = error.message;
      
      if (error.message.includes('House cusps')) {
        errorTitle = 'API Service Error';
        errorMessage = 'Unable to calculate house positions. Please check your subscription or try again later.';
      } else if (error.message.includes('Planetary positions')) {
        errorTitle = 'API Service Error'; 
        errorMessage = 'Unable to calculate planetary positions. Please check your subscription or try again later.';
      } else if (error.message.includes('empty data')) {
        errorTitle = 'Data Validation Error';
        errorMessage = 'The API returned incomplete chart data. Please verify your birth information and try again.';
      } else if (error.message.includes('validation failed')) {
        errorTitle = 'Chart Validation Error';
        errorMessage = 'The generated chart is missing essential data. Please try again or contact support.';
      }
      
      Alert.alert(errorTitle, errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefresh = () => {
    handleGenerateChart();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Natal Chart</Text>
        <TouchableOpacity 
          style={styles.generateButton} 
          onPress={handleGenerateChart}
          disabled={isGenerating}
        >
          <Text style={styles.generateButtonText}>
            {isGenerating ? '⏳' : '🔄'} Generate
          </Text>
        </TouchableOpacity>
      </View>


      {/* Chart Display */}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {chartData ? (
          <NatalChart
            birthData={birthData}
            planetaryData={chartData.planets || {}}
            onPlanetSelect={setSelectedPlanet}
            onHouseSelect={setSelectedHouse}
            onRefresh={handleRefresh}
            showAspects={true}
            showHouses={true}
            houseSystem={chartData.metadata?.houseSystem || 'placidus'}
            precision={chartData.metadata?.precision || 'Professional'}
          />
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataTitle}>Generate Chart</Text>
            <Text style={styles.noDataText}>
              Generate your natal chart with professional calculations.
            </Text>
            <TouchableOpacity 
              style={styles.generateLargeButton} 
              onPress={handleGenerateChart}
              disabled={isGenerating || !birthData}
            >
              <Text style={styles.generateLargeButtonText}>
                {isGenerating ? 'Generating...' : 'Generate Chart'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Planet Info Panel */}
      <PlanetInfoPanel
        visible={!!selectedPlanet}
        selectedPlanet={selectedPlanet}
        planetaryData={chartData?.planets || {}}
        onClose={() => setSelectedPlanet(null)}
        precision={chartData?.metadata?.precision || 'Professional'}
        houseSystem={chartData?.metadata?.houseSystem || 'placidus'}
      />

      {/* House Info Panel */}
      <HouseInfoPanel
        visible={!!selectedHouse}
        selectedHouse={selectedHouse}
        onClose={() => setSelectedHouse(null)}
        houseData={chartData?.houses?.[selectedHouse - 1]}
        houseSystem={chartData?.metadata?.houseSystem || 'placidus'}
        precision={chartData?.metadata?.precision || 'Professional'}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  backButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  backButtonText: {
    fontSize: 24,
    color: colors.primary,
    fontWeight: '600',
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  generateButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
  },
  generateButtonText: {
    ...typography.caption,
    color: colors.background,
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  noDataContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  noDataTitle: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  noDataText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  featuresText: {
    ...typography.caption,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    backgroundColor: colors.primary + '05',
    padding: spacing.md,
    borderRadius: 8,
  },
  generateLargeButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    minWidth: 200,
  },
  generateLargeButtonText: {
    ...typography.body,
    color: colors.background,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default NatalChartScreen;