import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StackActions } from '@react-navigation/native';
import {
  HomeScreen,
  NatalChartScreen,
  PlanetDetailScreen,
  ReadingsScreen,
  JournalScreen,
  JournalEntryScreen,
  ProfileScreen,
  DailyHoroscopeScreen,
  TarotScreen,
  TarotReadingDetailScreen,
  IChingScreen,
  IChingReadingDetailScreen,
  DreamInterpretationScreen,
  OracleScreen,
  FriendsScreen,
  SynastryScreen,
  SavedChartsScreen,
  DailySynastryForecastScreen,
  SubscriptionScreen,
  TestLoadingScreen,
  DevMenuScreen,
} from '../screens';
import { TabNavigation } from '../components';
import { useAppStore } from '../store';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const OracleStack = createNativeStackNavigator();
const JournalStack = createNativeStackNavigator();
const FriendsStack = createNativeStackNavigator();

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
      <HomeStack.Screen name="Subscription" component={SubscriptionScreen} />
      <HomeStack.Screen name="TestLoading" component={TestLoadingScreen} />
      <HomeStack.Screen name="DevMenu" component={DevMenuScreen} />
    </HomeStack.Navigator>
  );
};

// Oracle Stack Navigator (for oracle selection + tarot/iching/dream screens)
const OracleStackNavigator: React.FC = () => {
  const { clearSession, clearIChingSession, clearDreamSession } = useAppStore();

  return (
    <OracleStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <OracleStack.Screen name="OracleMain" component={OracleScreen} />
      <OracleStack.Screen
        name="Tarot"
        component={TarotScreen}
        listeners={{
          blur: () => {
            console.log('🔄 Tarot screen blurred - clearing session');
            clearSession();
          }
        }}
      />
      <OracleStack.Screen
        name="IChing"
        component={IChingScreen}
        listeners={{
          blur: () => {
            console.log('🔄 I Ching screen blurred - clearing session');
            clearIChingSession();
          }
        }}
      />
      <OracleStack.Screen
        name="DreamInterpretation"
        component={DreamInterpretationScreen}
        listeners={{
          blur: () => {
            console.log('🔄 Dream Interpretation screen blurred - clearing session');
            clearDreamSession();
          }
        }}
      />
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
      <JournalStack.Screen name="PlanetDetail" component={PlanetDetailScreen} />
      <JournalStack.Screen name="readings" component={ReadingsScreen} />
      <JournalStack.Screen name="TarotReadingDetail" component={TarotReadingDetailScreen} />
      <JournalStack.Screen name="IChingReadingDetail" component={IChingReadingDetailScreen} />
    </JournalStack.Navigator>
  );
};

// Friends Stack Navigator (includes synastry and saved charts)
const FriendsStackNavigator: React.FC = () => {
  return (
    <FriendsStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <FriendsStack.Screen name="FriendsMain" component={FriendsScreen} />
      <FriendsStack.Screen name="Synastry" component={SynastryScreen} />
      <FriendsStack.Screen name="SavedCharts" component={SavedChartsScreen} />
      <FriendsStack.Screen name="DailySynastryForecast" component={DailySynastryForecastScreen} />
    </FriendsStack.Navigator>
  );
};

export const TabNavigator: React.FC = () => {
  const { activeTab, setActiveTab, ichingSessionStep, sessionStep } = useAppStore();

  const tabs = [
    { id: 'home', label: 'Home', icon: 'home-outline', screen: HomeStackNavigator },
    { id: 'oracle', label: 'Oracle', icon: 'moon-outline', screen: OracleStackNavigator },
    { id: 'journal', label: 'Journal', icon: 'journal-outline', screen: JournalStackNavigator },
    { id: 'friends', label: 'Friends', icon: 'people-outline', screen: FriendsStackNavigator },
  ];

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => {
        // Check if we're on a screen that should hide the tab bar
        const route = props.state.routes[props.state.index];
        const nestedRoute = route.state?.routes?.[route.state.index];

        // Hide on DailyHoroscope detail screen
        const shouldHideTabBar = nestedRoute?.name === 'DailyHoroscope';

        // Hide during critical I Ching steps
        const isOnIChingScreen = nestedRoute?.name === 'IChing';
        const criticalIChingSteps = ['loading', 'casting', 'interpretation', 'complete'];
        const shouldHideForIChing = isOnIChingScreen &&
          criticalIChingSteps.includes(ichingSessionStep);

        // Hide during critical Tarot steps
        const isOnTarotScreen = nestedRoute?.name === 'Tarot';
        const criticalTarotSteps = ['drawing', 'reveal', 'interpretation', 'complete'];
        const shouldHideForTarot = isOnTarotScreen &&
          criticalTarotSteps.includes(sessionStep);

        // Hide tab bar on specific screens or during critical oracle steps
        if (shouldHideTabBar || shouldHideForIChing || shouldHideForTarot) return null;

        return (
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
        );
      }}
    >
      {tabs.map((tab) => (
        <Tab.Screen
          key={tab.id}
          name={tab.id}
          component={tab.screen}
          listeners={({ navigation }) => ({
            focus: () => setActiveTab(tab.id),
            blur: () => {
              // Reset Oracle stack to OracleMain when leaving the tab
              if (tab.id === 'oracle') {
                console.log('🔄 Oracle tab lost focus - resetting to OracleMain');
                const state = navigation.getState();
                const oracleRoute = state.routes.find((r: any) => r.name === 'oracle');

                // Only reset if the stack has more than one screen
                if (oracleRoute?.state?.index > 0) {
                  navigation.dispatch({
                    ...StackActions.popToTop(),
                    target: oracleRoute.state.key,
                  });
                }
              }
            },
          })}
        />
      ))}
    </Tab.Navigator>
  );
};
