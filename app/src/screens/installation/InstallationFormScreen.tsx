import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Camera, MapPin, ScanLine, Check, CheckSquare, Square, Trash2 } from 'lucide-react-native';
import type { RootStackParamList } from '../../navigation/types';
import { Screen, Text, Input, Button, Card, ListRow, Badge, useToast } from '../../components/ui';
import { useTheme } from '../../theme/useTheme';
import { installationsRepository } from '../../db/repositories/installations';
import { devicesRepository } from '../../db/repositories/devices';
import { diagnosticsRepository } from '../../db/repositories/diagnostics';
import { outboxRepository } from '../../db/repositories/outbox';
import { database } from '../../db';
import { Installation } from '../../db/models/Installation';
import { Device } from '../../db/models/Device';
import { Diagnostic } from '../../db/models/Diagnostic';
import { EvidencePhoto } from '../../db/models/EvidencePhoto';
import { PhotoService } from '../../services/evidence/PhotoService';
import { LocationService, LocationFix } from '../../services/evidence/LocationService';
import { ReportService } from '../../services/report/ReportService';
import { logger } from '../../utils/logger';

type Route = RouteProp<RootStackParamList, 'InstallationForm'>;
type NavProp = NativeStackNavigationProp<RootStackParamList>;

export function InstallationFormScreen() {
  const theme = useTheme();
  const route = useRoute<Route>();
  const navigation = useNavigation<NavProp>();
  const { deviceId, installationId: initialInstallationId } = route.params;
  const { showToast } = useToast();

  const [installationId, setInstallationId] = useState<string | null>(initialInstallationId || null);
  const [installation, setInstallation] = useState<Installation | null>(null);
  const [device, setDevice] = useState<Device | null>(null);
  const [availableDiagnostics, setAvailableDiagnostics] = useState<Diagnostic[]>([]);
  const [selectedDiagIds, setSelectedDiagIds] = useState<string[]>([]);
  const [photos, setPhotos] = useState<EvidencePhoto[]>([]);

  // Campos de formulario
  const [siteName, setSiteName] = useState('');
  const [clientName, setClientName] = useState('');
  const [technicianName, setTechnicianName] = useState('Técnico de Campo');
  const [technicianNotes, setTechnicianNotes] = useState('');
  const [locationFix, setLocationFix] = useState<LocationFix | null>(null);

  // Estados de interfaz
  const [isLocating, setIsLocating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState<{ siteName?: string; clientName?: string; technicianName?: string }>({});

  // 1. Inicializar o cargar borrador de instalación
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        let inst: Installation | null = null;
        if (initialInstallationId) {
          inst = await installationsRepository.getById(initialInstallationId);
        }

        if (!inst) {
          // Crear borrador inicial si no existe
          inst = await installationsRepository.createDraft({ deviceId });
        }

        const dev = await devicesRepository.getById(deviceId);
        const diags = await diagnosticsRepository.listByDevice(deviceId);

        if (mounted) {
          setInstallationId(inst.id);
          setInstallation(inst);
          setDevice(dev);
          setAvailableDiagnostics(diags);

          // Cargar datos previos si existen
          if (inst.siteName) setSiteName(inst.siteName);
          if (inst.clientName) setClientName(inst.clientName);
          if (inst.technicianName) setTechnicianName(inst.technicianName);
          if (inst.technicianNotes) setTechnicianNotes(inst.technicianNotes);
          if (inst.latitude && inst.longitude) {
            setLocationFix({
              latitude: inst.latitude,
              longitude: inst.longitude,
              accuracy: inst.accuracy || 10,
              timestamp: Date.now(),
            });
          }

          // Diagnósticos preseleccionados
          if (inst.diagnosticIdsJson) {
            try {
              setSelectedDiagIds(JSON.parse(inst.diagnosticIdsJson));
            } catch {
              setSelectedDiagIds(diags.map((d) => d.id));
            }
          } else {
            // Seleccionar los más recientes por defecto
            setSelectedDiagIds(diags.map((d) => d.id));
          }
        }
      } catch (e) {
        logger.error('Error al inicializar InstallationFormScreen:', e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [deviceId, initialInstallationId]);

  // 2. Refrescar fotos y datos del equipo cada vez que la pantalla gana foco (ej: al volver de Camera o CodeScanner)
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        if (installationId) {
          try {
            const [photoList, updatedDev] = await Promise.all([
              PhotoService.listByInstallation(installationId),
              devicesRepository.getById(deviceId),
            ]);
            if (active) {
              setPhotos(photoList);
              if (updatedDev) setDevice(updatedDev);
            }
          } catch (e) {
            logger.warn('Error al actualizar fotos o equipo en foco:', e);
          }
        }
      })();

      return () => {
        active = false;
      };
    }, [installationId, deviceId])
  );

  // 3. Autoguardado automático en la BD de cambios en borrador
  const saveDraft = useCallback(
    async (patch: Partial<{ siteName: string; clientName: string; technicianName: string; technicianNotes: string }>) => {
      if (!installationId) return;
      try {
        await installationsRepository.update(installationId, {
          siteName: patch.siteName !== undefined ? patch.siteName : siteName,
          clientName: patch.clientName !== undefined ? patch.clientName : clientName,
          technicianName: patch.technicianName !== undefined ? patch.technicianName : technicianName,
          technicianNotes: patch.technicianNotes !== undefined ? patch.technicianNotes : technicianNotes,
        });
      } catch (err) {
        logger.warn('Error al autoguardar borrador:', err);
      }
    },
    [installationId, siteName, clientName, technicianName, technicianNotes]
  );

  const handleGetLocation = async () => {
    setIsLocating(true);
    try {
      const fix = await LocationService.getCurrentFix();
      setLocationFix(fix);

      if (installationId) {
        await installationsRepository.update(installationId, {
          latitude: fix.latitude,
          longitude: fix.longitude,
          accuracy: fix.accuracy,
        });
      }

      showToast(fix.lowAccuracy ? 'GPS obtenido con baja precisión' : 'Ubicación GPS fijada exitosamente');
    } catch (err: any) {
      showToast(err?.message || 'Error al obtener coordenadas GPS');
    } finally {
      setIsLocating(false);
    }
  };

  const toggleDiagnostic = async (diagId: string) => {
    const updated = selectedDiagIds.includes(diagId)
      ? selectedDiagIds.filter((id) => id !== diagId)
      : [...selectedDiagIds, diagId];

    setSelectedDiagIds(updated);
    if (installationId) {
      await installationsRepository.update(installationId, {
        diagnosticIds: updated,
      });
    }
  };

  const handleDeletePhoto = (photoId: string) => {
    Alert.alert('Eliminar fotografía', '¿Deseas eliminar esta foto de evidencia?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await PhotoService.delete(photoId);
          if (installationId) {
            const list = await PhotoService.listByInstallation(installationId);
            setPhotos(list);
          }
        },
      },
    ]);
  };

  const handleFinalize = async () => {
    if (!installationId) return;

    // Validación de campos obligatorios
    const newErrors: { siteName?: string; clientName?: string; technicianName?: string } = {};
    if (!siteName.trim() || siteName.trim().length < 2) {
      newErrors.siteName = 'El nombre del sitio es obligatorio (mínimo 2 letras).';
    }
    if (!clientName.trim() || clientName.trim().length < 2) {
      newErrors.clientName = 'El nombre del cliente es obligatorio (mínimo 2 letras).';
    }
    if (!technicianName.trim() || technicianName.trim().length < 2) {
      newErrors.technicianName = 'El nombre del técnico es obligatorio.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('Completa los campos obligatorios del sitio y cliente');
      return;
    }

    if (photos.length === 0) {
      showToast('Se requiere al menos 1 fotografía de evidencia para finalizar.');
      return;
    }

    if (!locationFix) {
      showToast('Se requiere registrar la georreferenciación GPS para certificar.');
      return;
    }

    setIsGenerating(true);
    try {
      // 1. Guardar datos finales del formulario
      await installationsRepository.update(installationId, {
        siteName: siteName.trim(),
        clientName: clientName.trim(),
        technicianName: technicianName.trim(),
        technicianNotes: technicianNotes.trim(),
        latitude: locationFix.latitude,
        longitude: locationFix.longitude,
        accuracy: locationFix.accuracy,
        diagnosticIds: selectedDiagIds,
      });

      // 2. Compilar PDF completo
      const pdfPath = await ReportService.generate(installationId);

      // 3. Finalizar y encolar en Outbox de forma atómica
      await database.write(async () => {
        const inst = await database.get<Installation>('installations').find(installationId);
        await inst.update((record) => {
          record.status = 'finalized';
          record.pdfLocalPath = pdfPath;
        });

        await outboxRepository.enqueue(
          'INSTALLATION',
          installationId,
          {
            installationId,
            deviceId,
            siteName: siteName.trim(),
            clientName: clientName.trim(),
            technicianName: technicianName.trim(),
            latitude: locationFix.latitude,
            longitude: locationFix.longitude,
            accuracy: locationFix.accuracy,
            diagnosticIds: selectedDiagIds,
            pdfLocalPath: pdfPath,
            status: 'finalized',
          }
        );
      });

      showToast('Reporte generado y certificado con éxito');
      navigation.navigate('ReportPreview', { installationId });
    } catch (err: any) {
      showToast(err?.message || 'Error al compilar reporte PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Screen
      title="Certificación de Instalación"
      subtitle={installation ? `ID: ${installation.id.slice(0, 8).toUpperCase()}` : 'Borrador'}
      scrollable
    >
      {/* 1. Sitio y cliente */}
      <Card title="Sitio y cliente" style={{ marginBottom: theme.spacing.lg }}>
        <Input
          label="Nombre del sitio / nodo *"
          placeholder="Torre Central - Nodo 04"
          value={siteName}
          onChangeText={(val) => {
            setSiteName(val);
            saveDraft({ siteName: val });
          }}
          error={errors.siteName}
        />
        <Input
          label="Cliente / Operador *"
          placeholder="Telecom / ISP Fibra"
          value={clientName}
          onChangeText={(val) => {
            setClientName(val);
            saveDraft({ clientName: val });
          }}
          error={errors.clientName}
        />
        <Input
          label="Técnico de campo responsable *"
          placeholder="Juan Pérez"
          value={technicianName}
          onChangeText={(val) => {
            setTechnicianName(val);
            saveDraft({ technicianName: val });
          }}
          error={errors.technicianName}
        />
      </Card>

      {/* 2. Equipo asociado */}
      <Card title="Equipo asociado" style={{ marginBottom: theme.spacing.lg }}>
        <ListRow
          title={device?.ipAddress || '192.168.1.1'}
          subtitle={`MAC: ${device?.macAddress || 'No asignada'} · S/N: ${device?.serialNumber || 'No asignado'}`}
          monoTitle
          rightContent={
            <Button
              variant="secondary"
              title="Escanear"
              icon={<ScanLine size={16} color={theme.colors.textPrimary} />}
              onPress={() => navigation.navigate('CodeScanner', { deviceId })}
            />
          }
        />
      </Card>

      {/* 3. Evidencias fotográficas */}
      <Card title={`Evidencias fotográficas (${photos.length}/12) *`} style={{ marginBottom: theme.spacing.lg }}>
        <Text variant="caption" color="textSecondary" style={{ marginBottom: theme.spacing.md }}>
          Capturá fotos del rack, potencia óptica o etiqueta serial (mínimo 1 requerida).
        </Text>

        {photos.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: theme.spacing.md }}>
            {photos.map((p) => (
              <View key={p.id} style={styles.photoThumbContainer}>
                <Image source={{ uri: `file://${p.photoLocalUri}` }} style={styles.photoThumb} />
                <View style={styles.photoThumbLabel}>
                  <Text variant="caption" style={{ color: '#FFFFFF', fontSize: 10 }}>
                    {p.photoType}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deletePhotoButton}
                  onPress={() => handleDeletePhoto(p.id)}
                  hitSlop={8}
                >
                  <Trash2 size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {installationId && (
          <Button
            variant="secondary"
            title="Tomar fotos con cámara"
            icon={<Camera size={18} color={theme.colors.textPrimary} />}
            fullWidth
            onPress={() => navigation.navigate('Camera', { installationId })}
          />
        )}
      </Card>

      {/* 4. Georreferenciación GPS */}
      <Card title="Georreferenciación GPS *" style={{ marginBottom: theme.spacing.lg }}>
        {locationFix ? (
          <View style={[styles.fixBox, { backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.md }]}>
            <View>
              <Text variant="label" color="textSecondary">
                COORDENADAS FIJADAS
              </Text>
              <Text variant="bodyStrong" color="textPrimary" style={{ fontFamily: theme.typography.mono.fontFamily }}>
                {locationFix.latitude.toFixed(6)}, {locationFix.longitude.toFixed(6)}
              </Text>
              <Text variant="caption" color="textSecondary">
                Precisión estimada: ±{locationFix.accuracy.toFixed(1)}m
              </Text>
            </View>
            <Badge status={locationFix.lowAccuracy ? 'pending' : 'up'} label={locationFix.lowAccuracy ? 'Baja' : 'Óptima'} />
          </View>
        ) : (
          <Text variant="caption" color="textSecondary" style={{ marginBottom: theme.spacing.md }}>
            Lectura obligatoria para certificar la posición del nodo.
          </Text>
        )}

        <Button
          variant={locationFix ? 'secondary' : 'primary'}
          title={isLocating ? 'Obteniendo GPS...' : locationFix ? 'Actualizar coordenadas' : 'Fijar ubicación GPS'}
          disabled={isLocating}
          loading={isLocating}
          icon={<MapPin size={18} color={theme.colors.textPrimary} />}
          fullWidth
          onPress={handleGetLocation}
        />
      </Card>

      {/* 5. Diagnósticos vinculados */}
      {availableDiagnostics.length > 0 && (
        <Card title="Diagnósticos a certificar en reporte" style={{ marginBottom: theme.spacing.lg }}>
          <Text variant="caption" color="textSecondary" style={{ marginBottom: theme.spacing.md }}>
            Selecciona las pruebas técnicas ejecutadas en este equipo que deben aparecer en el PDF:
          </Text>
          {availableDiagnostics.map((d) => {
            const isChecked = selectedDiagIds.includes(d.id);
            return (
              <TouchableOpacity
                key={d.id}
                onPress={() => toggleDiagnostic(d.id)}
                style={[styles.diagRow, { borderBottomColor: theme.colors.border }]}
                activeOpacity={0.7}
              >
                {isChecked ? (
                  <CheckSquare size={20} color={theme.colors.accent} />
                ) : (
                  <Square size={20} color={theme.colors.textSecondary} />
                )}
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text variant="bodyStrong" color="textPrimary">
                    {d.kind === 'snmp' ? 'Telemetría SNMP (MIB-II)' : `Diagnóstico SSH (${d.sshProfile || 'General'})`}
                  </Text>
                  <Text variant="caption" color="textSecondary">
                    {d.createdAt ? new Date(d.createdAt).toLocaleTimeString() : ''} · {d.success ? 'Exitoso' : 'Con errores'}
                  </Text>
                </View>
                <Badge status={d.success ? 'up' : 'failed'} />
              </TouchableOpacity>
            );
          })}
        </Card>
      )}

      {/* 6. Observaciones técnicas */}
      <Card title="Observaciones técnicas adicionales" style={{ marginBottom: theme.spacing.xl }}>
        <Input
          placeholder="Notas de instalación, potencia óptica de recepción (ej: -18.5 dBm), número de precinto, conectores..."
          value={technicianNotes}
          onChangeText={(val) => {
            setTechnicianNotes(val);
            saveDraft({ technicianNotes: val });
          }}
          multiline
          numberOfLines={4}
          style={{ height: 96, textAlignVertical: 'top' }}
        />
      </Card>

      {/* 7. Botón final de generación de reporte */}
      <Button
        variant="primary"
        title={isGenerating ? 'Compilando reporte PDF...' : 'Finalizar y generar PDF'}
        loading={isGenerating}
        disabled={isGenerating}
        fullWidth
        onPress={handleFinalize}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  photoThumbContainer: {
    marginRight: 12,
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    width: 80,
    height: 80,
  },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  photoThumbLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingVertical: 2,
    alignItems: 'center',
  },
  deletePhotoButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(198, 40, 40, 0.8)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fixBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
  },
  diagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
