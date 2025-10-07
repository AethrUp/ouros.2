import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  HomeScreen,
  NatalChartScreen,
  ReadingsScreen,
  JournalScreen,
  JournalEntryScreen,
  ProfileScreen,
  DailyHoroscopeScreen,
  TarotScreen,
  IChingScreen,
  OracleScreen,
  FriendsScreen,
} from '../screens';
import { TabNavigation } from '../components';
import { useAppStore } from '../store';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const OracleStack = createNativeStackNavigator();
const JournalStack = createNativeStackNavigator();

// Home Stack Navigator (for home + detail screens)
const HomeStackNavigator: React.FC = () => {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="DailyHoroscope" component={DailyHoroscopeScreen} />
      <HomeStack.Screen name="Profile" component={ProfileScreen} />
    </HomeStack.Navigator>
  );
};

// Oracle Stack Navigator (for oracle selection + tarot/iching screens)
const OracleStackNavigator: React.FC = () => {
  return (
    <OracleStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <OracleStack.Screen name="OracleMain" component={OracleScreen} />
      <OracleStack.Screen name="Tarot" component={TarotScreen} />
      <OracleStack.Screen name="IChing" component={IChingScreen} />
    </OracleStack.Navigator>
  );
};

// Journal Stack Navigator (includes chart and readings)
const JournalStackNavigator: React.FC = () => {
  return (
    <JournalStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <JournalStack.Screen name="JournalMain" component={JournalScreen} />
      <JournalStack.Screen name="JournalEntry" component={JournalEntryScreen} />
      <JournalStack.Screen name="chart" component={NatalChartScreen} />
      <JournalStack.Screen name="readings" component={ReadingsScreen} />
    </JournalStack.Navigator>
  );
};

export const TabNavigator: React.FC = () => {
  const { activeTab, setActiveTab } = useAppStore();

  const tabs = [
    { id: 'home', label: 'Home', icon: 'home-outline', screen: HomeStackNavigator },
    { id: 'oracle', label: 'Oracle', icon: 'moon-outline', screen: OracleStackNavigator },
    { id: 'journal', label: 'Journal', icon: 'journal-outline', screen: JournalStackNavigator },
    { id: 'friends', label: 'Friends', icon: 'people-outline', screen: FriendsScreen },
  ];

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => (
        <TabNavigation
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            const tabIndex = tabs.findIndex((t) => t.id === tab);
            if (tabIndex !== -1) {
              props.navigation.navigate(tabs[tabIndex].id);
            }
          }}
          tabs={tabs.map(({ screen, ...rest }) => rest)}
          showBadges={true}
          badgeCounts={{}}
        />
      )}
    >
      {tabs.map((tab) => (
        <Tab.Screen
          key={tab.id}
          name={tab.id}
          component={tab.screen}
          listeners={{
            focus: () => setActiveTab(tab.id),
          }}
        />
      ))}
    </Tab.Navigator>
  );
};
