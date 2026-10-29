import React from 'react';
import { View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation/types';
import { Screen, Text, Card, Badge, Button } from '../../components/ui';
import { useTheme } from '../../theme/useTheme';

type Route = RouteProp<RootStackParamList, 'HistoryDetail'>;

export function HistoryDetailScreen() {
  const theme = useTheme();
  const route = useRoute<Route>();
  const { kind, id } = route.params;

  return (
    <Screen
      title="Detalle del registro"
      subtitle={`${kind === 'installation' ? 'Instalación' : 'Diagnóstico'} · ${id}`}
      scrollable
    >
      <Card title="Información general" style={{ marginBottom: theme.spacing.lg }}>
        <Text variant="heading" color="textPrimary">
          {kind === 'installation' ? 'Torre Norte - Gabinete 2' : 'Diagnóstico SNMP'}
        </Text>
        <Text variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
          Fecha: 29/10/2026 10:45 · Operador: Telecom
        </Text>

        <View style={{ marginTop: theme.spacing.md }}>
          <Badge status="synced" label="Sincronizado con backend" />
        </View>
      </Card>

      {kind === 'installation' ? (
        <Button
          variant="primary"
          title="Ver reporte PDF"
          fullWidth
          onPress={() => {}}
        />
      ) : null}
    </Screen>
  );
}
