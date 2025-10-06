import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  HomeScreen,
  NatalChartScreen,
  ReadingsScreen,
  JournalScreen,
  ProfileScreen,
  DailyHoroscopeScreen,
  TarotScreen,
  IChingScreen,
} from '../screens';
import { TabNavigation } from '../components';
import { useAppStore } from '../store';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();

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
    </HomeStack.Navigator>
  );
};

export const TabNavigator: React.FC = () => {
  const { activeTab, setActiveTab } = useAppStore();

  const tabs = [
    { id: 'home', label: 'Home', icon: 'home-outline', screen: HomeStackNavigator },
    { id: 'chart', label: 'Chart', icon: 'pie-chart-outline', screen: NatalChartScreen },
    { id: 'tarot', label: 'Tarot', icon: 'moon-outline', screen: TarotScreen },
    { id: 'iching', label: 'I Ching', icon: 'grid-outline', screen: IChingScreen },
    { id: 'readings', label: 'Readings', icon: 'book-outline', screen: ReadingsScreen },
    { id: 'journal', label: 'Journal', icon: 'journal-outline', screen: JournalScreen },
    { id: 'profile', label: 'Profile', icon: 'person-outline', screen: ProfileScreen },
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
