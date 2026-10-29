import React, { useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { Screen, Input, ListRow, Badge, EmptyState } from '../../components/ui';
import { History as HistoryIcon } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export function HistoryScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavProp>();
  const [search, setSearch] = useState('');

  return (
    <Screen title="Historial" subtitle="Instalaciones y diagnósticos locales">
      <Input
        placeholder="Buscar por sitio, cliente, IP o serie..."
        value={search}
        onChangeText={setSearch}
      />

      <View style={{ flex: 1, marginTop: theme.spacing.md }}>
        <ListRow
          title="Torre Norte - Gabinete 2"
          subtitle="Telecom · 192.168.1.1 · Hoy 10:45"
          rightContent={<Badge status="synced" label="Sincronizado" />}
          onPress={() =>
            navigation.navigate('HistoryDetail', {
              kind: 'installation',
              id: 'inst_mock_1',
            })
          }
        />
        <ListRow
          title="Diagnóstico SNMP - router.lan"
          subtitle="192.168.1.20 · Uptime: 4d · Ayer 17:30"
          rightContent={<Badge status="up" label="Éxito" />}
          onPress={() =>
            navigation.navigate('HistoryDetail', {
              kind: 'diagnostic',
              id: 'diag_mock_1',
            })
          }
        />
      </View>
    </Screen>
  );
}
