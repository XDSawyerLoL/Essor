import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from './src/screens/HomeScreen';
import { CheckInScreen } from './src/screens/CheckInScreen';
import { JournalScreen } from './src/screens/JournalScreen';
import { InsightsScreen } from './src/screens/InsightsScreen';
import { CompanionScreen } from './src/screens/CompanionScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Tabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarLabelStyle: { fontSize: 12 }, tabBarStyle: { height: 70, paddingBottom: 10, paddingTop: 8 } }}>
      <Tab.Screen name="Aujourd’hui" component={HomeScreen} />
      <Tab.Screen name="Parler" component={CompanionScreen} />
      <Tab.Screen name="Insights" component={InsightsScreen} />
      <Tab.Screen name="Journal" component={JournalScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={Tabs} />
        <Stack.Screen name="Check-in" component={CheckInScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
