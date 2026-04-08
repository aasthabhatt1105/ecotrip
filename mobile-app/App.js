import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ImpactDashboard } from './src/screens/ImpactDashboard';
import { AIItineraryChat } from './src/components/AIItineraryChat';
import { EcoChallenges } from './src/features/gamification/EcoChallenges';
import { ecoColors } from './src/theme';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName;
            if (route.name === 'Impact') iconName = 'leaf';
            else if (route.name === 'Plan') iconName = 'map-search';
            else if (route.name === 'Challenges') iconName = 'trophy';
            return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: ecoColors.primary[500],
          tabBarInactiveTintColor: 'gray',
          headerShown: false,
          tabBarStyle: {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingBottom: 5,
            height: 60,
          }
        })}
      >
        <Tab.Screen name="Impact" component={ImpactDashboard} />
        <Tab.Screen name="Plan" component={AIItineraryChat} />
        <Tab.Screen name="Challenges" component={EcoChallenges} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
