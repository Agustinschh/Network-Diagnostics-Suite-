import React from 'react';
import { View } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { Screen, Text, Card, ListRow, Button, Badge } from '../../components/ui';
import { Activity, TerminalSquare, KeyRound, ScanLine } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';

type Route = RouteProp<RootStackParamList, 'Device'>;
type NavProp = NativeStackNavigationProp<RootStackParamList>;

export function DeviceScreen() {
  const theme = useTheme();
  const route = useRoute<Route>();
  const navigation = useNavigation<NavProp>();
  const { deviceId } = route.params;

  return (
    <Screen
      title="Equipo"
      subtitle={`ID: ${deviceId}`}
      scrollable
    >
      <View style={{ marginBottom: theme.spacing.lg }}>
        <Text variant="display" color="textPrimary" style={theme.typography.mono}>
          192.168.1.1
        </Text>
        <Text variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
          MikroTik RouterOS · MAC: No detectada
        </Text>
        <View style={{ marginTop: theme.spacing.sm }}>
          <Badge status="up" label="Visto recién" />
        </View>
      </View>

      {/* Diagnóstico */}
      <Card title="Diagnóstico" style={{ marginBottom: theme.spacing.lg }}>
        <ListRow
          title="Telemetría SNMP"
          subtitle="Uptime, sysName e interfaces MIB-II"
          icon={<Activity size={20} color={theme.colors.accent} />}
          onPress={() => navigation.navigate('Snmp', { deviceId })}
        />
        <ListRow
          title="Consola SSH"
          subtitle="Ejecución de perfiles de comandos"
          icon={<TerminalSquare size={20} color={theme.colors.accent} />}
          onPress={() => navigation.navigate('Ssh', { deviceId })}
        />
        <ListRow
          title="Credenciales"
          subtitle="Usuario, contraseña y comunidad SNMP"
          icon={<KeyRound size={20} color={theme.colors.accent} />}
          showDivider={false}
          onPress={() => navigation.navigate('Credentials', { deviceId })}
        />
      </Card>

      {/* Identificación */}
      <Card title="Identificación" style={{ marginBottom: theme.spacing.lg }}>
        <ListRow
          title="Código QR / Barras"
          subtitle="Vincular número de serie y modelo"
          icon={<ScanLine size={20} color={theme.colors.accent} />}
          showDivider={false}
          onPress={() => navigation.navigate('CodeScanner', { deviceId })}
        />
      </Card>

      <Button
        variant="primary"
        title="Nueva instalación"
        fullWidth
        onPress={() => navigation.navigate('InstallationForm', { deviceId })}
      />
    </Screen>
  );
}
