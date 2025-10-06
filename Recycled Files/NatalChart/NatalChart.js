import React, { useState } from 'react';
import { View, Dimensions, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Svg, { 
  Circle, 
  Line, 
  Text as SvgText, 
  G, 
  Path,
  Defs,
  RadialGradient,
  Stop 
} from 'react-native-svg';
import { PanGestureHandler, TapGestureHandler } from 'react-native-gesture-handler';
import { colors } from '../../styles/theme/colors';

// Zodiac signs data with Unicode symbols
const ZODIAC_SIGNS = [
  { name: 'Aries', symbol: '♈', degrees: 0 },
  { name: 'Taurus', symbol: '♉', degrees: 30 },
  { name: 'Gemini', symbol: '♊', degrees: 60 },
  { name: 'Cancer', symbol: '♋', degrees: 90 },
  { name: 'Leo', symbol: '♌', degrees: 120 },
  { name: 'Virgo', symbol: '♍', degrees: 150 },
  { name: 'Libra', symbol: '♎', degrees: 180 },
  { name: 'Scorpio', symbol: '♏', degrees: 210 },
  { name: 'Sagittarius', symbol: '♐', degrees: 240 },
  { name: 'Capricorn', symbol: '♑', degrees: 270 },
  { name: 'Aquarius', symbol: '♒', degrees: 300 },
  { name: 'Pisces', symbol: '♓', degrees: 330 }
];

// Planet data with Unicode symbols
const PLANET_SYMBOLS = {
  sun: '☉',
  moon: '☽', 
  mercury: '☿',
  venus: '♀',
  mars: '♂',
  jupiter: '♃',
  saturn: '♄',
  uranus: '♅',
  neptune: '♆',
  pluto: '♇'
};

// Alchemical symbols for aspects
const ASPECT_SYMBOLS = {
  fire: '🜂',
  air: '🜁', 
  water: '🜃',
  earth: '🜄'
};

// Aspect definitions from our documentation
const ASPECT_MAPPINGS = {
  conjunction: { element: 'fire', symbol: '🜂', angle: 0, orb: 8 },
  semi_sextile: { element: 'fire', symbol: '🜂', angle: 30, orb: 3 },
  sextile: { element: 'air', symbol: '🜁', angle: 60, orb: 6 },
  quintile: { element: 'air', symbol: '🜁', angle: 72, orb: 2 },
  square: { element: 'earth', symbol: '🜄', angle: 90, orb: 8 },
  trine: { element: 'air', symbol: '🜁', angle: 120, orb: 8 },
  bi_quintile: { element: 'water', symbol: '🜃', angle: 144, orb: 2 },
  quincunx: { element: 'earth', symbol: '🜄', angle: 150, orb: 3 },
  opposition: { element: 'earth', symbol: '🜄', angle: 180, orb: 8 }
};

const NatalChart = ({
  birthData,
  planetaryData = {},
  onPlanetSelect,
  onHouseSelect,
  onRefresh,
  showAspects = true,
  showHouses = true,
  houseSystem = 'placidus',
  precision = 'Professional',
  chartSize = 300,
  interactive = true,
  animateTransits = false
}) => {
  const [viewMode, setViewMode] = useState('TABLE'); // 'TABLE' or 'CIRCLE'
  const [selectedPlanet, setSelectedPlanet] = useState(null);
  const [selectedHouse, setSelectedHouse] = useState(null);
  const screenWidth = Dimensions.get('window').width;
  const size = Math.min(chartSize, screenWidth * 0.9);
  const center = size / 2;
  const radius = size / 2 - 20; // Leave margin for planet symbols

  // Calculate positions for zodiac signs around the circle
  const getZodiacPosition = (degrees) => {
    const radians = (degrees - 90) * (Math.PI / 180); // Start from top (Aries)
    const zodiacRadius = radius * 0.9;
    return {
      x: center + zodiacRadius * Math.cos(radians),
      y: center + zodiacRadius * Math.sin(radians)
    };
  };

  // Calculate positions for planets
  const getPlanetPosition = (degrees) => {
    const radians = (degrees - 90) * (Math.PI / 180);
    const planetRadius = radius * 0.75;
    return {
      x: center + planetRadius * Math.cos(radians),
      y: center + planetRadius * Math.sin(radians)
    };
  };

  // Calculate house division lines
  const getHouseLine = (houseNumber) => {
    const degrees = houseNumber * 30; // Each house is 30 degrees
    const radians = (degrees - 90) * (Math.PI / 180);
    const innerRadius = radius * 0.3;
    const outerRadius = radius * 0.9;
    
    return {
      x1: center + innerRadius * Math.cos(radians),
      y1: center + innerRadius * Math.sin(radians),
      x2: center + outerRadius * Math.cos(radians),
      y2: center + outerRadius * Math.sin(radians)
    };
  };

  // Calculate aspects between planets
  const calculateAspects = () => {
    const aspects = [];
    const planetKeys = Object.keys(planetaryData);
    
    for (let i = 0; i < planetKeys.length; i++) {
      for (let j = i + 1; j < planetKeys.length; j++) {
        const planet1 = planetKeys[i];
        const planet2 = planetKeys[j];
        const degree1 = planetaryData[planet1]?.longitude || 0;
        const degree2 = planetaryData[planet2]?.longitude || 0;
        
        let angleDiff = Math.abs(degree1 - degree2);
        if (angleDiff > 180) angleDiff = 360 - angleDiff;
        
        // Check each aspect type
        Object.entries(ASPECT_MAPPINGS).forEach(([aspectName, aspectData]) => {
          if (Math.abs(angleDiff - aspectData.angle) <= aspectData.orb) {
            const pos1 = getPlanetPosition(degree1);
            const pos2 = getPlanetPosition(degree2);
            const midX = (pos1.x + pos2.x) / 2;
            const midY = (pos1.y + pos2.y) / 2;
            
            aspects.push({
              type: aspectName,
              planet1,
              planet2,
              angle: angleDiff,
              element: aspectData.element,
              symbol: aspectData.symbol,
              line: { x1: pos1.x, y1: pos1.y, x2: pos2.x, y2: pos2.y },
              symbolPosition: { x: midX, y: midY }
            });
          }
        });
      }
    }
    
    return aspects;
  };

  const handlePlanetPress = (planetName) => {
    if (interactive) {
      setSelectedPlanet(planetName);
      onPlanetSelect?.(planetName);
    }
  };

  const handleHousePress = (houseNumber) => {
    if (interactive) {
      setSelectedHouse(houseNumber);
      onHouseSelect?.(houseNumber);
    }
  };

  // Create SVG path for house sector (for tap detection)
  const getHouseSectorPath = (houseNumber) => {
    const startAngle = (houseNumber - 1) * 30 - 90; // Start from top
    const endAngle = houseNumber * 30 - 90;
    const innerRadius = radius * 0.3;
    const outerRadius = radius * 0.75; // Don't overlap with planets
    
    const startAngleRad = startAngle * (Math.PI / 180);
    const endAngleRad = endAngle * (Math.PI / 180);
    
    const x1 = center + innerRadius * Math.cos(startAngleRad);
    const y1 = center + innerRadius * Math.sin(startAngleRad);
    const x2 = center + outerRadius * Math.cos(startAngleRad);
    const y2 = center + outerRadius * Math.sin(startAngleRad);
    const x3 = center + outerRadius * Math.cos(endAngleRad);
    const y3 = center + outerRadius * Math.sin(endAngleRad);
    const x4 = center + innerRadius * Math.cos(endAngleRad);
    const y4 = center + innerRadius * Math.sin(endAngleRad);
    
    return `M ${x1} ${y1} L ${x2} ${y2} A ${outerRadius} ${outerRadius} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${innerRadius} ${innerRadius} 0 0 0 ${x1} ${y1} Z`;
  };

  const aspects = showAspects ? calculateAspects() : [];

  // Helper function to calculate zodiac sign from longitude
  const getZodiacSign = (longitude) => {
    if (longitude < 0 || longitude >= 360) return null;
    const signIndex = Math.floor(longitude / 30);
    return ZODIAC_SIGNS[signIndex];
  };

  // Helper function to get house from calculated data
  const getHouseFromData = (planetData) => {
    return planetData.house || null; // Use house from proper calculation
  };

  // Create grouped table data structure
  const getTableData = () => {
    const planetGroups = [];
    const planetsData = [];
    

    // Process planetary data and group by signs
    Object.entries(planetaryData).forEach(([planetKey, data]) => {
      if (data && data.longitude !== undefined) {
        // Use existing sign and house data if available, otherwise calculate
        const sign = data.sign ? { name: data.sign } : getZodiacSign(data.longitude);
        const house = data.house || null; // Trust the calculated house data
        
        
        
        if (sign) {
          planetsData.push({
            name: planetKey.toUpperCase(),
            symbol: PLANET_SYMBOLS[planetKey] || '●',
            sign: sign.name || sign,
            house: house,
            longitude: data.longitude,
            key: planetKey
          });
        }
      }
    });

    // Sort planets by longitude for consistent display
    planetsData.sort((a, b) => a.longitude - b.longitude);

    // Group planets by zodiac sign (in zodiac order)
    const signGroups = {};
    planetsData.forEach(planet => {
      if (!signGroups[planet.sign]) {
        signGroups[planet.sign] = [];
      }
      signGroups[planet.sign].push(planet);
    });

    // Create ordered groups based on zodiac order
    ZODIAC_SIGNS.forEach(zodiacSign => {
      if (signGroups[zodiacSign.name]) {
        planetGroups.push({
          sign: zodiacSign.name,
          planets: signGroups[zodiacSign.name]
        });
      }
    });

    return { planetGroups };
  };

  // Helper to create house groupings within a sign group
  const getHouseGroupsForSign = (planets) => {
    const houseGroups = {};
    
    planets.forEach(planet => {
      const houseKey = planet.house || 'no-house';
      if (!houseGroups[houseKey]) {
        houseGroups[houseKey] = [];
      }
      houseGroups[houseKey].push(planet);
    });

    // Convert to array and sort by house number
    return Object.entries(houseGroups)
      .sort(([a], [b]) => {
        if (a === 'no-house') return 1;
        if (b === 'no-house') return -1;
        return parseInt(a) - parseInt(b);
      })
      .map(([house, planets]) => ({
        house: house === 'no-house' ? null : parseInt(house),
        planets
      }));
  };


  const renderTableView = () => {
    const { planetGroups } = getTableData();
    
    // Handle empty state
    if (planetGroups.length === 0) {
      return (
        <View style={tableStyles.container}>
          <View style={tableStyles.header}>
            <TouchableOpacity
              style={[tableStyles.toggleButton, viewMode === 'TABLE' && tableStyles.toggleButtonActive]}
              onPress={() => setViewMode('TABLE')}
            >
              <Text style={[tableStyles.toggleText, viewMode === 'TABLE' && tableStyles.toggleTextActive]}>TABLE</Text>
            </TouchableOpacity>
            
            <View style={tableStyles.separator} />
            
            <TouchableOpacity
              style={[tableStyles.toggleButton, viewMode === 'CIRCLE' && tableStyles.toggleButtonActive]}
              onPress={() => setViewMode('CIRCLE')}
            >
              <Text style={[tableStyles.toggleText, viewMode === 'CIRCLE' && tableStyles.toggleTextActive]}>CIRCLE</Text>
            </TouchableOpacity>
          </View>
          
          <View style={tableStyles.emptyState}>
            <Text style={tableStyles.emptyText}>No planetary data available</Text>
          </View>
        </View>
      );
    }
    
    return (
      <View style={tableStyles.container}>
        {/* Header with toggle */}
        <View style={tableStyles.header}>
          <TouchableOpacity
            style={[tableStyles.toggleButton, viewMode === 'TABLE' && tableStyles.toggleButtonActive]}
            onPress={() => setViewMode('TABLE')}
          >
            <Text style={[tableStyles.toggleText, viewMode === 'TABLE' && tableStyles.toggleTextActive]}>TABLE</Text>
          </TouchableOpacity>
          
          <View style={tableStyles.separator} />
          
          <TouchableOpacity
            style={[tableStyles.toggleButton, viewMode === 'CIRCLE' && tableStyles.toggleButtonActive]}
            onPress={() => setViewMode('CIRCLE')}
          >
            <Text style={[tableStyles.toggleText, viewMode === 'CIRCLE' && tableStyles.toggleTextActive]}>CIRCLE</Text>
          </TouchableOpacity>
        </View>


        {/* Table headers */}
        <View style={tableStyles.tableHeader}>
          <View style={tableStyles.signHeaderCell}>
            <Text style={tableStyles.columnHeader}>SIGNS</Text>
          </View>
          <View style={tableStyles.planetHeaderCell}>
            <Text style={tableStyles.columnHeader}>PLANETS</Text>
          </View>
          <View style={tableStyles.houseHeaderCell}>
            <Text style={tableStyles.columnHeader}>HOUSES</Text>
          </View>
        </View>

        {/* Grouped table rows */}
        <ScrollView style={tableStyles.tableBody} showsVerticalScrollIndicator={false}>
          {planetGroups.map((signGroup, signIndex) => {
            const houseGroups = getHouseGroupsForSign(signGroup.planets);
            
            return (
              <View key={signGroup.sign} style={tableStyles.signGroupContainer}>
                {houseGroups.map((houseGroup, houseIndex) => (
                  <View key={`${signGroup.sign}-${houseGroup.house || 'no-house'}`} style={tableStyles.houseGroupContainer}>
                    {houseGroup.planets.map((planet, planetIndex) => (
                      <View key={planet.key} style={tableStyles.tableRow}>
                        {/* Sign cell - only show for first planet in the sign group */}
                        {houseIndex === 0 && planetIndex === 0 && (
                          <View 
                            style={[
                              tableStyles.signCell,
                              { height: signGroup.planets.length * 50 } // Dynamic height based on planet count
                            ]}
                          >
                            <Text style={tableStyles.signText}>{signGroup.sign}</Text>
                          </View>
                        )}
                        
                        {/* Planet cell */}
                        <TouchableOpacity
                          style={tableStyles.planetCell}
                          onPress={() => {
                            onPlanetSelect?.(planet.key);
                          }}
                        >
                          <Text style={tableStyles.planetSymbol}>{planet.symbol}</Text>
                          <Text style={tableStyles.planetName}>{planet.name}</Text>
                        </TouchableOpacity>
                        
                        {/* House cell - only show for first planet in the house group */}
                        {planetIndex === 0 && (
                          houseGroup.house ? (
                            <TouchableOpacity
                              style={[
                                tableStyles.houseCell,
                                { height: houseGroup.planets.length * 50 } // Dynamic height based on planet count
                              ]}
                              onPress={() => {
                                onHouseSelect?.(houseGroup.house);
                              }}
                            >
                              <Text style={tableStyles.houseNumber}>
                                {houseGroup.house}
                              </Text>
                            </TouchableOpacity>
                          ) : (
                            <View style={[tableStyles.houseCell, { height: houseGroup.planets.length * 50 }]}>
                              <Text style={[tableStyles.houseNumber, { color: tableStyles.tableBody.color || '#666' }]}>
                                —
                              </Text>
                            </View>
                          )
                        )}
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderCircleView = () => {
    return (
      <View style={{ width: size, height: size, alignSelf: 'center' }}>
        {/* Header with toggle */}
        <View style={tableStyles.header}>
          <TouchableOpacity
            style={[tableStyles.toggleButton, viewMode === 'TABLE' && tableStyles.toggleButtonActive]}
            onPress={() => setViewMode('TABLE')}
          >
            <Text style={[tableStyles.toggleText, viewMode === 'TABLE' && tableStyles.toggleTextActive]}>TABLE</Text>
          </TouchableOpacity>
          
          <View style={tableStyles.separator} />
          
          <TouchableOpacity
            style={[tableStyles.toggleButton, viewMode === 'CIRCLE' && tableStyles.toggleButtonActive]}
            onPress={() => setViewMode('CIRCLE')}
          >
            <Text style={[tableStyles.toggleText, viewMode === 'CIRCLE' && tableStyles.toggleTextActive]}>CIRCLE</Text>
          </TouchableOpacity>
        </View>

        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Defs>
            <RadialGradient id="chartGradient" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.9" />
              <Stop offset="100%" stopColor={colors.primary} stopOpacity="1" />
            </RadialGradient>
          </Defs>

          {/* Chart background circle */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            fill="url(#chartGradient)"
            stroke={colors.border}
            strokeWidth="2"
          />

          {/* Zodiac signs outer ring */}
          {ZODIAC_SIGNS.map((sign, index) => {
            const position = getZodiacPosition(sign.degrees);
            return (
              <G key={sign.name}>
                {/* Zodiac sign symbol */}
                <SvgText
                  x={position.x}
                  y={position.y}
                  textAnchor="middle"
                  alignmentBaseline="central"
                  fill={colors.textPrimary}
                  fontSize="18"
                  fontWeight="bold"
                >
                  {sign.symbol}
                </SvgText>
              </G>
            );
          })}

          {/* House division lines and interactive sectors */}
          {showHouses && Array.from({ length: 12 }, (_, i) => {
            const houseNumber = i + 1;
            const houseLine = getHouseLine(i);
            const isSelected = selectedHouse === houseNumber;
            
            return (
              <G key={`house-${houseNumber}`}>
                {/* House division line */}
                <Line
                  x1={houseLine.x1}
                  y1={houseLine.y1}
                  x2={houseLine.x2}
                  y2={houseLine.y2}
                  stroke={colors.secondary}
                  strokeWidth="1"
                  opacity="0.6"
                />
                
                {/* Interactive house sector */}
                {interactive && (
                  <Path
                    d={getHouseSectorPath(houseNumber)}
                    fill={isSelected ? 'rgba(129, 184, 181, 0.2)' : 'transparent'}
                    stroke={isSelected ? colors.accent : 'transparent'}
                    strokeWidth={isSelected ? '2' : '0'}
                    opacity="0.8"
                    onPress={() => handleHousePress(houseNumber)}
                  />
                )}
                
                {/* House number */}
                <SvgText
                  x={center + (radius * 0.525) * Math.cos(((houseNumber - 0.5) * 30 - 90) * (Math.PI / 180))}
                  y={center + (radius * 0.525) * Math.sin(((houseNumber - 0.5) * 30 - 90) * (Math.PI / 180))}
                  textAnchor="middle"
                  alignmentBaseline="central"
                  fill={isSelected ? colors.accent : colors.textSecondary}
                  fontSize="12"
                  fontWeight={isSelected ? "bold" : "normal"}
                >
                  {houseNumber}
                </SvgText>
              </G>
            );
          })}

          {/* Aspect lines */}
          {aspects.map((aspect, index) => (
            <G key={`aspect-${index}`}>
              {/* Aspect line */}
              <Line
                x1={aspect.line.x1}
                y1={aspect.line.y1}
                x2={aspect.line.x2}
                y2={aspect.line.y2}
                stroke={colors.textPrimary}
                strokeWidth="1"
                opacity="0.4"
              />
              
              {/* Alchemical symbol at midpoint */}
              <Circle
                cx={aspect.symbolPosition.x}
                cy={aspect.symbolPosition.y}
                r="10"
                fill={colors.primary}
                stroke={colors.textPrimary}
                strokeWidth="1"
                opacity="0.8"
              />
              
              <SvgText
                x={aspect.symbolPosition.x}
                y={aspect.symbolPosition.y}
                textAnchor="middle"
                alignmentBaseline="central"
                fill={colors.textPrimary}
                fontSize="12"
              >
                {aspect.symbol}
              </SvgText>
            </G>
          ))}

          {/* Planets */}
          {Object.entries(planetaryData).map(([planetName, data]) => {
            const position = getPlanetPosition(data.longitude || 0);
            const isSelected = selectedPlanet === planetName;
            
            return (
              <TapGestureHandler
                key={planetName}
                onHandlerStateChange={() => handlePlanetPress(planetName)}
              >
                <G>
                  {/* Planet circle background */}
                  <Circle
                    cx={position.x}
                    cy={position.y}
                    r={isSelected ? "18" : "15"}
                    fill={colors.textPrimary}
                    stroke={isSelected ? colors.accent : colors.secondary}
                    strokeWidth={isSelected ? "3" : "2"}
                  />
                  
                  {/* Planet symbol */}
                  <SvgText
                    x={position.x}
                    y={position.y}
                    textAnchor="middle"
                    alignmentBaseline="central"
                    fill={colors.primary}
                    fontSize={isSelected ? "16" : "14"}
                    fontWeight="bold"
                  >
                    {PLANET_SYMBOLS[planetName] || '●'}
                  </SvgText>
                </G>
              </TapGestureHandler>
            );
          })}

          {/* Center point */}
          <Circle
            cx={center}
            cy={center}
            r="3"
            fill={colors.accent}
          />
        </Svg>
      </View>
    );
  };

  return viewMode === 'TABLE' ? renderTableView() : renderCircleView();
};

const tableStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  toggleButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  toggleButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.textPrimary,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  toggleTextActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  separator: {
    width: 1,
    height: 20,
    backgroundColor: colors.border,
    marginHorizontal: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 10,
    marginBottom: 20,
  },
  signHeaderCell: {
    width: 110,
    paddingRight: 15,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planetHeaderCell: {
    flex: 1,
    paddingHorizontal: 15,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  houseHeaderCell: {
    width: 80,
    paddingLeft: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableBody: {
    flex: 1,
  },
  signGroupContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(133, 121, 141, 0.2)',
  },
  houseGroupContainer: {
    // Container for planets within the same house
  },
  tableRow: {
    flexDirection: 'row',
    position: 'relative',
  },
  columnHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 1,
    textAlign: 'center',
  },
  signCell: {
    width: 110,
    paddingRight: 15,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    position: 'absolute',
    left: 0,
    top: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  signText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  planetCell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(133, 121, 141, 0.1)',
    minHeight: 50,
    marginLeft: 110, // Match sign column width exactly
    marginRight: 80, // Match house column width exactly
    borderRightWidth: 1,
    borderRightColor: colors.border,
    flex: 1,
  },
  planetSymbol: {
    fontSize: 20,
    color: colors.textPrimary,
    textAlign: 'center',
    marginLeft: 20,
  },
  planetName: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textPrimary,
    letterSpacing: 0.3,
    marginLeft: 8,
  },
  houseCell: {
    width: 80,
    paddingLeft: 15,
    position: 'absolute',
    right: 0,
    top: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  houseNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.accent,
    borderRadius: 6,
  },
  refreshText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});

export default NatalChart;