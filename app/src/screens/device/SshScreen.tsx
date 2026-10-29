import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation/types';
import { Screen, Text, Button, Card } from '../../components/ui';
import { useTheme } from '../../theme/useTheme';

type Route = RouteProp<RootStackParamList, 'Ssh'>;

export function SshScreen() {
  const theme = useTheme();
  const route = useRoute<Route>();
  const { deviceId } = route.params;

  const [output] = useState(
    '$ /system resource print\n  uptime: 4d12h35m\n  version: 7.12.1\n  cpu-load: 3%\n\n$ /interface print\n  0 R ether1-gateway\n  1 R ether2-lan'
  );

  return (
    <Screen
      title="Diagnóstico SSH"
      subtitle={`Equipo: ${deviceId}`}
      scrollable
    >
      <Card title="Perfil de comandos" style={{ marginBottom: theme.spacing.lg }}>
        <Text variant="body" color="textPrimary">
          MikroTik RouterOS (Sugerido)
        </Text>
        <Text variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
          Comandos: /system resource print, /interface print, /ping count=3
        </Text>
      </Card>

      <Text variant="overline" color="textSecondary" style={{ marginBottom: theme.spacing.xs }}>
        SALIDA DE CONSOLA
      </Text>

      <View
        style={[
          styles.terminalBox,
          {
            backgroundColor: theme.colors.terminalBg,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.lg,
          },
        ]}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Text
            variant="monoSmall"
            style={{ color: theme.colors.terminalText }}
          >
            {output}
          </Text>
        </ScrollView>
      </View>

      <Button
        variant="primary"
        title="Ejecutar diagnóstico"
        fullWidth
        onPress={() => {}}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  terminalBox: {
    minHeight: 180,
    borderWidth: 1,
  },
});
