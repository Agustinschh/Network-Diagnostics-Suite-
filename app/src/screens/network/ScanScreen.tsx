import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { Screen, Text, Button, EmptyState } from '../../components/ui';
import { SyncIndicator } from '../../components/SyncIndicator';
import { Radar } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export function ScanScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavProp>();

  return (
    <Screen
      title="Red"
      subtitle="Wi-Fi local no detectada"
      rightAction={<SyncIndicator />}
    >
      <View style={{ flex: 1 }}>
        <EmptyState
          icon={<Radar size={36} color={theme.colors.textTertiary} />}
          title="Buscá equipos en esta red"
          description="Iniciá un escaneo para descubrir routers, ONTs y switches conectados a la red local."
          actionTitle="Agregar IP manualmente"
          onAction={() => navigation.navigate('ManualHost')}
        />
      </View>

      <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
        <Button
          variant="primary"
          title="Escanear red"
          fullWidth
          onPress={() => {}}
        />
        <Button
          variant="ghost"
          title="Agregar IP manualmente"
          fullWidth
          onPress={() => navigation.navigate('ManualHost')}
        />
      </View>
    </Screen>
  );
}
