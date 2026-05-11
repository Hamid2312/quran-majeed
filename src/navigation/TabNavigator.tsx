import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TabParamList } from './types';
import { Colors } from '../constants/colors';
import { StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Screens
import QuranIndexScreen from '../screens/QuranIndexScreen';
import SessionSetupScreen from '../screens/SessionSetupScreen';
import AnalyticsDashboard from '../screens/AnalyticsDashboard';
import RecitersListScreen from '../screens/RecitersListScreen';

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.tabActive,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Quran"
        component={QuranIndexScreen}
        options={{
          tabBarLabel: 'القرآن',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "book" : "book-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Sessions"
        component={SessionSetupScreen}
        options={{
          tabBarLabel: 'Session',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "mic" : "mic-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsDashboard}
        options={{
          tabBarLabel: 'Analytics',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "bar-chart" : "bar-chart-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Reciters"
        component={RecitersListScreen}
        options={{
          tabBarLabel: 'Reciters',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "people" : "people-outline"} size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 85 : 65,
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
});
