import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { TabsNavigator } from './TabsNavigator';
import { ManualHostScreen } from '../screens/network/ManualHostScreen';
import { DeviceScreen } from '../screens/device/DeviceScreen';
import { SnmpScreen } from '../screens/device/SnmpScreen';
import { SshScreen } from '../screens/device/SshScreen';
import { CredentialsScreen } from '../screens/device/CredentialsScreen';
import { InstallationFormScreen } from '../screens/installation/InstallationFormScreen';
import { CameraScreen } from '../screens/installation/CameraScreen';
import { CodeScannerScreen } from '../screens/installation/CodeScannerScreen';
import { ReportPreviewScreen } from '../screens/installation/ReportPreviewScreen';
import { HistoryDetailScreen } from '../screens/history/HistoryDetailScreen';
import { useTheme } from '../theme/useTheme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const theme = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.bg,
        },
        headerTintColor: theme.colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: theme.colors.bg,
        },
      }}
    >
      <Stack.Screen
        name="Tabs"
        component={TabsNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ManualHost"
        component={ManualHostScreen}
        options={{ title: 'Agregar equipo' }}
      />
      <Stack.Screen
        name="Device"
        component={DeviceScreen}
        options={{ title: 'Detalle de equipo' }}
      />
      <Stack.Screen
        name="Snmp"
        component={SnmpScreen}
        options={{ title: 'Telemetría SNMP' }}
      />
      <Stack.Screen
        name="Ssh"
        component={SshScreen}
        options={{ title: 'Consola SSH' }}
      />
      <Stack.Screen
        name="Credentials"
        component={CredentialsScreen}
        options={{ title: 'Credenciales' }}
      />
      <Stack.Screen
        name="InstallationForm"
        component={InstallationFormScreen}
        options={{ title: 'Nueva instalación' }}
      />
      <Stack.Screen
        name="Camera"
        component={CameraScreen}
        options={{ headerShown: false, presentation: 'fullScreenModal' }}
      />
      <Stack.Screen
        name="CodeScanner"
        component={CodeScannerScreen}
        options={{ headerShown: false, presentation: 'fullScreenModal' }}
      />
      <Stack.Screen
        name="ReportPreview"
        component={ReportPreviewScreen}
        options={{ title: 'Reporte' }}
      />
      <Stack.Screen
        name="HistoryDetail"
        component={HistoryDetailScreen}
        options={{ title: 'Detalle' }}
      />
    </Stack.Navigator>
  );
}
