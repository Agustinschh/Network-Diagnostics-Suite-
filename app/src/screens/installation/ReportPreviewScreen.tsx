import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as RNFS from '@dr.pogodin/react-native-fs';
import { Q } from '@nozbe/watermelondb';
import { FileText, Share2, ArrowLeft, Home, CheckCircle, Cloud, AlertCircle } from 'lucide-react-native';
import type { RootStackParamList } from '../../navigation/types';
import { Screen, Text, Card, Button, Badge, useToast } from '../../components/ui';
import { useTheme } from '../../theme/useTheme';
import { installationsRepository } from '../../db/repositories/installations';
import { database } from '../../db';
import { Installation } from '../../db/models/Installation';
import { OutboxItem } from '../../db/models/OutboxItem';
import { ReportService } from '../../services/report/ReportService';
import { formatBytes } from '../../utils/format';
import { logger } from '../../utils/logger';

type Route = RouteProp<RootStackParamList, 'ReportPreview'>;
type NavProp = NativeStackNavigationProp<RootStackParamList>;

export function ReportPreviewScreen() {
  const theme = useTheme();
  const route = useRoute<Route>();
  const navigation = useNavigation<NavProp>();
  const { installationId } = route.params;
  const { showToast } = useToast();

  const [installation, setInstallation] = useState<Installation | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [syncStatus, setSyncStatus] = useState<string>('PENDING');
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const inst = await installationsRepository.getById(installationId);
        if (!mounted || !inst) return;
        setInstallation(inst);

        // Consultar tamaño del archivo PDF
        if (inst.pdfLocalPath) {
          try {
            const cleanPath = inst.pdfLocalPath.replace('file://', '');
            const stat = await RNFS.stat(cleanPath);
            if (mounted) setFileSize(stat.size);
          } catch (statErr) {
            logger.warn('Error al obtener tamaño del PDF:', statErr);
          }
        }

        // Consultar estado en la cola Outbox
        const outboxRecords = await database
          .get<OutboxItem>('outbox')
          .query(Q.where('entity_id', installationId))
          .fetch();

        if (mounted && outboxRecords.length > 0) {
          setSyncStatus(outboxRecords[0].status || 'PENDING');
        }
      } catch (err) {
        logger.error('Error al cargar datos en ReportPreviewScreen:', err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [installationId]);

  const handleShare = async () => {
    if (!installation?.pdfLocalPath) {
      showToast('No se encontró el archivo PDF para compartir');
      return;
    }
    setIsSharing(true);
    try {
      await ReportService.share(installation.pdfLocalPath);
    } catch (e: any) {
      showToast(e?.message || 'Error al compartir reporte');
    } finally {
      setIsSharing(false);
    }
  };

  const getSyncBadge = () => {
    switch (syncStatus) {
      case 'SYNCED':
        return <Badge status="synced" label="Sincronizado con el servidor" />;
      case 'FAILED':
        return <Badge status="failed" label="Error al sincronizar (reintentando)" />;
      case 'IN_PROGRESS':
        return <Badge status="pending" label="Sincronizando ahora..." />;
      case 'PENDING':
      default:
        return <Badge status="pending" label="Pendiente de sincronizar (Outbox)" />;
    }
  };

  const fileName = installation?.pdfLocalPath
    ? installation.pdfLocalPath.split('/').pop()
    : 'reporte_instalacion.pdf';

  return (
    <Screen
      title="Certificación Completa"
      subtitle={installation ? `${installation.siteName} (${installation.clientName})` : 'Reporte'}
      scrollable
    >
      {/* Tarjeta del archivo generado */}
      <Card title="Documento oficial generado" style={{ marginBottom: theme.spacing.lg }}>
        <View style={styles.fileRow}>
          <FileText size={32} color={theme.colors.accent} style={{ marginRight: theme.spacing.md }} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong" color="textPrimary" numberOfLines={1}>
              {fileName}
            </Text>
            <Text variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
              {fileSize !== null ? `Tamaño: ${formatBytes(fileSize)}` : 'Documento compilado listo'}
            </Text>
          </View>
        </View>

        <View style={{ marginTop: theme.spacing.sm }}>
          {getSyncBadge()}
        </View>
      </Card>

      {/* Datos del informe certificado */}
      <Card title="Resumen de certificación" style={{ marginBottom: theme.spacing.xl }}>
        <View style={styles.metaRow}>
          <Text variant="caption" color="textSecondary">
            Sitio / Nodo:
          </Text>
          <Text variant="bodyStrong" color="textPrimary">
            {installation?.siteName || 'N/A'}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Text variant="caption" color="textSecondary">
            Cliente:
          </Text>
          <Text variant="body" color="textPrimary">
            {installation?.clientName || 'N/A'}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Text variant="caption" color="textSecondary">
            Técnico certificado:
          </Text>
          <Text variant="body" color="textPrimary">
            {installation?.technicianName || 'N/A'}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Text variant="caption" color="textSecondary">
            Ubicación GPS:
          </Text>
          <Text variant="body" color="textPrimary">
            {installation?.latitude && installation?.longitude
              ? `${installation.latitude.toFixed(5)}, ${installation.longitude.toFixed(5)}`
              : 'No registrada'}
          </Text>
        </View>

        <View style={[styles.metaRow, { borderBottomWidth: 0 }]}>
          <Text variant="caption" color="textSecondary">
            Estado de informe:
          </Text>
          <Badge status="up" label="FINALIZADO" />
        </View>
      </Card>

      {/* Botones de acción */}
      <Button
        variant="primary"
        title={isSharing ? 'Preparando archivo...' : 'Compartir reporte PDF'}
        icon={<Share2 size={18} color={theme.colors.onAccent} />}
        loading={isSharing}
        disabled={isSharing}
        fullWidth
        onPress={handleShare}
        style={{ marginBottom: theme.spacing.md }}
      />

      <Button
        variant="secondary"
        title="Volver a la pantalla principal"
        icon={<Home size={18} color={theme.colors.textPrimary} />}
        fullWidth
        onPress={() => navigation.navigate('Tabs', { screen: 'NetworkTab' })}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E3E6EA',
  },
});
