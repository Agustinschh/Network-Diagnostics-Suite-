import React, { useEffect, useMemo, useState } from 'react';
import { View, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { Screen, Input, ListRow, Badge, EmptyState, Text } from '../../components/ui';
import { History as HistoryIcon, Wrench, Activity } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';
import { installationsRepository } from '../../db/repositories/installations';
import { diagnosticsRepository } from '../../db/repositories/diagnostics';
import { devicesRepository } from '../../db/repositories/devices';
import type { Installation } from '../../db/models/Installation';
import type { Diagnostic } from '../../db/models/Diagnostic';
import type { Device } from '../../db/models/Device';
import { formatDate } from '../../utils/format';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type TabKind = 'installations' | 'diagnostics';

export function HistoryScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavProp>();

  const [activeTab, setActiveTab] = useState<TabKind>('installations');
  const [search, setSearch] = useState('');
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [devicesMap, setDevicesMap] = useState<Record<string, Device>>({});

  // Cargar y observar dispositivos para resolver IP/Hostname
  useEffect(() => {
    const sub = devicesRepository.observeAll().subscribe((devs) => {
      const map: Record<string, Device> = {};
      devs.forEach((d) => {
        map[d.id] = d;
      });
      setDevicesMap(map);
    });
    return () => sub.unsubscribe();
  }, []);

  // Observar instalaciones
  useEffect(() => {
    const sub = installationsRepository.observeAll().subscribe((items) => {
      setInstallations(items);
    });
    return () => sub.unsubscribe();
  }, []);

  // Observar diagnósticos
  useEffect(() => {
    const sub = diagnosticsRepository.observeRecent(100).subscribe((items) => {
      setDiagnostics(items);
    });
    return () => sub.unsubscribe();
  }, []);

  const query = search.trim().toLowerCase();

  const filteredInstallations = useMemo(() => {
    if (!query) return installations;
    return installations.filter((inst) => {
      const dev = devicesMap[inst.deviceId];
      const site = (inst.siteName || '').toLowerCase();
      const client = (inst.clientName || '').toLowerCase();
      const tech = (inst.technicianName || '').toLowerCase();
      const ip = (dev?.ipAddress || '').toLowerCase();
      const serial = (dev?.serialNumber || '').toLowerCase();
      return (
        site.includes(query) ||
        client.includes(query) ||
        tech.includes(query) ||
        ip.includes(query) ||
        serial.includes(query)
      );
    });
  }, [installations, query, devicesMap]);

  const filteredDiagnostics = useMemo(() => {
    if (!query) return diagnostics;
    return diagnostics.filter((diag) => {
      const dev = devicesMap[diag.deviceId];
      const sysName = (diag.snmpSysName || '').toLowerCase();
      const sysDescr = (diag.snmpSysDescr || '').toLowerCase();
      const ssh = (diag.sshProfile || '').toLowerCase();
      const kind = (diag.kind || '').toLowerCase();
      const ip = (dev?.ipAddress || '').toLowerCase();
      const serial = (dev?.serialNumber || '').toLowerCase();
      return (
        sysName.includes(query) ||
        sysDescr.includes(query) ||
        ssh.includes(query) ||
        kind.includes(query) ||
        ip.includes(query) ||
        serial.includes(query)
      );
    });
  }, [diagnostics, query, devicesMap]);

  return (
    <Screen title="Historial" subtitle="Instalaciones y diagnósticos locales">
      {/* Selector de pestañas segmentadas */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: theme.colors.surfaceAlt,
          borderRadius: theme.radius.md,
          padding: 4,
          marginBottom: theme.spacing.md,
        }}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setActiveTab('installations')}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 8,
            borderRadius: theme.radius.sm,
            backgroundColor:
              activeTab === 'installations' ? theme.colors.surface : 'transparent',
          }}
        >
          <Wrench
            size={16}
            color={
              activeTab === 'installations'
                ? theme.colors.accent
                : theme.colors.textSecondary
            }
            style={{ marginRight: 6 }}
          />
          <Text
            variant="body"
            color={activeTab === 'installations' ? 'textPrimary' : 'textSecondary'}
            style={{ fontWeight: activeTab === 'installations' ? '600' : '400' }}
          >
            Instalaciones ({installations.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setActiveTab('diagnostics')}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 8,
            borderRadius: theme.radius.sm,
            backgroundColor:
              activeTab === 'diagnostics' ? theme.colors.surface : 'transparent',
          }}
        >
          <Activity
            size={16}
            color={
              activeTab === 'diagnostics'
                ? theme.colors.accent
                : theme.colors.textSecondary
            }
            style={{ marginRight: 6 }}
          />
          <Text
            variant="body"
            color={activeTab === 'diagnostics' ? 'textPrimary' : 'textSecondary'}
            style={{ fontWeight: activeTab === 'diagnostics' ? '600' : '400' }}
          >
            Diagnósticos ({diagnostics.length})
          </Text>
        </TouchableOpacity>
      </View>

      <Input
        placeholder="Buscar por sitio, cliente, IP o serie..."
        value={search}
        onChangeText={setSearch}
      />

      <View style={{ flex: 1, marginTop: theme.spacing.md }}>
        {activeTab === 'installations' ? (
          filteredInstallations.length === 0 ? (
            <EmptyState
              icon={<HistoryIcon size={40} color={theme.colors.textTertiary} />}
              title="Sin instalaciones registradas"
              description={
                query
                  ? 'No hay instalaciones que coincidan con la búsqueda.'
                  : 'Las instalaciones y reportes finalizados aparecerán aquí.'
              }
            />
          ) : (
            <FlatList
              data={filteredInstallations}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const dev = devicesMap[item.deviceId];
                const title = item.siteName || 'Instalación sin nombre';
                const clientPart = item.clientName ? `${item.clientName} · ` : '';
                const ipPart = dev?.ipAddress ? `${dev.ipAddress} · ` : '';
                const datePart = formatDate(item.createdAt);

                return (
                  <ListRow
                    title={title}
                    subtitle={`${clientPart}${ipPart}${datePart}`}
                    rightContent={
                      item.status === 'finalized' ? (
                        <Badge status="synced" label="Finalizado" />
                      ) : (
                        <Badge status="down" label="Borrador" />
                      )
                    }
                    onPress={() =>
                      navigation.navigate('HistoryDetail', {
                        kind: 'installation',
                        id: item.id,
                      })
                    }
                  />
                );
              }}
            />
          )
        ) : filteredDiagnostics.length === 0 ? (
          <EmptyState
            icon={<HistoryIcon size={40} color={theme.colors.textTertiary} />}
            title="Sin diagnósticos registrados"
            description={
              query
                ? 'No hay diagnósticos que coincidan con la búsqueda.'
                : 'Las lecturas SNMP y sesiones SSH guardadas aparecerán aquí.'
            }
          />
        ) : (
          <FlatList
            data={filteredDiagnostics}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const dev = devicesMap[item.deviceId];
              const isSnmp = item.kind === 'snmp';
              const title = isSnmp
                ? item.snmpSysName || 'Telemetría SNMP MIB-II'
                : `Sesión SSH (${item.sshProfile || 'Manual'})`;
              const ipPart = dev?.ipAddress ? `${dev.ipAddress} · ` : '';
              const datePart = formatDate(item.createdAt);

              return (
                <ListRow
                  title={title}
                  subtitle={`${ipPart}${datePart}`}
                  rightContent={
                    item.success ? (
                      <Badge status="up" label="Éxito" />
                    ) : (
                      <Badge status="down" label="Fallo" />
                    )
                  }
                  onPress={() =>
                    navigation.navigate('HistoryDetail', {
                      kind: 'diagnostic',
                      id: item.id,
                    })
                  }
                />
              );
            }}
          />
        )}
      </View>
    </Screen>
  );
}
