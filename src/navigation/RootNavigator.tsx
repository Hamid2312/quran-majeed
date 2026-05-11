import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { Colors } from '../constants/colors';

import HomeScreen from '../screens/HomeScreen';
import TabNavigator from './TabNavigator';

// ── New PDF-first screens ────────────────────────────────────────────────────
import QuranIndexScreen from '../screens/QuranIndexScreen';
import PdfViewerScreen from '../screens/PdfViewerScreen';
import PdfSessionScreen from '../screens/PdfSessionScreen';
import SessionSetupScreen from '../screens/SessionSetupScreen';
import SessionSummaryScreen from '../screens/SessionSummaryScreen';

// ── Legacy screens (kept for backward compat) ────────────────────────────────
import SurahDetailScreen from '../screens/SurahDetailScreen';
import RecitationScreen from '../screens/RecitationScreen';
import PdfRecitationScreen from '../screens/PdfRecitationScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.textPrimary,
          headerTitleStyle: { fontWeight: '700', fontSize: 18 },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: 'slide_from_right',
        }}
      >
        {/* ── Core ────────────────────────────────────────────────────────── */}
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="MainTabs" component={TabNavigator} options={{ headerShown: false }} />

        {/* ── Read Quran ──────────────────────────────────────────────────── */}
        <Stack.Screen
          name="QuranIndex"
          component={QuranIndexScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PdfViewer"
          component={PdfViewerScreen}
          options={{ headerShown: false }}
        />

        {/* ── Session ─────────────────────────────────────────────────────── */}
        <Stack.Screen
          name="SessionSetup"
          component={SessionSetupScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PdfSession"
          component={PdfSessionScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SessionSummary"
          component={SessionSummaryScreen}
          options={{ title: 'Session Summary' }}
        />

        {/* ── Legacy ──────────────────────────────────────────────────────── */}
        <Stack.Screen
          name="SurahDetail"
          component={SurahDetailScreen}
          options={{ title: 'Surah' }}
        />
        <Stack.Screen
          name="Recitation"
          component={RecitationScreen}
          options={{ title: 'Recitation', headerShown: false }}
        />
        <Stack.Screen
          name="PdfRecitation"
          component={PdfRecitationScreen}
          options={{ title: 'PDF Recitation', headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
