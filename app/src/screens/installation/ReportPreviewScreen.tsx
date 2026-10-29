import React from 'react';
import { View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation/types';
import { Screen, Text, Card, Button, Badge } from '../../components/ui';
import { FileText, Share2 } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';

type Route = RouteProp<RootStackParamList, 'ReportPreview'>;

export function ReportPreviewScreen() {
  const theme = useTheme();
  const route = useRoute<Route>();
  const { installationId } = route.params;

  return (
    <Screen
      title="Reporte de instalación"
      subtitle={`ID: ${installationId}`}
      scrollable
    >
      <Card style={{ marginBottom: theme.spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md }}>
          <FileText size={24} color={theme.colors.accent} style={{ marginRight: theme.spacing.sm }} />
          <View>
            <Text variant="bodyStrong">reporte_torre_norte.pdf</Text>
            <Text variant="caption" color="textSecondary">
              Tamaño: ~420 KB · Generado recién
            </Text>
          </View>
        </View>

        <Badge status="pending" label="Pendiente de sincronizar (Outbox)" />
      </Card>

      <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
        <Button
          variant="primary"
          title="Abrir PDF"
          fullWidth
          onPress={() => {}}
        />
        <Button
          variant="secondary"
          title="Compartir reporte"
          icon={<Share2 size={18} color={theme.colors.textPrimary} />}
          fullWidth
          onPress={() => {}}
        />
      </View>
    </Screen>
  );
}
