import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import {
  Screen,
  Text,
  Button,
  ListRow,
  EmptyState,
  Badge,
} from '../../components/ui';
import { SyncIndicator } from '../../components/SyncIndicator';
import { Radar, CloudOff, Router } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';
import { useScanStore } from '../../store/scanStore';
import { DiscoveredHost } from '../../services/discovery/DiscoveryService';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export function ScanScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavProp>();

  const {
    status,
    hosts,
    progress,
    error,
    networkInfo,
    refreshNetworkInfo,
    startScan,
    stopScan,
  } = useScanStore();

  useEffect(() => {
    refreshNetworkInfo();
  }, [refreshNetworkInfo]);

  const isScanning = status === 'scanning';

  const subtitle = networkInfo
    ? `${networkInfo.ssid ? `Wi-Fi "${networkInfo.ssid}" · ` : ''}${networkInfo.ip}/${networkInfo.prefix}`
    : 'Buscando red local...';

  const progressFraction =
    progress.total > 0 ? progress.scanned / progress.total : 0;

  const renderHostItem = ({ item }: { item: DiscoveredHost }) => {
    const portsLabel =
      item.openPorts.length > 0 ? ` · Puertos: ${item.openPorts.join(', ')}` : '';
    const subtitleText = `${item.hostname || 'Sin nombre'}${portsLabel}`;

    return (
      <ListRow
        title={item.ip}
        subtitle={subtitleText}
        monoTitle
        icon={<Router size={20} color={theme.colors.accent} />}
        rightContent={
          item.rttMs !== undefined ? (
            <Text variant="monoSmall" color="textSecondary">
              {item.rttMs} ms
            </Text>
          ) : undefined
        }
        onPress={() => navigation.navigate('Device', { deviceId: item.ip })}
      />
    );
  };

  return (
    <Screen
      title="Red"
      subtitle={subtitle}
      rightAction={<SyncIndicator />}
      contentStyle={{ paddingHorizontal: 0, paddingBottom: theme.spacing.md }}
    >
      {/* Barra de progreso lineal determinada de 2px bajo el header */}
      {isScanning ? (
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.round(progressFraction * 100)}%`,
                backgroundColor: theme.colors.accent,
              },
            ]}
          />
        </View>
      ) : null}

      <View style={{ flex: 1, paddingHorizontal: theme.spacing.lg }}>
        {/* Contador protagonista si hay hosts o si está escaneando */}
        {hosts.length > 0 || isScanning ? (
          <View style={styles.counterHeader}>
            <Text variant="display" color="textPrimary">
              {hosts.length}
            </Text>
            <Text variant="caption" color="textSecondary">
              {isScanning
                ? `escaneando (${progress.scanned}/${progress.total})...`
                : 'equipos encontrados'}
            </Text>
          </View>
        ) : null}

        {/* Lista de hosts o estados vacíos */}
        {error ? (
          <EmptyState
            icon={<CloudOff size={36} color={theme.colors.danger} />}
            title="Sin conexión de red"
            description={error}
            actionTitle="Reintentar"
            onAction={refreshNetworkInfo}
          />
        ) : hosts.length === 0 && !isScanning ? (
          <EmptyState
            icon={<Radar size={36} color={theme.colors.textTertiary} />}
            title="Buscá equipos en esta red"
            description="Iniciá un escaneo para descubrir routers, ONTs y switches conectados a la subred Wi-Fi."
            actionTitle="Agregar IP manualmente"
            onAction={() => navigation.navigate('ManualHost')}
          />
        ) : (
          <FlatList
            data={hosts}
            keyExtractor={(item) => item.ip}
            renderItem={renderHostItem}
            contentContainerStyle={{ paddingBottom: theme.spacing.lg }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Botones de acción inferiores fijos */}
      <View style={[styles.bottomBar, { paddingHorizontal: theme.spacing.lg }]}>
        {isScanning ? (
          <Button
            variant="secondary"
            title="Detener escaneo"
            fullWidth
            onPress={stopScan}
          />
        ) : (
          <>
            <Button
              variant="primary"
              title="Escanear red"
              fullWidth
              onPress={startScan}
            />
            <Button
              variant="ghost"
              title="Agregar IP manualmente"
              fullWidth
              onPress={() => navigation.navigate('ManualHost')}
              style={{ marginTop: theme.spacing.xs }}
            />
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  progressBarBackground: {
    height: 2,
    width: '100%',
    backgroundColor: '#E3E6EA',
  },
  progressBarFill: {
    height: '100%',
  },
  counterHeader: {
    paddingVertical: 12,
  },
  bottomBar: {
    paddingTop: 8,
  },
});
