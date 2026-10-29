import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Screen, Text, Card, Input, Button, useToast } from '../../components/ui';
import { useSettingsStore, ThemePreference } from '../../store/settingsStore';
import { useTheme } from '../../theme/useTheme';

export function SettingsScreen() {
  const theme = useTheme();
  const { showToast } = useToast();
  const {
    themePreference,
    setThemePreference,
    defaultSnmpCommunity,
    setDefaultSnmpCommunity,
    syncBaseUrl,
    setSyncBaseUrl,
  } = useSettingsStore();

  const [testStatus, setTestStatus] = useState<string | null>(null);

  const handleTestConnection = async () => {
    try {
      setTestStatus('Probando conexión...');
      const response = await fetch(`${syncBaseUrl}/api/v1/sync/health`, {
        signal: AbortSignal.timeout(4000),
      });
      if (response.ok) {
        setTestStatus('Conexión exitosa con el servidor');
        showToast('Servidor alcanzable y operativo');
      } else {
        setTestStatus(`Error del servidor: HTTP ${response.status}`);
      }
    } catch (e: any) {
      setTestStatus('No se pudo conectar al servidor');
      showToast('Error de conexión con el backend');
    }
  };

  const themeOptions: Array<{ id: ThemePreference; label: string }> = [
    { id: 'system', label: 'Sistema' },
    { id: 'light', label: 'Claro' },
    { id: 'dark', label: 'Oscuro' },
  ];

  return (
    <Screen title="Ajustes" subtitle="Configuración general del toolkit" scrollable>
      {/* Apariencia */}
      <Card title="Apariencia" style={{ marginBottom: theme.spacing.lg }}>
        <Text variant="caption" color="textSecondary" style={{ marginBottom: theme.spacing.sm }}>
          Tema visual de la aplicación
        </Text>
        <View style={styles.segmentContainer}>
          {themeOptions.map((opt) => {
            const isSelected = themePreference === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                onPress={() => setThemePreference(opt.id)}
                style={[
                  styles.segmentButton,
                  {
                    backgroundColor: isSelected ? theme.colors.accent : theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text
                  variant="bodyStrong"
                  color={isSelected ? 'onAccent' : 'textPrimary'}
                  style={{ textAlign: 'center' }}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      {/* Parámetros SNMP */}
      <Card title="Parámetros SNMP" style={{ marginBottom: theme.spacing.lg }}>
        <Input
          label="Comunidad por defecto"
          placeholder="public"
          value={defaultSnmpCommunity}
          onChangeText={setDefaultSnmpCommunity}
          autoCapitalize="none"
          mono
        />
      </Card>

      {/* Sincronización */}
      <Card title="Sincronización (Outbox)" style={{ marginBottom: theme.spacing.lg }}>
        <Input
          label="URL del backend de sincronización"
          placeholder="http://192.168.1.100:3000"
          value={syncBaseUrl}
          onChangeText={setSyncBaseUrl}
          autoCapitalize="none"
          mono
        />
        <Button
          variant="secondary"
          title="Probar conexión"
          fullWidth
          onPress={handleTestConnection}
          style={{ marginTop: theme.spacing.xs }}
        />
        {testStatus ? (
          <Text
            variant="caption"
            color="textSecondary"
            style={{ marginTop: theme.spacing.sm, textAlign: 'center' }}
          >
            {testStatus}
          </Text>
        ) : null}
      </Card>

      {/* Acerca de */}
      <Card title="Acerca de" style={{ marginBottom: theme.spacing.xl }}>
        <Text variant="body" color="textPrimary">
          Network Diagnostics Suite (NetDiag)
        </Text>
        <Text variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
          Versión 1.0.0 (Build 2026.1)
        </Text>
        <Text variant="caption" color="textTertiary" style={{ marginTop: 2 }}>
          Desarrollo de Aplicaciones Móviles — Licenciatura en Sistemas
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  segmentContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
