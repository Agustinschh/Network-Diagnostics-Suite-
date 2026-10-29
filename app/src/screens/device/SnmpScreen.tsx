import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation/types';
import { Screen, Text, Card, Button, useToast } from '../../components/ui';
import { InterfaceRow } from '../../components/InterfaceRow';
import { useTheme } from '../../theme/useTheme';
import { useSettingsStore } from '../../store/settingsStore';
import {
  snmpClient,
  SnmpSystemInfo,
  SnmpInterface,
} from '../../services/snmp/SnmpClient';
import { devicesRepository } from '../../db/repositories/devices';
import { diagnosticsRepository } from '../../db/repositories/diagnostics';
import { outboxRepository } from '../../db/repositories/outbox';
import { formatUptime } from '../../utils/format';
import { userErrorMessage } from '../../utils/errors';
import { TriangleAlert } from 'lucide-react-native';

type Route = RouteProp<RootStackParamList, 'Snmp'>;

export function SnmpScreen() {
  const theme = useTheme();
  const route = useRoute<Route>();
  const { deviceId } = route.params;
  const { showToast } = useToast();
  const defaultCommunity = useSettingsStore((s) => s.defaultSnmpCommunity);

  const [loading, setLoading] = useState(false);
  const [deviceIp, setDeviceIp] = useState(deviceId);
  const [systemInfo, setSystemInfo] = useState<SnmpSystemInfo | null>(null);
  const [interfaces, setInterfaces] = useState<SnmpInterface[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Cargar IP real si deviceId es un ID de BD
  useEffect(() => {
    (async () => {
      const dev = await devicesRepository.getById(deviceId);
      if (dev) {
        setDeviceIp(dev.ipAddress);
      }
    })();
  }, [deviceId]);

  const querySnmp = useCallback(async () => {
    setLoading(true);
    setError(null);

    const target = {
      host: deviceIp,
      community: defaultCommunity || 'public',
    };

    try {
      // 1. Obtener información de sistema
      const sys = await snmpClient.getSystemInfo(target);
      setSystemInfo(sys);

      // 2. Obtener interfaces
      let ifaces: SnmpInterface[] = [];
      try {
        ifaces = await snmpClient.getInterfaces(target);
        setInterfaces(ifaces);
      } catch (ifErr) {
        // Si no responde ifTable completa, mantener interfaces vacías
      }

      // 3. Persistir diagnóstico en WatermelonDB
      const diag = await diagnosticsRepository.create({
        deviceId,
        kind: 'snmp',
        snmpSysName: sys.sysName,
        snmpSysDescr: sys.sysDescr,
        snmpUptimeTicks: sys.uptimeTicks,
        snmpInterfaces: ifaces,
        success: true,
      });

      // 4. Encolar en Outbox
      await outboxRepository.enqueue('DIAGNOSTIC', diag.id, {
        deviceId,
        kind: 'snmp',
        sysName: sys.sysName,
        uptimeTicks: sys.uptimeTicks,
        interfacesCount: ifaces.length,
      });

      // 5. Si encontramos MAC y el device no la tenía, actualizar identidad
      const activeIfaceWithMac = ifaces.find((i) => i.operStatus === 'up' && i.mac);
      if (activeIfaceWithMac?.mac) {
        await devicesRepository.updateIdentity(deviceId, {
          macAddress: activeIfaceWithMac.mac,
        });
      }

      showToast('Telemetría SNMP actualizada con éxito');
    } catch (e: any) {
      const msg = userErrorMessage(e);
      setError(msg);

      // Registrar diagnóstico fallido
      try {
        await diagnosticsRepository.create({
          deviceId,
          kind: 'snmp',
          success: false,
          errorCode: e?.code || 'UNKNOWN',
        });
      } catch {}
    } finally {
      setLoading(false);
    }
  }, [deviceIp, defaultCommunity, deviceId, showToast]);

  return (
    <Screen
      title="Telemetría SNMP"
      subtitle={`Equipo: ${deviceIp}`}
      scrollable
    >
      {error ? (
        <Card
          style={{
            borderColor: theme.colors.danger,
            borderWidth: 1,
            marginBottom: theme.spacing.lg,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TriangleAlert size={20} color={theme.colors.danger} style={{ marginRight: 8 }} />
            <Text variant="body" color="danger" style={{ flex: 1 }}>
              {error}
            </Text>
          </View>
        </Card>
      ) : null}

      {systemInfo ? (
        <Card title="Sistema" style={{ marginBottom: theme.spacing.lg }}>
          <Text variant="heading" color="textPrimary">
            {systemInfo.sysName || 'Sin nombre de sistema'}
          </Text>
          <Text
            variant="caption"
            color="textSecondary"
            numberOfLines={4}
            style={{ marginTop: 4, marginBottom: theme.spacing.md }}
          >
            {systemInfo.sysDescr}
          </Text>

          <Text variant="label" color="textSecondary">
            Tiempo activo (Uptime)
          </Text>
          <Text
            variant="display"
            color="accent"
            style={{ fontFamily: theme.typography.mono.fontFamily, marginTop: 2 }}
          >
            {formatUptime(systemInfo.uptimeTicks)}
          </Text>
        </Card>
      ) : null}

      {interfaces.length > 0 ? (
        <View style={{ marginBottom: theme.spacing.lg }}>
          <Text
            variant="overline"
            color="textSecondary"
            style={{ marginBottom: theme.spacing.sm }}
          >
            INTERFACES ({interfaces.length} DETECTADAS)
          </Text>

          {interfaces.map((item) => (
            <InterfaceRow key={item.index} item={item} />
          ))}
        </View>
      ) : null}

      <Button
        variant="primary"
        title="Consultar SNMP"
        loading={loading}
        fullWidth
        onPress={querySnmp}
      />
    </Screen>
  );
}
