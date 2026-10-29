import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { TabsParamList } from './types';
import { ScanScreen } from '../screens/network/ScanScreen';
import { HistoryScreen } from '../screens/history/HistoryScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { Radar, History, Settings2 } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';

const Tab = createBottomTabNavigator<TabsParamList>();

export function TabsNavigator() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: theme.layout.tabBarHeight,
          backgroundColor: theme.colors.bg,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="NetworkTab"
        component={ScanScreen}
        options={{
          tabBarLabel: 'Red',
          tabBarIcon: ({ color, size }) => <Radar size={size} color={color} strokeWidth={1.75} />,
        }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'Historial',
          tabBarIcon: ({ color, size }) => <History size={size} color={color} strokeWidth={1.75} />,
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Ajustes',
          tabBarIcon: ({ color, size }) => <Settings2 size={size} color={color} strokeWidth={1.75} />,
        }}
      />
    </Tab.Navigator>
  );
}
