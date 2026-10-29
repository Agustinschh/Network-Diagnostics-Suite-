import React from 'react';
import { View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation/types';
import { Screen, Text, Card, Button, Badge } from '../../components/ui';
import { useTheme } from '../../theme/useTheme';

type Route = RouteProp<RootStackParamList, 'Snmp'>;

export function SnmpScreen() {
  const theme = useTheme();
  const route = useRoute<Route>();
  const { deviceId } = route.params;

  return (
    <Screen
      title="Telemetría SNMP"
      subtitle={`Equipo: ${deviceId}`}
      scrollable
    >
      <Card title="Sistema" style={{ marginBottom: theme.spacing.lg }}>
        <Text variant="heading" color="textPrimary">
          router.principal
        </Text>
        <Text
          variant="caption"
          color="textSecondary"
          numberOfLines={3}
          style={{ marginTop: 4, marginBottom: theme.spacing.md }}
        >
          MikroTik RouterOS 7.12.1 (stable) on hAP ac2
        </Text>

        <Text variant="label" color="textSecondary">
          Tiempo activo
        </Text>
        <Text
          variant="display"
          color="accent"
          style={{ fontFamily: theme.typography.mono.fontFamily, marginTop: 2 }}
        >
          4 d 12 h 35 m
        </Text>
      </Card>

      <View style={{ marginBottom: theme.spacing.lg }}>
        <Text variant="overline" color="textSecondary" style={{ marginBottom: theme.spacing.sm }}>
          INTERFACES (1 DETECTADA)
        </Text>

        <Card surface>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text variant="bodyStrong">ether1-gateway</Text>
              <Text variant="monoSmall" color="textSecondary" style={{ marginTop: 2 }}>
                MAC: cc:2d:e0:1a:2b:3c
              </Text>
              <Text variant="monoSmall" color="textTertiary" style={{ marginTop: 2 }}>
                ↓ 128.4 MB  ↑ 34.2 MB
              </Text>
            </View>
            <Badge status="up" label="Activa" />
          </View>
        </Card>
      </View>

      <Button
        variant="primary"
        title="Consultar SNMP"
        fullWidth
        onPress={() => {}}
      />
    </Screen>
  );
}
