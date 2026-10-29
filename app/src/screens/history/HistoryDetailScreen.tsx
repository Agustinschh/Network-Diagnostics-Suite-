import React, { useEffect, useState } from 'react';
import { View, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { Screen, Text, Card, Badge, Button, Divider } from '../../components/ui';
import { TerminalView } from '../../components/TerminalView';
import { useTheme } from '../../theme/useTheme';
import { installationsRepository } from '../../db/repositories/installations';
import { diagnosticsRepository } from '../../db/repositories/diagnostics';
import { devicesRepository } from '../../db/repositories/devices';
import { PhotoService } from '../../services/evidence/PhotoService';
import { ReportService } from '../../services/report/ReportService';
import type { Installation } from '../../db/models/Installation';
import type { Diagnostic } from '../../db/models/Diagnostic';
import type { Device } from '../../db/models/Device';
import type { EvidencePhoto } from '../../db/models/EvidencePhoto';
import { formatDate, formatBytes, formatUptime } from '../../utils/format';
import {
  FileText,
  Share2,
  MapPin,
  Camera,
  Activity,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Layers,
  CheckCircle2,
  XCircle,
} from 'lucide-react-native';

type Route = RouteProp<RootStackParamList, 'HistoryDetail'>;
type NavProp = NativeStackNavigationProp<RootStackParamList>;

export function HistoryDetailScreen() {
  const theme = useTheme();
  const route = useRoute<Route>();
  const navigation = useNavigation<NavProp>();
  const { kind, id } = route.params;

  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [installation, setInstallation] = useState<Installation | null>(null);
  const [diagnostic, setDiagnostic] = useState<Diagnostic | null>(null);
  const [prevDiagnostic, setPrevDiagnostic] = useState<Diagnostic | null>(null);
  const [device, setDevice] = useState<Device | null>(null);
  const [photos, setPhotos] = useState<EvidencePhoto[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      try {
        if (kind === 'installation') {
          const inst = await installationsRepository.getById(id);
          if (inst && isMounted) {
            setInstallation(inst);
            const dev = await devicesRepository.getById(inst.deviceId);
            if (isMounted) setDevice(dev);
            const phs = await PhotoService.listByInstallation(inst.id);
            if (isMounted) setPhotos(phs);
          }
        } else {
          const diag = await diagnosticsRepository.getById(id);
          if (diag && isMounted) {
            setDiagnostic(diag);
            const dev = await devicesRepository.getById(diag.deviceId);
            if (isMounted) setDevice(dev);

            // Buscar diagnóstico anterior para cálculo de deltas
            if (diag.kind === 'snmp') {
              const prev = await diagnosticsRepository.getPreviousDiagnostic(
                diag.deviceId,
                diag.createdAt,
                'snmp'
              );
              if (isMounted) setPrevDiagnostic(prev);
            }
          }
        }
      } catch (err) {
        console.warn('Error loading history detail:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [kind, id]);

  const handleSharePdf = async () => {
    if (!installation) return;
    setSharing(true);
    try {
      let pdfPath = installation.pdfLocalPath;
      if (!pdfPath) {
        pdfPath = await ReportService.generate(installation.id);
        const reloaded = await installationsRepository.getById(installation.id);
        if (reloaded) setInstallation(reloaded);
      }
      await ReportService.share(pdfPath);
    } catch (err) {
      console.warn('Error sharing PDF:', err);
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return (
      <Screen title="Detalle del registro" subtitle="Cargando...">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
          <Text variant="body" color="textSecondary" style={{ marginTop: theme.spacing.md }}>
            Cargando información del registro...
          </Text>
        </View>
      </Screen>
    );
  }

  // VISTA DE INSTALACIÓN
  if (kind === 'installation' && installation) {
    return (
      <Screen
        title={installation.siteName || 'Instalación'}
        subtitle={`Registro del ${formatDate(installation.createdAt)}`}
        scrollable
      >
        {/* Cabecera de estado */}
        <Card style={{ marginBottom: theme.spacing.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text variant="heading" color="textPrimary">
                {installation.siteName || 'Sin nombre de sitio'}
              </Text>
              <Text variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
                Cliente: {installation.clientName || 'No especificado'}
              </Text>
            </View>
            <Badge
              status={installation.status === 'finalized' ? 'synced' : 'down'}
              label={installation.status === 'finalized' ? 'Finalizada' : 'Borrador'}
            />
          </View>

          <Divider style={{ marginVertical: theme.spacing.md }} />

          <View style={{ rowGap: 6 }}>
            <Text variant="caption" color="textSecondary">
              Técnico responsable: <Text variant="caption" color="textPrimary">{installation.technicianName || 'No indicado'}</Text>
            </Text>
            {installation.technicianNotes ? (
              <Text variant="caption" color="textSecondary">
                Observaciones: <Text variant="caption" color="textPrimary">{installation.technicianNotes}</Text>
              </Text>
            ) : null}
          </View>
        </Card>

        {/* Datos del dispositivo asociado */}
        {device ? (
          <Card title="Dispositivo asociado" style={{ marginBottom: theme.spacing.md }}>
            <View style={{ rowGap: 4 }}>
              <Text variant="caption" color="textSecondary">
                Dirección IP: <Text variant="caption" color="textPrimary" style={{ fontFamily: theme.typography.mono.fontFamily }}>{device.ipAddress}</Text>
              </Text>
              {device.macAddress ? (
                <Text variant="caption" color="textSecondary">
                  MAC: <Text variant="caption" color="textPrimary" style={{ fontFamily: theme.typography.mono.fontFamily }}>{device.macAddress}</Text>
                </Text>
              ) : null}
              {device.serialNumber ? (
                <Text variant="caption" color="textSecondary">
                  Serial Number: <Text variant="caption" color="textPrimary" style={{ fontFamily: theme.typography.mono.fontFamily }}>{device.serialNumber}</Text>
                </Text>
              ) : null}
              {device.vendor || device.model ? (
                <Text variant="caption" color="textSecondary">
                  Modelo: <Text variant="caption" color="textPrimary">{[device.vendor, device.model].filter(Boolean).join(' ')}</Text>
                </Text>
              ) : null}
            </View>
          </Card>
        ) : null}

        {/* Georreferenciación GPS */}
        <Card title="Georreferenciación GPS" style={{ marginBottom: theme.spacing.md }}>
          {installation.latitude && installation.longitude ? (
            <View style={{ rowGap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MapPin size={16} color={theme.colors.accent} style={{ marginRight: 6 }} />
                <Text variant="body" color="textPrimary" style={{ fontFamily: theme.typography.mono.fontFamily }}>
                  {installation.latitude.toFixed(6)}, {installation.longitude.toFixed(6)}
                </Text>
              </View>
              <Text variant="caption" color="textSecondary">
                Precisión estimada: ±{installation.accuracy ? Math.round(installation.accuracy) : 0} m
                {installation.altitude ? ` · Altitud: ${Math.round(installation.altitude)} m` : ''}
              </Text>
            </View>
          ) : (
            <Text variant="caption" color="textTertiary">
              No se registraron coordenadas GPS para esta instalación.
            </Text>
          )}
        </Card>

        {/* Galería de evidencias fotográficas */}
        <Card
          title={`Evidencias fotográficas (${photos.length})`}
          style={{ marginBottom: theme.spacing.md }}
        >
          {photos.length === 0 ? (
            <Text variant="caption" color="textTertiary">
              No se adjuntaron fotos a este registro.
            </Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
              {photos.map((p) => (
                <View key={p.id} style={{ marginHorizontal: 4, alignItems: 'center' }}>
                  <Image
                    source={{ uri: p.photoLocalUri }}
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: theme.radius.sm,
                      backgroundColor: theme.colors.surfaceAlt,
                    }}
                    resizeMode="cover"
                  />
                  <Text
                    variant="caption"
                    color="textSecondary"
                    style={{ marginTop: 4, fontSize: 10, textTransform: 'uppercase' }}
                  >
                    {p.photoType}
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}
        </Card>

        {/* Acciones de reporte */}
        <View style={{ marginTop: theme.spacing.sm, marginBottom: theme.spacing.xl, rowGap: theme.spacing.sm }}>
          <Button
            variant="primary"
            title={installation.pdfLocalPath ? 'Compartir reporte PDF' : 'Generar y compartir PDF'}
            icon={<Share2 size={18} color="#FFFFFF" />}
            loading={sharing}
            onPress={handleSharePdf}
            fullWidth
          />
          {installation.pdfLocalPath ? (
            <Button
              variant="secondary"
              title="Ver en previsualizador"
              icon={<FileText size={18} color={theme.colors.accent} />}
              onPress={() =>
                navigation.navigate('ReportPreview', {
                  installationId: installation.id,
                })
              }
              fullWidth
            />
          ) : null}
        </View>
      </Screen>
    );
  }

  // VISTA DE DIAGNÓSTICO
  if (kind === 'diagnostic' && diagnostic) {
    const isSnmp = diagnostic.kind === 'snmp';
    const interfaces: any[] = diagnostic.parsedInterfaces;
    const prevInterfaces: any[] = prevDiagnostic ? prevDiagnostic.parsedInterfaces : [];
    const prevMap = new Map<string, any>();
    prevInterfaces.forEach((pi) => {
      const key = String(pi.index ?? pi.descr);
      prevMap.set(key, pi);
    });

    return (
      <Screen
        title={isSnmp ? 'Telemetría SNMP' : 'Sesión SSH'}
        subtitle={`Ejecutado el ${formatDate(diagnostic.createdAt)}`}
        scrollable
      >
        {/* Cabecera general */}
        <Card style={{ marginBottom: theme.spacing.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text variant="heading" color="textPrimary">
                {isSnmp
                  ? diagnostic.snmpSysName || 'Equipo MIB-II'
                  : `SSH · ${diagnostic.sshProfile || 'Manual'}`}
              </Text>
              <Text variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
                Host: {device?.ipAddress || 'IP desconocida'}
              </Text>
            </View>
            <Badge
              status={diagnostic.success ? 'up' : 'down'}
              label={diagnostic.success ? 'Exitoso' : 'Fallo'}
            />
          </View>

          {isSnmp && diagnostic.snmpSysDescr ? (
            <>
              <Divider style={{ marginVertical: theme.spacing.md }} />
              <Text variant="caption" color="textSecondary">
                Descripción del sistema:
              </Text>
              <Text
                variant="caption"
                color="textPrimary"
                style={{ fontFamily: theme.typography.mono.fontFamily, marginTop: 2 }}
              >
                {diagnostic.snmpSysDescr}
              </Text>
            </>
          ) : null}

          {isSnmp && diagnostic.snmpUptimeTicks !== undefined ? (
            <View style={{ marginTop: theme.spacing.sm }}>
              <Text variant="caption" color="textSecondary">
                Tiempo de actividad (sysUpTime):{' '}
                <Text variant="caption" color="textPrimary">
                  {formatUptime(diagnostic.snmpUptimeTicks)}
                </Text>
              </Text>
            </View>
          ) : null}
        </Card>

        {/* DETALLE SNMP CON COMPARADOR DELTA */}
        {isSnmp ? (
          <>
            {prevDiagnostic ? (
              <Card
                style={{
                  marginBottom: theme.spacing.md,
                  borderColor: theme.colors.accent,
                  borderWidth: 1,
                  backgroundColor: theme.colors.surfaceAlt,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Calendar size={16} color={theme.colors.accent} style={{ marginRight: 6 }} />
                  <Text variant="caption" color="textPrimary" style={{ fontWeight: '600' }}>
                    Comparando contra diagnóstico previo del {formatDate(prevDiagnostic.createdAt)}
                  </Text>
                </View>
                <Text variant="caption" color="textSecondary" style={{ marginTop: 4 }}>
                  Los deltas de tráfico reflejan el incremento acumulado desde la lectura anterior.
                </Text>
              </Card>
            ) : (
              <Card style={{ marginBottom: theme.spacing.md }}>
                <Text variant="caption" color="textTertiary">
                  Primer diagnóstico registrado para este equipo. No hay lecturas previas para calcular deltas.
                </Text>
              </Card>
            )}

            <Card
              title={`Interfaces de Red (${interfaces.length})`}
              style={{ marginBottom: theme.spacing.xl }}
            >
              {interfaces.length === 0 ? (
                <Text variant="caption" color="textTertiary">
                  No se obtuvieron interfaces en este diagnóstico.
                </Text>
              ) : (
                interfaces.map((iface, index) => {
                  const key = String(iface.index ?? iface.descr);
                  const prev = prevMap.get(key);

                  const currIn = Number(iface.inOctets || 0);
                  const currOut = Number(iface.outOctets || 0);
                  const prevIn = prev ? Number(prev.inOctets || 0) : null;
                  const prevOut = prev ? Number(prev.outOctets || 0) : null;

                  const deltaIn = prevIn !== null ? currIn - prevIn : null;
                  const deltaOut = prevOut !== null ? currOut - prevOut : null;

                  const isUp = iface.operStatus === 1 || iface.operStatus === 'up';

                  return (
                    <View
                      key={index}
                      style={{
                        paddingVertical: theme.spacing.sm,
                        borderBottomWidth: index < interfaces.length - 1 ? 1 : 0,
                        borderBottomColor: theme.colors.border,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Text variant="body" color="textPrimary" style={{ fontWeight: '600' }}>
                          {iface.descr || `Interface #${iface.index || index + 1}`}
                        </Text>
                        <Badge
                          status={isUp ? 'up' : 'down'}
                          label={isUp ? 'UP' : 'DOWN'}
                        />
                      </View>

                      {/* Tráfico In / Out */}
                      <View style={{ marginTop: 6, rowGap: 4 }}>
                        {/* Entrada */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <ArrowDownLeft size={14} color={theme.colors.success} style={{ marginRight: 4 }} />
                            <Text variant="caption" color="textSecondary">
                              In: {formatBytes(currIn)}
                            </Text>
                          </View>
                          {deltaIn !== null ? (
                            <Text
                              variant="caption"
                              color={deltaIn >= 0 ? 'success' : 'warning'}
                              style={{ fontFamily: theme.typography.mono.fontFamily, fontSize: 11 }}
                            >
                              {deltaIn >= 0 ? `+${formatBytes(deltaIn)}` : '(Reinicio contador)'}
                            </Text>
                          ) : null}
                        </View>

                        {/* Salida */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <ArrowUpRight size={14} color={theme.colors.accent} style={{ marginRight: 4 }} />
                            <Text variant="caption" color="textSecondary">
                              Out: {formatBytes(currOut)}
                            </Text>
                          </View>
                          {deltaOut !== null ? (
                            <Text
                              variant="caption"
                              color={deltaOut >= 0 ? 'accent' : 'warning'}
                              style={{ fontFamily: theme.typography.mono.fontFamily, fontSize: 11 }}
                            >
                              {deltaOut >= 0 ? `+${formatBytes(deltaOut)}` : '(Reinicio contador)'}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </Card>
          </>
        ) : (
          /* DETALLE SSH CON TERMINAL */
          <View style={{ marginBottom: theme.spacing.xl }}>
            <TerminalView
              results={[
                {
                  command: diagnostic.sshProfile ? `Comandos perfil ${diagnostic.sshProfile}` : 'Diagnóstico SSH',
                  output: diagnostic.sshOutput || '(Sin salida de consola)',
                  durationMs: 0,
                  truncated: false,
                  error: diagnostic.success ? undefined : diagnostic.errorCode,
                },
              ]}
              isRunning={false}
            />
          </View>
        )}
      </Screen>
    );
  }

  return (
    <Screen title="Detalle del registro" subtitle="Registro no encontrado">
      <Card>
        <Text variant="body" color="textSecondary">
          No se encontró la información del registro solicitado.
        </Text>
      </Card>
    </Screen>
  );
}
